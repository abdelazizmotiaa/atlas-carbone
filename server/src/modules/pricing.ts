/**
 * Atlas Carbone - Module Tarification & Monétisation en Dirhams Marocains (MAD)
 * Conforme à AGENTS.md :
 * - Prix officiels et devis exclusivement en Dirhams Marocains (MAD).
 * - Contact officiel : Abdelaziz Motiaa (abdelaziz.motiaa@gmail.com / +212671581167).
 * - Virement bancaire proforma avec RIB marocain ou carte bancaire CMI.
 */

import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';

export const pricingRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'atlas_carbone_secret_key_2026_maroc';

export interface PlanDefinition {
  id: string;
  name: string;
  nameEn: string;
  badge?: string;
  badgeEn?: string;
  description: string;
  descriptionEn: string;
  priceMADYearHT: number;
  priceMADMonthHT: number;
  tvaRate: number; // 0.20
  totalMADYearTTC: number;
  popular?: boolean;
  limits: {
    maxDurationHours?: number; // 3h pour la démo
    sitesLimit: number | 'illimité';
    usersLimit: number | 'illimité';
    scopes: string;
    cbamAccess: boolean;
    auditTrail: boolean;
    erpApi: boolean;
    dedicatedSupport: boolean;
  };
  featuresFr: string[];
  featuresEn: string[];
}

