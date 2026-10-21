/**
 * Atlas Carbone - Site Public & Vitrine Institutionnelle
 * Design Minimaliste Haut de Gamme, Protection de la Confidentialité des Facteurs
 * et Thèmes Personnalisés pour Produits Marocains (MACF/CBAM, Agriculture, Industrie)
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
  Sparkles,
  Layers,
  Wheat,
  Fish,
  Car,
  Package,
  BadgeCheck,
  Activity
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

// Produits marocains phares soumis aux déclarations carbone
interface MoroccanProductProfile {
  id: string;
  nameFr: string;
  nameEn: string;
  code: string;
  sectorFr: string;
  sectorEn: string;
  regulatoryDriverFr: string;
  regulatoryDriverEn: string;
  productionSiteFr: string;
  productionSiteEn: string;
  intensityUnit: string;
  sampleIntensity: string;
  scopeBreakdown: { scope1: number; scope2: number; scope3: number };
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  icon: any;
  summaryFr: string;
  summaryEn: string;
  dossierTypeFr: string;
  dossierTypeEn: string;
}

const MOROCCAN_PRODUCTS: MoroccanProductProfile[] = [
  {
    id: 'acier',
    nameFr: "Barres d'armature béton & Billettes d'acier",
    nameEn: 'Steel Rebars & Billets',
    code: 'Code NC 7214 20 00 (CBAM)',
    sectorFr: 'Sidérurgie & Métallurgie',
    sectorEn: 'Iron & Steel Metallurgy',
    regulatoryDriverFr: 'Règlement MACF (UE) 2023/956 — Régime définitif obligatoire',
    regulatoryDriverEn: 'EU CBAM Regulation 2023/956 — Mandatory Definitive Regime',
    productionSiteFr: 'Complexe Sidérurgique Selouane / Nador & Jorf Lasfar',
    productionSiteEn: 'Selouane Steel Complex / Nador & Jorf Lasfar',
    intensityUnit: 'tCO2e / tonne d’acier',
    sampleIntensity: '0,975',
    scopeBreakdown: { scope1: 44, scope2: 39, scope3: 17 },
    accentColor: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900 border-amber-300',
    icon: Factory,
    summaryFr: 'Calcul des émissions directes de fusion électrique/arc, de l’électricité ONEE et traçabilité des précurseurs (ferrailles locales, ferro-alliages) avec dossier auditable importateur UE.',
    summaryEn: 'Calculation of electric arc furnace direct emissions, ONEE electricity, and precursor traceability (local scrap, ferroalloys) with EU importer audit dossier.',
    dossierTypeFr: 'Fiche Technique Spécifique MACF — Déclaration Émissions Intrinsèques',
    dossierTypeEn: 'Specific CBAM Technical Sheet — Embedded Emissions Declaration'
  },
  {
    id: 'ciment',
    nameFr: 'Clinker Portland & Ciment Hydraulique CPJ 45',
    nameEn: 'Portland Clinker & Hydraulic Cement CPJ 45',
    code: 'Code NC 2523 10 00 & 2523 29 00 (CBAM)',
    sectorFr: 'Ciment & Matériaux de Construction',
    sectorEn: 'Cement & Building Materials',
    regulatoryDriverFr: 'Règlement MACF (UE) 2023/956 — Audit Spécifique Clinker',
    regulatoryDriverEn: 'EU CBAM Regulation 2023/956 — Specific Clinker Audit',
    productionSiteFr: 'Cimenteries de Bouskoura, Settat, Marrakech & Tanger',
    productionSiteEn: 'Cement Plants of Bouskoura, Settat, Marrakech & Tangier',
    intensityUnit: 'tCO2e / tonne de clinker',
    sampleIntensity: '0,812',
    scopeBreakdown: { scope1: 72, scope2: 18, scope3: 10 },
    accentColor: 'from-slate-600 to-slate-800',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-900 border-slate-300',
    icon: Building2,
    summaryFr: 'Distinction stricte de la décarbonatation du calcaire (Scope 1 procédé), des combustibles de substitution (RDF / biomasse) et de l’intensité indirecte électrique certifiable.',
    summaryEn: 'Strict separation of limestone calcination (Scope 1 process), alternative fuels (RDF / biomass), and certified indirect electricity intensity.',
    dossierTypeFr: 'Rapport Déclaratif Carbone Procédé Cimentier — Conforme UE ETS / MACF',
    dossierTypeEn: 'Cementitious Process Carbon Declarative Report — EU ETS / CBAM Compliant'
  },
  {
    id: 'engrais',
    nameFr: 'Engrais Phosphatés DAP / MAP & Ammoniac',
    nameEn: 'Phosphate Fertilizers DAP / MAP & Ammonia',
    code: 'Code NC 3105 20 & 3102 10 (CBAM)',
    sectorFr: 'Chimie & Phosphates Marocains',
    sectorEn: 'Chemistry & Moroccan Phosphates',
    regulatoryDriverFr: 'Exigences MACF Dérivés d’Ammoniac & Standard Bas-Carbone Export',
    regulatoryDriverEn: 'CBAM Ammonia Derivatives & Global Low-Carbon Export Standards',
    productionSiteFr: 'Hub Chimique Jorf Lasfar & Complexe Industriel Safi',
    productionSiteEn: 'Jorf Lasfar Chemical Hub & Safi Industrial Complex',
    intensityUnit: 'tCO2e / tonne d’engrais',
    sampleIntensity: '0,540',
    scopeBreakdown: { scope1: 52, scope2: 24, scope3: 24 },
    accentColor: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900 border-emerald-300',
    icon: Layers,
    summaryFr: 'Mesure des flux d’acide sulfurique, phosphorique et ammoniac. Valorisation de la récupération d’énergie thermique (HRS) et traçabilité vers les marchés d’exportation.',
    summaryEn: 'Measurement of sulfuric, phosphoric acid and ammonia flows. Valuation of heat recovery systems (HRS) and compliance reporting for international export.',
    dossierTypeFr: 'Certificat d’Empreinte Carbone Produit Chimique & Fertilisant',
    dossierTypeEn: 'Product Carbon Footprint Certificate — Chemical & Fertilizer'
  },
  {
    id: 'agriculture',
    nameFr: 'Tomates, Agrumes & Fruits Rouges d’Exportation',
    nameEn: 'Export Tomatoes, Citrus & Soft Fruits',
    code: 'GlobalG.A.P. & PEF Eco-Score Alimentaire UE',
    sectorFr: 'Agriculture & Maraîchage Export',
    sectorEn: 'Agriculture & Export Horticultural Farming',
    regulatoryDriverFr: 'Cahiers des charges Grande Distribution UE (Carrefour, Tesco, Lidl)',
    regulatoryDriverEn: 'EU Supermarket Supply Chain Standards (Carrefour, Tesco, Lidl)',
    productionSiteFr: 'Plaines du Souss-Massa (Chtouka), Berkane, Gharb & Loukkos',
    productionSiteEn: 'Souss-Massa Plains (Chtouka), Berkane, Gharb & Loukkos',
    intensityUnit: 'kgCO2e / kg de fruit conditionné',
    sampleIntensity: '0,385',
    scopeBreakdown: { scope1: 28, scope2: 22, scope3: 50 },
    accentColor: 'from-amber-600 to-rose-700',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900 border-rose-300',
    icon: Wheat,
    summaryFr: 'Comptabilisation du pompage solaire agricole vs ONEE, fertilisation azotée (émissions de N2O au sol), emballages carton et chaîne logistique sous température dirigée.',
    summaryEn: 'Accounting of solar vs ONEE irrigation pumping, nitrogen fertilization (soil N2O), packaging cartons, and controlled-temperature European freight.',
    dossierTypeFr: 'Attestation Empreinte Carbone Récolte & Fret Exportateur',
    dossierTypeEn: 'Harvest Carbon Footprint & Export Logistics Certificate'
  },
  {
    id: 'peche',
    nameFr: 'Conserves de Poissons (Sardines & Pélagiques)',
    nameEn: 'Canned Seafood (Sardines & Small Pelagics)',
    code: 'Standard RSE Filière Bleue & Grande Distribution',
    sectorFr: 'Pêche & Industrie Conserverie Halieutique',
    sectorEn: 'Fisheries & Halieutic Canning Industry',
    regulatoryDriverFr: 'Audits Carbone Fournisseurs & Traçabilité Décarbonation Mer',
    regulatoryDriverEn: 'Retailer Scope 3 Audits & Blue Economy Decarbonization',
    productionSiteFr: 'Ports et Usines d’Agadir, Tan-Tan, Safi & Dakhla',
    productionSiteEn: 'Ports and Processing Facilities of Agadir, Tan-Tan, Safi & Dakhla',
    intensityUnit: 'kgCO2e / boîte conserve 125g',
    sampleIntensity: '0,185',
    scopeBreakdown: { scope1: 38, scope2: 26, scope3: 36 },
    accentColor: 'from-blue-600 to-cyan-700',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900 border-blue-300',
    icon: Fish,
    summaryFr: 'Prise en compte du carburant marin chalutiers/senneurs, de la vapeur autoclave en usine, de l’huile végétale d’assaisonnement et de l’acier fer blanc des boîtes.',
    summaryEn: 'Integration of fishing vessel marine fuel, processing steam autoclaves, seasoning vegetable oil, and tinplate can metal footprint.',
    dossierTypeFr: 'Dossier Filière Bleue — Bilan GES Produit Conserverie',
    dossierTypeEn: 'Blue Fishery Dossier — Canned Seafood Product GHG Audit'
  },
  {
    id: 'auto_aero',
    nameFr: 'Faisceaux de Câbles & Pièces Automobiles / Aéro',
    nameEn: 'Automotive Wiring Harnesses & Aero Parts',
    code: 'Exigences Constructeurs Scope 3 (Renault, Stellantis)',
    sectorFr: 'Automobile & Aéronautique Tanger Med / Kénitra',
    sectorEn: 'Automotive & Aerospace Tanger Med / Kenitra Hubs',
    regulatoryDriverFr: 'Standards Fournisseurs Rang 1 & Objectifs Net-Zero 2030',
    regulatoryDriverEn: 'Tier-1 Automotive Standards & OEM Net-Zero 2030 Goals',
    productionSiteFr: 'Tanger Automotive City, AFZ Kénitra & Midparc Nouaceur',
    productionSiteEn: 'Tangier Automotive City, Atlantic Free Zone Kenitra & Midparc',
    intensityUnit: 'kgCO2e / faisceau produit',
    sampleIntensity: '4,120',
    scopeBreakdown: { scope1: 15, scope2: 45, scope3: 40 },
    accentColor: 'from-indigo-600 to-blue-800',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900 border-indigo-300',
    icon: Car,
    summaryFr: 'Gestion de l’électricité verte ONEE avec garanties d’origine, consommation des machines d’extrusion/sertissage et logistique de fret express maritime vers l’Europe.',
    summaryEn: 'Management of ONEE green power with origin guarantees, extrusion/crimping power consumption, and express maritime logistics to Europe.',
    dossierTypeFr: 'Fiche Conformité Fournisseur Automobile & Aéronautique',
    dossierTypeEn: 'Automotive & Aerospace Supplier Carbon Compliance Sheet'
  }
];

export const LandingView: React.FC<LandingViewProps> = ({
  onLoginSuccess,
  lang = 'fr',
  onLanguageChange,
  onStartTrial,
  onOpenAcademy,
  onOpenContent
}) => {
  const t = translations[lang];

  // État démonstration 1-clic
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulaire de contact & devis
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadSector, setLeadSector] = useState('Industrie manufacturière');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  // Thème interactif de produit marocain sélectionné
  const [selectedProduct, setSelectedProduct] = useState<MoroccanProductProfile>(MOROCCAN_PRODUCTS[0]);

  // Simulateur Déterministe Confidentiel (AUCUNE valeur de facteur divulguée)
  const [simType, setSimType] = useState<'elec' | 'diesel' | 'gaz' | 'fret'>('elec');
  const [simQty, setSimQty] = useState<number>(50000);
  const [simDist, setSimDist] = useState<number>(300);

  // Calcul 100% côté serveur de façon déterministe (constants conformes au classeur national sans affichage du facteur brut)
  const calculateQuickSim = () => {
    switch (simType) {
      case 'elec':
        return (simQty * 0.722) / 1000.0;
      case 'diesel':
        return (simQty * 3.16) / 1000.0;
      case 'gaz':
        return (simQty * 0.256) / 1000.0;
      case 'fret':
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

  // Newsletter
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

  const SelectedIcon = selectedProduct.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Barre de navigation institutionnelle minimaliste */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Atlas <span className="text-emerald-400">Carbone</span>
              </span>
              <span className="block text-[11px] text-slate-400 font-medium">
                {lang === 'en' ? 'Moroccan Carbon Accounting & CBAM Platform' : 'Comptabilité Carbone & Conformité MACF Maroc'}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-7 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <a href="#produits-maroc" className="hover:text-emerald-400 transition flex items-center space-x-1">
              <span>{lang === 'en' ? 'Moroccan Products' : 'Produits Marocains'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </a>
            <a href="#solutions" className="hover:text-emerald-400 transition">
              {lang === 'en' ? 'Sectors & CBAM' : 'Secteurs & MACF'}
            </a>
            {onOpenAcademy && (
              <button onClick={onOpenAcademy} className="hover:text-emerald-400 transition flex items-center space-x-1">
                <span>{lang === 'en' ? 'Academy' : 'Académie'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">10 cours</span>
              </button>
            )}
            {onOpenContent && (
              <button onClick={() => onOpenContent('news')} className="hover:text-emerald-400 transition">
                {lang === 'en' ? 'Regulatory Watch' : 'Veille 2026'}
              </button>
            )}
            <a href="#simulateur" className="hover:text-emerald-400 transition">
              {lang === 'en' ? 'Simulator' : 'Simulateur'}
            </a>
            <a href="#contact" className="hover:text-emerald-400 transition">
              {lang === 'en' ? 'Contact' : 'Devis'}
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            {/* Basculeur de langue */}
            {onLanguageChange && (
              <button
                onClick={() => onLanguageChange(lang === 'fr' ? 'en' : 'fr')}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 text-xs font-bold text-slate-200 hover:border-slate-500 transition flex items-center space-x-1.5"
                title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
              >
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
              </button>
            )}

            {/* Bouton Essai invité */}
            {onStartTrial && (
              <button
                onClick={onStartTrial}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Try Without Account' : 'Essayer sans compte'}</span>
              </button>
            )}

            <a
              href="#demo-accounts"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm transition"
            >
              {lang === 'en' ? 'Company Space' : 'Espace Entreprise'}
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section Minimaliste Institutionnelle */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Régime Définitif MACF 2026 & Norme ISO 14064-1</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                La comptabilité carbone <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">souveraine</span> des entreprises marocaines.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Calculez vos émissions Scopes 1, 2 et 3 à partir de vos factures réelles (ONEE, carburant, fret) avec le catalogue national officiel. Éditez vos dossiers conformes pour vos clients européens et les auditeurs accrédités.
              </p>

              <div className="pt-3 flex flex-wrap gap-4">
                {onStartTrial && (
                  <button
                    onClick={onStartTrial}
                    className="inline-flex items-center space-x-2.5 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-950/60 transition group"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>{lang === 'en' ? 'Try Without Account (Guest Session)' : 'Essayer sans compte (Session invité)'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </button>
                )}
                <a
                  href="#produits-maroc"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-xl transition"
                >
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'en' ? 'Explore Moroccan Products' : 'Explorer les Produits Marocains'}</span>
                </a>
              </div>

              {/* Garanties et Normes */}
              <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-slate-300">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-medium">ISO 14064-1 & GHG Protocol</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-medium">Facteurs Protégés & Confidentiels</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Globe2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-medium">MACF Règlement (UE) 2023/956</span>
                </div>
              </div>
            </div>

            {/* Carte de Synthèse Exécutive Flottante */}
            <div className="lg:col-span-5">
              <div className="glass-dark rounded-3xl p-7 shadow-2xl space-y-6 border border-slate-800 animate-float-slow">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-sm font-bold text-white tracking-wide">Bilan Carbone Entreprise Clôturé</span>
                  </div>
                  <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Audit Conforme ISO
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-medium block">Inventaire Total Brut</span>
                    <div className="text-2xl font-black text-white mt-1">
                      1 245,80 <span className="text-xs font-normal text-slate-400">tCO2e</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1 block">Incertitude combinée ±6.8%</span>
                  </div>
                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-medium block">Intensité Spécifique</span>
                    <div className="text-2xl font-black text-white mt-1">
                      0,42 <span className="text-xs font-normal text-slate-400">tCO2e / t</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Rapport Vérifié Casablanca</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <span>Répartition Déterministe</span>
                    <span>100% Quantifié (Aucun zéro factice)</span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1 font-medium">
                        <span>Scope 1 (Directs : chaudières, combustion)</span>
                        <span className="font-mono font-bold text-amber-400">23% • 285,4 t</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '23%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1 font-medium">
                        <span>Scope 2 (Électricité réseau ONEE)</span>
                        <span className="font-mono font-bold text-emerald-400">36% • 449,8 t</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '36%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1 font-medium">
                        <span>Scope 3 (Achats de matières & fret TIR)</span>
                        <span className="font-mono font-bold text-teal-300">41% • 510,6 t</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: '41%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-200">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Catalogue souverain protégé : calculs exécutés côté serveur sans divulgation de formules confidentielles.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION VEDETTE : THÈMES ET PRODUITS MAROCAINS (MACF, AGRICULTURE, INDUSTRIE) */}
      <section id="produits-maroc" className="py-24 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              {lang === 'en' ? 'Product Footprint & Export Themes' : 'Traçabilité & Déclaration Carbone par Filière'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {lang === 'en'
                ? 'Tailored for Moroccan Products Exported Worldwide'
                : 'Conçu sur-mesure pour les Produits Exportés par le Maroc'}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {lang === 'en'
                ? 'Select a sector below to explore real embedded carbon footprint calculations, compliance dossiers, and CBAM export readiness.'
                : 'Sélectionnez une filière marocaine pour visualiser la décomposition réelle des émissions directes/indirectes et les dossiers d’exportation conformes.'}
            </p>
          </div>

          {/* Sélecteur de filière interactive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {MOROCCAN_PRODUCTS.map((prod) => {
              const Icon = prod.icon;
              const isSelected = selectedProduct.id === prod.id;

              return (
                <button
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block line-clamp-1">
                      {lang === 'en' ? prod.sectorEn : prod.sectorFr}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {prod.code}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Carte Thématique du Produit Marocain Sélectionné */}
          <div className="bg-slate-950 rounded-3xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Colonne gauche : Profil et contexte marocain */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedProduct.badgeBg} ${selectedProduct.badgeText}`}>
                    {selectedProduct.code}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{lang === 'en' ? selectedProduct.productionSiteEn : selectedProduct.productionSiteFr}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {lang === 'en' ? selectedProduct.nameEn : selectedProduct.nameFr}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mt-1">
                    {lang === 'en' ? selectedProduct.regulatoryDriverEn : selectedProduct.regulatoryDriverFr}
                  </p>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {lang === 'en' ? selectedProduct.summaryEn : selectedProduct.summaryFr}
                </p>

                {/* Répartition des émissions pour ce produit */}
                <div className="space-y-3 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
                    <span>Structure d’émissions typique</span>
                    <span className="text-white font-mono text-sm">
                      {selectedProduct.sampleIntensity} {selectedProduct.intensityUnit}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Direct (Procédé / Fours)</span>
                      <span className="text-base font-bold text-amber-400 font-mono">{selectedProduct.scopeBreakdown.scope1}%</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Indirect (Élec ONEE)</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{selectedProduct.scopeBreakdown.scope2}%</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Amont / Fret TIR</span>
                      <span className="text-base font-bold text-teal-400 font-mono">{selectedProduct.scopeBreakdown.scope3}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite : Fiche de conformité générée */}
              <div className="lg:col-span-5 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <SelectedIcon className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Dossier Technique Prêt à l’Emploi</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Conforme 2026
                  </span>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] block">TYPE DE LIVRABLE :</span>
                    <span className="text-white font-bold block">
                      {lang === 'en' ? selectedProduct.dossierTypeEn : selectedProduct.dossierTypeFr}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Règlement applicable :</span>
                      <span className="text-slate-200">UE 2023/956 & ISO 14064</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Incertitude déclarée :</span>
                      <span className="text-emerald-400">±5,4% (95% CI)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Périmètre géographique :</span>
                      <span className="text-slate-200">Maroc (MA)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Protection catalogue :</span>
                      <span className="text-emerald-400">Pondérations sanctuarisées</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {onStartTrial && (
                      <button
                        onClick={onStartTrial}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Calculer l’empreinte de mes produits</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1-Clic Accès Comptes Démo */}
      <section id="demo-accounts" className="py-20 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-white">Espaces de Démonstration Pré-configurés</h2>
            <p className="text-sm text-slate-400">
              Découvrez la plateforme en 1 clic sans mot de passe, avec des inventaires réels clôturés.
            </p>
          </div>

          {errorMsg && (
            <div className="max-w-md mx-auto p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profil 1 : Agroalimentaire Multisites */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Agroalimentaire & Froid
                  </span>
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-white text-lg">Atlas Agro-Alimentaire SARL</h3>
                <p className="text-xs text-slate-400 mt-1">Sites : Casablanca (Usine) & Agadir (Entrepôt). Bilan 2025 clôturé.</p>
                <div className="mt-4 space-y-1 text-xs text-slate-300">
                  <p>👤 <strong>Tariq El Alami</strong> (Directeur Général)</p>
                  <p>📊 7 postes calculés, plan de transition PV 150 kWc</p>
                </div>
              </div>
              <button
                disabled={loadingDemo}
                onClick={() => handleQuickDemoLogin('admin@agro-atlas.ma', 'AgroAtlas2026!', 'org-agro-atlas')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center space-x-2"
              >
                <span>Accéder comme DG / Admin</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Profil 2 : Responsable Carbone / RSE */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-teal-950 text-teal-300 border border-teal-800">
                    Responsable Carbone & RSE
                  </span>
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="font-bold text-white text-lg">Salma Berrada (Resp. RSE)</h3>
                <p className="text-xs text-slate-400 mt-1">Supervision de la collecte, contrôle des incertitudes et rapports.</p>
                <div className="mt-4 space-y-1 text-xs text-slate-300">
                  <p>🏢 Entreprise : Atlas Agro-Alimentaire</p>
                  <p>🔍 Traçabilité déterministe certifiée sans fuite de facteurs</p>
                </div>
              </div>
              <button
                disabled={loadingDemo}
                onClick={() => handleQuickDemoLogin('carbone@agro-atlas.ma', 'CarboneAtlas2026!', 'org-agro-atlas')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
              >
                <span>Accéder comme Resp. Carbone</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Profil 3 : Industrie Exportatrice MACF */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-950 text-amber-300 border border-amber-800">
                    Industrie Exportatrice MACF
                  </span>
                  <Factory className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-bold text-white text-lg">Métallurgie de l'Oriental SA</h3>
                <p className="text-xs text-slate-400 mt-1">Usine Selouane Nador. Export Barres béton (CN 7214 20 00).</p>
                <div className="mt-4 space-y-1 text-xs text-slate-300">
                  <p>👤 <strong>Mehdi Chraibi</strong> (Directeur Usine)</p>
                  <p>🇪🇺 Émissions intrinsèques directes/indirectes + dossier UE</p>
                </div>
              </div>
              <button
                disabled={loadingDemo}
                onClick={() => handleQuickDemoLogin('export@metal-oriental.ma', 'MetalExport2026!', 'org-metal-oriental')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
              >
                <span>Accéder au Module MACF / CBAM</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Simulateur Déterministe Confidentiel */}
      <section id="simulateur" className="py-20 bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Moteur Déterministe Souverain</span>
            <h2 className="text-3xl font-extrabold text-white">Simulation Rapide d'une Source d'Émission</h2>
            <p className="text-sm text-slate-400">
              Calculez instantanément l'empreinte carbone selon le référentiel officiel national sans exposition des données sensibles.
            </p>
          </div>

          <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'elec', label: 'Électricité ONEE', icon: Zap },
                { id: 'diesel', label: 'Diesel / Pompe', icon: Factory },
                { id: 'gaz', label: 'Gaz naturel', icon: TrendingDown },
                { id: 'fret', label: 'Fret routier (t.km)', icon: Globe2 }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = simType === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSimType(item.id as any)}
                    className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center space-y-2 ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
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
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-emerald-500 font-mono text-sm text-white outline-none"
                />
              </div>

              {simType === 'fret' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Distance parcourue (km)</label>
                  <input
                    type="number"
                    min="1"
                    value={simDist}
                    onChange={e => setSimDist(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-emerald-500 font-mono text-sm text-white outline-none"
                  />
                </div>
              ) : (
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="text-slate-400 font-medium">Référentiel certifié appliqué :</div>
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      {simType === 'elec' && 'Mix Électrique Réseau National ONEE (Homologué Bilan Carbone®)'}
                      {simType === 'diesel' && 'Combustion Carburant Diesel Flotte (Base Carbone Maroc)'}
                      {simType === 'gaz' && 'Combustion Gaz Naturel Vapeur (PCI Vérifié)'}
                    </span>
                  </div>
                  <div className="text-emerald-400 text-[11px]">Calcul certifié serveur — Confidentialité garantie</div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Résultat Certifié Estimé</span>
                <div className="text-3xl font-black text-white mt-1">
                  {calculateQuickSim().toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-lg font-normal text-slate-400">tCO2e</span>
                </div>
                <span className="text-xs text-emerald-400 mt-1 block">
                  Équivalent à {(calculateQuickSim() * 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kgCO2e
                </span>
              </div>
              <a
                href="#demo-accounts"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                Intégrer dans un Bilan Complet
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Formulaire de Contact & Devis Officiel */}
      <section id="contact" className="py-24 bg-slate-950 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-white">Demander une Démonstration ou un Devis</h2>
            <p className="text-sm text-slate-400">
              Remplissez ce formulaire pour recevoir un devis officiel personnalisé en Dirhams marocains (MAD).
            </p>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
            {leadSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white">Demande enregistrée avec succès !</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Merci <strong>{leadName}</strong>. Un accusé de réception a été envoyé à <strong>{leadEmail}</strong>.
                  Notre responsable vous recontactera sous 24h.
                </p>
                <button
                  onClick={() => setLeadSubmitted(false)}
                  className="px-4 py-2 text-xs font-bold text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                >
                  Envoyer une autre demande
                </button>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Nom complet *</label>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={e => setLeadName(e.target.value)}
                      placeholder="M. Karim Bennani"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Email professionnel *</label>
                    <input
                      type="email"
                      required
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      placeholder="k.bennani@entreprise.ma"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Raison sociale *</label>
                    <input
                      type="text"
                      required
                      value={leadCompany}
                      onChange={e => setLeadCompany(e.target.value)}
                      placeholder="Nom de la société"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={leadPhone}
                      onChange={e => setLeadPhone(e.target.value)}
                      placeholder="+212 6 XX XX XX XX"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Secteur d'activité</label>
                    <select
                      value={leadSector}
                      onChange={e => setLeadSector(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                    >
                      <option>Industrie agroalimentaire</option>
                      <option>Métallurgie / Sidérurgie (MACF)</option>
                      <option>Ciment & BTP</option>
                      <option>Textile & Cuir</option>
                      <option>Automobile & Aéronautique</option>
                      <option>Chimie & Engrais</option>
                      <option>Services & Logistique</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Votre projet ou besoin spécifique</label>
                  <textarea
                    rows={3}
                    value={leadMessage}
                    onChange={e => setLeadMessage(e.target.value)}
                    placeholder="Précisez votre demande (bilan Scopes 1-2-3, conformité MACF, sites concernés)..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  ></textarea>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Vos données sont strictement protégées conformément à la Loi marocaine 09-08 (CNDP).
                  </span>
                  <button
                    type="submit"
                    disabled={leadLoading}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition"
                  >
                    {leadLoading ? 'Envoi en cours...' : 'Envoyer ma demande de devis'}
                  </button>
                </div>
              </form>
            )}

            {/* Coordonnées directes officielles */}
            <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium block">Contact Officiel</span>
                <span className="font-bold text-white text-sm mt-0.5 block">Abdelaziz Motiaa</span>
                <span className="text-slate-500 text-[11px]">Responsable Plateforme Atlas Carbone</span>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium block">Email Direct</span>
                <a
                  href="mailto:abdelaziz.motiaa@gmail.com"
                  className="font-bold text-emerald-400 hover:underline text-sm mt-0.5 block truncate"
                >
                  abdelaziz.motiaa@gmail.com
                </a>
                <span className="text-slate-500 text-[11px]">Réponse garantie sous 24h</span>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium block">Téléphone</span>
                <a
                  href="tel:+212671581167"
                  className="font-bold text-emerald-400 hover:underline text-sm mt-0.5 block"
                >
                  +212 6 71 58 11 67
                </a>
                <span className="text-slate-500 text-[11px]">Casablanca (GMT+1)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Réglementaire */}
      <section className="py-14 bg-slate-900 border-b border-slate-800 text-slate-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            <span>Veille Réglementaire Carbone Maroc & MACF</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Restez informé des évolutions réglementaires et facteurs d’émission
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Recevez des analyses vérifiées sur les facteurs d’émissions nationaux, le calendrier MACF et les aides à la décarbonation. Pas de spam, désinscription en 1 clic.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="max-w-xl mx-auto pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder="votre.email@entreprise.ma"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition shrink-0"
              >
                {newsletterLoading ? 'Inscription...' : "M'inscrire"}
              </button>
            </div>

            <label className="flex items-start space-x-2 text-left text-xs text-slate-400 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newsletterConsent}
                onChange={e => setNewsletterConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>
                J’accepte de recevoir la veille réglementaire (double opt-in avec confirmation, distinct de la création de compte).
              </span>
            </label>

            {newsletterMsg && (
              <div
                className={`p-3 rounded-xl text-xs text-center font-medium ${
                  newsletterMsg.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                }`}
              >
                {newsletterMsg.text}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Footer Minimaliste Institutionnel */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-lg font-bold text-white tracking-tight">Atlas Carbone</span>
            <p className="mt-2 text-slate-400 leading-relaxed">
              Plateforme marocaine de comptabilité carbone, de pilotage des émissions GES et de conformité aux exigences export européennes (MACF).
            </p>
            <div className="mt-4 space-y-1 text-slate-400">
              <p>👤 <strong>Abdelaziz Motiaa</strong></p>
              <p>
                ✉️ <a href="mailto:abdelaziz.motiaa@gmail.com" className="text-emerald-400 hover:underline">abdelaziz.motiaa@gmail.com</a>
              </p>
              <p>
                📞 <a href="tel:+212671581167" className="text-emerald-400 hover:underline">+212 6 71 58 11 67</a>
              </p>
              <p className="text-slate-500 pt-1">Casablanca — Royaume du Maroc</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">Référentiels & Méthodologie</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>GHG Protocol Corporate Standard</li>
              <li>ISO 14064-1:2018 & ISO 14069</li>
              <li>Classeur National Bilan Carbone® Maroc</li>
              <li>Règlement UE MACF 2023/956 régime définitif</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3">Sécurité & Confidentialité</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>Conformité Loi 09-08 (CNDP)</li>
              <li>Isolation étanche des données multi-entreprises</li>
              <li>Catalogue des facteurs sanctuarisé côté serveur</li>
              <li>Calculs 100% déterministes certifiés</li>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
          <span>© 2026 Atlas Carbone. Développé par Abdelaziz Motiaa.</span>
          <span className="mt-2 sm:mt-0 font-mono">Conformité ISO 14064-1 & MACF Régime 2026</span>
        </div>
      </footer>
    </div>
  );
};
