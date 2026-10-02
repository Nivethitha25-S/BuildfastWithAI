import { useState } from 'react';
import { Brain, Eye, EyeOff, ArrowLeft, Globe, GraduationCap, Users, Tractor, Briefcase } from 'lucide-react';
import { apiLogin, apiRegister } from '../api';
import type { TokenResponse } from '../types';
import { LANGUAGES } from '../types';
import { t } from '../i18n';

const ROLES = [
  { value: 'student', descKey: 'auth_role_student_desc', icon: GraduationCap },
  { value: 'citizen', descKey: 'auth_role_citizen_desc', icon: Users },
  { value: 'farmer', descKey: 'auth_role_farmer_desc', icon: Tractor },
  { value: 'business', descKey: 'auth_role_business_desc', icon: Briefcase },
] as const;

interface Props {
  onSuccess: (token: string, data: TokenResponse, isRegister: boolean) => void;
  onBack: () => void;
}

const langOptions = Object.entries(LANGUAGES);

export default function AuthPage({ onSuccess, onBack }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('citizen');
  // Start from the language the user chose before (or profile/chat preference)
  const [lang, setLang] = useState(() => localStorage.getItem('bs_chat_lang') || 'en');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let data: TokenResponse;
      if (mode === 'login') {
        data = await apiLogin(email, password);
      } else {
        data = await apiRegister(name, email, password, lang, role);
      }
      localStorage.setItem('bs_token', data.access_token);
      localStorage.setItem('bs_user', JSON.stringify({
        id: data.user_id,
        name: data.name,
        email: data.email,
        preferred_language: data.preferred_language,
        role: data.role,
        created_at: new Date().toISOString(),
      }));
      localStorage.setItem('bs_chat_lang', data.preferred_language);
      onSuccess(data.access_token, data, mode === 'register');
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Back */}
        <button
          id="auth-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t(lang, 'auth_back')}
        </button>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg leading-tight">BharatSahay <span className="text-orange-400">AI</span></div>
                <div className="text-xs text-slate-500">{t(lang, 'auth_subtitle')}</div>
              </div>
            </div>
            {/* Language picker */}
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <select
                id="auth-page-lang-select"
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="bg-transparent text-xs text-slate-400 border-none outline-none cursor-pointer"
              >
                {langOptions.map(([code, label]) => (
                  <option key={code} value={code} className="bg-slate-800">{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl mb-7">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                id={`auth-tab-${m}`}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'login' ? t(lang, 'auth_sign_in') : t(lang, 'auth_register')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">{t(lang, 'auth_full_name')}</label>
                <input
                  id="auth-name-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder={t(lang, 'auth_name_placeholder')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">{t(lang, 'auth_email')}</label>
              <input
                id="auth-email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">{t(lang, 'auth_password')}</label>
              <div className="relative">
                <input
                  id="auth-password-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                />
                <button
                  type="button"
                  id="auth-toggle-pw-btn"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">{t(lang, 'auth_i_am')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    const active = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        id={`auth-role-${r.value}`}
                        onClick={() => setRole(r.value)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-orange-500/15 border-orange-500/60 text-orange-300'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-orange-400' : 'text-slate-500'}`} />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-tight">{t(lang, `prof_role_${r.value}` as const)}</span>
                          <span className="block text-[10px] text-slate-500 leading-tight">{t(lang, r.descKey)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> {t(lang, 'auth_pref_language')}
                </label>
                <select
                  id="auth-lang-select"
                  value={lang}
                  onChange={e => setLang(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                >
                  {langOptions.map(([code, label]) => (
                    <option key={code} value={code}>{label} ({code})</option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-orange-500/25 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? t(lang, 'auth_signing_in') : t(lang, 'auth_creating')}
                </span>
              ) : (
                mode === 'login' ? t(lang, 'auth_sign_in') : t(lang, 'auth_create_account')
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === 'login' ? t(lang, 'auth_no_account') : t(lang, 'auth_have_account')}
            {' '}
            <button
              id="auth-switch-mode-btn"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              {mode === 'login' ? t(lang, 'auth_register') : t(lang, 'auth_sign_in')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
