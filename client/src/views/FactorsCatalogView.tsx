/**
 * Atlas Carbone - Vue Gouvernance et Protection du Catalogue de Facteurs d'Émission
 * Conforme à la Section 4 du Prompt Maître
 * - Rôle SuperAdmin : Interface d'administration, revue des statuts et audit des facteurs
 * - Utilisateurs Entreprise / Invités : Protection du catalogue, explications méthodologiques et renvoi vers l'annexe
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
  ShieldCheck,
  Lock,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { EmissionFactor } from '../types.js';
import { api } from '../api.js';

interface FactorsCatalogViewProps {
  isSuperAdmin?: boolean;
  currentOrgId?: string;
  currentPeriodId?: string;
  onOpenAnnex?: () => void;
}

export const FactorsCatalogView: React.FC<FactorsCatalogViewProps> = ({
  isSuperAdmin = false,
  currentOrgId,
  currentPeriodId,
  onOpenAnnex
}) => {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFactor, setSelectedFactor] = useState<EmissionFactor | null>(null);
  const [catalogOptionsCount, setCatalogOptionsCount] = useState<number>(0);

  useEffect(() => {
    if (isSuperAdmin) {
      setLoading(true);
      api.factors.search({
        q: search,
        scope: scopeFilter !== 'all' ? Number(scopeFilter) : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      })
        .then(setFactors)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      // Pour les utilisateurs ordinaires, récupérer le nombre d'activités types disponibles
      api.activities.getCatalogOptions().then(opts => {
        setCatalogOptionsCount(opts.length);
      }).catch(console.error);
    }
  }, [isSuperAdmin, search, scopeFilter, statusFilter]);

  // Si l'utilisateur n'est pas SuperAdmin : Vue de confidentialité et pédagogie
  if (!isSuperAdmin) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Bandeau de protection & gouvernance */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center">
              <Lock className="w-5 h-5 text-brand-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Gouvernance et Confidentialité du Référentiel de Facteurs
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Protection de la base de calcul et traçabilité méthodologique certifiée
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-3">
            <p>
              Conformément à la politique de sécurité et aux licences de réutilisation méthodologique d’<strong>Atlas Carbone</strong>,
              l’ensemble des facteurs d’émission bruts, leurs formules et leurs cellules sources Excel sont conservés
              strictement <strong>côté serveur</strong>.
            </p>
            <p>
              Les utilisateurs et entreprises disposent de <strong>{catalogOptionsCount || '600+'} activités types prédéfinies</strong>{' '}
              avec leurs unités attendues et leurs conseils de collecte dans le module <em>Activités & Saisie</em>.
              Tous les calculs sont exécutés de façon déterministe côté serveur sans risque de manipulation ou de fuite.
            </p>
          </div>

          {/* Sources et attributions */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Origine et Droits d'Attribution des Facteurs
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Le classeur de calcul officiel est issu des travaux partenariaux marocains associant la{' '}
              <strong>Fondation Mohammed VI pour la Protection de l'Environnement (FM6E)</strong>, l'<strong>AMEE</strong>,{' '}
              l'<strong>IMANOR</strong>, l'<strong>ABC</strong> et l'<strong>ADEME</strong>. Atlas Carbone n'en revendique
              pas la propriété exclusive et applique strictement leurs règles méthodologiques.
            </p>
          </div>

          {/* Note sur la limite mathématique */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <span className="font-bold flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Transparence sur la déductibilité mathématique</span>
            </span>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Lorsqu'une quantité d'activité et son résultat en tCO₂e sont connus, un facteur linéaire simple peut parfois
              être déduit par division arithmétique. La protection du catalogue protège la structure globale de la base
              contre le téléchargement massif et ne prétend pas à un secret mathématique absolu.
            </p>
          </div>

          {/* Accès à l'annexe méthodologique de l'inventaire en cours */}
          {currentOrgId && currentPeriodId && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Vous souhaitez auditer les facteurs mobilisés pour votre exercice en cours ?
              </span>
              {onOpenAnnex ? (
                <button
                  onClick={onOpenAnnex}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Consulter l'Annexe Méthodologique</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-brand-800">
                  Accessible depuis l’onglet Rapport Officiel
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Si l'utilisateur est SuperAdmin : Interface complète d'administration du catalogue
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-brand-900 font-bold text-base">
          <Database className="w-5 h-5 text-brand-800" />
          <span>Administration Globale du Catalogue de Facteurs (SuperAdmin)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Espace réservé à l'administration de la plateforme pour inspecter, valider et auditer les {factors.length} facteurs
          extraits du classeur Excel de référence (SHA-256 : <code>477f3cf008...</code>).
        </p>

        {/* Filtres de recherche */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-full focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <select
            value={scopeFilter}
            onChange={e => setScopeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="all">Tous les scopes (1, 2, 3)</option>
            <option value="1">Scope 1 (Émissions directes)</option>
            <option value="2">Scope 2 (Électricité)</option>
            <option value="3">Scope 3 (Chaîne de valeur)</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="validated">Validé pour clôture</option>
            <option value="to_verify">À vérifier (Facteurs mixtes)</option>
          </select>
        </div>
      </div>

      {/* Tableau des Facteurs (SuperAdmin) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Chargement du catalogue...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code / ID</th>
                  <th className="py-3 px-4">Nom du facteur</th>
                  <th className="py-3 px-2">Scope</th>
                  <th className="py-3 px-4">Valeur</th>
                  <th className="py-3 px-4">Unité</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-3">Origine Excel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {factors.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{f.id}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{f.name}</td>
                    <td className="py-2.5 px-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        S{f.scope}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{f.value}</td>
                    <td className="py-2.5 px-4 text-slate-500">{f.numerator_unit}/{f.denominator_unit}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        f.status === 'validated'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.status === 'validated' ? 'Validé' : 'À vérifier'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                      {f.sheet_origin} (L{f.row_origin})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
