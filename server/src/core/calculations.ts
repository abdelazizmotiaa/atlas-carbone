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
 * Allocation produit MACF / CBAM
 * Émissions intrinsèques spécifiques : SEE = (AttrEm + PrecursorEm) / ProducedTonnage
 */
export function calculateCBAMSpecificEmbeddedEmissions(input: {
  processEmissionsTCO2e: number;
  precursorEmissionsTCO2e: number;
  productionTonnage: number;
  cnCode: string;
}): {
  specificEmbeddedEmissionsTCO2ePerTonne: number;
  totalEmbeddedEmissionsTCO2e: number;
  isEligibleSector: boolean;
  explanation: string;
} {
  // Règle 13 : Une masse de production nulle bloque l'intensité
  if (input.productionTonnage <= 0) {
    throw new Error(
      `Calcul d'intensité MACF bloqué : la masse de production déclarée est nulle ou négative (${input.productionTonnage} t). Impossible de diviser par zéro.`
    );
  }

  // Vérification code NC (CN Code)
  // Les 6 secteurs de départ : Ciment (2523), Fer/Acier (72xx, 73xx), Aluminium (76xx), Engrais (28xx, 31xx), Électricité (2716), Hydrogène (2804 10 00)
  const cleanCn = input.cnCode.replace(/\s+/g, '');
  const isKnownSector = /^(2523|72|73|76|28|31|2716|280410)/.test(cleanCn);

  const totalEmissions = input.processEmissionsTCO2e + input.precursorEmissionsTCO2e;
  const see = totalEmissions / input.productionTonnage;

  return {
    specificEmbeddedEmissionsTCO2ePerTonne: see,
    totalEmbeddedEmissionsTCO2e: totalEmissions,
    isEligibleSector: isKnownSector,
    explanation: `(${input.processEmissionsTCO2e} tCO2e procédé + ${input.precursorEmissionsTCO2e} tCO2e précurseurs) / ${input.productionTonnage} t produites = ${see} tCO2e/tonne`
  };
}
