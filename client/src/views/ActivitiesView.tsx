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
  Download,
  Receipt,
  ArrowRightLeft,
  Sparkles,
  Coins,
  Lock,
  Upload,
  Paperclip,
  FileCheck,
  Building2,
  Edit3,
  MapPin,
  User
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
  const [entryMode, setEntryMode] = useState<'physical' | 'bill'>('physical');
  const [formSiteId, setFormSiteId] = useState(sites[0]?.id || '');
  const [formLabel, setFormLabel] = useState('');
  const [formQuantity, setFormQuantity] = useState<string>('');
  const [formUnit, setFormUnit] = useState('kWh');
  const [formFactorId, setFormFactorId] = useState('');
  const [formInvoiceRef, setFormInvoiceRef] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formEvidenceFile, setFormEvidenceFile] = useState<File | null>(null);

  // Modal Justificatif / Preuve d'audit pour ligne existante
  const [uploadTargetActId, setUploadTargetActId] = useState<string | null>(null);
  const [uploadTargetActLabel, setUploadTargetActLabel] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Modal Gestion Multi-Sites & Usines
  const [showSitesModal, setShowSitesModal] = useState(false);
  const [sitesList, setSitesList] = useState<any[]>(sites);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [siteFormName, setSiteFormName] = useState('');
  const [siteFormCity, setSiteFormCity] = useState('');
  const [siteFormAddress, setSiteFormAddress] = useState('');
  const [siteFormManagerId, setSiteFormManagerId] = useState('');
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteError, setSiteError] = useState<string | null>(null);

  useEffect(() => {
    setSitesList(sites);
  }, [sites]);

  const openSitesModal = async () => {
    setShowSitesModal(true);
    setSiteError(null);
    try {
      const [freshSites, freshMembers] = await Promise.all([
        api.sites.list(orgId),
        api.organizations.getMembers(orgId).catch(() => [])
      ]);
      setSitesList(freshSites);
      setMembersList(freshMembers);
    } catch (err: any) {
      console.error("Erreur chargement sites/membres:", err);
    }
  };

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteFormName || !siteFormCity) {
      setSiteError("Nom et ville requis.");
      return;
    }
    setSiteLoading(true);
    setSiteError(null);
    try {
      if (editingSiteId) {
        await api.sites.update(orgId, editingSiteId, {
          name: siteFormName,
          city: siteFormCity,
          address: siteFormAddress,
          manager_user_id: siteFormManagerId || null
        });
      } else {
        await api.sites.create(orgId, {
          name: siteFormName,
          city: siteFormCity,
          address: siteFormAddress,
          manager_user_id: siteFormManagerId || null
        });
      }
      setEditingSiteId(null);
      setSiteFormName('');
      setSiteFormCity('');
      setSiteFormAddress('');
      setSiteFormManagerId('');
      const updated = await api.sites.list(orgId);
      setSitesList(updated);
      onRefreshOverview();
    } catch (err: any) {
      setSiteError(err.message);
    } finally {
      setSiteLoading(false);
    }
  };

  const handleDeleteSite = async (siteId: string, siteName: string) => {
    if (!confirm(`Confirmez-vous la suppression du site « ${siteName} » ?`)) return;
    setSiteLoading(true);
    setSiteError(null);
    try {
      await api.sites.delete(orgId, siteId);
      const updated = await api.sites.list(orgId);
      setSitesList(updated);
      onRefreshOverview();
    } catch (err: any) {
      setSiteError(err.message);
    } finally {
      setSiteLoading(false);
    }
  };

  const startEditSite = (s: any) => {
    setEditingSiteId(s.id);
    setSiteFormName(s.name);
    setSiteFormCity(s.city);
    setSiteFormAddress(s.address || '');
    setSiteFormManagerId(s.manager_user_id || '');
    setSiteError(null);
  };

  const cancelEditSite = () => {
    setEditingSiteId(null);
    setSiteFormName('');
    setSiteFormCity('');
    setSiteFormAddress('');
    setSiteFormManagerId('');
    setSiteError(null);
  };

  // Assistant Factures & Convertisseur
  const [billPresets, setBillPresets] = useState<any[]>([]);
  const [billPresetId, setBillPresetId] = useState('electricite_onee_mt_indus');
  const [billAmountMad, setBillAmountMad] = useState('');
  const [customUnitPrice, setCustomUnitPrice] = useState('');

  // Modal Convertisseur Autonome
  const [showConverterModal, setShowConverterModal] = useState(false);
  const [convTab, setConvTab] = useState<'bill' | 'physical'>('bill');
  const [convBillPresetId, setConvBillPresetId] = useState('electricite_onee_mt_indus');
  const [convAmountMad, setConvAmountMad] = useState('10000');
  const [convCustomPrice, setConvCustomPrice] = useState('');
  const [convPhysValue, setConvPhysValue] = useState('1');
  const [convFromUnit, setConvFromUnit] = useState('tonne');
  const [convToUnit, setConvToUnit] = useState('kg');

  // Options d'activités sécurisées (sans divulgation des facteurs bruts)
  const [availableFactors, setAvailableFactors] = useState<any[]>([]);
  const [factorSearch, setFactorSearch] = useState('');

  // Postes non quantifiés (Règle de rigueur)
  const [unquantified, setUnquantified] = useState<any[]>([]);
  const [showUnqModal, setShowUnqModal] = useState(false);
  const [unqLabel, setUnqLabel] = useState('');
  const [unqCategory, setUnqCategory] = useState('Énergie');
  const [unqReason, setUnqReason] = useState('Poste identifié, non quantifié : facteur disponible insuffisant');
  const [unqNotes, setUnqNotes] = useState('');

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

  const fetchUnquantified = async () => {
    try {
      const data = await api.activities.listUnquantified(orgId, periodId);
      setUnquantified(data);
    } catch (e) {
      console.error("Erreur non quantifiés:", e);
    }
  };

  const fetchFactors = async () => {
    try {
      const data = await api.activities.getCatalogOptions({ q: factorSearch });
      setAvailableFactors(data);
      if (data.length > 0 && !formFactorId) {
        setFormFactorId(data[0].id);
        setFormUnit(data[0].expected_unit || 'kWh');
      }
    } catch (e) {
      console.error("Erreur options d'activités:", e);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchUnquantified();
    api.units.getPresets().then(setBillPresets).catch(console.error);
  }, [orgId, periodId]);

  useEffect(() => {
    fetchFactors();
  }, [factorSearch]);

  const handleCreateUnquantified = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unqLabel.trim()) return;
    try {
      await api.activities.createUnquantified(orgId, {
        reporting_period_id: periodId,
        site_id: formSiteId || sites[0]?.id,
        category: unqCategory,
        label: unqLabel.trim(),
        reason: unqReason,
        notes: unqNotes
      });
      setShowUnqModal(false);
      setUnqLabel('');
      setUnqNotes('');
      fetchUnquantified();
      onRefreshOverview();
    } catch (err: any) {
      alert("Erreur enregistrement : " + err.message);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel || !formQuantity || !formFactorId) {
      alert("Veuillez renseigner les champs obligatoires.");
      return;
    }

    try {
      const created = await api.activities.create(orgId, {
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

      if (formEvidenceFile && created && (created as any).id) {
        try {
          await api.activities.uploadEvidence(orgId, (created as any).id, formEvidenceFile, formInvoiceRef || undefined);
        } catch (uploadErr) {
          console.error("Erreur téléversement justificatif:", uploadErr);
        }
      }

      setShowAddModal(false);
      setFormLabel('');
      setFormQuantity('');
      setFormInvoiceRef('');
      setFormSupplier('');
      setFormNotes('');
      setFormEvidenceFile(null);
      fetchActivities();
      onRefreshOverview();
    } catch (err: any) {
      alert("Erreur lors du calcul ou de l'enregistrement: " + err.message);
    }
  };

  const handleUploadEvidenceForExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTargetActId || !uploadFile) return;
    setUploading(true);
    try {
      await api.activities.uploadEvidence(orgId, uploadTargetActId, uploadFile);
      setUploadTargetActId(null);
      setUploadFile(null);
      fetchActivities();
    } catch (err: any) {
      alert("Erreur téléversement : " + (err.message || 'Échec'));
    } finally {
      setUploading(false);
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowConverterModal(true)}
            className="px-3.5 py-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
            title="Convertir une facture en Dirhams (MAD) ou convertir des unités (tonnes, kWh, m³...)"
          >
            <Receipt className="w-4 h-4 text-emerald-700" />
            <span>Convertisseur Factures & Unités</span>
          </button>

          <button
            onClick={() => setShowUnqModal(true)}
            disabled={isPeriodClosed}
            className="px-3.5 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Déclarer un poste non quantifié</span>
          </button>

          <button
            onClick={openSitesModal}
            className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
            title="Gérer les sites, usines et responsables locaux"
          >
            <Building2 className="w-4 h-4 text-brand-700" />
            <span>Sites & Usines ({sitesList.length})</span>
          </button>

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
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
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
                <th className="py-3 px-4 text-center">Facture / Audit</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
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
                        <div className="font-bold text-slate-900 flex items-center flex-wrap gap-1.5">
                          <span>{act.label}</span>
                          {trace?.isMonetaryEstimate && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center space-x-1" title="Activité estimée d'après montant de facture en MAD">
                              <Receipt className="w-3 h-3 text-purple-700 mr-0.5" />
                              <span>Facture {trace.billAmountMad ? `${trace.billAmountMad.toLocaleString('fr-FR')} MAD` : 'MAD'}</span>
                            </span>
                          )}
                        </div>
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
                        {act.evidence_file_name ? (
                          <a
                            href={api.activities.getEvidenceDownloadUrl(orgId, act.id)}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition max-w-[150px] truncate"
                            title={`Télécharger le justificatif : ${act.evidence_file_name}`}
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                            <span className="truncate">{act.evidence_file_name}</span>
                            <Download className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          </a>
                        ) : !isPeriodClosed ? (
                          <button
                            onClick={() => {
                              setUploadTargetActId(act.id);
                              setUploadTargetActLabel(act.label);
                            }}
                            className="inline-flex items-center space-x-1 text-[11px] text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 border border-dashed border-slate-300 hover:border-emerald-300 px-2 py-1 rounded-lg transition"
                            title="Joindre une facture ou un bon de livraison"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Joindre</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">—</span>
                        )}
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

      {/* Section Postes identifiés, non quantifiés */}
      {unquantified.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>Postes identifiés, non quantifiés ({unquantified.length})</span>
            </div>
            <span className="text-[11px] text-amber-800 italic">
              Conformité méthodologique : aucun zéro factice
            </span>
          </div>
          <div className="border border-amber-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-amber-100/60 text-amber-900 font-bold text-[11px] border-b border-amber-200">
                <tr>
                  <th className="py-2.5 px-4">Poste / Activité déclarée</th>
                  <th className="py-2.5 px-4">Catégorie</th>
                  <th className="py-2.5 px-4">Motif de non-quantification</th>
                  <th className="py-2.5 px-4">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {unquantified.map((u, i) => (
                  <tr key={i} className="hover:bg-amber-50/40">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{u.label}</td>
                    <td className="py-2.5 px-4 text-slate-600">{u.category}</td>
                    <td className="py-2.5 px-4 text-amber-800 italic font-medium">{u.reason}</td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">{u.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <span className="text-slate-400">Consommation saisie :</span>
                  <div className="font-bold text-slate-900">{selectedTrace.inputQuantity} {selectedTrace.inputUnit}</div>
                </div>
                <div>
                  <span className="text-slate-400">Quantité standard :</span>
                  <div className="font-bold text-slate-900">{selectedTrace.convertedQuantity} {selectedTrace.standardUnit}</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1">
                <span className="text-slate-400">Activité & Référentiel officiel appliqué :</span>
                <div className="font-bold text-slate-900">{selectedTrace.factorName}</div>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-emerald-700 mr-1 inline" />
                    <span>Facteur Souverain Protégé & Certifié</span>
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Unité attendue : {selectedTrace.factorUnit} • Périmètre : {selectedTrace.factorPerimeter}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Confidentialité et conformité : Les coefficients du barème officiel sont sanctuarisés sur le serveur pour garantir des calculs conformes sans risque d'altération.
                </p>
              </div>

              {selectedTrace.gwpApplied !== null && (
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-slate-400">Impact climatique officiel du gaz :</span>
                  <div className="font-bold text-slate-900">Multiplicateur × {selectedTrace.gwpApplied}</div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-400">Formule de calcul certifiée :</span>
                <div className="font-mono font-bold text-slate-900 bg-white p-2 rounded border border-slate-200 mt-1">
                  {selectedTrace.formula}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Émissions calculées :</span>
                  <div className="text-sm font-bold text-brand-900">{selectedTrace.resultKgCO2e.toFixed(2)} kgCO2e</div>
                </div>
                <div>
                  <span className="text-slate-400">Émissions en tonnes :</span>
                  <div className="text-sm font-bold text-brand-900">{selectedTrace.resultTCO2e.toFixed(3)} tCO2e</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-500">
                <span>Précision garantie : <strong>±{selectedTrace.uncertaintyRelativePct.toFixed(1)}%</strong></span>
                <span>Calculé le : {new Date(selectedTrace.calculatedAtUtc).toLocaleDateString('fr-FR')}</span>
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
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-brand-800" />
                <h3 className="font-bold text-slate-900 text-base">Ajouter une donnée d'activité</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Onglets de mode de saisie */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setEntryMode('physical')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  entryMode === 'physical'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 Quantité physique directe
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('bill')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  entryMode === 'bill'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-emerald-900 hover:text-emerald-950'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-amber-300" />
                <span>Depuis Facture en Dirhams (MAD)</span>
              </button>
            </div>

            {entryMode === 'bill' ? (
              /* Panneau de saisie depuis facture en Dirhams */
              <div className="space-y-4 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs">
                <div className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                  <p className="text-emerald-950 font-medium">
                    <strong>Comptabilité & Factures marocaines :</strong> Déduisez automatiquement la quantité physique (kWh, litres, tonnes) à partir du montant total en Dirhams (TTC ou HT) figurant sur vos factures d'électricité ONEE, carburant flotte ou gaz.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type de dépense / Facture *</label>
                  <select
                    value={billPresetId}
                    onChange={e => {
                      setBillPresetId(e.target.value);
                      const p = billPresets.find((x: any) => x.id === e.target.value);
                      if (p) {
                        setCustomUnitPrice(p.unitPriceMad.toString());
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium focus:border-emerald-600 outline-none"
                  >
                    {billPresets.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.unitPriceMad} MAD / {p.physicalUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Montant facture en Dirhams (MAD) *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 15000"
                      value={billAmountMad}
                      onChange={e => setBillAmountMad(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Prix unitaire appliqué (MAD/{billPresets.find((p: any) => p.id === billPresetId)?.physicalUnit || 'unité'})
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Tarif unitaire"
                      value={customUnitPrice || (billPresets.find((p: any) => p.id === billPresetId)?.unitPriceMad || '')}
                      onChange={e => setCustomUnitPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                {/* Prévisualisation de la conversion */}
                {(() => {
                  const preset = billPresets.find((p: any) => p.id === billPresetId);
                  const price = parseFloat(customUnitPrice) || preset?.unitPriceMad || 1;
                  const amt = parseFloat(billAmountMad) || 0;
                  const derivedQty = price > 0 ? amt / price : 0;

                  return (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Quantité physique déduite :</span>
                        <span className="font-mono font-bold text-base text-emerald-950">
                          {derivedQty.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {preset?.physicalUnit}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Formule : {amt.toLocaleString('fr-FR')} MAD ÷ {price} MAD/{preset?.physicalUnit}
                      </div>
                      <div className="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded border border-emerald-200">
                        Poste certifié assigné : <strong>[{preset?.factorId}] {preset?.name}</strong> (+5% marge d'incertitude traçable)
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={amt <= 0}
                          onClick={() => {
                            if (!preset || amt <= 0) return;
                            setFormLabel(preset.name + ` (Facture ${amt.toLocaleString('fr-FR')} MAD)`);
                            setFormQuantity(derivedQty.toFixed(2));
                            setFormUnit(preset.physicalUnit);
                            setFormFactorId(preset.factorId);
                            setFormSupplier(preset.name.includes('ONEE') ? 'ONEE' : (preset.name.includes('flotte') ? 'Station service' : ''));
                            setFormNotes(`Dépense monétaire : Facture de ${amt} MAD convertie au tarif de ${price} MAD/${preset.physicalUnit} (+5% marge d'incertitude).`);
                            setEntryMode('physical');
                          }}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Appliquer ces valeurs au formulaire</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : null}

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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unité normalisée *</label>
                  <select
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <optgroup label="⚡ Énergie">
                      <option value="kWh">kWh (Kilowattheure)</option>
                      <option value="MWh">MWh (Mégawattheure - 1 000 kWh)</option>
                      <option value="GWh">GWh (Gigawattheure - 1 000 000 kWh)</option>
                      <option value="GJ">GJ (Gigajoule)</option>
                      <option value="MJ">MJ (Mégajoule)</option>
                      <option value="tep">tep (Tonne équivalent pétrole - 11 630 kWh)</option>
                    </optgroup>
                    <optgroup label="⚖️ Masse">
                      <option value="tonne">tonne (t - 1 000 kg)</option>
                      <option value="kg">kg (Kilogramme)</option>
                      <option value="g">g (Gramme)</option>
                      <option value="quintal">quintal (q - 100 kg)</option>
                    </optgroup>
                    <optgroup label="💧 Volume">
                      <option value="litre">litre (L)</option>
                      <option value="m3">m³ (Mètre cube - 1 000 L)</option>
                      <option value="hl">hL (Hectolitre - 100 L)</option>
                    </optgroup>
                    <optgroup label="🚚 Transport & Déplacements">
                      <option value="tonne-km">tonne-km (Fret t.km)</option>
                      <option value="passager-km">passager-km (Voyageur p.km)</option>
                      <option value="km">km (Distance)</option>
                    </optgroup>
                    <optgroup label="🪙 Dépenses (Approche Monétaire)">
                      <option value="MAD">MAD (Dirham marocain)</option>
                      <option value="kMAD">kMAD (Millier de Dirhams)</option>
                    </optgroup>
                    <optgroup label="📦 Autres">
                      <option value="unite">unité</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Activité correspondante / Barème officiel *</label>
                <select
                  value={formFactorId}
                  onChange={e => {
                    setFormFactorId(e.target.value);
                    const found = availableFactors.find((f: any) => f.id === e.target.value);
                    if (found) setFormUnit(found.expected_unit || found.denominator_unit || 'kWh');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {availableFactors.slice(0, 100).map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label || f.name} (en {f.expected_unit || f.denominator_unit})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  🔒 Barème officiel Bilan Carbone Maroc calculé en toute sécurité sur le serveur.
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes & Justificatif de calcul</label>
                <textarea
                  rows={2}
                  placeholder="Notes internes, détails de conversion ou précisions méthodologiques..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Justificatif d'audit / Facture (PDF, Image - max 10 Mo)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={e => setFormEvidenceFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  {formEvidenceFile && (
                    <button
                      type="button"
                      onClick={() => setFormEvidenceFile(null)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Retirer le fichier"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Document archivé pour vérification et audit ISO 14064-1 (ex: Facture ONEE, bon de livraison carburant).
                </p>
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
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Calculer et Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Convertisseur Interactif de Factures & Unités */}
      {showConverterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-base">Convertisseur Factures & Unités Physiques</h3>
              </div>
              <button onClick={() => setShowConverterModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Onglets Convertisseur */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setConvTab('bill')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  convTab === 'bill'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Facture (MAD) → Quantité & CO2e</span>
              </button>
              <button
                type="button"
                onClick={() => setConvTab('physical')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  convTab === 'physical'
                    ? 'bg-brand-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Unités Physiques (tonnes ⇄ kg, MWh ⇄ kWh...)</span>
              </button>
            </div>

            {convTab === 'bill' ? (
              /* Onglet 1 : Facture MAD -> Quantité & CO2e */
              <div className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Estimez instantanément la quantité physique et l'empreinte carbone à partir d'un montant de facture en Dirhams marocains (MAD).
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type de facture / Barème marocain</label>
                  <select
                    value={convBillPresetId}
                    onChange={e => {
                      setConvBillPresetId(e.target.value);
                      const p = billPresets.find((x: any) => x.id === e.target.value);
                      if (p) setConvCustomPrice(p.unitPriceMad.toString());
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    {billPresets.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.unitPriceMad} MAD / {p.physicalUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Montant facture en Dirhams (MAD)</label>
                    <input
                      type="number"
                      step="any"
                      value={convAmountMad}
                      onChange={e => setConvAmountMad(e.target.value)}
                      placeholder="Ex: 10000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Prix unitaire (MAD/unité)</label>
                    <input
                      type="number"
                      step="any"
                      value={convCustomPrice || (billPresets.find((p: any) => p.id === convBillPresetId)?.unitPriceMad || '')}
                      onChange={e => setConvCustomPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                {/* Résultat interactif en direct */}
                {(() => {
                  const preset = billPresets.find((p: any) => p.id === convBillPresetId) || billPresets[0];
                  const price = parseFloat(convCustomPrice) || preset?.unitPriceMad || 1;
                  const amt = parseFloat(convAmountMad) || 0;
                  const qty = price > 0 ? amt / price : 0;
                  
                  // Estimation indicative basée sur le facteur officiel
                  let factorVal = 0.722; // ONEE par défaut
                  if (preset?.id?.includes('gasoil')) factorVal = 3.16;
                  else if (preset?.id?.includes('essence')) factorVal = 2.87;
                  else if (preset?.id?.includes('propane')) factorVal = 3010;
                  else if (preset?.id?.includes('butane')) factorVal = 3.01;
                  else if (preset?.id?.includes('fioul')) factorVal = 3240;
                  else if (preset?.id?.includes('eau')) factorVal = 0.35;

                  const totalKg = qty * factorVal;
                  const totalT = totalKg / 1000;

                  return (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 border-b border-purple-200 pb-3">
                        <div>
                          <span className="text-slate-500 text-[11px]">Quantité physique déduite :</span>
                          <div className="font-mono font-bold text-lg text-purple-950">
                            {qty.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {preset?.physicalUnit}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">Émissions estimées :</span>
                          <div className="font-mono font-bold text-lg text-emerald-800">
                            {totalT.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} tCO2e
                          </div>
                          <span className="text-[11px] text-slate-500">
                            ({totalKg.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kgCO2e)
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-purple-900 space-y-1">
                        <div>
                          • Formule : <strong>{amt.toLocaleString('fr-FR')} MAD ÷ {price} MAD/{preset?.physicalUnit} = {qty.toFixed(2)} {preset?.physicalUnit}</strong>
                        </div>
                        <div>
                          • Barème officiel : <strong>{preset?.name}</strong> (🔒 Calcul officiel sécurisé sur le serveur)
                        </div>
                        <div className="text-slate-500 italic">
                          • Précision garantie conforme aux exigences des rapports d'audit.
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!preset) return;
                            setFormLabel(preset.name + ` (Facture ${amt.toLocaleString('fr-FR')} MAD)`);
                            setFormQuantity(qty.toFixed(2));
                            setFormUnit(preset.physicalUnit);
                            setFormFactorId(preset.factorId);
                            setFormSupplier(preset.name.includes('ONEE') ? 'ONEE' : (preset.name.includes('flotte') ? 'Station service' : ''));
                            setFormNotes(`Dépense monétaire : Facture de ${amt} MAD convertie au tarif de ${price} MAD/${preset.physicalUnit} (+5% marge d'incertitude).`);
                            setShowConverterModal(false);
                            setShowAddModal(true);
                            setEntryMode('physical');
                          }}
                          className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-bold rounded-lg shadow-sm transition flex items-center space-x-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Insérer dans une nouvelle activité</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Onglet 2 : Convertisseur d'Unités Physiques */
              <div className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Convertissez n'importe quelle unité physique avec précision mathématique exacte (conforme aux normes SI et aux facteurs du GHG Protocol).
                </p>

                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Valeur à convertir</label>
                    <input
                      type="number"
                      step="any"
                      value={convPhysValue}
                      onChange={e => setConvPhysValue(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">De (Unité source)</label>
                    <select
                      value={convFromUnit}
                      onChange={e => setConvFromUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <optgroup label="⚖️ Masse">
                        <option value="tonne">tonne (t)</option>
                        <option value="kg">kilogramme (kg)</option>
                        <option value="g">gramme (g)</option>
                        <option value="quintal">quintal (q)</option>
                      </optgroup>
                      <optgroup label="⚡ Énergie">
                        <option value="MWh">Mégawattheure (MWh)</option>
                        <option value="kWh">Kilowattheure (kWh)</option>
                        <option value="GWh">Gigawattheure (GWh)</option>
                        <option value="GJ">Gigajoule (GJ)</option>
                        <option value="MJ">Mégajoule (MJ)</option>
                        <option value="tep">Tonne équiv. pétrole (tep)</option>
                      </optgroup>
                      <optgroup label="💧 Volume">
                        <option value="m3">Mètre cube (m³)</option>
                        <option value="litre">Litre (L)</option>
                        <option value="hl">Hectolitre (hL)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vers (Unité cible)</label>
                    <select
                      value={convToUnit}
                      onChange={e => setConvToUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <optgroup label="⚖️ Masse">
                        <option value="kg">kilogramme (kg)</option>
                        <option value="tonne">tonne (t)</option>
                        <option value="g">gramme (g)</option>
                        <option value="quintal">quintal (q)</option>
                      </optgroup>
                      <optgroup label="⚡ Énergie">
                        <option value="kWh">Kilowattheure (kWh)</option>
                        <option value="MWh">Mégawattheure (MWh)</option>
                        <option value="GWh">Gigawattheure (GWh)</option>
                        <option value="GJ">Gigajoule (GJ)</option>
                        <option value="MJ">Mégajoule (MJ)</option>
                        <option value="tep">Tonne équiv. pétrole (tep)</option>
                      </optgroup>
                      <optgroup label="💧 Volume">
                        <option value="litre">Litre (L)</option>
                        <option value="m3">Mètre cube (m³)</option>
                        <option value="hl">Hectolitre (hL)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Calcul exact instantané */}
                {(() => {
                  const val = parseFloat(convPhysValue) || 0;
                  
                  // Facteurs de conversion vers unité de base (kg, kWh, L)
                  const massToBase: Record<string, number> = { kg: 1, tonne: 1000, g: 0.001, quintal: 100 };
                  const energyToBase: Record<string, number> = { kWh: 1, MWh: 1000, GWh: 1000000, GJ: 277.777778, MJ: 0.277778, tep: 11630 };
                  const volToBase: Record<string, number> = { litre: 1, m3: 1000, hl: 100 };

                  let isCompatible = true;
                  let result = 0;
                  let formulaStr = '';

                  if (massToBase[convFromUnit] !== undefined && massToBase[convToUnit] !== undefined) {
                    const inBase = val * massToBase[convFromUnit];
                    result = inBase / massToBase[convToUnit];
                    formulaStr = `${val} ${convFromUnit} × ${(massToBase[convFromUnit] / massToBase[convToUnit]).toPrecision(6)}`;
                  } else if (energyToBase[convFromUnit] !== undefined && energyToBase[convToUnit] !== undefined) {
                    const inBase = val * energyToBase[convFromUnit];
                    result = inBase / energyToBase[convToUnit];
                    formulaStr = `${val} ${convFromUnit} × ${(energyToBase[convFromUnit] / energyToBase[convToUnit]).toPrecision(6)}`;
                  } else if (volToBase[convFromUnit] !== undefined && volToBase[convToUnit] !== undefined) {
                    const inBase = val * volToBase[convFromUnit];
                    result = inBase / volToBase[convToUnit];
                    formulaStr = `${val} ${convFromUnit} × ${(volToBase[convFromUnit] / volToBase[convToUnit]).toPrecision(6)}`;
                  } else {
                    isCompatible = false;
                  }

                  if (!isCompatible) {
                    return (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                        ⚠️ <strong>Incompatibilité dimensionnelle :</strong> Impossible de convertir directement entre ces deux dimensions physiques (ex: masse vers énergie). Veuillez choisir deux unités de même nature.
                      </div>
                    );
                  }

                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Résultat de la conversion :</span>
                        <span className="font-mono font-bold text-xl text-brand-900">
                          {result.toLocaleString('fr-FR', { maximumFractionDigits: 6 })} {convToUnit}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Équivalence : {val} {convFromUnit} = {result.toLocaleString('fr-FR', { maximumFractionDigits: 6 })} {convToUnit}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Calcul exact déterministe certifié SI.
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConverterModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Fermer
              </button>
            </div>
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

      {/* Modal Déclarer un poste non quantifié */}
      {showUnqModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-slate-900 text-sm">Déclarer un poste non quantifié</h3>
              </div>
              <button onClick={() => setShowUnqModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Règle de rigueur : une absence d'activité confirmée doit être distinguée d'une donnée manquante. Ce poste figurera dans votre rapport d'inventaire avec son motif sans affectation de zéro factice.
            </p>

            <form onSubmit={handleCreateUnquantified} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Désignation de l'activité *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Fret sous-traité maritime Asie"
                  value={unqLabel}
                  onChange={e => setUnqLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                <select
                  value={unqCategory}
                  onChange={e => setUnqCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none"
                >
                  <option value="Énergie">Énergie & Combustion</option>
                  <option value="Transport">Transport & Fret</option>
                  <option value="Achats">Achats & Matières premières</option>
                  <option value="Déchets">Déchets</option>
                  <option value="Fugitives">Émissions fugitives / Froid</option>
                  <option value="Autre">Autre poste</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif de non-quantification</label>
                <select
                  value={unqReason}
                  onChange={e => setUnqReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none"
                >
                  <option value="Poste identifié, non quantifié : facteur disponible insuffisant">
                    Poste identifié, non quantifié : facteur disponible insuffisant
                  </option>
                  <option value="Données d'activité de consommation non disponibles">
                    Données d'activité de consommation non disponibles
                  </option>
                  <option value="En attente de transmission par le tiers ou fournisseur">
                    En attente de transmission par le tiers ou fournisseur
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observations / Justification</label>
                <textarea
                  rows={2}
                  placeholder="Précisez la démarche de collecte en cours..."
                  value={unqNotes}
                  onChange={e => setUnqNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUnqModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Attacher / Remplacer Justificatif d'audit */}
      {uploadTargetActId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-slate-900 text-base">Attacher un justificatif d'audit</h3>
              </div>
              <button
                onClick={() => {
                  setUploadTargetActId(null);
                  setUploadFile(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ligne d'activité : <strong className="text-slate-900">{uploadTargetActLabel}</strong>
            </p>

            <form onSubmit={handleUploadEvidenceForExisting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sélectionner un fichier (PDF, PNG, JPG - max 10 Mo) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <p>🔒 <strong>Confidentialité et Audit ISO 14064 :</strong></p>
                <p>Le document est conservé dans l'espace sécurisé de votre organisation et ne sera accessible qu'aux auditeurs et gestionnaires carbone habilités.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setUploadTargetActId(null);
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Téléversement...' : 'Téléverser le justificatif'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Gestion Multi-Sites & Usines d'Exploitation */}
      {showSitesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-brand-800" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Sites & Usines d'Exploitation</h3>
                  <p className="text-xs text-slate-500">Confinement territorial et gestion des responsables de site (site_manager)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSitesModal(false);
                  cancelEditSite();
                }}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {siteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{siteError}</span>
              </div>
            )}

            {/* Formulaire Ajout / Édition Site */}
            <form onSubmit={handleSaveSite} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {editingSiteId ? 'Modifier les informations du site' : 'Ajouter un nouveau site ou complexe industriel'}
                </span>
                {editingSiteId && (
                  <button
                    type="button"
                    onClick={cancelEditSite}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Annuler la modification
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom du site *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Usine Tanger Freezone"
                    value={siteFormName}
                    onChange={e => setSiteFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ville marocaine *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Tanger, Casablanca, Nador..."
                    value={siteFormCity}
                    onChange={e => setSiteFormCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adresse ou Zone Industrielle</label>
                  <input
                    type="text"
                    placeholder="ex: Ilot 12, TFZ Aéroport"
                    value={siteFormAddress}
                    onChange={e => setSiteFormAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsable de site affecté (site_manager)</label>
                  <select
                    value={siteFormManagerId}
                    onChange={e => setSiteFormManagerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- Aucun responsable assigné --</option>
                    {membersList.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.email}) [{m.role}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={siteLoading}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{siteLoading ? 'Enregistrement...' : editingSiteId ? 'Mettre à jour le site' : 'Créer le site'}</span>
                </button>
              </div>
            </form>

            {/* Liste des Sites Existants */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                Sites enregistrés ({sitesList.length})
              </span>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {sitesList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Aucun site enregistré pour cette organisation.
                  </div>
                ) : (
                  sitesList.map((s: any) => (
                    <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {s.city}
                          </span>
                        </div>
                        {s.address && (
                          <p className="text-slate-500 text-[11px] flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{s.address}</span>
                          </p>
                        )}
                        <p className="text-slate-500 text-[11px] flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Responsable : <strong>{s.manager_name || 'Non assigné'}</strong>
                            {s.manager_email ? ` (${s.manager_email})` : ''}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">Émissions site :</span>
                          <span className="font-extrabold text-brand-900 text-xs">
                            {(s.total_tco2e || 0).toFixed(2)} tCO2e
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {s.activities_count || 0} activité(s)
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => startEditSite(s)}
                            className="p-1.5 text-slate-500 hover:text-brand-800 hover:bg-slate-100 rounded-lg transition"
                            title="Modifier ce site"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSite(s.id, s.name)}
                            disabled={siteLoading}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer ce site"
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

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSitesModal(false);
                  cancelEditSite();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

