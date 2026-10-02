"""Offline local speech-to-text using Whisper-base ONNX (no API key required).

Downloads model files on first use via huggingface_hub, then runs fully locally:
  PCM 16kHz -> log-Mel spectrogram -> ONNX encoder -> greedy ONNX decoder -> text

Supported languages include English, Hindi, Tamil, Telugu, Kannada, Malayalam,
Bengali, Marathi, Gujarati, Punjabi, Urdu (whisper's multilingual coverage).
Accuracy for Indian languages is moderate; for best quality set GEMINI_API_KEY
and the /chat/stt route will prefer Gemini instead.
"""
import os
import re
import threading
from typing import Optional

import numpy as np

MODEL_ID = "onnx-community/whisper-base"
SAMPLE_RATE = 16000
N_FFT = 400
HOP = 160
N_MELS = 80
MAX_AUDIO_SECONDS = 30

# Whisper language tokens (subset used by this app)
LANG_TO_ID = {
    "en": 50259, "hi": 50276, "ta": 50287, "te": 50299, "kn": 50268,
    "ml": 50284, "bn": 50302, "mr": 50278, "gu": 50296, "pa": 50290,
    "ur": 50278, "or": 50259, "as": 50302,  # Odia->en, Assamese->bn fallbacks
}
TASK_TRANSCRIBE = 50359
EOT = 50257
SOT = 50258


def _logmel(audio: np.ndarray) -> np.ndarray:
    """Compute Whisper log-Mel spectrogram (80 bins) from 16 kHz mono float PCM."""
    import torch  # torch is installed; used only for a fast STFT

    window = torch.hann_window(N_FFT)
    spec = torch.stft(
        torch.from_numpy(audio),
        n_fft=N_FFT,
        hop_length=HOP,
        window=window,
        center=True,
        pad_mode="reflect",
        return_complex=True,
    )
    mag = spec.abs() ** 2  # power

    # Mel filterbank (Slaney-style like whisper's filters.npz)
    mel_filters = _mel_filters()
    mel_spec = mel_filters @ mag.numpy()

    log_spec = np.log10(np.maximum(mel_spec, 1e-10))
    log_spec = np.maximum(log_spec, log_spec.max() - 8.0)
    log_spec = (log_spec + 4.0) / 4.0
    # Whisper expects exactly 3000 frames for 30 s of audio (center padding adds one)
    if log_spec.shape[1] > 3000:
        log_spec = log_spec[:, :3000]
    elif log_spec.shape[1] < 3000:
        log_spec = np.pad(log_spec, ((0, 0), (0, 3000 - log_spec.shape[1])))
    return log_spec.astype(np.float32)[None, :, :]  # (1, 80, 3000)


_MEL_FILTERS_CACHE: Optional[np.ndarray] = None


def _mel_filters() -> np.ndarray:
    """Load Whisper's official 80-bin mel filterbank (mel_filters.npz)."""
    global _MEL_FILTERS_CACHE
    if _MEL_FILTERS_CACHE is not None:
        return _MEL_FILTERS_CACHE

    filters_path = os.path.join("data", "models", "mel_filters.npz")
    if not os.path.exists(filters_path):
        # Download from the official Whisper repository on first use
        import httpx
        url = "https://raw.githubusercontent.com/openai/whisper/main/whisper/assets/mel_filters.npz"
        os.makedirs(os.path.dirname(filters_path), exist_ok=True)
        resp = httpx.get(url, timeout=30.0, follow_redirects=True)
        resp.raise_for_status()
        with open(filters_path, "wb") as f:
            f.write(resp.content)

    data = np.load(filters_path)
    _MEL_FILTERS_CACHE = data["mel_80"].astype(np.float32)
    return _MEL_FILTERS_CACHE


