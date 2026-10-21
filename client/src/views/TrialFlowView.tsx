/**
 * Atlas Carbone - Vue Parcours Essai sans Compte & Transfert Sécurisé
 * Conforme aux Sections 2, 8, 9 du Prompt Maître
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Building2,
  Calculator,
  Lock,
  FileText,
  RotateCcw,
  HelpCircle,
  Plus,
  Receipt
} from 'lucide-react';
import { api, setGuestSessionId, setGuestToken, getGuestSessionId, getGuestToken, setStoredToken, setStoredOrgId } from '../api.js';
import { Language, translations, formatNumber } from '../i18n.js';

interface TrialFlowViewProps {
  lang: Language;
  onClaimSuccess: (user: any, organizations: any[]) => void;
  onExitTrial: () => void;
}

export const TrialFlowView: React.FC<TrialFlowViewProps> = ({ lang, onClaimSuccess, onExitTrial }) => {
  const t = translations[lang];

  // État de session
  const [sessionId, setSessionId] = useState<string | null>(getGuestSessionId());
  const [sessionToken, setSessionToken] = useState<string | null>(getGuestToken());
  const [companyName, setCompanyName] = useState('');
  const [selectedSector, setSelectedSector] = useState('textile_confection');
  const [sectorProfiles, setSectorProfiles] = useState<any[]>([]);

  // Données de calcul
  const [activities, setActivities] = useState<any[]>([]);
  const [unquantified, setUnquantified] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalTCO2e: 0, scope1TCO2e: 0, scope2TCO2e: 0, scope3TCO2e: 0 });

  // Saisie active
  const [activeQuestion, setActiveQuestion] = useState<any | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number | ''>('');
  const [inputUnit, setInputUnit] = useState('kWh');
  const [selectedFactorId, setSelectedFactorId] = useState('');
  const [catalogOptions, setCatalogOptions] = useState<any[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Assistant Factures en MAD
  const [billPresets, setBillPresets] = useState<any[]>([]);
  const [showBillHelper, setShowBillHelper] = useState(false);
  const [helperPresetId, setHelperPresetId] = useState('electricite_onee_mt_indus');
  const [helperAmountMad, setHelperAmountMad] = useState('');

  // Modal non-quantifié
  const [showUnqModal, setShowUnqModal] = useState(false);
  const [unqLabel, setUnqLabel] = useState('');
  const [unqReason, setUnqReason] = useState('facteur_manquant');
  const [unqNotes, setUnqNotes] = useState('');

  // Modal Claim (Créer mon compte)
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimName, setClaimName] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimCity, setClaimCity] = useState('Casablanca');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Charger profils sectoriels et options catalogue
  useEffect(() => {
    api.sectors.getQuestionnaires().then(profs => {
      setSectorProfiles(profs);
      if (profs.length > 0 && !activeQuestion) {
        const found = profs.find((p: any) => p.id === selectedSector) || profs[0];
        if (found?.questions?.length > 0) {
          setActiveQuestion(found.questions[0]);
          setInputUnit(found.questions[0].expected_unit);
        }
      }
    }).catch(console.error);

    api.activities.getCatalogOptions().then(opts => {
      setCatalogOptions(opts);
      if (opts.length > 0) setSelectedFactorId(opts[0].id);
    }).catch(console.error);

    api.units.getPresets().then(setBillPresets).catch(console.error);
  }, [selectedSector]);

  // Si une session existait déjà, charger ses données
  useEffect(() => {
    if (sessionId && sessionToken) {
      api.trial.get(sessionId).then(data => {
        setCompanyName(data.company_name);
        setSelectedSector(data.sector);
        setActivities(data.activities || []);
        setUnquantified(data.unquantified || []);
        setSummary(data.summary || {});
      }).catch(() => {
        // Session invalide ou expirée
        setGuestSessionId(null);
        setGuestToken(null);
        setSessionId(null);
        setSessionToken(null);
      });
    }
  }, [sessionId, sessionToken]);

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    try {
      const res = await api.trial.start({
        company_name: companyName.trim(),
        sector: selectedSector
      });
      setSessionId(res.sessionId);
      setSessionToken(res.sessionToken);
      setGuestSessionId(res.sessionId);
      setGuestToken(res.sessionToken);

      // Sélectionner la première question du secteur
      const prof = sectorProfiles.find(p => p.id === selectedSector);
      if (prof?.questions?.length > 0) {
        setActiveQuestion(prof.questions[0]);
        setInputUnit(prof.questions[0].expected_unit);
      }
    } catch (err: any) {
      alert("Erreur démarrage essai: " + err.message);
    }
  };

  const handleCalculateActivity = async () => {
    if (!sessionId || inputQuantity === '' || Number(inputQuantity) <= 0 || !selectedFactorId) {
      setCalcError("Veuillez renseigner une quantité positive et sélectionner une activité.");
      return;
    }
    setCalculating(true);
    setCalcError(null);
    try {
      const label = activeQuestion ? activeQuestion.label_fr : 'Activité déclarée';
      const category = activeQuestion ? activeQuestion.category : 'Énergie';

      const res = await api.trial.calculate(sessionId, {
        category,
        label,
        quantity: Number(inputQuantity),
        unit: inputUnit,
        factor_id: selectedFactorId,
        allowProvisionalScope1: true
      });

      setActivities(prev => [...prev, res.activity]);
      setSummary(res.summary);
      setInputQuantity('');

      // Passer à la question suivante si disponible
      const prof = sectorProfiles.find(p => p.id === selectedSector);
      if (prof?.questions) {
        const currIdx = prof.questions.findIndex((q: any) => q.id === activeQuestion?.id);
        if (currIdx >= 0 && currIdx < prof.questions.length - 1) {
          const nextQ = prof.questions[currIdx + 1];
          setActiveQuestion(nextQ);
          setInputUnit(nextQ.expected_unit);
        }
      }
    } catch (err: any) {
      setCalcError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleAddUnquantified = async () => {
    if (!sessionId || !unqLabel) return;
    try {
      const res = await api.trial.addUnquantified(sessionId, {
        category: activeQuestion?.category || 'Général',
        label: unqLabel,
        reason: unqReason,
        notes: unqNotes
      });
      setUnquantified(res.unquantified);
      setShowUnqModal(false);
      setUnqLabel('');
      setUnqNotes('');
    } catch (err: any) {
      alert("Erreur enregistrement : " + err.message);
    }
  };

  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !sessionToken) return;
    setClaimLoading(true);
    setClaimError(null);
    try {
      const res = await api.trial.claim({
        sessionId,
        sessionToken,
        email: claimEmail,
        password: claimPassword,
        full_name: claimName,
        company_name: companyName,
        city: claimCity
      });

      // Stocker les jetons du nouveau compte permanent
      setStoredToken(res.token);
      setStoredOrgId(res.organization.id);
      setGuestSessionId(null);
      setGuestToken(null);

      onClaimSuccess(res.user, [res.organization]);
    } catch (err: any) {
      setClaimError(err.message);
    } finally {
      setClaimLoading(false);
    }
  };

  const currentProfile = sectorProfiles.find(p => p.id === selectedSector) || sectorProfiles[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Barre supérieure d'avertissement d'essai */}
      <div className="bg-brand-900 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-brand-800 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="font-semibold">{t.trialClaimBanner}</span>
        </div>
        <div className="flex items-center space-x-3">
          {sessionId && (
            <button
              onClick={() => setShowClaimModal(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-3 py-1 rounded-lg transition shadow-sm"
            >
              {t.trialBtnClaim}
            </button>
          )}
          <button
            onClick={onExitTrial}
            className="text-slate-300 hover:text-white underline text-xs"
          >
            Quitter l’essai
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-8">
        {!sessionId ? (
          /* Étape 1 : Initialisation de l'essai */
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-900 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-brand-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {t.trialModalTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {t.trialModalDesc}
              </p>
            </div>

            <form onSubmit={handleStartTrial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.trialCompanyName} *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="ex: Atlas Textile Maroc SARL"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.trialSector} *
                </label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-700 outline-none bg-white"
                >
                  {sectorProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === 'en' ? p.name_en : p.name_fr}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Le secteur personnalise automatiquement les questions de terrain pour votre activité.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center space-x-2"
                >
                  <span>{t.trialBtnStart}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Étape 2 & 3 : Questionnaire interactif, calculs réels et rapport */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne gauche : Questionnaire sectoriel guidé */}
            <div className="lg:col-span-2 space-y-6">
              {/* Carte de progression */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-700 uppercase">
                    Session d’essai active • {companyName}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Secteur : {currentProfile ? (lang === 'en' ? currentProfile.name_en : currentProfile.name_fr) : selectedSector}
                  </p>
                </div>
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="px-3.5 py-1.5 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Enregistrer mon compte</span>
                </button>
              </div>

              {/* Formulaire de saisie pour la question active */}
              {activeQuestion && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold">
                      Scope {activeQuestion.scope} • {activeQuestion.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">
                      {lang === 'en' ? activeQuestion.label_en : activeQuestion.label_fr}
                    </h3>
                  </div>

                  {/* Explications pédagogiques contextualisées */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <p className="font-bold text-slate-700">Pourquoi cette donnée est demandée ?</p>
                      <p className="text-slate-500 mt-0.5">
                        {lang === 'en' ? activeQuestion.why_asked_en : activeQuestion.why_asked_fr}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <p className="font-bold text-slate-700">Où trouver l'information ?</p>
                      <p className="text-slate-500 mt-0.5">
                        {lang === 'en' ? activeQuestion.where_to_find_en : activeQuestion.where_to_find_fr}
                      </p>
                    </div>
                  </div>

                  {/* Exemple clairement fictif */}
                  <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl text-xs text-emerald-900">
                    <span className="font-bold">Exemple de terrain : </span>
                    {lang === 'en' ? activeQuestion.example_fictif_en : activeQuestion.example_fictif_fr}
                  </div>

                  {/* Mode de saisie ergonomique : Direct Physique vs Facture en Dirhams */}
                  <div className="space-y-4 pt-1">
                    <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setShowBillHelper(false)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                          !showBillHelper
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Quantité physique directe ({inputUnit})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBillHelper(true)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                          showBillHelper
                            ? 'bg-emerald-800 text-white shadow-sm'
                            : 'text-emerald-900 hover:text-emerald-950'
                        }`}
                      >
                        <Receipt className="w-3.5 h-3.5 text-amber-300" />
                        <span>Depuis facture en Dirhams (MAD)</span>
                      </button>
                    </div>

                    {showBillHelper ? (
                      /* Saisie Assistée Facture en Dirhams (MAD) */
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-4 text-xs">
                        <div className="flex items-start space-x-2 text-emerald-950 font-bold">
                          <Receipt className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                          <div>
                            <span>Conversion automatique Facture ONEE / Carburant en volume certifié</span>
                            <p className="text-[11px] text-slate-600 font-normal mt-0.5">
                              Saisissez le montant en Dirhams marocains. Atlas Carbone déduit la quantité physique correspondante selon les barèmes nationaux officiels.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Type de facture / Barème national</label>
                            <select
                              value={helperPresetId}
                              onChange={e => setHelperPresetId(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium focus:border-emerald-600 outline-none"
                            >
                              {billPresets.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.unitPriceMad} MAD/{p.physicalUnit})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block font-bold text-slate-700 text-[11px]">Montant en Dirhams (MAD) *</label>
                              <div className="flex space-x-1">
                                {[5000, 15000, 50000].map(amt => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setHelperAmountMad(amt.toString())}
                                    className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-mono hover:bg-slate-50"
                                  >
                                    {amt / 1000}k
                                  </button>
                                ))}
                              </div>
                            </div>
                            <input
                              type="number"
                              step="any"
                              placeholder="Ex: 15000"
                              value={helperAmountMad}
                              onChange={e => setHelperAmountMad(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 bg-white text-xs focus:border-emerald-600 outline-none shadow-sm"
                            />
                          </div>
                        </div>

                        {(() => {
                          const p = billPresets.find((x: any) => x.id === helperPresetId) || billPresets[0];
                          const amt = parseFloat(helperAmountMad) || 0;
                          const derived = p && p.unitPriceMad > 0 ? amt / p.unitPriceMad : 0;

                          if (amt <= 0) return null;

                          return (
                            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                              <div>
                                <span className="text-slate-500 text-[11px]">Consommation physique équivalente : </span>
                                <div className="font-mono font-black text-emerald-950 text-base">
                                  {derived.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {p?.physicalUnit}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {amt.toLocaleString('fr-FR')} MAD ÷ {p.unitPriceMad} MAD/{p.physicalUnit}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setInputQuantity(parseFloat(derived.toFixed(2)));
                                  if (p?.physicalUnit) setInputUnit(p.physicalUnit);
                                  if (p?.factorId) setSelectedFactorId(p.factorId);
                                }}
                                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center space-x-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Valider cette quantité</span>
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}

                    {/* Champs de saisie physique */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Quantité physique consommée *
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={inputQuantity}
                          onChange={(e) => setInputQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder={`ex: 15000`}
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none font-mono font-semibold text-slate-900 bg-white shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Unité attendue
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={inputUnit}
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 bg-slate-100 font-bold text-slate-700 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Activité correspondante / Barème officiel homologué
                      </label>
                      <select
                        value={selectedFactorId}
                        onChange={(e) => setSelectedFactorId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none bg-white font-medium shadow-sm"
                      >
                        {catalogOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label} (en {opt.expected_unit})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-emerald-800 inline shrink-0" />
                        <span>Calcul certifié déterministe sur le serveur selon le Bilan Carbone® Maroc.</span>
                      </p>
                    </div>

                    {calcError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                        {calcError}
                      </div>
                    )}

                    {/* Actions de validation avec distinction claire de l'inquantifié */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setUnqLabel(activeQuestion.label_fr);
                          setShowUnqModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition flex items-center justify-center space-x-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Donnée non disponible ? Déclarer non quantifié</span>
                      </button>

                      <button
                        type="button"
                        disabled={calculating}
                        onClick={handleCalculateActivity}
                        className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5"
                      >
                        <Calculator className="w-4 h-4" />
                        <span>{calculating ? 'Calcul en cours...' : 'Calculer et valider'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des activités déjà enregistrées dans l'essai */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  Activités calculées dans cette session ({activities.length})
                </h4>

                {activities.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Aucune activité enregistrée pour le moment.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activities.map((a, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">
                            [S{a.scope}] {a.label}
                          </span>
                          <p className="text-slate-500 text-[11px]">
                            {formatNumber(a.quantity, 2, lang)} {a.unit} • {a.factor_name}
                          </p>
                        </div>
                        <div className="text-right font-mono font-bold text-emerald-900">
                          {formatNumber(a.emission_t_co2e, 3, lang)} tCO₂e
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Liste des postes non quantifiés */}
              {unquantified.length > 0 && (
                <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 space-y-2">
                  <h4 className="font-bold text-xs text-amber-900 uppercase">
                    Postes identifiés, non quantifiés ({unquantified.length})
                  </h4>
                  <div className="divide-y divide-amber-200/60">
                    {unquantified.map((u, i) => (
                      <div key={i} className="py-2 text-xs flex justify-between items-center text-amber-900">
                        <span>{u.label}</span>
                        <span className="italic text-[11px] text-amber-700">{u.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite : Synthèse en direct & Téléchargement du Rapport */}
            <div className="space-y-6">
              {/* Carte Synthèse & Complétude */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Synthèse de l'Évaluation
                  </h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                    {activities.length} poste(s) actif(s)
                  </span>
                </div>

                {/* Jauge de Complétude Honnête */}
                {(() => {
                  const totalQuestions = currentProfile?.questions?.length || 5;
                  const completedCount = activities.length + unquantified.length;
                  const pct = Math.min(100, Math.round((completedCount / totalQuestions) * 100));

                  return (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">Complétude du Bilan</span>
                        <span className="font-mono font-bold text-emerald-900">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-emerald-700 h-2 transition-all duration-500"
                          style={{ width: `${Math.min(100, (activities.length / totalQuestions) * 100)}%` }}
                          title={`${activities.length} quantifié(s)`}
                        />
                        <div
                          className="bg-amber-400 h-2 transition-all duration-500"
                          style={{ width: `${Math.min(100 - (activities.length / totalQuestions) * 100, (unquantified.length / totalQuestions) * 100)}%` }}
                          title={`${unquantified.length} non quantifié(s)`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{activities.length} quantifié(s)</span>
                        <span>{unquantified.length} sans facteur</span>
                        <span>{Math.max(0, totalQuestions - completedCount)} restant(s)</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white space-y-1 shadow-sm">
                  <span className="text-[11px] text-emerald-200 font-bold uppercase">Émissions Totales Déclarables</span>
                  <div className="text-2xl font-extrabold text-white">
                    {formatNumber(summary.totalTCO2e, 3, lang)} <span className="text-sm font-normal text-emerald-200">tCO₂e</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Intervalle (95%) : [{formatNumber(summary.uncertaintyMinTCO2e, 2, lang)} ; {formatNumber(summary.uncertaintyMaxTCO2e, 2, lang)}] tCO₂e
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">Scope 1 (Direct) :</span>
                    <span className="font-bold text-slate-900">{formatNumber(summary.scope1TCO2e, 3, lang)} t</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">Scope 2 (Électricité ONEE) :</span>
                    <span className="font-bold text-slate-900">{formatNumber(summary.scope2TCO2e, 3, lang)} t</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">Scope 3 (Amont / Logistique) :</span>
                    <span className="font-bold text-slate-900">{formatNumber(summary.scope3TCO2e, 3, lang)} t</span>
                  </div>
                </div>

                {/* Télécharger le PDF préliminaire */}
                <div className="pt-2">
                  <a
                    href={api.trial.getPdfUrl(sessionId, lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4 text-emerald-200" />
                    <span>Télécharger le Rapport Officiel (PDF)</span>
                  </a>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Rapport bilingue avec mentions d'incertitude et postes non quantifiés.
                  </p>
                </div>

                {/* Bouton de sauvegarde définitive */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Créer mon compte et conserver mon bilan</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1.5">
                    Garantie zéro ressaisie : vos données restent strictement confidentielles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Déclarer un poste non quantifié */}
      {showUnqModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">
              Déclarer un poste identifié, non quantifié
            </h3>
            <p className="text-xs text-slate-500">
              Règle de rigueur : Aucune émission avérée ne reçoit la valeur 0 par défaut. Le poste figurera dans votre rapport avec son motif.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Désignation de l'activité</label>
                <input
                  type="text"
                  value={unqLabel}
                  onChange={(e) => setUnqLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif</label>
                <select
                  value={unqReason}
                  onChange={(e) => setUnqReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white"
                >
                  <option value="Poste identifié, non quantifié : facteur disponible insuffisant">
                    Facteur d'émission disponible insuffisant dans le classeur
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
                <label className="block font-bold text-slate-700 mb-1">Notes et justification</label>
                <textarea
                  rows={2}
                  value={unqNotes}
                  onChange={(e) => setUnqNotes(e.target.value)}
                  placeholder="ex: Factures de gaz du sous-traitant en cours de demande"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowUnqModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleAddUnquantified}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Enregistrer le poste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Créer mon compte et conserver mon bilan */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {t.trialClaimTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.trialClaimDesc}
              </p>
            </div>

            <form onSubmit={handleClaimAccount} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.trialFullName} *</label>
                <input
                  type="text"
                  required
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  placeholder="ex: Tariq Benali"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.trialEmail} *</label>
                <input
                  type="email"
                  required
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                  placeholder="tariq@votre-entreprise.ma"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.trialPassword} *</label>
                <input
                  type="password"
                  required
                  value={claimPassword}
                  onChange={(e) => setClaimPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.trialCity}</label>
                <input
                  type="text"
                  value={claimCity}
                  onChange={(e) => setClaimCity(e.target.value)}
                  placeholder="Casablanca"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>

              {claimError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                  {claimError}
                </div>
              )}

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={claimLoading}
                  className="px-5 py-2 bg-brand-800 hover:bg-brand-900 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition"
                >
                  {claimLoading ? 'Migration en cours...' : t.trialBtnConfirmClaim}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