export const PRICING_PLANS: PlanDefinition[] = [
  {
    id: 'demo_trial',
    name: 'Pack Découverte (Démo 3h)',
    nameEn: 'Discovery Demo (3h Trial)',
    badge: 'Gratuit',
    badgeEn: 'Free',
    description: 'Accès d’évaluation immédiat pour tester le moteur déterministe et explorer les questionnaires sectoriels.',
    descriptionEn: 'Instant evaluation access to test the deterministic engine and explore sector questionnaires.',
    priceMADYearHT: 0,
    priceMADMonthHT: 0,
    tvaRate: 0.20,
    totalMADYearTTC: 0,
    limits: {
      maxDurationHours: 3,
      sitesLimit: 1,
      usersLimit: 1,
      scopes: 'Scopes 1 & 2 préliminaires',
      cbamAccess: false,
      auditTrail: false,
      erpApi: false,
      dedicatedSupport: false
    },
    featuresFr: [
      'Durée limitée à 3 heures d’évaluation active',
      '1 Diagnostic sectoriel guidé au choix',
      'Simulateur factures ONEE & carburants en Dirhams (MAD)',
      'Calculs déterministes sécurisés côté serveur',
      'Rapport PDF d’essai avec réserves méthodologiques',
      'Transfert sécurisé vers un compte entreprise sans ressaisie'
    ],
    featuresEn: [
      'Limited to 3 hours of active demo evaluation',
      '1 Guided sector assessment of your choice',
      'ONEE electric & fuel bills simulator in Moroccan Dirhams (MAD)',
      'Deterministic calculations run securely server-side',
      'Preliminary trial PDF report with methodological notices',
      'Seamless transfer to full enterprise account without retyping'
    ]
  },
  {
    id: 'pme_climat',
    name: 'Pack PME Climat',
    nameEn: 'SME Climate Pack',
    badge: 'PME Marocaines',
    badgeEn: 'Moroccan SMEs',
    description: 'La solution complète pour répondre aux exigences des donneurs d’ordre et des appels d’offres publics marocains.',
    descriptionEn: 'The turnkey solution for Moroccan public tenders and prime contractor climate requirements.',
    priceMADYearHT: 4900,
    priceMADMonthHT: 490,
    tvaRate: 0.20,
    totalMADYearTTC: 5880,
    limits: {
      sitesLimit: 1,
      usersLimit: 3,
      scopes: 'Scopes 1, 2 + Scope 3 Essentiel',
      cbamAccess: false,
      auditTrail: true,
      erpApi: false,
      dedicatedSupport: false
    },
    featuresFr: [
      '1 Site d’exploitation permanent au Maroc',
      'Scopes 1 & 2 complets + Scope 3 essentiel (achats clés, fret)',
      'Saisie directe des factures ONEE, gasoil et gaz en Dirhams (MAD)',
      'Téléchargement illimité des Bilans Carbone PDF officiels certifiés',
      'Conforme ISO 14064-1 & Décret Marchés Publics du Royaume',
      '3 Utilisateurs inclus (Admin, Responsable Carbone, Contributeur)',
      'Export complet des données d’activité au format Excel'
    ],
    featuresEn: [
      '1 Permanent operating site in Morocco',
      'Full Scopes 1 & 2 + essential Scope 3 (key purchases, transport)',
      'Direct input of ONEE, diesel and gas invoices in Dirhams (MAD)',
      'Unlimited download of certified official PDF Carbon Reports',
      'ISO 14064-1 & Moroccan Public Procurement Decree compliant',
      '3 Users included (Admin, Carbon Manager, Contributor)',
      'Full activity data export to Excel'
    ]
  },
  {
    id: 'entreprise_macf',
    name: 'Pack Entreprise & Exportateur MACF',
    nameEn: 'Enterprise & CBAM Exporter Pack',
    badge: 'Recommandé • Exportateurs UE',
    badgeEn: 'Recommended • EU Exporters',
    popular: true,
    description: 'Conçu pour les industriels et exportateurs soumis à la taxe carbone européenne MACF/CBAM et aux banques.',
    descriptionEn: 'Engineered for manufacturers and exporters subject to EU CBAM carbon border tax and green bank rules.',
    priceMADYearHT: 14500,
    priceMADMonthHT: 1450,
    tvaRate: 0.20,
    totalMADYearTTC: 17400,
    limits: {
      sitesLimit: 5,
      usersLimit: 10,
      scopes: 'Scopes 1, 2, 3 complets (15 catégories)',
      cbamAccess: true,
      auditTrail: true,
      erpApi: false,
      dedicatedSupport: true
    },
    featuresFr: [
      'Jusqu’à 5 Sites de production / usines / plateformes logistiques',
      'Scopes 1, 2 et 3 exhaustifs (les 15 catégories du GHG Protocol)',
      'Module Déclaration MACF / CBAM Union Européenne certifié',
      'Intensité carbone unitaire par tonne produite & exportée vers l’UE',
      'Dossier de conformité Directive Climat Bank Al-Maghrib (Crédits Verts)',
      'Jusqu’à 10 utilisateurs avec gestion des rôles (RBAC)',
      'Piste d’audit immuable et horodatée pour réviseurs',
      'Support prioritaire par email & téléphone sous 24h'
    ],
    featuresEn: [
      'Up to 5 production facilities / plants / logistic hubs',
      'Comprehensive Scopes 1, 2 and 3 (all 15 GHG Protocol categories)',
      'Certified EU CBAM / MACF Border Carbon Tax Declaration Module',
      'Specific carbon intensity per ton manufactured & exported to EU',
      'Bank Al-Maghrib Climate Directive compliance file for green credit',
      'Up to 10 users with granular Role-Based Access Control (RBAC)',
      'Immutable audit trail and timestamping for reviewers',
      'Priority email & phone support within 24 business hours'
    ]
  },
  {
    id: 'grand_compte',
    name: 'Pack Grand Compte & Industrie',
    nameEn: 'Corporate & Heavy Industry Pack',
    badge: 'Sur Mesure & Multisites',
    badgeEn: 'Custom & Multisite',
    description: 'Pour les grands groupes multisites, cimenteries, métallurgie, engrais et grandes flottes de transport.',
    descriptionEn: 'For large multisite corporate groups, cement, metallurgy, fertilizers and large logistics fleets.',
    priceMADYearHT: 29000,
    priceMADMonthHT: 2900,
    tvaRate: 0.20,
    totalMADYearTTC: 34800,
    limits: {
      sitesLimit: 'illimité',
      usersLimit: 'illimité',
      scopes: 'Scopes 1, 2, 3 + Trajectoire SBTi',
      cbamAccess: true,
      auditTrail: true,
      erpApi: true,
      dedicatedSupport: true
    },
    featuresFr: [
      'Nombre de sites et d’utilisateurs illimité',
      'Portail vérificateur externe pour Auditeur accrédité ISO 14065',
      'Connecteurs API ERP & import massif automatisé de factures',
      'Trajectoire pluriannuelle de décarbonation Cap 2030 (BAM / SBTi)',
      'Accord de Confidentialité renforcé (NDA) & hébergement souverain',
      'Accompagnement méthodologique dédié par nos experts seniors'
    ],
    featuresEn: [
      'Unlimited operating sites and user seats',
      'Dedicated external verifier portal for ISO 14065 accredited auditor',
      'ERP API connectors & automated bulk invoice ingestion',
      'Multi-year Cap 2030 decarbonization roadmap (BAM / SBTi)',
      'Enhanced Non-Disclosure Agreement (NDA) & sovereign hosting',
      'Dedicated methodological guidance by senior climate experts'
    ]
  }
];

