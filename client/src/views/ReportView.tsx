/**
 * Atlas Carbone - Vue Rapport Officiel d'Inventaire GES & Annexe Méthodologique
 * Conforme aux standards ISO 14064-1:2018 et GHG Protocol Corporate Standard
 * Génération PDF serveur bilingue et traçabilité des postes non quantifiés
 */

import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Calendar,
  Leaf,
  Lock,
  FileSpreadsheet,
  BookOpen,
  Info,
  AlertTriangle,
  History,
  FileText
} from 'lucide-react';
import { OverviewData } from '../types.js';
import { api } from '../api.js';
import { Language, translations, formatNumber, formatDate } from '../i18n.js';

interface ReportViewProps {
  data: OverviewData | null;
  orgName: string;
  currentOrgId: string;
  lang?: Language;
}

export const ReportView: React.FC<ReportViewProps> = ({
  data,
  orgName,
  currentOrgId,
  lang = 'fr'
}) => {
  const t = translations[lang];

  // État Annexe Méthodologique
  const [showAnnex, setShowAnnex] = useState(false);
  const [annexData, setAnnexData] = useState<any | null>(null);
  const [annexLoading, setAnnexLoading] = useState(false);

  // État Postes Non Quantifiés
  const [unquantified, setUnquantified] = useState<any[]>([]);

  // État Revue de Dossier
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewState, setReviewState] = useState('ready_for_review');
  const [reviewComment, setReviewComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const periodId = data?.period?.id;

  useEffect(() => {
    if (currentOrgId && periodId) {
      api.activities.listUnquantified(currentOrgId, periodId)
        .then(setUnquantified)
        .catch(console.error);

      api.periods.getReviews(currentOrgId, periodId)
        .then(setReviews)
        .catch(console.error);
    }
  }, [currentOrgId, periodId]);

  if (!data || !data.period) {
    return <div className="p-8 text-center text-slate-400">Aucun inventaire disponible.</div>;
  }

  const { period, summary, byScope, byCategory, bySite, uncertainty } = data;
  const isClosed = period.status === 'closed';

  const handleOpenAnnex = async () => {
    setShowAnnex(true);
    setAnnexLoading(true);
    try {
      const res = await api.periods.getMethodologicalAnnex(currentOrgId, period.id);
      setAnnexData(res);
    } catch (err: any) {
      alert("Erreur annexe méthodologique: " + err.message);
    } finally {
      setAnnexLoading(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReview(true);
    try {
      await api.periods.addReview(currentOrgId, period.id, {
        status: reviewState,
        comment: reviewComment
      });
      alert("Statut de revue mis à jour avec succès.");
      setReviewComment('');
      const updated = await api.periods.getReviews(currentOrgId, period.id);
      setReviews(updated);
    } catch (err: any) {
      alert("Erreur revue: " + err.message);
    } finally {
      setSavingReview(false);
    }
  };

  const exportCsv = () => {
    let csv = "Catégorie;Scope;Émissions_tCO2e;Part_Pourcentage\n";
    byCategory.forEach(c => {
      const pct = summary.totalTCO2e > 0 ? (c.tco2e / summary.totalTCO2e) * 100 : 0;
      csv += `"${c.label}";${c.scope};${c.tco2e.toFixed(3)};${pct.toFixed(1)}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rapport_GES_${orgName.replace(/\s+/g, '_')}_${period.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Barre d'action supérieure */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              {t.repTitle}
            </h2>
            <p className="text-xs text-slate-500">
              Conforme ISO 14064-1:2018 & GHG Protocol Corporate Standard • {orgName} ({period.year})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAnnex}
            className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.repBtnMethodAnnex}</span>
          </button>

          <button
            onClick={exportCsv}
            className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Exporter CSV</span>
          </button>

          {/* Téléchargement PDF Serveur Officiel - Bouton Primaire Incontournable */}
          <a
            href={api.periods.getPdfUrl(currentOrgId, period.id, lang)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>{t.repBtnDownloadPdf}</span>
          </a>
        </div>
      </div>

      {/* Jauge de Complétude Réelle & Intégrité Méthodologique */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-950 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Complétude Méthodologique de l'Inventaire ({period.year})</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed max-w-xl">
            Atlas Carbone garantit une comptabilité rigoureuse : {byCategory.length} catégorie(s) quantifiée(s) avec facteurs souverains homologués, et {unquantified.length} poste(s) identifié(s) non quantifié(s). Aucun poste manquant n’a été assimilé à 0.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Qualité d'audit</span>
            <span className="font-mono font-bold text-emerald-900 text-sm">±{uncertainty.uncertaintyRelativePct.toFixed(1)}% incertitude</span>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 font-bold text-emerald-900 text-xs shadow-sm">
            {unquantified.length === 0 ? '100% Quantifié' : `${unquantified.length} Réserve(s) Traçable(s)`}
          </span>
        </div>
      </div>

      {/* Document Imprimable Officiel */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-md space-y-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* En-tête du document */}
        <div className="flex justify-between items-start border-b-2 border-emerald-900 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold text-slate-900">
                Atlas <span className="text-emerald-800">Carbone</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                Rapport R-{period.year}-V1
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Système Déterministe de Comptabilité Carbone selon ISO 14064-1:2018 & GHG Protocol
            </p>
          </div>

          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${
                isClosed
                  ? 'bg-slate-900 text-white'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {isClosed ? <Lock className="w-3 h-3 mr-1" /> : null}
              <span>{isClosed ? 'Inventaire Clôturé & Immuable' : 'Inventaire en cours de revue'}</span>
            </span>
            <p className="text-xs text-slate-400 mt-1">Édité le {formatDate(new Date().toISOString(), lang)}</p>
          </div>
        </div>

        {/* Identification de l'Organisation et Périmètre */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Organisation Déclarée :</span>
            <div className="text-base font-bold text-slate-900">{orgName}</div>
            <p className="text-slate-600 mt-0.5">Royaume du Maroc</p>
            <p className="text-slate-500 mt-1">Sites audités : {bySite.map(s => s.name).join(', ') || 'Site principal'}</p>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Méthode de Consolidation :</span>
            <div className="font-bold text-slate-800">
              {period.consolidation_approach === 'operational_control'
                ? 'Contrôle Opérationnel (100% des émissions des sites sous gestion)'
                : period.consolidation_approach}
            </div>
            <p className="text-slate-500 mt-1">Période : {period.start_date} au {period.end_date}</p>
          </div>
        </div>

        {/* Cartouches des Scopes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-sm">
            <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">Émissions Totales</span>
            <div className="text-2xl font-extrabold mt-1 text-white">{formatNumber(summary.totalTCO2e, 3, lang)}</div>
            <span className="text-xs text-emerald-200">tCO₂e</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Scope 1 (Direct)</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatNumber(summary.scope1TCO2e, 3, lang)}</div>
            <span className="text-xs text-slate-500">tCO₂e</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Scope 2 (ONEE)</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatNumber(summary.scope2TCO2e, 3, lang)}</div>
            <span className="text-xs text-slate-500">tCO₂e (Location-based)</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Scope 3 (Chaîne valeur)</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatNumber(summary.scope3TCO2e, 3, lang)}</div>
            <span className="text-xs text-slate-500">tCO₂e</span>
          </div>
        </div>

        {/* Incertitude & CO2 Biogénique */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="font-bold text-slate-800">Intervalle d’incertitude statistique (95%) : </span>
            <span>[{formatNumber(uncertainty.minKg / 1000.0, 2, lang)} ; {formatNumber(uncertainty.maxKg / 1000.0, 2, lang)}] tCO₂e (± {formatNumber(uncertainty.uncertaintyRelativePct, 1, lang)}%)</span>
          </div>
          <div>
            <span className="font-bold text-slate-800">CO₂ biogénique : </span>
            <span>{formatNumber(summary.biogenicTCO2e, 3, lang)} tCO₂e (présenté séparément)</span>
          </div>
        </div>

        {/* Tableau détaillé des Catégories ISO 14064 */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
            Ventilation par Catégorie d'Émission
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[480px]">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Poste / Catégorie</th>
                  <th className="py-2.5 px-3">Scope</th>
                  <th className="py-2.5 px-4 text-right">Émissions (tCO₂e)</th>
                  <th className="py-2.5 px-4 text-right">Part (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byCategory.map((c, i) => {
                  const pct = summary.totalTCO2e > 0 ? (c.tco2e / summary.totalTCO2e) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-medium text-slate-900">{c.label}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          S{c.scope}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-slate-800">
                        {formatNumber(c.tco2e, 3, lang)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-500">
                        {formatNumber(pct, 1, lang)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section Postes Identifiés, Non Quantifiés */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Postes Identifiés, Non Quantifiés ({unquantified.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Règle de rigueur méthodologique : Ces activités ont été relevées mais n'ont pas pu être quantifiées avec certitude en l'absence de facteur validé ou de relevé physique exploitable. Aucune valeur zéro n'a été affectée.
          </p>

          {unquantified.length === 0 ? (
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-400 italic">
              Aucun poste non quantifié déclaré sur le périmètre actuel.
            </div>
          ) : (
            <div className="border border-amber-200 rounded-xl overflow-x-auto bg-amber-50/50">
              <table className="w-full text-left text-xs min-w-[480px]">
                <thead className="bg-amber-100/70 text-amber-900 font-bold border-b border-amber-200">
                  <tr>
                    <th className="py-2 px-4">Poste / Flux</th>
                    <th className="py-2 px-4">Catégorie</th>
                    <th className="py-2 px-4">Motif de non-quantification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200/60">
                  {unquantified.map((u, i) => (
                    <tr key={i}>
                      <td className="py-2 px-4 font-bold text-slate-900">{u.label}</td>
                      <td className="py-2 px-4 text-slate-600">{u.category}</td>
                      <td className="py-2 px-4 text-amber-800 italic">{u.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Historique de Revue & Gouvernance */}
        <div className="border-t border-slate-200 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <History className="w-4 h-4 text-brand-800" />
              <span>Contrôle Interne et Revue du Dossier</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Statut : {period.status}
            </span>
          </div>

          {/* Formulaire de mise à jour de statut */}
          <form onSubmit={handleAddReview} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 no-print">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mettre à jour l'état de l'inventaire</label>
                <select
                  value={reviewState}
                  onChange={(e) => setReviewState(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white outline-none"
                >
                  <option value="draft">Brouillon en cours (draft)</option>
                  <option value="to_complete">À compléter (données manquantes)</option>
                  <option value="ready_for_review">Prêt pour revue interne</option>
                  <option value="reviewed_internal">Revu en interne (validé)</option>
                  <option value="locked">Verrouillé / Immuable</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observations / Commentaires de revue</label>
                <input
                  type="text"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="ex: Vérification des factures ONEE terminée"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingReview}
                className="px-4 py-1.5 bg-brand-800 hover:bg-brand-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition"
              >
                {savingReview ? 'Enregistrement...' : 'Enregistrer la revue'}
              </button>
            </div>
          </form>

          {/* Journal des revues */}
          {reviews.length > 0 && (
            <div className="space-y-1.5 text-xs text-slate-600">
              {reviews.map((r, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span><strong>{r.reviewer_name}</strong> a passé l'inventaire à <em>« {r.status} »</em></span>
                  <span className="text-slate-400">{formatDate(r.created_at, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attestation et Limite Légale */}
        <div className="border-t border-slate-200 pt-6 space-y-2 text-[11px] text-slate-500 leading-relaxed">
          <p className="font-bold text-slate-700">Attestation méthodologique :</p>
          <p>{t.repLegalNotice}</p>
          <div className="pt-4 flex justify-between items-end text-xs">
            <div>
              <p className="font-bold text-slate-800">Établi par :</p>
              <p>{orgName}</p>
            </div>
            <div className="text-right font-mono">
              <p className="font-bold text-slate-800">Moteur logiciel :</p>
              <p>Atlas Carbone v2.0 (Maroc)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Annexe Méthodologique */}
      {showAnnex && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-brand-800" />
                  <span>Annexe Méthodologique à Accès Contrôlé</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revue autorisée des seuls facteurs d'émission mobilisés pour l'exercice {period.year}
                </p>
              </div>
              <button
                onClick={() => setShowAnnex(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {annexLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Extraction des facteurs mobilisés...</div>
            ) : annexData ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-900">
                  <p className="font-bold">{annexData.attribution}</p>
                  <p className="text-[11px] text-brand-700 mt-1">{annexData.limitationNotice}</p>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Scope</th>
                        <th className="py-2 px-4">Poste / Facteur mobilisé</th>
                        <th className="py-2 px-3">Unité</th>
                        <th className="py-2 px-3">Année réf.</th>
                        <th className="py-2 px-3">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {annexData.factors.map((f: any, i: number) => (
                        <tr key={i}>
                          <td className="py-2 px-3 font-bold text-slate-800">S{f.scope}</td>
                          <td className="py-2 px-4 font-medium text-slate-900">{f.name}</td>
                          <td className="py-2 px-3 text-slate-500">{f.denominator_unit}</td>
                          <td className="py-2 px-3 text-slate-500">{f.reference_year}</td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">{f.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowAnnex(false)}
                    className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl"
                  >
                    Fermer l'annexe
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
