/**
 * Atlas Carbone - Vue Académie Bilan Carbone & Pédagogie Intégrée
 * Conforme à la Section 10 du Prompt Maître
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Search,
  Sparkles,
  FileCheck2
} from 'lucide-react';
import { api } from '../api.js';
import { Language, translations } from '../i18n.js';

interface AcademyViewProps {
  lang: Language;
  onNavigateAction?: (route: string) => void;
}

export const AcademyView: React.FC<AcademyViewProps> = ({ lang, onNavigateAction }) => {
  const t = translations[lang];
  const [modules, setModules] = useState<any[]>([]);
  const [glossary, setGlossary] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'modules' | 'glossary'>('modules');
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.content.getAcademyModules(lang),
      api.content.getGlossary(lang)
    ]).then(([mods, gloss]) => {
      setModules(mods);
      setGlossary(gloss);
      if (mods.length > 0) setSelectedModule(mods[0]);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [lang]);

  const handleSelectModule = (mod: any) => {
    setSelectedModule(mod);
    setQuizAnswer(null);
    setQuizSubmitted(false);
  };

  const filteredGlossary = glossary.filter(g =>
    g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête de section */}
      <div className="bg-gradient-to-r from-brand-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md">
        <div className="max-w-4xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-800/60 border border-brand-700/50 text-brand-300 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" />
            <span>FORMATION CONTINUE & MÉTHODOLOGIE BAS CARBONE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.acadTitle}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            {t.acadSubtitle}
          </p>
          <div className="pt-2 flex items-center space-x-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 p-2.5 rounded-xl">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              {lang === 'fr'
                ? "Rappel d’intégrité : Cette formation méthodologique interne renforce vos compétences et votre contrôle interne. Elle ne confère pas de certification professionnelle assermentée ni de conformité ISO 14065 sans vérification par un tiers accrédité."
                : "Integrity reminder: This internal training strengthens operational capabilities and internal control. It does not constitute accredited professional certification or ISO 14065 audit clearance without third-party inspection."}
            </span>
          </div>
        </div>
      </div>

      {/* Onglets Modules vs Glossaire */}
      <div className="flex space-x-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2 font-semibold text-sm rounded-xl transition flex items-center space-x-2 ${
            activeTab === 'modules'
              ? 'bg-brand-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t.acadTabModules} ({modules.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('glossary')}
          className={`px-4 py-2 font-semibold text-sm rounded-xl transition flex items-center space-x-2 ${
            activeTab === 'glossary'
              ? 'bg-brand-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t.acadTabGlossary}</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Chargement des contenus pédagogiques...</div>
      ) : activeTab === 'modules' ? (
        /* Vue Modules */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des 10 modules */}
          <div className="space-y-2 lg:col-span-1">
            {modules.map((m) => {
              const isSelected = selectedModule?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelectModule(m)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-start space-x-3 ${
                    isSelected
                      ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-brand-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {m.moduleNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-snug">{m.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{m.summary}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Détail du module sélectionné */}
          {selectedModule && (
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                  Module {selectedModule.moduleNumber} / {modules.length}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  {selectedModule.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 italic">
                  {selectedModule.summary}
                </p>
              </div>

              {/* Contenu explicatif */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-sm text-slate-700 leading-relaxed space-y-3">
                <p>{selectedModule.content}</p>
              </div>

              {/* Cas concret / Exemple */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Cas concret d’application</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  {selectedModule.example}
                </p>
              </div>

              {/* Quiz d'auto-évaluation */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-brand-700" />
                  <span className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    {t.acadBtnQuiz}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedModule.quizQuestion}
                </p>

                <div className="space-y-2">
                  {selectedModule.quizOptions.map((opt: string, idx: number) => {
                    const isPicked = quizAnswer === idx;
                    const isCorrect = idx === selectedModule.quizCorrectIndex;
                    let style = 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700';

                    if (quizSubmitted) {
                      if (isCorrect) style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                      else if (isPicked) style = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                    } else if (isPicked) {
                      style = 'bg-brand-50 border-brand-600 text-brand-900 font-bold';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswer(idx)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${style}`}
                      >
                        <span>{opt}</span>
                        {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                        {quizSubmitted && isPicked && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                {!quizSubmitted ? (
                  <button
                    disabled={quizAnswer === null}
                    onClick={() => setQuizSubmitted(true)}
                    className="px-4 py-2 bg-brand-800 hover:bg-brand-900 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    Valider ma réponse
                  </button>
                ) : (
                  <div className={`p-3.5 rounded-xl text-xs space-y-1 ${
                    quizAnswer === selectedModule.quizCorrectIndex ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    <p className="font-bold">
                      {quizAnswer === selectedModule.quizCorrectIndex
                        ? 'Bonne réponse !'
                        : 'Explication méthodologique :'}
                    </p>
                    <p>{selectedModule.quizExplanation}</p>
                  </div>
                )}
              </div>

              {/* Raccourci vers l'application */}
              <div className="pt-2 flex justify-end">
                {onNavigateAction && (
                  <button
                    onClick={() => onNavigateAction(selectedModule.actionLink)}
                    className="px-4 py-2 border border-brand-800 text-brand-800 hover:bg-brand-50 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <span>{t.acadBtnAction}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vue Glossaire */
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'fr' ? 'Rechercher un terme (ex: Scope 2, PRG, MACF)...' : 'Search term (e.g. Scope 2, GWP, CBAM)...'}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-700 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition space-y-1">
                <h3 className="font-bold text-xs text-brand-900 flex items-center space-x-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-brand-700" />
                  <span>{item.term}</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
