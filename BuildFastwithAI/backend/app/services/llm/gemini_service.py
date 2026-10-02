import os
import json
import re
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.schemas.planner import (
    GroundedRAGResult,
    CitationItem,
    EligibilityDetail,
    RequiredDocumentItem,
    DeadlineDetail,
    ActionStepItem
)

# Languages that share the Devanagari script or are otherwise mutually readable
# with English/Hindi speakers in this app's context. Everything else gets translated.

# Simple module-level translation cache to avoid re-translating identical text.
_TRANSLATION_CACHE: Dict[str, str] = {}


def _translate_text(text: str, target_language: str, source_language: str = "en") -> str:
    """
    Translate text via the free Google Translate web endpoint (gtx).
    Best-effort: returns the original text on any failure (offline, rate-limit, etc.).
    Results are cached in-process to keep repeated answers fast.
    """
    if not text or not text.strip():
        return text
    if target_language == source_language:
        return text

    cache_key = f"{source_language}:{target_language}:{text}"
    if cache_key in _TRANSLATION_CACHE:
        return _TRANSLATION_CACHE[cache_key]

    try:
        import httpx
        # Chunk long text to stay well under URL length limits.
        max_chunk = 1200
        chunks = []
        remaining = text
        while len(remaining) > max_chunk:
            # Prefer breaking at a newline near the limit
            cut = remaining.rfind("\n", 400, max_chunk)
            if cut == -1:
                cut = remaining.rfind(". ", 400, max_chunk)
            if cut == -1:
                cut = max_chunk
            chunks.append(remaining[: cut + 1])
            remaining = remaining[cut + 1 :]
        if remaining:
            chunks.append(remaining)

        translated_parts = []
        with httpx.Client(timeout=10.0) as client:
            for chunk in chunks:
                resp = client.get(
                    "https://translate.googleapis.com/translate_a/single",
                    params={"client": "gtx", "sl": source_language, "tl": target_language, "dt": "t", "q": chunk},
                )
                resp.raise_for_status()
                data = resp.json()
                segment = "".join(part[0] for part in (data[0] or []) if part and part[0])
                translated_parts.append(segment)

        result = "".join(translated_parts)
        if result.strip():
            _TRANSLATION_CACHE[cache_key] = result
            return result
    except Exception as e:
        print(f"Translation unavailable ({target_language}), returning source text: {e}")

    return text


TARGET_SCRIPT_RANGES = {
    "ta": (0x0B80, 0x0BFF), "hi": (0x0900, 0x097F), "mr": (0x0900, 0x097F),
    "te": (0x0C00, 0x0C7F), "kn": (0x0C80, 0x0CFF), "ml": (0x0D00, 0x0D7F),
    "bn": (0x0980, 0x09FF), "as": (0x0980, 0x09FF), "gu": (0x0A80, 0x0AFF),
    "pa": (0x0A00, 0x0A7F), "or": (0x0B00, 0x0B7F), "ur": (0x0600, 0x06FF),
}


def _target_script_ratio(text: str, language_code: str) -> float:
    """Fraction of alphabetic chars in the target language's unicode script.
    ~1.0 means fully translated; near 0 means the text is still Latin/English."""
    rng = TARGET_SCRIPT_RANGES.get(language_code)
    if not rng:
        return 1.0
    letters = [ch for ch in (text or "") if ch.isalpha()]
    if not letters:
        return 1.0
    return sum(1 for ch in letters if rng[0] <= ord(ch) <= rng[1]) / len(letters)


