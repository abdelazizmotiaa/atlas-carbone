/**
 * Atlas Carbone - Module de gestion des Unités, Conversions Physiques et Conversions de Factures (MAD -> Physique)
 * Adapté spécifiquement aux entreprises, comptables et PME marocaines.
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
  symbol: string;
}

export const UNIT_REGISTRY: Record<string, UnitDefinition> = {
  // Énergie (référence: kWh)
  'kwh': { code: 'kWh', dimension: 'energy', baseRatio: 1.0, label: 'Kilowattheure', symbol: 'kWh' },
  'mwh': { code: 'MWh', dimension: 'energy', baseRatio: 1000.0, label: 'Mégawattheure', symbol: 'MWh' },
  'gwh': { code: 'GWh', dimension: 'energy', baseRatio: 1000000.0, label: 'Gigawattheure', symbol: 'GWh' },
  'gj': { code: 'GJ', dimension: 'energy', baseRatio: 277.7777777777778, label: 'Gigajoule', symbol: 'GJ' },
  'mj': { code: 'MJ', dimension: 'energy', baseRatio: 0.2777777777777778, label: 'Mégajoule', symbol: 'MJ' },
  'tep': { code: 'tep', dimension: 'energy', baseRatio: 11630.0, label: 'Tonne équivalent pétrole', symbol: 'tep' },

  // Masse (référence: kg)
  'kg': { code: 'kg', dimension: 'mass', baseRatio: 1.0, label: 'Kilogramme', symbol: 'kg' },
  'kilogramme': { code: 'kg', dimension: 'mass', baseRatio: 1.0, label: 'Kilogramme', symbol: 'kg' },
  'kilogrammes': { code: 'kg', dimension: 'mass', baseRatio: 1.0, label: 'Kilogrammes', symbol: 'kg' },
  't': { code: 'tonne', dimension: 'mass', baseRatio: 1000.0, label: 'Tonne', symbol: 't' },
  'tonne': { code: 'tonne', dimension: 'mass', baseRatio: 1000.0, label: 'Tonne', symbol: 't' },
  'tonnes': { code: 'tonne', dimension: 'mass', baseRatio: 1000.0, label: 'Tonnes', symbol: 't' },
  'g': { code: 'g', dimension: 'mass', baseRatio: 0.001, label: 'Gramme', symbol: 'g' },
  'gramme': { code: 'g', dimension: 'mass', baseRatio: 0.001, label: 'Gramme', symbol: 'g' },
  'quintal': { code: 'quintal', dimension: 'mass', baseRatio: 100.0, label: 'Quintal (100 kg)', symbol: 'q' },
  'q': { code: 'quintal', dimension: 'mass', baseRatio: 100.0, label: 'Quintal', symbol: 'q' },

  // Volume (référence: litre)
  'l': { code: 'litre', dimension: 'volume', baseRatio: 1.0, label: 'Litre', symbol: 'L' },
  'litre': { code: 'litre', dimension: 'volume', baseRatio: 1.0, label: 'Litre', symbol: 'L' },
  'litres': { code: 'litre', dimension: 'volume', baseRatio: 1.0, label: 'Litres', symbol: 'L' },
  'm3': { code: 'm3', dimension: 'volume', baseRatio: 1000.0, label: 'Mètre cube', symbol: 'm³' },
  'm³': { code: 'm3', dimension: 'volume', baseRatio: 1000.0, label: 'Mètre cube', symbol: 'm³' },
  'hl': { code: 'hl', dimension: 'volume', baseRatio: 100.0, label: 'Hectolitre (100 L)', symbol: 'hL' },

  // Distance (référence: km)
  'km': { code: 'km', dimension: 'distance', baseRatio: 1.0, label: 'Kilomètre', symbol: 'km' },
  'kilometre': { code: 'km', dimension: 'distance', baseRatio: 1.0, label: 'Kilomètre', symbol: 'km' },
  'kilometres': { code: 'km', dimension: 'distance', baseRatio: 1.0, label: 'Kilomètres', symbol: 'km' },

  // Fret de marchandises (référence: tonne-km)
  't.km': { code: 'tonne-km', dimension: 'freight', baseRatio: 1.0, label: 'Tonne-kilomètre', symbol: 't.km' },
  'tonne-km': { code: 'tonne-km', dimension: 'freight', baseRatio: 1.0, label: 'Tonne-kilomètre', symbol: 't.km' },
  'tkm': { code: 'tonne-km', dimension: 'freight', baseRatio: 1.0, label: 'Tonne-kilomètre', symbol: 't.km' },

  // Déplacements passagers (référence: passager-km)
  'p.km': { code: 'passager-km', dimension: 'passenger_distance', baseRatio: 1.0, label: 'Passager-kilomètre', symbol: 'p.km' },
  'passager-km': { code: 'passager-km', dimension: 'passenger_distance', baseRatio: 1.0, label: 'Passager-kilomètre', symbol: 'p.km' },
  'pkm': { code: 'passager-km', dimension: 'passenger_distance', baseRatio: 1.0, label: 'Passager-kilomètre', symbol: 'p.km' },

  // Unité physique discrète (référence: unite)
  'unite': { code: 'unite', dimension: 'item', baseRatio: 1.0, label: 'Unité', symbol: 'u' },
  'unites': { code: 'unite', dimension: 'item', baseRatio: 1.0, label: 'Unités', symbol: 'u' },
  'appareil': { code: 'appareil', dimension: 'item', baseRatio: 1.0, label: 'Appareil', symbol: 'app' },
  'nombre': { code: 'nombre', dimension: 'item', baseRatio: 1.0, label: 'Nombre', symbol: 'nb' },

  // Monétaire (référence: MAD)
  'mad': { code: 'MAD', dimension: 'currency', baseRatio: 1.0, label: 'Dirham marocain', symbol: 'MAD' },
  'dh': { code: 'MAD', dimension: 'currency', baseRatio: 1.0, label: 'Dirham marocain', symbol: 'DH' },
  'dhs': { code: 'MAD', dimension: 'currency', baseRatio: 1.0, label: 'Dirhams marocains', symbol: 'DH' },
  'kmad': { code: 'kMAD', dimension: 'currency', baseRatio: 1000.0, label: 'Millier de Dirhams (1 000 MAD)', symbol: 'kMAD' },
  'eur': { code: 'EUR', dimension: 'currency', baseRatio: 10.85, label: 'Euro (€)', symbol: '€' },
  'usd': { code: 'USD', dimension: 'currency', baseRatio: 9.95, label: 'Dollar US ($)', symbol: '$' }
};

/**
 * Référentiel des tarifs officiels et moyens marocains pour convertir des factures (MAD)
 * en données d'activité physique (kWh, Litres, Tonnes, m3).
 */
