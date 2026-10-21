/**
 * Atlas Carbone - Moteur de Génération de Rapports PDF Officiels Côté Serveur
 * Conforme aux exigences ISO 14064-1:2018 et GHG Protocol Corporate Standard
 * Génération déterministe bilingue (Français / Anglais) avec PDFKit
 */

import PDFDocument from 'pdfkit';

export interface ReportPdfData {
  companyName: string;
  city: string;
  ice?: string;
  sector: string;
  periodYear: number | string;
  startDate?: string;
  endDate?: string;
  consolidationApproach: string;
  isPreliminary: boolean;
  status: string;
  generatedDate: string;
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
    productionUnitName?: string;
  };
  activities: Array<{
    category: string;
    scope: number;
    label: string;
    quantity: number;
    unit: string;
    emissionTCO2e: number;
    factorName?: string;
    factorSource?: string;
    uncertaintyPct?: number;
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
  }>;
  auditorReview?: {
    reviewerName: string;
    status: string;
    comment: string;
  };
}

export function generateReportPdf(data: ReportPdfData, lang: 'fr' | 'en' = 'fr'): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const isFr = lang === 'fr';
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
        bufferPages: true,
        info: {
          Title: isFr ? `Rapport Bilan Carbone - ${data.companyName}` : `Carbon Footprint Report - ${data.companyName}`,
          Author: 'Atlas Carbone (Maroc)',
          Subject: 'Inventaire des Émissions de Gaz à Effet de Serre ISO 14064-1:2018'
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Palette graphique sobre et institutionnelle (Vert profond marocain & ardoise)
      const primaryColor = '#064E3B'; // Emerald 900
      const secondaryColor = '#047857'; // Emerald 700
      const darkColor = '#0F172A'; // Slate 900
      const mutedColor = '#64748B'; // Slate 500
      const lightBg = '#F8FAFC'; // Slate 50
      const borderColor = '#E2E8F0'; // Slate 200

      // Formatage des nombres
      const fmtNum = (val: number, decimals = 2) => {
        const rounded = Number(val).toFixed(decimals);
        if (isFr) {
          return rounded.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        }
        return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      };

      // -----------------------------------------------------------------
      // EN-TÊTE
      // -----------------------------------------------------------------
      doc.rect(45, 35, 505, 55).fill(primaryColor);

      doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold')
        .text('ATLAS CARBONE', 60, 48);

      doc.fontSize(8).font('Helvetica')
        .text(isFr ? 'PLATEFORME DE COMPTABILITÉ GES & CONFORMITÉ MAROC' : 'MOROCCAN GHG ACCOUNTING & COMPLIANCE SYSTEM', 60, 70);

      const reportTypeBadge = data.isPreliminary
        ? (isFr ? 'RAPPORT PRÉLIMINAIRE D’ESSAI' : 'PRELIMINARY TRIAL REPORT')
        : (isFr ? 'RAPPORT OFFICIEL D’INVENTAIRE GES' : 'OFFICIAL GHG INVENTORY REPORT');

      doc.fontSize(8).font('Helvetica-Bold')
        .text(reportTypeBadge, 330, 52, { width: 200, align: 'right' });

      doc.fontSize(7).font('Helvetica')
        .text('ISO 14064-1:2018 / GHG Protocol', 330, 68, { width: 200, align: 'right' });

      doc.moveDown(3);

      // -----------------------------------------------------------------
      // SECTION 1 : CADRE GÉNÉRAL & PÉRIMÈTRE
      // -----------------------------------------------------------------
      let yPos = 105;
      doc.rect(45, yPos, 505, 75).fill(lightBg).stroke(borderColor);

      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text(isFr ? '1. CADRE GÉNÉRAL & PÉRIMÈTRE ORGANISATIONNEL' : '1. GENERAL CONTEXT & BOUNDARY DEFINITION', 55, yPos + 8);

      doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold')
        .text(isFr ? 'Entreprise :' : 'Company:', 55, yPos + 24)
        .font('Helvetica').text(`${data.companyName} (${data.sector})`, 125, yPos + 24);

      doc.font('Helvetica-Bold').text(isFr ? 'Localisation :' : 'Location:', 55, yPos + 38)
        .font('Helvetica').text(`${data.city || 'Maroc'}${data.ice ? ' | ICE: ' + data.ice : ''}`, 125, yPos + 38);

      doc.font('Helvetica-Bold').text(isFr ? 'Consolidation :' : 'Consolidation:', 55, yPos + 52)
        .font('Helvetica').text(
          data.consolidationApproach === 'operational_control'
            ? (isFr ? 'Contrôle opérationnel (100% des sites contrôlés)' : 'Operational Control (100% controlled sites)')
            : data.consolidationApproach,
          125, yPos + 52
        );

      doc.font('Helvetica-Bold').text(isFr ? 'Exercice :' : 'Period:', 340, yPos + 24)
        .font('Helvetica').text(String(data.periodYear), 415, yPos + 24);

      doc.font('Helvetica-Bold').text(isFr ? 'Statut :' : 'Status:', 340, yPos + 38)
        .font('Helvetica').text(data.status, 415, yPos + 38);

      doc.font('Helvetica-Bold').text(isFr ? 'Édition :' : 'Generated:', 340, yPos + 52)
        .font('Helvetica').text(data.generatedDate, 415, yPos + 52);

      // -----------------------------------------------------------------
      // SECTION 2 : SYNTHÈSE GLOBALE DES ÉMISSIONS
      // -----------------------------------------------------------------
      yPos = 190;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text(isFr ? '2. SYNTHÈSE GLOBALE DES ÉMISSIONS (tCO₂e)' : '2. EXECUTIVE GHG EMISSIONS SUMMARY (tCO₂e)', 45, yPos);

      yPos += 16;
      // 4 Cartouches : Total, Scope 1, Scope 2, Scope 3
      const cardWidth = 120;
      const cardHeight = 45;

      // Total
      doc.rect(45, yPos, cardWidth, cardHeight).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold').text(isFr ? 'TOTAL BRUT' : 'GROSS TOTAL', 50, yPos + 6);
      doc.fontSize(13).font('Helvetica-Bold').text(`${fmtNum(data.summary.totalTCO2e)}`, 50, yPos + 18);
      doc.fontSize(6).font('Helvetica').text(isFr ? 'tonnes CO₂e' : 'metric tons CO₂e', 50, yPos + 33);

      // Scope 1
      doc.rect(173, yPos, cardWidth, cardHeight).fill(lightBg).stroke(borderColor);
      doc.fillColor(primaryColor).fontSize(7).font('Helvetica-Bold').text('SCOPE 1 (DIRECT)', 178, yPos + 6);
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text(`${fmtNum(data.summary.scope1TCO2e)} t`, 178, yPos + 18);
      const s1Pct = data.summary.totalTCO2e > 0 ? (data.summary.scope1TCO2e / data.summary.totalTCO2e) * 100 : 0;
      doc.fillColor(mutedColor).fontSize(6).font('Helvetica').text(`${fmtNum(s1Pct, 1)}% ${isFr ? 'du total' : 'of total'}`, 178, yPos + 33);

      // Scope 2
      doc.rect(301, yPos, cardWidth, cardHeight).fill(lightBg).stroke(borderColor);
      doc.fillColor(primaryColor).fontSize(7).font('Helvetica-Bold').text('SCOPE 2 (ÉLECTRICITÉ)', 306, yPos + 6);
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text(`${fmtNum(data.summary.scope2TCO2e)} t`, 306, yPos + 18);
      const s2Pct = data.summary.totalTCO2e > 0 ? (data.summary.scope2TCO2e / data.summary.totalTCO2e) * 100 : 0;
      doc.fillColor(mutedColor).fontSize(6).font('Helvetica').text(`${fmtNum(s2Pct, 1)}% (Location-based)`, 306, yPos + 33);

      // Scope 3
      doc.rect(430, yPos, cardWidth, cardHeight).fill(lightBg).stroke(borderColor);
      doc.fillColor(primaryColor).fontSize(7).font('Helvetica-Bold').text('SCOPE 3 (AMONT / AVAL)', 435, yPos + 6);
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text(`${fmtNum(data.summary.scope3TCO2e)} t`, 435, yPos + 18);
      const s3Pct = data.summary.totalTCO2e > 0 ? (data.summary.scope3TCO2e / data.summary.totalTCO2e) * 100 : 0;
      doc.fillColor(mutedColor).fontSize(6).font('Helvetica').text(`${fmtNum(s3Pct, 1)}% ${isFr ? 'du total' : 'of total'}`, 435, yPos + 33);

      // Incertitude et biogénique
      yPos += 52;
      doc.fillColor(mutedColor).fontSize(7).font('Helvetica')
        .text(
          isFr
            ? `Intervalle d'incertitude combiné (95%) : [${fmtNum(data.summary.uncertaintyMinTCO2e)} ; ${fmtNum(data.summary.uncertaintyMaxTCO2e)}] tCO₂e (± ${fmtNum(data.summary.uncertaintyPct, 1)}%) | CO₂ biogénique hors scopes : ${fmtNum(data.summary.biogenicTCO2e)} tCO₂e`
            : `Combined uncertainty interval (95% CI): [${fmtNum(data.summary.uncertaintyMinTCO2e)} ; ${fmtNum(data.summary.uncertaintyMaxTCO2e)}] tCO₂e (± ${fmtNum(data.summary.uncertaintyPct, 1)}%) | Out-of-scope biogenic CO₂: ${fmtNum(data.summary.biogenicTCO2e)} tCO₂e`,
          45, yPos
        );

      // Indicateurs d'Intensité Carbone (ISO 14064 §9)
      const hasIntensity = (data.summary.intensityRevenueTCO2ePerMMad && data.summary.intensityRevenueTCO2ePerMMad > 0) ||
                           (data.summary.intensityEmployeeTCO2ePerEmployee && data.summary.intensityEmployeeTCO2ePerEmployee > 0) ||
                           (data.summary.intensityProductionTCO2ePerUnit && data.summary.intensityProductionTCO2ePerUnit > 0);

      if (hasIntensity) {
        yPos += 14;
        doc.rect(45, yPos, 505, 20).fill('#F0FDF4').stroke('#BBF7D0');
        const intensityText = [
          data.summary.intensityRevenueTCO2ePerMMad ? `${fmtNum(data.summary.intensityRevenueTCO2ePerMMad)} tCO₂e / M MAD` : null,
          data.summary.intensityEmployeeTCO2ePerEmployee ? `${fmtNum(data.summary.intensityEmployeeTCO2ePerEmployee)} tCO₂e / ${isFr ? 'employé' : 'employee'}` : null,
          data.summary.intensityProductionTCO2ePerUnit ? `${fmtNum(data.summary.intensityProductionTCO2ePerUnit, 3)} tCO₂e / ${data.summary.productionUnitName || 'unité'}` : null
        ].filter(Boolean).join('   |   ');

        doc.fillColor(primaryColor).fontSize(7).font('Helvetica-Bold')
          .text(`${isFr ? 'Intensité carbone d’activité :' : 'Carbon Intensity Indicators:'}  ${intensityText}`, 55, yPos + 6);
        yPos += 8;
      }

      // -----------------------------------------------------------------
      // SECTION 3 : TABLEAU DÉTAILLÉ DES ACTIVITÉS ENREGISTRÉES
      // -----------------------------------------------------------------
      yPos += 18;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text(isFr ? '3. VENTILATION DÉTAILLÉE PAR POSTE D’ÉMISSION' : '3. DETAILED BREAKDOWN BY ACTIVITY RECORD', 45, yPos);

      yPos += 15;
      // En-tête tableau
      doc.rect(45, yPos, 505, 16).fill(secondaryColor);
      doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold')
        .text('Scope', 48, yPos + 4, { width: 35 })
        .text(isFr ? 'Catégorie / Poste' : 'Category / Source', 85, yPos + 4, { width: 155 })
        .text(isFr ? 'Activité' : 'Activity', 245, yPos + 4, { width: 85 })
        .text(isFr ? 'Facteur d’émission' : 'Emission Factor', 335, yPos + 4, { width: 130 })
        .text(isFr ? 'Émissions' : 'Emissions', 470, yPos + 4, { width: 75, align: 'right' });

      yPos += 16;
      let rowCount = 0;

      for (const act of data.activities) {
        if (yPos > 720) {
          doc.addPage();
          yPos = 45;
          // Rappel en-tête tableau
          doc.rect(45, yPos, 505, 16).fill(secondaryColor);
          doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold')
            .text('Scope', 48, yPos + 4, { width: 35 })
            .text(isFr ? 'Catégorie / Poste' : 'Category / Source', 85, yPos + 4, { width: 155 })
            .text(isFr ? 'Activité' : 'Activity', 245, yPos + 4, { width: 85 })
            .text(isFr ? 'Facteur d’émission' : 'Emission Factor', 335, yPos + 4, { width: 130 })
            .text(isFr ? 'Émissions' : 'Emissions', 470, yPos + 4, { width: 75, align: 'right' });
          yPos += 16;
        }

        const bg = rowCount % 2 === 0 ? '#FFFFFF' : lightBg;
        doc.rect(45, yPos, 505, 18).fill(bg).stroke(borderColor);

        doc.fillColor(darkColor).fontSize(7).font('Helvetica-Bold')
          .text(`S${act.scope}`, 48, yPos + 5, { width: 35 });

        doc.font('Helvetica')
          .text(act.label.length > 32 ? act.label.substring(0, 30) + '...' : act.label, 85, yPos + 5, { width: 155 })
          .text(`${fmtNum(act.quantity)} ${act.unit}`, 245, yPos + 5, { width: 85 })
          .text(act.factorName ? (act.factorName.length > 28 ? act.factorName.substring(0, 26) + '...' : act.factorName) : 'Facteur Maroc', 335, yPos + 5, { width: 130 });

        doc.font('Helvetica-Bold')
          .text(`${fmtNum(act.emissionTCO2e, 3)} t`, 470, yPos + 5, { width: 75, align: 'right' });

        yPos += 18;
        rowCount++;
      }

      // -----------------------------------------------------------------
      // SECTION 4 : POSTES IDENTIFIÉS NON QUANTIFIÉS
      // -----------------------------------------------------------------
      yPos += 12;
      if (yPos > 680) {
        doc.addPage();
        yPos = 45;
      }

      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text(isFr ? '4. POSTES IDENTIFIÉS, NON QUANTIFIÉS (RÈGLE DE RIGUEUR)' : '4. IDENTIFIED, UNQUANTIFIED ACTIVITIES (RIGOR RULE)', 45, yPos);

      yPos += 14;
      doc.fillColor(darkColor).fontSize(7).font('Helvetica')
        .text(
          isFr
            ? 'Conformément à la méthodologie Atlas Carbone, aucune activité manquante ne reçoit une valeur nulle par défaut. Les postes ci-dessous ont été déclarés mais non quantifiés en l’absence de facteur validé ou de données primaires exploitables :'
            : 'In compliance with Atlas Carbone methodology, missing activities are strictly never assigned a default zero. The items below were reported but left unquantified due to unavailable validated emission factors or primary activity records:',
          45, yPos, { width: 505 }
        );

      yPos += 18;
      if (data.unquantified.length === 0) {
        doc.fillColor(mutedColor).fontSize(7).font('Helvetica-Oblique')
          .text(isFr ? 'Aucun poste non quantifié déclaré sur le périmètre actuel.' : 'No unquantified activities reported within current operational boundary.', 45, yPos);
        yPos += 12;
      } else {
        for (const unq of data.unquantified) {
          if (yPos > 720) { doc.addPage(); yPos = 45; }
          doc.rect(45, yPos, 505, 16).fill('#FFFBEB').stroke('#FDE68A'); // Jaune ambré doux
          doc.fillColor('#92400E').fontSize(7).font('Helvetica-Bold')
            .text(`[${unq.category}] ${unq.label}`, 50, yPos + 4, { width: 280 });
          doc.fillColor('#78350F').fontSize(6).font('Helvetica')
            .text(unq.reason || (isFr ? 'Facteur disponible insuffisant' : 'Insufficient factor available'), 335, yPos + 5, { width: 210, align: 'right' });
          yPos += 18;
        }
      }

      // -----------------------------------------------------------------
      // SECTION 5 : PLAN DE TRANSITION & RÉDUCTION
      // -----------------------------------------------------------------
      yPos += 12;
      if (yPos > 680) { doc.addPage(); yPos = 45; }

      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text(isFr ? '5. PLAN D’ACTIONS DE TRANSITION BAS-CARBONE' : '5. LOW-CARBON TRANSITION ACTION PLAN', 45, yPos);

      yPos += 14;
      if (!data.reductionActions || data.reductionActions.length === 0) {
        doc.fillColor(mutedColor).fontSize(7).font('Helvetica-Oblique')
          .text(isFr ? 'Aucune action planifiée pour cet exercice.' : 'No reduction actions recorded for this cycle.', 45, yPos);
        yPos += 12;
      } else {
        for (const ra of data.reductionActions) {
          if (yPos > 720) { doc.addPage(); yPos = 45; }
          doc.rect(45, yPos, 505, 18).fill(lightBg).stroke(borderColor);
          doc.fillColor(darkColor).fontSize(7).font('Helvetica-Bold')
            .text(ra.title, 50, yPos + 5, { width: 260 });
          doc.font('Helvetica')
            .text(`${isFr ? 'Pilote :' : 'Lead:'} ${ra.responsible || 'Direction'} | ${isFr ? 'Échéance :' : 'Target:'} ${ra.targetYear}`, 315, yPos + 5, { width: 140 });
          doc.font('Helvetica-Bold').fillColor(secondaryColor)
            .text(`-${fmtNum(ra.savingsTCO2e)} tCO₂e/an`, 460, yPos + 5, { width: 85, align: 'right' });
          yPos += 20;
        }
      }

      // -----------------------------------------------------------------
      // SECTION 6 : MENTIONS MÉTHODOLOGIQUES & SIGNATURES
      // -----------------------------------------------------------------
      yPos += 12;
      if (yPos > 650) { doc.addPage(); yPos = 45; }

      doc.rect(45, yPos, 505, 80).fill('#F1F5F9').stroke(borderColor);
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold')
        .text(isFr ? 'ATTESTATION DE CONTRÔLE INTERNE & LIMITES LÉGALES' : 'INTERNAL CONTROL NOTICE & METHODOLOGICAL LIMITS', 55, yPos + 8);

      doc.fillColor(darkColor).fontSize(6).font('Helvetica')
        .text(
          isFr
            ? 'Ce document est généré par le moteur déterministe d’Atlas Carbone. Les facteurs d’émissions appliqués proviennent exclusivement du classeur de référence officiel Bilan Carbone Maroc (ADEME / ABC / Fondation Mohammed VI pour la Protection de l’Environnement). Mix électrique réseau appliqué : 0,6426 kgCO₂e/kWh net (ONEE 2020 Location-based).\n\nAVERTISSEMENT : Les contrôles logiciels et calculs réalisés ne se substituent en aucun cas à un audit de vérification par un tiers indépendant accrédité selon la norme ISO 14065 / ISO 14064-3.'
            : 'Generated by the Atlas Carbone deterministic calculation engine. Emission factors are sourced exclusively from the Moroccan reference dataset (ADEME / ABC / Mohammed VI Foundation for Environmental Protection). Applied national grid factor: 0.6426 kgCO₂e/kWh net (ONEE Location-based 2020).\n\nDISCLAIMER: Automated software calculations and internal quality controls do not constitute independent verification certification by an ISO 14065 / ISO 14064-3 accredited inspection body.',
          55, yPos + 22, { width: 485, lineGap: 1.5 }
        );

      doc.fontSize(7).font('Helvetica-Bold')
        .text(isFr ? 'Responsable Bilan Carbone :' : 'Carbon Officer:', 55, yPos + 64)
        .font('Helvetica').text(data.companyName, 175, yPos + 64)
        .font('Helvetica-Bold').text(isFr ? 'Système :' : 'System:', 340, yPos + 64)
        .font('Helvetica').text('Atlas Carbone v2.0 (Maroc)', 385, yPos + 64);

      // -----------------------------------------------------------------
      // PIED DE PAGE SUR TOUTES LES PAGES
      // -----------------------------------------------------------------
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fillColor(mutedColor).fontSize(6).font('Helvetica')
          .text(
            `Atlas Carbone (Maroc) | ${data.companyName} | ${isFr ? 'Page' : 'Page'} ${i + 1} / ${totalPages} | ${isFr ? 'Contact support :' : 'Contact:'} abdelaziz.motiaa@gmail.com (+212 671 581 167)`,
            45, 805, { width: 505, align: 'center' }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