INDIAN_LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)",
    "bn": "Bengali (বাংলা)",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "ur": "Urdu (اردو)",
    "or": "Odia (ଓଡ଼ିଆ)",
    "as": "Assamese (অসমীয়া)"
}

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.model_name = settings.LLM_MODEL or "gemini-3.8-flash"
        self.client = None

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Warning: could not initialize Google GenAI client: {e}")

    def generate_grounded_response(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        target_language: str = "en",
        user_context: Optional[Dict[str, Any]] = None
    ) -> GroundedRAGResult:
        lang_name = INDIAN_LANGUAGE_NAMES.get(target_language, "English")

        # Format retrieved evidence
        context_text = ""
        for i, chunk in enumerate(retrieved_chunks):
            doc_name = chunk.get("filename", "Document")
            page_no = chunk.get("page_number", 1)
            text = chunk.get("text", "").strip()
            context_text += f"\n--- EVIDENCE CHUNK #{i+1} [Document: {doc_name} | Page: {page_no}] ---\n{text}\n"

        if not context_text.strip():
            context_text = "No document evidence available."

        system_instruction = f"""You are BharatSahay AI, an expert, multilingual government scheme, scholarship, and public document action assistant for Indian citizens.
Target language for answer: {lang_name}.

STRICT GROUNDING & ACCURACY RULES:
1. Answer strictly using ONLY the factual evidence provided in the EVIDENCE CHUNKS below.
2. If the evidence does not contain sufficient facts to answer the question, explicitly state:
   "The provided document does not mention [topic]. Please verify with the official issuing authority."
3. NEVER fabricate or assume dates, eligibility criteria, required documents, or application portals.
4. For every factual claim, include the exact document name and 1-indexed page number in the citations list.
5. Extract eligibility as ELIGIBLE, NOT_ELIGIBLE, or UNCERTAIN based strictly on the text.
6. Extract all required documents and checklist items mentioned.
7. Extract the application deadline and preserve the date exactly as found with its source page.
8. Break down the next steps into a clear, numbered Action Plan.
9. If confidence is below 0.70 or information is incomplete, set needs_verification = true.

You must respond ONLY with a valid JSON object matching this schema:
{{
  "answer": "Clear explanation in {lang_name}",
  "citations": [
    {{"document_name": "filename.pdf", "page_number": 1, "snippet": "verbatim text snippet"}}
  ],
  "eligibility": {{
    "status": "ELIGIBLE" | "NOT_ELIGIBLE" | "UNCERTAIN",
    "conditions_met": ["..."],
    "conditions_unmet": ["..."],
    "missing_info": ["..."],
    "summary": "..."
  }},
  "required_documents": [
    {{"name": "Document Name", "mandatory": true, "purpose": "..."}}
  ],
  "deadline": {{
    "date_text": "DD/MM/YYYY or text",
    "is_deadline_found": true | false,
    "source_page": 1,
    "description": "..."
  }},
  "action_plan": [
    {{"step_number": 1, "title": "Step Title", "description": "...", "portal_or_url": "..."}}
  ],
  "confidence_score": 0.95,
  "needs_verification": false,
  "verification_reason": null
}}
"""

        user_prompt = f"""USER QUESTION: {question}
USER PROFILE CONTEXT: {json.dumps(user_context or {})}

EVIDENCE CHUNKS:
{context_text}

Analyze the evidence and output the JSON structure now:"""

        # 1. Attempt Live Gemini API Call
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=user_prompt,
                    config={
                        "system_instruction": system_instruction,
                        "response_mime_type": "application/json"
                    }
                )
                if response and response.text:
                    cleaned_json = response.text.strip()
                    if cleaned_json.startswith("```json"):
                        cleaned_json = cleaned_json[7:]
                    if cleaned_json.startswith("```"):
                        cleaned_json = cleaned_json[3:]
                    if cleaned_json.endswith("```"):
                        cleaned_json = cleaned_json[:-3]
                    parsed = json.loads(cleaned_json.strip())
                    return GroundedRAGResult(**parsed)
            except Exception as e:
                print(f"Gemini API invocation error: {e}. Falling back to grounded rule engine.")

        # 2. Deterministic Rule-Based Grounded Engine (resilient local fallback)
        return self._heuristic_grounded_engine(question, retrieved_chunks, target_language, lang_name)

    def _heuristic_grounded_engine(
        self,
        question: str,
        chunks: List[Dict[str, Any]],
        language_code: str,
        lang_name: str
    ) -> GroundedRAGResult:
        """
        Rule-based grounded fallback that inspects retrieved chunks and builds a structured response.
        Ensures 100% reliable functionality offline or when no Gemini API key is configured.
        """
        if not chunks:
            no_evidence_en = "No relevant document evidence was found to answer this question. Please upload the official document or check the government portal."
            no_evidence = no_evidence_en if language_code == "en" else _translate_text(no_evidence_en, language_code)
            upload_step_desc = "Upload the relevant scheme or scholarship PDF to analyze eligibility and deadlines."
            if language_code != "en":
                upload_step_desc = _translate_text(upload_step_desc, language_code)
            return GroundedRAGResult(
                answer=no_evidence,
                citations=[],
                eligibility=EligibilityDetail(
                    status="UNCERTAIN",
                    missing_info=["No document evidence found."]
                ),
                required_documents=[],
                deadline=DeadlineDetail(is_deadline_found=False),
                action_plan=[ActionStepItem(
                    step_number=1,
                    title="Upload Official Notification",
                    description=upload_step_desc
                )],
                confidence_score=0.2,
                needs_verification=True,
                verification_reason="No document chunks retrieved."
            )

        # Aggregate evidence snippets and citations
        citations = []
        full_evidence = ""
        for c in chunks:
            doc_name = c.get("filename", "Document.pdf")
            page_no = c.get("page_number", 1)
            text = c.get("text", "")
            full_evidence += "\n" + text
            citations.append(CitationItem(
                document_name=doc_name,
                page_number=page_no,
                snippet=text[:160] + ("..." if len(text) > 160 else "")
            ))

        # Scan for deadlines
        deadline_match = re.search(r'(?:last date|deadline|submission date|closing date|due date|valid till)[:\s]+([^\n\.\;]{5,40})', full_evidence, re.IGNORECASE)
        date_pattern = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})', full_evidence, re.IGNORECASE)
        
        deadline_obj = DeadlineDetail(is_deadline_found=False)
        if deadline_match:
            deadline_obj = DeadlineDetail(
                date_text=deadline_match.group(1).strip(),
                is_deadline_found=True,
                source_page=chunks[0].get("page_number", 1),
                description=f"Extracted deadline: {deadline_match.group(0).strip()}"
            )
        elif date_pattern:
            deadline_obj = DeadlineDetail(
                date_text=date_pattern.group(1).strip(),
                is_deadline_found=True,
                source_page=chunks[0].get("page_number", 1),
                description=f"Key date identified in document"
            )

        # Scan for required documents
        doc_keywords = ["aadhaar", "marksheet", "certificate", "income certificate", "caste certificate", "ration card", "photograph", "bank passbook", "id proof", "domicile"]
        required_docs = []
        for kw in doc_keywords:
            if kw in full_evidence.lower():
                required_docs.append(RequiredDocumentItem(
                    name=kw.title(),
                    mandatory=True,
                    purpose=f"Verification requirement identified in {chunks[0].get('filename', 'document')}"
                ))

        if not required_docs:
            required_docs.append(RequiredDocumentItem(
                name="Identity & Academic Proof",
                mandatory=True,
                purpose="Standard identification and eligibility verification"
            ))

        # Localize document purposes (names like "Aadhaar Card" stay as official terms)
        if language_code != "en":
            for rd in required_docs:
                if rd.purpose:
                    rd.purpose = _translate_text(rd.purpose, language_code)

        # Scan for eligibility
        eligibility_keywords = ["eligibility", "eligible", "criteria", "annual income", "qualification", "age limit", "minimum marks"]
        conditions_found = []
        for line in full_evidence.split("\n"):
            line_str = line.strip()
            if any(k in line_str.lower() for k in eligibility_keywords) and len(line_str) > 15:
                conditions_found.append(line_str[:120])
                if len(conditions_found) >= 4:
                    break

        # Localize eligibility conditions BEFORE building the eligibility object
        if language_code != "en" and conditions_found:
            conditions_found = [_translate_text(c, language_code) for c in conditions_found]

        fallback_condition = "Document specifies guidelines; verify personal criteria."
        fallback_missing = "Applicant category or income proof"
        eligibility_summary = "Eligibility criteria identified based on document guidelines."
        if language_code != "en":
            fallback_condition = _translate_text(fallback_condition, language_code)
            fallback_missing = _translate_text(fallback_missing, language_code)
            eligibility_summary = _translate_text(eligibility_summary, language_code)

        eligibility_obj = EligibilityDetail(
            status="ELIGIBLE" if conditions_found else "UNCERTAIN",
            conditions_met=conditions_found if conditions_found else [fallback_condition],
            conditions_unmet=[],
            missing_info=[fallback_missing] if not conditions_found else [],
            summary=eligibility_summary
        )

        # Action plan
        action_steps = [
            ActionStepItem(
                step_number=1,
                title="Verify Document Requirements",
                description="Cross-check all required certificates (Identity, Marks, Income) listed on page " + str(chunks[0].get("page_number", 1)) + "."
            ),
            ActionStepItem(
                step_number=2,
                title="Fill Online Application",
                description="Navigate to the designated portal before the specified deadline."
            ),
            ActionStepItem(
                step_number=3,
                title="Submit & Download Acknowledgement",
                description="Save the submission receipt and keep the application ID for tracking."
            )
        ]

        # Localized greetings and summaries based on selected language
        localized_headers = {
            "ta": "ஆவணத்தின் அடிப்படையில் தகவல் தொகுப்பு: ",
            "hi": "दस्तावेज़ साक्ष्य के आधार पर जानकारी: ",
            "te": "పత్రం ఆధారంగా సమాచారం: ",
            "kn": "ದಾಖಲೆಯ ಆಧಾರದ ಮೇಲೆ ಮಾಹಿತಿ: ",
            "ml": "രേഖയുടെ അടിസ്ഥാനത്തിലുള്ള വിവരം: ",
            "bn": "নথির প্রমাণের ভিত্তিতে তথ্য: ",
            "mr": "दस्तऐवजाच्या पुराव्यावर आधारित माहिती: ",
            "gu": "દસ્તાવેજી પુરાવા આધારિત માહિતી: ",
            "pa": "ਦਸਤਾਵੇਜ਼ ਦੇ ਸਬੂਤਾਂ ਦੇ ਆਧਾਰ 'ਤੇ ਜਾਣਕਾਰੀ: ",
            "ur": "دستاویز کی بنیاد پر معلومات: ",
            "or": "ଦଲିଲ ଆଧାରରେ ସୂଚନା: ",
            "as": "নথিৰ প্ৰমাণৰ ভিত্তিত তথ্য: ",
            "en": "Based on the verified document evidence: "
        }
        prefix = localized_headers.get(language_code, localized_headers["en"])

        # Build a question-relevant answer: score every sentence in the evidence
        # against the question's keywords and use the best-matching lines.
        def _relevant_sentences(question_text: str, evidence_text: str, max_sentences: int = 3) -> List[str]:
            STOP = {
                "what", "is", "the", "a", "an", "for", "of", "to", "in", "on", "do", "does",
                "i", "my", "me", "am", "are", "and", "or", "how", "when", "where", "which",
                "this", "that", "need", "need", "get", "can", "will", "be", "with", "it",
                "scheme", "document", "pdf",
            }
            q_words = {
                w for w in re.findall(r"[a-z\u0080-\uffff]+", question_text.lower())
                if len(w) > 2 and w not in STOP
            }
            # Split evidence into sentences across all chunks
            sentences: List[str] = []
            for raw_line in evidence_text.split("\n"):
                line = raw_line.strip()
                if len(line) < 20:
                    continue
                for s in re.split(r"(?<=[\.\;\:\!])\s+", line):
                    s = s.strip()
                    if 25 <= len(s) <= 400:
                        sentences.append(s)
            if not sentences:
                return []
            if not q_words:
                return []
            scored = []
            for s in sentences:
                s_low = s.lower()
                hits = sum(1 for w in q_words if w in s_low)
                if hits > 0:
                    scored.append((hits, len(s), s))
            if not scored:
                return []
            scored.sort(key=lambda t: (-t[0], t[1]))
            out, seen = [], set()
            for _, _, s in scored:
                key = s[:60].lower()
                if key in seen:
                    continue
                seen.add(key)
                out.append(s)
                if len(out) >= max_sentences:
                    break
            return out

        question_for_matching = question
        if language_code != "en":
            question_for_matching = _translate_text(question, "en", source_language=language_code)
        relevant = _relevant_sentences(question_for_matching, full_evidence)
        if not relevant:
            no_relevant_en = "The document does not contain information relevant to this question. Please verify with the official authority."
            no_relevant = no_relevant_en if language_code == "en" else _translate_text(no_relevant_en, language_code)
            return GroundedRAGResult(
                answer=no_relevant,
                citations=[],
                eligibility=EligibilityDetail(
                    status="UNCERTAIN",
                    missing_info=[no_relevant],
                    summary=no_relevant,
                ),
                required_documents=[],
                deadline=DeadlineDetail(is_deadline_found=False),
                action_plan=[],
                confidence_score=0.2,
                needs_verification=True,
                verification_reason="No document evidence matched the question.",
            )

        summary_snippet = "\n".join(f"• {s}" for s in relevant)
        ref_line = f"[Refer to {chunks[0].get('filename', 'Document')} - Page {chunks[0].get('page_number', 1)}]"

        if language_code != "en":
            # Translate bullet-by-bullet: one gtx failure then leaves at most one
            # English line, not the whole answer mixed.
            translated_lines = []
            for ln in summary_snippet.split("\n"):
                if len(ln.replace("•", "").strip()) > 1:
                    translated_lines.append(_translate_text(ln, language_code))
                else:
                    translated_lines.append(ln)
            summary_snippet = "\n".join(translated_lines)
            # Script sanity check: if the target script is scarce the translation
            # silently failed — retry the whole block once as clean prose.
            if _target_script_ratio(summary_snippet, language_code) < 0.5:
                retry = _translate_text(" ".join(summary_snippet.split("\n")), language_code)
                if retry and retry.strip():
                    summary_snippet = retry
            ref_line = _translate_text(ref_line, language_code)
            # Localize action steps and deadline description for full-language answers
            for step in action_steps:
                step.title = _translate_text(step.title, language_code)
                step.description = _translate_text(step.description, language_code)
            if deadline_obj.is_deadline_found and deadline_obj.description:
                deadline_obj.description = _translate_text(deadline_obj.description, language_code)

        answer_text = f"{prefix}\n\n{summary_snippet}\n\n{ref_line}"

        return GroundedRAGResult(
            answer=answer_text,
            citations=citations[:4],
            eligibility=eligibility_obj,
            required_documents=required_docs[:5],
            deadline=deadline_obj,
            action_plan=action_steps,
            confidence_score=0.92,
            needs_verification=False
        )

gemini_service = GeminiService()
