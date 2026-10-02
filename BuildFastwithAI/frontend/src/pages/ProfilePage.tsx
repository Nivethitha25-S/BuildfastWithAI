import { useState } from 'react';
import type { ComponentType } from 'react';
import {
  GraduationCap, Users, Tractor, Briefcase, ArrowLeft,
  Save, Check, MapPin, School, IndianRupee, Landmark, Sprout,
  Droplets, Building2, Users2, ReceiptText, Layers, HeartHandshake,
  Globe, Pencil, X, Mail, CalendarDays,
} from 'lucide-react';
import { apiUpdateProfile } from '../api';
import type { User } from '../types';
import { LANGUAGES } from '../types';
import { t } from '../i18n';
import { PROFILE_OPTIONS, normalizeOptionValue, optionLabel } from '../profileOptions';
import type { ProfileOptionField } from '../profileOptions';

type Role = 'student' | 'citizen' | 'farmer' | 'business';
type Mode = 'view' | 'edit';

interface FieldDef {
  key: string;
  labelKey: 'fld_education_level' | 'fld_institution' | 'fld_state' | 'fld_annual_income' | 'fld_category' | 'fld_interests' | 'fld_city' | 'fld_age_group' | 'fld_occupation' | 'fld_district' | 'fld_land_size' | 'fld_crops' | 'fld_irrigation' | 'fld_business_name' | 'fld_business_type' | 'fld_employees' | 'fld_annual_turnover' | 'fld_gst_registered';
  icon: ComponentType<{ className?: string }>;
  placeholder: string;
  options?: ProfileOptionField;
}

const ROLE_META: Record<Role, {
  icon: ComponentType<{ className?: string }>;
  fields: FieldDef[];
}> = {
  student: {
    icon: GraduationCap,
    fields: [
      { key: 'education_level', labelKey: 'fld_education_level', icon: School, placeholder: 'Class 12, Undergraduate, PG', options: 'education_level' },
      { key: 'institution', labelKey: 'fld_institution', icon: Building2, placeholder: 'Government Arts College' },
      { key: 'state', labelKey: 'fld_state', icon: MapPin, placeholder: 'Tamil Nadu', options: 'state' },
      { key: 'annual_income', labelKey: 'fld_annual_income', icon: IndianRupee, placeholder: 'Below 2.5 lakh' },
      { key: 'category', labelKey: 'fld_category', icon: Layers, placeholder: 'General, OBC, SC, ST', options: 'category' },
      { key: 'interests', labelKey: 'fld_interests', icon: Sprout, placeholder: 'Engineering, Medicine', options: 'interests' },
    ],
  },
  citizen: {
    icon: Users,
    fields: [
      { key: 'state', labelKey: 'fld_state', icon: MapPin, placeholder: 'Karnataka', options: 'state' },
      { key: 'city', labelKey: 'fld_city', icon: Building2, placeholder: 'Mysuru' },
      { key: 'age_group', labelKey: 'fld_age_group', icon: Users2, placeholder: '18-25, 26-40, 60+' },
      { key: 'annual_income', labelKey: 'fld_annual_income', icon: IndianRupee, placeholder: 'Below 3 lakh' },
      { key: 'category', labelKey: 'fld_category', icon: Layers, placeholder: 'General, OBC, SC, ST', options: 'category' },
      { key: 'occupation', labelKey: 'fld_occupation', icon: HeartHandshake, placeholder: 'Homemaker, Retired' },
    ],
  },
  farmer: {
    icon: Tractor,
    fields: [
      { key: 'state', labelKey: 'fld_state', icon: MapPin, placeholder: 'Punjab', options: 'state' },
      { key: 'district', labelKey: 'fld_district', icon: MapPin, placeholder: 'Ludhiana' },
      { key: 'land_size', labelKey: 'fld_land_size', icon: Landmark, placeholder: '2 acres' },
      { key: 'crops', labelKey: 'fld_crops', icon: Sprout, placeholder: 'Wheat, Rice, Cotton' },
      { key: 'irrigation', labelKey: 'fld_irrigation', icon: Droplets, placeholder: 'Borewell, Canal, Rain-fed' },
      { key: 'annual_income', labelKey: 'fld_annual_income', icon: IndianRupee, placeholder: 'Below 1 lakh' },
    ],
  },
  business: {
    icon: Briefcase,
    fields: [
      { key: 'business_name', labelKey: 'fld_business_name', icon: Building2, placeholder: 'Sri Traders' },
      { key: 'business_type', labelKey: 'fld_business_type', icon: Briefcase, placeholder: 'Retail, Manufacturing, MSME' },
      { key: 'state', labelKey: 'fld_state', icon: MapPin, placeholder: 'Maharashtra', options: 'state' },
      { key: 'employees', labelKey: 'fld_employees', icon: Users2, placeholder: '1-10, 11-50' },
      { key: 'annual_turnover', labelKey: 'fld_annual_turnover', icon: IndianRupee, placeholder: 'Below 50 lakh' },
      { key: 'gst_registered', labelKey: 'fld_gst_registered', icon: ReceiptText, placeholder: 'Yes / No' },
    ],
  },
};

