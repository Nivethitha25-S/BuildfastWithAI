import { useState, useEffect, useRef, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Send, Mic, MicOff, Volume2, VolumeX, ArrowLeft, FileText, Brain,
  CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp,
  ExternalLink, Globe, Target, Clock, ListChecks, MapPin,
  ThumbsUp, ThumbsDown, RefreshCw, Square, Sparkles, Download
} from 'lucide-react';
import { apiChat, apiGetConversation, apiFeedback, speakServerTTS, stopServerTTS, apiUpdateLanguage, apiSpeechToText, apiExportConversation, apiChatSuggestions, documentFileUrl } from '../api';
import type { ChatMessage, BharatDocument, User, EligibilityResponse, ActionPlan, CitationItem } from '../types';
import { LANGUAGES, LANG_BCP47 } from '../types';
import { t, tFmt } from '../i18n';

interface Props {
  user: User;
  document: BharatDocument | null;
  conversationId: string | null;
  onBack: () => void;
  onUserUpdate?: (u: User) => void;
}

// ─── Speech Hooks ───────────────────────────────────────────────────────────
type SpeechErrorCode = 'unsupported' | 'no-speech' | 'mic-blocked' | 'network' | 'aborted' | 'hung';

function useSpeech(lang: string) {
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);
  const hangTimerRef = useRef<number | null>(null);

  function cleanup() {
    if (hangTimerRef.current) { window.clearTimeout(hangTimerRef.current); hangTimerRef.current = null; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = recogRef.current as any;
    if (rec) { try { rec.abort?.(); } catch { /* ignore */ } try { rec.stop?.(); } catch { /* ignore */ } }
    recogRef.current = null;
    setListening(false);
  }

  function startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (code: SpeechErrorCode) => void
  ) {
    stopSpeaking(); // free the microphone: TTS output would feed back into recognition
    cleanup();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { onError?.('unsupported'); return; }
    const rec = new SR();
    rec.lang = LANG_BCP47[lang] || 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let started = false;
    let gotResult = false;
    let accumulatedText = '';
    // Set to true when ANY browser SR event fires; used to detect silently hung engines.
    let anyEventFired = false;
    let earlyHangFired = false;

    rec.onstart = () => {
      anyEventFired = true;
      if (earlyHangFired) return; // we already routed to fallback
      // Cancel early-hang timer and start the real 15-s no-speech timeout.
      if (hangTimerRef.current) { window.clearTimeout(hangTimerRef.current); hangTimerRef.current = null; }
      hangTimerRef.current = window.setTimeout(() => {
        if (!gotResult && !accumulatedText) { cleanup(); onError?.('no-speech'); }
      }, 15000);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      anyEventFired = true;
      const map: Record<string, SpeechErrorCode> = {
        'not-allowed': 'mic-blocked', 'service-not-allowed': 'mic-blocked', 'audio-capture': 'mic-blocked',
        'no-speech': 'no-speech', 'network': 'network', 'aborted': 'aborted',
        'language-not-supported': 'unsupported',
      };
      if (e?.error === 'no-speech' && accumulatedText.trim()) {
        cleanup();
        onResult(accumulatedText.trim(), true);
        return;
      }
      cleanup();
      onError?.(map[e?.error] || 'no-speech');
    };

    rec.onend = () => {
      anyEventFired = true;
      if (earlyHangFired) return; // early-hang path already cleaned up
      if (hangTimerRef.current) { window.clearTimeout(hangTimerRef.current); hangTimerRef.current = null; }
      setListening(false);
      if (accumulatedText.trim()) {
        onResult(accumulatedText.trim(), true);
      } else if (!gotResult && started) {
        onError?.('no-speech');
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      anyEventFired = true;
      gotResult = true;
      let interim = '';
      let currentFinal = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          currentFinal += e.results[i][0].transcript + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (currentFinal) {
        accumulatedText += currentFinal;
      }
      const combined = (accumulatedText + interim).trim();
      if (combined) {
        onResult(combined, false);
      }
    };

    recogRef.current = rec;
    try {
      rec.start();
    } catch { onError?.('aborted'); return; }

    // ── Immediate visual feedback ─────────────────────────────────────────────
    // Set listening=true right after rec.start() so the mic button turns red
    // immediately, regardless of whether rec.onstart fires (some browsers don't).
    started = true;
    setListening(true);

    // ── Early hang detector ───────────────────────────────────────────────────
    // If zero SR events fire within 2 s, the browser engine is silently frozen.
    // Route straight to the server-STT fallback via 'hung' error code.
    hangTimerRef.current = window.setTimeout(() => {
      if (!anyEventFired) {
        earlyHangFired = true;
        cleanup();
        onError?.('hung');
      }
    }, 2000);
  }

  function stopListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = recogRef.current as any;
    if (rec) {
      try { rec.stop(); } catch { cleanup(); }
    } else {
      cleanup();
    }
  }

  return { listening, startListening, stopListening };
}