export interface BillConversionPreset {
  id: string;
  nameFr: string;
  nameEn: string;
  categoryFr: string;
  targetUnit: string;
  defaultPriceMad: number; // Prix moyen en Dirhams par unité physique
  priceUnit: string;
  sourceFr: string;
  sourceEn: string;
  suggestedFactorId: string;
  scope: number;
  descriptionFr: string;
  descriptionEn: string;
}

export const BILL_CONVERSION_PRESETS: Record<string, BillConversionPreset> = {
  'electricite_onee_mt_indus': {
    id: 'electricite_onee_mt_indus',
    nameFr: "Électricité réseau ONEE (Moyenne Tension - PME & Industrie)",
    nameEn: "ONEE Grid Electricity (Medium Voltage - SME & Industry)",
    categoryFr: "Électricité réseau",
    targetUnit: "kWh",
    defaultPriceMad: 1.15,
    priceUnit: "MAD / kWh HT",
    sourceFr: "Grille tarifaire ONEE - Tarifs moyens industriels et tertiaires",
    sourceEn: "ONEE Official Tariff Grid - Average Commercial/Industrial Rates",
    suggestedFactorId: "FE-MA-0671",
    scope: 2,
    descriptionFr: "Pour les usines, ateliers et grands bureaux alimentés en Moyenne Tension. 10 000 MAD ≈ 8 695 kWh.",
    descriptionEn: "For manufacturing plants, workshops, and large offices on Medium Voltage. 10,000 MAD ≈ 8,695 kWh."
  },
  'electricite_onee_bt_pro': {
    id: 'electricite_onee_bt_pro',
    nameFr: "Électricité réseau ONEE / Régie (Basse Tension - Bureaux, Commerces)",
    nameEn: "ONEE / Local Utility Electricity (Low Voltage - Commercial, Retail)",
    categoryFr: "Électricité réseau",
    targetUnit: "kWh",
    defaultPriceMad: 1.25,
    priceUnit: "MAD / kWh HT",
    sourceFr: "Grille tarifaire ONEE / Régies locales (Lydec, Redal, Amendis, Radeema)",
    sourceEn: "ONEE & Municipal Utilities Tariffs",
    suggestedFactorId: "FE-MA-0671",
    scope: 2,
    descriptionFr: "Pour les bureaux administratifs, commerces et petites agences. 5 000 MAD ≈ 4 000 kWh.",
    descriptionEn: "For administrative offices, retail shops, and branches. 5,000 MAD ≈ 4,000 kWh."
  },
  'electricite_onee_ht_indus': {
    id: 'electricite_onee_ht_indus',
    nameFr: "Électricité réseau ONEE (Haute Tension - Grande Industrie)",
    nameEn: "ONEE Grid Electricity (High Voltage - Heavy Industry)",
    categoryFr: "Électricité réseau",
    targetUnit: "kWh",
    defaultPriceMad: 0.98,
    priceUnit: "MAD / kWh HT",
    sourceFr: "Contrats industriels Grands Comptes ONEE",
    sourceEn: "ONEE Key Account Industrial Supply Contracts",
    suggestedFactorId: "FE-MA-0671",
    scope: 2,
    descriptionFr: "Grandes installations sidérurgiques, cimenteries, chimie. 50 000 MAD ≈ 51 020 kWh.",
    descriptionEn: "Heavy industrial operations (steel, cement, chemicals). 50,000 MAD ≈ 51,020 kWh."
  },
  'gasoil_flotte': {
    id: 'gasoil_flotte',
    nameFr: "Gasoil / Diesel (Cartes carburant Afriquia, Shell, TotalEnergies, Winxo)",
    nameEn: "Diesel Fuel (Fleet fuel cards - Afriquia, Shell, TotalEnergies)",
    categoryFr: "Combustion mobile",
    targetUnit: "litre",
    defaultPriceMad: 12.50,
    priceUnit: "MAD / Litre TTC",
    sourceFr: "Barème moyen du marché marocain des carburants (Casablanca / Régions)",
    sourceEn: "Moroccan Fuel Market Average Pump Price Benchmark",
    suggestedFactorId: "FE-MA-0029",
    scope: 1,
    descriptionFr: "Flotte utilitaire, véhicules commerciaux, camions et groupes diesel. 10 000 MAD ≈ 800 Litres.",
    descriptionEn: "Company utility vans, commercial cars, trucks, and diesel gensets. 10,000 MAD ≈ 800 Liters."
  },
  'essence_flotte': {
    id: 'essence_flotte',
    nameFr: "Essence Super Sans Plomb (Flotte de véhicules)",
    nameEn: "Unleaded Gasoline / Petrol (Passenger Fleet)",
    categoryFr: "Combustion mobile",
    targetUnit: "litre",
    defaultPriceMad: 14.20,
    priceUnit: "MAD / Litre TTC",
    sourceFr: "Barème moyen du marché marocain des carburants",
    sourceEn: "Moroccan Average Gasoline Pump Price",
    suggestedFactorId: "FE-MA-0030",
    scope: 1,
    descriptionFr: "Véhicules de fonction et véhicules légers à essence. 5 000 MAD ≈ 352 Litres.",
    descriptionEn: "Gasoline company vehicles and runabouts. 5,000 MAD ≈ 352 Liters."
  },
  'propane_vrac_citerne': {
    id: 'propane_vrac_citerne',
    nameFr: "Gaz Propane en Citerne Vrac (Industrie, Hôtellerie, Chaudières)",
    nameEn: "Bulk Propane Tank Deliveries (Industry, Hospitality, Boilers)",
    categoryFr: "Combustion fixe",
    targetUnit: "tonne",
    defaultPriceMad: 11000.0,
    priceUnit: "MAD / Tonne HT",
    sourceFr: "Bons de livraison distributeurs gaz vrac (Afriquia Gaz, Salam Gaz, Total)",
    sourceEn: "Bulk Propane Distributor Invoices",
    suggestedFactorId: "FE-MA-0020",
    scope: 1,
    descriptionFr: "Citernes fixes de stockage pour chaudières vapeur, fours ou eau chaude. 55 000 MAD ≈ 5 Tonnes.",
    descriptionEn: "Stationary bulk gas tanks for steam boilers, ovens, or central water heating. 55,000 MAD ≈ 5 Tonnes."
  },
  'butane_bouteille_12kg': {
    id: 'butane_bouteille_12kg',
    nameFr: "Gaz Butane en Bouteille (12 kg - Prix subventionné)",
    nameEn: "Bottled Butane Gas Cylinder (12 kg - Subsidized Rate)",
    categoryFr: "Combustion fixe",
    targetUnit: "kg",
    defaultPriceMad: 4.17, // 50 MAD / 12 kg
    priceUnit: "MAD / kg (50 MAD / bonbonne)",
    sourceFr: "Prix réglementé Caisse de Compensation Maroc (50 MAD / bonbonne)",
    sourceEn: "Moroccan Compensation Fund Regulated Cylinder Price",
    suggestedFactorId: "FE-MA-0011",
    scope: 1,
    descriptionFr: "Bouteilles de gaz domestiques et petites cuisines. 10 bonbonnes (500 MAD) = 120 kg de butane.",
    descriptionEn: "Standard 12 kg cylinders. 10 cylinders (500 MAD) = 120 kg of butane."
  },
  'fioul_lourd_indus': {
    id: 'fioul_lourd_indus',
    nameFr: "Fioul Lourd N°2 Industriel (Chaudières & Fours d'usine)",
    nameEn: "Heavy Fuel Oil No. 2 (Industrial Boilers & Furnaces)",
    categoryFr: "Combustion fixe",
    targetUnit: "tonne",
    defaultPriceMad: 5800.0,
    priceUnit: "MAD / Tonne HT",
    sourceFr: "Factures d'approvisionnement hydrocarbures industriels",
    sourceEn: "Industrial Heavy Fuel Supply Contracts",
    suggestedFactorId: "FE-MA-0005",
    scope: 1,
    descriptionFr: "Grosses chaudières de sucreries, textiles, chimie, mines. 116 000 MAD ≈ 20 Tonnes.",
    descriptionEn: "Heavy process steam boilers in textile, food processing, or chemicals. 116,000 MAD ≈ 20 Tonnes."
  },
  'eau_reseau_onep': {
    id: 'eau_reseau_onep',
    nameFr: "Eau Potable de Réseau (ONEP / Lydec / Amendis / Redal)",
    nameEn: "Mains Tap Water Supply (ONEP / Municipal Water Utilities)",
    categoryFr: "Achats & Consommables",
    targetUnit: "m3",
    defaultPriceMad: 8.50,
    priceUnit: "MAD / m³ HT",
    sourceFr: "Factures régies de distribution d'eau potable au Maroc",
    sourceEn: "Moroccan Municipal Water Utility Tariffs",
    suggestedFactorId: "FE-MA-0150",
    scope: 3,
    descriptionFr: "Consommation d'eau sanitaire et industrielle du réseau. 4 250 MAD ≈ 500 m³.",
    descriptionEn: "Sanitary and industrial piped water. 4,250 MAD ≈ 500 m³."
  }
};

