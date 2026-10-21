/**
 * Atlas Carbone - Vue Plan de Transition & Simulations de Réduction
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Sun,
  Truck,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Calculator,
  ArrowRight,
  Trash2,
  Target,
  ShieldCheck,
  Layers,
  Milestone,
  AlertCircle
} from 'lucide-react';
import { ReductionAction } from '../types.js';
import { api } from '../api.js';

interface ReductionPlanViewProps {
  orgId: string;
}

export const ReductionPlanView: React.FC<ReductionPlanViewProps> = ({ orgId }) => {
  const [actions, setActions] = useState<ReductionAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [trajectoryData, setTrajectoryData] = useState<any | null>(null);
  const [targetYearFilter, setTargetYearFilter] = useState<number>(2030);
  const [reductionPctTarget, setReductionPctTarget] = useState<number>(30);

  // Modal ajout action
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Énergie renouvelable');
  const [responsible, setResponsible] = useState('');
  const [costMad, setCostMad] = useState<string>('');
  const [savingsTco2e, setSavingsTco2e] = useState<string>('');
  const [targetYear, setTargetYear] = useState<number>(2026);

  // Simulateur PV interactif
  const [simKwc, setSimKwc] = useState<number>(100);
  const solarProductionKwh = simKwc * 1650; // Moyenne Maroc : 1 650 kWh/kWc/an
  const solarSavingsTco2e = (solarProductionKwh * 0.642602) / 1000.0; // Mix ONEE

  const fetchActionsAndTrajectory = async () => {
    setLoading(true);
    try {
      const [actionsData, trajData] = await Promise.all([
        api.reduction.getActions(orgId),
        api.reduction.getTrajectory(orgId, { targetYear: targetYearFilter, reductionPct: reductionPctTarget }).catch(() => null)
      ]);
      setActions(actionsData || []);
      setTrajectoryData(trajData);
    } catch (e) {
      console.error("Erreur actions ou trajectoire:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionsAndTrajectory();
  }, [orgId, targetYearFilter, reductionPctTarget]);

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      await api.reduction.createAction({
        title,
        category,
        responsible,
        cost_mad: Number(costMad || 0),
        annual_savings_tco2e: Number(savingsTco2e || 0),
        target_year: targetYear
      }, orgId);
      setShowAddModal(false);
      setTitle('');
      setCostMad('');
      setSavingsTco2e('');
      fetchActionsAndTrajectory();
    } catch (err: any) {
      alert("Erreur création action: " + err.message);
    }
  };

  const handleUpdateStatus = async (actionId: string, newStatus: string) => {
    try {
      await api.reduction.updateAction(actionId, { status: newStatus }, orgId);
      fetchActionsAndTrajectory();
    } catch (err: any) {
      alert("Erreur mise à jour statut: " + err.message);
    }
  };

  const handleDeleteAction = async (actionId: string, actTitle: string) => {
    if (!confirm(`Supprimer l'action « ${actTitle} » du plan de réduction ?`)) return;
    try {
      await api.reduction.deleteAction(actionId, orgId);
      fetchActionsAndTrajectory();
    } catch (err: any) {
      alert("Erreur suppression: " + err.message);
    }
  };

  const totalSavings = actions.reduce((sum, a) => sum + (a.annual_savings_tco2e || 0), 0);
  const totalInvest = actions.reduce((sum, a) => sum + (a.cost_mad || 0), 0);

  return (
    <div className="space-y-6">
      {/* Synthèse du plan de réduction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Réductions Annuelles Cibles</span>
          <div className="text-3xl font-extrabold text-brand-900 mt-2">
            {totalSavings.toFixed(1)} <span className="text-sm font-normal text-slate-500">tCO2e / an</span>
          </div>
          <span className="text-xs text-emerald-700 font-semibold block mt-1">
            Sur {actions.length} action(s) engagée(s)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Investissement Total Estimé</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {totalInvest.toLocaleString('fr-FR')} <span className="text-sm font-normal text-slate-500">MAD HT</span>
          </div>
          <span className="text-xs text-slate-500 block mt-1">
            Retour sur investissement énergétique
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nouvelle Action</span>
            <p className="text-xs text-slate-500 mt-1">Ajouter une mesure concrète au plan de transition.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* Trajectoire Pluriannuelle de Décarbonation (SBTi / CDN Maroc) */}
      {trajectoryData && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">
                  Trajectoire Pluriannuelle & Objectif {trajectoryData.targetYear}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Aligné CDN Maroc & SBTi 1.5°C (-{trajectoryData.targetReductionPct}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Année de référence (Baseline) : <strong>{trajectoryData.baselineYear}</strong> ({trajectoryData.baselineEmissions} tCO2e)
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <label className="text-slate-600 font-semibold">Objectif d'abattement :</label>
              <select
                value={reductionPctTarget}
                onChange={e => setReductionPctTarget(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800"
              >
                <option value="20">-20% (Scénario modéré)</option>
                <option value="30">-30% (CDN Maroc 2030)</option>
                <option value="42">-42% (SBTi Net-Zero 1.5°C)</option>
                <option value="50">-50% (Accélération Européenne)</option>
              </select>
            </div>
          </div>

          {/* Jauge d'atteinte d'objectif */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">
                Couverture de l'objectif par les actions engagées :
              </span>
              <span className="font-extrabold text-sm text-brand-900">
                {trajectoryData.coveragePct}% {trajectoryData.coveragePct >= 100 ? '🎯 Objectif couvert !' : ''}
              </span>
            </div>

            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  trajectoryData.coveragePct >= 100
                    ? 'bg-emerald-600'
                    : trajectoryData.coveragePct >= 60
                    ? 'bg-brand-700'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, trajectoryData.coveragePct)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Émissions Baseline ({trajectoryData.baselineYear})</span>
                <span className="font-bold text-slate-900">{trajectoryData.baselineEmissions} tCO2e</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Cible en {trajectoryData.targetYear}</span>
                <span className="font-bold text-emerald-700">{trajectoryData.targetEmissions} tCO2e</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Réductions Planifiées</span>
                <span className="font-bold text-brand-900">-{trajectoryData.totalPlannedSavings} tCO2e/an</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Écart résiduel (Gap)</span>
                <span className={`font-bold ${trajectoryData.gapTco2e > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {trajectoryData.gapTco2e > 0 ? `${trajectoryData.gapTco2e} tCO2e à trouver` : 'Objectif atteint'}
                </span>
              </div>
            </div>
          </div>

          {/* Tableau de Trajectoire Année par Année */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="p-2.5">Année</th>
                  <th className="p-2.5">Cible Linéaire</th>
                  <th className="p-2.5">Projection Plan d'Actions</th>
                  <th className="p-2.5">Économies Cumulées</th>
                  <th className="p-2.5">Inventaire Réel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trajectoryData.trajectory.map((t: any) => (
                  <tr key={t.year} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 font-bold text-slate-900 font-mono">{t.year}</td>
                    <td className="p-2.5 text-slate-600 font-mono">{t.target_tco2e} tCO2e</td>
                    <td className="p-2.5 font-bold font-mono text-brand-900">{t.projected_tco2e} tCO2e</td>
                    <td className="p-2.5 text-emerald-700 font-mono font-semibold">
                      {t.cumulative_savings_tco2e > 0 ? `-${t.cumulative_savings_tco2e} tCO2e/an` : '0 tCO2e'}
                    </td>
                    <td className="p-2.5">
                      {t.actual_tco2e !== null ? (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                          {t.actual_tco2e} tCO2e
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Simulateur Décarbonation Solaire PV */}
      <div className="bg-gradient-to-r from-emerald-900 to-brand-950 text-white p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 text-brand-300 font-bold text-sm">
          <Sun className="w-5 h-5" />
          <span>Simulateur d'Évitement Carbone — Autoconsommation Solaire Photovoltaïque au Maroc</span>
        </div>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Le gisement solaire marocain produit en moyenne <strong>1 650 kWh / kWc installé par an</strong>. Chaque kilowattheure
          solaire substitué à l'électricité du réseau national évite <strong>0,6426 kgCO2e</strong> (mix moyen ONEE).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center pt-2">
          <div>
            <label className="block text-xs font-bold text-brand-200 mb-1">Puissance crête envisagée (kWc)</label>
            <input
              type="number"
              min="10"
              max="2000"
              value={simKwc}
              onChange={e => setSimKwc(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:ring-2 focus:ring-brand-400"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Surface estimée : ~{simKwc * 5} m² de toiture</span>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-xs space-y-1">
            <span className="text-slate-400">Production annuelle estimée :</span>
            <div className="text-lg font-bold text-white">
              {solarProductionKwh.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-300">kWh/an</span>
            </div>
            <span className="text-[11px] text-brand-300">Autoconsommation directe sur site</span>
          </div>

          <div className="bg-brand-800/80 p-4 rounded-xl border border-brand-500/30 text-xs space-y-1">
            <span className="text-brand-200">Émissions évitées chaque année :</span>
            <div className="text-2xl font-extrabold text-brand-100">
              {solarSavingsTco2e.toFixed(1)} <span className="text-xs font-normal text-brand-200">tCO2e / an</span>
            </div>
            <span className="text-[10px] text-brand-300 block">
              Présenté séparément du bilan brut selon le GHG Protocol
            </span>
          </div>
        </div>
      </div>

      {/* Liste des Actions Engagées */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-bold text-slate-900 text-sm">Feuille de Route & Actions de Décarbonation</span>
          <span>{actions.length} action(s) au plan</span>
        </div>

        <div className="divide-y divide-slate-100">
          {actions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aucune action enregistrée pour le moment.
            </div>
          ) : (
            actions.map(act => (
              <div key={act.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {act.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Responsable : <strong>{act.responsible || 'Direction'}</strong> • Échéance : Année {act.target_year}
                  </p>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Économie annuelle :</span>
                    <span className="font-extrabold text-brand-900 text-sm">
                      -{act.annual_savings_tco2e} tCO2e/an
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Budget estimé :</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {act.cost_mad ? `${act.cost_mad.toLocaleString('fr-FR')} MAD` : 'Nul à faible'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={act.status}
                      onChange={e => handleUpdateStatus(act.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border outline-none cursor-pointer ${
                        act.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : act.status === 'in_progress'
                          ? 'bg-brand-100 text-brand-800 border-brand-300'
                          : act.status === 'cancelled'
                          ? 'bg-slate-200 text-slate-500 border-slate-300 line-through'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      <option value="proposed">Proposée</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Réalisée</option>
                      <option value="cancelled">Annulée</option>
                    </select>

                    <button
                      onClick={() => handleDeleteAction(act.id, act.title)}
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="Supprimer cette action"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Ajout Action */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Ajouter une action au plan de transition</h3>

            <form onSubmit={handleCreateAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de l'action *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Remplacement chaudière fioul par biomasse grignons d'olive"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option>Énergie renouvelable</option>
                    <option>Efficacité énergétique</option>
                    <option>Logistique & Fret</option>
                    <option>Fluides frigorigènes</option>
                    <option>Achats bas carbone</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Année cible *</label>
                  <input
                    type="number"
                    required
                    value={targetYear}
                    onChange={e => setTargetYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Économies (tCO2e/an)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ex: 85.5"
                    value={savingsTco2e}
                    onChange={e => setSavingsTco2e(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coût estimé (MAD HT)</label>
                  <input
                    type="number"
                    placeholder="Ex: 350000"
                    value={costMad}
                    onChange={e => setCostMad(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilote / Responsable</label>
                <input
                  type="text"
                  placeholder="Ex: Directeur Technique"
                  value={responsible}
                  onChange={e => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl shadow transition"
                >
                  Enregistrer l'action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
