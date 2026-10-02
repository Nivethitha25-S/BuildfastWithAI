"""Text-to-speech service: converts answer text to audio in any supported language.

Primary: Google Translate TTS endpoint (free, no key, supports all Indian languages).
Fallback: returns an error so the frontend can use the browser's built-in speechSynthesis.
"""
import hashlib
import os
from typing import Optional

import httpx

# Voice names shown in logs per language (Google TTS handles the actual voice)
LANG_TTS_CODES = {
    "en": "en",
    "hi": "hi",
    "ta": "ta",
    "te": "te",
    "kn": "kn",
    "ml": "ml",
    "bn": "bn",
    "mr": "mr",
    "gu": "gu",
    "pa": "pa",
    "ur": "ur",
    "or": "or",   # Odia: Google TTS may 404; frontend falls back to browser voice
    "as": "as",   # Assamese: same caveat
}

# Google TTS has a ~200-char practical limit per request
_MAX_CHUNK = 190


class TTSService:
    def __init__(self):
        self.cache_dir = os.path.join("data", "tts_cache")
        os.makedirs(self.cache_dir, exist_ok=True)

    def _cache_path(self, text: str, lang: str) -> str:
        key = hashlib.sha1(f"{lang}:{text}".encode("utf-8")).hexdigest()
        return os.path.join(self.cache_dir, f"{lang}_{key}.mp3")

    def synthesize(self, text: str, lang: str = "en") -> bytes:
        """Convert text to MP3 audio bytes for the given language. Raises on failure."""
        lang = LANG_TTS_CODES.get(lang, "en")
        text = " ".join((text or "").split())
        if not text:
            raise ValueError("Empty text for TTS")

        cache_file = self._cache_path(text, lang)
        if os.path.exists(cache_file) and os.path.getsize(cache_file) > 0:
            with open(cache_file, "rb") as f:
                return f.read()

        # Split into <=190-char chunks, preferring sentence/newline boundaries
        chunks = []
        remaining = text
        while len(remaining) > _MAX_CHUNK:
            cut = remaining.rfind("।", 0, _MAX_CHUNK)  # Devanagari danda
            if cut == -1:
                cut = remaining.rfind(".", 0, _MAX_CHUNK)
            if cut == -1:
                cut = remaining.rfind(" ", 0, _MAX_CHUNK)
            if cut == -1:
                cut = _MAX_CHUNK
            chunks.append(remaining[: cut + 1])
            remaining = remaining[cut + 1:]
        if remaining:
            chunks.append(remaining)

        audio = bytearray()
        with httpx.Client(timeout=15.0) as client:
            for i, chunk in enumerate(chunks):
                resp = client.get(
                    "https://translate.google.com/translate_tts",
                    params={"ie": "UTF-8", "q": chunk, "tl": lang, "client": "tw-ob", "idx": i, "total": len(chunks), "textlen": len(chunk)},
                )
                resp.raise_for_status()
                ct = resp.headers.get("content-type", "")
                if "audio" not in ct:
                    raise ValueError(f"TTS returned non-audio response: {ct}")
                if not resp.content:
                    raise ValueError(f"TTS returned empty chunk {i}")
                audio.extend(resp.content)

        data = bytes(audio)
        if not data:
            raise ValueError("TTS returned empty audio")

        try:
            with open(cache_file, "wb") as f:
                f.write(data)
        except Exception:
            pass  # cache write is best-effort

        return data


tts_service = TTSService()