/**
 * Nettoyage et normalisation de la chaîne de l'unité
 */
export function normalizeUnitCode(rawUnit: string): string {
  if (!rawUnit) return 'inconnu';
  const clean = rawUnit.trim().toLowerCase()
    .replace('passager.km', 'passager-km')
    .replace('tonne.km', 'tonne-km')
    .replace('kgco2e/', '')
    .replace('kgco2/', '')
    .replace('/', '')
    .replace('m³', 'm3')
    .replace('tonnes', 'tonne')
    .replace('litres', 'litre')
    .replace('kilogrammes', 'kg')
    .replace('kilogramme', 'kg')
    .replace('dirhams', 'mad')
    .replace('dirham', 'mad')
    .replace('dhs', 'mad')
    .replace('dh', 'mad');
  return clean;
}

/**
 * Vérifie si deux unités partagent la même dimension physique
 */
export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const normA = normalizeUnitCode(unitA);
  const normB = normalizeUnitCode(unitB);
  const defA = UNIT_REGISTRY[normA];
  const defB = UNIT_REGISTRY[normB];
  if (!defA || !defB) return false;
  return defA.dimension === defB.dimension;
}

/**
 * Options étendues pour conversion de quantités (y compris conversion monétaire -> physique)
 */
export interface ConversionOptions {
  unitPriceMad?: number;
  billPresetId?: string;
  sourceExplanation?: string;
}

