import json
import re
import uuid
from typing import List, Optional
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.models.chat import Conversation, Message, Citation
from app.models.planner import EligibilityCheck, ActionPlan, Feedback
from app.schemas.chat import (
    ChatRequest,
    MessageResponse,
    CitationResponse,
    ConversationResponse,
    ConversationSummaryResponse,
    EligibilityResponse,
    ActionPlanResponse
)
from app.schemas.planner import FeedbackRequest, FeedbackResponse, ActionStepItem, RequiredDocumentItem, DeadlineDetail
from app.api.deps import get_current_user
from app.services.retrieval.vector_store import VectorStoreService
from app.services.llm.gemini_service import gemini_service
from app.services.tts_service import tts_service
from app.services.llm.gemini_service import INDIAN_LANGUAGE_NAMES, _translate_text
from app.services.local_stt_service import local_stt_service
from fastapi import Response

router = APIRouter(prefix="/chat", tags=["Chat & RAG"])

@router.post("", response_model=MessageResponse)
async def chat_interaction(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Resolve or create Conversation
    conversation = None
    if request.conversation_id:
        conv_result = await db.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id
            )
        )
        conversation = conv_result.scalars().first()
    
    # Resolve effective document ID from request or conversation
    effective_doc_id = request.document_id or (conversation.document_id if conversation else None)

    if not conversation:
        title = request.question[:50].strip() or "New Scheme Inquiry"
        conversation = Conversation(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            document_id=effective_doc_id,
            title=title
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
    elif request.document_id and conversation.document_id != request.document_id:
        conversation.document_id = request.document_id
        await db.commit()

    # Verify if effective_doc_id actually exists in DB
    target_doc = None
    valid_doc_id = None
    if effective_doc_id:
        doc_res = await db.execute(
            select(Document).where(
                Document.id == effective_doc_id,
                Document.user_id == current_user.id
            )
        )
        target_doc = doc_res.scalars().first()
        if target_doc:
            valid_doc_id = target_doc.id

    # 2. Persist User Message
    target_lang = request.language or current_user.preferred_language or "en"
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role="user",
        content=request.question,
        language=target_lang,
        confidence_score=1.0,
        needs_verification=False
    )
    db.add(user_msg)
    await db.commit()

    # 3. Retrieve relevant chunks using Vector Store (resilient: fall back to DB chunks)
    retrieved_chunks: List[dict] = []
    try:
        vector_store = VectorStoreService.get_instance()
        retrieved_chunks = vector_store.retrieve_relevant_chunks(
            query=request.question,
            document_id=valid_doc_id,
            user_id=str(current_user.id),
            top_k=5
        )
    except Exception as vec_err:
        print(f"Vector store retrieval failed, falling back to DB chunks: {vec_err}")

    # Database Chunk Fallback if Vector Store is unavailable or returns empty chunks
    if not retrieved_chunks and valid_doc_id:
        chunks_res = await db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == valid_doc_id)
            .order_by(DocumentChunk.chunk_index)
            .limit(10)
        )
        db_chunks = chunks_res.scalars().all()
        for c in db_chunks:
            retrieved_chunks.append({
                "id": c.id,
                "text": c.text,
                "page_number": c.page_number,
                "filename": target_doc.filename if target_doc else "Document.pdf",
                "document_id": valid_doc_id,
                "distance": 0.0
            })

    # 4. Generate grounded LLM result
    rag_result = gemini_service.generate_grounded_response(
        question=request.question,
        retrieved_chunks=retrieved_chunks,
        target_language=target_lang,
        user_context=request.user_context
    )

    # 5. Persist Assistant Message
    assistant_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role="assistant",
        content=rag_result.answer,
        language=target_lang,
        confidence_score=rag_result.confidence_score,
        needs_verification=rag_result.needs_verification
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    # 6. Persist Citations safely
    citation_responses: List[CitationResponse] = []
    for cit in rag_result.citations:
        cit_doc_id = valid_doc_id
        if not cit_doc_id and retrieved_chunks:
            candidate_id = retrieved_chunks[0].get("document_id")
            if candidate_id:
                cand_res = await db.execute(
                    select(Document).where(Document.id == candidate_id, Document.user_id == current_user.id)
                )
                if cand_res.scalars().first():
                    cit_doc_id = candidate_id

        doc_name = cit.document_name or (target_doc.filename if target_doc else "Document")

        if cit_doc_id:
            db_cit = Citation(
                id=str(uuid.uuid4()),
                message_id=assistant_msg.id,
                document_id=cit_doc_id,
                page_number=cit.page_number,
                snippet=cit.snippet
            )
            db.add(db_cit)
            citation_responses.append(CitationResponse(
                id=db_cit.id,
                document_id=db_cit.document_id,
                document_name=doc_name,
                page_number=cit.page_number,
                snippet=cit.snippet
            ))
        else:
            citation_responses.append(CitationResponse(
                id=str(uuid.uuid4()),
                document_id="general",
                document_name=doc_name,
                page_number=cit.page_number,
                snippet=cit.snippet
            ))

    # 7. Persist Eligibility Check if present
    eligibility_resp = None
    if rag_result.eligibility:
        elig_model = EligibilityCheck(
            id=str(uuid.uuid4()),
            message_id=assistant_msg.id,
            status=rag_result.eligibility.status,
            conditions=json.dumps(rag_result.eligibility.conditions_met),
            missing_info=json.dumps(rag_result.eligibility.missing_info)
        )
        db.add(elig_model)
        eligibility_resp = EligibilityResponse(
            status=rag_result.eligibility.status,
            conditions_met=rag_result.eligibility.conditions_met,
            conditions_unmet=rag_result.eligibility.conditions_unmet,
            missing_info=rag_result.eligibility.missing_info,
            summary=rag_result.eligibility.summary
        )

    # 8. Persist Action Plan if present
    action_plan_resp = None
    if rag_result.action_plan or rag_result.deadline or rag_result.required_documents:
        steps_dicts = [s.model_dump() for s in rag_result.action_plan]
        req_docs_dicts = [d.model_dump() for d in rag_result.required_documents]
        
        plan_model = ActionPlan(
            id=str(uuid.uuid4()),
            message_id=assistant_msg.id,
            steps_json=json.dumps(steps_dicts),
            deadline=rag_result.deadline.date_text if rag_result.deadline else None,
            deadline_source_page=rag_result.deadline.source_page if rag_result.deadline else None,
            required_documents_json=json.dumps(req_docs_dicts)
        )
        db.add(plan_model)
        action_plan_resp = ActionPlanResponse(
            steps=rag_result.action_plan,
            deadline=rag_result.deadline,
            required_documents=rag_result.required_documents
        )

    await db.commit()

    return MessageResponse(
        id=assistant_msg.id,
        conversation_id=conversation.id,
        role="assistant",
        content=assistant_msg.content,
        language=assistant_msg.language,
        confidence_score=assistant_msg.confidence_score,
        needs_verification=assistant_msg.needs_verification,
        created_at=assistant_msg.created_at,
        citations=citation_responses,
        eligibility=eligibility_resp,
        action_plan=action_plan_resp
    )

