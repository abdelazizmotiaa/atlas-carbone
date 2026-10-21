/**
 * Atlas Carbone - Définitions TypeScript partagées pour l'interface client
 */

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  is_superadmin: number;
}

export interface Organization {
  id: string;
  name: string;
  legal_type?: string;
  ice?: string;
  city?: string;
  sector?: string;
  logo_url?: string;
  role?: string;
}

export interface Site {
  id: string;
  organization_id: string;
  name: string;
  city: string;
  address?: string;
  manager_user_id?: string;
}

export interface ReportingPeriod {
  id: string;
  organization_id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  consolidation_approach: string;
  status: 'draft' | 'collection' | 'in_review' | 'corrections_requested' | 'validated' | 'closed';
  revenue_mad?: number | null;
  employee_count?: number | null;
  production_units?: number | null;
  production_unit_name?: string | null;
  closed_at?: string;
  closed_by?: string;
  created_at: string;
}

export interface EmissionFactor {
  id: string;
  version: string;
  name: string;
  category: string;
  scope: number;
  iso_category: number;
  ghg_category: string;
  value: number;
  numerator_unit: string;
  denominator_unit: string;
  raw_unit?: string;
  perimeter: string;
  geography: string;
  reference_year: number;
  source: string;
  sheet_origin?: string;
  row_origin?: number;
  uncertainty_pct: number;
  status: 'extracted' | 'to_verify' | 'validated' | 'rejected' | 'archived';
  verification_note?: string;
  access_level: string;
}

export interface CalculationTrace {
  inputQuantity: number;
  inputUnit: string;
  convertedQuantity: number;
  standardUnit: string;
  conversionExplanation: string;
  isMonetaryEstimate?: boolean;
  billAmountMad?: number;
  billPresetId?: string;
  unitPriceMad?: number;
  factorId: string;
  factorName: string;
  factorValue: number;
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

export interface ActivityRecord {
  id: string;
  reporting_period_id: string;
  site_id: string;
  site_name?: string;
  organization_id: string;
  category: string;
  scope: number;
  iso_category: number;
  label: string;
  quantity: number;
  unit: string;
  factor_id: string;
  factor_version: string;
  emission_kg_co2e: number;
  emission_t_co2e: number;
  is_biogenic: number;
  uncertainty_relative?: number;
  uncertainty_absolute_kg?: number;
  calculation_trace_json: string;
  invoice_ref?: string;
  supplier_name?: string;
  evidence_url?: string;
  evidence_file_name?: string;
  evidence_file_size?: number;
  evidence_uploaded_at?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface OverviewData {
  period: ReportingPeriod | null;
  summary: {
    totalTCO2e: number;
    scope1TCO2e: number;
    scope2TCO2e: number;
    scope3TCO2e: number;
    biogenicTCO2e: number;
    totalActivitiesCount: number;
    intensityRevenueTCO2ePerMMad?: number | null;
    intensityEmployeeTCO2ePerEmployee?: number | null;
    intensityProductionTCO2ePerUnit?: number | null;
    productionUnitName?: string | null;
  };
  byScope: Array<{ scope: number; label: string; tco2e: number }>;
  byCategory: Array<{ label: string; scope: number; tco2e: number }>;
  bySite: Array<{ name: string; tco2e: number }>;
  uncertainty: {
    totalKgCO2e: number;
    uncertaintyRelativePct: number;
    minKg: number;
    maxKg: number;
  };
}

export interface ReductionAction {
  id: string;
  organization_id: string;
  reporting_period_id?: string;
  site_id?: string;
  title: string;
  category: string;
  responsible?: string;
  cost_mad: number;
  annual_savings_tco2e: number;
  target_year: number;
  status: 'proposed' | 'in_progress' | 'completed' | 'cancelled';
}

export interface CBAMInstallation {
  id: string;
  organization_id: string;
  name: string;
  unlocode: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  contact_email?: string;
  created_at?: string;
}

export interface CBAMProduct {
  id: string;
  organization_id: string;
  installation_id: string;
  installation_name?: string;
  installation_city?: string;
  unlocode?: string;
  name: string;
  cn_code: string;
  sector: string;
  annual_production_tonnes: number;
  annual_export_eu_tonnes: number;
  specific_direct_emissions: number;
  specific_indirect_emissions: number;
  specific_total_emissions: number;
  precursors_json?: string;
}

export interface CBAMDossier {
  id: string;
  organization_id: string;
  cbam_product_id: string;
  product_name?: string;
  cn_code?: string;
  importer_name: string;
  importer_country: string;
  importer_eori?: string;
  reference_period: string;
  exported_tonnes?: number;
  total_embedded_emissions_tco2e?: number;
  dossier_json: string;
  created_at: string;
}

export interface CBAMCalculationResult {
  isEligibleSector: boolean;
  sectorName: string;
  cnCode: string;
  productionTonnage: number;
  exportTonnageEU: number;
  specificDirectEmissionsTCO2ePerTonne: number;
  specificIndirectEmissionsTCO2ePerTonne: number;
  specificPrecursorEmissionsTCO2ePerTonne: number;
  specificEmbeddedEmissionsTCO2ePerTonne: number;
  totalExportEmbeddedEmissionsTCO2e: number;
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
}

export interface Quote {
  id: string;
  quote_number: string;
  organization_id: string;
  plan_name: string;
  base_amount_mad: number;
  extra_sites_count: number;
  extra_users_count: number;
  discount_mad: number;
  tva_rate: number;
  tva_amount_mad: number;
  total_ttc_mad: number;
  status: string;
  valid_until: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_name: string;
  status: string;
  sites_limit: number;
  users_limit: number;
  cbam_access: number;
  current_period_end: string;
}
