import type { TokenResponse, BharatDocument, ChatMessage, ConversationSummary } from './types';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('bs_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ── Auth ──────────────────────────────────────────────
export async function apiRegister(
  name: string,
  email: string,
  password: string,
  preferred_language = 'en',
  role = 'citizen'
): Promise<TokenResponse> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, preferred_language, role }),
  });
}

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiMe() {
  return request('/auth/me');
}

export async function apiUpdateLanguage(preferred_language: string) {
  return request('/auth/update-language', {
    method: 'POST',
    body: JSON.stringify({ preferred_language }),
  });
}

export async function apiUpdateProfile(payload: {
  name?: string;
  preferred_language?: string;
  profile_details?: Record<string, string>;
}) {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ── Documents ──────────────────────────────────────────
export async function apiUploadDocument(file: File): Promise<BharatDocument> {
  const form = new FormData();
  form.append('file', file);
  return request('/documents/upload', { method: 'POST', body: form });
}

export async function apiListDocuments(): Promise<BharatDocument[]> {
  return request('/documents');
}

export async function apiDeleteDocument(id: string): Promise<void> {
  return request(`/documents/${id}`, { method: 'DELETE' });
}

/** Authenticated URL for viewing the original uploaded document in a browser tab. */
export function documentFileUrl(id: string): string {
  const token = getToken();
  return `${BASE}/documents/${id}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

// ── Chat ──────────────────────────────────────────────
export async function apiChat(
  question: string,
  document_id: string | null,
  conversation_id: string | null,
  language: string,
  user_context: Record<string, unknown> = {}
): Promise<ChatMessage> {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ question, document_id, conversation_id, language, user_context }),
  });
}

export async function apiListConversations(): Promise<ConversationSummary[]> {
  return request('/chat/conversations');
}

// Server-side TTS: returns MP3 audio for the text in the given language.
// Falls back to browser speechSynthesis if the endpoint fails.
// Currently playing server-TTS audio so it can be stopped mid-playback.
// speakToken invalidates in-flight playbacks after a stop: stop bumps the token,
// and a pending fetch aborts instead of starting audio afterwards.
let currentTTSAudio: HTMLAudioElement | null = null;
let speakToken = 0;

export function stopServerTTS() {
  speakToken++;
  if (currentTTSAudio) {
    try {
      currentTTSAudio.pause();
      currentTTSAudio.src = '';
    } catch { /* ignore */ }
    currentTTSAudio = null;
  }
}

export async function speakServerTTS(text: string, lang: string): Promise<void> {
  const token = getToken();
  const url = `${BASE}/chat/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
  const myToken = ++speakToken;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (myToken !== speakToken) return; // stopped while fetching
  if (!res.ok) throw new Error(`TTS failed: HTTP ${res.status}`);
  const blob = await res.blob();
  if (myToken !== speakToken) return; // stopped just before playback
  if (!blob.size) throw new Error('TTS returned empty audio');
  const audioUrl = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(audioUrl);
      currentTTSAudio = audio;
      audio.onended = () => { if (currentTTSAudio === audio) currentTTSAudio = null; resolve(); };
      audio.onerror = () => { if (currentTTSAudio === audio) currentTTSAudio = null; reject(new Error('audio playback failed')); };
      audio.play().catch(reject);
    });
  } finally {
    if (currentTTSAudio) currentTTSAudio = null;
    URL.revokeObjectURL(audioUrl);
  }
}

export async function apiGetConversation(id: string) {
  return request(`/chat/conversations/${id}`);
}

// Download the whole conversation as a Word-compatible document.
export async function apiExportConversation(id: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE}/chat/conversations/${id}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dispo = res.headers.get('Content-Disposition') || '';
  const match = dispo.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
  a.download = match ? decodeURIComponent(match[1].replace(/"/g, '')) : 'bharatsahay-chat.doc';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Server-side STT: transcribe a recorded audio blob (raw PCM or WAV).
export async function apiSpeechToText(audio: Blob, lang: string): Promise<string> {
  const form = new FormData();
  form.append('file', audio, 'speech.pcm');
  return request(`/chat/stt?lang=${encodeURIComponent(lang)}`, {
    method: 'POST',
    body: form,
  }).then((r: any) => r.text);
}

// ── Feedback ──────────────────────────────────────────
export async function apiFeedback(message_id: string, rating: number, comment?: string) {
  return request('/feedback', {
    method: 'POST',
    body: JSON.stringify({ message_id, rating, comment }),
  });
}

// Role- and document-aware suggested questions for the chat page.
export async function apiChatSuggestions(documentId: string | null, lang = 'en'): Promise<{ role: string; questions: string[] }> {
  const params = new URLSearchParams();
  if (documentId) params.set('document_id', documentId);
  if (lang && lang !== 'en') params.set('lang', lang);
  const qs = params.toString();
  return request(`/chat/suggestions${qs ? `?${qs}` : ''}`);
}

// ── Health ────────────────────────────────────────────
export async function apiHealth(): Promise<{ status: string }> {
  return request('/health');
}