@router.get("/suggestions")
async def chat_suggestions(
    document_id: Optional[str] = None,
    lang: str = "en",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Role-aware, document-aware suggested questions for the chat page.
    Combines fixed role templates with a document-content scan so the
    suggestions always make sense for what the user actually uploaded."""
    role = (current_user.role or "citizen").lower()
    doc_name = None
    doc_text = ""

    if document_id:
        doc_res = await db.execute(
            select(Document).where(
                Document.id == document_id,
                Document.user_id == current_user.id,
            )
        )
        doc = doc_res.scalars().first()
        if doc:
            doc_name = doc.filename
            chunks_res = await db.execute(
                select(DocumentChunk)
                .where(DocumentChunk.document_id == doc.id)
                .order_by(DocumentChunk.chunk_index)
                .limit(6)
            )
            doc_text = "\n".join(c.text for c in chunks_res.scalars().all())[:4000]

    # 1. Fixed questions per role (Tanglish-friendly, role-first)
    ROLE_QUESTIONS = {
        "student": [
            "Am I eligible for this scholarship?",
            "What documents do I need to apply?",
            "What is the last date to apply?",
            "What is the minimum marks required?",
            "How much stipend/amount will I get?",
        ],
        "citizen": [
            "Am I eligible for this scheme?",
            "What documents do I need?",
            "What is the application deadline?",
            "Where do I apply — online or office?",
            "How long does approval take?",
        ],
        "farmer": [
            "What subsidy do I get under this scheme?",
            "Am I eligible as a small/marginal farmer?",
            "What documents do I need — land record, Aadhaar?",
            "What is the last date to apply?",
            "Where do I submit my application?",
        ],
        "business": [
            "What licenses/registrations does this require?",
            "What is the compliance deadline?",
            "What are the eligibility criteria for MSME?",
            "What documents must I submit?",
            "Are there any fees or penalties?",
        ],
    }
    questions = list(ROLE_QUESTIONS.get(role, ROLE_QUESTIONS["citizen"]))

    # 2. Document-aware additions: scan the actual text for topics worth asking
    if doc_text:
        lowered = doc_text.lower()
        extra: list[str] = []
        if re.search(r"income|annual income|₹|rs\.?", lowered):
            extra.append("What is the income limit mentioned?")
        if re.search(r"age|year of birth|age limit", lowered):
            extra.append("What is the age limit?")
        if re.search(r"quota|reservation|category| caste", lowered):
            extra.append("Is there any category/reservation quota?")
        if re.search(r"portal|website|https?://|apply online", lowered):
            extra.append("What is the official website/portal to apply?")
        if re.search(r"benefit|amount|stipend|pension|subsidy|₹", lowered):
            extra.append("What is the benefit amount I will receive?")
        if re.search(r"renew|valid|extend", lowered):
            extra.append("Does this need renewal? Until when is it valid?")
        if doc_name and re.search(r"exam|admission|semester|course", lowered):
            extra.append("What are the academic requirements?")
        for q in extra:
            if q not in questions:
                questions.append(q)
        questions = questions[:7]

    # 3. Localize the suggestions into the user's language (best-effort, cached).
    #    Falls back to English on any translation failure.
    lang_code = (lang or "en").strip().lower()
    if lang_code and lang_code not in ("en", "en-in"):
        questions = [_translate_text(q, lang_code) for q in questions]

    return {"role": role, "document_id": document_id, "questions": questions[:6]}

@router.get("/tts")
async def text_to_speech(
    text: str,
    lang: str = "en",
    current_user: User = Depends(get_current_user),
):
    """Convert reply text to spoken audio (MP3) in the requested language.
    Used for automatic voice replies; falls back to browser TTS on failure."""
    text = (text or "").strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="text is required")
    if len(text) > 2000:
        text = text[:2000]

    try:
        audio = tts_service.synthesize(text, lang)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"TTS unavailable: {e}"
        )

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={"Cache-Control": "private, max-age=86400"},
    )

def _gemini_transcribe_audio(data: bytes, mime: str, lang: str) -> Optional[str]:
    if not gemini_service.client:
        return None
    lang_name = INDIAN_LANGUAGE_NAMES.get(lang, "English")
    try:
        from google.genai import types as genai_types
        response = gemini_service.client.models.generate_content(
            model=gemini_service.model_name,
            contents=[
                genai_types.Part.from_bytes(data=data, mime_type=mime or "audio/wav"),
                (
                    f"Transcribe the audible speech in {lang_name}. Write the transcript in {lang_name}'s "
                    "usual writing system. Do not translate, summarize, answer the speech, or add words. "
                    "Do not repeat any phrase unless it was actually spoken more than once. "
                    "Return only the transcript; if no intelligible speech in that language is present, return an empty response."
                ),
            ],
        )
        transcript = (response.text or "").strip().strip('"')
        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Gemini could not hear clear speech. Please try again.",
            )
        return transcript
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Gemini STT failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini speech recognition is unavailable. Please retry in a moment.",
        ) from exc


@router.post("/stt")
async def speech_to_text(
    file: UploadFile = File(...),
    lang: str = "en",
    current_user: User = Depends(get_current_user),
):
    """Transcribe recorded speech using Gemini, with local Whisper as a fallback."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty audio file")
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Audio too large")

    mime = (file.content_type or "").lower()

    # ── Path 1: raw PCM from the browser (16-bit LE, 16 kHz mono) ──
    if "pcm" in mime or "octet-stream" in mime:
        try:
            samples = np.frombuffer(data[: len(data) - (len(data) % 2)], dtype=np.int16).astype(np.float32) / 32768.0
            if samples.size < 3200:  # < 0.2 s
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Recording too short")
            text = local_stt_service.transcribe(samples, lang)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Local transcription failed: {e}")
        return {"text": text, "engine": "local"}

    # ── Path 2: WAV container (parse + decode with stdlib wave) ──
    if "wav" in mime or data[:4] == b"RIFF":
        try:
            import wave as wave_mod
            import io as io_mod
            with wave_mod.open(io_mod.BytesIO(data), "rb") as w:
                rate = w.getframerate()
                channels = w.getnchannels()
                sw = w.getsampwidth()
                frames = w.readframes(w.getnframes())
            if sw == 2:
                samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
            elif sw == 4:
                samples = np.frombuffer(frames, dtype=np.int32).astype(np.float32) / 2147483648.0
            else:
                raise ValueError(f"Unsupported sample width: {sw}")
            if channels == 2:
                samples = samples[0::2]
            if rate != 16000:
                n_out = int(len(samples) * 16000 / rate)
                samples = np.interp(np.linspace(0, 1, n_out), np.linspace(0, 1, len(samples)), samples).astype(np.float32)
            if samples.size < 3200:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Recording too short")
            text = _gemini_transcribe_audio(data, "audio/wav", lang)
            if text:
                return {"text": text, "engine": "gemini"}
            text = local_stt_service.transcribe(samples.astype(np.float32), lang)
            return {"text": text, "engine": "local"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"WAV transcription failed: {e}")

    # ── Path 3: compressed formats (webm/ogg/mp4) -> Gemini if available ──
    text = _gemini_transcribe_audio(data, mime or "audio/webm", lang)
    if text:
        return {"text": text, "engine": "gemini"}

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="This audio format needs GEMINI_API_KEY. Try again — the browser will send raw audio."
    )

