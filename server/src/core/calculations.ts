/**
 * Atlas Carbone - Moteur de Calcul Déterministe et Traçable
 * Standards : GHG Protocol Corporate Standard, ISO 14064-1:2018, Règlementation MACF 2023/956 révisée
 */

import { convertQuantity, areUnitsCompatible, normalizeUnitCode } from './units.js';

// PRG officiels GIEC AR6 (horizon 100 ans)
export const IPCC_AR6_GWP_100: Record<string, number> = {
  'co2': 1,
  'ch4': 27.9,
  'n2o': 273,
  'sf6': 25200,
  'nf3': 17400,
  // Principaux fluides frigorigènes purs et mélanges (AR6)
  'r-134a': 1530,
  'r-32': 771,
  'r-125': 3740,
  'r-143a': 5810,
  'r-410a': 2256,
  'r-404a': 4272,
  'r-407c': 1908,
  'r-507a': 4319,
  'cf4': 7380,
  'c2f6': 12400
};

export interface EmissionFactorInput {
  id: string;
  name: string;
  value: number;
  numeratorUnit: string; // 'kgCO2e' ou 'kg'
  denominatorUnit: string;
  scope: number; // 1, 2, 3
  perimeter: 'combustion' | 'amont' | 'combustion_et_amont' | 'production_electrique' | 'pertes_reseau' | 'cycle_de_vie' | 'autre';
  gasType?: string; // e.g. 'co2', 'ch4', 'n2o', 'r-134a', 'sf6'
  isAlreadyCO2e: boolean;
  isBiogenic?: boolean;
  uncertaintyPct?: number; // ex: 0.10 pour 10%
  source?: string;
  version?: string;
}

export interface ActivityCalculationInput {
  activityId?: string;
  activityLabel: string;
  quantity: number;
  unit: string;
  factor: EmissionFactorInput;
  activityUncertaintyPct?: number; // ex: 0.05
  allowProvisionalScope1?: boolean; // si vrai, autorise un facteur amont+combustion avec avertissement explicite
  customGwp?: number;
  billAmountMad?: number;
  billPresetId?: string;
  unitPriceMad?: number;
}

export interface CalculationAuditTrace {
  inputQuantity: number;
  inputUnit: string;
  convertedQuantity: number;
  standardUnit: string;
  conversionExplanation: string;
  isMonetaryEstimate?: boolean;
  factorId: string;
  factorName: string;
  factorValue?: number;
  factorUnit: string;
  factorPerimeter: string;
  gwpApplied: number | null;
  formula: string;
  resultKgCO2e: number;
  resultTCO2e: number;
  uncertaintyRelativePct: number;
  uncertaintyAbsoluteKgCO2e: number;
  isBiogenic: boolean;
  warnings: string[];
  calculatedAtUtc: string;
}

export interface CalculationResult {
  emissionKgCO2e: number;
  emissionTCO2e: number;
  isBiogenic: boolean;
  uncertaintyRelative: number;
  uncertaintyAbsoluteKg: number;
  trace: CalculationAuditTrace;
}

/**
 * Calcul déterministe unitaire d'émission avec traçabilité intégrale
 */
