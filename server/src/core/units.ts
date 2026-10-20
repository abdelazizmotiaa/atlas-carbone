/**
 * Atlas Carbone - Module de gestion des Unités et Conversions Physiques
 */

export type PhysicalDimension = 
  | 'energy'
  | 'mass'
  | 'volume'
  | 'distance'
  | 'freight'
  | 'passenger_distance'
  | 'item'
  | 'currency';

export interface UnitDefinition {
  code: string;
  dimension: PhysicalDimension;
  baseRatio: number; // Ratio par rapport à l'unité de référence de la dimension
  label: string;
}

export const UNIT_REGISTRY: Record<string, UnitDefinition> = {
  // Énergie (référence: kWh)
  'kwh': { code: 'kWh', dimension: 'energy', baseRatio: 1.0, label: 'Kilowattheure' },
  'mwh': { code: 'MWh', dimension: 'energy', baseRatio: 1000.0, label: 'Mégawattheure' },
  'gj': { code: 'GJ', dimension: 'energy', baseRatio: 277.7777777777778, label: 'Gigajoule' },
  'tep': { code: 'tep', dimension: 'energy', baseRatio: 11630.0, label: 'Tonne équivalent pétrole' },

  // Masse (référence: kg)
  'kg': { code: 'kg', dimension: 'mass', baseRatio: 1.0, label: 'Kilogramme' },
  't': { code: 'tonne', dimension: 'mass', baseRatio: 1000.0, label: 'Tonne' },
  'tonne': { code: 'tonne', dimension: 'mass', baseRatio: 1000.0, label: 'Tonne' },
  'g': { code: 'g', dimension: 'mass', baseRatio: 0.001, label: 'Gramme' },

  // Volume (référence: litre)
  'l': { code: 'litre', dimension: 'volume', baseRatio: 1.0, label: 'Litre' },
  'litre': { code: 'litre', dimension: 'volume', baseRatio: 1.0, label: 'Litre' },
  'm3': { code: 'm3', dimension: 'volume', baseRatio: 1000.0, label: 'Mètre cube' },

  // Distance (référence: km)
  'km': { code: 'km', dimension: 'distance', baseRatio: 1.0, label: 'Kilomètre' },

  // Fret de marchandises (référence: tonne-km)
  't.km': { code: 'tonne-km', dimension: 'freight', baseRatio: 1.0, label: 'Tonne-kilomètre' },
  'tonne-km': { code: 'tonne-km', dimension: 'freight', baseRatio: 1.0, label: 'Tonne-kilomètre' },
  'tkm': { code: 'tonne-km', dimension: 'freight', baseRatio: 1.0, label: 'Tonne-kilomètre' },

  // Déplacements passagers (référence: passager-km)
  'p.km': { code: 'passager-km', dimension: 'passenger_distance', baseRatio: 1.0, label: 'Passager-kilomètre' },
  'passager-km': { code: 'passager-km', dimension: 'passenger_distance', baseRatio: 1.0, label: 'Passager-kilomètre' },
  'pkm': { code: 'passager-km', dimension: 'passenger_distance', baseRatio: 1.0, label: 'Passager-kilomètre' },

  // Unité physique discrète (référence: unite)
  'unite': { code: 'unite', dimension: 'item', baseRatio: 1.0, label: 'Unité' },
  'appareil': { code: 'appareil', dimension: 'item', baseRatio: 1.0, label: 'Appareil' },

  // Monétaire (référence: MAD)
  'mad': { code: 'MAD', dimension: 'currency', baseRatio: 1.0, label: 'Dirham marocain' },
  'eur': { code: 'EUR', dimension: 'currency', baseRatio: 10.85, label: 'Euro' } // Taux indicatif documenté
};

export function normalizeUnitCode(rawUnit: string): string {
  if (!rawUnit) return 'inconnu';
  const clean = rawUnit.trim().toLowerCase()
    .replace('passager.km', 'passager-km')
    .replace('tonne.km', 'tonne-km')
    .replace('kgco2e/', '')
    .replace('kgco2/', '')
    .replace('/', '');
  return clean;
}

export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const normA = normalizeUnitCode(unitA);
  const normB = normalizeUnitCode(unitB);
  const defA = UNIT_REGISTRY[normA];
  const defB = UNIT_REGISTRY[normB];
  if (!defA || !defB) return false;
  return defA.dimension === defB.dimension;
}

export function convertQuantity(value: number, fromUnit: string, toUnit: string): {
  convertedValue: number;
  factorUsed: number;
  explanation: string;
} {
  const normFrom = normalizeUnitCode(fromUnit);
  const normTo = normalizeUnitCode(toUnit);

  if (normFrom === normTo) {
    return {
      convertedValue: value,
      factorUsed: 1.0,
      explanation: `Aucune conversion requise (${normFrom} = ${normTo})`
    };
  }

  const defFrom = UNIT_REGISTRY[normFrom];
  const defTo = UNIT_REGISTRY[normTo];

  if (!defFrom || !defTo) {
    throw new Error(`Unité non reconnue dans le référentiel physique: '${fromUnit}' ou '${toUnit}'`);
  }

  if (defFrom.dimension !== defTo.dimension) {
    throw new Error(
      `Incompatibilité de dimensions physiques : conversion impossible entre '${defFrom.label}' (${defFrom.dimension}) et '${defTo.label}' (${defTo.dimension}) sans paramètre physique supplémentaire (densité ou PCI sourcé).`
    );
  }

  // Conversion via l'unité de base
  const ratio = defFrom.baseRatio / defTo.baseRatio;
  const converted = value * ratio;

  return {
    convertedValue: converted,
    factorUsed: ratio,
    explanation: `${value} ${defFrom.code} × ${ratio} = ${converted} ${defTo.code}`
  };
}
