/**
 * Atlas Carbone - Vue Rapport Officiel d'Inventaire GES
 * Conforme aux standards ISO 14064-1:2018 et GHG Protocol Corporate Standard
 */

import React from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Calendar,
  Leaf,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { OverviewData } from '../types.js';

interface ReportViewProps {
  data: OverviewData | null;
  orgName: string;
}

export const ReportView: React.FC<ReportViewProps> = ({ data, orgName }) => {
  if (!data || !data.period) {
    return <div className="p-8 text-center text-slate-400">Aucun inventaire disponible.</div>;
  }

  const { period, summary, byScope, byCategory, bySite, uncertainty } = data;
  const isClosed = period.status === 'closed';

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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between no-print">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-brand-800" />
          <span className="font-bold text-slate-900 text-sm">
            Rapport d'Inventaire des Émissions de Gaz à Effet de Serre (BEGES)
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={exportCsv}
            className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / Sauvegarder en PDF</span>
          </button>
        </div>
      </div>

      {/* Document Imprimable Officiel */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md space-y-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* En-tête du document */}
        <div className="flex justify-between items-start border-b-2 border-brand-900 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold text-slate-900">
                Atlas <span className="text-brand-800">Carbone</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                Rapport R-2026-V1
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
              <span>{isClosed ? 'Inventaire Clôturé & Certifiable' : 'Inventaire Provisoire'}</span>
            </span>
            <p className="text-xs text-slate-400 mt-1">Édité le {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        {/* Identification de l'Organisation et Périmètre */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Organisation Auditée :</span>
            <div className="text-base font-bold text-slate-900">{orgName}</div>
            <p className="text-slate-600 mt-0.5">Royaume du Maroc</p>
            <p className="text-slate-500 mt-1">Sites audités : {bySite.map(s => s.name).join(', ')}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Paramètres de l'Inventaire :</span>
            <p className="text-slate-700">Exercice de référence : <strong>Année civile {period.year}</strong></p>
            <p className="text-slate-700">Approche de consolidation : <strong>Contrôle opérationnel</strong></p>
            <p className="text-slate-700">Référentiel des PRG : <strong>GIEC 6e Rapport d'Évaluation (AR6 - 100 ans)</strong></p>
            <p className="text-slate-700">Facteurs d'émission : <strong>Base Carbone Maroc / FM6E / ONEE</strong></p>
          </div>
        </div>

        {/* Synthèse des Émissions (Tableau Exécutif) */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
            1. Synthèse Globale des Émissions de Gaz à Effet de Serre
          </h3>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-900 text-white rounded-xl">
              <span className="text-xs font-semibold text-slate-400 block">TOTAL ÉMISSIONS BRUTES</span>
              <div className="text-2xl font-black mt-1">
                {summary.totalTCO2e.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </div>
              <span className="text-[11px] text-brand-300 font-medium">tCO2e</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 block">SCOPE 1 (DIRECT)</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {summary.scope1TCO2e.toFixed(1)}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">tCO2e (Catégorie 1 ISO)</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 block">SCOPE 2 (ÉNERGIE)</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {summary.scope2TCO2e.toFixed(1)}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">tCO2e (Location-based)</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 block">SCOPE 3 (AMONT/AVAL)</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {summary.scope3TCO2e.toFixed(1)}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">tCO2e (Chaîne de valeur)</span>
            </div>
          </div>

          {summary.biogenicTCO2e > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <span className="flex items-center space-x-1.5">
                <Leaf className="w-4 h-4 text-emerald-700" />
                <span>Émissions de CO2 biogénique déclarées séparément (non incluses dans le total fossile) :</span>
              </span>
              <span className="font-bold">{summary.biogenicTCO2e.toFixed(2)} tCO2e</span>
            </div>
          )}
        </div>

        {/* Détail par Catégorie et Poste ISO 14064 */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
            2. Ventilation par Catégorie d'Activité
          </h3>

          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Catégorie d'Activité</th>
                <th className="py-2.5 px-3">Scope GHG</th>
                <th className="py-2.5 px-3">Catégorie ISO 14064-1:2018</th>
                <th className="py-2.5 px-3 text-right">Émissions (tCO2e)</th>
                <th className="py-2.5 px-3 text-right">Part relative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byCategory.map((cat, i) => {
                const pct = summary.totalTCO2e > 0 ? (cat.tco2e / summary.totalTCO2e) * 100 : 0;
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-900 capitalize">
                      {cat.label.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2 px-3">Scope {cat.scope}</td>
                    <td className="py-2 px-3 text-slate-600">
                      {cat.scope === 1 ? 'Cat. 1 (Émissions directes)' : cat.scope === 2 ? 'Cat. 2 (Énergie indirecte)' : 'Cat. 3 & 4 (Autres indirectes)'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {cat.tco2e.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Évaluation des Incertitudes & Qualité des Données */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
            3. Analyse des Incertitudes & Limites Méthodologiques
          </h3>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 leading-relaxed">
            <p>
              Conformément au chapitre 10 du GHG Protocol et à la norme ISO 14064-1:2018, les incertitudes sur les données
              d'activité et sur les facteurs d'émission ont été propagées par <strong>quadrature gaussienne</strong>.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-1 font-mono">
              <div>
                <span className="text-slate-500">Incertitude relative globale :</span>{' '}
                <strong className="text-slate-900">±{uncertainty.uncertaintyRelativePct.toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-slate-500">Intervalle de confiance à 95% :</span>{' '}
                <strong className="text-slate-900">
                  [{(uncertainty.minKg / 1000).toFixed(1)} ; {(uncertainty.maxKg / 1000).toFixed(1)}] tCO2e
                </strong>
              </div>
            </div>
            <p className="text-slate-500 pt-1">
              *Note sur l'indépendance : Les consommations sous un même facteur d'émission (ex: réseau ONEE) présentent
              une corrélation d'erreur systématique prise en compte dans la borne supérieure.
            </p>
          </div>
        </div>

        {/* Bloc de Signature & Vérification */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-2">Responsable de l'Inventaire :</span>
            <div className="h-20 border border-dashed border-slate-300 rounded-xl p-3 flex flex-col justify-between">
              <span className="font-bold text-slate-800">Direction Générale / RSE</span>
              <span className="text-[11px] text-slate-400">Date et visa interne</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-2">Vérification Tiers Indépendant (Optionnel) :</span>
            <div className="h-20 border border-dashed border-slate-300 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-slate-500">Organisme vérificateur accrédité ISO 14065</span>
              <span className="text-[11px] text-slate-400">Mention : Non soumis à vérification tierce</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
