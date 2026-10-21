/**
 * Atlas Carbone - Générateur Officiel de Classeur Excel d'Audit (.xlsx)
 * Conforme aux exigences ISO 14064-1:2018 et GHG Protocol Corporate Standard
 * Génération déterministe avec ExcelJS
 */

import ExcelJS from 'exceljs';

export interface ExcelReportData {
  companyName: string;
  ice?: string;
  city?: string;
  sector?: string;
  periodYear: number | string;
  startDate?: string;
  endDate?: string;
  consolidationApproach: string;
  status: string;
  generatedDate: string;
  revenueMad?: number;
  employeeCount?: number;
  productionUnits?: number;
  productionUnitName?: string;
  summary: {
    totalTCO2e: number;
    scope1TCO2e: number;
    scope2TCO2e: number;
    scope3TCO2e: number;
    biogenicTCO2e: number;
    uncertaintyMinTCO2e: number;
    uncertaintyMaxTCO2e: number;
    uncertaintyPct: number;
    intensityRevenueTCO2ePerMMad?: number;
    intensityEmployeeTCO2ePerEmployee?: number;
    intensityProductionTCO2ePerUnit?: number;
  };
  activities: Array<{
    category: string;
    scope: number;
    label: string;
    quantity: number;
    unit: string;
    emissionKgCO2e: number;
    emissionTCO2e: number;
    factorId?: string;
    factorName?: string;
    factorSource?: string;
    uncertaintyPct?: number;
    invoiceRef?: string;
    supplierName?: string;
    evidenceFileName?: string;
  }>;
  unquantified: Array<{
    category: string;
    label: string;
    reason: string;
    notes?: string;
  }>;
  reductionActions?: Array<{
    title: string;
    category: string;
    responsible: string;
    targetYear: number;
    savingsTCO2e: number;
    costMad?: number;
    status?: string;
  }>;
}

