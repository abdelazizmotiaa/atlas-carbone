/**
 * Atlas Carbone - Site Public & Acquisition Clients
 * Vitrine institutionnelle, simulation interactive, solutions sectorielles et demande de démo
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingDown,
  Globe2,
  FileCheck2,
  Building2,
  Factory,
  ArrowRight,
  Calculator,
  CheckCircle2,
  HelpCircle,
  FileText,
  Mail,
  Zap,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { api, setStoredToken, setStoredOrgId } from '../api.js';
import { Language, translations } from '../i18n.js';

interface LandingViewProps {
  onLoginSuccess: (user: any, orgs: any[]) => void;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
  onStartTrial?: () => void;
  onOpenAcademy?: () => void;
  onOpenContent?: (tab: 'guides' | 'news') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onLoginSuccess,
  lang = 'fr',
  onLanguageChange,
  onStartTrial,
  onOpenAcademy,
  onOpenContent
}) => {
  const t = translations[lang];

  // Demo login state
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lead contact form state
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadSector, setLeadSector] = useState('Industrie manufacturière');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  // Interactive Live Simulator on Landing
  const [simType, setSimType] = useState<'elec' | 'diesel' | 'gaz' | 'fret'>('elec');
  const [simQty, setSimQty] = useState<number>(50000);
  const [simDist, setSimDist] = useState<number>(300);

  const calculateQuickSim = () => {
    switch (simType) {
      case 'elec':
        // 0.6426 kgCO2e/kWh (Mix moyen réseau national Maroc)
        return (simQty * 0.642602) / 1000.0;
      case 'diesel':
        // 3.056 kgCO2e/litre (Diesel pompe)
        return (simQty * 3.056) / 1000.0;
      case 'gaz':
        // 0.256 kgCO2e/kWh PCI
        return (simQty * 0.256) / 1000.0;
      case 'fret':
        // 10 t * dist * 0.107 kgCO2e/t.km
        return (simQty * simDist * 0.10767) / 1000.0;
      default:
        return 0;
    }
  };

  const handleQuickDemoLogin = async (email: string, pwd: string, orgId: string) => {
    setLoadingDemo(true);
    setErrorMsg(null);
    try {
      const res = await api.auth.login({ email, password: pwd });
      setStoredToken(res.token);
      setStoredOrgId(orgId);
      onLoginSuccess(res.user, res.organizations);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion démo.");
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadLoading(true);
    try {
      await api.leads.submit({
        full_name: leadName,
        email: leadEmail,
        phone: leadPhone,
        company: leadCompany,
        sector: leadSector,
        message: leadMessage,
        utm_source: 'landing_page_form'
      });
      setLeadSubmitted(true);
    } catch (err: any) {
      alert("Erreur lors de l'envoi de la demande: " + err.message);
    } finally {
      setLeadLoading(false);
    }
  };

  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterConsent) {
      setNewsletterMsg({
        type: 'error',
        text: lang === 'en' ? 'Please confirm your consent before subscribing.' : 'Veuillez cocher la case de consentement.'
      });
      return;
    }
    setNewsletterLoading(true);
    setNewsletterMsg(null);
    try {
      const res = await api.newsletter.subscribe(newsletterEmail, lang || 'fr');
      setNewsletterMsg({ type: 'success', text: res.message });
      setNewsletterEmail('');
      setNewsletterConsent(false);
    } catch (err: any) {
      setNewsletterMsg({ type: 'error', text: err.message || "Erreur lors de l'inscription." });
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Barre de navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-brand-900 text-brand-300 flex items-center justify-center shadow-md">
              <Globe2 className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Atlas <span className="text-brand-700">Carbone</span>
              </span>
              <span className="block text-xs text-slate-500 font-medium">
                {lang === 'en' ? 'GHG Accounting & CBAM Morocco' : 'Comptabilité GES & Conformité MACF Maroc'}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <a href="#solutions" className="hover:text-brand-800 transition">
              {lang === 'en' ? 'Sector Solutions' : 'Solutions Métier'}
            </a>
            {onOpenAcademy && (
              <button onClick={onOpenAcademy} className="hover:text-brand-800 transition font-medium flex items-center space-x-1 text-brand-900">
                <span>{lang === 'en' ? 'Carbon Academy' : 'Académie Carbone'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-100 text-brand-800 font-bold">10 cours</span>
              </button>
            )}
            {onOpenContent && (
              <>
                <button onClick={() => onOpenContent('guides')} className="hover:text-brand-800 transition">
                  {lang === 'en' ? 'Guides' : 'Guides'}
                </button>
                <button onClick={() => onOpenContent('news')} className="hover:text-brand-800 transition">
                  {lang === 'en' ? 'Regulatory News' : 'Actualités'}
                </button>
              </>
            )}
            <a href="#simulateur" className="hover:text-brand-800 transition">
              {lang === 'en' ? 'Simulator' : 'Simulateur'}
            </a>
            <a href="#contact" className="hover:text-brand-800 transition">
              {lang === 'en' ? 'Contact' : 'Contact'}
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            {onLanguageChange && (
              <button
                onClick={() => onLanguageChange(lang === 'fr' ? 'en' : 'fr')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-1"
                title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
              >
                <Globe2 className="w-3.5 h-3.5 text-brand-700" />
                <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
              </button>
            )}

            {/* Essayer sans compte (Hero Action 1) */}
            {onStartTrial && (
              <button
                onClick={onStartTrial}
                className="px-4 py-2 text-sm font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg border border-emerald-300 shadow-sm transition flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'en' ? 'Try Without Account' : 'Essayer sans compte'}</span>
              </button>
            )}

            <a
              href="#demo-accounts"
              className="px-3.5 py-2 text-sm font-semibold text-white bg-brand-800 hover:bg-brand-900 rounded-lg shadow-sm transition"
            >
              {lang === 'en' ? 'Workspace / Login' : 'Espace Entreprise'}
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-100 text-brand-900 text-xs font-semibold uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Régime Définitif MACF 2026 & Standards ISO 14064-1</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Mesurez les émissions de votre entreprise au Maroc et{' '}
                <span className="text-brand-800 underline decoration-brand-400 decoration-wavy">
                  préparez vos données carbone
                </span>{' '}
                pour vos clients européens.
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                Le premier SaaS B2B conçu pour les PME, groupes industriels multisites et exportateurs marocains.
                Pilotez vos Scopes 1, 2, 3 avec les facteurs d’émissions nationaux, clôturez des inventaires certifiables
                et éditez les dossiers conformes au mécanisme d'ajustement carbone aux frontières (MACF).
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                {onStartTrial && (
                  <button
                    onClick={onStartTrial}
                    className="inline-flex items-center space-x-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-200" />
                    <span>{lang === 'en' ? 'Try Without Account (Guest)' : 'Essayer sans compte (Session invité)'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <a
                  href="#demo-accounts"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl shadow-md transition"
                >
                  <Building2 className="w-4 h-4 text-brand-300" />
                  <span>{lang === 'en' ? 'Create Company Space / Login' : 'Créer mon espace entreprise'}</span>
                </a>
              </div>

              {/* Badges de conformité */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">ISO 14064-1 & GHG Protocol</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileCheck2 className="w-5 h-5 text-brand-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">Catalogue National Marocain</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe2 className="w-5 h-5 text-brand-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">MACF Règlement (UE) 2023/956</span>
                </div>
              </div>
            </div>

            {/* Carte interactive / Aperçu Produit */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-800">Aperçu Bilan Entreprise 2025</span>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-100 text-brand-900">
                    Clôturé & Traçable
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Total Bilan Consolidé</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1">1 245,8 <span className="text-sm font-normal text-slate-500">tCO2e</span></div>
                    <span className="text-xs text-emerald-700 font-semibold mt-1 block">±6.8% incertitude 95%</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Intensité carbone</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1">0,42 <span className="text-sm font-normal text-slate-500">tCO2e/tonne</span></div>
                    <span className="text-xs text-slate-500 mt-1 block">Production Casablanca</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Répartition par Scope</span>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span>Scope 1 (Directs chaudière & flotte)</span>
                        <span className="font-bold">285,4 t (23%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-brand-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span>Scope 2 (Électricité réseau ONEE)</span>
                        <span className="font-bold">449,8 t (36%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '36%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span>Scope 3 (Achats & Logistique fret)</span>
                        <span className="font-bold">510,6 t (41%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '41%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start space-x-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Conformité stricte : séparation Location-based vs Market-based et calcul d'intensité produit vérifiable.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Clarté Pédagogique Immédiate (Conforme Section 2 du Prompt Maître) */}
      <section className="py-16 bg-slate-900 text-slate-100 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              {lang === 'en' ? 'Methodological Transparency' : 'Transparence & Pédagogie Immédiate'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {lang === 'en' ? 'Everything you need to know before starting' : 'Ce que vous devez savoir avant de commencer'}
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              {lang === 'en'
                ? 'No prior carbon footprint expertise required. We guide you step by step through your operational reality.'
                : 'Aucune expertise préalable requise. Nous vous guidons pas à pas selon votre réalité opérationnelle.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. À qui s'adresse Atlas Carbone */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {lang === 'en' ? 'Who is Atlas Carbone for?' : "À qui s'adresse Atlas Carbone ?"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'en'
                  ? 'Moroccan SMEs, multi-site industrial groups, and exporters subject to customer supply chain audits or EU CBAM requirements.'
                  : "Aux PME marocaines, groupes industriels multisites et exportateurs vers l'UE soumis aux audits carbone de leurs clients ou au MACF."}
              </p>
            </div>

            {/* 2. Ce qu'il faut préparer */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {lang === 'en' ? 'What should you prepare?' : "Ce qu'il faut préparer"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'en'
                  ? 'ONEE electricity invoices (kWh), fuel receipts or fleet cards (liters), gas invoices (kWh NCV), and procurement registers (raw materials, freight).'
                  : 'Factures ONEE (kWh), tickets ou cartes carburant (litres gasoil/essence), factures de gaz (kWh PCI) et registres d’achats (matières premières, fret).'}
              </p>
            </div>

            {/* 3. Ce que le logiciel calcule */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {lang === 'en' ? 'What does the engine calculate?' : 'Ce que le moteur calcule'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'en'
                  ? 'Scopes 1, 2, and 3 under ISO 14064-1 & GHG Protocol, location-based/market-based electricity, and specific embedded CBAM emissions without AI approximations.'
                  : 'Scopes 1, 2 et 3 selon ISO 14064-1 et GHG Protocol, distinction location-based / market-based, et intensité spécifique MACF, de manière 100% déterministe.'}
              </p>
            </div>

            {/* 4. Ce que vous trouverez dans votre rapport */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {lang === 'en' ? 'What is in your final report?' : 'Ce que contient votre rapport'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'en'
                  ? 'Executive summary, detailed graphs by site and scope, uncertainty intervals, traceable methodological annex of mobilized factors, and action plan.'
                  : 'Synthèse exécutif, graphiques détaillés par poste et site, incertitudes globales, annexe méthodologique traçable des facteurs mobilisés et plan de transition.'}
              </p>
            </div>

            {/* 5. Comment vos données sont protégées */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {lang === 'en' ? 'How are your data protected?' : 'Protection stricte de vos données'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'en'
                  ? 'Strict multi-tenant DB isolation, server-side factor confidentiality, isolated temporary guest sessions, and compliance with Moroccan Law 09-08 (CNDP).'
                  : 'Isolation stricte par entreprise en base sécurisée WAL, catalogue de facteurs protégé côté serveur, sessions temporaires chiffrées et conformité Loi 09-08.'}
              </p>
            </div>

            {/* 6. Limites méthodologiques transparentes */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {lang === 'en' ? 'Transparent methodological limits' : 'Limites méthodologiques claires'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'en'
                  ? 'An empty field is never zero. Missing factors are explicitly flagged as unquantified. Software checks do not substitute for an accredited ISO 14065 audit.'
                  : 'Un champ vide n’est jamais zéro. Les postes sans facteur adapté sont déclarés non quantifiés. Le logiciel ne remplace pas un audit accrédité ISO 14065.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1-Clic Accès Comptes Démo */}
      <section id="demo-accounts" className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Accès Instantané aux Profils de Démonstration</h2>
            <p className="text-sm text-slate-600 mt-2">
              Explorez l'application en 1 clic sans saisie de mot de passe, avec des données réelles déjà calculées.
            </p>
          </div>

          {errorMsg && (
            <div className="max-w-md mx-auto mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg text-center">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profil 1 : Agroalimentaire Multisites */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-brand-500 transition shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-brand-100 text-brand-900">
                    PME / ETI Multisites
                  </span>
                  <Building2 className="w-5 h-5 text-brand-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Atlas Agro-Alimentaire SARL</h3>
                <p className="text-xs text-slate-500 mt-1">Sites : Casablanca (Usine) & Agadir (Entrepôt). Bilan 2025 clôturé.</p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <p>👤 <strong>Tariq El Alami</strong> (Admin Entreprise)</p>
                  <p>📊 7 postes calculés, plan de transition PV 150 kWc</p>
                </div>
              </div>
              <button
                disabled={loadingDemo}
                onClick={() => handleQuickDemoLogin('admin@agro-atlas.ma', 'AgroAtlas2026!', 'org-agro-atlas')}
                className="mt-6 w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-lg shadow transition flex items-center justify-center space-x-2"
              >
                <span>Accéder comme DG / Admin</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Profil 2 : Responsable Carbone / RSE */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-brand-500 transition shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-900">
                    Rôle Métier
                  </span>
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Salma Berrada (Resp. RSE)</h3>
                <p className="text-xs text-slate-500 mt-1">Supervision de la collecte, contrôle des facteurs et incertitudes.</p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <p>🏢 Entreprise : Atlas Agro-Alimentaire</p>
                  <p>🔍 Accès "Voir le calcul", revues d'unités, devis</p>
                </div>
              </div>
              <button
                disabled={loadingDemo}
                onClick={() => handleQuickDemoLogin('carbone@agro-atlas.ma', 'CarboneAtlas2026!', 'org-agro-atlas')}
                className="mt-6 w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow transition flex items-center justify-center space-x-2"
              >
                <span>Accéder comme Resp. Carbone</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Profil 3 : Industrie Exportatrice MACF */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-brand-500 transition shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-900">
                    Module Export MACF
                  </span>
                  <Factory className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Métallurgie de l'Oriental SA</h3>
                <p className="text-xs text-slate-500 mt-1">Usine Selouane Nador. Export Barres béton (CN 7214 20 00).</p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <p>👤 <strong>Mehdi Chraibi</strong> (Directeur Usine)</p>
                  <p>🇪🇺 Émissions spécifiques directes/indirectes + dossier importateur UE</p>
                </div>
              </div>
              <button
                disabled={loadingDemo}
                onClick={() => handleQuickDemoLogin('export@metal-oriental.ma', 'MetalExport2026!', 'org-metal-oriental')}
                className="mt-6 w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-lg shadow transition flex items-center justify-center space-x-2"
              >
                <span>Accéder au Module MACF / CBAM</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Simulateur Rapide sur la Landing Page */}
      <section id="simulateur" className="py-16 bg-slate-100 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-800">Calculateur Déterministe</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">Simulez instantanément une source d'émission</h2>
            <p className="text-sm text-slate-600 mt-2">
              Utilise les facteurs officiels vérifiés du référentiel national marocain.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'elec', label: 'Électricité réseau', icon: Zap },
                { id: 'diesel', label: 'Diesel / Pompe', icon: Factory },
                { id: 'gaz', label: 'Gaz naturel', icon: TrendingDown },
                { id: 'fret', label: 'Fret routier (t.km)', icon: Globe2 }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSimType(item.id as any)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center space-y-2 ${
                      simType === item.id
                        ? 'bg-brand-50 border-brand-600 text-brand-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-brand-700" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {simType === 'elec' && 'Consommation annuelle (kWh)'}
                  {simType === 'diesel' && 'Carburant consommé (litres)'}
                  {simType === 'gaz' && 'Énergie chaudière (kWh PCI)'}
                  {simType === 'fret' && 'Masse transportée (tonnes)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={simQty}
                  onChange={e => setSimQty(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                />
              </div>

              {simType === 'fret' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Distance parcourue (km)</label>
                  <input
                    type="number"
                    min="1"
                    value={simDist}
                    onChange={e => setSimDist(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                  />
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="text-slate-500 font-medium">Facteur d'émission appliqué :</div>
                  <div className="font-bold text-slate-800">
                    {simType === 'elec' && '0,642602 kgCO2e/kWh (ONEE net hors pertes)'}
                    {simType === 'diesel' && '3,056 kgCO2e/litre (Base Carbone Maroc)'}
                    {simType === 'gaz' && '0,256 kgCO2e/kWh PCI (Combustion)'}
                  </div>
                  <div className="text-slate-400">Périmètre : Facteur validé 2023/2025</div>
                </div>
              )}
            </div>

            <div className="bg-brand-900 text-white rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider">Résultat estimé</span>
                <div className="text-3xl font-extrabold text-white mt-1">
                  {calculateQuickSim().toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-lg font-normal text-brand-200">tCO2e</span>
                </div>
                <span className="text-xs text-brand-300 mt-1 block">
                  Soit {(calculateQuickSim() * 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kgCO2e
                </span>
              </div>
              <a
                href="#demo-accounts"
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-brand-950 font-bold text-xs rounded-lg transition"
              >
                Intégrer dans un Bilan Complet
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Section MACF / CBAM Spécifique */}
      <section id="macf" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                Réglementation Européenne
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Module Export Europe — Préparation des Déclarations MACF / CBAM
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Depuis le <strong>1er janvier 2026</strong>, le Mécanisme d'Ajustement Carbone aux Frontières est entré
                dans son <em>régime définitif</em>. Vos clients importateurs européens vous réclament des données précises
                sur les émissions intrinsèques de vos marchandises.
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Le Bilan Entreprise n'est pas un calcul MACF</h4>
                    <p className="text-xs text-slate-500">
                      Une intensité globale d'entreprise ne constitue pas des émissions intrinsèques MACF. Le module isole
                      les procédés de fabrication et les précurseurs éligibles.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Catalogue réglementaire des codes NC (Nomenclature Combinée)</h4>
                    <p className="text-xs text-slate-500">
                      Couverture des 6 secteurs initiaux : Ciment, Fer & Acier, Aluminium, Engrais, Électricité, Hydrogène.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Dossier normalisé prêt pour l'importateur européen</h4>
                    <p className="text-xs text-slate-500">
                      Générez une fiche technique contenant la décomposition détaillée des émissions directes (SEE direct),
                      indirectes (SEE indirect) et des précurseurs pour votre client européen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                ⚠️ <strong>Précision juridique :</strong> Le déclarant officiel du MACF reste l'importateur dans l'UE. Atlas
                Carbone fournit à l'industriel marocain le dossier complet de preuves requis par les auditeurs accrédités.
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-900 text-slate-100 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <span className="text-xs font-mono text-amber-400">EU CBAM DEFINITIVE REGIME (2026)</span>
                  <h3 className="text-lg font-bold text-white">Fiche Produit : Barres d'acier (CN 7214 20 00)</h3>
                </div>
                <span className="px-2 py-1 text-xs bg-amber-400/20 text-amber-300 rounded font-mono">SECTEUR ACIER</span>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                  <span className="text-slate-400">Installation de production :</span>
                  <div className="text-white font-bold text-sm">Complexe Métallurgique Selouane / Nador (MA NDR)</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                    <span className="text-slate-400">Émissions directes spécifiques :</span>
                    <div className="text-emerald-400 font-bold text-sm">0,425 tCO2e/t</div>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                    <span className="text-slate-400">Émissions indirectes (Élec) :</span>
                    <div className="text-emerald-400 font-bold text-sm">0,380 tCO2e/t</div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                  <span className="text-slate-400">Précurseurs incorporés :</span>
                  <div className="text-slate-200 mt-1">
                    • Ferrailles locales (Maroc) : 0,050 tCO2e/t<br />
                    • Ferro-alliages FeSiMn (Espagne) : 0,120 tCO2e/t
                  </div>
                </div>

                <div className="bg-brand-950/80 p-4 rounded-xl border border-brand-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400">Total Émissions Intrinsèques Spécifiques :</span>
                    <div className="text-xl font-bold text-brand-300">0,975 tCO2e / tonne</div>
                  </div>
                  <span className="px-3 py-1 bg-brand-500/20 text-brand-200 text-xs rounded border border-brand-400/30">
                    Calcul Validé
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulaire de Contact & Devis */}
      <section id="contact" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Demander une Démonstration ou un Devis</h2>
            <p className="text-sm text-slate-600 mt-2">
              Remplissez ce formulaire pour recevoir un devis officiel personnalisé en Dirhams marocains (MAD).
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            {leadSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Demande enregistrée avec succès !</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Merci <strong>{leadName}</strong>. Un accusé de réception a été envoyé à <strong>{leadEmail}</strong>.
                  Notre responsable commercial prendra contact avec vous sous 24h.
                </p>
                <button
                  onClick={() => setLeadSubmitted(false)}
                  className="px-4 py-2 text-xs font-semibold text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-lg transition"
                >
                  Envoyer une autre demande
                </button>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet *</label>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={e => setLeadName(e.target.value)}
                      placeholder="M. Karim Bennani"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email professionnel *</label>
                    <input
                      type="email"
                      required
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      placeholder="k.bennani@entreprise.ma"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Raison sociale / Entreprise *</label>
                    <input
                      type="text"
                      required
                      value={leadCompany}
                      onChange={e => setLeadCompany(e.target.value)}
                      placeholder="Nom de la société"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={leadPhone}
                      onChange={e => setLeadPhone(e.target.value)}
                      placeholder="+212 6 XX XX XX XX"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Secteur d'activité</label>
                    <select
                      value={leadSector}
                      onChange={e => setLeadSector(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option>Industrie agroalimentaire</option>
                      <option>Métallurgie / Sidérurgie (MACF)</option>
                      <option>Textile & Cuir</option>
                      <option>Chimie & Plasturgie</option>
                      <option>Bâtiment & Travaux Publics</option>
                      <option>Services & Logistique</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Votre projet ou besoin spécifique</label>
                  <textarea
                    rows={3}
                    value={leadMessage}
                    onChange={e => setLeadMessage(e.target.value)}
                    placeholder="Ex: Nous souhaitons réaliser le bilan GES de nos 2 sites industriels et préparer nos données carbone pour nos exportations vers l'Espagne..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                  ></textarea>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {lang === 'en'
                      ? 'Your data is strictly processed according to Moroccan Law 09-08 (CNDP).'
                      : 'Vos données personnelles sont traitées conformément à la loi 09-08 (CNDP).'}
                  </span>
                  <button
                    type="submit"
                    disabled={leadLoading}
                    className="px-6 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-sm rounded-lg shadow transition"
                  >
                    {leadLoading ? (lang === 'en' ? 'Sending...' : 'Envoi en cours...') : (lang === 'en' ? 'Send Request' : 'Envoyer ma demande')}
                  </button>
                </div>
              </form>
            )}

            {/* Coordonnées Directes du Contact Référent */}
            <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">{lang === 'en' ? 'Direct Contact' : 'Contact Référent'}</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">Abdelaziz Motiaa</span>
                <span className="text-slate-500 text-[11px]">{lang === 'en' ? 'Project Lead — Atlas Carbone' : 'Responsable Projet — Atlas Carbone'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">{lang === 'en' ? 'Direct Email' : 'Email Direct'}</span>
                <a
                  href="mailto:abdelaziz.motiaa@gmail.com"
                  className="font-bold text-brand-800 hover:text-brand-900 hover:underline text-sm mt-0.5 block truncate"
                >
                  abdelaziz.motiaa@gmail.com
                </a>
                <span className="text-slate-500 text-[11px]">{lang === 'en' ? 'Response within 24h' : 'Réponse sous 24h'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">{lang === 'en' ? 'Direct Phone' : 'Téléphone Direct'}</span>
                <a
                  href="tel:+212671581167"
                  className="font-bold text-brand-800 hover:text-brand-900 hover:underline text-sm mt-0.5 block"
                >
                  +212 6 71 58 11 67
                </a>
                <span className="text-slate-500 text-[11px]">{lang === 'en' ? 'Casablanca (GMT+1)' : 'Casablanca (GMT+1)'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Newsletter Réglementaire Bilingue (Double Opt-In) */}
      <section className="py-14 bg-brand-900 text-white border-b border-brand-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-800 text-brand-300 text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Morocco Carbon Watch & CBAM' : 'Veille Réglementaire Carbone Maroc & MACF'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {lang === 'en'
              ? 'Stay ahead of EU & Moroccan environmental regulations'
              : 'Restez informé des évolutions réglementaires et facteurs d’émission'}
          </h2>
          <p className="text-xs sm:text-sm text-brand-200 max-w-2xl mx-auto">
            {lang === 'en'
              ? 'Receive verified analyses on Moroccan emission factors, EU CBAM definitive rules, and decarbonization subsidies. Zero spam, unsubscribe in 1 click.'
              : 'Recevez des analyses vérifiées sur les facteurs d’émissions nationaux, le calendrier MACF et les aides à la décarbonation. Pas de spam, désinscription en 1 clic.'}
          </p>

          <form onSubmit={handleNewsletterSubmit} className="max-w-xl mx-auto pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder={lang === 'en' ? 'your.email@company.ma' : 'votre.email@entreprise.ma'}
                className="flex-1 px-4 py-3 rounded-xl bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold text-sm shadow transition shrink-0"
              >
                {newsletterLoading
                  ? (lang === 'en' ? 'Subscribing...' : 'Inscription...')
                  : (lang === 'en' ? 'Subscribe' : "M'inscrire")}
              </button>
            </div>

            <label className="flex items-start space-x-2 text-left text-xs text-brand-200 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newsletterConsent}
                onChange={e => setNewsletterConsent(e.target.checked)}
                className="mt-0.5 rounded border-brand-700 text-brand-500 focus:ring-0"
              />
              <span>
                {lang === 'en'
                  ? 'I consent to receiving regulatory watch emails (double opt-in verification required, distinct from account creation).'
                  : 'J’accepte de recevoir la veille réglementaire (double opt-in avec email de confirmation, distinct de la création de compte).'}
              </span>
            </label>

            {newsletterMsg && (
              <div
                className={`p-3 rounded-xl text-xs text-center font-medium ${
                  newsletterMsg.type === 'success'
                    ? 'bg-emerald-900/60 border border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-900/60 border border-rose-500/50 text-rose-200'
                }`}
              >
                {newsletterMsg.text}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-lg font-bold text-white tracking-tight">Atlas Carbone</span>
            <p className="mt-2 text-slate-400 leading-relaxed">
              Plateforme SaaS marocaine de comptabilité carbone et de conformité aux exigences export européennes.
            </p>
            <div className="mt-4 space-y-1 text-slate-400">
              <p>👤 <strong>Abdelaziz Motiaa</strong></p>
              <p>
                ✉️ <a href="mailto:abdelaziz.motiaa@gmail.com" className="text-brand-400 hover:underline">abdelaziz.motiaa@gmail.com</a>
              </p>
              <p>
                📞 <a href="tel:+212671581167" className="text-brand-400 hover:underline">+212 6 71 58 11 67</a>
              </p>
              <p className="text-slate-500 pt-1">Casablanca — Royaume du Maroc</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">Référentiels & Sources Facteurs</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>GHG Protocol Corporate Standard</li>
              <li>ISO 14064-1:2018 & ISO 14069</li>
              <li>Classeur National Marocain (FM6E/ADEME/ABC)</li>
              <li>Règlement UE MACF 2023/956 régime définitif</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">Sécurité & Confidentialité</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>Conformité Loi 09-08 (CNDP)</li>
              <li>Hébergement persistant SQLite en mode WAL</li>
              <li>Isolation étanche des données multi-entreprises</li>
              <li>Catalogue et formules protégés côté serveur</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">Avertissement Méthodologique</h4>
            <p className="text-slate-400 leading-relaxed">
              Atlas Carbone est un outil indépendant de calcul et de pilotage. Il n’est pas un organisme officiel de
              l’État marocain, de la FM6E, de l’AMEE ou de l’ABC. Les calculs logiciels ne remplacent pas un audit de
              certification officiel par un tiers vérificateur accrédité ISO 14065.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
          <span>© 2026 Atlas Carbone. Tous droits réservés. Développé par Abdelaziz Motiaa.</span>
          <span className="mt-2 sm:mt-0 font-mono">Conformité ISO 14064-1 & MACF 2026</span>
        </div>
      </footer>
    </div>
  );
};