@router.get("/conversations", response_model=List[ConversationSummaryResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
    )
    convs = result.scalars().all()
    summaries = []
    for c in convs:
        count_res = await db.execute(
            select(func.count(Message.id)).where(Message.conversation_id == c.id)
        )
        msg_count = count_res.scalar_one_or_none() or 0
        summaries.append(ConversationSummaryResponse(
            id=c.id,
            title=c.title,
            document_id=c.document_id,
            created_at=c.created_at,
            message_count=msg_count
        ))
    return summaries

@router.get("/conversations/{conversation_id}/export")
async def export_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export a conversation as a Word-compatible HTML document (.doc download).
    Includes the full Q&A, insights (eligibility, plan, deadlines) and citations."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .options(
            selectinload(Conversation.messages).selectinload(Message.citations),
            selectinload(Conversation.messages).selectinload(Message.eligibility_check),
            selectinload(Conversation.messages).selectinload(Message.action_plan)
        )
    )
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    def esc(s: Optional[str]) -> str:
        import html
        return html.escape(s or "")

    rows = []
    for m in conv.messages:
        if m.role == "user":
            rows.append(f'''
            <div class="q"><span class="who">You asked:</span>{esc(m.content)}</div>''')
        else:
            insights = ""
            if m.eligibility_check:
                try:
                    conds = json.loads(m.eligibility_check.conditions or "[]")
                except Exception:
                    conds = []
                if conds:
                    items = "".join(f"<li>{esc(c)}</li>" for c in conds)
                    insights += f'''<div class="insight"><b>Eligibility ({esc(m.eligibility_check.status)})</b><ul>{items}</ul></div>'''
            if m.action_plan:
                try:
                    steps = json.loads(m.action_plan.steps_json or "[]")
                except Exception:
                    steps = []
                if steps:
                    items = "".join(
                        f"<li><b>{esc(s.get('title', ''))}</b> — {esc(s.get('description', ''))}</li>"
                        for s in steps if isinstance(s, dict)
                    )
                    dl = f"<div><b>Deadline:</b> {esc(m.action_plan.deadline or 'Not specified')}</div>" if m.action_plan.deadline else ""
                    insights += f'''<div class="insight"><b>Action Plan</b>{dl}<ol>{items}</ol></div>'''
            if m.citations:
                cits = "".join(
                    f"<li>{esc(c.snippet)} <i>— page {c.page_number}</i></li>"
                    for c in m.citations
                )
                insights += f'''<div class="insight"><b>Sources</b><ul>{cits}</ul></div>'''
            rows.append(f'''
            <div class="a"><span class="who">BharatSahay AI:</span>{esc(m.content)}{insights}</div>''')

    html_doc = f'''<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<title>{esc(conv.title)}</title>
<style>
  body {{ font-family: Calibri, Arial, sans-serif; max-width: 800px; margin: 24px auto; color: #1a202c; line-height: 1.6; }}
  h1 {{ color: #c2410c; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; }}
  .meta {{ color: #718096; font-size: 13px; margin-bottom: 24px; }}
  .q, .a {{ padding: 12px 16px; border-radius: 10px; margin: 12px 0; page-break-inside: avoid; }}
  .q {{ background: #fff7ed; border-left: 4px solid #f97316; }}
  .a {{ background: #f0f9ff; border-left: 4px solid #0ea5e9; }}
  .who {{ display: block; font-weight: 700; font-size: 12px; text-transform: uppercase; color: #718096; margin-bottom: 4px; }}
  .insight {{ margin-top: 10px; padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }}
  .insight b {{ color: #c2410c; }}
</style>
</head>
<body>
<h1>{esc(conv.title)}</h1>
<div class="meta">Exported from BharatSahay AI · {len(conv.messages)} messages · {esc(current_user.name)}</div>
{"".join(rows)}
</body>
</html>'''

    from urllib.parse import quote
    filename = quote(f"bharatsahay-{conv.title[:40].strip().replace(' ', '-') or 'chat'}.doc")
    from fastapi import Response as FastResponse
    return FastResponse(
        content=html_doc.encode("utf-8"),
        media_type="application/msword",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{filename}",
        },
    )

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .options(
            selectinload(Conversation.messages).selectinload(Message.citations),
            selectinload(Conversation.messages).selectinload(Message.eligibility_check),
            selectinload(Conversation.messages).selectinload(Message.action_plan)
        )
    )
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    formatted_messages: List[MessageResponse] = []
    for m in conv.messages:
        cit_list = [
            CitationResponse(
                id=c.id,
                document_id=c.document_id,
                page_number=c.page_number,
                snippet=c.snippet
            )
            for c in m.citations
        ]
        
        elig = None
        if m.eligibility_check:
            conds = json.loads(m.eligibility_check.conditions or "[]")
            missing = json.loads(m.eligibility_check.missing_info or "[]")
            elig = EligibilityResponse(
                status=m.eligibility_check.status,
                conditions_met=conds,
                conditions_unmet=[],
                missing_info=missing,
                summary=f"Status: {m.eligibility_check.status}"
            )

        act_plan = None
        if m.action_plan:
            steps_raw = json.loads(m.action_plan.steps_json or "[]")
            req_docs_raw = json.loads(m.action_plan.required_documents_json or "[]")
            steps = [ActionStepItem(**s) for s in steps_raw]
            docs = [RequiredDocumentItem(**d) for d in req_docs_raw]
            deadline = DeadlineDetail(
                date_text=m.action_plan.deadline,
                is_deadline_found=bool(m.action_plan.deadline),
                source_page=m.action_plan.deadline_source_page
            )
            act_plan = ActionPlanResponse(
                steps=steps,
                deadline=deadline,
                required_documents=docs
            )

        formatted_messages.append(MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            language=m.language,
            confidence_score=m.confidence_score,
            needs_verification=m.needs_verification,
            created_at=m.created_at,
            citations=cit_list,
            eligibility=elig,
            action_plan=act_plan
        ))

    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        document_id=conv.document_id,
        created_at=conv.created_at,
        messages=formatted_messages
    )