/**
 * Conversion déterministe entre unités physiques (avec support de conversion de factures MAD)
 */
export function convertQuantity(
  value: number, 
  fromUnit: string, 
  toUnit: string,
  options?: ConversionOptions
): {
  convertedValue: number;
  factorUsed: number;
  explanation: string;
  isMonetaryEstimate?: boolean;
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

  // Cas spécial : Conversion d'une dépense en MAD vers une unité physique (kWh, Litre, Tonne, etc.)
  if (defFrom && defFrom.dimension === 'currency' && defTo && defTo.dimension !== 'currency') {
    let unitPrice = options?.unitPriceMad;
    let presetLabel = "Tarif personnalisé";

    if (!unitPrice && options?.billPresetId && BILL_CONVERSION_PRESETS[options.billPresetId]) {
      const preset = BILL_CONVERSION_PRESETS[options.billPresetId];
      unitPrice = preset.defaultPriceMad;
      presetLabel = preset.nameFr;
    }

    if (!unitPrice || unitPrice <= 0) {
      throw new Error(
        `Conversion d'une facture en Dirhams (${value} MAD) vers '${defTo.label}' impossible : aucun tarif unitaire en MAD/${defTo.code} n'a été spécifié. Veuillez renseigner le tarif unitaire de votre facture (ex: 1.15 MAD/kWh pour l'électricité ONEE ou 12.50 MAD/L pour le gasoil).`
      );
    }

    // Montant en MAD divisé par le tarif unitaire = quantité physique
    const physicalAmountInTarget = value / unitPrice;

    return {
      convertedValue: physicalAmountInTarget,
      factorUsed: 1 / unitPrice,
      isMonetaryEstimate: true,
      explanation: `Conversion Facture Comptable : ${value.toLocaleString('fr-FR')} MAD ÷ ${unitPrice} MAD/${defTo.code} (${presetLabel}) = ${physicalAmountInTarget.toFixed(2)} ${defTo.code}`
    };
  }

  if (!defFrom || !defTo) {
    throw new Error(`Unité non reconnue dans le référentiel physique: '${fromUnit}' ou '${toUnit}'`);
  }

  if (defFrom.dimension !== defTo.dimension) {
    throw new Error(
      `Incompatibilité de dimensions physiques : conversion impossible entre '${defFrom.label}' (${defFrom.dimension}) et '${defTo.label}' (${defTo.dimension}) sans paramètre physique supplémentaire (densité ou PCI sourcé).`
    );
  }

  // Conversion intra-dimensionnelle (ex: tonne -> kg, MWh -> kWh, g -> kg)
  const ratio = defFrom.baseRatio / defTo.baseRatio;
  const converted = value * ratio;

  return {
    convertedValue: converted,
    factorUsed: ratio,
    isMonetaryEstimate: false,
    explanation: `${value} ${defFrom.code} × ${ratio} = ${converted} ${defTo.code}`
  };
}