// ─── Server STT fallback (records raw PCM via WebAudio, transcribes locally) ──
let activeFallbackStop: (() => void) | null = null;

function stopFallbackRecording() {
  try { activeFallbackStop?.(); } catch { /* ignore */ }
}

function friendlyMicError(err: unknown): string {
  const msg = (err as Error)?.message || '';
  if (msg.startsWith('No audio data was captured') || msg.startsWith('Recording was too short') || msg.startsWith('No sound reached the microphone') || msg.startsWith('Could not open the selected microphone')) {
    return msg;
  }
  if (msg.includes('NotFoundError') || msg.includes('Requested device not found')) {
    return 'No microphone detected. Please check your system audio settings.';
  }
  if (msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('denied') || msg.includes('dismissed')) {
    return 'Microphone permission blocked. Please allow microphone access in your browser.';
  }
  if (msg.includes('501') || msg.toLowerCase().includes('gemini_api_key')) {
    return 'Voice input is unavailable — please type your question.';
  }
  return 'Voice input failed. Please try speaking into your mic again or type your question.';
}

function encodeWav(samples: Int16Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

async function recordAndTranscribe(
  lang: string,
  onLevel: (listening: boolean) => void,
  onMicLevel?: (vol: number) => void,
  maxMs = 12000,
  deviceId?: string,
  onDevices?: (devices: Array<{ deviceId: string; label: string }>) => void,
): Promise<string> {
  // ── 1. Get microphone stream ──────────────────────────────────────────────
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      }
    });
  } catch {
    if (deviceId) throw new Error('Could not open the selected microphone. Choose another input device.');
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }
  if (onDevices) {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      onDevices(devices
        .filter(device => device.kind === 'audioinput')
        .map((device, index) => ({ deviceId: device.deviceId, label: device.label || `Microphone ${index + 1}` })));
    }).catch(() => {});
  }
  onLevel(true);

  // ── 2. Volume visualizer via AnalyserNode (won't interfere with recording) ─
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const volCtx = new AudioCtx();
  if (volCtx.state === 'suspended') await volCtx.resume();
  const analyser = volCtx.createAnalyser();
  analyser.fftSize = 256;
  const volSrc = volCtx.createMediaStreamSource(stream);
  volSrc.connect(analyser);
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  const volTimer = onMicLevel
    ? window.setInterval(() => {
        analyser.getByteFrequencyData(freqData);
        const avg = freqData.reduce((s, v) => s + v, 0) / freqData.length;
        onMicLevel(Math.min(100, Math.round(avg * 2.5)));
      }, 80)
    : null;

  // ── 3. MediaRecorder — most reliable cross-driver audio capture ───────────
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', '']
    .find(t => !t || MediaRecorder.isTypeSupported(t)) ?? '';
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
  const parts: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) parts.push(e.data); };
  recorder.start(200); // collect 200 ms slices

  // ── 4. Wait for user to stop or timeout ───────────────────────────────────
  let done = false;
  const timer = window.setTimeout(() => { done = true; }, maxMs);
  await new Promise<void>(resolve => {
    const poll = window.setInterval(() => { if (done) { clearInterval(poll); resolve(); } }, 80);
    activeFallbackStop = () => { done = true; clearInterval(poll); resolve(); };
  });
  window.clearTimeout(timer);

  // ── 5. Stop everything ────────────────────────────────────────────────────
  if (volTimer !== null) window.clearInterval(volTimer);
  try { volSrc.disconnect(); } catch { /* ignore */ }
  try { volCtx.close(); } catch { /* ignore */ }

  const recordedBlob = await new Promise<Blob>(resolve => {
    recorder.onstop = () =>
      resolve(new Blob(parts, { type: recorder.mimeType || 'audio/webm' }));
    recorder.stop();
  });
  stream.getTracks().forEach(t => t.stop());
  activeFallbackStop = null;
  onLevel(false);

  if (parts.length === 0 || recordedBlob.size < 500) {
    throw new Error('No audio data was captured. Check that your microphone is enabled and try again.');
  }

  // ── 6. Decode compressed audio → raw PCM via AudioContext ─────────────────
  let raw: Float32Array;
  let nativeSR: number;
  try {
    const decCtx = new AudioCtx();
    const buf = await decCtx.decodeAudioData(await recordedBlob.arrayBuffer());
    nativeSR = buf.sampleRate;
    // Mix down to mono
    if (buf.numberOfChannels >= 2) {
      const l = buf.getChannelData(0);
      const r = buf.getChannelData(1);
      raw = new Float32Array(l.length);
      for (let i = 0; i < l.length; i++) raw[i] = (l[i] + r[i]) * 0.5;
    } else {
      raw = buf.getChannelData(0);
    }
    try { decCtx.close(); } catch { /* ignore */ }
  } catch {
    // Decoder failed — send compressed blob directly (backend Gemini path)
    return await apiSpeechToText(recordedBlob, lang);
  }

  // ── 7. Resample nativeSR → 16 kHz (linear interpolation) ─────────────────
  const TARGET_SR = 16000;
  let audio16k: Float32Array;
  if (nativeSR === TARGET_SR) {
    audio16k = raw;
  } else {
    const ratio = nativeSR / TARGET_SR;
    const outLen = Math.floor(raw.length / ratio);
    audio16k = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const s = i * ratio;
      const lo = Math.floor(s);
      const hi = Math.min(lo + 1, raw.length - 1);
      audio16k[i] = raw[lo] + (raw[hi] - raw[lo]) * (s - lo);
    }
  }

  // ── 8. Require at least 0.5 s ────────────────────────────────────────────
  if (audio16k.length < TARGET_SR * 0.5) {
    throw new Error('Recording was too short. Keep speaking for a moment before tapping the mic to stop.');
  }

  // ── 9. Peak-normalize (built-in mics are often very quiet) ───────────────
  const peak = audio16k.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  if (peak < 1e-5) {
    throw new Error('No sound reached the microphone. Check the selected input device and its input volume.');
  }
  const gainF = Math.min(0.9 / peak, 10.0);
  for (let i = 0; i < audio16k.length; i++) audio16k[i] *= gainF;

  // ── 10. Encode 16-bit PCM WAV and send to Whisper ─────────────────────────
  const pcm = new Int16Array(audio16k.length);
  for (let i = 0; i < audio16k.length; i++) {
    const s = Math.max(-1, Math.min(1, audio16k[i]));
    pcm[i] = Math.round(s < 0 ? s * 0x8000 : s * 0x7FFF);
  }
  return await apiSpeechToText(encodeWav(pcm, TARGET_SR), lang);
}

