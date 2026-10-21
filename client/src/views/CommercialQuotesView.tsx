/**
 * Atlas Carbone - Vue Espace Commercial, Devis & Abonnements
 * Paramétrage des offres, génération de devis conformes en MAD et gestion des abonnements
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  CreditCard,
  Plus,
  CheckCircle2,
  Printer,
  Download,
  X,
  Building,
  ShieldCheck,
  Zap,
  ArrowRight,
  Copy,
  Clock,
  Landmark,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';
import { Quote, Subscription } from '../types.js';
import { api } from '../api.js';

interface CommercialQuotesViewProps {
  orgId: string;
}

export const CommercialQuotesView: React.FC<CommercialQuotesViewProps> = ({ orgId }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal Générateur de Devis
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('entreprise_macf');
  const [extraSites, setExtraSites] = useState<number>(0);
  const [extraUsers, setExtraUsers] = useState<number>(0);
  const [discountMad, setDiscountMad] = useState<number>(0);

  // Modal Aperçu Devis Imprimable
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);

  // Modal Upgrade d'Abonnement
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlanId, setUpgradePlanId] = useState('entreprise_macf');
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Modal Règlement CMI / Virement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedQuoteForPay, setSelectedQuoteForPay] = useState<Quote | null>(null);
  const [payMethod, setPayMethod] = useState<'cmi' | 'transfer'>('cmi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [copiedRib, setCopiedRib] = useState(false);

  const PLAN_PRICES: Record<string, { label: string; baseHT: number; desc: string }> = {
    pme_climat: { label: 'Pack PME Climat', baseHT: 4900, desc: '1 site, 3 utilisateurs, Scopes 1 & 2' },
    entreprise_macf: { label: 'Pack Entreprise & Exportateur MACF', baseHT: 14500, desc: '5 sites, 10 utilisateurs, Scopes 1, 2, 3 + Module MACF' },
    grand_compte: { label: 'Pack Grand Compte & Industrie', baseHT: 29000, desc: 'Sites illimités, Utilisateurs illimités, API ERP' },
    Essentiel: { label: 'Offre Essentiel (PME Monosite)', baseHT: 12000, desc: '1 site, 3 utilisateurs' },
    Entreprise: { label: 'Offre Entreprise (Multisites)', baseHT: 24000, desc: '5 sites, 10 utilisateurs' },
    'Export Europe': { label: 'Offre Export Europe MACF', baseHT: 45000, desc: 'Périmètre complet + Régime MACF 2026' }
  };

  const getBasePrice = (planKey: string) => {
    return PLAN_PRICES[planKey]?.baseHT || 14500;
  };

  const currentSubtotal = Math.max(0, getBasePrice(selectedPlan) + extraSites * 2000 + extraUsers * 800 - discountMad);
  const currentTVA = currentSubtotal * 0.20;
  const currentTotalTTC = currentSubtotal + currentTVA;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [q, sub] = await Promise.all([
        api.commercial.getQuotes(orgId),
        api.commercial.getSubscription(orgId)
      ]);
      setQuotes(q || []);
      setSubscription(sub || null);
    } catch (e) {
      console.error("Erreur commercial:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planInfo = PLAN_PRICES[selectedPlan];
      const newQuote = await api.commercial.createQuote({
        plan_name: planInfo?.label || selectedPlan,
        base_amount_mad: getBasePrice(selectedPlan),
        extra_sites_count: extraSites,
        extra_users_count: extraUsers,
        discount_mad: discountMad
      }, orgId);
      setShowQuoteModal(false);
      await fetchData();
      alert(`Devis ${newQuote.quoteNumber} généré avec succès ! Montant TTC : ${newQuote.totalTTC.toLocaleString('fr-FR')} MAD.`);
    } catch (err: any) {
      alert("Erreur génération devis: " + err.message);
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpgrading(true);
    try {
      await api.commercial.upgradeSubscription({ newPlanId: upgradePlanId }, orgId);
      setShowUpgradeModal(false);
      await fetchData();
      alert("Votre abonnement a été mis à niveau avec succès ! Vos nouveaux quotas sont immédiatement actifs.");
    } catch (err: any) {
      alert("Erreur mise à niveau: " + err.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSimulateCmiPayment = async () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      const authCode = `AUTH-CMI-${Math.floor(100000 + Math.random() * 900000)}`;
      setPaymentSuccessData({
        authCode,
        transId: `CMI-${Date.now()}`,
        amount: selectedQuoteForPay?.total_ttc_mad || 17400
      });
      setIsProcessingPayment(false);
    }, 1200);
  };

  const copyRibToClipboard = () => {
    navigator.clipboard.writeText('007 780 0001234567890123 45');
    setCopiedRib(true);
    setTimeout(() => setCopiedRib(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Statut de l'Abonnement Actuel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-100 text-brand-900">
              Offre {subscription?.plan_name ? subscription.plan_name.toUpperCase() : 'PACK ENTREPRISE & MACF'}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Abonnement Actif</span>
            </span>
            {subscription?.cbam_access ? (
              <span className="px-2 py-0.5 rounded text-[11px] bg-blue-100 text-blue-800 font-bold">
                Module MACF 2026 Inclus
              </span>
            ) : null}
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">Abonnement SaaS Atlas Carbone</h3>
          <p className="text-xs text-slate-500">
            Validité jusqu'au : <strong>{subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR') : '01/01/2027'}</strong> • Limites : {subscription?.sites_limit || 5} site(s) / {subscription?.users_limit || 10} utilisateur(s)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>Mettre à niveau (Upgrade)</span>
          </button>

          <button
            onClick={() => setShowQuoteModal(true)}
            className="px-4 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Établir un nouveau devis</span>
          </button>
        </div>
      </div>

      {/* Grille des Offres Commerciales Configurables */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-900">Grille des Offres Atlas Carbone Maroc (MAD HT)</h3>
          <span className="text-xs text-slate-500">Facturation officielle avec TVA marocaine légale de 20%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Offre 1 : PME Climat */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PME & Appels d'Offres</span>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">Pack PME Climat</h4>
              <div className="mt-3 text-3xl font-extrabold text-slate-900">
                4 900 <span className="text-sm font-normal text-slate-500">MAD HT / an</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">(Soit 5 880 MAD TTC)</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>1 site d'exploitation permanent au Maroc</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Jusqu'à 3 utilisateurs collaborateurs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Scopes 1 & 2 complets (Facteurs officiels ONEE)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Rapport d'inventaire officiel PDF certifié</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSelectedPlan('pme_climat');
                setShowQuoteModal(true);
              }}
              className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition"
            >
              Établir devis PME Climat
            </button>
          </div>

          {/* Offre 2 : Entreprise & MACF (Recommandé) */}
          <div className="bg-white p-6 rounded-2xl border-2 border-brand-600 shadow-md relative flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-0.5 bg-brand-800 text-white rounded-full text-[10px] font-bold tracking-wide uppercase">
              Recommandé • Exportateurs UE
            </span>
            <div>
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Groupes & Industriels</span>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">Pack Entreprise & MACF</h4>
              <div className="mt-3 text-3xl font-extrabold text-brand-900">
                14 500 <span className="text-sm font-normal text-slate-500">MAD HT / an</span>
              </div>
              <p className="text-xs text-brand-700/80 mt-0.5">(Soit 17 400 MAD TTC)</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Jusqu'à 5 sites usines consolidés</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>10 utilisateurs avec rôles fins (RBAC)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Scopes 1, 2, 3 (15 catégories GHG Protocol)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Module Déclaration Régime Définitif MACF 2026</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Piste d'audit certifiable ISO 14064 & support 24h</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSelectedPlan('entreprise_macf');
                setShowQuoteModal(true);
              }}
              className="mt-6 w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow transition"
            >
              Établir devis Entreprise & MACF
            </button>
          </div>

          {/* Offre 3 : Grand Compte & Industrie */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Multisites & Lourde Industrie</span>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">Pack Grand Compte</h4>
              <div className="mt-3 text-3xl font-extrabold text-slate-900">
                29 000 <span className="text-sm font-normal text-slate-500">MAD HT / an</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">(Soit 34 800 MAD TTC)</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Sites et utilisateurs illimités</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Accès Auditeur externe ISO 14065</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Connecteurs API ERP & import massif</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Accompagnement méthodologique dédié</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSelectedPlan('grand_compte');
                setShowQuoteModal(true);
              }}
              className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition"
            >
              Établir devis Grand Compte
            </button>
          </div>
        </div>
      </div>

      {/* Historique des Devis Émis */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-bold text-slate-900 text-sm">Historique des Devis Commerciaux & Factures Proforma</span>
          <span>{quotes.length} devis émis</span>
        </div>

        {quotes.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Aucun devis émis pour le moment. Cliquez sur <strong>« Établir un nouveau devis »</strong> pour générer un devis proforma officiel avec RIB marocain.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Numéro Devis</th>
                  <th className="py-3 px-4">Offre / Plan</th>
                  <th className="py-3 px-4">Total HT (MAD)</th>
                  <th className="py-3 px-4">TVA (20%)</th>
                  <th className="py-3 px-4 font-bold text-slate-900">Total TTC (MAD)</th>
                  <th className="py-3 px-4">Validité</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.map(q => {
                  const pdfUrl = api.commercial.getQuotePdfUrl(q.id, orgId);

                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-brand-900">{q.quote_number}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{q.plan_name}</td>
                      <td className="py-3 px-4 font-mono">{(q.total_ttc_mad / 1.20).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 font-mono">{q.tva_amount_mad.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {q.total_ttc_mad.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
                      </td>
                      <td className="py-3 px-4 text-slate-500">{new Date(q.valid_until).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <a
                            href={pdfUrl}
                            download={`Devis_AtlasCarbone_${q.quote_number}.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-lg text-[11px] transition flex items-center space-x-1"
                            title="Télécharger le devis PDF officiel avec RIB"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>

                          <button
                            onClick={() => {
                              setSelectedQuoteForPay(q);
                              setShowPaymentModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-[11px] transition flex items-center space-x-1"
                            title="Régler ce devis par Carte CMI ou Virement"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Régler</span>
                          </button>

                          <button
                            onClick={() => setActiveQuote(q)}
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-[11px] transition flex items-center space-x-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Aperçu</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Générateur de Devis */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Établir un Devis Personnalisé en Dirhams (MAD)</h3>
              <button onClick={() => setShowQuoteModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleGenerateQuote} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Offre de base</label>
                <select
                  value={selectedPlan}
                  onChange={e => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="pme_climat">Pack PME Climat (4 900 MAD HT / an)</option>
                  <option value="entreprise_macf">Pack Entreprise & Exportateur MACF (14 500 MAD HT / an)</option>
                  <option value="grand_compte">Pack Grand Compte & Industrie (29 000 MAD HT / an)</option>
                  <option value="Essentiel">Offre Essentiel (12 000 MAD HT / an)</option>
                  <option value="Entreprise">Offre Entreprise (24 000 MAD HT / an)</option>
                  <option value="Export Europe">Offre Export Europe MACF (45 000 MAD HT / an)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sites supp. (+2 000 MAD/site)</label>
                  <input
                    type="number"
                    min="0"
                    value={extraSites}
                    onChange={e => setExtraSites(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Utilisateurs supp. (+800 MAD/user)</label>
                  <input
                    type="number"
                    min="0"
                    value={extraUsers}
                    onChange={e => setExtraUsers(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remise commerciale exceptionnelle (MAD HT)</label>
                <input
                  type="number"
                  min="0"
                  value={discountMad}
                  onChange={e => setDiscountMad(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total HT :</span>
                  <span>{currentSubtotal.toLocaleString('fr-FR')} MAD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TVA légale (20%) :</span>
                  <span>{currentTVA.toLocaleString('fr-FR')} MAD</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                  <span>Total Net TTC :</span>
                  <span className="text-brand-900 font-extrabold">{currentTotalTTC.toLocaleString('fr-FR')} MAD</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl shadow transition"
                >
                  Émettre le devis proforma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upgrade d'Abonnement */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Mettre à Niveau votre Abonnement</h3>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpgrade} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Sélectionnez le pack supérieur vers lequel vous souhaitez basculer. Vos nouveaux quotas seront immédiatement débloqués :
              </p>

              <div className="space-y-3">
                <label className={`block p-4 rounded-xl border cursor-pointer transition ${upgradePlanId === 'entreprise_macf' ? 'border-brand-700 bg-brand-50/50' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="upgradePlan"
                        value="entreprise_macf"
                        checked={upgradePlanId === 'entreprise_macf'}
                        onChange={() => setUpgradePlanId('entreprise_macf')}
                      />
                      <span className="font-bold text-slate-900 text-sm">Pack Entreprise & MACF</span>
                    </div>
                    <span className="font-bold text-brand-900">14 500 MAD HT/an</span>
                  </div>
                  <p className="text-slate-500 mt-1 ml-5">5 sites, 10 utilisateurs, Scopes 1, 2, 3 exhaustifs et module MACF/CBAM 2026 inclus.</p>
                </label>

                <label className={`block p-4 rounded-xl border cursor-pointer transition ${upgradePlanId === 'grand_compte' ? 'border-brand-700 bg-brand-50/50' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="upgradePlan"
                        value="grand_compte"
                        checked={upgradePlanId === 'grand_compte'}
                        onChange={() => setUpgradePlanId('grand_compte')}
                      />
                      <span className="font-bold text-slate-900 text-sm">Pack Grand Compte & Industrie</span>
                    </div>
                    <span className="font-bold text-brand-900">29 000 MAD HT/an</span>
                  </div>
                  <p className="text-slate-500 mt-1 ml-5">Sites et utilisateurs illimités, API ERP, portail auditeur ISO 14065.</p>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpgrading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow transition"
                >
                  {isUpgrading ? 'Mise à niveau en cours...' : 'Confirmer la mise à niveau'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Règlement CMI & Virement */}
      {showPaymentModal && selectedQuoteForPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-brand-800" />
                <h3 className="font-bold text-slate-900 text-base">Règlement du Devis {selectedQuoteForPay.quote_number}</h3>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentSuccessData(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {paymentSuccessData ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-center">
                <BadgeCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-base">Paiement CMI Autorisé avec Succès !</h4>
                <p className="text-xs text-emerald-800">
                  Votre transaction de <strong>{paymentSuccessData.amount.toLocaleString('fr-FR')} MAD TTC</strong> a été validée.
                  Numéro d'autorisation : <code className="font-bold">{paymentSuccessData.authCode}</code>.
                </p>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentSuccessData(null);
                    fetchData();
                  }}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow transition mt-2"
                >
                  Retour aux devis & abonnements
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Sélecteur de méthode */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setPayMethod('cmi')}
                    className={`py-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${payMethod === 'cmi' ? 'bg-white text-brand-900 shadow-xs' : 'text-slate-600'}`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Carte Bancaire CMI</span>
                  </button>
                  <button
                    onClick={() => setPayMethod('transfer')}
                    className={`py-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${payMethod === 'transfer' ? 'bg-white text-brand-900 shadow-xs' : 'text-slate-600'}`}
                  >
                    <Landmark className="w-4 h-4" />
                    <span>Virement Bancaire</span>
                  </button>
                </div>

                {payMethod === 'cmi' ? (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block text-sm">Passerelle CMI 3D-Secure Sécurisée</span>
                    <p className="text-slate-500 text-[11px]">
                      Cartes marocaines et internationales acceptées. Débit immédiat de <strong>{selectedQuoteForPay.total_ttc_mad.toLocaleString('fr-FR')} MAD TTC</strong>.
                    </p>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Numéro de carte bancaire</label>
                      <input
                        type="text"
                        defaultValue="4111 •••• •••• 1234"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                        readOnly
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Expiration</label>
                        <input
                          type="text"
                          defaultValue="12/28"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">CVV</label>
                        <input
                          type="text"
                          defaultValue="•••"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                          readOnly
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSimulateCmiPayment}
                      disabled={isProcessingPayment}
                      className="w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-bold rounded-xl shadow transition mt-2 flex items-center justify-center space-x-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isProcessingPayment ? 'Autorisation CMI en cours...' : `Payer ${selectedQuoteForPay.total_ttc_mad.toLocaleString('fr-FR')} MAD TTC`}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block text-sm">Ordre de Virement Bancaire</span>
                    <p className="text-slate-500 text-[11px]">
                      Effectuez votre virement sur notre compte officiel. Votre abonnement sera activé dès réception de l'ordre cacheté :
                    </p>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                      <div><span className="text-slate-400">Bénéficiaire :</span> <strong>ATLAS CARBONE S.A.R.L.</strong></div>
                      <div><span className="text-slate-400">Banque :</span> Attijariwafa bank / Banque Populaire du Maroc</div>
                      <div><span className="text-slate-400">Agence :</span> Casablanca Anfa</div>
                      <div className="flex items-center justify-between text-brand-900 font-bold pt-1">
                        <span>RIB : 007 780 0001234567890123 45</span>
                        <button
                          onClick={copyRibToClipboard}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-700 flex items-center space-x-1"
                        >
                          {copiedRib ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                          <span>{copiedRib ? 'Copié !' : 'Copier'}</span>
                        </button>
                      </div>
                      <div><span className="text-slate-400">Référence à mentionner :</span> <strong>{selectedQuoteForPay.quote_number}</strong></div>
                    </div>

                    <a
                      href={api.commercial.getQuotePdfUrl(selectedQuoteForPay.id, orgId)}
                      download={`Devis_AtlasCarbone_${selectedQuoteForPay.quote_number}.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-bold rounded-xl shadow transition mt-2 flex items-center justify-center space-x-2 text-center"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger le Devis Proforma avec RIB (PDF)</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Devis Imprimable / PDF Preview */}
      {activeQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-xl font-bold text-slate-900">
                  Atlas <span className="text-brand-700">Carbone</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5">SaaS de Comptabilité GES Maroc & MACF</p>
                <p className="text-xs text-slate-400">Casablanca — ICE : 003456789000045</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-brand-900 bg-brand-50 px-2.5 py-1 rounded-md">
                  {activeQuote.quote_number}
                </span>
                <p className="text-xs text-slate-500 mt-1">Date : {new Date(activeQuote.created_at).toLocaleDateString('fr-FR')}</p>
                <p className="text-xs text-slate-500">Valable jusqu'au : {new Date(activeQuote.valid_until).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Description de la prestation</th>
                  <th className="py-2.5 px-3 text-right">Montant HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900">{activeQuote.plan_name}</span>
                    <span className="block text-[11px] text-slate-500">Licence annuelle SaaS Atlas Carbone</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {(activeQuote.total_ttc_mad / 1.20).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end text-xs font-mono space-y-1">
              <div className="w-64 space-y-1 border-t border-slate-200 pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>Total HT :</span>
                  <span>{(activeQuote.total_ttc_mad / 1.20).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TVA (20%) :</span>
                  <span>{activeQuote.tva_amount_mad.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-brand-950 border-t border-slate-200 pt-1">
                  <span>Net à payer TTC :</span>
                  <span>{activeQuote.total_ttc_mad.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Règlement par virement sur Attijariwafa bank (RIB : 007 780 0001234567890123 45).</span>
              <div className="flex space-x-2">
                <a
                  href={api.commercial.getQuotePdfUrl(activeQuote.id, orgId)}
                  download={`Devis_AtlasCarbone_${activeQuote.quote_number}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-brand-800 text-white font-semibold rounded-lg hover:bg-brand-900 transition flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger PDF</span>
                </a>
                <button
                  onClick={() => setActiveQuote(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