// Informations officielles de règlement par Virement Bancaire au Maroc
export const BANKING_INFO_MAROC = {
  beneficiaire: 'ATLAS CARBONE S.A.R.L.',
  banque: 'Attijariwafa bank / Banque Populaire du Maroc',
  agence: 'Casablanca Anfa / Casablanca Bd d’Anfa',
  rib: '007 780 0001234567890123 45',
  swift: 'BCMA MAMC',
  devise: 'MAD (Dirham Marocain)',
  delaiValidation: 'Activation immédiate sur envoi de l’ordre de virement cacheté',
  contactFacturation: {
    responsable: 'Abdelaziz Motiaa',
    email: 'abdelaziz.motiaa@gmail.com',
    telephone: '+212671581167'
  }
};

// 1. Obtenir les offres en Dirhams
pricingRouter.get('/plans', (req: Request, res: Response) => {
  res.json({
    currency: 'MAD',
    symbol: 'DH / MAD',
    plans: PRICING_PLANS,
    banking: BANKING_INFO_MAROC,
    disclaimerFr: 'Tous les tarifs sont indiqués en Dirhams marocains (MAD) hors taxes. TVA légale de 20% applicable sur facturation officielle.',
    disclaimerEn: 'All pricing is quoted in Moroccan Dirhams (MAD) excluding tax. Official Moroccan 20% VAT applies upon invoice.'
  });
});

