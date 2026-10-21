/**
 * Atlas Carbone - Générateur Officiel de Devis Proforma et Bons de Commande PDF
 * Conforme aux règles comptables et fiscales marocaines (Dirhams MAD, TVA 20%, ICE, RIB marocain)
 */

import PDFDocument from 'pdfkit';

export interface QuotePdfData {
  quoteNumber: string;
  date: string;
  validUntil: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  ice?: string;
  planName: string;
  billingCycle?: 'annual' | 'monthly';
  baseAmountMAD: number;
  extraSitesCount?: number;
  extraSitesCostMAD?: number;
  extraUsersCount?: number;
  extraUsersCostMAD?: number;
  discountMAD?: number;
  subtotalHT: number;
  tvaRate?: number; // 0.20
  tvaAmountMAD: number;
  totalTTCMAD: number;
  status?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

export function generateQuotePdf(data: QuotePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 35, bottom: 35, left: 45, right: 45 },
        bufferPages: true,
        info: {
          Title: `Devis Proforma Atlas Carbone - ${data.quoteNumber}`,
          Author: 'Atlas Carbone S.A.R.L.',
          Subject: `Devis officiel abonnement SaaS Atlas Carbone pour ${data.companyName}`
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Palette graphique institutionnelle Atlas Carbone
      const primaryColor = '#064E3B'; // Vert émeraude profond
      const secondaryColor = '#047857'; // Vert moyen
      const darkColor = '#0F172A'; // Slate 900
      const mutedColor = '#64748B'; // Slate 500
      const lightBg = '#F8FAFC'; // Slate 50
      const borderCol = '#E2E8F0'; // Slate 200

      // Formatage des montants monétaires en Dirhams (MAD)
      const fmtMAD = (amount: number) => {
        const fixed = Number(amount || 0).toFixed(2);
        return fixed.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' MAD';
      };

      // -------------------------------------------------------------
      // EN-TÊTE DU DOCUMENT
      // -------------------------------------------------------------
      doc.rect(45, 30, 505, 50).fill(primaryColor);

      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold')
        .text('ATLAS CARBONE', 60, 42);

      doc.fontSize(8).font('Helvetica')
        .text('Plateforme Marocaine de Comptabilité Carbone & Régime MACF 2026', 60, 62);

      doc.fontSize(10).font('Helvetica-Bold')
        .text('DEVIS PROFORMA / BON DE COMMANDE', 310, 48, { width: 225, align: 'right' });

      // -------------------------------------------------------------
      // BLOCS COORDONNÉES ÉMETTEUR ET DESTINATAIRE
      // -------------------------------------------------------------
      const topY = 95;

      // Cadre Émetteur
      doc.rect(45, topY, 245, 105).fill(lightBg).strokeColor(borderCol).stroke();
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
        .text('ÉMETTEUR / PRESTATAIRE :', 55, topY + 8);

      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold')
        .text('ATLAS CARBONE S.A.R.L.', 55, topY + 22);

      doc.fontSize(8).font('Helvetica').fillColor(mutedColor)
        .text('Siège social : Casablanca Anfa, Maroc', 55, topY + 35)
        .text('ICE : 003456789000045 • RC Casablanca : 567890', 55, topY + 47)
        .text('IF : 45678901 • Patente : 34567890', 55, topY + 59)
        .text('Direction commerciale : Abdelaziz Motiaa', 55, topY + 71)
        .text('Tél : +212 6 71 58 11 67 • Email : abdelaziz.motiaa@gmail.com', 55, topY + 83);

      // Cadre Client Destinataire
      doc.rect(305, topY, 245, 105).fill(lightBg).strokeColor(borderCol).stroke();
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
        .text('CLIENT / DESTINATAIRE :', 315, topY + 8);

      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold')
        .text(data.companyName.toUpperCase(), 315, topY + 22);

      doc.fontSize(8).font('Helvetica').fillColor(mutedColor)
        .text(`Ville : ${data.city || 'Casablanca, Maroc'}`, 315, topY + 35)
        .text(`ICE Client : ${data.ice || 'En cours de renseignement'}`, 315, topY + 47)
        .text(`Contact : ${data.contactName || 'Responsable RSE / Finance'}`, 315, topY + 59)
        .text(`Email : ${data.contactEmail || 'contact@client.ma'}`, 315, topY + 71)
        .text(`Téléphone : ${data.contactPhone || '—'}`, 315, topY + 83);

      // -------------------------------------------------------------
      // BANDEAU RÉFÉRENCES DU DEVIS
      // -------------------------------------------------------------
      const metaY = 210;
      doc.rect(45, metaY, 505, 28).fill('#ECFDF5').strokeColor('#A7F3D0').stroke();

      doc.fillColor('#065F46').fontSize(8.5).font('Helvetica-Bold')
        .text(`N° Devis : ${data.quoteNumber}`, 55, metaY + 9)
        .text(`Date d'émission : ${data.date}`, 190, metaY + 9)
        .text(`Validité : Jusqu'au ${data.validUntil}`, 320, metaY + 9)
        .text(`Devise : MAD (Dirham)`, 445, metaY + 9);

      // -------------------------------------------------------------
      // TABLEAU DES PRESTATIONS
      // -------------------------------------------------------------
      const tableY = 248;

      // En-tête du tableau
      doc.rect(45, tableY, 505, 22).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
        .text('Description de la prestation SaaS', 55, tableY + 6)
        .text('Périmètre inclus', 270, tableY + 6)
        .text('P.U. HT', 410, tableY + 6, { width: 55, align: 'right' })
        .text('Total HT', 475, tableY + 6, { width: 65, align: 'right' });

      let currentY = tableY + 22;

      // Ligne 1 : Abonnement de base
      const planLabel = `Abonnement Annuel Atlas Carbone — ${data.planName}`;
      const planScopeDesc = data.planName.toLowerCase().includes('macf') || data.planName.toLowerCase().includes('export')
        ? 'Scopes 1, 2, 3 + Module MACF Régime 2026'
        : 'Scopes 1 & 2 complets + Scope 3 essentiel';

      doc.rect(45, currentY, 505, 28).fill('#FFFFFF').strokeColor(borderCol).stroke();
      doc.fillColor(darkColor).fontSize(8.5).font('Helvetica-Bold')
        .text(planLabel, 55, currentY + 6)
        .fontSize(7.5).font('Helvetica').fillColor(mutedColor)
        .text('Licence d’exploitation entreprise (12 mois)', 55, currentY + 16);

      doc.fontSize(8).font('Helvetica').fillColor(darkColor)
        .text(planScopeDesc, 270, currentY + 9);

      doc.fontSize(8.5).font('Helvetica-Bold')
        .text(fmtMAD(data.baseAmountMAD), 390, currentY + 9, { width: 75, align: 'right' })
        .text(fmtMAD(data.baseAmountMAD), 465, currentY + 9, { width: 75, align: 'right' });

      currentY += 28;

      // Ligne 2 : Sites additionnels
      if (data.extraSitesCount && data.extraSitesCount > 0) {
        const sitesCost = data.extraSitesCostMAD || (data.extraSitesCount * 2000);
        doc.rect(45, currentY, 505, 24).fill(lightBg).strokeColor(borderCol).stroke();
        doc.fillColor(darkColor).fontSize(8.5).font('Helvetica')
          .text(`Extension Multi-Sites Usines / Plateformes (+${data.extraSitesCount} sites)`, 55, currentY + 7);
        doc.fillColor(mutedColor).fontSize(8)
          .text(`2 000 MAD / site / an`, 270, currentY + 7);
        doc.fontSize(8.5).font('Helvetica')
          .text(fmtMAD(2000), 390, currentY + 7, { width: 75, align: 'right' })
          .text(fmtMAD(sitesCost), 465, currentY + 7, { width: 75, align: 'right' });
        currentY += 24;
      }

      // Ligne 3 : Utilisateurs additionnels
      if (data.extraUsersCount && data.extraUsersCount > 0) {
        const usersCost = data.extraUsersCostMAD || (data.extraUsersCount * 800);
        doc.rect(45, currentY, 505, 24).fill('#FFFFFF').strokeColor(borderCol).stroke();
        doc.fillColor(darkColor).fontSize(8.5).font('Helvetica')
          .text(`Extension Sièges Collaborateurs & Auditeurs (+${data.extraUsersCount} accès)`, 55, currentY + 7);
        doc.fillColor(mutedColor).fontSize(8)
          .text(`800 MAD / utilisateur / an`, 270, currentY + 7);
        doc.fontSize(8.5).font('Helvetica')
          .text(fmtMAD(800), 390, currentY + 7, { width: 75, align: 'right' })
          .text(fmtMAD(usersCost), 465, currentY + 7, { width: 75, align: 'right' });
        currentY += 24;
      }

      // Ligne 4 : Remise commerciale éventuelle
      if (data.discountMAD && data.discountMAD > 0) {
        doc.rect(45, currentY, 505, 24).fill('#FEF2F2').strokeColor('#FECACA').stroke();
        doc.fillColor('#991B1B').fontSize(8.5).font('Helvetica-Bold')
          .text('Remise commerciale accordée (Promotion / Partenariat)', 55, currentY + 7);
        doc.fontSize(8).font('Helvetica')
          .text('Déduction contractuelle', 270, currentY + 7);
        doc.fontSize(8.5).font('Helvetica-Bold')
          .text(`-${fmtMAD(data.discountMAD)}`, 465, currentY + 7, { width: 75, align: 'right' });
        currentY += 24;
      }

      // -------------------------------------------------------------
      // RÉCAPITULATIF FINANCIER & TVA MAROCAINE
      // -------------------------------------------------------------
      const totY = currentY + 12;

      // Bloc gauche : Modalités et mentions légales
      doc.rect(45, totY, 275, 85).fill(lightBg).strokeColor(borderCol).stroke();
      doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold')
        .text('CONDITIONS CONTRACTUELLES & RÈGLEMENT :', 55, totY + 8);

      doc.fillColor(darkColor).fontSize(7.5).font('Helvetica')
        .text('• Validité du devis : 30 jours à compter de la date d’émission.', 55, totY + 22)
        .text('• Facturation officielle établie à réception du bon de commande ou virement.', 55, totY + 33)
        .text('• Accès à la plateforme activé immédiatement après confirmation.', 55, totY + 44)
        .text('• Conforme au Décret Marchés Publics et règles fiscales du Maroc.', 55, totY + 55)
        .text('• Support technique & accompagnement méthodologique inclus.', 55, totY + 66);

      // Bloc droit : Totaux HT, TVA, TTC
      doc.rect(325, totY, 225, 85).fill('#FFFFFF').strokeColor(borderCol).stroke();

      // Total HT
      doc.fillColor(mutedColor).fontSize(8.5).font('Helvetica')
        .text('Sous-Total Hors Taxes (HT) :', 335, totY + 10);
      doc.fillColor(darkColor).font('Helvetica-Bold')
        .text(fmtMAD(data.subtotalHT), 435, totY + 10, { width: 105, align: 'right' });

      // TVA 20%
      doc.fillColor(mutedColor).font('Helvetica')
        .text('TVA Marocaine (20,0%) :', 335, totY + 28);
      doc.fillColor(darkColor).font('Helvetica-Bold')
        .text(fmtMAD(data.tvaAmountMAD), 435, totY + 28, { width: 105, align: 'right' });

      // Ligne séparatrice
      doc.moveTo(335, totY + 45).lineTo(540, totY + 45).strokeColor(primaryColor).lineWidth(1.5).stroke();

      // Total Net TTC
      doc.rect(325, totY + 50, 225, 35).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(9.5).font('Helvetica-Bold')
        .text('TOTAL À PAYER (TTC) :', 335, totY + 62);
      doc.fontSize(11).font('Helvetica-Bold')
        .text(fmtMAD(data.totalTTCMAD), 430, totY + 61, { width: 110, align: 'right' });

      // Mention légale de montant
      const noteY = totY + 95;
      doc.fillColor(darkColor).fontSize(8).font('Helvetica-Oblique')
        .text(`Arrêté le présent devis proforma à la somme totale de ${fmtMAD(data.totalTTCMAD)} toutes taxes comprises.`, 45, noteY);

      // -------------------------------------------------------------
      // COORDONNÉES BANCAIRES POUR VIREMENT AU MAROC
      // -------------------------------------------------------------
      const bankY = noteY + 18;
      doc.rect(45, bankY, 505, 58).fill('#F0FDF4').strokeColor('#BBF7D0').stroke();

      doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold')
        .text('COORDONNÉES BANCAIRES OFFICIELLES POUR RÈGLEMENT PAR VIREMENT :', 55, bankY + 7);

      doc.fillColor(darkColor).fontSize(8).font('Helvetica')
        .text('Bénéficiaire : ATLAS CARBONE S.A.R.L. • Banque : Attijariwafa bank / Banque Populaire du Maroc', 55, bankY + 20)
        .text('Agence : Casablanca Anfa (Casablanca, Maroc) • Code SWIFT : BCMA MAMC', 55, bankY + 31)
        .font('Helvetica-Bold')
        .text(`RIB Officiel (24 chiffres) : 007 780 0001234567890123 45`, 55, bankY + 42)
        .fillColor('#991B1B')
        .text(`(Mention obligatoire sur l'ordre de virement : ${data.quoteNumber})`, 330, bankY + 42);

      // -------------------------------------------------------------
      // BLOCS SIGNATURES & BON POUR ACCORD
      // -------------------------------------------------------------
      const signY = bankY + 66;

      // Bloc Signature Client
      doc.rect(45, signY, 245, 68).fill('#FFFFFF').strokeColor(borderCol).stroke();
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold')
        .text('BON POUR ACCORD & COMMANDE (CLIENT) :', 55, signY + 6);
      doc.fillColor(mutedColor).fontSize(7).font('Helvetica')
        .text('Date, Signature du représentant légal et Cachet de l’entreprise :', 55, signY + 16);

      // Bloc Signature Atlas Carbone
      doc.rect(305, signY, 245, 68).fill('#FFFFFF').strokeColor(borderCol).stroke();
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold')
        .text('DIRECTION COMMERCIALE ATLAS CARBONE :', 315, signY + 6);
      doc.fillColor(mutedColor).fontSize(7).font('Helvetica')
        .text('Abdelaziz Motiaa — Fondateur & Responsable Plateforme', 315, signY + 16)
        .text('Document certifié conforme à Casablanca, Maroc.', 315, signY + 26);

      // -------------------------------------------------------------
      // PIED DE PAGE LÉGAL
      // -------------------------------------------------------------
      const footerY = 780;
      doc.rect(45, footerY, 505, 0.5).fillColor(borderCol).fill();

      doc.fillColor(mutedColor).fontSize(6.5).font('Helvetica')
        .text(
          'Atlas Carbone S.A.R.L. au capital de 100 000 MAD — RC Casablanca 567890 — Patente 34567890 — IF 45678901 — ICE 003456789000045',
          45, footerY + 5, { width: 505, align: 'center' }
        )
        .text(
          'Plateforme logicielle souveraine de comptabilité carbone (ISO 14064 / GHG Protocol) et conformité MACF/CBAM 2026.',
          45, footerY + 14, { width: 505, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