function cleanForSpeech(text: string): string {
  return text
    .replace(/\[[^\]]*\]/g, ' ')   // [Refer to ...] brackets
    .replace(/[#*_>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Speaking state (module-level, shared by every speak/stop caller) ──────
let speechSeq = 0;              // increments on every speak/stop; cancels stale utterances
let browserUtterance: SpeechSynthesisUtterance | null = null;

function browserVoicesFor(lang: string): SpeechSynthesisVoice | null {
  if (!window.speechSynthesis) return null;
  const bcp47 = LANG_BCP47[lang] || 'en-IN';
  const prefix = bcp47.split('-')[0].toLowerCase();
  return window.speechSynthesis.getVoices().find(
    v => v.lang.toLowerCase().replace('_', '-').startsWith(prefix)
  ) || null;
}

async function speak(text: string, lang: string): Promise<void> {
  const clean = cleanForSpeech(text).slice(0, 1000);
  if (!clean) return;
  stopSpeaking();
  const mySeq = ++speechSeq;
  // 1) Server TTS: real voices for all 13 languages (works even when the OS lacks voice packs)
  try {
    await speakServerTTS(clean, lang);
    return;
  } catch { /* fall through to browser TTS */ }
  if (mySeq !== speechSeq) return; // stopped while fetching
  // 2) Browser TTS fallback — ONLY if the OS actually has a voice for this language.
  //    Speaking with a mismatched voice is what produced the mixed-language audio.
  const voice = browserVoicesFor(lang);
  if (!window.speechSynthesis || !voice) return; // stay silent rather than wrong-language
  const utt = new SpeechSynthesisUtterance(clean.slice(0, 600));
  utt.lang = voice.lang;
  utt.voice = voice;
  utt.rate = 0.95;
  browserUtterance = utt;
  utt.onend = () => { if (browserUtterance === utt) browserUtterance = null; };
  window.speechSynthesis.speak(utt);
}

function stopSpeaking() {
  speechSeq++;                     // invalidate any pending speak() pipeline
  stopServerTTS();                 // server TTS audio element (the actual voice being played)
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel(); // browser TTS fallback
  }
  browserUtterance = null;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EligibilityPanel({ elig, lang }: { elig: EligibilityResponse; lang: string }) {
  const color =
    elig.status === 'ELIGIBLE' ? 'green'
    : elig.status === 'NOT_ELIGIBLE' ? 'red'
    : 'amber';

  const Icon = elig.status === 'ELIGIBLE' ? CheckCircle
    : elig.status === 'NOT_ELIGIBLE' ? XCircle
    : AlertCircle;

  return (
    <div className={`rounded-xl border p-4 mt-3 ${
      color === 'green' ? 'border-green-500/30 bg-green-500/5' :
      color === 'red' ? 'border-red-500/30 bg-red-500/5' :
      'border-amber-500/30 bg-amber-500/5'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${
          color === 'green' ? 'text-green-400' :
          color === 'red' ? 'text-red-400' : 'text-amber-400'
        }`} />
        <span className={`font-bold text-sm ${
          color === 'green' ? 'text-green-400' :
          color === 'red' ? 'text-red-400' : 'text-amber-400'
        }`}>
          {t(lang, elig.status === 'ELIGIBLE' ? 'chat_status_eligible'
            : elig.status === 'NOT_ELIGIBLE' ? 'chat_status_not_eligible'
            : 'chat_status_uncertain')}
        </span>
      </div>
      {elig.summary && <p className="text-slate-400 text-xs mb-2">{elig.summary}</p>}
      {elig.conditions_met.filter(c => c && c.trim()).length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-green-400 mb-1">{t(lang, 'chat_conditions_met')}</p>
          {elig.conditions_met.filter(c => c && c.trim()).map((c, i) => (
            <p key={i} className="text-xs text-slate-300 pl-3 border-l border-green-500/30 mb-0.5">• {c}</p>
          ))}
        </div>
      )}
      {elig.conditions_unmet.filter(c => c && c.trim()).length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-red-400 mb-1">{t(lang, 'chat_conditions_unmet')}</p>
          {elig.conditions_unmet.filter(c => c && c.trim()).map((c, i) => (
            <p key={i} className="text-xs text-slate-300 pl-3 border-l border-red-500/30 mb-0.5">• {c}</p>
          ))}
        </div>
      )}
      {elig.missing_info.filter(c => c && c.trim()).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-400 mb-1">{t(lang, 'chat_missing_info')}</p>
          {elig.missing_info.filter(c => c && c.trim()).map((c, i) => (
            <p key={i} className="text-xs text-slate-300 pl-3 border-l border-amber-500/30 mb-0.5">• {c}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionPlanPanel({ plan, lang }: { plan: ActionPlan; lang: string }) {
  const [docsExpanded, setDocsExpanded] = useState(true);
  return (
    <div className="mt-3 space-y-3">
      {/* Deadline */}
      {plan.deadline?.is_deadline_found && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
          <Clock className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-400">{t(lang, 'chat_deadline')}</p>
            <p className="text-sm text-slate-300">{plan.deadline.date_text}</p>
            {plan.deadline.source_page && (
              <p className="text-xs text-slate-600">{tFmt(lang, 'chat_source_page', { page: String(plan.deadline.source_page) })}</p>
            )}
          </div>
        </div>
      )}

      {/* Required Docs */}
      {plan.required_documents.length > 0 && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5">
          <button
            onClick={() => setDocsExpanded(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-sky-400"
          >
            <span className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" />
              {t(lang, 'chat_required_docs')} ({plan.required_documents.length})
            </span>
            {docsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {docsExpanded && (
            <div className="px-3 pb-2 space-y-1.5">
              {plan.required_documents.map((doc, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${doc.mandatory ? 'bg-red-400' : 'bg-slate-500'}`} />
                  <div>
                    <p className="text-xs font-medium text-slate-200">{doc.name}</p>
                    {doc.purpose && <p className="text-xs text-slate-500">{doc.purpose}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Steps */}
      {plan.steps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {t(lang, 'chat_action_plan')}
          </p>
          {plan.steps.map(step => (
            <div key={step.step_number} className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-400">
                {step.step_number}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">{step.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                {step.portal_or_url && (
                  <a
                    href={step.portal_or_url.startsWith('http') ? step.portal_or_url : `https://${step.portal_or_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 mt-0.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {step.portal_or_url}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CitationsPanel({ citations, lang }: { citations: CitationItem[]; lang: string }) {
  if (!citations.length) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
        <FileText className="w-3 h-3" /> {t(lang, 'chat_sources')}
      </p>
      <div className="space-y-1.5">
        {citations.map(c => (
          <div key={c.id} className="px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-0.5">
              <a
                href={documentFileUrl(c.document_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-sky-400 hover:text-sky-300 hover:underline truncate"
                title={tFmt(lang, 'chat_open_source', { page: String(c.page_number) })}
              >
                {c.document_name || 'Document'}
              </a>
              <span className="text-xs text-slate-600">{tFmt(lang, 'chat_source_page', { page: String(c.page_number) })}</span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2 italic">"{c.snippet}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg, lang, speakingMsgId, setSpeakingMsgId, isSpeaking, onSpeakingChange }: { msg: ChatMessage; lang: string; speakingMsgId: string | null; setSpeakingMsgId: Dispatch<SetStateAction<string | null>>; isSpeaking: boolean; onSpeakingChange: (on: boolean) => void }) {
  const isUser = msg.role === 'user';
  const [insightOpen, setInsightOpen] = useState(true); // insights visible by default
  const [feedbackSent, setFeedbackSent] = useState<number | null>(null);
  const hasInsights = msg.eligibility || msg.action_plan || msg.citations.length > 0;

  async function sendFeedback(rating: number) {
    try {
      await apiFeedback(msg.id, rating);
      setFeedbackSent(rating);
    } catch { /* ignore */ }
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 text-slate-200 text-sm leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col mb-5">
      <div className="flex items-start gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Brain className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1">
          <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3">
            {/* Confidence badge */}
            {msg.confidence_score < 1 && (
              <div className={`flex items-center gap-1.5 text-xs mb-2 ${msg.needs_verification ? 'text-amber-400' : 'text-green-400'}`}>
                {msg.needs_verification ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                {msg.needs_verification ? t(lang, 'chat_verify') : `${(msg.confidence_score * 100).toFixed(0)}${t(lang, 'chat_confidence')}`}
              </div>
            )}
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 mt-1.5 ml-1">
            <button
              onClick={() => {
                // If ANY voice is playing (auto reply or another message), this click STOPS it.
                if (speakingMsgId === msg.id || isSpeaking) {
                  setSpeakingMsgId(null);
                  onSpeakingChange(false);
                  stopSpeaking();
                } else {
                  setSpeakingMsgId(msg.id);
                  onSpeakingChange(true);
                  void speak(msg.content, lang).finally(() => {
                    setSpeakingMsgId(cur => cur === msg.id ? null : cur);
                    onSpeakingChange(false);
                  });
                }
              }}
              className={`p-1.5 rounded-lg transition-all ${
                speakingMsgId === msg.id || isSpeaking
                  ? 'text-orange-400 bg-orange-500/15 animate-pulse'
                  : 'text-slate-600 hover:text-orange-400 hover:bg-orange-500/10'
              }`}
              title={speakingMsgId === msg.id || isSpeaking ? t(lang, 'chat_stop_speaking') : t(lang, 'chat_read_aloud')}
            >
              {speakingMsgId === msg.id || isSpeaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            {hasInsights && (
              <button
                onClick={() => setInsightOpen(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  insightOpen ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t(lang, 'chat_insights')} {insightOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
            {!feedbackSent ? (
              <>
                <button onClick={() => sendFeedback(1)} className="p-1.5 rounded-lg text-slate-600 hover:text-green-400 hover:bg-green-500/10 transition-all" title={t(lang, 'chat_helpful')}>
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => sendFeedback(-1)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all" title={t(lang, 'chat_not_helpful')}>
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-600 px-2">{feedbackSent === 1 ? '👍 Thanks!' : '👎 Noted'}</span>
            )}
          </div>

          {/* Insights Panel */}
          {insightOpen && (
            <div className="ml-1 mt-2 glass-card rounded-2xl p-4 space-y-2">
              {msg.eligibility && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-orange-400" /> {t(lang, 'chat_eligibility')}
                  </p>
                  <EligibilityPanel elig={msg.eligibility} lang={lang} />
                </div>
              )}
              {msg.action_plan && <ActionPlanPanel plan={msg.action_plan} lang={lang} />}
              <CitationsPanel citations={msg.citations} lang={lang} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Chat Page ──────────────────────────────────────────────────────────

export default function ChatPage({ user, document, conversationId, onBack, onUserUpdate }: Props) {
  const onUserUpdateRef = useRef(onUserUpdate);
  onUserUpdateRef.current = onUserUpdate;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [convId, setConvId] = useState<string | null>(conversationId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lang] = useState(() => localStorage.getItem('bs_chat_lang') || user.preferred_language || 'en');
  const [loading, setLoading] = useState(!!conversationId);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [fallbackRecording, setFallbackRecording] = useState(false);
  const [micDevices, setMicDevices] = useState<Array<{ deviceId: string; label: string }>>([]);
  const [selectedMicDeviceId, setSelectedMicDeviceId] = useState('');
  // Which assistant message is currently being read aloud (speaker icon toggles to a stop square)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  // True while ANY voice output plays (auto reply or manual) so any speaker icon acts as Stop
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  function markSpeaking(on: boolean) {
    isSpeakingRef.current = on;
    setIsSpeaking(on);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [micVolume, setMicVolume] = useState(0);
  // Browser speech engines in some embedded browsers hang silently; remember and skip them
  // Prefer MediaRecorder + server transcription from the first attempt. Browser
  // SpeechRecognition can report "no-speech" after its own timeout and only
  // then start recording, which misses the words the user already spoke.
  const browserSRBrokenRef = useRef(false);
  const [voiceReply, setVoiceReply] = useState<boolean>(() => localStorage.getItem('bs_voice_reply') !== 'off');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { listening, startListening, stopListening } = useSpeech(lang);

  // Load existing conversation
  useEffect(() => {
    if (!conversationId) return;
    (async () => {
      try {
        const conv: any = await apiGetConversation(conversationId);
        setMessages(conv.messages || []);
        setConvId(conversationId);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Persist language selection so it survives page remounts and applies on next visit
  useEffect(() => {
    localStorage.setItem('bs_chat_lang', lang);
    if (user && user.preferred_language !== lang) {
      apiUpdateLanguage(lang).then(() => {
        const updated = { ...user, preferred_language: lang };
        localStorage.setItem('bs_user', JSON.stringify(updated));
        onUserUpdateRef.current?.(updated);
      }).catch(() => { /* best-effort */ });
    }
  }, [lang]);

  // Warm up the voice list (Chrome loads voices asynchronously)
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // Leaving the chat (any path) must silence voice output
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const question = (text || input).trim();
    if (!question || sending) return;
    setInput('');
    setSending(true);

    // Optimistic user bubble
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: convId || '',
      role: 'user',
      content: question,
      language: lang,
      confidence_score: 1,
      needs_verification: false,
      created_at: new Date().toISOString(),
      citations: [],
      eligibility: null,
      action_plan: null,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const resp = await apiChat(question, document?.id || null, convId, lang, {});
      setConvId(resp.conversation_id);
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), resp]);
      // Auto voice reply in the selected language when enabled.
      // It counts as "the last message speaking" so the speaker icon can stop it.
      if (voiceReply && resp.content) {
        markSpeaking(true);
        setSpeakingMsgId(resp.id);
        void speak(resp.content, lang).finally(() => {
          markSpeaking(false);
          setSpeakingMsgId(cur => cur === resp.id ? null : cur);
        });
      }
    } catch (err) {
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), {
        ...tempMsg,
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${(err as Error).message || 'Failed to get response. Please try again.'}`,
        confidence_score: 0,
        needs_verification: true,
      }]);
    } finally {
      setSending(false);
    }
  }, [input, sending, convId, document, lang, voiceReply]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const handleVoiceRef = useRef<() => void>(() => {});

  function handleVoice() {
    if (listening || fallbackRecording) {
      stopListening();
      stopFallbackRecording();
      setFallbackRecording(false);
      setMicVolume(0);
    } else {
      setVoiceError(null);
      setMicVolume(0);
      // If the browser engine hung before, go straight to the reliable server STT
      if (browserSRBrokenRef.current) {
        setFallbackRecording(true);
        recordAndTranscribe(lang, setFallbackRecording, setMicVolume, 12000, selectedMicDeviceId || undefined, setMicDevices).then(text => {
          setMicVolume(0);
          if (text && text.trim()) {
            setInput(text.trim());
          } else {
            setVoiceError('No speech detected — please speak clearly into your mic.');
          }
        }).catch((err: Error) => {
          setFallbackRecording(false);
          setMicVolume(0);
          setVoiceError(friendlyMicError(err));
        });
        return;
      }
      startListening(
        text => {
          setInput(text);
        },
        _code => {
          // Fall back to local server STT recording via getUserMedia for any browser SpeechRecognition issue
          browserSRBrokenRef.current = true;
          setVoiceError(null);
          setFallbackRecording(true);
          recordAndTranscribe(lang, setFallbackRecording, setMicVolume, 12000, selectedMicDeviceId || undefined, setMicDevices).then(text => {
            setVoiceError(null);
            setMicVolume(0);
            if (text && text.trim()) {
              setInput(text.trim());
            } else {
              setVoiceError('No speech detected — please speak clearly into your mic.');
            }
          }).catch((err: Error) => {
            setFallbackRecording(false);
            setMicVolume(0);
            setVoiceError(friendlyMicError(err));
          });
        }
      );
    }
  }
  handleVoiceRef.current = handleVoice;

  // Role- and document-aware suggestions from the backend (localized to the chat language)
  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    apiChatSuggestions(document?.id || null, lang)
      .then(res => { if (!cancelled) setSuggestions(res.questions || []); })
      .catch(() => {
        if (!cancelled) setSuggestions([
          t(lang, 'suggest_eligible'),
          t(lang, 'suggest_documents'),
          t(lang, 'suggest_deadline'),
          t(lang, 'suggest_how_apply'),
        ]);
      });
    return () => { cancelled = true; };
  }, [document?.id, lang]);

  const chatDescText = document
    ? tFmt(lang, 'chat_ask_with_doc', { filename: document.filename })
    : t(lang, 'chat_ask_without_doc');

  const placeholderText = tFmt(lang, 'chat_input_placeholder', { lang: LANGUAGES[lang] || 'English' });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="glass-panel border-b border-white/5 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button
          id="chat-back-btn"
          onClick={() => { stopSpeaking(); onBack(); }}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/40 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{t(lang, 'chat_header')}</p>
          <p className="text-xs text-slate-500 truncate">
            {document ? `📄 ${document.filename}` : t(lang, 'chat_general')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language is chosen at register / dashboard — shown read-only here */}
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <Globe className="w-3.5 h-3.5 text-slate-600" />
            {LANGUAGES[lang] || 'English'}
          </span>
          {/* Convert chat to document */}
          {convId && (
            <button
              id="chat-export-btn"
              onClick={async () => {
                try {
                  await apiExportConversation(convId);
                } catch { /* ignore */ }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-400 hover:bg-sky-500/10 transition-all"
              title="Download this conversation as a document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Convert to Document</span>
            </button>
          )}
          <button
            onClick={() => {
              if (voiceReply) stopSpeaking();
              setVoiceReply(v => !v);
            }}
            className={`p-1.5 rounded-lg transition-all ${
              voiceReply ? 'text-orange-400 bg-orange-500/10' : 'text-slate-600 hover:text-slate-400'
            }`}
            title={voiceReply ? `Voice replies ON (${LANGUAGES[lang] || 'English'})` : `Voice replies OFF (${LANGUAGES[lang] || 'English'})`}
          >
            {voiceReply ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => stopSpeaking()}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 transition-all"
            title={t(lang, 'chat_stop_speaking')}
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-600">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> {t(lang, 'chat_loading_conv')}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t(lang, 'chat_ask_title')}</h2>
            <p className="text-slate-500 text-sm mb-8 max-w-sm">
              {chatDescText}
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestions.map((text, i) => (
                <button
                  key={i}
                  id={`suggest-btn-${i}`}
                  onClick={() => sendMessage(text)}
                  className="px-3 py-2 rounded-xl text-sm bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:border-orange-500/30 hover:text-orange-300 transition-all"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} lang={lang} speakingMsgId={speakingMsgId} setSpeakingMsgId={setSpeakingMsgId} isSpeaking={isSpeaking} onSpeakingChange={markSpeaking} />
            ))}
            {sending && (
              <div className="flex items-start gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input Bar */}
      <div className="glass-panel border-t border-white/5 px-4 py-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          {voiceError && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1">{voiceError}</span>
              <button onClick={() => setVoiceError(null)} className="text-amber-500 hover:text-amber-300 ml-2">✕</button>
              <button
                onClick={() => { setVoiceError(null); handleVoice(); }}
                className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {(listening || fallbackRecording) && (
            <div className="mb-2 flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="font-medium">Listening... Speak now, tap mic when done</span>
              </div>
              {/* CSS animated waveform bars — always bounce while recording */}
              <div className="flex items-center gap-[3px]" style={{ height: '18px' }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-red-400"
                    style={{
                      height: `${Math.max(3, Math.round(micVolume / 100 * (10 + (i % 3) * 3)))}px`,
                      transition: 'height 80ms ease-out',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                id="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                rows={1}
                className="w-full px-4 py-3 pr-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 resize-none transition-all text-sm"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={e => {
                  const tgt = e.currentTarget;
                  tgt.style.height = 'auto';
                  tgt.style.height = Math.min(tgt.scrollHeight, 120) + 'px';
                }}
              />
            </div>

            {micDevices.length > 1 && (
              <select
                aria-label="Microphone input"
                value={selectedMicDeviceId}
                onChange={e => setSelectedMicDeviceId(e.target.value)}
                disabled={fallbackRecording}
                className="max-w-40 h-11 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 px-2 text-xs"
                title="Choose microphone input"
              >
                <option value="">Default microphone</option>
                {micDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                ))}
              </select>
            )}

            {/* Voice button */}
            <button
              id="voice-btn"
              onClick={handleVoice}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
                (listening || fallbackRecording)
                  ? 'bg-red-500 text-white pulse-recording shadow-lg shadow-red-500/30'
                  : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600/60 hover:text-slate-200'
              }`}
              title={(listening || fallbackRecording) ? t(lang, 'chat_stop_recording') : t(lang, 'chat_voice_input')}
            >
              {(listening || fallbackRecording) ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send button */}
            <button
              id="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-lg hover:shadow-orange-500/25 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-700 mt-2 text-center">
            {t(lang, 'chat_footer_note')}
          </p>
        </div>
      </div>
    </div>
  );
}
