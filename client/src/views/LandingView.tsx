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
  Activity,
  Receipt,
  Landmark,
  Coins,
  Calendar,
  Award,
  Scale,
  ScrollText
} from 'lucide-react';
import { api, setStoredToken, setStoredOrgId } from '../api.js';
import { Language, translations } from '../i18n.js';
import { PricingModal } from '../components/PricingModal.js';

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
    summaryFr: 'Calcul simple des consommations des fours électriques, de l’électricité ONEE et traçabilité des matières premières (ferrailles locales) avec dossier officiel prêt pour vos clients en Europe.',
    summaryEn: 'Simple calculation of electric furnace consumption, ONEE electricity, and local raw materials (recycled scrap) with ready-to-share EU compliance dossiers.',
    dossierTypeFr: 'Fiche Technique MACF — Déclaration Officielle Export',
    dossierTypeEn: 'Official CBAM Technical Export Dossier'
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
    summaryFr: 'Mesure directe des émissions de vos fours à ciment, des combustibles et de l’électricité des broyeurs, conforme aux exigences de conformité européenne.',
    summaryEn: 'Direct measurement of cement kiln emissions, alternative fuels, and mill electricity, compliant with European export standards.',
    dossierTypeFr: 'Rapport Carbone Procédé Cimentier — Conforme Export UE',
    dossierTypeEn: 'Cement Process Carbon Report — EU Export Compliant'
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
    summaryFr: 'Mesure de l’empreinte carbone par tonne d’engrais : valorisation de l’énergie de vos ateliers et attestation officielle pour vos clients internationaux.',
    summaryEn: 'Carbon footprint calculation per tonne of fertilizer produced: heat recovery valuation and official compliance certificate for global buyers.',
    dossierTypeFr: 'Certificat d’Empreinte Carbone Fertilisants & Phosphates',
    dossierTypeEn: 'Fertilizer & Phosphate Product Carbon Footprint Certificate'
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
    summaryFr: 'Calcul par kilo de fruits récoltés : pompage d’eau (solaire ou ONEE), fertilisation, emballages carton et transport frigorifique vers l’Europe. Répondez aux exigences des supermarchés européens.',
    summaryEn: 'Calculation per kg of harvested fruit: water pumping (solar or ONEE), fertilization, carton packaging, and refrigerated European freight for supermarket audits.',
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
    summaryFr: 'Calcul par boîte de conserve : carburant des bateaux de pêche, cuisson vapeur en usine, huile végétale et boîtes métalliques. Valorisez la qualité de la conserve marocaine.',
    summaryEn: 'Calculation per canned unit: fishing vessel fuel, cannery steam, vegetable oil, and tinplate cans to demonstrate Moroccan fishery sustainability.',
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
    summaryFr: 'Calcul des consommations électriques de vos lignes d’assemblage, de vos machines et des expéditions maritimes vers l’Europe. Conforme aux demandes des constructeurs.',
    summaryEn: 'Measurement of assembly line electricity, machinery power, and express shipping to Europe. Fully aligned with OEM automaker requirements.',
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

  // Modal Tarifs & Monétisation en MAD
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingBillingCycle, setPricingBillingCycle] = useState<'annual' | 'monthly'>('annual');

  // Thème interactif de produit marocain sélectionné
  const [selectedProduct, setSelectedProduct] = useState<MoroccanProductProfile>(MOROCCAN_PRODUCTS[0]);

  // Simulateur Déterministe Confidentiel (AUCUNE valeur de facteur divulguée)
  const [simMode, setSimMode] = useState<'mad' | 'physical'>('mad');
  const [simAmountMad, setSimAmountMad] = useState<number>(25000);
  const [simType, setSimType] = useState<'elec' | 'diesel' | 'gaz' | 'fret'>('elec');
  const [simQty, setSimQty] = useState<number>(20000);
  const [simDist, setSimDist] = useState<number>(300);

  // Tarifs officiels marocains de référence (ONEE, Caisse de Compensation, Marché des Carburants)
  const getDerivedQuantityFromMad = () => {
    switch (simType) {
      case 'elec':
        return simAmountMad / 1.15; // Tarif ONEE Moyenne Tension PME/Industrie (1,15 MAD/kWh HT)
      case 'diesel':
        return simAmountMad / 12.50; // Prix moyen national Gasoil à la pompe (12,50 MAD/L TTC)
      case 'gaz':
        return (simAmountMad / 50.0) * 12.0; // 50 MAD / bouteille de 12kg subventionnée = 4,17 MAD/kg
      case 'fret':
        return simAmountMad / 25.0; // Barème indicatif transport routier marchandises
      default:
        return 0;
    }
  };

  const calculateQuickSim = () => {
    const qty = simMode === 'mad' ? getDerivedQuantityFromMad() : simQty;
    switch (simType) {
      case 'elec':
        return (qty * 0.722) / 1000.0;
      case 'diesel':
        return (qty * 3.16) / 1000.0;
      case 'gaz':
        return (qty * 3.01) / 1000.0;
      case 'fret':
        return simMode === 'mad'
          ? (qty * 200 * 0.10767) / 1000.0
          : (qty * simDist * 0.10767) / 1000.0;
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-800 selection:text-white">
      {/* BANDEAU INSTITUTIONNEL SOUVERAIN DU ROYAUME DU MAROC */}
      <div className="bg-[#022c22] border-b border-emerald-900 text-slate-200 py-2 px-4 text-xs relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 relative z-10">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-700 text-amber-300 font-extrabold text-[11px] shadow-sm">
              <span>🇲🇦</span>
              <span className="tracking-widest font-serif">المملكة المغربية</span>
            </span>
            <span className="text-white font-extrabold uppercase tracking-wider text-[11px]">
              ROYAUME DU MAROC
            </span>
            <span className="hidden sm:inline text-emerald-500 font-serif">•</span>
            <span className="hidden sm:inline text-[11px] text-emerald-200 font-medium">
              Système National de Comptabilité Carbone & Déclaration MACF
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[10px] text-slate-300 font-medium">
            <span className="flex items-center space-x-1 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Norme ISO 14064-1</span>
            </span>
            <span className="text-emerald-700">•</span>
            <span className="text-amber-300 font-semibold">Règlement MACF (UE) 2023/956</span>
            <span className="text-emerald-700">•</span>
            <span className="text-slate-300">Base Carbone Marocaine Homologuée</span>
          </div>
        </div>
      </div>

      {/* Barre de navigation claire et rassurante */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 border border-emerald-700 flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <Globe2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Atlas <span className="text-emerald-800">Carbone</span>
                </span>
                <span className="text-xs font-serif text-amber-700 font-bold hidden sm:inline">أطلس كربون</span>
              </div>
              <span className="block text-[10px] text-slate-500 font-medium tracking-wide">
                {lang === 'en' ? 'Kingdom of Morocco • Sovereign Carbon Accounting Platform' : 'Royaume du Maroc • Plateforme de Comptabilité Carbone'}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider text-slate-700">
            <a href="#livrables" className="hover:text-emerald-800 transition flex items-center space-x-1 text-slate-800">
              <span>{lang === 'en' ? 'Official Deliverables' : 'Livrables Officiels'}</span>
            </a>
            <a href="#produits-maroc" className="hover:text-emerald-800 transition">
              {lang === 'en' ? 'Export Sectors' : 'Filières Export'}
            </a>
            <a href="#simulateur" className="hover:text-emerald-800 transition text-emerald-900 flex items-center space-x-1">
              <span>{lang === 'en' ? 'MAD Bills Simulator' : 'Factures en MAD'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            </a>
            <a href="#calendrier" className="hover:text-emerald-800 transition">
              {lang === 'en' ? '2026-2030 Roadmap' : 'Cap 2026-2030'}
            </a>
            {onOpenAcademy && (
              <button onClick={onOpenAcademy} className="hover:text-emerald-800 transition flex items-center space-x-1 text-slate-700">
                <span>{lang === 'en' ? 'Academy' : 'Académie'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">10 cours</span>
              </button>
            )}
            <a href="#demo-accounts" className="hover:text-emerald-800 transition">
              {lang === 'en' ? 'Demos' : 'Démos'}
            </a>
            <a href="#tarifs" className="hover:text-emerald-800 transition text-emerald-900 font-extrabold flex items-center space-x-1">
              <span>{lang === 'en' ? 'Pricing (MAD)' : 'Tarifs (MAD)'}</span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black">MAD</span>
            </a>
            <a href="#contact" className="hover:text-emerald-800 transition">
              {lang === 'en' ? 'Quote' : 'Devis'}
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            {/* Basculeur de langue */}
            {onLanguageChange && (
              <button
                onClick={() => onLanguageChange(lang === 'fr' ? 'en' : 'fr')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition flex items-center space-x-1.5 shadow-sm"
                title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
              >
                <Globe2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
              </button>
            )}

            {/* Bouton Essai invité prioritaire */}
            {onStartTrial && (
              <button
                onClick={onStartTrial}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-sm transition border border-emerald-900"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{lang === 'en' ? 'Try for Free' : 'Essayer sans compte'}</span>
              </button>
            )}

            <a
              href="#demo-accounts"
              className="hidden lg:inline-flex px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition"
            >
              {lang === 'en' ? 'Company Space' : 'Espace Entreprise'}
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section Sobre & Rassurante (Direction 1 : Fond Clair & Vert Cèdre) */}
      <section className="relative overflow-hidden pt-14 pb-20 border-b border-slate-200 bg-gradient-to-b from-emerald-50/60 via-slate-50/80 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm text-emerald-900 text-xs font-bold tracking-wide">
                <span className="text-amber-600 font-extrabold text-sm">★</span>
                <span>Régime Définitif MACF 2026 • Norme ISO 14064-1 • Barème National Maroc</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.14]">
                La comptabilité carbone <span className="text-emerald-800">simple et certifiée</span> des entreprises marocaines.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                De vos factures d'électricité ONEE et reçus de carburant jusqu'aux dossiers d'audit pour l'Union Européenne (MACF) et vos banques marocaines : mesurez vos émissions réelles avec le barème national officiel, sans formules compliquées.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                {onStartTrial && (
                  <button
                    onClick={onStartTrial}
                    className="inline-flex items-center space-x-2.5 px-7 py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition group border border-emerald-900 text-sm"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{lang === 'en' ? 'Start Free Trial (0 MAD)' : 'Démarrer mon essai gratuit (0 MAD)'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition text-emerald-200" />
                  </button>
                )}
                <a
                  href="#livrables"
                  className="inline-flex items-center space-x-2 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold rounded-xl shadow-sm transition text-sm"
                >
                  <FileText className="w-4 h-4 text-emerald-800" />
                  <span>{lang === 'en' ? 'View Official Deliverables' : 'Voir les livrables officiels'}</span>
                </a>
              </div>

              {/* 4 Piliers Clairs pour Dirigeants Marocains */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-extrabold text-emerald-800 block text-lg font-mono">670+</span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block font-medium">Postes & Barèmes Nationaux</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-extrabold text-amber-700 block text-lg font-mono">100%</span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block font-medium">Calcul Serveur Sécurisé</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-extrabold text-emerald-800 block text-lg font-mono">0 MAD</span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block font-medium">Essai Gratuit PME Maroc</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="font-extrabold text-amber-700 block text-lg font-mono">2026</span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block font-medium">Régime MACF Conforme</span>
                </div>
              </div>
            </div>

            {/* Carte de Synthèse Exécutive Sobre (Fond Blanc & Contraste Franc) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-7 shadow-xl space-y-6 border border-slate-200 text-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span className="text-sm font-bold text-slate-900 tracking-wide">Exemple d'Inventaire Clôturé</span>
                  </div>
                  <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Conforme ISO 14064
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium block">Total Émissions Brutes</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      1 245,80 <span className="text-xs font-normal text-slate-500">tCO2e</span>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold mt-1 block">Calcul vérifiable et traçable</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium block">Intensité par Unité</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      0,42 <span className="text-xs font-normal text-slate-500">tCO2e / t</span>
                    </div>
                    <span className="text-[10px] text-slate-600 mt-1 block">Prêt pour audit client</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <span>Répartition des émissions</span>
                    <span>Structure par Scope</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-slate-700 mb-1 font-medium">
                        <span>Énergies directes (Gasoil camions, chaudières)</span>
                        <span className="font-mono font-bold text-amber-800">23% • 285,4 t</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-amber-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1 font-medium">
                        <span>Électricité réseau ONEE (Usines, ateliers, bureaux)</span>
                        <span className="font-mono font-bold text-emerald-800">36% • 449,8 t</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-emerald-700 h-2 rounded-full" style={{ width: '36%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1 font-medium">
                        <span>Transport & Achats (Livraisons, matières premières)</span>
                        <span className="font-mono font-bold text-teal-800">41% • 510,6 t</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-teal-600 h-2 rounded-full" style={{ width: '41%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-950">
                  <BadgeCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>🔒 Facteurs protégés : calculs exécutés côté serveur pour garantir l'acceptation de vos dossiers par les auditeurs.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* SECTION COMMENT ÇA MARCHE : SIMPLE, RAPIDE, SANS JARGON */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
              {lang === 'en' ? 'Simple 3-Step Process' : 'Simple, Accessible & Sans Jargon'}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              {lang === 'en' ? 'How Atlas Carbone Works for Your Company' : 'Comment ça marche pour votre entreprise ?'}
            </h2>
            <p className="text-sm text-slate-600">
              {lang === 'en'
                ? 'No climate science degree needed. Use your day-to-day utility bills and let our certified engine do the heavy lifting.'
                : 'Aucune expertise climatique requise. Utilisez vos factures du quotidien et laissez notre moteur certifié calculer vos résultats.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-emerald-700/50 hover:shadow-md transition group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg group-hover:scale-105 transition">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'en' ? '1. Enter Your Routine Bills' : '1. Saisissez vos factures habituelles'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'en'
                  ? 'Input electricity in kWh or Dirhams (ONEE bills), fleet diesel in liters or receipts, gas bottles, or freight weight. Enter values directly without manual conversions.'
                  : 'Renseignez vos consommations en unités physiques ou directement en Dirhams (factures ONEE, reçus de gasoil camions, bonbonnes de gaz, fret). Notre assistant calcule automatiquement les équivalents.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-emerald-700/50 hover:shadow-md transition group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-lg group-hover:scale-105 transition">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'en' ? '2. Automatic Certified Calculation' : '2. Calcul automatique certifié'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'en'
                  ? 'Atlas Carbone securely applies official Moroccan emission factors on our servers. You get precision calculations without worrying about formulas or coefficients.'
                  : 'Atlas Carbone applique le barème officiel marocain en toute sécurité sur nos serveurs. Vos données d’émissions sont calculées avec précision, sans formules compliquées.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-emerald-700/50 hover:shadow-md transition group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg group-hover:scale-105 transition">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'en' ? '3. Official Ready-to-Send Reports' : '3. Rapports officiels prêts à l’emploi'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'en'
                  ? 'Download bilingual PDF audit dossiers ready for European clients, customs (CBAM), and Moroccan banks. Return anytime to update with new monthly invoices.'
                  : 'Téléchargez vos attestations officielles et vos bilans bilingues (FR/EN) prêts pour vos clients européens (MACF), vos banques et vos auditeurs. Revenez à chaque nouvelle facture !'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION DES 3 LIVRABLES OFFICIELS POUR L'ENTREPRISE MAROCAINE */}
      <section id="livrables" className="py-20 bg-slate-50 border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold uppercase tracking-wider">
              <span>🇲🇦</span>
              <span>Livrables Stratégiques à Valeur Probante</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {lang === 'en'
                ? '3 Official Deliverables Moroccan Companies Truly Need'
                : 'Les 3 Livrables Officiels Indispensables à Votre Entreprise'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {lang === 'en'
                ? 'Why do Moroccan executives choose Atlas Carbone from start to finish? Because every invoice and activity entered produces certified documents accepted by European customs, Moroccan banks, and auditor networks.'
                : 'Pourquoi les chefs d’entreprise marocains utilisent Atlas Carbone jusqu’au bout ? Parce que chaque facture saisie alimente directement des dossiers réglementaires opposables aux banques, à l’Union Européenne et aux grands donneurs d’ordre.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Livrable 1 : Bilan ISO 14064-1 & Banques Marocaines */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:border-emerald-700 hover:shadow-md flex flex-col justify-between space-y-6 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-sm">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Banques & Crédits Verts
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    1. Rapport BEGES & Audit ISO 14064-1
                  </h3>
                  <p className="text-xs font-semibold text-emerald-800 mt-1 uppercase tracking-wide">
                    Bank Al-Maghrib & Ligne Tamwilcom Croissance Verte
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'en'
                    ? 'A comprehensive greenhouse gas inventory covering Scopes 1, 2, and 3. Required by Moroccan commercial banks under Bank Al-Maghrib ESG climate directives and unlocks Tamwilcom green subsidies.'
                    : 'Le bilan complet de vos émissions directes et indirectes (Scopes 1, 2, 3). Requis par les banques marocaines (Attijariwafa, BCP, BOA, CIH) pour les crédits verts et condition d’éligibilité aux subventions d’investissement Tamwilcom Tatwir (jusqu’à 30% d’aide).'}
                </p>

                <div className="pt-2 space-y-2 border-t border-slate-100 text-[11px] text-slate-700">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Conforme aux critères ESG de Bank Al-Maghrib</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Atout décisif pour les Marchés Publics (Décret 2-22-431)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Rapport immuable scellé avec empreinte SHA-256</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <span className="text-[10px] font-mono text-slate-500 block">
                  Format : PDF Institutionnel bilingue FR/EN prêt pour signature
                </span>
              </div>
            </div>

            {/* Livrable 2 : Fiche MACF / CBAM Union Européenne */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:border-amber-600 hover:shadow-md flex flex-col justify-between space-y-6 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shadow-sm">
                    <Scale className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    Export Union Européenne
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    2. Fiche de Déclaration MACF / CBAM
                  </h3>
                  <p className="text-xs font-semibold text-amber-800 mt-1 uppercase tracking-wide">
                    Règlement Européen (UE) 2023/956 Régime 2026
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'en'
                    ? 'Structured declaration sheet for European customs and buyers. Computes direct and indirect embedded emissions for steel, fertilizers, cement, and aluminum to prevent punitive default tax rates.'
                    : 'La fiche technique officielle requise par vos clients importateurs européens. Elle calcule avec exactitude les émissions intrinsèques de vos produits pour vous éviter la surtaxe forfaitaire punitive de l’UE.'}
                </p>

                <div className="pt-2 space-y-2 border-t border-slate-100 text-[11px] text-slate-700">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Décomposition par Code Douanier SH (Acier, Ciment, Engrais)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Facteur Électricité Réseau National ONEE homologué</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Prêt pour le Registre Transitoire & Définitif de l’UE</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <span className="text-[10px] font-mono text-slate-500 block">
                  Format : Tableau d’émissions intrinsèques prêt pour la douane UE
                </span>
              </div>
            </div>

            {/* Livrable 3 : Attestation Empreinte Produit & Scope 3 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:border-teal-700 hover:shadow-md flex flex-col justify-between space-y-6 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shadow-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-teal-50 text-teal-900 border border-teal-200">
                    Grandes Filières & Fournisseurs
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    3. Attestation Empreinte Produit
                  </h3>
                  <p className="text-xs font-semibold text-teal-800 mt-1 uppercase tracking-wide">
                    Automobile, Aéronautique, Textile & Agro-alimentaire
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'en'
                    ? 'Certified product-level carbon certificate per physical unit (per kg of fruit, canned unit, or cable harness) designed for automotive OEM audits (Stellantis, Renault) and supermarket standards.'
                    : 'Attestation chiffrée par unité vendue (par kilo de tomates, par boîte de conserve, par faisceau de câbles). Conçue sur-mesure pour les audits Scope 3 des constructeurs et de la grande distribution internationale.'}
                </p>

                <div className="pt-2 space-y-2 border-t border-slate-100 text-[11px] text-slate-700">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>Conforme aux cahiers des charges Renault & Stellantis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>Justificatif Eco-Score Grande Distribution (Carrefour, Tesco)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>Traçabilité d’origine Maroc avec mix électrique décarboné</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <span className="text-[10px] font-mono text-slate-500 block">
                  Format : Certificat produit horodaté avec code d’attestation unique
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* SECTION VEDETTE : THÈMES ET PRODUITS MAROCAINS (MACF, AGRICULTURE, INDUSTRIE) */}
      <section id="produits-maroc" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
              {lang === 'en' ? 'Product Footprint & Export Themes' : 'Traçabilité & Déclaration Carbone par Filière'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'en'
                ? 'Tailored for Moroccan Products Exported Worldwide'
                : 'Conçu sur-mesure pour les Produits Exportés par le Maroc'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
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
                      ? 'bg-emerald-50 border-emerald-800 shadow-sm text-emerald-950 font-bold'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-emerald-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block line-clamp-1">
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
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Colonne gauche : Profil et contexte marocain */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedProduct.badgeBg} ${selectedProduct.badgeText}`}>
                    {selectedProduct.code}
                  </span>
                  <span className="text-xs text-slate-600 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{lang === 'en' ? selectedProduct.productionSiteEn : selectedProduct.productionSiteFr}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {lang === 'en' ? selectedProduct.nameEn : selectedProduct.nameFr}
                  </h3>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mt-1">
                    {lang === 'en' ? selectedProduct.regulatoryDriverEn : selectedProduct.regulatoryDriverFr}
                  </p>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {lang === 'en' ? selectedProduct.summaryEn : selectedProduct.summaryFr}
                </p>

                {/* Répartition des émissions pour ce produit */}
                <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
                    <span>Structure d’émissions typique</span>
                    <span className="text-slate-900 font-mono text-sm font-bold">
                      {selectedProduct.sampleIntensity} {selectedProduct.intensityUnit}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Direct (Procédé / Fours)</span>
                      <span className="text-base font-bold text-amber-700 font-mono">{selectedProduct.scopeBreakdown.scope1}%</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Indirect (Élec ONEE)</span>
                      <span className="text-base font-bold text-emerald-800 font-mono">{selectedProduct.scopeBreakdown.scope2}%</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Amont / Fret TIR</span>
                      <span className="text-base font-bold text-teal-800 font-mono">{selectedProduct.scopeBreakdown.scope3}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite : Fiche de conformité générée */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <SelectedIcon className="w-5 h-5 text-emerald-800" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Dossier Technique Prêt à l’Emploi</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Conforme 2026
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 text-[10px] block font-bold">TYPE DE LIVRABLE :</span>
                    <span className="text-slate-900 font-bold block">
                      {lang === 'en' ? selectedProduct.dossierTypeEn : selectedProduct.dossierTypeFr}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Règlement applicable :</span>
                      <span className="font-semibold text-slate-900">UE 2023/956 & ISO 14064</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Précision garantie :</span>
                      <span className="font-semibold text-emerald-800">Conforme aux audits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Périmètre géographique :</span>
                      <span className="font-semibold text-slate-900">Maroc (MA)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sécurité des données :</span>
                      <span className="font-semibold text-emerald-800">Facteurs certifiés & protégés</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {onStartTrial && (
                      <button
                        onClick={onStartTrial}
                        className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
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
      <section id="demo-accounts" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">Espaces de Démonstration Pré-configurés</h2>
            <p className="text-sm text-slate-600">
              Découvrez la plateforme en 1 clic sans mot de passe, avec des inventaires réels clôturés.
            </p>
          </div>

          {errorMsg && (
            <div className="max-w-md mx-auto p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profil 1 : Agroalimentaire Multisites */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Agroalimentaire & Froid
                  </span>
                  <Building2 className="w-5 h-5 text-emerald-800" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Atlas Agro-Alimentaire SARL</h3>
                <p className="text-xs text-slate-500 mt-1">Sites : Casablanca (Usine) & Agadir (Entrepôt). Bilan 2025 clôturé.</p>
                <div className="mt-4 space-y-1 text-xs text-slate-700">
                  <p>👤 <strong>Tariq El Alami</strong> (Directeur Général)</p>
                  <p>📊 7 postes calculés, plan de transition PV 150 kWc</p>
                </div>
              </div>
              <button
                disabled={loadingDemo}
                onClick={() => handleQuickDemoLogin('admin@agro-atlas.ma', 'AgroAtlas2026!', 'org-agro-atlas')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>Accéder comme DG / Admin</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Profil 2 : Responsable Carbone / RSE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                    Responsable Carbone & RSE
                  </span>
                  <ShieldCheck className="w-5 h-5 text-teal-800" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Salma Berrada (Resp. RSE)</h3>
                <p className="text-xs text-slate-500 mt-1">Supervision de la collecte, contrôle des incertitudes et rapports.</p>
                <div className="mt-4 space-y-1 text-xs text-slate-700">
                  <p>🏢 Entreprise : Atlas Agro-Alimentaire</p>
                  <p>🔍 Traçabilité déterministe certifiée sans fuite de facteurs</p>
                </div>
              </div>
              <button
                disabled={loadingDemo}
                onClick={() => handleQuickDemoLogin('carbone@agro-atlas.ma', 'CarboneAtlas2026!', 'org-agro-atlas')}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>Accéder comme Resp. Carbone</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Profil 3 : Industrie Exportatrice MACF */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                    Industrie Exportatrice MACF
                  </span>
                  <Factory className="w-5 h-5 text-amber-800" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Métallurgie de l'Oriental SA</h3>
                <p className="text-xs text-slate-500 mt-1">Usine Selouane Nador. Export Barres béton (CN 7214 20 00).</p>
                <div className="mt-4 space-y-1 text-xs text-slate-700">
                  <p>👤 <strong>Mehdi Chraibi</strong> (Directeur Usine)</p>
                  <p>🇪🇺 Émissions intrinsèques directes/indirectes + dossier UE</p>
                </div>
              </div>
              <button
                disabled={loadingDemo}
                onClick={() => handleQuickDemoLogin('export@metal-oriental.ma', 'MetalExport2026!', 'org-metal-oriental')}
                className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>Accéder au Module MACF / CBAM</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* BOÎTE À OUTILS & SIMULATEUR FACTURES MAROCAINES EN DIRHAMS (MAD) */}
      <section id="simulateur" className="py-24 bg-slate-50 border-b border-slate-200 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold uppercase tracking-wider">
              <Receipt className="w-3.5 h-3.5 text-emerald-700" />
              <span>Simulateur Factures en Dirhams (MAD) & Unités Physiques</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'en'
                ? 'Convert Your Moroccan Utility Bills into Certified Carbon Data'
                : 'Convertissez vos Factures en Empreinte Carbone Réelle'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {lang === 'en'
                ? 'Select a routine expense and enter either your bill amount in Moroccan Dirhams (MAD) or direct physical volume. The certified Moroccan calculation runs securely on our servers.'
                : 'Sélectionnez une dépense courante et saisissez directement le montant en Dirhams (MAD) de votre facture ONEE ou reçu gasoil. Notre moteur effectue la conversion énergétique et le calcul d’émissions homologué.'}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            {/* Basculeur de mode : Facture MAD vs Quantité physique */}
            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setSimMode('mad')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                  simMode === 'mad'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-300" />
                <span>Facture en Dirhams (MAD)</span>
              </button>
              <button
                type="button"
                onClick={() => setSimMode('physical')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                  simMode === 'physical'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-300" />
                <span>Unités physiques (kWh, L...)</span>
              </button>
            </div>

            {/* Type d'énergie / dépense */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'elec', label: 'Électricité ONEE', sub: 'Moyenne Tension', icon: Zap },
                { id: 'diesel', label: 'Gasoil / Flotte', sub: 'Stations Afriquia/Shell', icon: Factory },
                { id: 'gaz', label: 'Gaz Butane / Four', sub: 'Caisse Compensation', icon: TrendingDown },
                { id: 'fret', label: 'Fret Routier TIR', sub: 'Transport Marchandises', icon: Globe2 }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = simType === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSimType(item.id as any)}
                    className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center space-y-1.5 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-sm ring-1 ring-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span className="text-xs">{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{item.sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Formulaire de saisie dynamique */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              {simMode === 'mad' ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <label className="text-xs font-bold text-slate-800">
                      Montant de la facture en Dirhams Marocains (MAD) :
                    </label>
                    {/* Boutons d'accès rapide */}
                    <div className="flex items-center space-x-1.5">
                      {[10000, 35000, 75000, 150000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSimAmountMad(val)}
                          className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition ${
                            simAmountMad === val
                              ? 'bg-emerald-800 text-white border-emerald-800 font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {val.toLocaleString('fr-FR')} DH
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={simAmountMad}
                      onChange={e => setSimAmountMad(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:border-emerald-600 font-mono text-base text-slate-900 outline-none pl-11 shadow-sm"
                    />
                    <Coins className="w-5 h-5 text-amber-600 absolute left-3.5 top-3.5" />
                    <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500">
                      MAD (Dirhams)
                    </span>
                  </div>

                  {/* Explication pédagogique de la conversion marocaine */}
                  <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                    <div className="flex items-center space-x-2 text-emerald-900 font-bold text-[11px] uppercase tracking-wide">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Barème tarifaire national marocain de référence :</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {simType === 'elec' && (
                        <>
                          Tarif ONEE Moyenne Tension PME/Industrie : <strong>1,15 MAD HT / kWh</strong>. Votre facture de{' '}
                          <strong>{simAmountMad.toLocaleString('fr-FR')} MAD</strong> correspond à environ{' '}
                          <strong className="text-emerald-900 font-mono">{Math.round(getDerivedQuantityFromMad()).toLocaleString('fr-FR')} kWh</strong>.
                        </>
                      )}
                      {simType === 'diesel' && (
                        <>
                          Gasoil pompes nationales : <strong>12,50 MAD TTC / Litre</strong>. Votre dépense de{' '}
                          <strong>{simAmountMad.toLocaleString('fr-FR')} MAD</strong> correspond à environ{' '}
                          <strong className="text-emerald-900 font-mono">{Math.round(getDerivedQuantityFromMad()).toLocaleString('fr-FR')} Litres</strong> de gasoil routier.
                        </>
                      )}
                      {simType === 'gaz' && (
                        <>
                          Gaz Butane (Caisse de Compensation) : <strong>50 MAD la bonbonne de 12 kg</strong> (soit 4,17 MAD/kg). Votre facture correspond à environ{' '}
                          <strong className="text-emerald-900 font-mono">{Math.round(getDerivedQuantityFromMad()).toLocaleString('fr-FR')} kg</strong> de gaz liquéfié.
                        </>
                      )}
                      {simType === 'fret' && (
                        <>
                          Barème transport routier marchandises : estimation indicative basée sur une distance interurbaine moyenne de 200 km.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {simType === 'elec' && 'Consommation d’électricité (kWh)'}
                      {simType === 'diesel' && 'Volume de carburant (litres de gasoil)'}
                      {simType === 'gaz' && 'Énergie consommée (kWh)'}
                      {simType === 'fret' && 'Masse transportée (tonnes)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={simQty}
                      onChange={e => setSimQty(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-emerald-600 font-mono text-sm text-slate-900 outline-none shadow-sm"
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
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-emerald-600 font-mono text-sm text-slate-900 outline-none shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="text-slate-500 font-medium">Barème officiel appliqué :</div>
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>
                          {simType === 'elec' && 'Mix Électrique Réseau National ONEE'}
                          {simType === 'diesel' && 'Carburant Flotte Routière Maroc'}
                          {simType === 'gaz' && 'Gaz Vapeur & Industrie Certifié'}
                        </span>
                      </div>
                      <div className="text-emerald-800 text-[11px] font-semibold">🔒 Calcul officiel sur le serveur — Formules protégées</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Carte de Résultat Officiel et Équivalence Terrestre Marocaine */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 border border-emerald-800/60 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  <span>Empreinte Carbone Calculée Certifiée</span>
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white">
                  {calculateQuickSim().toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-lg font-normal text-emerald-200">tCO2e</span>
                </div>
                <div className="text-xs text-emerald-300 font-medium">
                  Soit <strong>{(calculateQuickSim() * 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kgCO2e</strong> déclarables.
                </div>
                <div className="text-[11px] text-slate-300 pt-1">
                  Équivaut à la séquestration annuelle d’environ{' '}
                  <strong className="text-amber-300 font-mono">{Math.round((calculateQuickSim() * 1000) / 25)} arganiers / cèdres</strong> de l'Atlas marocain.
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                {onStartTrial && (
                  <button
                    onClick={onStartTrial}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Enregistrer dans mon Bilan</span>
                  </button>
                )}
                <a
                  href="#demo-accounts"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 text-center transition"
                >
                  Voir les Espaces Démo Prêts
                </a>
              </div>
            </div>

            {/* Note de confidentialité souveraine */}
            <div className="text-[11px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Confidentialité garantie :</strong> Atlas Carbone effectue tous les calculs déterministes sur ses serveurs sécurisés sans divulguer les formules internes. Vos données de facturation restent strictement confinées à votre entreprise.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION DU CALENDRIER RÉGLEMENTAIRE & FINANCEMENT VERT DU ROYAUME (2026 - 2030) */}
      <section id="calendrier" className="py-24 bg-white border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Cap 2026 - 2030 • Vision Stratégique du Royaume</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'en'
                ? 'Moroccan Green Regulatory & Banking Roadmap (2026 - 2030)'
                : 'Calendrier Réglementaire & Financement Vert (2026 - 2030)'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {lang === 'en'
                ? 'Anticipate deadlines: from European carbon border tax enforcement to Moroccan green credit regulations and the 2030 sustainable FIFA World Cup.'
                : 'Pourquoi les entreprises marocaines doivent structurer leur bilan dès maintenant ? Voici les échéances incontournables qui s’imposent à l’économie nationale.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Jalon 1: 2026 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-800 font-mono">2026</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Échéance Immédiate
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Taxe Carbone Européenne (Régime Définitif MACF)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fin du simple reporting déclaratif. Les exportateurs marocains d'acier, d'aluminium, de ciment et d'engrais doivent fournir leurs émissions réelles sous peine de surtaxes douanières maximales à l'entrée de l'UE.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 text-[11px] text-emerald-800 font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Module MACF Atlas Carbone prêt</span>
              </div>
            </div>

            {/* Jalon 2: 2026-2027 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-800 font-mono">2026/27</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                    Système Bancaire
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Directive Climat Bank Al-Maghrib & Crédits Verts
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Les banques commerciales marocaines conditionnent les taux d'intérêt et l'octroi des crédits d'investissement à l'évaluation du risque climatique et à la production d'un Bilan Carbone conforme ISO 14064.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 text-[11px] text-amber-800 font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Rapports compatibles Banques & Tamwilcom</span>
              </div>
            </div>

            {/* Jalon 3: 2028 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-teal-800 font-mono">2028</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-200">
                    Marchés Publics
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Éco-Conditionnalité de la Commande Publique
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Application généralisée du Décret sur les marchés publics marocains. Les appels d'offres de l'État et des entreprises publiques accordent des bonifications de points aux entreprises ayant quantifié leur empreinte.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 text-[11px] text-teal-800 font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Attestations probantes pour appels d’offres</span>
              </div>
            </div>

            {/* Jalon 4: 2030 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-800 font-mono">2030</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Cap Mondial 2030
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Engagement NDC Maroc (-45,5%) & Coupe du Monde
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Objectif climatique national du Royaume du Maroc et organisation conjointe de la Coupe du Monde FIFA 2030 bas-carbone. Les prestataires et sous-traitants doivent prouver leur trajectoire de décarbonation.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 text-[11px] text-amber-800 font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Trajectoires pluriannuelles certifiées</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* SECTION OFFRES & TARIFS EN DIRHAMS MAROCAINS (MAD) */}
      <section id="tarifs" className="py-24 bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'en' ? 'Moroccan Dirham (MAD) Official Pricing' : 'Tarification Officielle en Dirhams Marocains (MAD)'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'en'
                ? 'Transparent Pricing Tailored to Moroccan Companies'
                : 'Des Tarifs Clairs et Accessibles en Dirhams (MAD)'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {lang === 'en'
                ? 'From free 3-hour demo evaluation to heavy industry multisite deployments. Deterministic calculations, ISO 14064-1 compliance, and official EU CBAM declarations.'
                : 'De l’évaluation démo gratuite de 3 heures aux grands comptes industriels multisites. Tous les calculs sont 100% déterministes et conformes ISO 14064-1 & Déclaration MACF Europe.'}
            </p>

            {/* Sélecteur de rythme de facturation */}
            <div className="pt-4 flex justify-center">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPricingBillingCycle('annual')}
                  className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
                    pricingBillingCycle === 'annual'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{lang === 'en' ? 'Annual (Best Value)' : 'Annuel (2 mois offerts)'}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500 text-slate-950 font-black">
                    -20%
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPricingBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-lg transition ${
                    pricingBillingCycle === 'monthly'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'en' ? 'Monthly' : 'Mensuel'}
                </button>
              </div>
            </div>
          </div>

          {/* Grille des 4 cartes d'offres en MAD */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Découverte */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-6 hover:shadow-md transition">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Demo • 3h Window' : 'Démo • 3 Heures'}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {lang === 'en' ? 'Discovery Demo' : 'Pack Découverte'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {lang === 'en'
                      ? '3 hours of free access to evaluate the calculation engine and explore sector questions.'
                      : 'Accès d’évaluation de 3 heures pour tester le moteur déterministe et explorer les formulaires.'}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200">
                  <div className="text-3xl font-black text-slate-900 font-mono">0 MAD</div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {lang === 'en' ? 'Free for 3 hours of testing' : 'Gratuit pendant 3h de test'}
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>3 heures d'accès d'évaluation démo</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Simulateur factures ONEE & carburants</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>1 Questionnaire sectoriel guidé</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Rapport PDF avec réserves méthodologiques</span>
                  </li>
                </ul>
              </div>

              <div>
                {onStartTrial && (
                  <button
                    onClick={onStartTrial}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition text-center block"
                  >
                    {lang === 'en' ? 'Start Free Trial (3h)' : 'Démarrer l’essai gratuit (3h)'}
                  </button>
                )}
              </div>
            </div>

            {/* 2. PME Climat */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-6 hover:shadow-md transition">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    {lang === 'en' ? 'PME & Public Tenders' : 'PME & Marchés Publics'}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {lang === 'en' ? 'SME Climate Pack' : 'Pack PME Climat'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {lang === 'en'
                      ? 'The turnkey solution for Moroccan SMEs to comply with public procurement decree.'
                      : 'La solution complète pour les PME marocaines soumissionnant aux marchés de l’État.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {pricingBillingCycle === 'annual' ? '4 900' : '490'}
                    </span>
                    <span className="text-xs font-bold text-slate-600">MAD HT</span>
                    <span className="text-[10px] text-slate-500">/{pricingBillingCycle === 'annual' ? 'an' : 'mois'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Soit {pricingBillingCycle === 'annual' ? '5 880' : '588'} MAD TTC (TVA 20%)
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>1 Site</strong> d’exploitation permanent au Maroc</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Scopes 1 & 2 complets + Scope 3 essentiel</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Saisie en Dirhams (ONEE, Gasoil, Gaz)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Bilans PDF certifiés ISO 14064-1 illimités</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Jusqu'à 3 utilisateurs inclus</span>
                  </li>
                </ul>
              </div>

              <div>
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition text-center block"
                >
                  {lang === 'en' ? 'Subscribe in MAD' : 'Souscrire au Pack PME'}
                </button>
              </div>
            </div>

            {/* 3. Entreprise & Exportateur MACF (Recommandé) */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-600 ring-4 ring-emerald-600/10 flex flex-col justify-between space-y-6 shadow-xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider shadow">
                {lang === 'en' ? 'Recommended • EU Exporters' : 'Recommandé • Exportateurs UE'}
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    {lang === 'en' ? 'Industry & European CBAM' : 'Industrie & Export UE'}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {lang === 'en' ? 'Enterprise & CBAM Pack' : 'Pack Entreprise & MACF'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {lang === 'en'
                      ? 'Designed for Moroccan manufacturers exporting to EU and subject to European carbon border tax.'
                      : 'Conçu pour les industriels marocains exportant vers l’Union Européenne et soumis au MACF.'}
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {pricingBillingCycle === 'annual' ? '14 500' : '1 450'}
                    </span>
                    <span className="text-xs font-bold text-slate-600">MAD HT</span>
                    <span className="text-[10px] text-slate-500">/{pricingBillingCycle === 'annual' ? 'an' : 'mois'}</span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
                    Soit {pricingBillingCycle === 'annual' ? '17 400' : '1 740'} MAD TTC (TVA 20%)
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Jusqu'à 5 sites</strong> de production / usines</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Module MACF / CBAM Union Européenne</strong></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Intensité carbone par tonne produite pour douanes UE</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Directive Climat Bank Al-Maghrib (Crédits Verts)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>10 utilisateurs & Rôles RBAC personnalisés</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Support prioritaire sous 24h</span>
                  </li>
                </ul>
              </div>

              <div>
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition text-center block flex items-center justify-center space-x-2"
                >
                  <span>{lang === 'en' ? 'Subscribe to CBAM Pack' : 'Souscrire au Pack MACF'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4. Grand Compte & Industrie */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between space-y-6 hover:shadow-md transition">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Corporate & Heavy Industry' : 'Grand Compte & Industrie'}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {lang === 'en' ? 'Corporate Heavy Industry' : 'Pack Grand Compte'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {lang === 'en'
                      ? 'For large groups, metallurgy, cement, fertilizers, and multi-facility logistics fleets.'
                      : 'Pour les grands groupes multisites, sidérurgie, cimenteries, engrais et flottes logistiques.'}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {pricingBillingCycle === 'annual' ? '29 000' : '2 900'}
                    </span>
                    <span className="text-xs font-bold text-slate-600">MAD HT</span>
                    <span className="text-[10px] text-slate-500">/{pricingBillingCycle === 'annual' ? 'an' : 'mois'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Soit {pricingBillingCycle === 'annual' ? '34 800' : '3 480'} MAD TTC (TVA 20%)
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Sites et utilisateurs illimités</strong></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Portail vérificateur externe (Auditeur ISO 14065)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Connecteurs API ERP & imports massifs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Trajectoire de décarbonation Cap 2030 sur-mesure</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Accompagnement expert senior & NDA renforcé</span>
                  </li>
                </ul>
              </div>

              <div>
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition text-center block"
                >
                  {lang === 'en' ? 'Get Corporate Quote / Proforma' : 'Demander un Bon de Commande'}
                </button>
              </div>
            </div>
          </div>

          {/* Bandeau de réassurance commerciale et bancaire */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-extrabold text-white">
                  Règlement par Virement Bancaire Marocain ou Carte Bancaire CMI
                </h4>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Toutes les offres font l'objet d'un Bon de Commande officiel et d'une facture proforma immédiate avec RIB bancaire marocain (Attijariwafa bank / Banque Populaire). Mention légale de TVA marocaine 20% pour récupération comptable.
              </p>
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setShowPricingModal(true)}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Ouvrir le Module de Souscription en MAD</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Formulaire de Contact & Devis Officiel */}
      <section id="contact" className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">Demander une Démonstration ou un Devis</h2>
            <p className="text-sm text-slate-600">
              Remplissez ce formulaire pour recevoir un devis officiel personnalisé en Dirhams marocains (MAD).
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            {leadSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Demande enregistrée avec succès !</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Merci <strong>{leadName}</strong>. Un accusé de réception a été envoyé à <strong>{leadEmail}</strong>.
                  Notre responsable vous recontactera sous 24h.
                </p>
                <button
                  onClick={() => setLeadSubmitted(false)}
                  className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-200"
                >
                  Envoyer une autre demande
                </button>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nom complet *</label>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={e => setLeadName(e.target.value)}
                      placeholder="M. Karim Bennani"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-600 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email professionnel *</label>
                    <input
                      type="email"
                      required
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      placeholder="k.bennani@entreprise.ma"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-600 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Raison sociale *</label>
                    <input
                      type="text"
                      required
                      value={leadCompany}
                      onChange={e => setLeadCompany(e.target.value)}
                      placeholder="Nom de la société"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-600 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={leadPhone}
                      onChange={e => setLeadPhone(e.target.value)}
                      placeholder="+212 6 XX XX XX XX"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-600 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Secteur d'activité</label>
                    <select
                      value={leadSector}
                      onChange={e => setLeadSector(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-600 shadow-sm"
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
                  <label className="block font-bold text-slate-700 mb-1">Votre projet ou besoin spécifique</label>
                  <textarea
                    rows={3}
                    value={leadMessage}
                    onChange={e => setLeadMessage(e.target.value)}
                    placeholder="Précisez votre demande (bilan Scopes 1-2-3, conformité MACF, sites concernés)..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-600 shadow-sm"
                  ></textarea>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    Vos données sont strictement protégées conformément à la Loi marocaine 09-08 (CNDP).
                  </span>
                  <button
                    type="submit"
                    disabled={leadLoading}
                    className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
                  >
                    {leadLoading ? 'Envoi en cours...' : 'Envoyer ma demande de devis'}
                  </button>
                </div>
              </form>
            )}

            {/* Coordonnées directes officielles */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Contact Officiel</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">Abdelaziz Motiaa</span>
                <span className="text-slate-500 text-[11px]">Responsable Plateforme Atlas Carbone</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Email Direct</span>
                <a
                  href="mailto:abdelaziz.motiaa@gmail.com"
                  className="font-bold text-emerald-800 hover:underline text-sm mt-0.5 block truncate"
                >
                  abdelaziz.motiaa@gmail.com
                </a>
                <span className="text-slate-500 text-[11px]">Réponse garantie sous 24h</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Téléphone</span>
                <a
                  href="tel:+212671581167"
                  className="font-bold text-emerald-800 hover:underline text-sm mt-0.5 block"
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
      <section className="py-14 bg-white border-b border-slate-200 text-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
            <Mail className="w-3.5 h-3.5 text-emerald-700" />
            <span>Veille Réglementaire Carbone Maroc & MACF</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Restez informé des évolutions réglementaires et facteurs d’émission
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
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
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 shadow-sm"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition shrink-0"
              >
                {newsletterLoading ? 'Inscription...' : "M'inscrire"}
              </button>
            </div>

            <label className="flex items-start space-x-2 text-left text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newsletterConsent}
                onChange={e => setNewsletterConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-800 focus:ring-0"
              />
              <span>
                J’accepte de recevoir la veille réglementaire (double opt-in avec confirmation, distinct de la création de compte).
              </span>
            </label>

            {newsletterMsg && (
              <div
                className={`p-3 rounded-xl text-xs text-center font-medium ${
                  newsletterMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border border-rose-300 text-rose-900'
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

      {/* Modal Tarifs & Monétisation en MAD */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        lang={lang || 'fr'}
        isPaywallExpired={false}
        onSubscriptionSuccess={(u, orgs) => onLoginSuccess(u, orgs)}
      />
    </div>
  );
};
