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
  X,
  Building,
  ShieldCheck,
  Zap,
  ArrowRight
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
  const [selectedPlan, setSelectedPlan] = useState('Entreprise');
  const [extraSites, setExtraSites] = useState<number>(0);
  const [extraUsers, setExtraUsers] = useState<number>(0);
  const [discountMad, setDiscountMad] = useState<number>(0);

  // Modal Aperçu Devis Imprimable
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = await api.commercial.getQuotes();
      setQuotes(q);
      const sub = await api.commercial.getSubscription();
      setSubscription(sub);
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
      const newQuote = await api.commercial.createQuote({
        plan_name: selectedPlan,
        extra_sites_count: extraSites,
        extra_users_count: extraUsers,
        discount_mad: discountMad
      });
      setShowQuoteModal(false);
      fetchData();
      alert(`Devis ${newQuote.quoteNumber} généré avec succès ! Montant TTC : ${newQuote.totalTTC.toLocaleString('fr-FR')} MAD.`);
    } catch (err: any) {
      alert("Erreur génération devis: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Statut de l'Abonnement Actuel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-100 text-brand-900">
              Offre {subscription?.plan_name ? subscription.plan_name.toUpperCase() : 'ENTREPRISE'}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Abonnement Actif</span>
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">Abonnement SaaS Atlas Carbone</h3>
          <p className="text-xs text-slate-500">
            Validité jusqu'au : <strong>{subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR') : '01/01/2027'}</strong> • Limites : {subscription?.sites_limit || 5} sites / {subscription?.users_limit || 10} utilisateurs
          </p>
        </div>

        <div className="flex items-center space-x-3">
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
        <h3 className="text-base font-bold text-slate-900 mb-4">Grille des Offres Atlas Carbone Maroc</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Offre 1 : Essentiel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PME Monosite</span>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">Essentiel</h4>
              <div className="mt-3 text-3xl font-extrabold text-slate-900">
                12 000 <span className="text-sm font-normal text-slate-500">MAD HT / an</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>1 site d'exploitation inclus</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Jusqu'à 3 utilisateurs collaborateurs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Scopes 1 & 2 complets (Facteurs Maroc)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Rapport d'inventaire officiel PDF</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSelectedPlan('Essentiel');
                setShowQuoteModal(true);
              }}
              className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition"
            >
              Créer un devis Essentiel
            </button>
          </div>

          {/* Offre 2 : Entreprise (Populaire) */}
          <div className="bg-white p-6 rounded-2xl border-2 border-brand-600 shadow-md relative flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-0.5 bg-brand-800 text-white rounded-full text-[10px] font-bold tracking-wide uppercase">
              Recommandé ETI & Multisites
            </span>
            <div>
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Groupes Multisites</span>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">Entreprise</h4>
              <div className="mt-3 text-3xl font-extrabold text-brand-900">
                24 000 <span className="text-sm font-normal text-slate-500">MAD HT / an</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Jusqu'à 5 sites consolidés</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>10 utilisateurs avec rôles RBAC fins</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Scopes 1, 2, 3 (15 catégories GHG Protocol)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Plan de transition & simulations d'économies</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Piste d'audit certifiable ISO 14064</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSelectedPlan('Entreprise');
                setShowQuoteModal(true);
              }}
              className="mt-6 w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow transition"
            >
              Créer un devis Entreprise
            </button>
          </div>

          {/* Offre 3 : Export Europe MACF */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Industrie & Export UE</span>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">Export Europe</h4>
              <div className="mt-3 text-3xl font-extrabold text-slate-900">
                45 000 <span className="text-sm font-normal text-slate-500">MAD HT / an</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Tout le périmètre Entreprise inclus</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Module Régime Définitif MACF 2026</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Codes NC 8 chiffres & suivi des précurseurs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Génération du dossier déclarant importateur UE</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSelectedPlan('Export Europe');
                setShowQuoteModal(true);
              }}
              className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition"
            >
              Créer un devis Export Europe
            </button>
          </div>
        </div>
      </div>

      {/* Historique des Devis Émis */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-bold text-slate-900 text-sm">Historique des Devis Commerciaux</span>
          <span>{quotes.length} devis émis</span>
        </div>

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
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-brand-900">{q.quote_number}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{q.plan_name}</td>
                  <td className="py-3 px-4 font-mono">{(q.total_ttc_mad / 1.20).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 font-mono">{q.tva_amount_mad.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {q.total_ttc_mad.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
                  </td>
                  <td className="py-3 px-4 text-slate-500">{new Date(q.valid_until).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setActiveQuote(q)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold transition flex items-center space-x-1 mx-auto"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Visualiser / Imprimer</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Générateur de Devis */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Établir un Devis Personnalisé (MAD)</h3>
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
                  <option value="Essentiel">Offre Essentiel (12 000 MAD HT / an)</option>
                  <option value="Entreprise">Offre Entreprise (24 000 MAD HT / an)</option>
                  <option value="Export Europe">Offre Export Europe MACF (45 000 MAD HT / an)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sites supplémentaires (+2 000 MAD/site)</label>
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
                  <span>
                    {(
                      (selectedPlan === 'Essentiel' ? 12000 : selectedPlan === 'Entreprise' ? 24000 : 45000) +
                      extraSites * 2000 +
                      extraUsers * 800 -
                      discountMad
                    ).toLocaleString('fr-FR')}{' '}
                    MAD
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TVA légale (20%) :</span>
                  <span>
                    {(
                      ((selectedPlan === 'Essentiel' ? 12000 : selectedPlan === 'Entreprise' ? 24000 : 45000) +
                        extraSites * 2000 +
                        extraUsers * 800 -
                        discountMad) *
                      0.20
                    ).toLocaleString('fr-FR')}{' '}
                    MAD
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                  <span>Total TTC :</span>
                  <span className="text-brand-900">
                    {(
                      ((selectedPlan === 'Essentiel' ? 12000 : selectedPlan === 'Entreprise' ? 24000 : 45000) +
                        extraSites * 2000 +
                        extraUsers * 800 -
                        discountMad) *
                      1.20
                    ).toLocaleString('fr-FR')}{' '}
                    MAD
                  </span>
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
                  Émettre le devis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Devis Imprimable / PDF Preview */}
      {activeQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-xl font-bold text-slate-900">
                  Atlas <span className="text-brand-700">Carbone</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5">SaaS de Comptabilité GES Maroc & MACF</p>
                <p className="text-xs text-slate-400">Casablanca — ICE : 00998877660001</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-brand-900 bg-brand-50 px-2.5 py-1 rounded-md">
                  {activeQuote.quote_number}
                </span>
                <p className="text-xs text-slate-500 mt-1">Date : {new Date(activeQuote.created_at).toLocaleDateString('fr-FR')}</p>
                <p className="text-xs text-slate-500">Valable jusqu'au : {new Date(activeQuote.valid_until).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Destinataire :</span>
              <div className="font-bold text-slate-900 text-sm">Atlas Agro-Alimentaire SARL</div>
              <p className="text-slate-600">Sidi Bernoussi, Casablanca — ICE : 001234567000089</p>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Description du service</th>
                  <th className="py-2.5 px-3 text-right">Montant HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900">{activeQuote.plan_name}</span>
                    <span className="block text-[11px] text-slate-500">Licence annuelle d'utilisation de la plateforme Atlas Carbone</span>
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
              <span>Règlement par virement bancaire sur compte BMCE/Attijariwafa Bank.</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-brand-800 text-white font-semibold rounded-lg hover:bg-brand-900 transition flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
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
