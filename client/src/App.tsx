/**
 * Atlas Carbone - Application SaaS Principale
 */

import React, { useState, useEffect } from 'react';
import {
  Globe2,
  LayoutDashboard,
  Activity,
  BookOpen,
  TrendingDown,
  Factory,
  FileText,
  CreditCard,
  LogOut,
  Building2,
  Calendar,
  Sparkles,
  ChevronDown,
  HelpCircle,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { AuthUser, Organization, Site, ReportingPeriod, OverviewData } from './types.js';
import { api, getStoredToken, setStoredToken, getStoredOrgId, setStoredOrgId } from './api.js';

// Vues
import { LandingView } from './views/LandingView.js';
import { DashboardOverviewView } from './views/DashboardOverviewView.js';
import { ActivitiesView } from './views/ActivitiesView.js';
import { FactorsCatalogView } from './views/FactorsCatalogView.js';
import { CbamExportView } from './views/CbamExportView.js';
import { ReductionPlanView } from './views/ReductionPlanView.js';
import { CommercialQuotesView } from './views/CommercialQuotesView.js';
import { ReportView } from './views/ReportView.js';
import { ErpIntegrationView } from './views/ErpIntegrationView.js';
import { OnboardingWizardModal } from './views/OnboardingWizardModal.js';
import { TrialFlowView } from './views/TrialFlowView.js';
import { AcademyView } from './views/AcademyView.js';
import { PublicContentView } from './views/PublicContentView.js';
import { Language, translations } from './i18n.js';
import { GraduationCap, Newspaper, KeyRound } from 'lucide-react';

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('fr');
  const [publicView, setPublicView] = useState<'landing' | 'trial' | 'academy' | 'guides' | 'news'>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string>('');
  const [currentView, setCurrentView] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Données de l'entreprise courante
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<string>('');
  const [sites, setSites] = useState<Site[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Vérifier la session au démarrage
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api.auth.me()
        .then(res => {
          setUser(res.user);
          setOrganizations(res.organizations);
          const savedOrg = getStoredOrgId() || res.organizations[0]?.id;
          if (savedOrg) {
            setCurrentOrgId(savedOrg);
            setStoredOrgId(savedOrg);
          }
        })
        .catch(() => {
          setStoredToken(null);
          setUser(null);
        });
    }
  }, []);

  // Charger les données de l'entreprise sélectionnée
  const refreshTenantData = async (orgId: string, periodId?: string) => {
    if (!orgId) return;
    try {
      const [periodsData, sitesData] = await Promise.all([
        api.periods.list(orgId),
        api.sites.list(orgId)
      ]);
      setPeriods(periodsData);
      setSites(sitesData);

      const targetPeriodId = periodId || (periodsData.length > 0 ? periodsData[0].id : '');
      setCurrentPeriodId(targetPeriodId);

      const ov = await api.organizations.getOverview(orgId, targetPeriodId);
      setOverviewData(ov);
    } catch (err) {
      console.error("Erreur chargement données entreprise:", err);
    }
  };

  useEffect(() => {
    if (currentOrgId && user) {
      refreshTenantData(currentOrgId);
    }
  }, [currentOrgId, user]);

  const handlePeriodChange = async (newPeriodId: string) => {
    setCurrentPeriodId(newPeriodId);
    try {
      const ov = await api.organizations.getOverview(currentOrgId, newPeriodId);
      setOverviewData(ov);
    } catch (err) {
      console.error("Erreur changement exercice:", err);
    }
  };

  const handleClosePeriod = async (periodId: string) => {
    try {
      await api.periods.close(currentOrgId, periodId);
      alert("L'exercice a été clôturé avec succès et est désormais immuable.");
      refreshTenantData(currentOrgId, periodId);
    } catch (err: any) {
      alert("Erreur lors de la clôture: " + err.message);
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setStoredOrgId(null);
    setUser(null);
    setOrganizations([]);
    setOverviewData(null);
  };

  const currentOrg = organizations.find(o => o.id === currentOrgId) || organizations[0];
  const isPeriodClosed = overviewData?.period?.status === 'closed';

  // Si non connecté, afficher le site public ou le parcours d'essai invité
  if (!user) {
    if (publicView === 'trial') {
      return (
        <TrialFlowView
          lang={lang}
          onClaimSuccess={(u, orgs) => {
            setUser(u);
            setOrganizations(orgs);
            if (orgs.length > 0) {
              const orgId = orgs[0].id;
              setCurrentOrgId(orgId);
              setStoredOrgId(orgId);
            }
            setPublicView('landing');
          }}
          onExitTrial={() => setPublicView('landing')}
        />
      );
    }

    if (publicView === 'academy') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setPublicView('landing')}>
              <div className="w-8 h-8 rounded-lg bg-brand-900 text-brand-300 flex items-center justify-center font-bold">
                <Globe2 className="w-5 h-5 text-brand-400" />
              </div>
              <span className="font-bold text-slate-900">Atlas Carbone — Académie</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                className="px-2.5 py-1 rounded border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-1"
              >
                <Globe2 className="w-3.5 h-3.5 text-brand-700" />
                <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
              </button>
              <button
                onClick={() => setPublicView('landing')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                ← {lang === 'en' ? 'Back to Home' : "Retour à l'accueil"}
              </button>
            </div>
          </header>
          <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
            <AcademyView
              lang={lang}
              onNavigateAction={(route) => {
                if (route === 'trial') setPublicView('trial');
                else setPublicView('landing');
              }}
            />
          </div>
        </div>
      );
    }

    if (publicView === 'guides' || publicView === 'news') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setPublicView('landing')}>
              <div className="w-8 h-8 rounded-lg bg-brand-900 text-brand-300 flex items-center justify-center font-bold">
                <Globe2 className="w-5 h-5 text-brand-400" />
              </div>
              <span className="font-bold text-slate-900">
                Atlas Carbone — {publicView === 'news' ? (lang === 'en' ? 'Regulatory News' : 'Actualités') : 'Guides Piliers'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                className="px-2.5 py-1 rounded border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-1"
              >
                <Globe2 className="w-3.5 h-3.5 text-brand-700" />
                <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
              </button>
              <button
                onClick={() => setPublicView('landing')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                ← {lang === 'en' ? 'Back to Home' : "Retour à l'accueil"}
              </button>
            </div>
          </header>
          <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
            <PublicContentView
              lang={lang}
              initialTab={publicView === 'news' ? 'news' : 'guides'}
              onSelectAction={(act) => {
                if (act === 'trial') setPublicView('trial');
                else setPublicView('landing');
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <LandingView
        lang={lang}
        onLanguageChange={setLang}
        onStartTrial={() => setPublicView('trial')}
        onOpenAcademy={() => setPublicView('academy')}
        onOpenContent={(tab) => setPublicView(tab)}
        onLoginSuccess={(u, orgs) => {
          setUser(u);
          setOrganizations(orgs);
          if (orgs.length > 0) {
            const orgId = orgs[0].id;
            setCurrentOrgId(orgId);
            setStoredOrgId(orgId);
          }
        }}
      />
    );
  }

  // Application Authentifiée Multi-Tenant
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Barre latérale de navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Logo & Sous-titre */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-brand-800 text-brand-300 flex items-center justify-center font-bold">
                <Globe2 className="w-5 h-5 text-brand-300" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight">Atlas Carbone</span>
                <span className="block text-[10px] text-slate-400 font-medium">Bilan GES & MACF Maroc</span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-400 p-1"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Sélecteur d'Entreprise (Tenant Switcher) */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Entreprise active :
            </label>
            <div className="relative">
              <select
                value={currentOrgId}
                onChange={e => {
                  const newId = e.target.value;
                  setCurrentOrgId(newId);
                  setStoredOrgId(newId);
                }}
                className="w-full bg-slate-800 text-white font-medium text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                {organizations.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Rôle : <strong className="text-brand-300">{currentOrg?.role || 'Membre'}</strong></span>
              <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded">
                Données Isolées
              </span>
            </div>
          </div>

          {/* Liens de Navigation */}
          <nav className={`p-3 space-y-1 text-xs font-semibold ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
            {[
              { id: 'overview', label: lang === 'en' ? "Overview" : "Vue d'ensemble", icon: LayoutDashboard },
              { id: 'activities', label: lang === 'en' ? "Data & Input" : "Données & Saisie", icon: Activity },
              { id: 'factors', label: lang === 'en' ? "Emission Factors" : "Catalogue Facteurs", icon: BookOpen },
              { id: 'reduction', label: lang === 'en' ? "Action Plan" : "Plan de transition", icon: TrendingDown },
              { id: 'cbam', label: lang === 'en' ? "EU Export (CBAM)" : "Export Europe (MACF)", icon: Factory },
              { id: 'integrations', label: lang === 'en' ? "ERP & API Keys" : "Connecteurs & API ERP", icon: KeyRound },
              { id: 'academy', label: lang === 'en' ? "Carbon Academy" : "Académie Carbone", icon: GraduationCap },
              { id: 'public_content', label: lang === 'en' ? "Guides & News" : "Guides & Veille", icon: Newspaper },
              { id: 'quotes', label: lang === 'en' ? "Subscription & Quote" : "Devis & Abonnement", icon: CreditCard },
              { id: 'report', label: lang === 'en' ? "Official Report" : "Rapport Officiel", icon: FileText }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition ${
                    isActive
                      ? 'bg-brand-800 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-200' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pied latéral : Profil & Onboarding */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <button
            onClick={() => setShowOnboarding(true)}
            className="w-full py-2 px-3 rounded-xl bg-brand-950/80 border border-brand-500/30 text-brand-300 hover:bg-brand-900 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Assistant Onboarding (10 étapes)</span>
          </button>

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="truncate pr-2">
              <span className="block font-bold text-white truncate">{user.full_name}</span>
              <span className="block text-[11px] text-slate-400 truncate">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Zone de Contenu Principal */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Topbar globale */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800">{currentOrg?.name}</span>
            <span>/</span>
            <span className="capitalize">{currentView.replace(/_/g, ' ')}</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="px-2.5 py-1 rounded-md border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-1"
              title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
            >
              <Globe2 className="w-3.5 h-3.5 text-brand-700" />
              <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
            </button>

            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
              MAD (Dirham Marocain)
            </span>
            <div className="flex items-center space-x-1 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-medium">Serveur Sécurisé</span>
            </div>
          </div>
        </header>

        {/* Conteneur de Vue */}
        <div className="p-6 md:p-8 flex-1">
          {currentView === 'overview' && (
            <DashboardOverviewView
              data={overviewData}
              periods={periods}
              currentPeriodId={currentPeriodId}
              onPeriodChange={handlePeriodChange}
              onNavigate={setCurrentView}
              onClosePeriod={handleClosePeriod}
              userRole={currentOrg?.role}
              orgId={currentOrgId}
              onOpenOnboarding={() => setShowOnboarding(true)}
            />
          )}

          {currentView === 'activities' && (
            <ActivitiesView
              orgId={currentOrgId}
              periodId={currentPeriodId}
              sites={sites}
              isPeriodClosed={isPeriodClosed}
              onRefreshOverview={() => refreshTenantData(currentOrgId, currentPeriodId)}
            />
          )}

          {currentView === 'factors' && <FactorsCatalogView />}

          {currentView === 'cbam' && <CbamExportView orgId={currentOrgId} />}

          {currentView === 'integrations' && <ErpIntegrationView orgId={currentOrgId} />}

          {currentView === 'reduction' && <ReductionPlanView orgId={currentOrgId} />}

          {currentView === 'quotes' && <CommercialQuotesView orgId={currentOrgId} />}

          {currentView === 'report' && (
            <ReportView
              data={overviewData}
              orgName={currentOrg?.name || 'Entreprise Marocaine'}
              currentOrgId={currentOrgId}
              lang={lang}
            />
          )}

          {currentView === 'academy' && (
            <AcademyView lang={lang} onNavigateAction={(view) => setCurrentView(view)} />
          )}

          {currentView === 'public_content' && (
            <PublicContentView lang={lang} onSelectAction={(view) => setCurrentView(view)} />
          )}
        </div>
      </main>

      {/* Assistant d'Onboarding en 10 étapes */}
      <OnboardingWizardModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onNavigate={setCurrentView}
        orgName={currentOrg?.name || 'Votre entreprise'}
        orgId={currentOrgId}
      />
    </div>
  );
};