// 2. Traitement d'une souscription / commande en MAD
pricingRouter.post('/checkout', (req: Request, res: Response) => {
  const {
    planId,
    companyName,
    contactName,
    email,
    phone,
    iceNumber,
    city,
    billingCycle, // 'annual' | 'monthly'
    paymentMethod, // 'cmi_card' | 'bank_transfer' | 'quote'
    guestSessionId, // optionnel pour migration automatique
    password // optionnel si nouveau compte à créer
  } = req.body;

  if (!planId || !companyName || !contactName || !email) {
    return res.status(400).json({ error: "Champs obligatoires manquants (planId, companyName, contactName, email)." });
  }

  const plan = PRICING_PLANS.find(p => p.id === planId);
  if (!plan) {
    return res.status(404).json({ error: "Offre introuvable." });
  }

  const cycle = billingCycle === 'monthly' ? 'monthly' : 'annual';
  const amountHT = cycle === 'monthly' ? plan.priceMADMonthHT : plan.priceMADYearHT;
  const tvaAmount = amountHT * 0.20;
  const totalTTC = amountHT + tvaAmount;

  const orderId = `ord-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const orderNumber = `BC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let paymentStatus = 'pending';
  let paymentReference = '';

  if (paymentMethod === 'cmi_card') {
    // Simulation CMI (Centre Monétique Interbancaire Maroc)
    paymentStatus = 'paid';
    paymentReference = `CMI-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  } else if (paymentMethod === 'bank_transfer') {
    paymentStatus = 'pending_transfer';
    paymentReference = `VIR-${orderNumber}`;
  } else {
    paymentStatus = 'quote_requested';
    paymentReference = `DEV-${orderNumber}`;
  }

  // 1. Enregistrer la commande dans la base
  try {
    db.prepare(`
      INSERT INTO orders (
        id, order_number, company_name, contact_name, contact_email, contact_phone,
        ice_number, city, plan_id, plan_name, billing_cycle,
        amount_ht_mad, tva_rate, tva_amount_mad, total_ttc_mad,
        payment_method, payment_status, payment_reference, notes, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, 0.20, ?, ?,
        ?, ?, ?, ?, ?
      )
    `).run(
      orderId, orderNumber, companyName.trim(), contactName.trim(), email.toLowerCase().trim(), phone || '',
      iceNumber || '', city || 'Casablanca', plan.id, plan.name, cycle,
      amountHT, tvaAmount, totalTTC,
      paymentMethod || 'bank_transfer', paymentStatus, paymentReference,
      guestSessionId ? `Lié à la session invitée ${guestSessionId}` : '',
      new Date().toISOString()
    );
  } catch (err: any) {
    console.error("Erreur enregistrement commande:", err);
  }

  // 2. Si une session d'essai était active et qu'un mot de passe est fourni, transférer automatiquement
  let authResult: any = null;
  if (guestSessionId && password) {
    const session: any = db.prepare('SELECT * FROM guest_sessions WHERE id = ?').get(guestSessionId);
    if (session && !session.claimed_at) {
      try {
        const normalizedEmail = email.toLowerCase().trim();
        let user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
        const salt = bcrypt.genSaltSync(10);

        if (!user) {
          const userId = `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
          const passwordHash = bcrypt.hashSync(password, salt);
          db.prepare(`
            INSERT INTO users (id, email, password_hash, full_name, is_superadmin, created_at)
            VALUES (?, ?, ?, ?, 0, ?)
          `).run(userId, normalizedEmail, passwordHash, contactName.trim(), new Date().toISOString());
          user = { id: userId, email: normalizedEmail, full_name: contactName.trim(), is_superadmin: 0 };
        }

        const orgId = `org-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        db.prepare(`
          INSERT INTO organizations (id, name, legal_type, city, sector, created_at)
          VALUES (?, ?, 'SARL', ?, ?, ?)
        `).run(orgId, companyName.trim(), city?.trim() || 'Casablanca', session.sector, new Date().toISOString());

        db.prepare(`
          INSERT INTO memberships (id, user_id, organization_id, role, created_at)
          VALUES (?, ?, ?, 'admin', ?)
        `).run(`mem-${Date.now()}`, user.id, orgId, new Date().toISOString());

        const siteId = `site-${Date.now()}`;
        db.prepare(`
          INSERT INTO sites (id, organization_id, name, city, address, created_at)
          VALUES (?, ?, 'Siège & Usine principale', ?, '', ?)
        `).run(siteId, orgId, city?.trim() || 'Casablanca', new Date().toISOString());

        const currentYear = new Date().getFullYear();
        const periodId = `per-${Date.now()}`;
        db.prepare(`
          INSERT INTO reporting_periods (id, organization_id, name, year, start_date, end_date, consolidation_approach, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'operational_control', 'draft', ?)
        `).run(periodId, orgId, `Exercice ${currentYear}`, currentYear, `${currentYear}-01-01`, `${currentYear}-12-31`, new Date().toISOString());

        // Créer l'abonnement rattaché à l'offre choisie
        const subStatus = paymentStatus === 'paid' ? 'active' : 'trial';
        const sitesLimit = typeof plan.limits.sitesLimit === 'number' ? plan.limits.sitesLimit : 99;
        const usersLimit = typeof plan.limits.usersLimit === 'number' ? plan.limits.usersLimit : 99;
        db.prepare(`
          INSERT INTO subscriptions (id, organization_id, plan_name, status, sites_limit, users_limit, cbam_access, current_period_end, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(`sub-${Date.now()}`, orgId, plan.id, subStatus, sitesLimit, usersLimit, plan.limits.cbamAccess ? 1 : 0, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString());

        // Rattacher la session
        db.prepare('UPDATE guest_sessions SET claimed_at = ?, claimed_by_org_id = ? WHERE id = ?')
          .run(new Date().toISOString(), orgId, session.id);

        // Mettre à jour l'ordre avec l'organisation
        db.prepare('UPDATE orders SET organization_id = ? WHERE id = ?').run(orgId, orderId);

        const token = jwt.sign(
          { id: user.id, email: user.email, full_name: user.full_name, is_superadmin: user.is_superadmin },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        authResult = {
          token,
          user,
          organization: { id: orgId, name: companyName.trim(), sector: session.sector, city: city || 'Casablanca', role: 'admin' }
        };
      } catch (err: any) {
        console.error("Erreur rattachement automatique lors du paiement:", err);
      }
    }
  }

  // 3. Enregistrer un accusé de réception / confirmation
  try {
    db.prepare(`
      INSERT INTO dev_notifications (id, recipient_email, subject, template_name, content_html, sent_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `notif-order-${Date.now()}`, email,
      `Confirmation de votre commande Atlas Carbone — ${orderNumber} (${plan.name})`,
      'order_confirmation',
      `<p>Bonjour ${contactName},</p><p>Votre commande pour le <strong>${plan.name}</strong> a été enregistrée avec succès sous la référence <strong>${orderNumber}</strong>.</p><p>Montant total TTC : <strong>${totalTTC.toLocaleString('fr-FR')} MAD</strong>.</p>`,
      new Date().toISOString()
    );
  } catch (e) {
    // Ignore notification error
  }

  res.status(201).json({
    message: paymentMethod === 'cmi_card'
      ? "Paiement par carte validé avec succès ! Votre abonnement est activé."
      : "Votre bon de commande a été généré. Veuillez effectuer le virement bancaire sur le RIB indiqué.",
    orderId,
    orderNumber,
    planId: plan.id,
    planName: plan.name,
    amountHT,
    tvaAmount,
    totalTTC,
    currency: 'MAD',
    paymentStatus,
    paymentReference,
    banking: BANKING_INFO_MAROC,
    authResult
  });
});

// 3. Obtenir les détails d'une commande
pricingRouter.get('/orders/:orderId', (req: Request, res: Response) => {
  const order: any = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(req.params.orderId, req.params.orderId);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });
  res.json({ order, banking: BANKING_INFO_MAROC });
});

// 4. Simulation de Paiement Carte Bancaire CMI (Centre Monétique Interbancaire Maroc)
pricingRouter.post('/orders/:orderId/pay-cmi', (req: Request, res: Response) => {
  const order: any = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(req.params.orderId, req.params.orderId);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });

  const authCode = `AUTH-CMI-${Math.floor(100000 + Math.random() * 900000)}`;
  const paymentRef = `CMI-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  // Mettre à jour la commande
  db.prepare(`
    UPDATE orders
    SET payment_status = 'paid', payment_reference = ?, notes = coalesce(notes || ' | ', '') || ?
    WHERE id = ?
  `).run(paymentRef, `Autorisation CMI 3D-Secure validée (Code : ${authCode})`, order.id);

  // Activer ou mettre à niveau l'abonnement si une organisation est rattachée
  if (order.organization_id) {
    const plan = PRICING_PLANS.find(p => p.id === order.plan_id) || PRICING_PLANS[1];
    const sitesLimit = typeof plan.limits.sitesLimit === 'number' ? plan.limits.sitesLimit : 99;
    const usersLimit = typeof plan.limits.usersLimit === 'number' ? plan.limits.usersLimit : 99;
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const existingSub: any = db.prepare('SELECT id FROM subscriptions WHERE organization_id = ?').get(order.organization_id);
    if (existingSub) {
      db.prepare(`
        UPDATE subscriptions
        SET plan_name = ?, status = 'active', sites_limit = ?, users_limit = ?, cbam_access = ?, current_period_end = ?
        WHERE organization_id = ?
      `).run(plan.id, sitesLimit, usersLimit, plan.limits.cbamAccess ? 1 : 0, oneYearLater, order.organization_id);
    } else {
      db.prepare(`
        INSERT INTO subscriptions (id, organization_id, plan_name, status, sites_limit, users_limit, cbam_access, current_period_end, created_at)
        VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)
      `).run(`sub-${Date.now()}`, order.organization_id, plan.id, sitesLimit, usersLimit, plan.limits.cbamAccess ? 1 : 0, oneYearLater, new Date().toISOString());
    }
  }

  res.json({
    success: true,
    message: "Transaction carte bancaire CMI autorisée avec succès !",
    authorizationCode: authCode,
    paymentReference: paymentRef,
    orderId: order.id,
    orderNumber: order.order_number,
    amountPaidMAD: order.total_ttc_mad,
    status: 'paid'
  });
});

// 5. Envoi d'ordre / preuve de virement bancaire proforma
pricingRouter.post('/orders/:orderId/transfer-proof', (req: Request, res: Response) => {
  const { transferReference, bankName, transferDate, comments } = req.body;
  const order: any = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(req.params.orderId, req.params.orderId);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });

  const note = `Preuve virement soumise : Réf ${transferReference || 'N/A'} (${bankName || 'Banque marocaine'}) le ${transferDate || new Date().toISOString().split('T')[0]}. ${comments || ''}`;

  db.prepare(`
    UPDATE orders
    SET payment_status = 'transfer_receipt_uploaded', notes = coalesce(notes || ' | ', '') || ?
    WHERE id = ?
  `).run(note, order.id);

  res.json({
    success: true,
    message: "Preuve de virement bancaire reçue. Votre compte sera activé dès rapprochement bancaire sous 24h.",
    orderId: order.id,
    status: 'transfer_receipt_uploaded'
  });
});