class LocalSTTService:
    def __init__(self):
        self._ready = False
        self._lock = threading.Lock()
        self._sess_enc = None
        self._sess_dec = None
        self._tokenizer = None

    def _load(self):
        with self._lock:
            if self._ready:
                return
            import onnxruntime as ort
            from huggingface_hub import hf_hub_download
            from tokenizers import Tokenizer

            enc_path = hf_hub_download(MODEL_ID, "onnx/encoder_model.onnx")
            dec_path = hf_hub_download(MODEL_ID, "onnx/decoder_model_merged.onnx")
            tok_path = hf_hub_download(MODEL_ID, "tokenizer.json")

            so = ort.SessionOptions()
            so.log_severity_level = 3
            self._sess_enc = ort.InferenceSession(enc_path, sess_options=so, providers=["CPUExecutionProvider"])
            self._sess_dec = ort.InferenceSession(dec_path, sess_options=so, providers=["CPUExecutionProvider"])
            self._tokenizer = Tokenizer.from_file(tok_path)
            self._dec_input_names = {i.name for i in self._sess_dec.get_inputs()}
            self._dec_output_names = [o.name for o in self._sess_dec.get_outputs()]
            self._ready = True

    @staticmethod
    def _kv_shape(shape: list) -> list[int]:
        """Resolve symbolic KV dims: past_decoder_sequence_length=0 at step 0."""
        out = []
        for d in shape:
            if isinstance(d, int):
                out.append(d)
            elif d in ("past_decoder_sequence_length", "decoder_sequence_length"):
                out.append(1)
            elif d == "encoder_sequence_length_out":
                out.append(1500)
            else:
                out.append(1)
        return out

    def transcribe(self, audio_16k: np.ndarray, language: str = "en") -> str:
        """audio_16k: float32 mono PCM at 16 kHz in [-1, 1]. Returns transcript text."""
        self._load()

        # Peak normalize audio before padding so soft laptop mic speech is clearly recognized
        max_val = np.max(np.abs(audio_16k))
        if max_val > 1e-4:
            audio_16k = (audio_16k * (0.85 / max_val)).astype(np.float32)

        # Pad/trim to exactly 30 s like Whisper expects
        target = SAMPLE_RATE * MAX_AUDIO_SECONDS
        if len(audio_16k) < target:
            audio_16k = np.pad(audio_16k, (0, target - len(audio_16k)))
        else:
            audio_16k = audio_16k[:target]

        mel = _logmel(audio_16k)

        enc_out = self._sess_enc.run(None, {"input_features": mel})
        encoder_hidden = enc_out[0]  # (1, 1500, 512)

        lang_id = LANG_TO_ID.get(language, LANG_TO_ID["en"])
        tokens = [SOT, lang_id, TASK_TRANSCRIBE]
        generated: list[int] = []      # text tokens only (for decode)
        all_tokens: list[int] = list(tokens)  # includes timestamps (for decoder input)
        past_kv: dict[str, np.ndarray] = {}

        # Zero-initialised KV cache required by decoder_model_merged
        zero_kv = {
            name: np.zeros(self._kv_shape(i.shape), dtype=np.float32)
            for name, i in ((i.name, i) for i in self._sess_dec.get_inputs())
            if name.startswith("past_key_values.")
        }

        if language == "auto":
            # Whisper predicts the spoken-language token after SOT. Discover
            # candidate language tokens from the model tokenizer at runtime.
            detect_feed = {
                "encoder_hidden_states": encoder_hidden,
                "use_cache_branch": np.array([False], dtype=bool),
                "input_ids": np.array([[SOT]], dtype=np.int64),
                **zero_kv,
            }
            detect_logits = self._sess_dec.run(None, detect_feed)[0][0, -1]
            language_token_ids = [
                token_id for token_id in range(50259, 50359)
                if re.fullmatch(r"<\|[a-z]{2,3}\|>", self._tokenizer.id_to_token(token_id) or "")
            ]
            if language_token_ids:
                lang_id = max(language_token_ids, key=lambda token_id: detect_logits[token_id])

        else:
            lang_id = self._tokenizer.token_to_id(f"<|{language}|>") or lang_id

        tokens = [SOT, lang_id, TASK_TRANSCRIBE]
        all_tokens = list(tokens)

        for step in range(80):
            feed: dict[str, np.ndarray] = {
                "encoder_hidden_states": encoder_hidden,
                "use_cache_branch": np.array([step > 0], dtype=bool),
            }
            if step == 0:
                feed["input_ids"] = np.array([tokens], dtype=np.int64)
                feed.update(zero_kv)
            else:
                feed["input_ids"] = np.array([[all_tokens[-1]]], dtype=np.int64)
                feed.update(past_kv)

            outputs = self._sess_dec.run(None, feed)
            logits = outputs[0][0, -1]  # (vocab,)

            # Collect present.* KV and re-map to past_key_values.* for the next step
            past_kv = {}
            for name, val in zip(self._dec_output_names[1:], outputs[1:]):
                if name.startswith("present."):
                    past_kv["past_key_values." + name[len("present."):]] = val

            # Pick the best token: allow timestamps (they carry alignment info that
            # tokenizer.decode drops), stop at EOT, skip other special tokens.
            sorted_ids = np.argsort(logits)[::-1]
            next_id: Optional[int] = None
            for tid in sorted_ids[:40]:
                tid = int(tid)
                if tid == EOT:
                    next_id = tid
                    break
                if tid == SOT:
                    continue
                # Timestamps (50364..51865) are fine; other specials (<50258) blocked
                if 50259 <= tid <= 50357:  # language/task tokens
                    continue
                # Avoid Whisper-base getting stuck in a repeated phrase loop.
                if len(generated) >= 2:
                    prev_bigram = (generated[-2], generated[-1])
                    repeats_bigram = any(
                        (generated[i], generated[i + 1]) == prev_bigram and generated[i + 2] == tid
                        for i in range(len(generated) - 2)
                    )
                    if repeats_bigram:
                        continue
                next_id = tid
                break
            if next_id is None or next_id == EOT:
                break
            all_tokens.append(next_id)
            if next_id < 50364:  # regular text token
                generated.append(next_id)

        if not generated:
            return ""
        text = self._tokenizer.decode(generated).strip()
        return text if text and text != "..." else ""


local_stt_service = LocalSTTService()
