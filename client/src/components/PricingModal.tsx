/**
 * Atlas Carbone - Modal de Souscription, Tarification & Monétisation en Dirhams Marocains (MAD)
 * Conforme à AGENTS.md :
 * - Tarification officielle en MAD exclusive.
 * - Respect des coordonnées officielles (Abdelaziz Motiaa).
 * - Prise en charge du virement bancaire proforma avec RIB marocain et paiement CMI.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Building,
  Building2,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Printer,
  Copy,
  Lock,
  Zap,
  Phone,
  Mail,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { api, setStoredToken, setStoredOrgId } from '../api.js';
import { Language } from '../i18n.js';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  isPaywallExpired?: boolean;
  guestSessionId?: string | null;
  guestCompanyName?: string;
  onSubscriptionSuccess?: (user: any, organizations: any[]) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  lang,
  isPaywallExpired = false,
  guestSessionId = null,
  guestCompanyName = '',
  onSubscriptionSuccess
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [banking, setBanking] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('entreprise_macf');
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [step, setStep] = useState<'plans' | 'checkout' | 'confirmation'>('plans');

  // Formulaire de commande
  const [companyName, setCompanyName] = useState(guestCompanyName || '');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [iceNumber, setIceNumber] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [password, setPassword] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cmi_card' | 'bank_transfer' | 'quote'>('bank_transfer');

  // État carte CMI
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [copiedRib, setCopiedRib] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.pricing.getPlans()
        .then(res => {
          setPlans(res.plans);
          setBanking(res.banking);
        })
        .catch(console.error);

      if (guestCompanyName) {
        setCompanyName(guestCompanyName);
      }
    }
  }, [isOpen, guestCompanyName]);

  if (!isOpen) return null;

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans.find(p => p.id === 'entreprise_macf') || plans[0];
  const priceHT = selectedPlan
    ? (billingCycle === 'monthly' ? selectedPlan.priceMADMonthHT : selectedPlan.priceMADYearHT)
    : 0;
  const tvaAmount = priceHT * 0.20;
  const totalTTC = priceHT + tvaAmount;

  const handleProceedToCheckout = (planId: string) => {
    setSelectedPlanId(planId);
    setStep('checkout');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactName || !email) {
      alert("Veuillez renseigner la raison sociale, votre nom et votre adresse email.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await api.pricing.checkout({
        planId: selectedPlanId,
        companyName,
        contactName,
        email,
        phone,
        iceNumber,
        city,
        billingCycle,
        paymentMethod,
        guestSessionId,
        password: password || undefined
      });

      setOrderResult(result);
      setStep('confirmation');

      if (result.authResult && onSubscriptionSuccess) {
        setStoredToken(result.authResult.token);
        setStoredOrgId(result.authResult.organization.id);
        onSubscriptionSuccess(result.authResult.user, [result.authResult.organization]);
      }
    } catch (err: any) {
      alert("Erreur lors de la commande : " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyRib = () => {
    if (banking?.rib) {
      navigator.clipboard.writeText(banking.rib);
      setCopiedRib(true);
      setTimeout(() => setCopiedRib(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête du modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-extrabold text-white">
                  {lang === 'en' ? 'Atlas Carbone Plans & Subscriptions' : 'Offres & Souscriptions Atlas Carbone'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  MAD (Dirhams)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {lang === 'en'
                  ? 'Official Moroccan Pricing • ISO 14064-1 & EU CBAM Compliance'
                  : 'Tarifs officiels en Dirhams Marocains • Conformité ISO 14064-1 & MACF Europe'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerte si Paywall 3 Heures Écoulées */}
        {isPaywallExpired && (
          <div className="bg-amber-500/10 border-b border-amber-200 px-6 py-3 flex items-start space-x-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs text-amber-950">
              <strong className="font-extrabold block text-sm text-amber-900">
                {lang === 'en' ? 'Demo Evaluation Window Expired (3 Hours)' : 'Période d’évaluation démo terminée (3 heures)'}
              </strong>
              <span>
                {lang === 'en'
                  ? 'Your preliminary activity data is safely preserved. To unlock unlimited calculations and export official ISO/CBAM reports, choose an annual subscription in Moroccan Dirhams.'
                  : 'Vos activités et calculs préliminaires sont conservés en toute sécurité. Pour poursuivre vos bilans et débloquer les rapports officiels immuables, choisissez une offre annuelle en Dirhams.'}
              </span>
            </div>
          </div>
        )}

        {/* Corps principal défilable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/60">
          {step === 'plans' && (
            <div className="space-y-6">
              {/* Basculeur de cycle de facturation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {lang === 'en' ? 'Select your billing frequency' : 'Choisissez votre rythme de facturation :'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {lang === 'en'
                      ? 'Annual billing includes 2 months free and priority onboarding.'
                      : 'La souscription annuelle inclut 2 mois offerts et l’assistance prioritaire.'}
                  </p>
                </div>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
                      billingCycle === 'annual'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{lang === 'en' ? 'Annual (Best Value)' : 'Annuel (-20% Offert)'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500 text-slate-950 font-black">
                      2 MOIS
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-2 rounded-lg transition ${
                      billingCycle === 'monthly'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'en' ? 'Monthly' : 'Mensuel'}
                  </button>
                </div>
              </div>

              {/* Grille des 4 offres en MAD */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {plans.map((p) => {
                  const isPop = p.popular || p.id === 'entreprise_macf';
                  const price = billingCycle === 'monthly' ? p.priceMADMonthHT : p.priceMADYearHT;
                  const isFree = price === 0;

                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl p-5 border flex flex-col justify-between transition relative ${
                        isPop
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-lg'
                          : 'border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      {isPop && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                          {p.badge || 'Recommandé'}
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {p.limits.scopes}
                          </span>
                          <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{p.name}</h4>
                          <p className="text-xs text-slate-600 mt-1 min-h-[38px] leading-relaxed">
                            {lang === 'en' ? p.descriptionEn : p.description}
                          </p>
                        </div>

                        {/* Affichage du Tarif en MAD */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          {isFree ? (
                            <div>
                              <div className="text-2xl font-black text-slate-900 font-mono">0 MAD</div>
                              <span className="text-[10px] text-slate-500">
                                {lang === 'en' ? '3 Hours discovery demo' : '3 Heures d’accès découverte'}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline space-x-1">
                                <span className="text-2xl font-black text-slate-900 font-mono">
                                  {price.toLocaleString('fr-FR')}
                                </span>
                                <span className="text-xs font-bold text-slate-600">MAD HT</span>
                                <span className="text-[10px] text-slate-500">
                                  /{billingCycle === 'monthly' ? 'mois' : 'an'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Soit {((price * 1.20)).toLocaleString('fr-FR')} MAD TTC (TVA 20%)
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Liste des fonctionnalités */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                          {(lang === 'en' ? p.featuresEn : p.featuresFr).map((feat: string, idx: number) => (
                            <div key={idx} className="flex items-start space-x-2 text-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span className="text-[11px] leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-5 mt-4 border-t border-slate-100">
                        {isFree ? (
                          <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
                          >
                            {lang === 'en' ? 'Continue Free Trial' : 'Continuer l’essai gratuit'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleProceedToCheckout(p.id)}
                            className={`w-full py-2.5 font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 ${
                              isPop
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <span>{lang === 'en' ? 'Choose this plan' : 'Souscrire en MAD'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rassurance institutionnelle marocaine */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Facturation marocaine conforme :</strong> Émission automatique de facture avec ICE, RC, IF et mention légale de TVA à 20%. Règlements acceptés par virement bancaire et carte bancaire CMI.
                  </span>
                </div>
                <div className="shrink-0 font-medium text-slate-700">
                  Support : <a href="mailto:abdelaziz.motiaa@gmail.com" className="text-brand-800 font-bold underline">Abdelaziz Motiaa</a> (+212 671 58 11 67)
                </div>
              </div>
            </div>
          )}

          {step === 'checkout' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Bouton retour */}
              <button
                type="button"
                onClick={() => setStep('plans')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
              >
                <span>← {lang === 'en' ? 'Change Plan' : 'Changer d’offre'}</span>
              </button>

              {/* Résumé de l'offre choisie */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-900 uppercase">
                    {selectedPlan?.badge || 'Offre Professionnelle'}
                  </span>
                  <h4 className="text-lg font-extrabold text-slate-900 mt-1">{selectedPlan?.name}</h4>
                  <p className="text-xs text-slate-500">
                    Facturation {billingCycle === 'annual' ? 'annuelle (12 mois)' : 'mensuelle'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {totalTTC.toLocaleString('fr-FR')} MAD
                  </div>
                  <span className="text-[10px] text-slate-500">
                    TTC (dont {(tvaAmount).toLocaleString('fr-FR')} MAD TVA)
                  </span>
                </div>
              </div>

              {/* Formulaire de souscription */}
              <form onSubmit={handleSubmitOrder} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>1. Coordonnées de votre Entreprise au Maroc</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Raison sociale / Société *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="Ex: Atlas Confection SARL"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Identifiant Commun de l'Entreprise (ICE)</label>
                    <input
                      type="text"
                      value={iceNumber}
                      onChange={e => setIceNumber(e.target.value)}
                      placeholder="Ex: 002345678000045"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nom du responsable *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="M. Karim Tazi"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email professionnel *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="contact@societe.ma"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Téléphone mobile / fixe</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+212 6 XX XX XX XX"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ville du siège *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Casablanca, Tanger, Agadir..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mot de passe d’accès {guestSessionId ? '(pour lier vos données)' : ''}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Choix du mode de paiement */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>2. Mode de Règlement Sécurisé en Dirhams (MAD)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label
                      className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="payMethod"
                          checked={paymentMethod === 'bank_transfer'}
                          onChange={() => setPaymentMethod('bank_transfer')}
                          className="text-emerald-600"
                        />
                        <span className="font-bold text-slate-900">Virement Bancaire</span>
                      </div>
                      <span className="text-[11px] text-slate-600 mt-2">
                        Bon de commande immédiat & RIB officiel marocain
                      </span>
                    </label>

                    <label
                      className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                        paymentMethod === 'cmi_card'
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="payMethod"
                          checked={paymentMethod === 'cmi_card'}
                          onChange={() => setPaymentMethod('cmi_card')}
                          className="text-emerald-600"
                        />
                        <span className="font-bold text-slate-900">Carte Bancaire CMI</span>
                      </div>
                      <span className="text-[11px] text-slate-600 mt-2">
                        Paiement sécurisé CMI & activation immédiate
                      </span>
                    </label>

                    <label
                      className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                        paymentMethod === 'quote'
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="payMethod"
                          checked={paymentMethod === 'quote'}
                          onChange={() => setPaymentMethod('quote')}
                          className="text-emerald-600"
                        />
                        <span className="font-bold text-slate-900">Devis / Marché Public</span>
                      </div>
                      <span className="text-[11px] text-slate-600 mt-2">
                        Devis proforma personnalisé sous 24h
                      </span>
                    </label>
                  </div>

                  {/* Saisie carte si CMI */}
                  {paymentMethod === 'cmi_card' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mt-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Passerelle CMI (Centre Monétique Interbancaire)</span>
                        <div className="flex space-x-1.5 text-[10px] font-bold text-slate-500">
                          <span className="px-1.5 py-0.5 bg-white border rounded">VISA</span>
                          <span className="px-1.5 py-0.5 bg-white border rounded">Mastercard</span>
                          <span className="px-1.5 py-0.5 bg-white border rounded">CMI</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Numéro de carte</label>
                        <input
                          type="text"
                          required={paymentMethod === 'cmi_card'}
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value)}
                          placeholder="4000 1234 5678 9010"
                          maxLength={19}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Expiration</label>
                          <input
                            type="text"
                            required={paymentMethod === 'cmi_card'}
                            value={cardExpiry}
                            onChange={e => setCardExpiry(e.target.value)}
                            placeholder="MM/AA"
                            maxLength={5}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">CVV (3 chiffres)</label>
                          <input
                            type="password"
                            required={paymentMethod === 'cmi_card'}
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value)}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Total TTC à régler : <strong className="text-slate-900 font-mono">{totalTTC.toLocaleString('fr-FR')} MAD</strong>
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
                  >
                    {isProcessing ? (
                      <span>Traitement de la commande...</span>
                    ) : (
                      <>
                        <span>Confirmer & Générer mon Bon de Commande</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'confirmation' && orderResult && (
            <div className="max-w-2xl mx-auto space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                  {orderResult.paymentStatus === 'paid' ? 'Abonnement Activé' : 'Bon de Commande Émis'}
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Merci pour votre confiance !
                </h3>
                <p className="text-xs text-slate-600 max-w-lg mx-auto">
                  Votre commande pour le <strong>{orderResult.planName}</strong> a été enregistrée avec succès sous la référence officielle{' '}
                  <strong className="text-slate-900 font-mono">{orderResult.orderNumber}</strong>.
                </p>
              </div>

              {/* Encadré Détails du Bon de Commande & RIB Marocain */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Réf. Document Officiel</span>
                    <div className="text-base font-extrabold text-slate-900 font-mono">{orderResult.orderNumber}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Montant Total TTC</span>
                    <div className="text-lg font-black text-emerald-900 font-mono">
                      {orderResult.totalTTC.toLocaleString('fr-FR')} MAD
                    </div>
                  </div>
                </div>

                {orderResult.paymentStatus !== 'paid' && (
                  <div className="space-y-3 pt-2">
                    <h5 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                      <Building className="w-4 h-4 text-emerald-700" />
                      <span>Coordonnées bancaires pour le virement (Royaume du Maroc) :</span>
                    </h5>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bénéficiaire :</span>
                        <strong className="text-slate-900">{banking?.beneficiaire || 'ATLAS CARBONE S.A.R.L.'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Banque :</span>
                        <strong className="text-slate-900">{banking?.banque || 'Attijariwafa bank / Banque Populaire'}</strong>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase font-bold">RIB (24 Chiffres) :</span>
                          <span className="font-mono font-bold text-slate-900 tracking-wider">
                            {banking?.rib || '007 780 0001234567890123 45'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyRib}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedRib ? 'Copié !' : 'Copier'}</span>
                        </button>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Motif de virement à indiquer :</span>
                        <strong className="text-emerald-800 font-mono">{orderResult.orderNumber} - {companyName}</strong>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Transmettez l’ordre de virement cacheté à{' '}
                      <a href="mailto:abdelaziz.motiaa@gmail.com" className="font-bold text-brand-800 underline">
                        abdelaziz.motiaa@gmail.com
                      </a>{' '}
                      pour déblocage prioritaire sous 2 heures.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Fermer & Accéder à mon Espace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