// 6. Confirmation manuelle de virement (Super Admin / Admin)
pricingRouter.post('/orders/:orderId/confirm', (req: Request, res: Response) => {
  const order: any = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(req.params.orderId, req.params.orderId);
  if (!order) return res.status(404).json({ error: "Commande introuvable." });

  db.prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?").run(order.id);

  if (order.organization_id) {
    const plan = PRICING_PLANS.find(p => p.id === order.plan_id) || PRICING_PLANS[1];
    const sitesLimit = typeof plan.limits.sitesLimit === 'number' ? plan.limits.sitesLimit : 99;
    const usersLimit = typeof plan.limits.usersLimit === 'number' ? plan.limits.usersLimit : 99;
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const existingSub: any = db.prepare('SELECT id FROM subscriptions WHERE organization_id = ?').get(order.organization_id);
    if (existingSub) {
      db.prepare(`
        UPDATE subscriptions
        SET plan_name = ?, status = 'active', sites_limit = ?, users_limit = ?, cbam_access = ?, current_period_end = ?
        WHERE organization_id = ?
      `).run(plan.id, sitesLimit, usersLimit, plan.limits.cbamAccess ? 1 : 0, oneYearLater, order.organization_id);
    } else {
      db.prepare(`
        INSERT INTO subscriptions (id, organization_id, plan_name, status, sites_limit, users_limit, cbam_access, current_period_end, created_at)
        VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)
      `).run(`sub-${Date.now()}`, order.organization_id, plan.id, sitesLimit, usersLimit, plan.limits.cbamAccess ? 1 : 0, oneYearLater, new Date().toISOString());
    }
  }

  res.json({
    success: true,
    message: "Commande et abonnement confirmés avec succès.",
    orderId: order.id,
    status: 'paid'
  });
});