export function calculateEmission(input: ActivityCalculationInput): CalculationResult {
  const warnings: string[] = [];

  // Règle 6 : Une activité sans quantité ou sans facteur reste non calculable
  if (input.quantity === null || input.quantity === undefined || isNaN(input.quantity)) {
    throw new Error(`Quantité d'activité manquante ou invalide pour '${input.activityLabel}'. Ne peut pas être calculé (ne vaut pas 0).`);
  }
  if (!input.factor) {
    throw new Error(`Facteur d'émission manquant pour '${input.activityLabel}'. L'activité reste non calculable.`);
  }

  // Règle 7 : Un facteur 'amont + combustion' sans décomposition ne peut pas être accepté comme Scope 1 pur
  if (input.factor.scope === 1 && input.factor.perimeter === 'combustion_et_amont') {
    if (!input.allowProvisionalScope1) {
      throw new Error(
        `Règle méthodologique ISO 14064 / GHG Protocol : Le facteur '${input.factor.name}' inclut l'amont et la combustion. Une empreinte de cycle de vie ne peut pas être affectée intégralement au Scope 1 sans ventilation préalable.`
      );
    } else {
      warnings.push("ATTENTION: Facteur mixte amont+combustion affecté au Scope 1 à titre provisoire.");
    }
  }

  // Conversion de l'unité d'activité vers l'unité du facteur (avec support factures MAD)
  const conversion = convertQuantity(input.quantity, input.unit, input.factor.denominatorUnit, {
    unitPriceMad: input.unitPriceMad,
    billPresetId: input.billPresetId
  });

  if (conversion.isMonetaryEstimate) {
    warnings.push(
      "Donnée d'activité dérivée d'une facture en Dirhams (MAD) : pour un audit ISO 14064 certifié, conservez la facture originale justifiant le calcul physique."
    );
  }

  let gwpFactor: number | null = null;
  let rawKg: number;

  // Règle 4 : Si facteur déjà en kgCO2e, AUCUN PRG supplémentaire n'est appliqué
  if (input.factor.isAlreadyCO2e) {
    rawKg = conversion.convertedValue * input.factor.value;
    gwpFactor = null;
  } else {
    // Si facteur en masse de gaz pur, multiplication obligatoire par le PRG AR6
    const gas = (input.factor.gasType || 'co2').toLowerCase();
    const gwp = input.customGwp !== undefined ? input.customGwp : (IPCC_AR6_GWP_100[gas] || 1);
    gwpFactor = gwp;
    rawKg = conversion.convertedValue * input.factor.value * gwp;
  }

  const resultKgCO2e = rawKg;
  const resultTCO2e = resultKgCO2e / 1000.0;

  // Calcul d'incertitude quadratique (u_rel = sqrt(u_A^2 + u_FE^2))
  // Majoration de 5% d'incertitude si dérivé d'une facture monétaire
  const baseUA = input.activityUncertaintyPct ?? 0.10;
  const uA = conversion.isMonetaryEstimate ? baseUA + 0.05 : baseUA;
  const uFE = input.factor.uncertaintyPct ?? 0.20;
  const uRel = Math.sqrt(Math.pow(uA, 2) + Math.pow(uFE, 2));
  const uAbsKg = resultKgCO2e * uRel;

  let formula = gwpFactor !== null
    ? `${conversion.convertedValue.toFixed(2)} ${input.factor.denominatorUnit} × [Facteur Certifié ${input.factor.id}] × PRG(${gwpFactor}) = ${resultKgCO2e.toFixed(4)} kgCO2e`
    : `${conversion.convertedValue.toFixed(2)} ${input.factor.denominatorUnit} × [Facteur Certifié ${input.factor.id}] = ${resultKgCO2e.toFixed(4)} kgCO2e`;

  if (conversion.isMonetaryEstimate) {
    formula = `[${conversion.explanation}] ➔ ${formula}`;
  }

  const trace: CalculationAuditTrace = {
    inputQuantity: input.quantity,
    inputUnit: input.unit,
    convertedQuantity: conversion.convertedValue,
    standardUnit: input.factor.denominatorUnit,
    conversionExplanation: conversion.explanation,
    isMonetaryEstimate: conversion.isMonetaryEstimate,
    factorId: input.factor.id,
    factorName: input.factor.name,
    // factorValue sanctuarisé côté serveur (non exposé au client)
    factorUnit: `${input.factor.numeratorUnit}/${input.factor.denominatorUnit}`,
    factorPerimeter: input.factor.perimeter,
    gwpApplied: gwpFactor,
    formula,
    resultKgCO2e,
    resultTCO2e,
    uncertaintyRelativePct: uRel * 100,
    uncertaintyAbsoluteKgCO2e: uAbsKg,
    isBiogenic: Boolean(input.factor.isBiogenic),
    warnings,
    calculatedAtUtc: new Date().toISOString()
  };

  return {
    emissionKgCO2e: resultKgCO2e,
    emissionTCO2e: resultTCO2e,
    isBiogenic: Boolean(input.factor.isBiogenic),
    uncertaintyRelative: uRel,
    uncertaintyAbsoluteKg: uAbsKg,
    trace
  };
}

