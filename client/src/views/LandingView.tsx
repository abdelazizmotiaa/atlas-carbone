/**
 * Atlas Carbone — Plateforme de Bilan Carbone & Accompagnement Commercial B2B
 * Consultation gratuite de 30 minutes • Bilan carbone initial accompagné à partir de 10 000 MAD
 * Responsable & Consultant : Abdelaziz Motiaa (Doctorant UM6P, spécialisé en quantification GES)
 */

import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Calendar,
  Clock,
  CheckCircle2,
  HelpCircle,
  FileText,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Building2,
  Factory,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  X,
  User,
  Compass,
  Award,
  Layers,
  BarChart3,
  TrendingDown,
  Coins,
  Send,
  MessageCircle,
  ExternalLink,
  Zap,
  Briefcase
} from 'lucide-react';
import { api, setStoredToken, setStoredOrgId } from '../api.js';
import { Language } from '../i18n.js';
import { CalendlyModal, OFFICIAL_CALENDLY_URL, OFFICIAL_PHONE, OFFICIAL_EMAIL } from '../components/CalendlyModal.js';
import { WhatsAppButton } from '../components/WhatsAppButton.js';
import { CompanyQualificationForm } from '../components/CompanyQualificationForm.js';

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
  // Modal Calendly
  const [showCalendly, setShowCalendly] = useState(false);
  const [calendlyPrefill, setCalendlyPrefill] = useState<{ name?: string; email?: string; company?: string } | undefined>(undefined);

  // Modal Authentification (Espace Client / Inscription plateforme)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [regCompanyName, setRegCompanyName] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Accordéon FAQ : index de la question ouverte (0 à 7)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Gestion des ancres d'URL (#rendez-vous, #login, #register)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#rendez-vous' || hash === '#calendly') {
        setShowCalendly(true);
      } else if (hash === '#login' || hash === '#connexion') {
        setAuthTab('login');
        setShowAuthModal(true);
      } else if (hash === '#register' || hash === '#inscription') {
        setAuthTab('register');
        setShowAuthModal(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const openCalendlyWithPrefill = (prefill?: { name?: string; email?: string; company?: string }) => {
    setCalendlyPrefill(prefill);
    setShowCalendly(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await api.auth.login({
        email: loginEmail,
        password: loginPassword
      });
      setStoredToken(res.token);
      if (res.organizations && res.organizations.length > 0) {
        setStoredOrgId(res.organizations[0].id);
      }
      setShowAuthModal(false);
      onLoginSuccess(res.user, res.organizations);
    } catch (err: any) {
      setLoginError(err.message || 'Email ou mot de passe incorrect.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);
    try {
      const res = await api.auth.register({
        company_name: regCompanyName,
        full_name: regFullName,
        email: regEmail,
        password: regPassword,
        phone: regPhone || undefined,
        sector: 'Industrie manufacturière',
        city: 'Casablanca'
      });
      setStoredToken(res.token);
      if (res.organizations && res.organizations.length > 0) {
        setStoredOrgId(res.organizations[0].id);
      }
      setShowAuthModal(false);
      onLoginSuccess(res.user, res.organizations);
    } catch (err: any) {
      setRegError(err.message || "Erreur lors de la création de l'espace entreprise.");
    } finally {
      setRegLoading(false);
    }
  };

  // 8 Questions FAQ obligatoires
  const faqItemsFr = [
    {
      q: "Qu'est-ce qu'un bilan carbone ?",
      a: "Un bilan carbone (ou inventaire des émissions de gaz à effet de serre) est une démarche méthodique qui permet de quantifier l'ensemble des gaz à effet de serre (GES) émis par les activités d'une entreprise sur une période donnée (généralement un exercice annuel). Les émissions sont exprimées en tonnes d'équivalent CO2 (tCO2e) et réparties par postes : consommations d'énergie (électricité réseau ONEE, carburants fossiles), process industriels, achats de matières et transport."
    },
    {
      q: "Pourquoi réaliser un premier bilan carbone ?",
      a: "Un premier bilan carbone permet à la direction de disposer d'une vision claire et chiffrée de ses principaux postes d'émissions. Il constitue le point de départ indispensable pour répondre aux demandes de plus en plus fréquentes de vos clients donneurs d'ordre (notamment à l'export), anticiper les réglementations environnementales, identifier des gisements d'économies d'énergie sur vos factures et valoriser votre engagement auprès de vos partenaires financiers."
    },
    {
      q: "Quelles données faut-il fournir ?",
      a: "Pour un bilan initial, la collecte repose principalement sur des données déjà disponibles dans votre entreprise : vos factures d'électricité (ONEE ou régies délégataires), vos consommations de carburant (gasoil, essence), vos achats de combustibles (gaz butane, propane, fioul lourd), un état de votre flotte de véhicules et les volumes d'activité de vos principaux sites. Nous vous accompagnons pas à pas pour rassembler ces documents simplement sans perturber votre organisation."
    },
    {
      q: "Combien coûte la prestation ?",
      a: "Notre accompagnement débute à partir de 10 000 MAD. Le tarif définitif est fixé dans un devis personnalisé avant tout démarrage. Il dépend de la taille de votre structure, du nombre de sites d'exploitation, de votre secteur d'activité, de la disponibilité de vos données et du périmètre d'émissions convenu (Scope 1 direct, Scope 2 énergie, et catégories pertinentes du Scope 3). La consultation découverte initiale de 30 minutes est quant à elle 100% gratuite."
    },
    {
      q: "Combien de temps dure l'accompagnement ?",
      a: "Pour un bilan initial de PME, la mission s'échelonne généralement sur 3 à 6 semaines selon la réactivité de mise à disposition des données. Ce délai comprend la réunion de cadrage, la phase de collecte accompagnée, les calculs et analyses, ainsi que la réunion finale de restitution du rapport de synthèse."
    },
    {
      q: "Faut-il disposer d'un responsable environnement en interne ?",
      a: "Non, absolument pas. La grande majorité des PME marocaines ne dispose pas de spécialiste climat en interne. Notre accompagnement est conçu pour être accessible aux dirigeants, directeurs administratifs et financiers (DAF), directeurs industriels ou responsables des opérations. Les questions sont formulées en langage courant et contextualisées avec vos factures de terrain."
    },
    {
      q: "La consultation initiale est-elle gratuite ?",
      a: "Oui, la consultation de cadrage de 30 minutes est entièrement gratuite et sans engagement. Elle permet de faire connaissance, d'évaluer vos besoins, de définir le périmètre adapté et de vous orienter vers la démarche la plus pertinente pour votre entreprise."
    },
    {
      q: "Quelle est la différence entre un bilan carbone et le CBAM (MACF) ?",
      a: "Le bilan carbone est une démarche globale mesurant les émissions de l'entreprise dans son ensemble (sur ses sites et ses activités). Le CBAM (Mécanisme d'Ajustement Carbone aux Frontières de l'UE / MACF) est une réglementation commerciale européenne spécifique qui cible l'intensité carbone de certains produits exportés vers l'UE (acier, ciment, engrais, aluminium, hydrogène, électricité). Si votre entreprise exporte ces marchandises, nous intégrons les exigences de calcul spécifiques à ces filières."
    }
  ];

  const faqItemsEn = [
    {
      q: "What is a corporate carbon footprint?",
      a: "A carbon footprint (or GHG emissions inventory) is a structured assessment that quantifies the greenhouse gas emissions generated by a company's activities over a given year. Emissions are expressed in metric tonnes of CO2 equivalent (tCO2e) categorized across direct energy combustion, grid electricity (ONEE), materials and freight."
    },
    {
      q: "Why carry out a first carbon footprint?",
      a: "A first assessment provides executives with transparent, quantified visibility over their emission drivers. It is essential to answer international buyers' procurement requirements, anticipate environmental compliance, identify energy cost-saving opportunities, and reinforce your sustainability credibility with commercial banks."
    },
    {
      q: "What data does my company need to provide?",
      a: "For an initial scope, data collection relies on readily available records: electricity bills (ONEE), fuel tickets (diesel, gasoline), gas/fuel oil purchases, vehicle fleet count, and production volumes. We provide step-by-step guidance to gather these records without disrupting your daily operations."
    },
    {
      q: "How much does the consulting service cost?",
      a: "Our supported carbon assessment starts from 10,000 MAD. The final price is stated in a formal quote prior to mission kickoff, depending on your company size, number of sites, sector, data readiness and agreed scopes. The initial 30-minute discovery consultation is 100% free of charge."
    },
    {
      q: "How long does the engagement take?",
      a: "For an SME initial assessment, the mission typically spans 3 to 6 weeks depending on data availability, including the scoping meeting, guided data collection, calculations, analysis, and final synthesis presentation."
    },
    {
      q: "Do we need an internal sustainability manager?",
      a: "No. Most Moroccan SMEs do not have a full-time climate officer. Our methodology is tailored for Managing Directors, CFOs, plant managers and operations leads, translating complex standards into everyday operational data."
    },
    {
      q: "Is the initial 30-minute consultation free?",
      a: "Yes, the 30-minute scoping call is completely free and non-binding. It helps understand your needs, identify your relevant scope and determine whether our support is right for you."
    },
    {
      q: "What is the difference between a carbon footprint and EU CBAM?",
      a: "A corporate carbon footprint evaluates overall company emissions. The EU Carbon Border Adjustment Mechanism (CBAM) is a specific European trade regulation targeting the embedded carbon intensity per tonne of specific goods exported to the EU (steel, cement, fertilizers, aluminum). If you export these goods, our methodology accommodates CBAM-specific requirements."
    }
  ];

  const faqList = lang === 'en' ? faqItemsEn : faqItemsFr;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-800 selection:text-white flex flex-col">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & NAVIGATION COMMERCIALE */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Identité */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 border border-emerald-800 flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <Globe2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Atlas <span className="text-emerald-800">Carbone</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  Maroc
                </span>
              </div>
              <span className="block text-[10px] text-slate-500 font-medium">
                {lang === 'en' ? 'Corporate Carbon Footprint & Consulting' : 'Comptabilité Carbone & Accompagnement Entreprises'}
              </span>
            </div>
          </div>

          {/* Navigation Liens Rapides */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold text-slate-700 tracking-wide uppercase">
            <a href="#public-cible" className="hover:text-emerald-800 transition">
              {lang === 'en' ? 'For Whom?' : 'À qui s’adresse l’offre'}
            </a>
            <a href="#deroulement" className="hover:text-emerald-800 transition">
              {lang === 'en' ? '5 Steps' : 'Déroulement'}
            </a>
            <a href="#offre" className="hover:text-emerald-800 transition text-emerald-900 font-black flex items-center space-x-1">
              <span>{lang === 'en' ? 'Offer (10,000 MAD)' : 'Notre Offre (10 000 MAD)'}</span>
            </a>
            <a href="#pourquoi-nous" className="hover:text-emerald-800 transition">
              {lang === 'en' ? 'Why Us' : 'Pourquoi nous'}
            </a>
            <a href="#consultant" className="hover:text-emerald-800 transition">
              {lang === 'en' ? 'The Consultant' : 'Le Consultant'}
            </a>
            <a href="#faq" className="hover:text-emerald-800 transition">
              FAQ
            </a>
          </nav>

          {/* Boutons d'Action & Réservation */}
          <div className="flex items-center space-x-3">
            {/* Langue */}
            {onLanguageChange && (
              <button
                onClick={() => onLanguageChange(lang === 'fr' ? 'en' : 'fr')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center space-x-1 shadow-sm"
                title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
              >
                <Globe2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
              </button>
            )}

            {/* Bouton Espace Client / Connexion */}
            <button
              onClick={() => {
                setAuthTab('login');
                setShowAuthModal(true);
              }}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'en' ? 'Client Sign In' : 'Espace Client'}</span>
            </button>

            {/* Bouton Principal : Réserver Consultation Gratuite (30 min) */}
            <button
              onClick={() => openCalendlyWithPrefill()}
              className="inline-flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition border border-emerald-900 group"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>{lang === 'en' ? 'Book Free 30 min' : 'Réserver 30 min gratuites'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-200 group-hover:translate-x-0.5 transition hidden sm:inline" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1 — HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200 bg-gradient-to-b from-emerald-50/70 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Colonne Gauche : Proposition de Valeur */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Badge d'Accroche Tarifaire & Cadrage */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 shadow-sm text-emerald-950 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>
                  {lang === 'en'
                    ? 'Supported initial assessment from 10,000 MAD • Free 30-min call'
                    : 'Accompagnement à partir de 10 000 MAD • Consultation découverte de 30 min offerte'}
                </span>
              </div>

              {/* Titre Principal */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.18]">
                {lang === 'en' ? (
                  <>Your first corporate carbon assessment, <span className="text-emerald-800">simply and with expert support</span>.</>
                ) : (
                  <>Votre premier bilan carbone, <span className="text-emerald-800">simplement et avec un accompagnement expert</span>.</>
                )}
              </h1>

              {/* Sous-titre */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                {lang === 'en'
                  ? 'Atlas Carbone supports Moroccan companies in estimating and quantifying their greenhouse gas emissions through a structured approach tailored to their operational activities.'
                  : 'Atlas Carbone accompagne les entreprises marocaines dans l’estimation et la quantification de leurs émissions de gaz à effet de serre, grâce à une approche structurée et adaptée à leurs activités.'}
              </p>

              {/* Prix et gratuité clairement affichés */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'en' ? 'Starting Price' : 'Tarif de départ prestation'}
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-900">10 000 MAD</span>
                    <span className="text-xs text-slate-500 font-medium">HT (sur devis personnalisé)</span>
                  </div>
                </div>
                <div className="sm:border-l sm:border-slate-200 sm:pl-4 text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Initial 30-min call: 100% Free' : 'Échange initial 30 min : 100% Gratuit'}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {lang === 'en' ? 'No advance payment required' : 'Aucun paiement avant validation du devis'}
                  </span>
                </div>
              </div>

              {/* CTAs d'action */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => openCalendlyWithPrefill()}
                  className="inline-flex items-center space-x-2.5 px-7 py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition group border border-emerald-900 text-sm"
                >
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <span>{lang === 'en' ? 'Book 30 min free consultation' : 'Réserver 30 minutes d’échange gratuit'}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition" />
                </button>

                <a
                  href="#qualification-form"
                  className="inline-flex items-center space-x-2 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold rounded-xl shadow-sm transition text-sm"
                >
                  <FileText className="w-4 h-4 text-emerald-800" />
                  <span>{lang === 'en' ? 'Describe My Company' : 'Décrire mon entreprise'}</span>
                </a>

                <a
                  href="#deroulement"
                  className="inline-flex items-center space-x-1.5 px-4 py-3.5 text-slate-600 hover:text-slate-900 font-semibold text-sm transition"
                >
                  <span>{lang === 'en' ? 'Discover our process' : 'Découvrir notre accompagnement'}</span>
                  <span>↓</span>
                </a>
              </div>

              {/* Éléments de réassurance factuels */}
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Approche ISO 14064-1 & GHG Protocol</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Adapté aux réalités marocaines</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Contact direct avec le consultant</span>
                </div>
              </div>

            </div>

            {/* Colonne Droite : Carte Visuelle Sobre & Crédible */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-7 space-y-5 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Exemple de synthèse
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Bilan Carbone Initial Accompagné
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                    Périmètre Cadré
                  </span>
                </div>

                {/* Blocs d'activité concrets (factures ONEE, carburant, fluides) */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        ⚡
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Électricité Réseau (Factures ONEE)</span>
                        <span className="block text-[11px] text-slate-500">Mix moyen national documenté</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">Scope 2</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                        ⛽
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Carburants & Combustibles</span>
                        <span className="block text-[11px] text-slate-500">Gasoil, essence, gaz de process</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">Scope 1</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                        📦
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Postes prioritaires convenus</span>
                        <span className="block text-[11px] text-slate-500">Intrants clés & transport amont</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">Scope 3</span>
                  </div>
                </div>

                {/* Livrables inclus */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-700 mb-2">
                    Livrables remis à l'issue de la mission :
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Rapport de synthèse des émissions (tCO2e)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Classeur méthodologique documenté</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Réunion de restitution et recommandations</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => openCalendlyWithPrefill()}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>Réserver mon échange de cadrage (30 min)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2 — À QUI S'ADRESSE NOTRE OFFRE ? */}
      {/* ------------------------------------------------------------- */}
      <section id="public-cible" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider inline-block">
            {lang === 'en' ? 'Target Audience' : 'Bénéficiaires'}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            {lang === 'en' ? 'Who is this support designed for?' : 'À qui s’adresse notre accompagnement ?'}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            {lang === 'en'
              ? 'Our support is tailored to Moroccan businesses seeking clarity, pragmatism and scientific rigor without unnecessary complexity.'
              : 'Notre offre s’adresse aux entreprises marocaines qui recherchent de la clarté, du pragmatisme et de la rigueur scientifique, sans jargon superflu.'}
          </p>

          <div className="pt-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 text-left">
            {/* 1. PME Marocaines */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-700 transition flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  PME marocaines
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Structures souhaitant mesurer leurs émissions avec leurs données courantes (factures ONEE, carburants) sans mobiliser une équipe dédiée.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800">
                Approche pragmatique →
              </span>
            </div>

            {/* 2. Entreprises Industrielles */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-700 transition flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition">
                  <Factory className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Entreprises industrielles
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unités de production, agroalimentaire, métallurgie ou textile ayant des consommations thermiques et électriques significatives à quantifier.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800">
                Périmètre usine & énergie →
              </span>
            </div>

            {/* 3. Entreprises Exportatrices */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-700 transition flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center group-hover:scale-105 transition">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Entreprises exportatrices
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Exportateurs confrontés aux attentes de donneurs d'ordre européens ou internationaux exigeant des données d'émissions traçables.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800">
                Conformité donneurs d'ordre →
              </span>
            </div>

            {/* 4. Entreprises souhaitant réaliser leur 1er bilan */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-700 transition flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center group-hover:scale-105 transition">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Premier bilan carbone
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dirigeants n'ayant jamais réalisé d'exercice carbone et cherchant un accompagnement rassurant, pédagogique et étape par étape.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800">
                Guidage sans jargon →
              </span>
            </div>

            {/* 5. Entreprises souhaitant mieux comprendre leurs émissions */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-700 transition flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center group-hover:scale-105 transition">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Compréhension des GES
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Organisations souhaitant identifier précisément leurs postes les plus émetteurs afin de cibler de réelles économies d'énergie et de coûts.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800">
                Priorisation des gains →
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-4 italic">
            * Note de transparence : toutes les entreprises ne sont pas soumises au mécanisme MACF/CBAM. Le périmètre de travail est déterminé en fonction de vos enjeux réels.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3 — COMMENT SE DÉROULE L'ACCOMPAGNEMENT ? (5 ÉTAPES) */}
      {/* ------------------------------------------------------------- */}
      <section id="deroulement" className="py-20 border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider inline-block">
              {lang === 'en' ? 'Structured Methodology' : 'Parcours en 5 étapes'}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {lang === 'en' ? 'How the consulting mission unfolds' : 'Comment se déroule l’accompagnement ?'}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
              Un cheminement clair et balisé pour vous faire gagner du temps et garantir la fiabilité méthodologique de votre bilan carbone.
            </p>
          </div>

          {/* Grille des 5 étapes */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Étape 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center">
                1
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Gratuit • 30 min</span>
                <h3 className="font-extrabold text-slate-900 text-sm">Échange initial gratuit</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consultation de 30 minutes avec Abdelaziz Motiaa pour comprendre votre activité, vos objectifs et vos données disponibles.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                2
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cadrage sur-mesure</span>
                <h3 className="font-extrabold text-slate-900 text-sm">Définition du périmètre & devis</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Définition formelle des scopes retenus, des livrables attendus et envoi d’un devis transparent (à partir de 10 000 MAD).
              </p>
            </div>

            {/* Étape 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                3
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Accompagnement</span>
                <h3 className="font-extrabold text-slate-900 text-sm">Collecte des données</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transmission d'une grille de collecte simple et guidage pas à pas pour rassembler vos factures ONEE, carburants et intrants.
              </p>
            </div>

            {/* Étape 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                4
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rigueur scientifique</span>
                <h3 className="font-extrabold text-slate-900 text-sm">Calcul & analyse des émissions</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Application déterministe des facteurs d'émission appropriés, calcul des incertitudes et identification des principaux postes émetteurs.
              </p>
            </div>

            {/* Étape 5 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center">
                5
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Restitution</span>
                <h3 className="font-extrabold text-slate-900 text-sm">Résultats & Recommandations</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Réunion de présentation des résultats, remise du rapport officiel de synthèse et conseils prioritaires de réduction.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => openCalendlyWithPrefill()}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>Démarrer par l'échange initial gratuit (Étape 1)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4 — NOTRE OFFRE COMMERCIALE */}
      {/* ------------------------------------------------------------- */}
      <section id="offre" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider inline-block">
              {lang === 'en' ? 'Transparent Pricing' : 'Tarif & Prestation'}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {lang === 'en' ? 'Our Consulting Engagement' : 'Notre offre d’accompagnement'}
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Une formule claire et adaptée aux entreprises souhaitant réaliser une première évaluation structurée de leurs émissions GES.
            </p>
          </div>

          {/* Carte Commerciale Premium */}
          <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl border-2 border-emerald-800/30 shadow-2xl p-8 sm:p-10 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-800 text-white text-[11px] font-black uppercase tracking-wider rounded-bl-2xl">
              Offre Recommandée
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                Bilan carbone initial accompagné
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Une première évaluation structurée des émissions de gaz à effet de serre de votre entreprise, réalisée avec un accompagnement méthodologique et adaptée à votre activité.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-emerald-900">À partir de 10 000 MAD</span>
                <span className="text-xs text-slate-500 font-medium">HT • Fixé sur devis personnalisé</span>
              </div>
            </div>

            {/* Prestations Incluses sous réserve du périmètre convenu */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Prestations possibles (sous réserve du périmètre convenu dans le devis) :
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                {[
                  'Réunion de cadrage initiale',
                  'Identification des sources d’émissions pertinentes',
                  'Accompagnement à la collecte des données d’activité',
                  'Sélection documentée des facteurs d’émission',
                  'Calcul des émissions sur le périmètre défini',
                  'Analyse des principaux postes d’émissions',
                  'Rapport de synthèse clair et professionnel',
                  'Réunion de restitution et d’échange avec le consultant'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span className="font-medium text-slate-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mention Obligatoire de Transparence */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold block">Notice méthodologique importante :</span>
              <p className="leading-relaxed">
                Le périmètre, les livrables, le délai et le tarif définitif sont précisés dans un devis personnalisé. Le tarif de 10 000 MAD constitue le tarif de départ pour un périmètre initial convenu et ne comprend pas automatiquement l’ensemble exhaustif des Scopes 1, 2 et 3 ni une certification tierce partie indépendante.
              </p>
            </div>

            {/* Boutons d'Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => openCalendlyWithPrefill()}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center space-x-2 border border-emerald-900"
              >
                <Calendar className="w-4 h-4 text-amber-300" />
                <span>Discuter de mon bilan carbone (30 min offertes)</span>
              </button>

              <a
                href="#qualification-form"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm text-center shadow-sm transition"
              >
                Demander un devis en décrivant mon entreprise
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5 — POURQUOI NOUS CHOISIR ? */}
      {/* ------------------------------------------------------------- */}
      <section id="pourquoi-nous" className="py-20 border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider inline-block">
              {lang === 'en' ? 'Verifiable Rationale' : 'Garanties & Engagements'}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {lang === 'en' ? 'Why choose Atlas Carbone?' : 'Pourquoi nous choisir ?'}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
              Des arguments vérifiables, concrets et sans fausses promesses institutionnelles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Accompagnement scientifique */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                🔬
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Accompagnement scientifique
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Une expertise directement issue de travaux de recherche doctorale appliquée à la mesure, la modélisation et la quantification rigoureuse des émissions de gaz à effet de serre.
              </p>
            </div>

            {/* 2. Approche adaptée aux entreprises marocaines */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                🇲🇦
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Approche adaptée au Maroc
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prise en compte fine du mix électrique national (factures ONEE), des carburants commercialisés au Maroc et des spécificités opérationnelles des PME du Royaume.
              </p>
            </div>

            {/* 3. Méthodologie structurée */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                📐
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Méthodologie structurée
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Alignement méthodique sur les standards reconnus (ISO 14064-1:2018 et GHG Protocol), garantissant un inventaire exploitable auprès de vos banques et clients.
              </p>
            </div>

            {/* 4. Calculs transparents et documentés */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                📊
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Calculs transparents & traçables
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aucune formule opaque ou boîte noire. Chaque facteur d'émission utilisé est sourcé, documenté et expliqué dans votre classeur de synthèse.
              </p>
            </div>

            {/* 5. Explications accessibles aux non-spécialistes */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                💡
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Pédagogie & Clarté
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Des explications simples, en langage professionnel courant, adaptées aux dirigeants et responsables financiers sans formation environnementale préalable.
              </p>
            </div>

            {/* 6. Contact direct avec le consultant */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                🤝
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Contact direct avec le consultant
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Un interlocuteur unique et dédié (Abdelaziz Motiaa), disponible directement par téléphone, visioconférence et WhatsApp tout au long de la mission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 6 — À PROPOS DU CONSULTANT */}
      {/* ------------------------------------------------------------- */}
      <section id="consultant" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider inline-block">
              {lang === 'en' ? 'Scientific Lead' : 'Le Consultant'}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              À propos d’Abdelaziz Motiaa
            </h2>
          </div>

          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar sobre et professionnel avec initiales */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-amber-300 font-black text-2xl flex items-center justify-center shadow-lg border border-emerald-800 shrink-0">
                AM
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Abdelaziz Motiaa
                </h3>
                <p className="text-xs sm:text-sm font-bold text-emerald-800">
                  Doctorant à l’Université Mohammed VI Polytechnique (UM6P)
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  Spécialisé dans la mesure et la quantification des émissions de gaz à effet de serre.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-200 pt-5">
              <p>
                Dans le cadre de ses travaux de recherche doctorale à l'UM6P et de ses missions d'accompagnement, Abdelaziz Motiaa met la rigueur scientifique au service de la transition environnementale des entreprises marocaines.
              </p>
              <p>
                Son rôle consiste à démythifier la comptabilité carbone, à traduire les exigences des référentiels internationaux (ISO 14064-1, GHG Protocol, MACF/CBAM) en étapes opérationnelles concrètes, et à garantir à chaque dirigeant un bilan rigoureux, défendable et actionnable.
              </p>
            </div>

            {/* Coordonnées de Contact Direct */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={`mailto:${OFFICIAL_EMAIL}`}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 hover:text-emerald-800 hover:border-emerald-700 transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{OFFICIAL_EMAIL}</span>
                </a>
                <a
                  href={`tel:${OFFICIAL_PHONE.replace(/\s+/g, '')}`}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 hover:text-emerald-800 hover:border-emerald-700 transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{OFFICIAL_PHONE}</span>
                </a>
                <a
                  href={`https://wa.me/212671581167?text=${encodeURIComponent("Bonjour Abdelaziz, je souhaite échanger sur le bilan carbone de mon entreprise.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold hover:bg-emerald-200 transition flex items-center space-x-1.5 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />
                  <span>WhatsApp direct</span>
                </a>
              </div>

              <button
                onClick={() => openCalendlyWithPrefill()}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition flex items-center space-x-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>Prendre RDV (30 min)</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Notice d'indépendance : l'affiliation doctorale à l'UM6P reflète le parcours académique du consultant et ne constitue ni une certification professionnelle ni une garantie institutionnelle de l'université.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 7 — QUESTIONS FRÉQUENTES (FAQ) */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="py-20 border-b border-slate-200 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider inline-block">
              FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Questions Fréquentes
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Toutes les réponses à vos questions sur notre accompagnement, les tarifs, la durée et les données nécessaires.
            </p>
          </div>

          <div className="space-y-3">
            {faqList.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-emerald-800 transition"
                  >
                    <span>{item.q}</span>
                    <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-slate-500">
              Une autre question spécifique à votre activité ?
            </p>
            <button
              onClick={() => openCalendlyWithPrefill()}
              className="mt-2 text-xs font-bold text-emerald-800 hover:underline"
            >
              Posez-la directement lors de votre échange gratuit de 30 minutes →
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 8 — FORMULAIRE DE QUALIFICATION DE L'ENTREPRISE */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <CompanyQualificationForm
            lang={lang}
            onOpenCalendly={(prefill) => openCalendlyWithPrefill(prefill)}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 9 — APPEL À L'ACTION FINAL (CTA) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-300 shadow-inner">
            <Calendar className="w-7 h-7 text-amber-300" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Prêt à réaliser votre premier bilan carbone ?
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Présentez-nous votre activité lors d’un échange gratuit de 30 minutes. Nous identifierons ensemble vos besoins et les premières étapes de votre démarche.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openCalendlyWithPrefill()}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl hover:shadow-2xl transition flex items-center justify-center space-x-2 border border-emerald-400/30"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>Réserver mon rendez-vous gratuit (30 min)</span>
            </button>

            <a
              href="https://wa.me/212671581167?text=Bonjour,%20je%20souhaite%20obtenir%20des%20informations%20sur%20votre%20accompagnement%20pour%20r%C3%A9aliser%20un%20bilan%20carbone%20de%20mon%20entreprise."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition flex items-center justify-center space-x-2 border border-white/20"
            >
              <MessageCircle className="w-4 h-4 text-emerald-300" />
              <span>Échanger sur WhatsApp (+212 671 581 167)</span>
            </a>
          </div>

          <p className="text-xs text-slate-400 pt-2">
            Sans engagement • Réponse rapide sous 24h ouvrées
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold text-white">Atlas Carbone</span>
                <span className="text-[10px] text-emerald-400 font-mono">Maroc</span>
              </div>
              <p className="text-xs text-slate-500">
                Accompagnement méthodologique et quantification des émissions de gaz à effet de serre.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <a href={`mailto:${OFFICIAL_EMAIL}`} className="hover:text-emerald-400 transition flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{OFFICIAL_EMAIL}</span>
              </a>
              <a href={`tel:${OFFICIAL_PHONE.replace(/\s+/g, '')}`} className="hover:text-emerald-400 transition flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{OFFICIAL_PHONE}</span>
              </a>
              <button
                onClick={() => {
                  setAuthTab('login');
                  setShowAuthModal(true);
                }}
                className="hover:text-emerald-400 font-bold transition flex items-center space-x-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Espace Client / Connexion</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>
              © {new Date().getFullYear()} Atlas Carbone. Responsable scientifique : Abdelaziz Motiaa (UM6P). Tous droits réservés.
            </p>
            <p>
              Conforme aux exigences de protection des données (CNDP Loi 09-08). Données hébergées en environnement sécurisé.
            </p>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* MODAL CALENDLY FLOTTANT */}
      {/* ------------------------------------------------------------- */}
      <CalendlyModal
        isOpen={showCalendly}
        onClose={() => setShowCalendly(false)}
        lang={lang}
        prefill={calendlyPrefill}
      />

      {/* ------------------------------------------------------------- */}
      {/* BOUTON WHATSAPP DISCRET SUR MOBILE & DESKTOP */}
      {/* ------------------------------------------------------------- */}
      <WhatsAppButton lang={lang} />

      {/* ------------------------------------------------------------- */}
      {/* MODAL AUTHENTIFICATION (Espace Client / Inscription) */}
      {/* ------------------------------------------------------------- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-300 shadow-2xl max-w-md w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-amber-300 font-bold shadow">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Atlas <span className="text-emerald-800">Carbone</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {authTab === 'register' ? 'Créer un espace entreprise' : 'Connexion à votre espace client'}
                </p>
              </div>
            </div>

            {/* Onglets Connexion / Inscription */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                  authTab === 'login' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('register')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                  authTab === 'register' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Créer un compte
              </button>
            </div>

            {authTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                    {loginError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email professionnel</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="contact@entreprise.ma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mot de passe</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {loginLoading ? 'Connexion en cours...' : 'Accéder à mon espace'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {regError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                    {regError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nom de l’entreprise</label>
                  <input
                    type="text"
                    required
                    value={regCompanyName}
                    onChange={e => setRegCompanyName(e.target.value)}
                    placeholder="Ex: Atlas Industrie SA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Responsable</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="Ex: Karim Bennani"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email professionnel</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="k.bennani@entreprise.ma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mot de passe</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+212 6XX XX XX XX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {regLoading ? 'Création en cours...' : 'Créer mon espace client'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
