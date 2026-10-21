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
  ChevronRight,
  Plus,
  Coins,
  MapPin,
  Scale,
  FileText,
  X,
  ExternalLink,
  Info
} from 'lucide-react';
import { CBAMProduct, CBAMDossier, CBAMInstallation, CBAMCalculationResult } from '../types.js';
import { api } from '../api.js';

interface CbamExportViewProps {
  orgId: string;
}

export const CbamExportView: React.FC<CbamExportViewProps> = ({ orgId }) => {
  const [installations, setInstallations] = useState<CBAMInstallation[]>([]);
  const [products, setProducts] = useState<CBAMProduct[]>([]);
  const [dossiers, setDossiers] = useState<CBAMDossier[]>([]);
  const [loading, setLoading] = useState(false);

  // Modales
  const [showNewDossierModal, setShowNewDossierModal] = useState(false);
  const [showNewInstallationModal, setShowNewInstallationModal] = useState(false);

  // Simulateur allocation produit & calcul MACF
  const [calcProcessDirect, setCalcProcessDirect] = useState<number>(1200);
  const [calcElectricityIndirect, setCalcElectricityIndirect] = useState<number>(480);
  const [calcPrecursorEmissions, setCalcPrecursorEmissions] = useState<number>(300);
  const [calcTonnage, setCalcTonnage] = useState<number>(2000);
  const [calcExportEU, setCalcExportEU] = useState<number>(1500);
  const [calcCnCode, setCalcCnCode] = useState<string>('7214 20 00');
  const [calcEtsPrice, setCalcEtsPrice] = useState<number>(65);
  const [calcLocalCarbonPrice, setCalcLocalCarbonPrice] = useState<number>(0);
  const [calcResult, setCalcResult] = useState<CBAMCalculationResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Formulaire Nouveau Dossier Déclarant UE
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [dossierImporterName, setDossierImporterName] = useState<string>('Thyssenkrupp Schulte GmbH');
  const [dossierImporterCountry, setDossierImporterCountry] = useState<string>('DE');
  const [dossierImporterEori, setDossierImporterEori] = useState<string>('DE12345678901234');
  const [dossierPeriod, setDossierPeriod] = useState<string>('2026-Q1');
  const [dossierExportTonnes, setDossierExportTonnes] = useState<number>(1000);
  const [dossierLocalCarbonPrice, setDossierLocalCarbonPrice] = useState<number>(0);
  const [isSubmittingDossier, setIsSubmittingDossier] = useState(false);

  // Formulaire Nouvelle Installation
  const [newInstName, setNewInstName] = useState('');
  const [newInstCity, setNewInstCity] = useState('Nador');
  const [newInstUnlocode, setNewInstUnlocode] = useState('MA NDR');
  const [newInstLat, setNewInstLat] = useState<number>(35.1688);
  const [newInstLng, setNewInstLng] = useState<number>(-2.9287);
  const [newInstContact, setNewInstContact] = useState('Youssef El Alami');
  const [newInstEmail, setNewInstEmail] = useState('cbam@metal-oriental.ma');
  const [isSubmittingInst, setIsSubmittingInst] = useState(false);

  // État copie et inspection dossier
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDossierId, setExpandedDossierId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insts, prods, doss] = await Promise.all([
        api.cbam.getInstallations(orgId),
        api.cbam.getProducts(orgId),
        api.cbam.getDossiers(orgId)
      ]);
      setInstallations(insts || []);
      setProducts(prods || []);
      setDossiers(doss || []);
      if (prods && prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }
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
    setCalcLoading(true);
    try {
      const res = await api.cbam.calculate({
        processEmissionsDirectTCO2e: calcProcessDirect,
        electricityIndirectTCO2e: calcElectricityIndirect,
        precursorEmissionsTCO2e: calcPrecursorEmissions,
        productionTonnage: calcTonnage,
        exportTonnageEU: calcExportEU,
        cnCode: calcCnCode,
        carbonPricePaidLocalPerTonneMAD: calcLocalCarbonPrice,
        etsBenchmarkPriceEURPerTCO2e: calcEtsPrice
      }, orgId);
      setCalcResult(res);
    } catch (err: any) {
      alert("Erreur de calcul MACF: " + err.message);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleCreateInstallation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim() || !newInstUnlocode.trim()) {
      alert("Le nom et le code UN/LOCODE sont obligatoires.");
      return;
    }
    setIsSubmittingInst(true);
    try {
      await api.cbam.createInstallation({
        name: newInstName.trim(),
        city: newInstCity.trim(),
        unlocode: newInstUnlocode.trim(),
        country: 'MA',
        latitude: newInstLat,
        longitude: newInstLng,
        contact_person: newInstContact.trim(),
        contact_email: newInstEmail.trim()
      }, orgId);
      setShowNewInstallationModal(false);
      setNewInstName('');
      await fetchData();
    } catch (err: any) {
      alert("Erreur lors de la création de l'installation: " + err.message);
    } finally {
      setIsSubmittingInst(false);
    }
  };

  const handleCreateDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert("Veuillez sélectionner un produit MACF.");
      return;
    }
    if (!dossierImporterName.trim() || !dossierImporterCountry.trim()) {
      alert("Le nom et le pays de l'importateur sont obligatoires.");
      return;
    }
    setIsSubmittingDossier(true);
    try {
      await api.cbam.createDossier({
        cbamProductId: selectedProductId,
        importerName: dossierImporterName.trim(),
        importerCountry: dossierImporterCountry.trim(),
        importerEori: dossierImporterEori.trim(),
        referencePeriod: dossierPeriod.trim(),
        exportedTonnes: dossierExportTonnes,
        carbonPricePaidLocalMAD: dossierLocalCarbonPrice
      }, orgId);
      setShowNewDossierModal(false);
      await fetchData();
    } catch (err: any) {
      alert("Erreur lors de la création du dossier: " + err.message);
    } finally {
      setIsSubmittingDossier(false);
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
          <span>Régime Définitif du MACF / CBAM (Règlement UE 2023/956 — Applicable dès 2026)</span>
        </div>
        <p className="text-xs text-amber-950 leading-relaxed">
          <strong>Règle fondamentale :</strong> Le bilan GES global de l'entreprise ne peut pas être soumis directement aux douanes européennes.
          Les émissions intrinsèques spécifiques ($SEE$) doivent être délimitées au niveau de la ligne de fabrication du <strong>code NC (Nomenclature Combinée à 8 chiffres)</strong>,
          en décomposant strictement les émissions directes de procédé (SEE_dir), les émissions indirectes liées à l'électricité (SEE_indir),
          et les émissions des précurseurs admissibles (SEE_pre).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200 shadow-2xs">
            <span className="font-bold text-amber-900 block mb-1">Seuil massique de minimis (50 t) :</span>
            <p className="text-slate-600">
              S'apprécie au niveau de l'<strong>importateur européen sur l'année civile</strong> (non applicable à l'électricité et à l'hydrogène).
              En l'absence de consolidation globale de l'importateur UE, l'application certifie : <em>« Exemption non déterminable avec les informations disponibles »</em>.
            </p>
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200 shadow-2xs">
            <span className="font-bold text-amber-900 block mb-1">Électricité & Émissions indirectes :</span>
            <p className="text-slate-600">
              Le facteur d'émission officiel du réseau électrique national ONEE est homologué et traçable.
              Les valeurs par défaut ne sont admises par la Commission européenne que sous réserve de justification méthodologique rigoureuse.
            </p>
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200 shadow-2xs">
            <span className="font-bold text-amber-900 block mb-1">Compensation Carbone Locale :</span>
            <p className="text-slate-600">
              Tout prix du carbone effectivement acquitté dans le pays d'origine (Maroc) peut être déduit du montant des certificats MACF
              dus par l'importateur européen lors de sa déclaration annuelle au 31 mai.
            </p>
          </div>
        </div>
      </div>

      {/* Installations Industrielles & Coordonnées UN/LOCODE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-brand-800" />
            <h3 className="font-bold text-slate-900 text-base">Installations de Production Agréées MACF</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-50 text-brand-800">
              {installations.length} installation(s)
            </span>
            <button
              onClick={() => setShowNewInstallationModal(true)}
              className="px-3 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter Installation</span>
            </button>
          </div>
        </div>

        {installations.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Aucune installation industrielle enregistrée pour cette organisation.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {installations.map(inst => (
              <div key={inst.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{inst.name}</h4>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[11px] font-bold">
                      UN/LOCODE : {inst.unlocode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ville : <strong>{inst.city}</strong> ({inst.country}) • Coordonnées : {inst.latitude?.toFixed(4)}, {inst.longitude?.toFixed(4)}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between items-center">
                  <span>Contact : {inst.contact_person || 'Non renseigné'}</span>
                  <span className="font-mono text-slate-400">{inst.contact_email}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registre des Produits & Décomposition SEE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Factory className="w-5 h-5 text-brand-800" />
            <h3 className="font-bold text-slate-900 text-base">Marchandises & Intensité Carbone des Procédés</h3>
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

              const specificPrecursor = Math.max(0, +(prod.specific_total_emissions - prod.specific_direct_emissions - prod.specific_indirect_emissions).toFixed(4));

              return (
                <div key={prod.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-mono text-xs font-bold">
                          Code NC {prod.cn_code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{prod.name}</h4>
                        <span className="text-xs text-slate-400">({prod.sector})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Installation : <strong>{prod.installation_name}</strong> • Ville : {prod.installation_city} (UN/LOCODE : {prod.unlocode})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Capacité déclarée :</span>
                      <div className="text-sm font-bold text-slate-900">
                        {prod.annual_production_tonnes?.toLocaleString('fr-FR')} t/an ({prod.annual_export_eu_tonnes?.toLocaleString('fr-FR')} t export UE)
                      </div>
                    </div>
                  </div>

                  {/* Décomposition des Émissions Intrinsèques Spécifiques */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block mb-0.5">Émissions directes spécifiques (SEE_dir)</span>
                      <span className="text-base font-bold text-slate-900">{prod.specific_direct_emissions} tCO₂e/t</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Procédés thermiques & combustion</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block mb-0.5">Émissions indirectes spécifiques (SEE_indir)</span>
                      <span className="text-base font-bold text-slate-900">{prod.specific_indirect_emissions} tCO₂e/t</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Électricité réseau ONEE</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block mb-0.5">Précurseurs incorporés (SEE_pre)</span>
                      <span className="text-base font-bold text-slate-900">
                        {specificPrecursor} tCO₂e/t
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{precursors.length} précurseur(s) tracé(s)</span>
                    </div>

                    <div className="bg-brand-900 text-white p-3 rounded-lg border border-brand-800 flex flex-col justify-between">
                      <span className="text-brand-300 block mb-0.5 font-semibold">Total SEE_total</span>
                      <span className="text-lg font-extrabold text-white">{prod.specific_total_emissions} tCO₂e / t</span>
                      <span className="text-[10px] text-brand-300">Certifiable déclaration douanière UE</span>
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
                                <td className="py-2 px-3 text-right font-bold text-slate-900">{prec.specificEmissionsTCO2e} tCO₂e/t</td>
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

      {/* Simulateur d'allocation Produit & Calculateur Déterministe MACF */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Calculator className="w-5 h-5 text-brand-800" />
          <h3 className="font-bold text-slate-900 text-base">Calculateur Déterministe d'Intensité Produit MACF (Annexe IV)</h3>
        </div>
        <p className="text-xs text-slate-500">
          Formule de calcul officielle : <code>SEE_total = (Directes + Indirectes électricité + Précurseurs) / Masse produite</code>.
          Une masse produite nulle ou négative est strictement bloquée conformément à la règle 13.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Émissions directes procédé (tCO₂e)</label>
            <input
              type="number"
              value={calcProcessDirect}
              onChange={e => setCalcProcessDirect(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Électricité réseau indirecte (tCO₂e)</label>
            <input
              type="number"
              value={calcElectricityIndirect}
              onChange={e => setCalcElectricityIndirect(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Émissions précurseurs (tCO₂e)</label>
            <input
              type="number"
              value={calcPrecursorEmissions}
              onChange={e => setCalcPrecursorEmissions(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Masse totale produite (tonnes)</label>
            <input
              type="number"
              value={calcTonnage}
              onChange={e => setCalcTonnage(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tonnage exporté vers l'UE (tonnes)</label>
            <input
              type="number"
              value={calcExportEU}
              onChange={e => setCalcExportEU(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Code NC (8 chiffres)</label>
            <input
              type="text"
              value={calcCnCode}
              onChange={e => setCalcCnCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
              placeholder="ex: 7214 20 00"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Prix de référence ETS (€/tCO₂e)</label>
            <input
              type="number"
              value={calcEtsPrice}
              onChange={e => setCalcEtsPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Taxe carbone locale payée (MAD/t)</label>
            <input
              type="number"
              value={calcLocalCarbonPrice}
              onChange={e => setCalcLocalCarbonPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleSimulate}
            disabled={calcLoading}
            className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-2"
          >
            <Calculator className="w-4 h-4" />
            <span>{calcLoading ? 'Calcul en cours...' : "Calculer l'intensité et l'impact économique"}</span>
          </button>
        </div>

        {calcResult && (
          <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
            {/* Ratios unitaires */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">SEE directes</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {calcResult.specificDirectEmissionsTCO2ePerTonne.toFixed(4)} tCO₂e/t
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">SEE indirectes élec.</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {calcResult.specificIndirectEmissionsTCO2ePerTonne.toFixed(4)} tCO₂e/t
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">SEE précurseurs</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {calcResult.specificPrecursorEmissionsTCO2ePerTonne.toFixed(4)} tCO₂e/t
                </span>
              </div>
              <div className="p-3 bg-brand-900 text-white rounded-lg border border-brand-800">
                <span className="text-brand-300 block text-[11px]">SEE totale unitaire</span>
                <span className="font-extrabold text-white text-base">
                  {calcResult.specificEmbeddedEmissionsTCO2ePerTonne.toFixed(4)} tCO₂e/t
                </span>
              </div>
            </div>

            {/* Impact Économique et Réglementaire */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Impact Financier Prévisionnel des Certificats</span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    ETS : {calcResult.economicImpact.etsBenchmarkPriceEURPerTCO2e} €/tCO₂e
                  </span>
                </div>
                <div className="space-y-1.5 pt-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Émissions incorporées exportées :</span>
                    <span className="font-bold text-slate-900">{calcResult.totalExportEmbeddedEmissionsTCO2e.toLocaleString('fr-FR')} tCO₂e</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coût brut des certificats UE :</span>
                    <span className="font-bold text-slate-900">{calcResult.economicImpact.estimatedCBAMCertificatesCostEUR.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between text-brand-900 font-semibold border-t border-slate-100 pt-1">
                    <span>Équivalent en Dirhams marocains :</span>
                    <span>{calcResult.economicImpact.estimatedCBAMCertificatesCostMAD.toLocaleString('fr-FR')} MAD</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-brand-700" />
                  <span>Qualification Sectorielle & Seuil de Minimis</span>
                </span>
                <div className="space-y-2 pt-1 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Secteur Annexe I :</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${calcResult.isEligibleSector ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {calcResult.sectorName}
                    </span>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900">
                    <strong>Statut de minimis (50 t) : </strong>
                    {calcResult.deMinimisExemptionStatus.reason}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes méthodologiques */}
            {calcResult.methodologicalNotes && calcResult.methodologicalNotes.length > 0 && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Mentions de conformité Annexe IV :</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {calcResult.methodologicalNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dossiers d'échange avec les importateurs européens */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Globe2 className="w-5 h-5 text-brand-800" />
            <h3 className="font-bold text-slate-900 text-base">Dossiers de Communication Importateurs Européens</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">{dossiers.length} dossier(s) prêt(s)</span>
            <button
              onClick={() => setShowNewDossierModal(true)}
              className="px-3 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Dossier Déclarant UE</span>
            </button>
          </div>
        </div>

        {dossiers.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Aucun dossier importateur généré. Cliquez sur <strong>« Nouveau Dossier Déclarant UE »</strong> pour créer un dossier de communication conforme.
          </div>
        ) : (
          <div className="space-y-4">
            {dossiers.map(dos => {
              const downloadUrl = api.cbam.getDossierDownloadUrl(dos.id, orgId);
              const isExpanded = expandedDossierId === dos.id;

              return (
                <div key={dos.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-semibold text-[11px]">
                          {dos.reference_period}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{dos.importer_name} ({dos.importer_country})</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        EORI Déclarant : <strong>{dos.importer_eori || 'En attente'}</strong> • Marchandise : {dos.product_name} (Code NC {dos.cn_code})
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <a
                        href={downloadUrl}
                        download={`cbam-declaration-${dos.id}.json`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg font-semibold transition flex items-center space-x-1.5 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger Dossier (JSON)</span>
                      </a>

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
                            <span>Copier</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setExpandedDossierId(isExpanded ? null : dos.id)}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition"
                        title={isExpanded ? "Masquer JSON" : "Afficher aperçu JSON"}
                      >
                        {isExpanded ? 'Réduire' : 'Aperçu'}
                      </button>
                    </div>
                  </div>

                  {/* Résumé exporté */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block">Tonnage exporté :</span>
                      <span className="font-bold text-slate-900">{dos.exported_tonnes ? dos.exported_tonnes.toLocaleString('fr-FR') : '—'} tonnes</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Émissions incorporées :</span>
                      <span className="font-bold text-slate-900">{dos.total_embedded_emissions_tco2e ? dos.total_embedded_emissions_tco2e.toLocaleString('fr-FR') : '—'} tCO₂e</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Régime juridique :</span>
                      <span className="font-semibold text-slate-800">Règlement UE 2023/956</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Créé le :</span>
                      <span>{new Date(dos.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Aperçu JSON dépliable */}
                  {isExpanded && (
                    <div className="font-mono text-[11px] bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-60 mt-2">
                      <pre>{JSON.stringify(JSON.parse(dos.dossier_json), null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nouveau Dossier Déclarant UE */}
      {showNewDossierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Globe2 className="w-5 h-5 text-brand-800" />
                <h3 className="font-bold text-slate-900 text-base">Générer un Dossier Déclarant Importateur UE</h3>
              </div>
              <button
                onClick={() => setShowNewDossierModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDossier} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Marchandise / Produit MACF</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Code NC {p.cn_code}) — {p.specific_total_emissions} tCO₂e/t
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom de l'importateur européen</label>
                  <input
                    type="text"
                    value={dossierImporterName}
                    onChange={e => setDossierImporterName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="ex: Thyssenkrupp Schulte GmbH"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pays membre UE (ISO)</label>
                  <input
                    type="text"
                    value={dossierImporterCountry}
                    onChange={e => setDossierImporterCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="DE, FR, IT, ES, etc."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Numéro EORI du déclarant UE</label>
                  <input
                    type="text"
                    value={dossierImporterEori}
                    onChange={e => setDossierImporterEori(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="ex: DE12345678901234"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Période de déclaration</label>
                  <input
                    type="text"
                    value={dossierPeriod}
                    onChange={e => setDossierPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="ex: 2026-Q1 ou 2026"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tonnage exporté (tonnes)</label>
                  <input
                    type="number"
                    value={dossierExportTonnes}
                    onChange={e => setDossierExportTonnes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Taxe carbone locale payée (MAD)</label>
                  <input
                    type="number"
                    value={dossierLocalCarbonPrice}
                    onChange={e => setDossierLocalCarbonPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewDossierModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDossier}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg font-semibold transition"
                >
                  {isSubmittingDossier ? 'Génération...' : 'Créer le Dossier Déclaration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Installation */}
      {showNewInstallationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-brand-800" />
                <h3 className="font-bold text-slate-900 text-base">Enregistrer une Installation de Production</h3>
              </div>
              <button
                onClick={() => setShowNewInstallationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInstallation} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom de l'installation / Usine</label>
                <input
                  type="text"
                  value={newInstName}
                  onChange={e => setNewInstName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="ex: Laminoir de Selouane - Nador"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={newInstCity}
                    onChange={e => setNewInstCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="ex: Nador"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code UN/LOCODE</label>
                  <input
                    type="text"
                    value={newInstUnlocode}
                    onChange={e => setNewInstUnlocode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="ex: MA NDR, MA CAS"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newInstLat}
                    onChange={e => setNewInstLat(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newInstLng}
                    onChange={e => setNewInstLng(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsable environnement / MACF</label>
                  <input
                    type="text"
                    value={newInstContact}
                    onChange={e => setNewInstContact(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email de contact</label>
                  <input
                    type="email"
                    value={newInstEmail}
                    onChange={e => setNewInstEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewInstallationModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInst}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg font-semibold transition"
                >
                  {isSubmittingInst ? 'Enregistrement...' : "Enregistrer l'Installation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
