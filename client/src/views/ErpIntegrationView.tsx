/**
 * Atlas Carbone - Vue Module Intégrations & Connecteurs API Industriels (Phase 5)
 * Conforme à AGENTS.md :
 * - Facteurs d'émissions officiels du classeur certifié marocain.
 * - Ingestion automatisée des factures ONEE, carburants et gaz en Dirhams (MAD).
 * - Clés sécurisées M2M (ak_live_...) avec hachage SHA-256 et contrôle d'accès strict.
 * - Anti-doublon automatique par référence de facture.
 */

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Zap,
  FileSpreadsheet,
  History,
  Terminal,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Upload,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  Fuel,
  Flame,
  CheckCircle,
  Database
} from 'lucide-react';
import { api } from '../api.js';

interface ErpIntegrationViewProps {
  orgId: string;
}

export const ErpIntegrationView: React.FC<ErpIntegrationViewProps> = ({ orgId }) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'invoice' | 'bulk' | 'logs' | 'docs'>('keys');

  // État Clés d'API
  const [keys, setKeys] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyPerm, setKeyPerm] = useState('read_write');
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // État Périodes & Sites
  const [periods, setPeriods] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  // État Formulaire Facture Énergétique
  const [invoiceType, setInvoiceType] = useState('electricity_onee_mt');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [supplierName, setSupplierName] = useState('ONEE - Branche Électricité');
  const [inputMode, setInputMode] = useState<'mad' | 'physical'>('mad');
  const [billAmountMad, setBillAmountMad] = useState<number | ''>(50000);
  const [customUnitPrice, setCustomUnitPrice] = useState<number | ''>(1.15);
  const [physicalQuantity, setPhysicalQuantity] = useState<number | ''>('');
  const [physicalUnit, setPhysicalUnit] = useState('kWh');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<any | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // État Import Massif
  const [bulkInput, setBulkInput] = useState('');
  const [bulkDryRun, setBulkDryRun] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // État Logs d'ingestion
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Chargement initial
  useEffect(() => {
    loadApiKeys();
    loadPeriodsAndSites();
    loadLogs();
  }, [orgId]);

  const loadApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await api.integrations.getApiKeys(orgId);
      setKeys(res.keys || []);
    } catch (err: any) {
      console.error("Erreur chargement clés:", err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const loadPeriodsAndSites = async () => {
    try {
      const [periodsRes, sitesRes] = await Promise.all([
        api.periods.list(orgId),
        api.sites.list(orgId)
      ]);
      setPeriods(periodsRes || []);
      if (periodsRes && periodsRes.length > 0) {
        setSelectedPeriodId(periodsRes[0].id);
      }
      setSites(sitesRes || []);
      if (sitesRes && sitesRes.length > 0) {
        setSelectedSiteId(sitesRes[0].id);
      }
    } catch (err: any) {
      console.error("Erreur périodes/sites:", err);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.integrations.getLogs(orgId);
      setLogs(res.logs || []);
    } catch (err: any) {
      console.error("Erreur logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Création clé d'API
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      const res = await api.integrations.createApiKey(orgId, {
        name: keyName.trim(),
        permissions: keyPerm
      });
      setGeneratedSecret(res.key);
      setKeyName('');
      loadApiKeys();
    } catch (err: any) {
      alert("Erreur lors de la création de la clé : " + err.message);
    }
  };

  const handleDeleteKey = async (keyId: string, name: string) => {
    if (!confirm(`Confirmez-vous la révocation définitive de la clé d'API "${name}" ? Tout connecteur ERP l'utilisant sera immédiatement bloqué.`)) {
      return;
    }

    try {
      await api.integrations.deleteApiKey(orgId, keyId);
      loadApiKeys();
    } catch (err: any) {
      alert("Erreur révocation : " + err.message);
    }
  };

  // Changement de type de facture
  const handleInvoiceTypeChange = (type: string) => {
    setInvoiceType(type);
    if (type === 'electricity_onee_mt') {
      setSupplierName('ONEE - Branche Électricité');
      setCustomUnitPrice(1.15);
      setPhysicalUnit('kWh');
    } else if (type === 'electricity_onee_bt') {
      setSupplierName('ONEE / Régie Locale (Lydec, Redal, Amendis)');
      setCustomUnitPrice(1.25);
      setPhysicalUnit('kWh');
    } else if (type === 'electricity_onee_ht') {
      setSupplierName('ONEE Grands Comptes (Haute Tension)');
      setCustomUnitPrice(0.98);
      setPhysicalUnit('kWh');
    } else if (type === 'diesel_fleet') {
      setSupplierName('Afriquia SMDC / TotalEnergies / Shell');
      setCustomUnitPrice(12.50);
      setPhysicalUnit('litre');
    } else if (type === 'gasoline_fleet') {
      setSupplierName('TotalEnergies / Afriquia / Winxo');
      setCustomUnitPrice(14.20);
      setPhysicalUnit('litre');
    } else if (type === 'propane_tank') {
      setSupplierName('Afriquia Gaz / Salam Gaz / TotalEnergies Gaz');
      setCustomUnitPrice(11000.0);
      setPhysicalUnit('tonne');
    }
  };

  // Soumission Facture Unitaire
  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceError(null);
    setInvoiceResult(null);

    if (!invoiceRef.trim()) {
      setInvoiceError("La référence de facture est requise.");
      return;
    }

    if (!selectedPeriodId) {
      setInvoiceError("Veuillez sélectionner un exercice comptable.");
      return;
    }

    setInvoiceSubmitting(true);
    try {
      const payload: any = {
        reporting_period_id: selectedPeriodId,
        site_id: selectedSiteId || undefined,
        invoice_ref: invoiceRef.trim(),
        supplier_name: supplierName.trim(),
        invoice_type: invoiceType,
        invoice_date: invoiceDate,
        unit_price_mad: customUnitPrice ? Number(customUnitPrice) : undefined
      };

      if (inputMode === 'mad') {
        payload.bill_amount_mad = Number(billAmountMad);
      } else {
        payload.quantity = Number(physicalQuantity);
        payload.unit = physicalUnit;
      }

      const res = await api.integrations.ingestEnergyInvoice(orgId, payload);
      setInvoiceResult(res);
      setInvoiceRef('');
      loadLogs();
    } catch (err: any) {
      setInvoiceError(err.message || "Erreur lors de l'ingestion de la facture.");
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  // Soumission Import Massif
  const handleBulkImport = async (dryRunMode: boolean) => {
    setBulkError(null);
    setBulkResult(null);

    if (!selectedPeriodId) {
      setBulkError("Veuillez sélectionner un exercice comptable pour l'import massif.");
      return;
    }

    let items: any[] = [];
    try {
      const trimmed = bulkInput.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        items = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Détection format CSV simplifié
        const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length <= 1) {
          throw new Error("Le fichier CSV doit comporter au moins un en-tête et une ligne de données.");
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          const obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = cols[idx];
          });
          items.push(obj);
        }
      }
    } catch (parseErr: any) {
      setBulkError(`Format invalide : impossible de lire les données. Vérifiez votre syntaxe JSON ou CSV (${parseErr.message}).`);
      return;
    }

    if (items.length === 0) {
      setBulkError("Aucun enregistrement détecté dans la saisie.");
      return;
    }

    setBulkLoading(true);
    setBulkDryRun(dryRunMode);
    try {
      const res = await api.integrations.bulkImport(orgId, {
        reporting_period_id: selectedPeriodId,
        site_id: selectedSiteId || undefined,
        items,
        dryRun: dryRunMode
      });
      setBulkResult(res);
      if (!dryRunMode) {
        loadLogs();
      }
    } catch (err: any) {
      setBulkError(err.message || "Erreur lors de l'import massif.");
    } finally {
      setBulkLoading(false);
    }
  };

  // Exemple CSV téléchargeable
  const sampleCsvContent = `invoice_ref,invoice_type,bill_amount_mad,supplier_name,invoice_date
ONEE-2026-01-A,electricity_onee_mt,45000,ONEE Branche Électricité,2026-01-15
ONEE-2026-02-B,electricity_onee_mt,48500,ONEE Branche Électricité,2026-02-15
AFQ-2026-FL01,diesel_fleet,12500,Afriquia SMDC,2026-01-20
TOT-2026-PROP,propane_tank,33000,TotalEnergies Gaz,2026-02-05`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* En-tête de section */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Database size={14} /> CONNECTEURS INDUSTRIELS & ERP
          </span>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Phase 5 — Automatisation Machine-to-Machine
          </span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0' }}>
          Intégration ERP & Ingestion Automatisée des Factures
        </h1>
        <p style={{ fontSize: '15px', color: '#4b5563', margin: 0, maxWidth: '850px', lineHeight: '1.6' }}>
          Automatisez l'importation de vos factures d'électricité <strong>ONEE</strong>, de carburants (<strong>Afriquia, Total, Shell</strong>) et de gaz directement depuis vos logiciels de comptabilité ou ERP (SAP, Sage X3, Odoo, Cegid), avec calcul déterministe immédiat et protection anti-doublon certifiée.
        </p>
      </div>

      {/* Barre de navigation par onglets */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        <button
          onClick={() => setActiveTab('keys')}
          style={{
            padding: '12px 18px',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'keys' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'keys' ? '#059669' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <KeyRound size={18} /> Clés d'API & Authentification ({keys.length})
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          style={{
            padding: '12px 18px',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'invoice' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'invoice' ? '#059669' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Zap size={18} /> Ingestion Directe de Facture ONEE
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          style={{
            padding: '12px 18px',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'bulk' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'bulk' ? '#059669' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <FileSpreadsheet size={18} /> Import Massif (CSV / JSON)
        </button>

        <button
          onClick={() => { setActiveTab('logs'); loadLogs(); }}
          style={{
            padding: '12px 18px',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'logs' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'logs' ? '#059669' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <History size={18} /> Journal d'Ingestion & Audit
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          style={{
            padding: '12px 18px',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'docs' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'docs' ? '#059669' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Terminal size={18} /> Documentation API cURL
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ONGLET 1 : CLÉS D'API & AUTHENTIFICATION */}
      {/* ========================================================================= */}
      {activeTab === 'keys' && (
        <div>
          {/* Alerte affichage clé générée */}
          {generatedSecret && (
            <div style={{
              background: '#ecfdf5',
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#065f46' }}>
                <CheckCircle size={22} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>
                  Votre clé d'API secrète a été générée avec succès !
                </h3>
              </div>
              <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 12px 0' }}>
                Copiez et conservez cette clé en lieu sûr dans votre ERP ou votre coffre-fort de mots de passe. <strong>Pour des raisons de sécurité cryptographique, elle ne pourra plus jamais être réaffichée.</strong>
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#ffffff',
                border: '1px solid #a7f3d0',
                padding: '12px 16px',
                borderRadius: '8px'
              }}>
                <code style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', flex: 1, wordBreak: 'break-all' }}>
                  {generatedSecret}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedSecret)}
                  style={{
                    background: copiedKey ? '#059669' : '#0f172a',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                  {copiedKey ? 'Copié !' : 'Copier la clé'}
                </button>
              </div>
            </div>
          )}

          {/* En-tête gestion des clés */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Clés d'Accès Machine-to-Machine
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                Utilisez l'en-tête HTTP <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>X-Atlas-API-Key: ak_live_...</code> pour connecter vos systèmes.
              </p>
            </div>
            <button
              onClick={() => setNewKeyModal(true)}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
            >
              <Plus size={18} /> Générer une clé d'API
            </button>
          </div>

          {/* Tableau des clés */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            {loadingKeys ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                Chargement des clés d'accès...
              </div>
            ) : keys.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <KeyRound size={40} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 6px 0' }}>
                  Aucune clé d'API configurée
                </h4>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>
                  Générez une première clé pour connecter votre logiciel de facturation ou vos scripts d'ingestion.
                </p>
                <button
                  onClick={() => setNewKeyModal(true)}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Créer ma première clé
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Système & Libellé</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Préfixe</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Permissions</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Statut</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Dernière utilisation</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Créée le</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#111827' }}>
                        {k.name}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <code style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '13px' }}>
                          {k.key_prefix}••••••••
                        </code>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: k.permissions === 'full' ? '#ede9fe' : (k.permissions === 'read_only' ? '#f3f4f6' : '#dbeafe'),
                          color: k.permissions === 'full' ? '#6d28d9' : (k.permissions === 'read_only' ? '#4b5563' : '#1e40af')
                        }}>
                          {k.permissions === 'full' ? 'Admin Complet' : (k.permissions === 'read_only' ? 'Lecture Seule' : 'Lecture / Écriture')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {k.is_active ? (
                          <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '500' }}>
                            <CheckCircle2 size={14} /> Active
                          </span>
                        ) : (
                          <span style={{ color: '#dc2626', fontSize: '13px' }}>Révoquée</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '13px' }}>
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('fr-FR') + ' ' + new Date(k.last_used_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Jamais utilisée'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '13px' }}>
                        {new Date(k.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteKey(k.id, k.name)}
                          title="Révoquer définitivement cette clé"
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          <Trash2 size={14} /> Révoquer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Modale création clé */}
          {newKeyModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '28px',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
                  Générer une nouvelle clé d'API ERP
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px 0' }}>
                  Attribuez un libellé clair pour identifier la machine ou le script qui consommera l'API.
                </p>

                <form onSubmit={handleCreateKey}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Nom du connecteur ou du serveur
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Connecteur SAP Casablanca, Script Factures ONEE"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Permissions accordées
                    </label>
                    <select
                      value={keyPerm}
                      onChange={(e) => setKeyPerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        background: 'white'
                      }}
                    >
                      <option value="read_write">Lecture & Écriture (Ingestion de factures, import massif)</option>
                      <option value="read_only">Lecture seule (Audit, reporting analytique)</option>
                      <option value="full">Admin Complet (Gestion des périodes et sites)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setNewKeyModal(false)}
                      style={{
                        background: '#f3f4f6',
                        color: '#4b5563',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Générer la clé
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2 : INGESTION DIRECTE DE FACTURE ÉNERGÉTIQUE */}
      {/* ========================================================================= */}
      {activeTab === 'invoice' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '24px' }}>
          {/* Formulaire */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="#059669" /> Comptabilisation Déterministe d'une Facture
            </h2>

            {invoiceError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#b91c1c',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{invoiceError}</div>
              </div>
            )}

            <form onSubmit={handleSubmitInvoice}>
              {/* Période & Site */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Exercice Comptable
                  </label>
                  <select
                    value={selectedPeriodId}
                    onChange={(e) => setSelectedPeriodId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                  >
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name || `Exercice ${p.year}`} {p.status === 'closed' ? '(Clôturé)' : '(Actif)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Site Opérationnel
                  </label>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                  >
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type de flux énergétique */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Type d'Énergie & Barème Officiel Marocain
                </label>
                <select
                  value={invoiceType}
                  onChange={(e) => handleInvoiceTypeChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #059669',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#f0fdf4',
                    fontWeight: '600',
                    color: '#065f46',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="electricity_onee_mt">Électricité ONEE - Moyenne Tension (Ateliers, Usines - 1.15 MAD/kWh)</option>
                  <option value="electricity_onee_bt">Électricité ONEE / Régie - Basse Tension (Bureaux, Agences - 1.25 MAD/kWh)</option>
                  <option value="electricity_onee_ht">Électricité ONEE - Haute Tension (Grande Industrie - 0.98 MAD/kWh)</option>
                  <option value="diesel_fleet">Gasoil / Diesel Pompe (Flotte utilitaire & Groupes - 12.50 MAD/L)</option>
                  <option value="gasoline_fleet">Essence Super Sans Plomb (Flotte VL - 14.20 MAD/L)</option>
                  <option value="propane_tank">Gaz Propane Vrac Citerne (Chaudières & Fours - 11 000 MAD/Tonne)</option>
                </select>
              </div>

              {/* Référence et Fournisseur */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    N° / Référence Facture <span style={{ color: '#dc2626' }}>* (Anti-doublon)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex: ONEE-2026-F08821"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Fournisseur d'énergie
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Bascule Mode Montant MAD vs Quantité */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="inputMode"
                      checked={inputMode === 'mad'}
                      onChange={() => setInputMode('mad')}
                    /> Saisie par montant en Dirhams (MAD HT)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="inputMode"
                      checked={inputMode === 'physical'}
                      onChange={() => setInputMode('physical')}
                    /> Saisie par quantité physique ({physicalUnit})
                  </label>
                </div>

                {inputMode === 'mad' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Montant Facture (Dirhams Marocains - MAD HT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="50 000"
                        value={billAmountMad}
                        onChange={(e) => setBillAmountMad(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '15px',
                          fontWeight: 'bold',
                          color: '#059669',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Tarif unitaire appliqué (MAD / {physicalUnit})
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={customUnitPrice}
                        onChange={(e) => setCustomUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Quantité physique consommée ({physicalUnit})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 43478.26"
                      value={physicalQuantity}
                      onChange={(e) => setPhysicalQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        color: '#059669',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Date Facture */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Date d'émission de la facture
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={invoiceSubmitting}
                style={{
                  width: '100%',
                  background: invoiceSubmitting ? '#9ca3af' : '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: invoiceSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {invoiceSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Calcul déterministe en cours...
                  </>
                ) : (
                  <>
                    <Zap size={18} /> Comptabiliser & Calculer les Émissions (tCO₂e)
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Volet Résultat & Traçabilité */}
          <div>
            {invoiceResult ? (
              <div style={{
                background: '#f0fdf4',
                border: '2px solid #86efac',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', marginBottom: '12px' }}>
                  <CheckCircle2 size={24} />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                    Facture Comptabilisée avec Succès !
                  </h3>
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                    Émissions Calculées (Scope {invoiceResult.scope})
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#059669', lineHeight: 1.1 }}>
                    {invoiceResult.emission_t_co2e.toFixed(3)} <span style={{ fontSize: '18px', fontWeight: '600' }}>tCO₂e</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '6px' }}>
                    ({invoiceResult.emission_kg_co2e.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kgCO₂e)
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7' }}>
                  <div><strong>Réf Facture :</strong> {invoiceResult.invoice_ref}</div>
                  <div><strong>Fournisseur :</strong> {invoiceResult.supplier_name}</div>
                  <div><strong>Quantité convertie :</strong> {invoiceResult.conversion_summary}</div>
                  <div><strong>Activité ID :</strong> <code>{invoiceResult.activity_id}</code></div>
                  {invoiceResult.calculation_trace && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#ffffff', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#047857', textTransform: 'uppercase' }}>
                        Formule Déterministe Appliquée :
                      </div>
                      <code style={{ fontSize: '12px', color: '#0f172a' }}>
                        {invoiceResult.calculation_trace.formula}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                background: '#f9fafb',
                border: '1px dashed #d1d5db',
                borderRadius: '12px',
                padding: '32px 20px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <Shield size={36} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: '0 0 6px 0' }}>
                  Garanties Méthodologiques Atlas Carbone
                </h4>
                <ul style={{ textAlign: 'left', fontSize: '13px', color: '#4b5563', lineHeight: '1.6', margin: '12px 0 0 0', paddingLeft: '20px' }}>
                  <li><strong>Facteurs du Classeur Officiel :</strong> Mix ONEE (0.6426 kgCO₂e/kWh), Diesel Pompe (3.056 kgCO₂e/L).</li>
                  <li><strong>Anti-Doublon Garanti :</strong> Rejet HTTP 409 immédiat si la référence existe déjà pour l'exercice.</li>
                  <li><strong>Conversions en MAD :</strong> Conforme aux pratiques de gestion des DAF et experts-comptables marocains.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3 : IMPORTATION MASSIVE (CSV / JSON) */}
      {/* ========================================================================= */}
      {activeTab === 'bulk' && (
        <div>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  Importation Massive par Lots (Bulk Ingestion)
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                  Collez vos lignes de factures au format JSON ou CSV pour intégrer jusqu'à 500 factures en une seule transaction.
                </p>
              </div>

              <button
                onClick={() => setBulkInput(sampleCsvContent)}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileSpreadsheet size={16} /> Charger le modèle CSV d'exemple
              </button>
            </div>

            {bulkError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#b91c1c',
                fontSize: '14px'
              }}>
                {bulkError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Exercice comptable cible
              </label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                style={{
                  maxWidth: '350px',
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name || `Exercice ${p.year}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Données Brutes (CSV avec en-têtes ou Tableau JSON)
              </label>
              <textarea
                rows={9}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={sampleCsvContent}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleBulkImport(true)}
                disabled={bulkLoading}
                style={{
                  background: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #9ca3af',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: bulkLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Shield size={16} color="#059669" /> Simuler l'importation (Dry-Run / Vérification préalable)
              </button>

              <button
                onClick={() => handleBulkImport(false)}
                disabled={bulkLoading}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: bulkLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Upload size={16} /> Importer Définitivement dans le Bilan
              </button>
            </div>
          </div>

          {/* Résultat de l'import massif */}
          {bulkResult && (
            <div style={{
              background: bulkResult.dryRun ? '#eff6ff' : '#ecfdf5',
              border: `2px solid ${bulkResult.dryRun ? '#60a5fa' : '#34d399'}`,
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                {bulkResult.dryRun ? <Shield size={24} color="#2563eb" /> : <CheckCircle2 size={24} color="#059669" />}
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: bulkResult.dryRun ? '#1e40af' : '#065f46' }}>
                  {bulkResult.dryRun ? 'Résultats de la Simulation (Dry-Run)' : 'Importation Réussie et Enregistrée !'}
                </h3>
              </div>

              {/* Statistiques en cartes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'white', padding: '14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Lignes Analysées</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>
                    {bulkResult.total_records || bulkResult.total_items}
                  </div>
                </div>

                <div style={{ background: 'white', padding: '14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#059669' }}>Lignes Valides / Importées</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>
                    {bulkResult.imported_count !== undefined ? bulkResult.imported_count : bulkResult.valid_count}
                  </div>
                </div>

                <div style={{ background: 'white', padding: '14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#d97706' }}>Doublons Rejetés</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706' }}>
                    {bulkResult.duplicate_count}
                  </div>
                </div>

                <div style={{ background: 'white', padding: '14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#2563eb' }}>Impact Carbone Total</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb' }}>
                    {bulkResult.total_emissions_tco2e || bulkResult.projected_total_tco2e} <span style={{ fontSize: '14px' }}>tCO₂e</span>
                  </div>
                </div>
              </div>

              {/* Détails des doublons si existants */}
              {bulkResult.duplicates && bulkResult.duplicates.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#92400e', marginBottom: '6px' }}>
                    Doublons identifiés (non ré-importés pour éviter le double comptage) :
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#78350f' }}>
                    {bulkResult.duplicates.map((d: any, i: number) => (
                      <li key={i}>
                        Réf <strong>{d.invoice_ref}</strong> : {d.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 4 : JOURNAL D'AUDIT ET D'INGESTION ERP */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Historique des Synchronisations & Ingestions
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                Traçabilité intégrale pour les commissaires aux comptes et auditeurs ESG.
              </p>
            </div>
            <button
              onClick={loadLogs}
              style={{
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} /> Rafraîchir
            </button>
          </div>

          {loadingLogs ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Chargement du journal d'ingestion...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
              <History size={40} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
              Aucun import ERP enregistré pour le moment.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Date & Heure</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Système Source</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Type d'Opération</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Lignes Traitées</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Succès / Rejets</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Émissions Ajoutées</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                      {new Date(log.created_at).toLocaleDateString('fr-FR')} {new Date(log.created_at).toLocaleTimeString('fr-FR')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        {log.source_system}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: log.import_type === 'energy_invoice' ? '#dcfce7' : '#e0e7ff',
                        color: log.import_type === 'energy_invoice' ? '#166534' : '#3730a3'
                      }}>
                        {log.import_type === 'energy_invoice' ? 'Facture Unitaire' : 'Import Massif Lot'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                      {log.total_records}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: '#059669', fontWeight: '600' }}>{log.successful_records}</span>
                      {log.failed_records > 0 && (
                        <span style={{ color: '#dc2626', marginLeft: '6px' }}>({log.failed_records} rejetés)</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#059669' }}>
                      +{Number(log.total_emissions_tco2e || 0).toFixed(3)} tCO₂e
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 5 : DOCUMENTATION TECHNIQUE & EXEMPLES CURL */}
      {/* ========================================================================= */}
      {activeTab === 'docs' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={20} color="#059669" /> Guide d'Intégration API REST pour les DSI & Développeurs ERP
          </h2>
          <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 20px 0' }}>
            Atlas Carbone fournit une API HTTP RESTful conçue pour s'interfacer sans friction avec SAP, Sage X3, Odoo, Cegid ou des scripts Python/Node.js planifiés.
          </p>

          {/* Exemple 1 : Ingestion Facture ONEE */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
              1. Ingestion d'une Facture Électrique Moyenne Tension (ONEE)
            </h3>
            <div style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '13px',
              overflowX: 'auto',
              position: 'relative'
            }}>
              <pre style={{ margin: 0 }}>{`curl -X POST https://mesure-emissions.com/api/integrations/energy-invoice \\
  -H "Content-Type: application/json" \\
  -H "X-Atlas-API-Key: ak_live_VOTRE_CLE_SECRETE" \\
  -d '{
    "reporting_period_id": "${selectedPeriodId || 'per-agro-2025'}",
    "invoice_ref": "ONEE-2026-F98201",
    "supplier_name": "ONEE - Branche Électricité",
    "invoice_type": "electricity_onee_mt",
    "bill_amount_mad": 50000,
    "unit_price_mad": 1.15,
    "invoice_date": "2026-03-31"
  }'`}</pre>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
              💡 <em>Le moteur déduit 43 478,26 kWh et calcule instantanément 27,94 tCO₂e Scope 2 selon le mix réseau marocain certifié.</em>
            </p>
          </div>

          {/* Exemple 2 : Ingestion Flotte Carburant */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
              2. Ingestion Facture Carburant Gasoil (Cartes Flotte Afriquia / Total)
            </h3>
            <div style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '13px',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0 }}>{`curl -X POST https://mesure-emissions.com/api/integrations/energy-invoice \\
  -H "Content-Type: application/json" \\
  -H "X-Atlas-API-Key: ak_live_VOTRE_CLE_SECRETE" \\
  -d '{
    "reporting_period_id": "${selectedPeriodId || 'per-agro-2025'}",
    "invoice_ref": "AFQ-FLOTTE-2026-03",
    "supplier_name": "Afriquia SMDC",
    "invoice_type": "diesel_fleet",
    "bill_amount_mad": 10000,
    "unit_price_mad": 12.50,
    "invoice_date": "2026-03-31"
  }'`}</pre>
            </div>
          </div>

          {/* Gestion des Codes d'Erreur */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
              3. Codes de Réponses HTTP Déterministes
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Code</th>
                  <th style={{ padding: '8px 12px' }}>Signification</th>
                  <th style={{ padding: '8px 12px' }}>Comportement</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#059669' }}>201 Created</td>
                  <td style={{ padding: '8px 12px' }}>Facture enregistrée et calculée</td>
                  <td style={{ padding: '8px 12px' }}>Émissions calculées, traçabilité et ID retournés</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#d97706' }}>409 Conflict</td>
                  <td style={{ padding: '8px 12px' }}>Doublon détecté (Anti-doublon)</td>
                  <td style={{ padding: '8px 12px' }}>La facture existe déjà ; import rejeté pour éviter le double comptage</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#dc2626' }}>401 / 403</td>
                  <td style={{ padding: '8px 12px' }}>Clé invalide ou période clôturée</td>
                  <td style={{ padding: '8px 12px' }}>Accès refusé ou exercice immuable</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