/**
 * Assistant de conversion de facture : transforme un montant en MAD en quantité physique utilisable
 */
export function convertBillToPhysical(
  amountMad: number,
  presetKey: string,
  customUnitPrice?: number
): {
  physicalQuantity: number;
  physicalUnit: string;
  unitPriceUsed: number;
  preset: BillConversionPreset;
  explanationFr: string;
  explanationEn: string;
} {
  const preset = BILL_CONVERSION_PRESETS[presetKey];
  if (!preset) {
    throw new Error(`Modèle de facture inconnu : '${presetKey}'`);
  }

  const price = customUnitPrice && customUnitPrice > 0 ? customUnitPrice : preset.defaultPriceMad;
  const physicalQuantity = amountMad / price;

  return {
    physicalQuantity: Math.round(physicalQuantity * 1000) / 1000,
    physicalUnit: preset.targetUnit,
    unitPriceUsed: price,
    preset,
    explanationFr: `Facture de ${amountMad.toLocaleString('fr-FR')} MAD ÷ ${price} ${preset.priceUnit} = ${physicalQuantity.toFixed(2)} ${preset.targetUnit} (${preset.nameFr})`,
    explanationEn: `Invoice of ${amountMad.toLocaleString('en-US')} MAD ÷ ${price} ${preset.priceUnit} = ${physicalQuantity.toFixed(2)} ${preset.targetUnit} (${preset.nameEn})`
  };
}
