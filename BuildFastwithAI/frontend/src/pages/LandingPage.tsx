import { useState } from 'react';
import {
  Globe, FileText, Zap, ShieldCheck, Mic, ChevronRight,
  Brain, Target, MessageSquare, Database, Users, Cpu, Workflow
} from 'lucide-react';
import { LANGUAGES } from '../types';
import { t } from '../i18n';

interface Props {
  onGetStarted: () => void;
}

const langEntries = Object.entries(LANGUAGES);

export default function LandingPage({ onGetStarted }: Props) {
  const [lang, setLang] = useState('en');

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">BharatSahay <span className="text-orange-400">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#solution" className="hover:text-slate-100 transition-colors">Solution</a>
            <a href="#tech" className="hover:text-slate-100 transition-colors">How it works</a>
            <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
          </div>
          <div className="flex items-center gap-3">
            {/* Language picker on landing page */}
            <div className="hidden md:flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <select
                id="landing-lang-select"
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="bg-transparent text-xs text-slate-400 border-none outline-none cursor-pointer"
              >
                {langEntries.map(([code, label]) => (
                  <option key={code} value={code} className="bg-slate-800">{label}</option>
                ))}
              </select>
            </div>
            <button
              id="nav-get-started-btn"
              onClick={onGetStarted}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm hover:from-orange-400 hover:to-amber-400 transition-all shadow-lg hover:shadow-orange-500/25 active:scale-95"
            >
              {t(lang, 'nav_get_started')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-sky-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400">
              {t(lang, 'chat_header')}
            </span>
            <br />
            <span className="text-slate-100">{t(lang, 'hero_subtitle_1')}</span>
            <br />
            <span className="text-slate-400">{t(lang, 'hero_subtitle_2')}</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t(lang, 'hero_desc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              id="hero-start-btn"
              onClick={onGetStarted}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-lg hover:from-orange-400 hover:to-amber-400 transition-all shadow-xl hover:shadow-orange-500/30 active:scale-95 flex items-center justify-center gap-2"
            >
              {t(lang, 'hero_start_free')} <ChevronRight className="w-5 h-5" />
            </button>
            <button
              id="hero-demo-btn"
              onClick={onGetStarted}
              className="px-8 py-4 rounded-2xl border border-slate-600 text-slate-300 font-semibold text-lg hover:border-slate-400 hover:text-slate-100 transition-all flex items-center justify-center gap-2"
            >
              <Mic className="w-5 h-5 text-orange-400" />
              {t(lang, 'hero_voice_demo')}
            </button>
          </div>
        </div>

        {/* Floating language chips */}
        <div className="mt-16 flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
          {langEntries.map(([code, label]) => (
            <span
              key={code}
              onClick={() => setLang(code)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-all cursor-pointer ${
                lang === code
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-orange-500/50 hover:text-orange-300'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-slate-800">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '13+', label: t(lang, 'stat_languages') },
            { value: '1000+', label: t(lang, 'stat_schemes') },
            { value: '< 5s', label: t(lang, 'stat_analysis_time') },
            { value: '99%', label: t(lang, 'stat_grounded') },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-extrabold text-orange-400 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Solution Overview — deck slide 3 */}
      <section id="solution" className="py-24 px-6 bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-medium">
              SOLUTION OVERVIEW
            </div>
          </div>
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center mb-8">
            <div className="text-orange-400 font-bold text-sm uppercase tracking-widest mb-3">BharatSahay AI</div>
            <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-slate-100">
              A multilingual, voice-first AI action assistant that understands Indian languages, reads complex documents, and turns information into clear, personalized next steps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="font-bold text-lg text-slate-200">WHAT THE USER DOES</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Speaks or types a question in Tamil, English or Tanglish and can upload a PDF, notice or form.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="font-bold text-lg text-slate-200">WHAT THEY GET BACK</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                A grounded answer with source references + eligibility, required documents, deadlines and a simple step-by-step action plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Approach — deck slide 4 */}
      <section id="tech" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-sm font-medium mb-4">
              TECHNICAL APPROACH
            </div>
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-bold text-lg">MODELS</h3>
              </div>
              <ul className="space-y-3 text-slate-400 text-sm leading-relaxed">
                <li className="flex gap-2"><span className="text-orange-400">•</span><span><b className="text-slate-200">Multilingual LLM</b> — understands Tamil, English & Tanglish and generates responses.</span></li>
                <li className="flex gap-2"><span className="text-orange-400">•</span><span><b className="text-slate-200">Embedding + Reranker models</b> — find the most relevant information from documents.</span></li>
                <li className="flex gap-2"><span className="text-orange-400">•</span><span><b className="text-slate-200">Speech-to-Text / Text-to-Speech</b> — enables natural voice interaction.</span></li>
              </ul>
            </div>
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Workflow className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-bold text-lg">TOOLS & FRAMEWORKS</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Python + FastAPI + Streamlit + RAG + Vector Database
              </p>
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 font-mono text-xs text-sky-300 leading-relaxed">
                Document Parser → Embeddings → Vector Search → LLM → Source-grounded Answer + Action Plan
              </div>
            </div>
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-bold text-lg">DATA</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Public government/education documents + sample PDFs/forms + curated multilingual Tamil/English/Tanglish queries for testing.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="font-bold text-lg">HUMAN APPROVAL</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Low-confidence or sensitive responses are flagged for human verification before being presented as definitive guidance.
              </p>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <span className="text-xs uppercase tracking-widest text-slate-500 block mb-2">architecture</span>
            <div className="font-mono text-sm text-orange-300">
              Voice/Text → Language Understanding → RAG → LLM → Evidence → Action Plan → Voice/Text
            </div>
          </div>
        </div>
      </section>

      {/* Key Features — deck slide 5 */}
      <section id="features" className="py-24 px-6 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-medium">
              KEY FEATURES
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                icon: <Mic className="w-6 h-6 text-orange-400" />,
                title: 'Voice in Your Language',
                desc: 'Speak naturally in Tamil, English or Tanglish and get an instant response.',
              },
              {
                num: '02',
                icon: <FileText className="w-6 h-6 text-sky-400" />,
                title: 'Document Intelligence',
                desc: 'Upload a PDF, notification or form and ask questions directly from it.',
              },
              {
                num: '03',
                icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
                title: 'Trusted RAG Answers',
                desc: 'Get answers grounded in the document with relevant source/page references.',
              },
              {
                num: '04',
                icon: <Target className="w-6 h-6 text-violet-400" />,
                title: 'Personalized Eligibility Check',
                desc: 'Tell us your situation and get eligibility, requirements and relevant information clearly explained.',
              },
              {
                num: '05',
                icon: <Zap className="w-6 h-6 text-amber-400" />,
                title: 'Action Planner',
                desc: 'Converts complex information into documents needed, deadlines and step-by-step next actions.',
              },
            ].map(f => (
              <div
                key={f.num}
                className="glass-card rounded-2xl p-6 hover:border-slate-600/60 transition-all group relative overflow-hidden"
              >
                <span className="absolute top-4 right-5 text-4xl font-extrabold text-slate-800/80 group-hover:text-orange-500/20 transition-colors font-mono">
                  {f.num}
                </span>
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 bg-slate-900/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t(lang, 'how_title')}</h2>
            <p className="text-slate-400 text-lg">{t(lang, 'how_subtitle')}</p>
          </div>
          <div className="space-y-6">
            {[
              {
                step: '01',
                title: t(lang, 'how_step1_title'),
                desc: t(lang, 'how_step1_desc'),
                icon: <FileText className="w-5 h-5" />,
              },
              {
                step: '02',
                title: t(lang, 'how_step2_title'),
                desc: t(lang, 'how_step2_desc'),
                icon: <MessageSquare className="w-5 h-5" />,
              },
              {
                step: '03',
                title: t(lang, 'how_step3_title'),
                desc: t(lang, 'how_step3_desc'),
                icon: <Zap className="w-5 h-5" />,
              },
            ].map((step, i) => (
              <div key={step.step} className="flex gap-6 items-start glass-card rounded-2xl p-6">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 flex flex-col items-center justify-center">
                  <span className="text-xs text-orange-400 font-mono font-bold">{step.step}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex ml-auto self-center text-slate-700">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-slate-600 text-sm">
        <p>© 2026 BharatSahay AI · Built with ❤️ for Bharat</p>
      </footer>
    </div>
  );
}
