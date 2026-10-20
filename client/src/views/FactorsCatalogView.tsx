/**
 * Atlas Carbone - Vue Catalogue & Gouvernance des Facteurs d'Émission
 * Exploration des 670 facteurs marocains et gestion des statuts de revue
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  BookOpen,
  ArrowUpDown
} from 'lucide-react';
import { EmissionFactor } from '../types.js';
import { api } from '../api.js';

export const FactorsCatalogView: React.FC = () => {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFactor, setSelectedFactor] = useState<EmissionFactor | null>(null);

  const fetchFactors = async () => {
    setLoading(true);
    try {
      const data = await api.factors.search({
        q: search,
        scope: scopeFilter !== 'all' ? Number(scopeFilter) : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setFactors(data);
    } catch (e) {
      console.error("Erreur facteurs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, [search, scopeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* En-tête explicatif */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-brand-900 font-bold text-base">
          <BookOpen className="w-5 h-5 text-brand-800" />
          <span>Référentiel National des Facteurs d'Émission (670 facteurs audités)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Issu du partenariat national entre la <strong>Fondation Mohammed VI pour l'Environnement (FM6E)</strong>,
          l'<strong>AMEE</strong>, l'<strong>IMANOR</strong> et l'<strong>ADEME</strong>. Chaque facteur conserve son
          empreinte d'origine, son incertitude déclarée et son périmètre méthodologique. Les facteurs au statut{' '}
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">À vérifier</span> signalent
          une ambiguïté (notamment les facteurs mixtes amont+combustion) devant être ventilée avant clôture officielle.
        </p>

        {/* Filtres de recherche */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par nom (ex: Électricité, Diesel, Gaz)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-full focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={scopeFilter}
            onChange={e => setScopeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Tous les scopes (1, 2, 3)</option>
            <option value="1">Scope 1 (Émissions directes)</option>
            <option value="2">Scope 2 (Énergie indirecte)</option>
            <option value="3">Scope 3 (Chaîne de valeur)</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Tous les statuts de validation</option>
            <option value="validated">Validé pour clôture</option>
            <option value="to_verify">À vérifier (Facteurs mixtes)</option>
          </select>
        </div>
      </div>

      {/* Tableau des Facteurs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{factors.length} facteur(s) d'émission affiché(s)</span>
          <span>Base : IPCC AR6 • Source : FM6E & ADEME</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Identifiant & Libellé</th>
                <th className="py-3 px-4">Scope & Catégorie</th>
                <th className="py-3 px-4">Valeur FE</th>
                <th className="py-3 px-4">Périmètre</th>
                <th className="py-3 px-4">Incertitude</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Provenance Classeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {factors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun facteur trouvé avec ces critères de recherche.
                  </td>
                </tr>
              ) : (
                factors.map(f => (
                  <tr
                    key={f.id}
                    onClick={() => setSelectedFactor(f)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{f.name}</div>
                      <span className="font-mono text-[10px] text-slate-400">{f.id} (v{f.version})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.scope === 1
                            ? 'bg-orange-100 text-orange-800'
                            : f.scope === 2
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        Scope {f.scope}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">{f.category.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {f.value} <span className="text-slate-500 font-normal">{f.numerator_unit}/{f.denominator_unit}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 capitalize">
                      {f.perimeter.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                        ±{((f.uncertainty_pct || 0.2) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {f.status === 'validated' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold flex items-center space-x-1 w-max">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Validé</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold flex items-center space-x-1 w-max">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>À vérifier</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {f.sheet_origin ? (
                        <span>{f.sheet_origin} (L.{f.row_origin})</span>
                      ) : (
                        <span>Système / Norme</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tiroir détail du facteur sélectionné */}
      {selectedFactor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs text-brand-800 font-bold">{selectedFactor.id} (v{selectedFactor.version})</span>
                <h3 className="font-bold text-slate-900 text-base">{selectedFactor.name}</h3>
              </div>
              <button onClick={() => setSelectedFactor(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Valeur numérique :</span>
                  <div className="text-base font-bold text-slate-900">
                    {selectedFactor.value} {selectedFactor.numerator_unit}/{selectedFactor.denominator_unit}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Périmètre du facteur :</span>
                  <div className="font-bold text-slate-900 capitalize">{selectedFactor.perimeter.replace(/_/g, ' ')}</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Scope GHG Protocol :</span>
                  <div className="font-bold text-slate-900">Scope {selectedFactor.scope}</div>
                </div>
                <div>
                  <span className="text-slate-400">Catégorie ISO 14064-1 :</span>
                  <div className="font-bold text-slate-900">Catégorie {selectedFactor.iso_category}</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-400">Source documentaire :</span>
                <div className="font-medium text-slate-800">{selectedFactor.source}</div>
              </div>

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-400">Note de qualification & validation :</span>
                <p className="font-medium text-slate-700 mt-0.5">
                  {selectedFactor.verification_note || 'Aucune restriction particulière.'}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-500">
                <span>Incertitude déclarée : <strong>±{((selectedFactor.uncertainty_pct || 0.2) * 100).toFixed(0)}%</strong></span>
                <span>Année : {selectedFactor.reference_year} • Géo : {selectedFactor.geography}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFactor(null)}
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
