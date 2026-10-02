import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UploadCloud, FileText, Trash2, MessageCircle, Brain,
  LogOut, Globe, CheckCircle, XCircle, Clock, AlertCircle,
  ChevronRight, RefreshCw, User as UserIcon, Settings2
} from 'lucide-react';
import { apiListDocuments, apiUploadDocument, apiDeleteDocument, apiListConversations, apiUpdateLanguage } from '../api';
import type { BharatDocument, ConversationSummary, User } from '../types';
import { LANGUAGES } from '../types';
import { t } from '../i18n';

interface Props {
  user: User;
  onStartChat: (doc: BharatDocument | null, convId?: string) => void;
  onLogout: () => void;
  onUserUpdate: (u: User) => void;
  onOpenProfile: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardPage({ user, onStartChat, onLogout, onUserUpdate, onOpenProfile }: Props) {
  const [docs, setDocs] = useState<BharatDocument[]>([]);
  const [convs, setConvs] = useState<ConversationSummary[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'docs' | 'convs'>('docs');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lang = user.preferred_language || 'en';

  const STATUS_ICON: Record<string, React.ReactNode> = {
    READY: <CheckCircle className="w-4 h-4 text-green-400" />,
    PROCESSING: <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />,
    PENDING: <Clock className="w-4 h-4 text-slate-400" />,
    FAILED: <XCircle className="w-4 h-4 text-red-400" />,
  };

  const STATUS_LABEL: Record<string, string> = {
    READY: t(lang, 'dash_status_ready'),
    PROCESSING: t(lang, 'dash_status_processing'),
    PENDING: t(lang, 'dash_status_pending'),
    FAILED: t(lang, 'dash_status_failed'),
  };

  const refresh = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([apiListDocuments(), apiListConversations()]);
      setDocs(d);
      setConvs(c);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleFile(file: File) {
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isImage = /^image\/(png|jpe?g|webp|bmp|gif|tiff?)$/.test(file.type);
    if (!isPdf && !isImage) {
      setUploadErr('Only PDF or image files (PNG, JPG, WEBP, BMP, TIFF) are supported.');
      return;
    }
    setUploadErr(null);
    setUploading(true);
    try {
      const doc = await apiUploadDocument(file);
      setDocs(prev => [doc, ...prev]);
      // Poll for processing
      let tries = 0;
      const poll = setInterval(async () => {
        tries++;
        try {
          const all = await apiListDocuments();
          setDocs(all);
          const updated = all.find(d => d.id === doc.id);
          if (!updated || updated.status === 'READY' || updated.status === 'FAILED' || tries > 20) {
            clearInterval(poll);
          }
        } catch { clearInterval(poll); }
      }, 2000);
    } catch (err: unknown) {
      setUploadErr((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDeleteDocument(id);
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch { /* ignore */ }
  }

  async function handleLangChange(newLang: string) {
    try {
      await apiUpdateLanguage(newLang);
      const updated = { ...user, preferred_language: newLang };
      localStorage.setItem('bs_user', JSON.stringify(updated));
      // Keep the chat page's persisted language in sync
      localStorage.setItem('bs_chat_lang', newLang);
      onUserUpdate(updated);
    } catch { /* ignore */ }
  }

  const readyDocs = docs.filter(d => d.status === 'READY');

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      {/* Top Nav */}
      <header className="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">BharatSahay <span className="text-orange-400">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" />
            <select
              id="dashboard-lang-select"
              value={lang}
              onChange={e => handleLangChange(e.target.value)}
              className="bg-transparent text-sm text-slate-300 border-none outline-none cursor-pointer"
            >
              {Object.entries(LANGUAGES).map(([code, label]) => (
                <option key={code} value={code} className="bg-slate-800">{label}</option>
              ))}
            </select>
          </div>
          <button
            id="dashboard-profile-btn"
            onClick={onOpenProfile}
            className="flex items-center gap-2 text-sm rounded-full pl-1 pr-3 py-1 hover:bg-slate-700/40 transition-all"
            title="Open my profile"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
              <UserIcon className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <span className="text-slate-400 hidden sm:block">{user.name}</span>
            <Settings2 className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <button
            id="dashboard-logout-btn"
            onClick={onLogout}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">
            {t(lang, 'dash_welcome')} <span className="text-orange-400">{user.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500">{t(lang, 'dash_upload_hint')} {LANGUAGES[lang] || 'English'}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t(lang, 'dash_documents'), value: docs.length, icon: <FileText className="w-4 h-4 text-sky-400" />, color: 'sky' },
            { label: t(lang, 'dash_ready'), value: readyDocs.length, icon: <CheckCircle className="w-4 h-4 text-green-400" />, color: 'green' },
            { label: t(lang, 'dash_conversations'), value: convs.length, icon: <MessageCircle className="w-4 h-4 text-violet-400" />, color: 'violet' },
            { label: t(lang, 'dash_language'), value: LANGUAGES[lang]?.split(' ')[0] || 'English', icon: <Globe className="w-4 h-4 text-orange-400" />, color: 'orange' },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{stat.label}</span>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Upload Drop Zone */}
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all mb-8 cursor-pointer ${
            dragOver
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            id="doc-upload-input"
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp,image/bmp,image/tiff"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />
          <div className="py-10 flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
                </div>
                <p className="text-slate-300 font-medium">{t(lang, 'dash_uploading')}</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-slate-700/60 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-300 font-medium text-center">{t(lang, 'dash_drop_pdf')} <span className="text-orange-400">{t(lang, 'dash_click_upload')}</span></p>
                  <p className="text-slate-600 text-sm text-center mt-1">{t(lang, 'dash_upload_hint2')}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {uploadErr && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {uploadErr}
          </div>
        )}

        {/* Quick Chat (no doc) */}
        <div className="mb-6">
          <button
            id="quick-chat-btn"
            onClick={() => onStartChat(null)}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-sky-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-violet-400" />
              <div className="text-left">
                <p className="font-semibold text-slate-200">{t(lang, 'dash_general_chat')}</p>
                <p className="text-sm text-slate-500">{t(lang, 'dash_general_chat_hint')}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800/40 rounded-xl mb-4 w-fit">
          {(['docs', 'convs'] as const).map(tabVal => (
            <button
              key={tabVal}
              id={`tab-${tabVal}-btn`}
              onClick={() => setTab(tabVal)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === tabVal ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tabVal === 'docs' ? `${t(lang, 'dash_documents')} (${docs.length})` : `${t(lang, 'dash_conversations')} (${convs.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-600">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> {t(lang, 'dash_loading')}
          </div>
        ) : tab === 'docs' ? (
          <div className="space-y-3">
            {docs.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{t(lang, 'dash_no_docs')}</p>
              </div>
            ) : (
              docs.map(doc => (
                <div key={doc.id} className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-slate-600/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.filename}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{formatBytes(doc.file_size)}</span>
                      {doc.page_count > 0 && <span>{doc.page_count} pages</span>}
                      <span>{timeAgo(doc.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    {STATUS_ICON[doc.status]}
                    <span className={doc.status === 'READY' ? 'text-green-400' : doc.status === 'FAILED' ? 'text-red-400' : 'text-slate-400'}>
                      {STATUS_LABEL[doc.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'READY' && (
                      <button
                        id={`chat-doc-btn-${doc.id}`}
                        onClick={() => onStartChat(doc)}
                        className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition-all flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {t(lang, 'dash_chat')}
                      </button>
                    )}
                    <button
                      id={`delete-doc-btn-${doc.id}`}
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {convs.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{t(lang, 'dash_no_convs')}</p>
              </div>
            ) : (
              convs.map(c => (
                <div
                  key={c.id}
                  className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-slate-600/60 transition-all cursor-pointer"
                  onClick={() => onStartChat(null, c.id)}
                  id={`conv-item-${c.id}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.message_count} messages · {timeAgo(c.created_at)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
