import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Building2,
  Calendar,
  Lock,
  Unlock,
  AlertTriangle,
  Zap,
  Activity,
  Download,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Flame,
  Truck,
  Leaf,
  Compass,
  Coins,
  Users,
  Boxes,
  Edit3,
  X,
  ArrowRight
} from 'lucide-react';
import { OverviewData, ReportingPeriod } from '../types.js';
import { api } from '../api.js';

interface DashboardOverviewViewProps {
  data: OverviewData | null;
  periods: ReportingPeriod[];
  currentPeriodId: string;
  onPeriodChange: (id: string) => void;
  onNavigate: (view: string) => void;
  onClosePeriod: (periodId: string) => void;
  userRole?: string;
  orgId?: string;
  onOpenOnboarding?: () => void;
}

const ONBOARDING_TITLES = [
  "1. Fiche entreprise & siège",
  "2. Exercice & périmètre",
  "3. Déclaration des sites",
  "4. Questionnaire d'applicabilité",
  "5. Collecte des factures & données",
  "6. Affectation des tâches",
  "7. Saisie des activités",
  "8. Contrôle des anomalies",
  "9. Révision & Clôture immuable",
  "10. Édition des rapports officiels"
];

export const DashboardOverviewView: React.FC<DashboardOverviewViewProps> = ({
  data,
  periods,
  currentPeriodId,
  onPeriodChange,
  onNavigate,
  onClosePeriod,
  userRole,
  orgId,
  onOpenOnboarding
}) => {
  const [scope2Method, setScope2Method] = useState<'location' | 'market'>('location');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);

  // Modal d'édition des indicateurs d'activité / intensité
  const [showIntensityModal, setShowIntensityModal] = useState(false);
  const [inputRevenue, setInputRevenue] = useState<string>('');
  const [inputEmployees, setInputEmployees] = useState<string>('');
  const [inputProduction, setInputProduction] = useState<string>('');
  const [inputUnitName, setInputUnitName] = useState<string>('unités');
  const [savingIntensity, setSavingIntensity] = useState(false);

  useEffect(() => {
    if (orgId) {
      api.organizations.getOnboarding(orgId)
        .then(res => {
          if (res?.onboarding_step) setOnboardingStep(res.onboarding_step);
          if (res?.onboarding_completed !== undefined) setOnboardingCompleted(res.onboarding_completed);
        })
        .catch(console.error);
    }
  }, [orgId]);

  useEffect(() => {
    if (data?.period) {
      setInputRevenue(data.period.revenue_mad ? String(data.period.revenue_mad) : '');
      setInputEmployees(data.period.employee_count ? String(data.period.employee_count) : '');
      setInputProduction(data.period.production_units ? String(data.period.production_units) : '');
      setInputUnitName(data.period.production_unit_name || 'unités');
    }
  }, [data?.period]);

  const handleSaveIntensity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !currentPeriodId) return;
    setSavingIntensity(true);
    try {
      await api.periods.updateIntensity(orgId, currentPeriodId, {
        revenue_mad: inputRevenue ? Number(inputRevenue) : 0,
        employee_count: inputEmployees ? Number(inputEmployees) : 0,
        production_units: inputProduction ? Number(inputProduction) : 0,
        production_unit_name: inputUnitName || 'unités'
      });
      setShowIntensityModal(false);
      onPeriodChange(currentPeriodId);
    } catch (err: any) {
      alert("Erreur mise à jour des indicateurs: " + err.message);
    } finally {
      setSavingIntensity(false);
    }
  };

  if (!data || !data.period) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Aucun exercice de reporting sélectionné</h3>
        <p className="text-sm text-slate-500 mt-1">Créez un exercice pour commencer à mesurer vos émissions.</p>
      </div>
    );
  }

  const { period, summary, byScope, byCategory, bySite, uncertainty } = data;
  const isClosed = period.status === 'closed';

  return (
    <div className="space-y-6">
      {/* Barre supérieure : Sélecteur d'exercice & Statut */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-brand-700 shrink-0" />
          <div>
            <div className="flex items-center space-x-2">
              <select
                value={currentPeriodId}
                onChange={e => onPeriodChange(e.target.value)}
                className="font-bold text-slate-900 bg-transparent border-none text-lg focus:ring-0 cursor-pointer hover:text-brand-800"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.year})
                  </option>
                ))}
              </select>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full flex items-center space-x-1 ${
                  isClosed
                    ? 'bg-slate-100 text-slate-700 border border-slate-300'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 animate-pulse'
                }`}
              >
                {isClosed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{isClosed ? 'Exercice Clôturé (Immuable)' : 'Collecte en cours (Provisoire)'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Périmètre : Contrôle opérationnel • Unité légale : Tonne de CO2 équivalent (tCO2e)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('activities')}
            className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Saisir une activité</span>
          </button>

          <button
            onClick={() => onNavigate('report')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-sm transition flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Rapport Officiel</span>
          </button>

          {!isClosed && userRole === 'admin' && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs rounded-xl transition flex items-center space-x-1"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Clôturer l'inventaire</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper d'Onboarding Persistant */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-brand-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Parcours Bilan Carbone • Étape {onboardingStep} sur 10
              </span>
              {onboardingCompleted && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Complet
                </span>
              )}
            </div>
            <h4 className="font-bold text-sm text-white mt-0.5">
              {ONBOARDING_TITLES[onboardingStep - 1] || "Guide de progression"}
            </h4>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden md:flex flex-col items-end text-xs text-emerald-200">
            <span>Progression : {Math.round((onboardingStep / 10) * 100)}%</span>
            <div className="w-28 bg-white/20 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(onboardingStep / 10) * 100}%` }}
              ></div>
            </div>
          </div>
          <button
            onClick={() => onOpenOnboarding?.()}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5 shrink-0"
          >
            <span>Poursuivre le parcours</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cartes KPI Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Bilan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Émissions Brutes</span>
            <span className="p-2 rounded-xl bg-brand-50 text-brand-800">
              <TrendingDown className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">
              {summary.totalTCO2e.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
              <span className="text-sm font-normal text-slate-500">tCO2e</span>
            </div>
            <span className="text-xs text-slate-500 font-medium block mt-1">
              {(summary.totalTCO2e * 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kgCO2e
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Incertitude globale :</span>
            <span className="font-bold text-slate-800">±{uncertainty.uncertaintyRelativePct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Scope 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scope 1 (Direct)</span>
              <p className="text-[11px] text-slate-400">Combustion & Fuites</p>
            </div>
            <span className="p-2 rounded-xl bg-orange-50 text-orange-700">
              <Flame className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {summary.scope1TCO2e.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
              <span className="text-xs font-normal text-slate-500">tCO2e</span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              {summary.totalTCO2e > 0 ? ((summary.scope1TCO2e / summary.totalTCO2e) * 100).toFixed(0) : 0}% du total brut
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Chaudières, carburant flotte, fluides
          </div>
        </div>

        {/* Scope 2 (avec bascule Location / Market) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scope 2 (Énergie)</span>
              <p className="text-[11px] text-slate-400">Électricité réseau</p>
            </div>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Zap className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {summary.scope2TCO2e.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
              <span className="text-xs font-normal text-slate-500">tCO2e</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                Location-based
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Réseau ONEE (0,6426 kg/kWh)</span>
            <span className="font-semibold text-slate-700">Non cumulable</span>
          </div>
        </div>

        {/* Scope 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scope 3 (Chaîne de valeur)</span>
              <p className="text-[11px] text-slate-400">Achats & Fret</p>
            </div>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Truck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {summary.scope3TCO2e.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
              <span className="text-xs font-normal text-slate-500">tCO2e</span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              {summary.totalTCO2e > 0 ? ((summary.scope3TCO2e / summary.totalTCO2e) * 100).toFixed(0) : 0}% du total brut
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Achats matières, fret amont/aval, trajets
          </div>
        </div>
      </div>

      {/* Indicateurs d'Intensité Carbone (ISO 14064 §9 & Décret Marchés Publics) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-slate-900 text-sm">
              Indicateurs d'Intensité d'Activité & Ratios Économiques
            </h3>
          </div>
          <button
            onClick={() => setShowIntensityModal(true)}
            className="text-xs text-brand-800 hover:text-brand-900 font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Renseigner mes indicateurs (CA, Effectif, Production)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Intensité Économique */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px] font-medium">Intensité Chiffre d'Affaires</span>
            <div className="text-lg font-extrabold text-slate-900">
              {summary.intensityRevenueTCO2ePerMMad
                ? `${summary.intensityRevenueTCO2ePerMMad.toFixed(2)} tCO₂e / M MAD`
                : <span className="text-xs font-normal text-slate-400 italic">Non renseigné</span>}
            </div>
            <p className="text-[10px] text-slate-400">
              CA déclaré : {period.revenue_mad ? `${period.revenue_mad.toLocaleString('fr-FR')} MAD` : '0 MAD'}
            </p>
          </div>

          {/* Intensité Collaborateur */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px] font-medium">Intensité par Salarié (ETP)</span>
            <div className="text-lg font-extrabold text-slate-900">
              {summary.intensityEmployeeTCO2ePerEmployee
                ? `${summary.intensityEmployeeTCO2ePerEmployee.toFixed(2)} tCO₂e / employé`
                : <span className="text-xs font-normal text-slate-400 italic">Non renseigné</span>}
            </div>
            <p className="text-[10px] text-slate-400">
              Effectif : {period.employee_count ? `${period.employee_count} ETP` : '0'}
            </p>
          </div>

          {/* Intensité Physique */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px] font-medium">Intensité Production Unitaire</span>
            <div className="text-lg font-extrabold text-slate-900">
              {summary.intensityProductionTCO2ePerUnit
                ? `${summary.intensityProductionTCO2ePerUnit.toFixed(4)} tCO₂e / ${summary.productionUnitName || 'unité'}`
                : <span className="text-xs font-normal text-slate-400 italic">Non renseigné</span>}
            </div>
            <p className="text-[10px] text-slate-400">
              Volume : {period.production_units ? `${period.production_units.toLocaleString('fr-FR')} ${summary.productionUnitName || 'unités'}` : '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Ventilation graphique et par site */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Répartition par Catégorie */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-brand-800" />
              <h3 className="font-bold text-slate-900 text-sm">Ventilation des Émissions par Poste d'Activité</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">{byCategory.length} catégories actives</span>
          </div>

          <div className="space-y-3">
            {byCategory.map((cat, idx) => {
              const pct = summary.totalTCO2e > 0 ? (cat.tco2e / summary.totalTCO2e) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="capitalize">{cat.label.replace(/_/g, ' ')}</span>
                    <span className="font-bold">
                      {cat.tco2e.toFixed(1)} tCO2e ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        cat.scope === 1 ? 'bg-orange-500' : cat.scope === 2 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {summary.biogenicTCO2e > 0 && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center space-x-2">
                <Leaf className="w-4 h-4 text-emerald-700" />
                <span>CO2 Biogénique (Sols / Biomasse) — Déclaré séparément :</span>
              </div>
              <span className="font-bold">{summary.biogenicTCO2e.toFixed(2)} tCO2e (hors total fossile)</span>
            </div>
          )}
        </div>

        {/* Répartition par Site & Incertitude */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sites */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-brand-800" />
                <h3 className="font-bold text-slate-900 text-sm">Émissions par Site Opérationnel</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">{bySite.length} sites</span>
            </div>

            <div className="space-y-3">
              {bySite.map((site, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{site.name}</span>
                    <span className="block text-[11px] text-slate-500">Périmètre consolidé</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">{site.tco2e.toFixed(1)} tCO2e</span>
                    <span className="block text-[11px] text-slate-400">
                      {summary.totalTCO2e > 0 ? ((site.tco2e / summary.totalTCO2e) * 100).toFixed(0) : 0}% du total
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incertitude & Qualité documentaire */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Qualité des Données & Intervalle de Confiance (95%)</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Propagation d'incertitude selon la méthode gaussienne (u_rel = sqrt(u_A^2 + u_FE^2)) conforme ISO 14064-1.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Intervalle estimé :</span>
                <span className="font-bold text-slate-900">
                  [{(uncertainty.minKg / 1000).toFixed(1)} — {(uncertainty.maxKg / 1000).toFixed(1)}] tCO2e
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Incertitude relative combinée :</span>
                <span className="font-bold text-brand-800">±{uncertainty.uncertaintyRelativePct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Qualité documentaire globale :</span>
                <span className="font-bold text-emerald-700">Élevée (Factures réelles & compteurs)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Clôture */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-amber-700">
              <Lock className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Clôture définitive de l'Exercice {period.year}</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              La clôture de l'exercice fige définitivement l'ensemble des données d'activité, des facteurs appliqués et
              des calculs sous forme d'un <strong>snapshot immuable</strong>.
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p>✓ Tous les facteurs d'émission utilisés sont au statut <strong>validé</strong>.</p>
              <p>✓ Aucune modification ultérieure ne pourra écraser ce bilan officiel.</p>
              <p>✓ Les publications de nouveaux facteurs dans le catalogue n'altéreront pas ce résultat.</p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onClosePeriod(period.id);
                  setShowCloseModal(false);
                }}
                className="px-5 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow transition"
              >
                Confirmer la clôture immuable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'Édition des Indicateurs d'Activité / Intensité */}
      {showIntensityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base font-bold text-slate-900">Indicateurs d'Activité & Ratios</h3>
              </div>
              <button onClick={() => setShowIntensityModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Renseignez les données économiques de l'exercice {period.year} pour calculer automatiquement vos ratios d'intensité carbone conformément à la norme ISO 14064-1 (§9) et aux décrets marocains.
            </p>

            <form onSubmit={handleSaveIntensity} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chiffre d'Affaires Annuel (MAD HT)</label>
                <input
                  type="number"
                  step="any"
                  value={inputRevenue}
                  onChange={e => setInputRevenue(e.target.value)}
                  placeholder="Ex: 25000000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-700"
                />
                <span className="text-[10px] text-slate-400">Permet d'évaluer vos émissions en tCO₂e par Million de Dirhams.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Effectif Moyen Annuel (Salariés ETP)</label>
                <input
                  type="number"
                  step="1"
                  value={inputEmployees}
                  onChange={e => setInputEmployees(e.target.value)}
                  placeholder="Ex: 85"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-700"
                />
                <span className="text-[10px] text-slate-400">Permet d'évaluer vos émissions par collaborateur.</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Volume de Production</label>
                  <input
                    type="number"
                    step="any"
                    value={inputProduction}
                    onChange={e => setInputProduction(e.target.value)}
                    placeholder="Ex: 12500"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unité produite</label>
                  <input
                    type="text"
                    value={inputUnitName}
                    onChange={e => setInputUnitName(e.target.value)}
                    placeholder="Ex: tonnes, pièces, boîtes"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIntensityModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingIntensity}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow transition disabled:opacity-50"
                >
                  {savingIntensity ? 'Enregistrement...' : 'Enregistrer les ratios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
