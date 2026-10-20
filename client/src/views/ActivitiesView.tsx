/**
 * Atlas Carbone - Vue Saisie & Gestion des Activités
 * Avec composant "Voir le calcul" et importateur CSV
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Calculator,
  Download
} from 'lucide-react';
import { ActivityRecord, Site, EmissionFactor, CalculationTrace } from '../types.js';
import { api } from '../api.js';

interface ActivitiesViewProps {
  orgId: string;
  periodId: string;
  sites: Site[];
  isPeriodClosed: boolean;
  onRefreshOverview: () => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  orgId,
  periodId,
  sites,
  isPeriodClosed,
  onRefreshOverview
}) => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Saisie
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSiteId, setFormSiteId] = useState(sites[0]?.id || '');
  const [formLabel, setFormLabel] = useState('');
  const [formQuantity, setFormQuantity] = useState<string>('');
  const [formUnit, setFormUnit] = useState('kWh');
  const [formFactorId, setFormFactorId] = useState('');
  const [formInvoiceRef, setFormInvoiceRef] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Facteurs pour la sélection
  const [availableFactors, setAvailableFactors] = useState<EmissionFactor[]>([]);
  const [factorSearch, setFactorSearch] = useState('');

  // Modal "Voir le calcul"
  const [selectedTrace, setSelectedTrace] = useState<CalculationTrace | null>(null);
  const [traceLabel, setTraceLabel] = useState('');

  // Modal Import CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importReport, setImportReport] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.activities.list(orgId, { periodId });
      setActivities(data);
    } catch (err: any) {
      setError(err.message || "Erreur chargement des activités.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFactors = async () => {
    try {
      const data = await api.factors.search({ q: factorSearch });
      setAvailableFactors(data);
      if (data.length > 0 && !formFactorId) {
        setFormFactorId(data[0].id);
      }
    } catch (e) {
      console.error("Erreur facteurs:", e);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [orgId, periodId]);

  useEffect(() => {
    fetchFactors();
  }, [factorSearch]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel || !formQuantity || !formFactorId) {
      alert("Veuillez renseigner les champs obligatoires.");
      return;
    }

    try {
      await api.activities.create(orgId, {
        reporting_period_id: periodId,
        site_id: formSiteId || sites[0]?.id,
        label: formLabel,
        quantity: parseFloat(formQuantity.replace(',', '.')),
        unit: formUnit,
        factor_id: formFactorId,
        invoice_ref: formInvoiceRef,
        supplier_name: formSupplier,
        notes: formNotes
      });

      setShowAddModal(false);
      setFormLabel('');
      setFormQuantity('');
      fetchActivities();
      onRefreshOverview();
    } catch (err: any) {
      alert("Erreur lors du calcul ou de l'enregistrement: " + err.message);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette ligne d'activité ?")) return;
    try {
      await api.activities.delete(orgId, id);
      fetchActivities();
      onRefreshOverview();
    } catch (err: any) {
      alert("Erreur suppression: " + err.message);
    }
  };

  const handleCsvImport = async () => {
    if (!csvContent.trim()) {
      alert("Veuillez coller les lignes CSV.");
      return;
    }

    const lines = csvContent.trim().split('\n');
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Header expected: label,quantity,unit,factor_id,invoice_ref
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || (i === 0 && line.toLowerCase().includes('label'))) continue;

      const cols = line.split(';').length > 1 ? line.split(';') : line.split(',');
      if (cols.length < 4) {
        errors.push(`Ligne ${i + 1} invalide : format insuffisant (${line})`);
        skipped++;
        continue;
      }

      const [lbl, qtyStr, u, fId, inv] = cols.map(c => c.trim().replace(/^"|"$/g, ''));
      const qVal = parseFloat(qtyStr.replace(',', '.'));

      if (isNaN(qVal) || qVal <= 0) {
        errors.push(`Ligne ${i + 1} : quantité numérique invalide (${qtyStr})`);
        skipped++;
        continue;
      }

      try {
        await api.activities.create(orgId, {
          reporting_period_id: periodId,
          site_id: formSiteId || sites[0]?.id,
          label: lbl,
          quantity: qVal,
          unit: u,
          factor_id: fId || formFactorId,
          invoice_ref: inv || null
        });
        imported++;
      } catch (err: any) {
        errors.push(`Ligne ${i + 1} [${lbl}] : ${err.message}`);
        skipped++;
      }
    }

    setImportReport({ imported, skipped, errors });
    fetchActivities();
    onRefreshOverview();
  };

  // Filtrage
  const filteredActivities = activities.filter(act => {
    if (selectedSiteId !== 'all' && act.site_id !== selectedSiteId) return false;
    if (selectedScope !== 'all' && act.scope !== parseInt(selectedScope)) return false;
    if (searchQuery && !act.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Barre d'actions & Filtres */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher une activité..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 w-52"
            />
          </div>

          {/* Filtre Site */}
          <select
            value={selectedSiteId}
            onChange={e => setSelectedSiteId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Tous les sites ({sites.length})</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Filtre Scope */}
          <select
            value={selectedScope}
            onChange={e => setSelectedScope(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Tous les scopes</option>
            <option value="1">Scope 1 (Direct)</option>
            <option value="2">Scope 2 (Énergie)</option>
            <option value="3">Scope 3 (Chaîne de valeur)</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            disabled={isPeriodClosed}
            className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Importer CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={isPeriodClosed}
            className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle activité</span>
          </button>
        </div>
      </div>

      {/* Tableau des Activités */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredActivities.length} activité(s) enregistrée(s)</span>
          <span className="font-semibold text-slate-800">
            Total : {filteredActivities.reduce((s, a) => s + a.emission_t_co2e, 0).toFixed(2)} tCO2e
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Poste & Libellé</th>
                <th className="py-3 px-4">Site</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4">Quantité saisie</th>
                <th className="py-3 px-4 text-right">Émissions calculées</th>
                <th className="py-3 px-4 text-center">Incertitude</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucune donnée d'activité trouvée pour ces filtres.
                  </td>
                </tr>
              ) : (
                filteredActivities.map(act => {
                  let trace: CalculationTrace | null = null;
                  try {
                    trace = JSON.parse(act.calculation_trace_json);
                  } catch (e) {}

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{act.label}</div>
                        <div className="text-[11px] text-slate-400">
                          {act.category.replace(/_/g, ' ')} {act.invoice_ref && `• Réf: ${act.invoice_ref}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{act.site_name || 'Non attribué'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            act.scope === 1
                              ? 'bg-orange-100 text-orange-800'
                              : act.scope === 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          Scope {act.scope}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {act.quantity.toLocaleString('fr-FR')} {act.unit}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-slate-900 text-sm">
                          {act.emission_t_co2e.toFixed(3)} tCO2e
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {act.emission_kg_co2e.toFixed(1)} kgCO2e
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                          ±{((act.uncertainty_relative || 0.2) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTrace(trace);
                              setTraceLabel(act.label);
                            }}
                            className="p-1.5 text-brand-800 hover:bg-brand-50 rounded-lg transition"
                            title="Voir le calcul"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isPeriodClosed && (
                            <button
                              onClick={() => handleDeleteActivity(act.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Tiroir "Voir le calcul" */}
      {selectedTrace && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-brand-800" />
                <h3 className="font-bold text-slate-900 text-base">Traçabilité & Détail du Calcul</h3>
              </div>
              <button onClick={() => setSelectedTrace(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Activité : <span className="text-slate-900 normal-case font-bold">{traceLabel}</span>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Donnée d'activité saisie :</span>
                  <div className="font-bold text-slate-900">{selectedTrace.inputQuantity} {selectedTrace.inputUnit}</div>
                </div>
                <div>
                  <span className="text-slate-400">Unité normalisée SI :</span>
                  <div className="font-bold text-slate-900">{selectedTrace.convertedQuantity} {selectedTrace.standardUnit}</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-400">Facteur d'émission appliqué :</span>
                <div className="font-bold text-slate-900">{selectedTrace.factorName}</div>
                <div className="text-slate-500 mt-0.5">
                  Valeur : <strong>{selectedTrace.factorValue} {selectedTrace.factorUnit}</strong> • Périmètre : {selectedTrace.factorPerimeter}
                </div>
              </div>

              {selectedTrace.gwpApplied !== null && (
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-slate-400">Potentiel de Réchauffement Global (PRG GIEC AR6) :</span>
                  <div className="font-bold text-slate-900">Multiplicateur × {selectedTrace.gwpApplied}</div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-400">Formule arithmétique déterministe :</span>
                <div className="font-mono font-bold text-slate-900 bg-white p-2 rounded border border-slate-200 mt-1">
                  {selectedTrace.formula}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Résultat exact brut :</span>
                  <div className="text-sm font-bold text-brand-900">{selectedTrace.resultKgCO2e.toFixed(4)} kgCO2e</div>
                </div>
                <div>
                  <span className="text-slate-400">Résultat en tonnes (÷ 1000) :</span>
                  <div className="text-sm font-bold text-brand-900">{selectedTrace.resultTCO2e.toFixed(6)} tCO2e</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-500">
                <span>Incertitude relative combinée : <strong>±{selectedTrace.uncertaintyRelativePct.toFixed(1)}%</strong></span>
                <span>Calculé à : {new Date(selectedTrace.calculatedAtUtc).toLocaleString('fr-FR')}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTrace(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Saisie d'une Nouvelle Activité */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Ajouter une donnée d'activité</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Site d'exploitation *</label>
                <select
                  value={formSiteId}
                  onChange={e => setFormSiteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Libellé de l'activité *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Consommation d'électricité annuelle bureau"
                  value={formLabel}
                  onChange={e => setFormLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantité *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Ex: 12500"
                    value={formQuantity}
                    onChange={e => setFormQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unité *</label>
                  <select
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="kWh">kWh (Kilowattheure)</option>
                    <option value="MWh">MWh (Mégawattheure)</option>
                    <option value="litre">litre</option>
                    <option value="tonne">tonne</option>
                    <option value="kg">kg</option>
                    <option value="tonne-km">tonne-km (Fret)</option>
                    <option value="passager-km">passager-km (Voyage)</option>
                    <option value="MAD">MAD (Dirham - approche monétaire)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Facteur d'émission associé *</label>
                <select
                  value={formFactorId}
                  onChange={e => setFormFactorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {availableFactors.slice(0, 50).map(f => (
                    <option key={f.id} value={f.id}>
                      [{f.id}] {f.name} ({f.value} {f.numerator_unit}/{f.denominator_unit}) - Scope {f.scope}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  670 facteurs marocains disponibles dans le catalogue officiel.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Réf. Facture / Preuve</label>
                  <input
                    type="text"
                    placeholder="FAC-2025-098"
                    value={formInvoiceRef}
                    onChange={e => setFormInvoiceRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fournisseur</label>
                  <input
                    type="text"
                    placeholder="ONEE, Afriquia..."
                    value={formSupplier}
                    onChange={e => setFormSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
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
                  Calculer et Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Importateur CSV avec Déduplication</h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Collez vos lignes CSV (format : <code>label;quantite;unite;factor_id;ref_facture</code>).
              Les virgules décimales (ex: <code>12,5</code>) sont automatiquement normalisées.
            </p>

            <textarea
              rows={6}
              value={csvContent}
              onChange={e => setCsvContent(e.target.value)}
              placeholder="Électricité atelier;45000;kWh;FE-MA-0206;FAC-ONEE-01&#10;Carburant diesel utilitaires;3200;litre;FE-MA-0029;FAC-TOTAL-88"
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500"
            ></textarea>

            {importReport && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-emerald-800">✅ {importReport.imported} ligne(s) importée(s) avec succès.</div>
                {importReport.skipped > 0 && (
                  <div className="text-amber-800">⚠️ {importReport.skipped} ligne(s) ignorée(s) ou en erreur.</div>
                )}
                {importReport.errors.map((err, i) => (
                  <div key={i} className="text-rose-700 text-[11px]">• {err}</div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleCsvImport}
                className="px-5 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl shadow transition"
              >
                Lancer l'import et calculer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