/**
 * Calcul du Fret Tonne-Kilomètre : masse (tonnes) × distance (km)
 */
export function calculateFreightActivity(mass: number, massUnit: string, distance: number, distanceUnit: string): number {
  if (mass <= 0 || distance <= 0) {
    throw new Error("La masse et la distance doivent être strictement positives pour calculer le fret.");
  }
  const convMass = convertQuantity(mass, massUnit, 'tonne');
  const convDist = convertQuantity(distance, distanceUnit, 'km');
  return convMass.convertedValue * convDist.convertedValue;
}

/**
 * Agrégation des incertitudes indépendantes selon la méthode gaussienne
 * u_abs(Total) = sqrt(sum(u_abs_i^2))
 */
export function aggregateUncertainty(results: Array<{ emissionKgCO2e: number; uncertaintyAbsoluteKg: number }>): {
  totalKgCO2e: number;
  totalTCO2e: number;
  uncertaintyAbsoluteKg: number;
  uncertaintyRelativePct: number;
  confidenceInterval95Kg: { min: number; max: number };
} {
  const totalKg = results.reduce((sum, r) => sum + r.emissionKgCO2e, 0);
  const sumVariance = results.reduce((sum, r) => sum + Math.pow(r.uncertaintyAbsoluteKg, 2), 0);
  const totalUncertaintyAbsKg = Math.sqrt(sumVariance);
  const relPct = totalKg > 0 ? (totalUncertaintyAbsKg / totalKg) * 100 : 0;

  // Intervalle à 95% (k=1.96 sous hypothèse gaussienne documentée)
  const margin95 = 1.96 * totalUncertaintyAbsKg;

  return {
    totalKgCO2e: totalKg,
    totalTCO2e: totalKg / 1000.0,
    uncertaintyAbsoluteKg: totalUncertaintyAbsKg,
    uncertaintyRelativePct: relPct,
    confidenceInterval95Kg: {
      min: Math.max(0, totalKg - margin95),
      max: totalKg + margin95
    }
  };
}

/**
 * Allocation produit MACF / CBAM conforme au Règlement (UE) 2023/956 (Régime Définitif 2026)
 * Émissions intrinsèques spécifiques : SEE_total = SEE_dir + SEE_indir + SEE_pre
 */
export interface CBAMPrecursorItem {
  name: string;
  supplier?: string;
  country?: string;
  quantityPerTonne?: number; // tonnes de précurseur par tonne de produit
  specificEmissionsTCO2e?: number; // tCO2e par tonne de précurseur
  totalEmissionsTCO2e?: number;
}

