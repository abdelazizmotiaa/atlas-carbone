/**
 * Atlas Carbone - Module Essai sans Compte & Transfert Sécurisé
 * Permet un essai immédiat avec calculs réels et migration sans couture vers un compte entreprise.
 */

import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { calculateEmission, aggregateUncertainty, EmissionFactorInput } from '../core/calculations.js';
import { generateReportPdf, ReportPdfData } from '../core/pdfReport.js';
import { SECTOR_PROFILES } from './sectors.js';

export const trialRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'atlas_carbone_secret_key_2026_maroc';
export const TRIAL_MAX_DURATION_MS = 3 * 60 * 60 * 1000; // 3 heures d'évaluation démo

function verifyGuestAccess(req: Request, res: Response, sessionId: string, enforceThreeHourLimit = false): any {
  const token = (req.headers['x-guest-token'] as string) || (req.headers['authorization']?.replace(/^Bearer\s+/i, ''));
  if (!token) {
    res.status(401).json({ error: "Accès refusé : jeton de session invitée manquant (X-Guest-Token ou Authorization Bearer requis)." });
    return null;
  }

  const session: any = db.prepare('SELECT * FROM guest_sessions WHERE id = ?').get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session d'essai introuvable ou expirée." });
    return null;
  }

  if (session.session_token !== token) {
    res.status(403).json({ error: "Jeton de session invitée invalide." });
    return null;
  }

  const now = new Date().toISOString();
  if (session.expires_at < now) {
    res.status(410).json({ error: "Cette session d'essai a expiré (durée maximale de conservation : 7 jours)." });
    return null;
  }

  // Contrôle de la limite d'évaluation de 3 heures (Demo Paywall)
  if (enforceThreeHourLimit) {
    const createdAtMs = new Date(session.created_at).getTime();
    const elapsedMs = Date.now() - createdAtMs;
    if (elapsedMs > TRIAL_MAX_DURATION_MS) {
      res.status(402).json({
        error: "PAYMENT_REQUIRED",
        code: "TRIAL_LIMIT_EXCEEDED",
        message: "Votre session d'évaluation démo gratuite de 3 heures est terminée. Veuillez souscrire à une offre annuelle en Dirhams Marocains (MAD) pour poursuivre vos calculs et générer votre bilan complet.",
        remainingSeconds: 0,
        elapsedSeconds: Math.floor(elapsedMs / 1000),
        maxDurationHours: 3,
        expired: true
      });
      return null;
    }
  }

  return session;
}

// 0. Récupérer les profils sectoriels disponibles
trialRouter.get('/sectors', (req: Request, res: Response) => {
  res.json(SECTOR_PROFILES);
});

