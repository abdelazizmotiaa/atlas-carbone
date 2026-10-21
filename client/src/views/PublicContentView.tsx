/**
 * Atlas Carbone - Vue Contenus Publics (Guides Piliers & Actualités Réglementaires)
 * Conforme aux Sections 14, 15, 16 du Prompt Maître
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Newspaper,
  Calendar,
  Clock,
  ArrowRight,
  Search,
  ExternalLink,
  ShieldCheck,
  Globe2,
  Mail,
  Phone
} from 'lucide-react';
import { api } from '../api.js';
import { Language, translations, formatDate } from '../i18n.js';

interface PublicContentViewProps {
  lang: Language;
  initialTab?: 'guides' | 'news';
  onSelectAction?: (action: string) => void;
}

export const PublicContentView: React.FC<PublicContentViewProps> = ({
  lang,
  initialTab = 'guides',
  onSelectAction
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'guides' | 'news'>(initialTab);
  const [guides, setGuides] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.content.getGuides(lang),
      api.content.getNews(lang)
    ]).then(([gList, nList]) => {
      setGuides(gList);
      setNews(nList);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [lang]);

  const handleReadGuide = async (slug: string) => {
    try {
      const g = await api.content.getGuide(slug);
      setSelectedGuide(g);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert("Erreur chargement guide: " + err.message);
    }
  };

  const handleReadArticle = async (slug: string) => {
    try {
      const art = await api.content.getNewsArticle(slug);
      setSelectedArticle(art);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert("Erreur chargement article: " + err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      {/* Barre de sélection d'onglet */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex space-x-3">
          <button
            onClick={() => { setActiveTab('guides'); setSelectedGuide(null); setSelectedArticle(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
              activeTab === 'guides'
                ? 'bg-brand-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{lang === 'en' ? 'Pillar Methodology Guides' : 'Guides Méthodologiques Piliers'} ({guides.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('news'); setSelectedGuide(null); setSelectedArticle(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
              activeTab === 'news'
                ? 'bg-brand-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>{lang === 'en' ? 'Regulatory News & CBAM' : 'Actualités & Veille MACF'} ({news.length})</span>
          </button>
        </div>

        {/* Coordonnées officielles */}
        <div className="hidden sm:flex items-center space-x-4 text-xs text-slate-500">
          <a href="mailto:abdelaziz.motiaa@gmail.com" className="flex items-center space-x-1 hover:text-brand-800">
            <Mail className="w-3.5 h-3.5 text-brand-700" />
            <span>abdelaziz.motiaa@gmail.com</span>
          </a>
          <a href="tel:+212671581167" className="flex items-center space-x-1 hover:text-brand-800">
            <Phone className="w-3.5 h-3.5 text-brand-700" />
            <span>+212 671 581 167</span>
          </a>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Chargement des publications...</div>
      ) : activeTab === 'guides' ? (
        selectedGuide ? (
          /* Vue Lecture d'un Guide */
          <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md space-y-6 max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedGuide(null)}
              className="text-xs text-brand-800 hover:underline font-bold flex items-center space-x-1"
            >
              <span>← Retour à la liste des guides</span>
            </button>

            <div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 uppercase">
                {selectedGuide.category} • {selectedGuide.readingTimeMinutes} min de lecture
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {selectedGuide.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1 italic">
                {selectedGuide.summary}
              </p>
            </div>

            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-4 border-t border-slate-100 pt-6">
              {selectedGuide.content.split('\n\n').map((paragraph: string, i: number) => {
                if (paragraph.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-bold text-slate-900 pt-4">{paragraph.replace('## ', '')}</h2>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={i} className="text-sm font-bold text-slate-800 pt-2">{paragraph.replace('### ', '')}</h3>;
                }
                return <p key={i}>{paragraph}</p>;
              })}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Auteur : Abdelaziz Motiaa • Méthodologie Bilan Carbone Maroc</span>
              <button
                onClick={() => setSelectedGuide(null)}
                className="text-brand-800 font-bold hover:underline"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          /* Liste des 6 Guides */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((g) => (
              <div
                key={g.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-brand-800 uppercase">{g.category}</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{g.readingTimeMinutes} min</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug hover:text-brand-800 transition">
                    {g.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {g.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleReadGuide(g.slug)}
                    className="text-xs font-bold text-brand-800 hover:text-brand-900 flex items-center space-x-1"
                  >
                    <span>{lang === 'en' ? 'Read Guide' : 'Lire le guide'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        selectedArticle ? (
          /* Vue Lecture d'un Article */
          <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md space-y-6 max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedArticle(null)}
              className="text-xs text-brand-800 hover:underline font-bold flex items-center space-x-1"
            >
              <span>← Retour aux actualités</span>
            </button>

            <div>
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span className="font-bold text-brand-800 uppercase">{selectedArticle.category}</span>
                <span>•</span>
                <span>{formatDate(selectedArticle.publishedAt, lang)}</span>
                <span>•</span>
                <span>{selectedArticle.author}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {selectedArticle.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1 italic">
                {selectedArticle.excerpt}
              </p>
            </div>

            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-4 border-t border-slate-100 pt-6">
              {selectedArticle.content.split('\n\n').map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {selectedArticle.sources?.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold">Sources vérifiées :</span>
                <ul className="list-disc list-inside">
                  {selectedArticle.sources.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* Liste des Actualités */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((n) => (
              <div
                key={n.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-brand-800 uppercase">{n.category}</span>
                    <span>{formatDate(n.publishedAt, lang)}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {n.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3">
                    {n.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleReadArticle(n.slug)}
                    className="text-xs font-bold text-brand-800 hover:text-brand-900 flex items-center space-x-1"
                  >
                    <span>{lang === 'en' ? 'Read Article' : 'Lire l’article'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