export function calculateCBAMSpecificEmbeddedEmissions(input: {
  processEmissionsTCO2e?: number;
  processEmissionsDirectTCO2e?: number;
  directProcessEmissionsTCO2e?: number;
  indirectElectricityEmissionsTCO2e?: number;
  electricityIndirectTCO2e?: number;
  indirectElectricityMWh?: number;
  electricityEmissionFactorKgPerKWh?: number;
  precursorEmissionsTCO2e?: number;
  precursors?: CBAMPrecursorItem[];
  productionTonnage: number;
  cnCode: string;
  exportTonnage?: number;
  exportTonnageEU?: number;
  carbonPricePaidPerTonneMAD?: number;
  carbonPricePaidLocalPerTonneMAD?: number;
  euEtsBenchmarkPriceEUR?: number;
  etsBenchmarkPriceEURPerTCO2e?: number;
}): {
  specificEmbeddedEmissionsTCO2ePerTonne: number;
  specificDirectEmissionsTCO2ePerTonne: number;
  specificIndirectEmissionsTCO2ePerTonne: number;
  specificPrecursorEmissionsTCO2ePerTonne: number;
  specificDirectEmissions: number;
  specificIndirectEmissions: number;
  specificPrecursorEmissions: number;
  specificTotalEmissions: number;
  totalEmbeddedEmissionsTCO2e: number;
  totalExportEmbeddedEmissionsTCO2e: number;
  isEligibleSector: boolean;
  sectorName: string;
  deMinimisExemptionStatus: {
    isExempt: boolean;
    reason: string;
    thresholdTonnes: number;
  };
  economicImpact: {
    etsBenchmarkPriceEURPerTCO2e: number;
    estimatedCBAMCertificatesCostEUR: number;
    estimatedCBAMCertificatesCostMAD: number;
    carbonPricePaidLocalDeductedMAD: number;
    netPayableCertificatesEUR: number;
  };
  methodologicalNotes: string[];
  exportEmbeddedEmissions?: {
    exportTonnage: number;
    directTCO2e: number;
    indirectTCO2e: number;
    precursorTCO2e: number;
    totalEmbeddedTCO2e: number;
    estimatedEuCbamCertificatesCostEUR: number;
  };
  explanation: string;
} {
  // Règle 13 : Une masse de production nulle ou négative bloque formellement le calcul
  if (input.productionTonnage === undefined || input.productionTonnage === null || input.productionTonnage <= 0) {
    throw new Error(
      `Calcul d'intensité MACF bloqué : la masse de production déclarée est nulle ou négative (${input.productionTonnage} t). Le tonnage doit être strictement supérieur à zéro (impossible de diviser par zéro).`
    );
  }

  // 1. Émissions directes (combustion + procédés thermiques sur site)
  const directEmissions = Number(
    input.directProcessEmissionsTCO2e ??
    input.processEmissionsDirectTCO2e ??
    input.processEmissionsTCO2e ??
    0
  );

  // 2. Émissions indirectes (électricité)
  let indirectEmissions = Number(
    input.indirectElectricityEmissionsTCO2e ??
    input.electricityIndirectTCO2e ??
    0
  );
  if (input.indirectElectricityMWh && indirectEmissions === 0) {
    const efElec = input.electricityEmissionFactorKgPerKWh || 0.642602; // Mix moyen ONEE Maroc
    indirectEmissions = (input.indirectElectricityMWh * 1000 * efElec) / 1000.0;
  }

  // 3. Émissions des précurseurs incorporés
  let precursorEmissions = Number(input.precursorEmissionsTCO2e || 0);
  if (input.precursors && input.precursors.length > 0 && !input.precursorEmissionsTCO2e) {
    precursorEmissions = input.precursors.reduce((sum, p) => {
      if (p.totalEmissionsTCO2e) return sum + p.totalEmissionsTCO2e;
      if (p.quantityPerTonne && p.specificEmissionsTCO2e) {
        return sum + (p.quantityPerTonne * p.specificEmissionsTCO2e * input.productionTonnage);
      }
      return sum;
    }, 0);
  }

  // 4. Calcul des intensités spécifiques (SEE)
  const seeDir = directEmissions / input.productionTonnage;
  const seeIndir = indirectEmissions / input.productionTonnage;
  const seePre = precursorEmissions / input.productionTonnage;
  const seeTotal = seeDir + seeIndir + seePre;
  const totalEmissions = directEmissions + indirectEmissions + precursorEmissions;

  // 5. Identification du secteur MACF (Règlement UE 2023/956, Annexe I)
  const cleanCn = String(input.cnCode || '').replace(/\s+/g, '');
  let isKnownSector = false;
  let sectorName = 'Hors champ Annexe I';

  if (/^(72|73)/.test(cleanCn)) {
    isKnownSector = true;
    sectorName = 'Fer et Acier (Iron & Steel)';
  } else if (/^76/.test(cleanCn)) {
    isKnownSector = true;
    sectorName = 'Aluminium';
  } else if (/^2523/.test(cleanCn)) {
    isKnownSector = true;
    sectorName = 'Ciment (Cement)';
  } else if (/^(28|31)/.test(cleanCn)) {
    isKnownSector = true;
    sectorName = 'Engrais (Fertilizers)';
  } else if (/^280410/.test(cleanCn)) {
    isKnownSector = true;
    sectorName = 'Hydrogène (Hydrogen)';
  } else if (/^2716/.test(cleanCn)) {
    isKnownSector = true;
    sectorName = 'Électricité (Electricity)';
  }

  // 6. Volume exporté et impact économique
  const exportTonnage = input.exportTonnageEU ?? input.exportTonnage ?? 0;
  const expT = Number(exportTonnage);
  const expDirect = expT * seeDir;
  const expIndirect = expT * seeIndir;
  const expPrecursor = expT * seePre;
  const expTotal = expT * seeTotal;

  const etsBenchmark = Number(input.etsBenchmarkPriceEURPerTCO2e ?? input.euEtsBenchmarkPriceEUR ?? 65.0);
  const localCarbonTaxMAD = Number(input.carbonPricePaidLocalPerTonneMAD ?? input.carbonPricePaidPerTonneMAD ?? 0);
  const costEUR = expTotal * etsBenchmark;
  const costMAD = costEUR * 10.8; // Cours indicatif de référence EUR/MAD

  const deMinimisReason = expT > 0 && expT < 50
    ? "Export inférieur à 50 t : Exemption de minimis possible mais s'apprécie sur le cumul annuel total de l'importateur européen (Règlement UE 2023/956, Art. 2.3)."
    : "Non exempté (soumis aux obligations de déclaration et restitution de certificats MACF).";

  return {
    specificEmbeddedEmissionsTCO2ePerTonne: Number(seeTotal.toFixed(4)),
    specificDirectEmissionsTCO2ePerTonne: Number(seeDir.toFixed(4)),
    specificIndirectEmissionsTCO2ePerTonne: Number(seeIndir.toFixed(4)),
    specificPrecursorEmissionsTCO2ePerTonne: Number(seePre.toFixed(4)),
    specificDirectEmissions: Number(seeDir.toFixed(4)),
    specificIndirectEmissions: Number(seeIndir.toFixed(4)),
    specificPrecursorEmissions: Number(seePre.toFixed(4)),
    specificTotalEmissions: Number(seeTotal.toFixed(4)),
    totalEmbeddedEmissionsTCO2e: Number(totalEmissions.toFixed(3)),
    totalExportEmbeddedEmissionsTCO2e: Number(expTotal.toFixed(3)),
    isEligibleSector: isKnownSector,
    sectorName,
    deMinimisExemptionStatus: {
      isExempt: false,
      thresholdTonnes: 50,
      reason: deMinimisReason
    },
    economicImpact: {
      etsBenchmarkPriceEURPerTCO2e: etsBenchmark,
      estimatedCBAMCertificatesCostEUR: Number(costEUR.toFixed(2)),
      estimatedCBAMCertificatesCostMAD: Number(costMAD.toFixed(2)),
      carbonPricePaidLocalDeductedMAD: localCarbonTaxMAD,
      netPayableCertificatesEUR: Number(costEUR.toFixed(2))
    },
    methodologicalNotes: [
      "Conforme à l'Annexe IV du Règlement (UE) 2023/956 pour marchandises simples et complexes.",
      "Séparation stricte des émissions de procédé (Scope 1) et de l'électricité réseau ONEE (Scope 2).",
      "Émissions incorporées des précurseurs tracées individuellement avec certificats fournisseurs."
    ],
    exportEmbeddedEmissions: expT > 0 ? {
      exportTonnage: expT,
      directTCO2e: Number(expDirect.toFixed(3)),
      indirectTCO2e: Number(expIndirect.toFixed(3)),
      precursorTCO2e: Number(expPrecursor.toFixed(3)),
      totalEmbeddedTCO2e: Number(expTotal.toFixed(3)),
      estimatedEuCbamCertificatesCostEUR: Number(costEUR.toFixed(2))
    } : undefined,
    explanation: `SEE_total = ${seeDir.toFixed(4)} (direct) + ${seeIndir.toFixed(4)} (indirect) + ${seePre.toFixed(4)} (précurseurs) = ${seeTotal.toFixed(4)} tCO2e/t [Total = ${totalEmissions.toFixed(2)} tCO2e sur ${input.productionTonnage} t produites]`
  };
}