// 1. Démarrer un essai sans compte
trialRouter.post('/start', (req: Request, res: Response) => {
  const company_name = req.body.company_name || req.body.companyName;
  const sector = req.body.sector;
  if (!company_name || !sector) {
    return res.status(400).json({ error: "Le nom de l'entreprise et le secteur d'activité sont requis pour démarrer l'essai." });
  }

  const sessionId = `guest-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const createdAt = new Date().toISOString();
  // 7 jours de validité de conservation
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const initialSummary = {
    totalTCO2e: 0,
    scope1TCO2e: 0,
    scope2TCO2e: 0,
    scope3TCO2e: 0,
    biogenicTCO2e: 0,
    uncertaintyMinTCO2e: 0,
    uncertaintyMaxTCO2e: 0,
    uncertaintyPct: 0
  };

  db.prepare(`
    INSERT INTO guest_sessions (
      id, session_token, company_name, sector, activities_json, unquantified_json, summary_json, expires_at, created_at
    ) VALUES (?, ?, ?, ?, '[]', '[]', ?, ?, ?)
  `).run(sessionId, sessionToken, company_name.trim(), sector.trim(), JSON.stringify(initialSummary), expiresAt, createdAt);

  res.status(201).json({
    sessionId,
    sessionToken,
    company_name,
    sector,
    expiresAt,
    createdAt,
    maxDurationSeconds: Math.floor(TRIAL_MAX_DURATION_MS / 1000),
    maxDurationHours: 3,
    remainingSeconds: Math.floor(TRIAL_MAX_DURATION_MS / 1000),
    retentionNotice: "Votre session d'essai est accessible pendant 3 heures et conservée pendant 7 jours. Vous pourrez la débloquer ou la rattacher à un compte à tout moment."
  });
});

// 2. Consulter la session invitée
trialRouter.get('/:sessionId', (req: Request, res: Response) => {
  const session = verifyGuestAccess(req, res, req.params.sessionId);
  if (!session) return;

  const createdAtMs = new Date(session.created_at).getTime();
  const elapsedMs = Math.max(0, Date.now() - createdAtMs);
  const remainingSeconds = Math.max(0, Math.floor((TRIAL_MAX_DURATION_MS - elapsedMs) / 1000));
  const isExpired = remainingSeconds <= 0;

  res.json({
    id: session.id,
    company_name: session.company_name,
    sector: session.sector,
    activities: JSON.parse(session.activities_json || '[]'),
    unquantified: JSON.parse(session.unquantified_json || '[]'),
    summary: JSON.parse(session.summary_json || '{}'),
    expiresAt: session.expires_at,
    claimedAt: session.claimed_at,
    createdAt: session.created_at,
    remainingSeconds,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    maxDurationSeconds: Math.floor(TRIAL_MAX_DURATION_MS / 1000),
    maxDurationHours: 3,
    isExpired
  });
});

// 3. Calculer et ajouter une activité dans la session d'essai
trialRouter.post('/:sessionId/calculate', (req: Request, res: Response) => {
  const session = verifyGuestAccess(req, res, req.params.sessionId, true);
  if (!session) return;

  const factor_id = req.body.factor_id || req.body.factorId;
  const { category, label, quantity, unit, allowProvisionalScope1 } = req.body;
  if (!label || quantity === undefined || !unit || !factor_id) {
    return res.status(400).json({ error: "Champs obligatoires manquants (label, quantity, unit, factor_id)." });
  }

  // Chercher le facteur officiel
  const factorRow: any = db.prepare('SELECT * FROM emission_factors WHERE id = ?').get(factor_id);
  if (!factorRow) {
    return res.status(404).json({ error: `Facteur d'émission introuvable : ${factor_id}` });
  }

  const factorInput: EmissionFactorInput = {
    id: factorRow.id,
    name: factorRow.name,
    value: factorRow.value,
    numeratorUnit: factorRow.numerator_unit,
    denominatorUnit: factorRow.denominator_unit,
    scope: factorRow.scope,
    perimeter: factorRow.perimeter,
    isAlreadyCO2e: true,
    uncertaintyPct: factorRow.uncertainty_pct || 0.20,
    source: factorRow.source,
    version: factorRow.version
  };

  try {
    const calcResult = calculateEmission({
      activityLabel: label,
      quantity: Number(quantity),
      unit: String(unit),
      factor: factorInput,
      activityUncertaintyPct: 0.05,
      allowProvisionalScope1: Boolean(allowProvisionalScope1),
      billAmountMad: req.body.billAmountMad ? Number(req.body.billAmountMad) : undefined,
      billPresetId: req.body.billPresetId ? String(req.body.billPresetId) : undefined,
      unitPriceMad: req.body.unitPriceMad ? Number(req.body.unitPriceMad) : undefined
    });

    const activities: any[] = JSON.parse(session.activities_json || '[]');
    const newAct = {
      id: `act-guest-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: category || factorRow.category,
      scope: factorRow.scope,
      label,
      quantity: Number(quantity),
      unit: String(unit),
      factor_id: factorRow.id,
      factor_name: factorRow.name,
      factor_source: factorRow.source,
      emission_kg_co2e: calcResult.emissionKgCO2e,
      emission_t_co2e: calcResult.emissionTCO2e,
      is_biogenic: calcResult.isBiogenic ? 1 : 0,
      uncertainty_relative: calcResult.uncertaintyRelative,
      uncertainty_absolute_kg: calcResult.uncertaintyAbsoluteKg,
      trace: calcResult.trace,
      created_at: new Date().toISOString()
    };
    activities.push(newAct);

    // Recalculer le résumé global de la session
    let s1 = 0, s2 = 0, s3 = 0, bio = 0;
    const uncItems: any[] = [];
    for (const a of activities) {
      if (a.is_biogenic) bio += a.emission_kg_co2e;
      else {
        if (a.scope === 1) s1 += a.emission_kg_co2e;
        else if (a.scope === 2) s2 += a.emission_kg_co2e;
        else if (a.scope === 3) s3 += a.emission_kg_co2e;
      }
      uncItems.push({
        emissionKgCO2e: a.emission_kg_co2e,
        uncertaintyAbsoluteKg: a.uncertainty_absolute_kg || (a.emission_kg_co2e * 0.20)
      });
    }

    const uncAgg = aggregateUncertainty(uncItems);
    const updatedSummary = {
      totalTCO2e: (s1 + s2 + s3) / 1000.0,
      scope1TCO2e: s1 / 1000.0,
      scope2TCO2e: s2 / 1000.0,
      scope3TCO2e: s3 / 1000.0,
      biogenicTCO2e: bio / 1000.0,
      uncertaintyMinTCO2e: uncAgg.confidenceInterval95Kg.min / 1000.0,
      uncertaintyMaxTCO2e: uncAgg.confidenceInterval95Kg.max / 1000.0,
      uncertaintyPct: uncAgg.uncertaintyRelativePct
    };

    db.prepare('UPDATE guest_sessions SET activities_json = ?, summary_json = ? WHERE id = ?')
      .run(JSON.stringify(activities), JSON.stringify(updatedSummary), session.id);

    res.status(201).json({
      activity: newAct,
      summary: updatedSummary
    });
  } catch (err: any) {
    return res.status(422).json({ error: err.message });
  }
});

// 4. Déclarer une activité non quantifiée (Règle de rigueur : pas de faux zéro)
trialRouter.post('/:sessionId/unquantified', (req: Request, res: Response) => {
  const session = verifyGuestAccess(req, res, req.params.sessionId, true);
  if (!session) return;

  const { category, label, reason, notes } = req.body;
  if (!label || !category) {
    return res.status(400).json({ error: "Catégorie et libellé de l'activité requis." });
  }

  const unquantified: any[] = JSON.parse(session.unquantified_json || '[]');
  const item = {
    id: `unq-guest-${Date.now()}`,
    category,
    label,
    reason: reason || 'Poste identifié, non quantifié : facteur disponible insuffisant',
    notes: notes || '',
    created_at: new Date().toISOString()
  };
  unquantified.push(item);

  db.prepare('UPDATE guest_sessions SET unquantified_json = ? WHERE id = ?')
    .run(JSON.stringify(unquantified), session.id);

  res.status(201).json({
    message: "Poste identifié enregistré comme non quantifié sans affectation de zéro factice.",
    item,
    unquantified
  });
});

// 5. Télécharger le rapport préliminaire PDF
trialRouter.get('/:sessionId/pdf', async (req: Request, res: Response) => {
  const session = verifyGuestAccess(req, res, req.params.sessionId);
  if (!session) return;

  const lang = (req.query.lang === 'en' ? 'en' : 'fr') as 'fr' | 'en';
  const activities: any[] = JSON.parse(session.activities_json || '[]');
  const unquantified: any[] = JSON.parse(session.unquantified_json || '[]');
  const summary: any = JSON.parse(session.summary_json || '{}');

  const pdfData: ReportPdfData = {
    companyName: session.company_name,
    city: 'Session d’essai Maroc',
    sector: session.sector,
    periodYear: new Date().getFullYear(),
    consolidationApproach: 'operational_control',
    isPreliminary: true,
    status: 'Brouillon d’essai (Non audité)',
    generatedDate: new Date().toISOString().split('T')[0],
    summary: {
      totalTCO2e: summary.totalTCO2e || 0,
      scope1TCO2e: summary.scope1TCO2e || 0,
      scope2TCO2e: summary.scope2TCO2e || 0,
      scope3TCO2e: summary.scope3TCO2e || 0,
      biogenicTCO2e: summary.biogenicTCO2e || 0,
      uncertaintyMinTCO2e: summary.uncertaintyMinTCO2e || 0,
      uncertaintyMaxTCO2e: summary.uncertaintyMaxTCO2e || 0,
      uncertaintyPct: summary.uncertaintyPct || 0
    },
    activities: activities.map(a => ({
      category: a.category,
      scope: a.scope,
      label: a.label,
      quantity: a.quantity,
      unit: a.unit,
      emissionTCO2e: a.emission_t_co2e,
      factorName: a.factor_name,
      factorSource: a.factor_source
    })),
    unquantified: unquantified.map(u => ({
      category: u.category,
      label: u.label,
      reason: u.reason,
      notes: u.notes
    }))
  };

  try {
    const pdfBuffer = await generateReportPdf(pdfData, lang);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rapport_Essai_AtlasCarbone_${session.company_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: "Erreur lors de la génération du rapport PDF : " + err.message });
  }
});

// 6. Créer mon compte et conserver mon bilan (Migration sécurisée)
trialRouter.post('/claim', (req: Request, res: Response) => {
  const sessionId = req.body.sessionId || req.body.guestSessionId;
  const sessionToken = req.body.sessionToken || req.body.guestToken;
  const email = req.body.email;
  const password = req.body.password;
  const full_name = req.body.full_name || req.body.fullName;
  const company_name = req.body.company_name || req.body.companyName;
  const city = req.body.city;

  if (!sessionId || !sessionToken || !email || !password || !full_name) {
    return res.status(400).json({ error: "Champs obligatoires manquants (sessionId, sessionToken, email, password, full_name)." });
  }

  // Vérification de la session
  const session: any = db.prepare('SELECT * FROM guest_sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session d'essai introuvable." });
  }
  if (session.session_token !== sessionToken) {
    return res.status(403).json({ error: "Jeton de session invalide. Transfert non autorisé." });
  }
  if (session.claimed_at) {
    return res.status(400).json({ error: "Cette session d'essai a déjà été transférée dans un compte entreprise." });
  }

  // Création ou récupération de l'utilisateur
  const normalizedEmail = email.toLowerCase().trim();
  let user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  const salt = bcrypt.genSaltSync(10);

  if (!user) {
    const userId = `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const passwordHash = bcrypt.hashSync(password, salt);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, is_superadmin, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(userId, normalizedEmail, passwordHash, full_name.trim(), new Date().toISOString());
    user = { id: userId, email: normalizedEmail, full_name: full_name.trim(), is_superadmin: 0 };
  } else {
    // Si l'utilisateur existe déjà, vérifier le mot de passe
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Un compte existe déjà avec cette adresse email. Veuillez renseigner le mot de passe associé." });
    }
  }

  // Créer la nouvelle organisation
  const orgId = `org-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const orgName = company_name?.trim() || session.company_name;
  db.prepare(`
    INSERT INTO organizations (id, name, legal_type, city, sector, created_at)
    VALUES (?, ?, 'SARL', ?, ?, ?)
  `).run(orgId, orgName, city?.trim() || 'Casablanca', session.sector, new Date().toISOString());

  // Créer l'adhésion admin
  db.prepare(`
    INSERT INTO memberships (id, user_id, organization_id, role, created_at)
    VALUES (?, ?, ?, 'admin', ?)
  `).run(`mem-${Date.now()}`, user.id, orgId, new Date().toISOString());

  // Créer un site principal
  const siteId = `site-${Date.now()}`;
  db.prepare(`
    INSERT INTO sites (id, organization_id, name, city, address, created_at)
    VALUES (?, ?, 'Siège & Activités principales', ?, '', ?)
  `).run(siteId, orgId, city?.trim() || 'Casablanca', new Date().toISOString());

  // Créer l'exercice de reporting actif
  const currentYear = new Date().getFullYear();
  const periodId = `per-${Date.now()}`;
  db.prepare(`
    INSERT INTO reporting_periods (id, organization_id, name, year, start_date, end_date, consolidation_approach, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'operational_control', 'draft', ?)
  `).run(periodId, orgId, `Exercice ${currentYear}`, currentYear, `${currentYear}-01-01`, `${currentYear}-12-31`, new Date().toISOString());

  // Créer l'abonnement d'essai
  db.prepare(`
    INSERT INTO subscriptions (id, organization_id, plan_name, status, sites_limit, users_limit, cbam_access, current_period_end, created_at)
    VALUES (?, ?, 'essentiel', 'trial', 2, 3, 0, ?, ?)
  `).run(`sub-${Date.now()}`, orgId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString());

  // Migrer les activités de la session vers l'organisation permanente
  const guestActivities: any[] = JSON.parse(session.activities_json || '[]');
  const insertAct = db.prepare(`
    INSERT INTO activity_records (
      id, reporting_period_id, site_id, organization_id, category, scope, iso_category,
      label, quantity, unit, factor_id, factor_version, emission_kg_co2e, emission_t_co2e,
      is_biogenic, uncertainty_relative, uncertainty_absolute_kg, calculation_trace_json,
      status, created_by, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, '1.0', ?, ?,
      ?, ?, ?, ?,
      'active', ?, ?
    )
  `);

  for (const a of guestActivities) {
    const actId = `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    insertAct.run(
      actId, periodId, siteId, orgId, a.category, a.scope, a.scope,
      a.label, a.quantity, a.unit, a.factor_id, a.emission_kg_co2e, a.emission_t_co2e,
      a.is_biogenic || 0, a.uncertainty_relative || 0.2, a.uncertainty_absolute_kg || (a.emission_kg_co2e * 0.2),
      JSON.stringify(a.trace || {}), user.id, new Date().toISOString()
    );
  }

  // Migrer les activités non quantifiées
  const guestUnquantified: any[] = JSON.parse(session.unquantified_json || '[]');
  const insertUnq = db.prepare(`
    INSERT INTO unquantified_activities (
      id, reporting_period_id, organization_id, site_id, category, label, reason, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of guestUnquantified) {
    insertUnq.run(
      `unq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      periodId, orgId, siteId, u.category, u.label, u.reason, u.notes || '', new Date().toISOString()
    );
  }

  // Marquer la session d'essai comme rattachée
  db.prepare('UPDATE guest_sessions SET claimed_at = ?, claimed_by_org_id = ? WHERE id = ?')
    .run(new Date().toISOString(), orgId, session.id);

  // Générer le jeton JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, full_name: user.full_name, is_superadmin: user.is_superadmin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: "Félicitations ! Votre dossier d'essai a été transféré avec succès dans votre nouvel espace entreprise.",
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, is_superadmin: user.is_superadmin },
    organization: { id: orgId, name: orgName, sector: session.sector, city: city || 'Casablanca', role: 'admin' },
    migratedActivitiesCount: guestActivities.length,
    migratedUnquantifiedCount: guestUnquantified.length
  });
});
