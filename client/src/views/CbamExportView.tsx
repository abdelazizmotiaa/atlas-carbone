/**
 * Atlas Carbone - Vue Module Export Europe — MACF / CBAM
 * Conforme au Règlement (UE) 2023/956 révisé (Régime définitif depuis le 1er janvier 2026)
 */

import React, { useState, useEffect } from 'react';
import {
  Factory,
  Globe2,
  FileCheck,
  Calculator,
  ShieldAlert,
  ArrowRight,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  Building,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CBAMProduct, CBAMDossier } from '../types.js';
import { api } from '../api.js';

interface CbamExportViewProps {
  orgId: string;
}

export const CbamExportView: React.FC<CbamExportViewProps> = ({ orgId }) => {
  const [products, setProducts] = useState<CBAMProduct[]>([]);
  const [dossiers, setDossiers] = useState<CBAMDossier[]>([]);
  const [loading, setLoading] = useState(false);

  // Simulateur allocation produit
  const [calcProcessEmissions, setCalcProcessEmissions] = useState<number>(200);
  const [calcPrecursorEmissions, setCalcPrecursorEmissions] = useState<number>(50);
  const [calcTonnage, setCalcTonnage] = useState<number>(1000);
  const [calcCnCode, setCalcCnCode] = useState<string>('7208 39 00');
  const [calcResult, setCalcResult] = useState<any>(null);

  // État copie dossier
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const prods = await api.cbam.getProducts();
      setProducts(prods);
      const doss = await api.cbam.getDossiers();
      setDossiers(doss);
    } catch (e) {
      console.error("Erreur chargement MACF:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const handleSimulate = async () => {
    try {
      const res = await api.cbam.calculate({
        processEmissionsTCO2e: calcProcessEmissions,
        precursorEmissionsTCO2e: calcPrecursorEmissions,
        productionTonnage: calcTonnage,
        cnCode: calcCnCode
      });
      setCalcResult(res);
    } catch (err: any) {
      alert("Erreur de calcul MACF: " + err.message);
    }
  };

  const copyDossierJson = (id: string, jsonStr: string) => {
    navigator.clipboard.writeText(jsonStr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Avertissement Méthodologique et Réglementaire */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-3 text-amber-900 font-bold text-base">
          <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0" />
          <span>Régime Définitif du MACF (En vigueur depuis le 1er janvier 2026)</span>
        </div>
        <p className="text-xs text-amber-950 leading-relaxed">
          <strong>Règle fondamentale :</strong> Le bilan GES total de l'entreprise ne constitue pas un calcul MACF.
          Les émissions intrinsèques spécifiques ($SEE$) doivent être calculées au niveau de chaque procédé de fabrication
          et affectées aux marchandises identifiées par leur <strong>code NC (Nomenclature Combinée à 8 chiffres)</strong>,
          en intégrant les émissions des précurseurs admissibles.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200">
            <span className="font-bold text-amber-900 block mb-1">Seuil massique de minimis (50 tonnes) :</span>
            <p className="text-slate-600">
              S'apprécie au niveau de l'<strong>importateur européen sur l'année civile</strong> (non applicable à
              l'électricité et l'hydrogène). En l'absence de visibilité sur les imports totaux du client UE, l'application
              indique : <em>« Exemption non déterminable avec les informations disponibles »</em>.
            </p>
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200">
            <span className="font-bold text-amber-900 block mb-1">Électricité & Émissions indirectes :</span>
            <p className="text-slate-600">
              Le facteur réseau de l'ONEE (0,6426 kgCO2e/kWh) est traçable, mais les règles de calcul des émissions
              indirectes MACF sont distinctes du bilan d'entreprise. Les valeurs par défaut ne sont admises que sous
              conditions strictes de justification.
            </p>
          </div>
        </div>
      </div>

      {/* Registre des Produits & Installations au Maroc */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Factory className="w-5 h-5 text-brand-800" />
            <h3 className="font-bold text-slate-900 text-base">Installations & Produits Éligibles MACF</h3>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-50 text-brand-800">
            {products.length} produit(s) qualifié(s)
          </span>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Aucun produit MACF enregistré pour cette entreprise. Ce module est principalement utilisé par les industriels
            exportateurs d'acier, d'aluminium, d'engrais, de ciment ou d'hydrogène.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {products.map(prod => {
              let precursors: any[] = [];
              try {
                precursors = JSON.parse(prod.precursors_json || '[]');
              } catch (e) {}

              return (
                <div key={prod.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-mono text-xs font-bold">
                          Code NC {prod.cn_code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{prod.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Installation : <strong>{prod.installation_name}</strong> • Ville : {prod.installation_city} (UN/LOCODE : {prod.unlocode})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Production annuelle :</span>
                      <div className="text-sm font-bold text-slate-900">
                        {prod.annual_production_tonnes.toLocaleString('fr-FR')} t/an ({prod.annual_export_eu_tonnes.toLocaleString('fr-FR')} t export UE)
                      </div>
                    </div>
                  </div>

                  {/* Décomposition des Émissions Intrinsèques Spécifiques */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block mb-0.5">Émissions directes spécifiques (SEE_dir)</span>
                      <span className="text-base font-bold text-slate-900">{prod.specific_direct_emissions} tCO2e/t</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Procédés thermiques & fours</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block mb-0.5">Émissions indirectes spécifiques (SEE_indir)</span>
                      <span className="text-base font-bold text-slate-900">{prod.specific_indirect_emissions} tCO2e/t</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Électricité consommée ONEE</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block mb-0.5">Précurseurs incorporés</span>
                      <span className="text-base font-bold text-slate-900">
                        {(prod.specific_total_emissions - prod.specific_direct_emissions - prod.specific_indirect_emissions).toFixed(3)} tCO2e/t
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{precursors.length} précurseur(s)</span>
                    </div>

                    <div className="bg-brand-900 text-white p-3 rounded-lg border border-brand-800 flex flex-col justify-between">
                      <span className="text-brand-300 block mb-0.5 font-semibold">Total SEE_total</span>
                      <span className="text-lg font-extrabold text-white">{prod.specific_total_emissions} tCO2e / tonne</span>
                      <span className="text-[10px] text-brand-300">Valeur certifiable pour déclaration</span>
                    </div>
                  </div>

                  {/* Précurseurs */}
                  {precursors.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-700 block mb-2">Traçabilité des Précurseurs Admissibles :</span>
                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                            <tr>
                              <th className="py-2 px-3">Matière / Précurseur</th>
                              <th className="py-2 px-3">Fournisseur & Pays</th>
                              <th className="py-2 px-3">Ratio par tonne de produit</th>
                              <th className="py-2 px-3 text-right">Émissions intrinsèques spécifiques</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {precursors.map((prec, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-medium text-slate-900">{prec.name}</td>
                                <td className="py-2 px-3 text-slate-600">{prec.supplier} ({prec.country})</td>
                                <td className="py-2 px-3 font-mono">{prec.quantityPerTonne} t/t</td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900">{prec.specificEmissionsTCO2e} tCO2e/t</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Simulateur d'allocation Produit MACF */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Calculator className="w-5 h-5 text-brand-800" />
          <h3 className="font-bold text-slate-900 text-base">Simulateur d'Allocation Produit MACF</h3>
        </div>
        <p className="text-xs text-slate-500">
          Vérifie l'équation mathématique d'allocation : <code>SEE = (Émissions procédé + Émissions précurseurs) / Tonnage produit</code>.
          Une masse nulle est automatiquement bloquée conformément à la règle 13.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Émissions procédé (tCO2e)</label>
            <input
              type="number"
              value={calcProcessEmissions}
              onChange={e => setCalcProcessEmissions(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Émissions précurseurs (tCO2e)</label>
            <input
              type="number"
              value={calcPrecursorEmissions}
              onChange={e => setCalcPrecursorEmissions(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Masse produite (tonnes)</label>
            <input
              type="number"
              value={calcTonnage}
              onChange={e => setCalcTonnage(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Code NC (8 chiffres)</label>
            <input
              type="text"
              value={calcCnCode}
              onChange={e => setCalcCnCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleSimulate}
            className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            Calculer l'intensité produit
          </button>

          {calcResult && (
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs flex items-center space-x-4">
              <div>
                <span className="text-slate-500 font-medium">SEE calculée :</span>
                <span className="font-extrabold text-brand-900 text-sm ml-2">
                  {calcResult.specificEmbeddedEmissionsTCO2ePerTonne.toFixed(4)} tCO2e/tonne
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${calcResult.isEligibleSector ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                {calcResult.isEligibleSector ? 'Secteur MACF Qualifié' : 'Code NC Hors Annexe I'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dossiers d'échange avec les importateurs européens */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Globe2 className="w-5 h-5 text-brand-800" />
            <h3 className="font-bold text-slate-900 text-base">Dossiers de Communication Importateurs Européens</h3>
          </div>
          <span className="text-xs text-slate-400">{dossiers.length} dossier(s) prêt(s)</span>
        </div>

        {dossiers.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Aucun dossier importateur généré.
          </div>
        ) : (
          <div className="space-y-4">
            {dossiers.map(dos => (
              <div key={dos.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-400">Client Déclarant UE :</span>
                    <h4 className="font-bold text-slate-900 text-sm">{dos.importer_name} ({dos.importer_country})</h4>
                    <span className="text-[11px] text-slate-500">Numéro EORI : {dos.importer_eori || 'En attente'} • Exercice : {dos.reference_period}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyDossierJson(dos.id, dos.dossier_json)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold transition flex items-center space-x-1"
                    >
                      {copiedId === dos.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copier JSON Dossier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="font-mono text-[11px] bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-40">
                  <pre>{JSON.stringify(JSON.parse(dos.dossier_json), null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