interface Props {
  user: User;
  onBack: () => void;
  onContinue: () => void;
  onUserUpdate: (u: User) => void;
}

function hasData(details: Record<string, string> | null | undefined): boolean {
  return !!details && Object.values(details).some(v => v && v.trim() !== '');
}

export default function ProfilePage({ user, onBack, onContinue, onUserUpdate }: Props) {
  const role: Role = (['student', 'citizen', 'farmer', 'business'] as const).includes(user.role as Role)
    ? (user.role as Role)
    : 'citizen';
  const [lang, setLang] = useState(user.preferred_language || 'en');
  const meta = ROLE_META[role];
  const RoleIcon = meta.icon;

  // First-time users (nothing saved yet) land in edit mode; returning users see their saved profile
  const [mode, setMode] = useState<Mode>(() => (hasData(user.profile_details) ? 'view' : 'edit'));
  const [saved, setSaved] = useState<Record<string, string>>(user.profile_details || {});
  const [draft, setDraft] = useState<Record<string, string>>(user.profile_details || {});
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: string, value: string) {
    setDraft(prev => ({ ...prev, [key]: value }));
    setJustSaved(false);
  }

  function startEdit() {
    setDraft({ ...saved });
    setName(user.name);
    setError(null);
    setMode('edit');
  }

  function cancelEdit() {
    setDraft({ ...saved });
    setName(user.name);
    setLang(user.preferred_language || 'en');
    setError(null);
    setMode('view');
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated: any = await apiUpdateProfile({
        name: name.trim() || user.name,
        preferred_language: lang,
        profile_details: draft,
      });
      const merged: User = { ...user, ...updated, profile_details: updated.profile_details || draft };
      localStorage.setItem('bs_chat_lang', lang);
      onUserUpdate(merged);
      setSaved({ ...draft });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      setMode('view');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function displayValue(f: FieldDef): string {
    const raw = saved[f.key];
    if (!raw || raw.trim() === '') return t(lang, 'prof_not_set');
    if (f.options) return optionLabel(f.options, raw, lang);
    return raw;
  }

  const filledCount = meta.fields.filter(f => saved[f.key] && saved[f.key].trim() !== '').length;

  return (
    <div className="min-h-screen bg-[#0f172a] px-4 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t(lang, 'prof_back')}
        </button>

        {/* Role header */}
        <div className="glass-panel rounded-3xl border border-slate-700/50 p-6 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg flex-shrink-0">
                <RoleIcon className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight">{t(lang, 'prof_title')}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-300 text-xs font-semibold">
                    {t(lang, `prof_role_${role}` as const)}
                  </span>
                  <span className="text-slate-500 text-xs truncate">{user.email}</span>
                </div>
              </div>
            </div>
            {mode === 'view' && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-600 text-slate-200 text-sm font-semibold hover:border-orange-500/60 hover:text-orange-300 transition-all flex-shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" /> {t(lang, 'prof_edit')}
              </button>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-4">{t(lang, 'prof_subtitle')}</p>
        </div>

        {/* Account details */}
        <div className="glass-panel rounded-3xl border border-slate-700/50 p-6 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">{t(lang, 'prof_account_details')}</h2>
          {mode === 'view' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400 mb-1"><UserGlyph /> {t(lang, 'prof_name')}</span>
                  <div className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-200 text-sm truncate">{user.name}</div>
                </div>
                <div>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400 mb-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {t(lang, 'prof_email')}</span>
                  <div className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-sm truncate">{user.email}</div>
                </div>
                <div>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400 mb-1"><CalendarDays className="w-3.5 h-3.5 text-slate-500" /> {t(lang, 'prof_member_since')}</span>
                  <div className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-sm">
                    {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400 mb-1"><Globe className="w-3.5 h-3.5 text-slate-500" /> {t(lang, 'prof_pref_language')}</span>
                  <div className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-200 text-sm">{LANGUAGES[lang] || lang}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="block text-sm font-medium text-slate-400 mb-1.5">{t(lang, 'prof_name')}</span>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setJustSaved(false); }}
                  minLength={2}
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-sm font-medium text-slate-400 mb-1.5">{t(lang, 'prof_email')}</span>
                  <div className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-sm truncate">{user.email}</div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-slate-400 mb-1.5">{t(lang, 'prof_member_since')}</span>
                  <div className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-sm">
                    {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <label className="block">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400 mb-1.5">
                  <Globe className="w-3.5 h-3.5" /> {t(lang, 'prof_pref_language')}
                </span>
                <select
                  value={lang}
                  onChange={e => { setLang(e.target.value); setJustSaved(false); }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                >
                  {Object.entries(LANGUAGES).map(([code, label]) => (
                    <option key={code} value={code}>{label} ({code})</option>
                  ))}
                </select>
                <span className="block text-xs text-slate-500 mt-1.5">{t(lang, 'prof_lang_hint')}</span>
              </label>
            </div>
          )}
        </div>

        {/* Role-specific fields */}
        <div className="glass-panel rounded-3xl border border-slate-700/50 p-6 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <RoleIcon className="w-3.5 h-3.5 text-orange-400" />
            {t(lang, `prof_role_${role}` as const)} {t(lang, 'prof_details_fmt')}
            {mode === 'view' && filledCount > 0 && (
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                {filledCount}/{meta.fields.length}
              </span>
            )}
          </h2>

          {mode === 'view' ? (
            filledCount === 0 ? (
              <p className="text-sm text-slate-500 py-2">{t(lang, 'prof_no_data')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {meta.fields.map(f => {
                  const Icon = f.icon;
                  const val = displayValue(f);
                  const empty = !saved[f.key] || saved[f.key].trim() === '';
                  return (
                    <div key={f.key}>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400 mb-1">
                        <Icon className="w-3.5 h-3.5 text-slate-500" /> {t(lang, f.labelKey)}
                      </span>
                      <div className={`px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-800 text-sm truncate ${empty ? 'text-slate-600 italic' : 'text-slate-100'}`}>
                        {val}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {meta.fields.map(f => {
                const Icon = f.icon;
                const dropdown = f.options
                  ? (PROFILE_OPTIONS[f.options] as readonly { value: string; label: Record<string, string> }[])
                  : null;
                const current = f.options ? normalizeOptionValue(f.options, draft[f.key]) : (draft[f.key] || '');
                return (
                  <label key={f.key} className="block">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-500" /> {t(lang, f.labelKey)}
                    </span>
                    {dropdown ? (
                      <select
                        value={dropdown.some(o => o.value === current) ? current : ''}
                        onChange={e => setField(f.key, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                      >
                        <option value="" className="bg-slate-800">— {t(lang, 'prof_select')} —</option>
                        {dropdown.map(o => (
                          <option key={o.value} value={o.value} className="bg-slate-800">
                            {o.label[lang] || o.label.en || o.value}
                          </option>
                        ))}
                        {!dropdown.some(o => o.value === current) && current !== '' && (
                          <option value={current} className="bg-slate-800">{current}</option>
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={draft[f.key] || ''}
                        onChange={e => setField(f.key, e.target.value)}
                        maxLength={300}
                        placeholder={`${t(lang, 'prof_eg')} ${f.placeholder}`}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
        {mode === 'edit' ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]"
            >
              {justSaved ? (
                <>
                  <Check className="w-4 h-4" /> {t(lang, 'prof_saved')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {saving ? t(lang, 'prof_saving') : t(lang, 'prof_save')}
                </>
              )}
            </button>
            <button
              onClick={cancelEdit}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 font-semibold hover:border-slate-500 transition-all active:scale-[0.98]"
            >
              <X className="w-4 h-4" /> {t(lang, 'prof_cancel')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={startEdit}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold hover:from-orange-400 hover:to-amber-400 transition-all shadow-lg active:scale-[0.98]"
            >
              <Pencil className="w-4 h-4" /> {t(lang, 'prof_edit')}
            </button>
            <button
              onClick={onContinue}
              className="flex-1 py-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 font-semibold hover:border-slate-500 transition-all active:scale-[0.98]"
            >
              {t(lang, 'prof_continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UserGlyph() {
  return (
    <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