export async function generateExcelReport(data: ExcelReportData, lang: 'fr' | 'en' = 'fr'): Promise<Buffer> {
  const isFr = lang === 'fr';
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Atlas Carbone (Maroc)';
  workbook.lastModifiedBy = 'Atlas Carbone Deterministic Engine';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Palette stylistique institutionnelle
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF064E3B' } // Vert émeraude sombre officiel
  };
  const subHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF047857' } // Vert émeraude secondaire
  };
  const lightGreyFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' }
  };
  const alertYellowFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFBEB' }
  };

  const fontHeaderWhite: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  const fontTitle: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 14,
    bold: true,
    color: { argb: 'FF064E3B' }
  };

  // -------------------------------------------------------------------------
  // FEUILLE 1 : SYNTHÈSE EXÉCUTIVE & CADRE ORGANISATIONNEL
  // -------------------------------------------------------------------------
  const wsSummary = workbook.addWorksheet(isFr ? 'Synthèse Exécutive' : 'Executive Summary', {
    views: [{ showGridLines: true }]
  });

  wsSummary.columns = [
    { header: '', width: 5 },
    { header: '', width: 32 },
    { header: '', width: 28 },
    { header: '', width: 20 },
    { header: '', width: 22 }
  ];

  // Titre
  wsSummary.mergeCells('B2:E2');
  const cellTitle = wsSummary.getCell('B2');
  cellTitle.value = isFr
    ? `ATLAS CARBONE — INVENTAIRE GES OFFICIEL (${data.periodYear})`
    : `ATLAS CARBONE — OFFICIAL GHG INVENTORY (${data.periodYear})`;
  cellTitle.font = fontTitle;

  wsSummary.mergeCells('B3:E3');
  wsSummary.getCell('B3').value = isFr
    ? `Système Déterministe de Comptabilité Carbone selon ISO 14064-1:2018 & GHG Protocol`
    : `Deterministic GHG Accounting System compliant with ISO 14064-1:2018 & GHG Protocol`;
  wsSummary.getCell('B3').font = { italic: true, size: 10, color: { argb: 'FF64748B' } };

  // Cadre de l'organisation
  wsSummary.mergeCells('B5:E5');
  wsSummary.getCell('B5').value = isFr ? '1. PÉRIMÈTRE ORGANISATIONNEL & ENTREPRISE' : '1. ORGANISATIONAL BOUNDARY';
  wsSummary.getCell('B5').fill = subHeaderFill;
  wsSummary.getCell('B5').font = fontHeaderWhite;

  const orgRows = [
    [isFr ? 'Raison sociale' : 'Company Name', data.companyName],
    [isFr ? 'Identifiant Commun de l’Entreprise (ICE)' : 'Moroccan Business ID (ICE)', data.ice || 'Non renseigné'],
    [isFr ? 'Secteur d’activité' : 'Industry Sector', data.sector || 'Général'],
    [isFr ? 'Ville du siège / Localisation' : 'City / Location', data.city || 'Maroc'],
    [isFr ? 'Approche de consolidation' : 'Consolidation Approach', data.consolidationApproach === 'operational_control' ? 'Contrôle opérationnel (100%)' : data.consolidationApproach],
    [isFr ? 'Exercice de reporting' : 'Reporting Period', String(data.periodYear)],
    [isFr ? 'Statut de l’inventaire' : 'Inventory Status', data.status.toUpperCase()],
    [isFr ? 'Date d’édition' : 'Export Date', data.generatedDate]
  ];

  let curRow = 6;
  for (const [k, v] of orgRows) {
    wsSummary.getCell(`B${curRow}`).value = k;
    wsSummary.getCell(`B${curRow}`).font = { bold: true };
    wsSummary.getCell(`C${curRow}`).value = v;
    curRow++;
  }

  // Ratios d'intensité carbone
  curRow++;
  wsSummary.mergeCells(`B${curRow}:E${curRow}`);
  wsSummary.getCell(`B${curRow}`).value = isFr ? '2. INDICATEURS D’INTENSITÉ CARBONE' : '2. CARBON INTENSITY RATIOS';
  wsSummary.getCell(`B${curRow}`).fill = subHeaderFill;
  wsSummary.getCell(`B${curRow}`).font = fontHeaderWhite;
  curRow++;

  const intensityRows: Array<[string, number | string, string]> = [
    [
      isFr ? 'Intensité économique / CA' : 'Economic intensity / Revenue',
      data.summary.intensityRevenueTCO2ePerMMad !== undefined && data.summary.intensityRevenueTCO2ePerMMad > 0
        ? Number(data.summary.intensityRevenueTCO2ePerMMad.toFixed(2))
        : (isFr ? 'Chiffre d’affaires non renseigné' : 'Revenue not provided'),
      'tCO₂e / Million MAD'
    ],
    [
      isFr ? 'Intensité par employé (ETP)' : 'Employee intensity (FTE)',
      data.summary.intensityEmployeeTCO2ePerEmployee !== undefined && data.summary.intensityEmployeeTCO2ePerEmployee > 0
        ? Number(data.summary.intensityEmployeeTCO2ePerEmployee.toFixed(2))
        : (isFr ? 'Effectif non renseigné' : 'Headcount not provided'),
      'tCO₂e / employé'
    ],
    [
      isFr ? 'Intensité par unité de production' : 'Physical production intensity',
      data.summary.intensityProductionTCO2ePerUnit !== undefined && data.summary.intensityProductionTCO2ePerUnit > 0
        ? Number(data.summary.intensityProductionTCO2ePerUnit.toFixed(4))
        : (isFr ? 'Volume de production non renseigné' : 'Volume not provided'),
      `tCO₂e / ${data.productionUnitName || 'unité'}`
    ]
  ];

  for (const [lbl, val, unit] of intensityRows) {
    wsSummary.getCell(`B${curRow}`).value = lbl;
    wsSummary.getCell(`B${curRow}`).font = { bold: true };
    wsSummary.getCell(`C${curRow}`).value = val;
    wsSummary.getCell(`D${curRow}`).value = unit;
    curRow++;
  }

  // Synthèse des Émissions
  curRow++;
  wsSummary.mergeCells(`B${curRow}:E${curRow}`);
  wsSummary.getCell(`B${curRow}`).value = isFr ? '3. SYNTHÈSE GLOBALE DES ÉMISSIONS (tCO₂e)' : '3. EXECUTIVE EMISSIONS SUMMARY (tCO₂e)';
  wsSummary.getCell(`B${curRow}`).fill = headerFill;
  wsSummary.getCell(`B${curRow}`).font = fontHeaderWhite;
  curRow++;

  const summaryHeaders = [
    isFr ? 'Périmètre / Scope' : 'Scope / Category',
    isFr ? 'Émissions Brutes (tCO₂e)' : 'Gross Emissions (tCO₂e)',
    isFr ? 'Part du Total (%)' : 'Share (%)',
    isFr ? 'Méthode d’audit' : 'Audit Method'
  ];
  ['B', 'C', 'D', 'E'].forEach((col, idx) => {
    const c = wsSummary.getCell(`${col}${curRow}`);
    c.value = summaryHeaders[idx];
    c.font = { bold: true };
    c.fill = lightGreyFill;
  });
  curRow++;

  const tot = data.summary.totalTCO2e > 0 ? data.summary.totalTCO2e : 1;
  const s1Pct = (data.summary.scope1TCO2e / tot) * 100;
  const s2Pct = (data.summary.scope2TCO2e / tot) * 100;
  const s3Pct = (data.summary.scope3TCO2e / tot) * 100;

  const emSummary = [
    ['Scope 1 (Émissions directes)', data.summary.scope1TCO2e, s1Pct, 'Combustion & procédés fixes / mobiles'],
    ['Scope 2 (Électricité réseau)', data.summary.scope2TCO2e, s2Pct, 'Location-based (ONEE national)'],
    ['Scope 3 (Autres émissions indirectes)', data.summary.scope3TCO2e, s3Pct, 'Amont / Aval chaîne de valeur'],
    ['TOTAL BRUT CONSOLIDÉ', data.summary.totalTCO2e, 100, `Incertitude combinée ±${data.summary.uncertaintyPct.toFixed(1)}%`]
  ];

  for (const [sc, em, pct, mth] of emSummary) {
    const isTot = sc.includes('TOTAL');
    wsSummary.getCell(`B${curRow}`).value = sc;
    wsSummary.getCell(`B${curRow}`).font = { bold: isTot };

    const cEm = wsSummary.getCell(`C${curRow}`);
    cEm.value = Number(Number(em).toFixed(3));
    cEm.numFmt = '#,##0.000';
    cEm.font = { bold: isTot };

    const cPct = wsSummary.getCell(`D${curRow}`);
    cPct.value = Number(Number(pct).toFixed(1)) / 100;
    cPct.numFmt = '0.0%';
    cPct.font = { bold: isTot };

    wsSummary.getCell(`E${curRow}`).value = mth;
    if (isTot) {
      wsSummary.getCell(`B${curRow}`).fill = lightGreyFill;
      cEm.fill = lightGreyFill;
      cPct.fill = lightGreyFill;
      wsSummary.getCell(`E${curRow}`).fill = lightGreyFill;
    }
    curRow++;
  }

  // -------------------------------------------------------------------------
  // FEUILLE 2 : ACTIVITÉS & CALCULS DÉTAILLÉS (SCOPES 1, 2, 3)
  // -------------------------------------------------------------------------
  const wsActivities = workbook.addWorksheet(isFr ? 'Détail Activités Scopes 1-2-3' : 'Activity Records Breakdown', {
    views: [{ showGridLines: true }]
  });

  wsActivities.columns = [
    { header: 'Scope', key: 'scope', width: 10 },
    { header: isFr ? 'Catégorie' : 'Category', key: 'category', width: 22 },
    { header: isFr ? 'Poste / Libellé d’activité' : 'Activity Label', key: 'label', width: 34 },
    { header: isFr ? 'Quantité' : 'Quantity', key: 'quantity', width: 14 },
    { header: isFr ? 'Unité' : 'Unit', key: 'unit', width: 12 },
    { header: isFr ? 'Facteur d’émission appliqué' : 'Emission Factor Applied', key: 'factorName', width: 32 },
    { header: isFr ? 'Source du facteur' : 'Factor Source', key: 'factorSource', width: 20 },
    { header: isFr ? 'Émissions (kgCO₂e)' : 'Emissions (kgCO₂e)', key: 'kgco2e', width: 18 },
    { header: isFr ? 'Émissions (tCO₂e)' : 'Emissions (tCO₂e)', key: 'tco2e', width: 18 },
    { header: isFr ? 'Incertitude (%)' : 'Uncertainty (%)', key: 'uncertainty', width: 14 },
    { header: isFr ? 'Réf. Facture / Preuve' : 'Invoice Ref / Evidence', key: 'invoiceRef', width: 22 },
    { header: isFr ? 'Justificatif fichier' : 'Evidence File', key: 'evidenceFile', width: 24 }
  ];

  const headerRow = wsActivities.getRow(1);
  headerRow.fill = headerFill;
  headerRow.font = fontHeaderWhite;
  headerRow.height = 24;

  for (const act of data.activities) {
    const row = wsActivities.addRow({
      scope: `Scope ${act.scope}`,
      category: act.category,
      label: act.label,
      quantity: act.quantity,
      unit: act.unit,
      factorName: act.factorName || 'Facteur Certifié Atlas Carbone',
      factorSource: act.factorSource || 'Base Carbone Maroc / ADEME / ONEE',
      kgco2e: Number(act.emissionKgCO2e.toFixed(2)),
      tco2e: Number(act.emissionTCO2e.toFixed(4)),
      uncertainty: act.uncertaintyPct !== undefined ? act.uncertaintyPct * 100 : 20,
      invoiceRef: act.invoiceRef || '-',
      evidenceFile: act.evidenceFileName || '-'
    });

    row.getCell('quantity').numFmt = '#,##0.00';
    row.getCell('kgco2e').numFmt = '#,##0.00';
    row.getCell('tco2e').numFmt = '#,##0.0000';
    row.getCell('uncertainty').numFmt = '0.0"%"';
  }

  // -------------------------------------------------------------------------
  // FEUILLE 3 : POSTES NON QUANTIFIÉS (RÈGLE DE RIGUEUR)
  // -------------------------------------------------------------------------
  const wsUnquantified = workbook.addWorksheet(isFr ? 'Postes Non Quantifiés' : 'Unquantified Activities', {
    views: [{ showGridLines: true }]
  });

  wsUnquantified.columns = [
    { header: isFr ? 'Catégorie' : 'Category', key: 'category', width: 25 },
    { header: isFr ? 'Poste Identifié' : 'Identified Item', key: 'label', width: 35 },
    { header: isFr ? 'Motif de Réserve Méthodologique' : 'Audit Limitation Reason', key: 'reason', width: 45 },
    { header: isFr ? 'Commentaires & Actions Correctives' : 'Notes & Corrective Actions', key: 'notes', width: 35 }
  ];

  const unqHeader = wsUnquantified.getRow(1);
  unqHeader.fill = subHeaderFill;
  unqHeader.font = fontHeaderWhite;
  unqHeader.height = 24;

  if (data.unquantified.length === 0) {
    wsUnquantified.addRow({
      category: isFr ? 'Périmètre complet' : 'Full boundary',
      label: isFr ? 'Aucun poste non quantifié' : 'No unquantified activities',
      reason: isFr ? 'Toutes les activités déclarées ont été quantifiées avec des facteurs validés' : 'All reported items quantified',
      notes: '-'
    });
  } else {
    for (const u of data.unquantified) {
      const row = wsUnquantified.addRow({
        category: u.category,
        label: u.label,
        reason: u.reason || 'Poste identifié, non quantifié : facteur disponible insuffisant',
        notes: u.notes || '-'
      });
      row.fill = alertYellowFill;
    }
  }

  // -------------------------------------------------------------------------
  // FEUILLE 4 : PLAN DE TRANSITION BAS-CARBONE
  // -------------------------------------------------------------------------
  const wsReductions = workbook.addWorksheet(isFr ? 'Plan de Transition' : 'Decarbonization Plan', {
    views: [{ showGridLines: true }]
  });

  wsReductions.columns = [
    { header: isFr ? 'Action de réduction' : 'Action Title', key: 'title', width: 35 },
    { header: isFr ? 'Catégorie d’action' : 'Category', key: 'category', width: 22 },
    { header: isFr ? 'Pilote / Responsable' : 'Lead / Owner', key: 'responsible', width: 22 },
    { header: isFr ? 'Échéance' : 'Target Year', key: 'targetYear', width: 14 },
    { header: isFr ? 'Économies annuelles (tCO₂e)' : 'Annual Savings (tCO₂e)', key: 'savings', width: 24 },
    { header: isFr ? 'Investissement estimé (MAD)' : 'Estimated Cost (MAD)', key: 'cost', width: 24 },
    { header: isFr ? 'Statut d’avancement' : 'Status', key: 'status', width: 16 }
  ];

  const redHeader = wsReductions.getRow(1);
  redHeader.fill = headerFill;
  redHeader.font = fontHeaderWhite;
  redHeader.height = 24;

  if (!data.reductionActions || data.reductionActions.length === 0) {
    wsReductions.addRow({
      title: isFr ? 'Aucune action de réduction planifiée pour cet exercice' : 'No reduction actions recorded',
      category: '-',
      responsible: '-',
      targetYear: data.periodYear,
      savings: 0,
      cost: 0,
      status: '-'
    });
  } else {
    for (const ra of data.reductionActions) {
      const row = wsReductions.addRow({
        title: ra.title,
        category: ra.category,
        responsible: ra.responsible || 'Direction',
        targetYear: ra.targetYear,
        savings: ra.savingsTCO2e,
        cost: ra.costMad || 0,
        status: ra.status || 'En cours'
      });
      row.getCell('savings').numFmt = '#,##0.00';
      row.getCell('cost').numFmt = '#,##0.00 "DH"';
    }
  }

  // -------------------------------------------------------------------------
  // FEUILLE 5 : MÉTHODOLOGIE & PISTE D’AUDIT
  // -------------------------------------------------------------------------
  const wsAudit = workbook.addWorksheet(isFr ? 'Cadre Méthodologique & Audit' : 'Methodology & Audit Trail', {
    views: [{ showGridLines: true }]
  });

  wsAudit.columns = [
    { header: '', width: 5 },
    { header: isFr ? 'Paramètre d’audit' : 'Audit Parameter', width: 32 },
    { header: isFr ? 'Description & Référence Réglementaire' : 'Methodological Standard', width: 65 }
  ];

  wsAudit.mergeCells('B2:C2');
  wsAudit.getCell('B2').value = isFr ? 'CONFORMITÉ & ENGAGEMENT MÉTHODOLOGIQUE ATLAS CARBONE' : 'METHODOLOGICAL STATEMENT';
  wsAudit.getCell('B2').font = fontTitle;

  const auditStatements = [
    ['Norme Internationale Principale', 'ISO 14064-1:2018 (Spécifications et lignes directrices pour la quantification et la déclaration des inventaires de GES).'],
    ['Standard Mondial Complémentaire', 'GHG Protocol Corporate Accounting and Reporting Standard (WRI / WBCSD).'],
    ['Scope 2 Guidance', 'Conformité stricte à la double comptabilisation Scope 2 : séparation absolue entre Location-based (mix réseau national ONEE) et Market-based.'],
    ['Facteurs d’Émission Référencés', 'Classeur souverain Bilan Carbone Maroc (ADEME / ABC / Fondation Mohammed VI pour la Protection de l’Environnement).'],
    ['Pouvoirs de Réchauffement Global (PRG)', 'GIEC AR6 (6ème Rapport d’Évaluation) à horizon 100 ans (ex: CH4 = 27,9 ; N2O = 273).'],
    ['Règle d’Or de Non-Divulgation', 'Protection cryptographique et étanchéité serveur des facteurs bruts propriétaires.'],
    ['Traitement des Postes Manquants', 'Interdiction stricte de l’attribution de 0 par défaut. Tout poste identifié mais sans facteur validé figure en réserve d’audit.'],
    ['Avertissement Audit Tiers', 'Les calculs déterministes d’Atlas Carbone ne se substituent pas à une vérification par un organisme accrédité ISO 14065 / ISO 14064-3.']
  ];

  let aRow = 4;
  for (const [param, desc] of auditStatements) {
    wsAudit.getCell(`B${aRow}`).value = param;
    wsAudit.getCell(`B${aRow}`).font = { bold: true };
    wsAudit.getCell(`C${aRow}`).value = desc;
    aRow++;
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
