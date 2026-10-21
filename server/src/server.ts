/**
 * Atlas Carbone - Serveur API Express & Contrôleurs Métier
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db/database.js';
import { runSeeds } from './db/seed.js';
import {
  calculateEmission,
  aggregateUncertainty,
  calculateCBAMSpecificEmbeddedEmissions,
  EmissionFactorInput
} from './core/calculations.js';
import {
  convertQuantity,
  areUnitsCompatible,
  normalizeUnitCode,
  convertBillToPhysical,
  BILL_CONVERSION_PRESETS,
  UNIT_REGISTRY
} from './core/units.js';
import { generateReportPdf, ReportPdfData } from './core/pdfReport.js';
import { generateExcelReport, ExcelReportData } from './core/excelReport.js';
import { generateQuotePdf } from './core/quotePdf.js';
import { trialRouter } from './modules/trial.js';
import { contentRouter } from './modules/content.js';
import { assistantRouter } from './modules/assistant.js';
import { pricingRouter } from './modules/pricing.js';
import { integrationsRouter } from './modules/integrations.js';
import { SECTOR_PROFILES } from './modules/sectors.js';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'atlas_carbone_secret_key_2026_maroc';

// Dossier de stockage sécurisé des pièces jointes d'activité (factures, preuves)
const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads/evidences');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proof-${uniqueSuffix}${ext}`);
  }
});

const uploadEvidence = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Format de fichier non autorisé. Formats acceptés : PDF, PNG, JPG/JPEG (max 10 Mo)."));
    }
  }
});

app.use(cors());
app.use(express.json());

// Référentiel des Unités et Conversions de Factures (MAD -> Physique)
app.get('/api/units/registry', (_req, res) => {
  res.json(UNIT_REGISTRY);
});

app.get('/api/units/bill-presets', (_req, res) => {
  res.json(Object.values(BILL_CONVERSION_PRESETS));
});

app.post('/api/units/convert-bill', (req, res) => {
  const { amountMad, presetId, customUnitPrice } = req.body;
  if (!amountMad || !presetId) {
    return res.status(400).json({ error: "Champs obligatoires manquants (amountMad, presetId)." });
  }

  try {
    const result = convertBillToPhysical(Number(amountMad), String(presetId), customUnitPrice ? Number(customUnitPrice) : undefined);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/units/convert-quantity', (req, res) => {
  const { value, fromUnit, toUnit, unitPriceMad, billPresetId } = req.body;
  if (value === undefined || !fromUnit || !toUnit) {
    return res.status(400).json({ error: "Champs obligatoires manquants (value, fromUnit, toUnit)." });
  }

  try {
    const result = convertQuantity(Number(value), String(fromUnit), String(toUnit), {
      unitPriceMad: unitPriceMad ? Number(unitPriceMad) : undefined,
      billPresetId: billPresetId ? String(billPresetId) : undefined
    });
    res.json(result);
  } catch (err: any) {
    res.status(422).json({ error: err.message });
  }
});

// Sous-routeurs métier
app.use('/api/trial', trialRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api', contentRouter);
app.use('/api/assistant', assistantRouter);

// Initialiser et vérifier le seed au démarrage
runSeeds();

// Types pour Express avec Contexte Auth
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  is_superadmin: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      organizationId?: string;
      userRole?: string;
      apiKey?: any;
    }
  }
}

// -------------------------------------------------------------
// Middlewares d'Authentification et d'Isolation Multi-Tenant
// -------------------------------------------------------------

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // 1. Authentification Machine-to-Machine par clé d'API ERP (X-Atlas-API-Key ou Bearer ak_live_...)
  const apiKeyHeader = req.headers['x-atlas-api-key'] as string;
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  if (!token && typeof req.query?.token === 'string') {
    token = req.query.token;
  }

  const rawApiKey = apiKeyHeader || (token && token.startsWith('ak_live_') ? token : null);

  if (rawApiKey) {
    const keyHash = crypto.createHash('sha256').update(rawApiKey.trim()).digest('hex');
    const keyRow: any = db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1').get(keyHash);

    if (!keyRow) {
      return res.status(401).json({ error: "Clé d'API ERP invalide, expirée ou révoquée." });
    }

    try {
      db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(new Date().toISOString(), keyRow.id);
    } catch (_) {}

    req.apiKey = keyRow;
    req.organizationId = keyRow.organization_id;
    req.userRole = keyRow.permissions === 'full' ? 'admin' : (keyRow.permissions === 'read_only' ? 'auditor' : 'carbon_manager');
    req.user = {
      id: keyRow.created_by || 'system-erp-api',
      email: `api-client@${keyRow.organization_id}`,
      full_name: keyRow.name,
      is_superadmin: 0
    };
    return next();
  }

  // 2. Authentification par JWT standard
  if (!token) {
    return res.status(401).json({ error: "Authentification requise. Jeton d'accès manquant ou clé d'API absente." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Jeton d'accès expiré ou invalide." });
  }
}

function requireTenant(req: Request, res: Response, next: NextFunction) {
  const orgId = (req.params.orgId || req.headers['x-organization-id'] || req.query.orgId || req.organizationId) as string;

  if (!orgId) {
    return res.status(400).json({ error: "Identifiant d'entreprise requis (orgId manquant)." });
  }

  // Si authentifié par clé d'API, vérifier que l'org demandée correspond à celle de la clé
  if (req.apiKey) {
    if (req.apiKey.organization_id !== orgId) {
      return res.status(403).json({
        error: "Accès refusé : la clé d'API utilisée n'est pas autorisée sur cette entreprise (violation d'isolation)."
      });
    }
    req.organizationId = orgId;
    return next();
  }

  // Super admin a accès avec traçabilité
  if (req.user?.is_superadmin) {
    req.organizationId = orgId;
    req.userRole = 'super_admin';
    return next();
  }

  // Vérifier l'appartenance de l'utilisateur à l'entreprise
  const memStmt = db.prepare('SELECT role FROM memberships WHERE user_id = ? AND organization_id = ?');
  const membership: any = memStmt.get(req.user!.id, orgId);

  if (!membership) {
    return res.status(403).json({
      error: "Accès refusé : vous n'avez pas de droits sur cette entreprise (violation d'isolation de données)."
    });
  }

  req.organizationId = orgId;
  req.userRole = membership.role;
  next();
}

function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.is_superadmin) return next();
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Permission insuffisante : le rôle '${req.userRole}' ne permet pas d'effectuer cette action.`
      });
    }
    next();
  };
}

// -------------------------------------------------------------
// Module d'Intégration ERP & Connecteurs API (Phase 5)
// -------------------------------------------------------------
app.use(['/api/organizations/:orgId/integrations', '/api/integrations'], authenticateToken, requireTenant, integrationsRouter);

function logAudit(orgId: string | null, userId: string | null, action: string, entityType: string, entityId: string | null, details: any) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_events (id, organization_id, user_id, action, entity_type, entity_id, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(`audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, orgId, userId, action, entityType, entityId, JSON.stringify(details), new Date().toISOString());
  } catch (e) {
    console.error("Erreur logAudit:", e);
  }
}

// Endpoint de santé public
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Atlas Carbone', timestamp: new Date().toISOString() });
});

// -------------------------------------------------------------
// 1. Authentification & Utilisateur
// -------------------------------------------------------------

app.post('/api/auth/register', (req, res) => {
  const {
    email,
    password,
    full_name,
    company_name,
    city = 'Casablanca',
    sector = 'Industrie manufacturière',
    phone,
    ice
  } = req.body;

  if (!email || !password || !full_name || !company_name) {
    return res.status(400).json({ error: "L'email, le mot de passe, votre nom complet et le nom de l'entreprise sont requis pour créer votre compte." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Le mot de passe doit comporter au moins 6 caractères." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: "Un compte existe déjà avec cette adresse email. Veuillez vous connecter." });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const orgId = `org-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const siteId = `site-${Date.now()}`;
  const periodId = `per-${Date.now()}`;
  const subId = `sub-${Date.now()}`;
  const now = new Date().toISOString();
  const currentYear = new Date().getFullYear();

  try {
    db.exec('BEGIN');

    const cleanPhone = phone?.trim() || null;

    // 1. Utilisateur
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, is_superadmin, phone, created_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(userId, normalizedEmail, passwordHash, full_name.trim(), cleanPhone, now);

    // 2. Entreprise / Organisation
    db.prepare(`
      INSERT INTO organizations (id, name, legal_type, ice, city, sector, phone, onboarding_step, onboarding_completed, created_at)
      VALUES (?, ?, 'SARL', ?, ?, ?, ?, 1, 0, ?)
    `).run(orgId, company_name.trim(), ice?.trim() || null, city.trim(), sector.trim(), cleanPhone, now);

    // 3. Adhésion Admin
    db.prepare(`
      INSERT INTO memberships (id, user_id, organization_id, role, created_at)
      VALUES (?, ?, ?, 'admin', ?)
    `).run(`mem-${Date.now()}`, userId, orgId, now);

    // 4. Site principal
    db.prepare(`
      INSERT INTO sites (id, organization_id, name, city, address, created_at)
      VALUES (?, ?, 'Siège & Site principal', ?, '', ?)
    `).run(siteId, orgId, city.trim(), now);

    // 5. Exercice d'inventaire GES ouvert immédiatement pour saisie
    db.prepare(`
      INSERT INTO reporting_periods (
        id, organization_id, name, year, start_date, end_date,
        consolidation_approach, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'operational_control', 'collection', ?)
    `).run(periodId, orgId, `Exercice ${currentYear}`, currentYear, `${currentYear}-01-01`, `${currentYear}-12-31`, now);

    // 6. Abonnement actif immédiat
    db.prepare(`
      INSERT INTO subscriptions (
        id, organization_id, plan_name, status, sites_limit, users_limit, cbam_access, current_period_end, created_at
      ) VALUES (?, ?, 'essentiel', 'active', 5, 5, 1, ?, ?)
    `).run(subId, orgId, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), now);

    // 7. Enregistrement automatique dans la table CRM des leads
    db.prepare(`
      INSERT INTO leads (
        id, full_name, email, phone, company, sector, city, employee_count,
        has_existing_bilan, main_objective, message, status, notes, meeting_booked,
        utm_source, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Non spécifié', 'non', 'Compte client créé', 'Inscription directe sur la plateforme', 'Client', ?, 0, 'inscription_directe', ?)
    `).run(
      `lead-reg-${Date.now()}`,
      full_name.trim(),
      normalizedEmail,
      cleanPhone || '',
      company_name.trim(),
      sector.trim(),
      city.trim(),
      `Compte client créé (Org ID: ${orgId})`,
      now
    );

    // 8. Notification immédiate à Abdelaziz Motiaa pour prise de contact
    db.prepare(`
      INSERT INTO dev_notifications (id, recipient_email, subject, template_name, content_html, sent_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `notif-reg-${Date.now()}`,
      OFFICIAL_CONSULTANT_EMAIL,
      `[Atlas Carbone] Nouvelle entreprise inscrite — ${company_name.trim()}`,
      'company_registration_alert',
      `<h2>Nouvelle entreprise inscrite sur Atlas Carbone !</h2>
       <p><strong>Entreprise :</strong> ${company_name.trim()}</p>
       <p><strong>Responsable :</strong> ${full_name.trim()}</p>
       <p><strong>Email :</strong> <a href="mailto:${normalizedEmail}">${normalizedEmail}</a></p>
       <p><strong>Téléphone :</strong> ${cleanPhone ? `<a href="tel:${cleanPhone}">${cleanPhone}</a> | <a href="https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}">WhatsApp</a>` : 'Non renseigné'}</p>
       <p><strong>Ville :</strong> ${city.trim()}</p>
       <p><strong>Secteur :</strong> ${sector.trim()}</p>
       <p><strong>Identifiant Organisation :</strong> ${orgId}</p>
       <p><em>Inscrit le ${new Date().toLocaleString('fr-FR')}</em></p>`,
      now
    );

    db.exec('COMMIT');
  } catch (err: any) {
    db.exec('ROLLBACK');
    console.error("Erreur enregistrement entreprise:", err);
    return res.status(500).json({ error: "Erreur lors de la création de l'espace entreprise." });
  }

  const tokenPayload: AuthUser = {
    id: userId,
    email: normalizedEmail,
    full_name: full_name.trim(),
    is_superadmin: 0
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  logAudit(orgId, userId, 'USER_REGISTER', 'users', userId, {
    email: normalizedEmail,
    company_name: company_name.trim(),
    sector: sector.trim(),
    city: city.trim(),
    phone: phone?.trim() || null
  });

  const orgs = [{
    id: orgId,
    name: company_name.trim(),
    sector: sector.trim(),
    city: city.trim(),
    role: 'admin'
  }];

  return res.status(201).json({
    token,
    user: tokenPayload,
    organizations: orgs
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user: any = stmt.get(email.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }

  // Récupérer les entreprises accessibles
  const orgsStmt = db.prepare(`
    SELECT o.id, o.name, o.sector, o.city, m.role
    FROM organizations o
    JOIN memberships m ON o.id = m.organization_id
    WHERE m.user_id = ?
  `);
  const orgs = orgsStmt.all(user.id);

  const tokenPayload: AuthUser = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    is_superadmin: user.is_superadmin
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  logAudit(null, user.id, 'USER_LOGIN', 'users', user.id, { email: user.email });

  return res.json({
    token,
    user: tokenPayload,
    organizations: orgs
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const orgsStmt = db.prepare(`
    SELECT o.id, o.name, o.sector, o.city, m.role
    FROM organizations o
    JOIN memberships m ON o.id = m.organization_id
    WHERE m.user_id = ?
  `);
  const orgs = orgsStmt.all(req.user!.id);

  res.json({
    user: req.user,
    organizations: orgs
  });
});

// -------------------------------------------------------------
// 2. Gestion des Entreprises & Dashboard Overview
// -------------------------------------------------------------

app.get('/api/organizations', authenticateToken, (req, res) => {
  if (req.user?.is_superadmin) {
    const all = db.prepare('SELECT * FROM organizations').all();
    return res.json(all);
  }
  const orgsStmt = db.prepare(`
    SELECT o.*, m.role
    FROM organizations o
    JOIN memberships m ON o.id = m.organization_id
    WHERE m.user_id = ?
  `);
  res.json(orgsStmt.all(req.user!.id));
});

app.get('/api/organizations/:orgId/members', authenticateToken, requireTenant, (req, res) => {
  const members = db.prepare(`
    SELECT u.id, u.email, u.full_name, m.role, m.created_at
    FROM memberships m
    JOIN users u ON m.user_id = u.id
    WHERE m.organization_id = ?
    ORDER BY u.full_name ASC
  `).all(req.organizationId!);
  res.json(members);
});

// Suivi et persistance de l'onboarding guidé par entreprise
app.get('/api/organizations/:orgId/onboarding', authenticateToken, requireTenant, (req, res) => {
  const org: any = db.prepare('SELECT onboarding_step, onboarding_completed FROM organizations WHERE id = ?').get(req.organizationId!);
  if (!org) return res.status(404).json({ error: "Entreprise introuvable." });
  res.json({
    onboarding_step: org.onboarding_step || 1,
    onboardingStep: org.onboarding_step || 1,
    onboarding_completed: Boolean(org.onboarding_completed),
    onboardingCompleted: Boolean(org.onboarding_completed)
  });
});

app.post('/api/organizations/:orgId/onboarding', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const orgId = req.organizationId!;
  const newStep = Number(req.body.step || req.body.onboarding_step || req.body.onboardingStep) || 1;
  const isCompleted = req.body.completed !== undefined
    ? (req.body.completed ? 1 : 0)
    : (req.body.onboarding_completed !== undefined ? (req.body.onboarding_completed ? 1 : 0) : (newStep >= 10 ? 1 : 0));

  db.prepare('UPDATE organizations SET onboarding_step = ?, onboarding_completed = ? WHERE id = ?').run(newStep, isCompleted, orgId);
  logAudit(orgId, req.user!.id, 'UPDATE_ONBOARDING_STEP', 'organizations', orgId, { step: newStep, completed: isCompleted });

  res.json({
    success: true,
    onboarding_step: newStep,
    onboardingStep: newStep,
    onboarding_completed: Boolean(isCompleted),
    onboardingCompleted: Boolean(isCompleted)
  });
});

app.get('/api/organizations/:orgId/overview', authenticateToken, requireTenant, (req, res) => {
  const orgId = req.organizationId!;
  const periodId = req.query.periodId as string;

  // Récupérer l'exercice actif ou spécifié (privilégie les exercices contenant des activités)
  let period: any;
  if (periodId) {
    period = db.prepare('SELECT * FROM reporting_periods WHERE id = ? AND organization_id = ?').get(periodId, orgId);
  } else {
    period = db.prepare(`
      SELECT p.*, (SELECT COUNT(*) FROM activity_records WHERE reporting_period_id = p.id) as act_count
      FROM reporting_periods p
      WHERE p.organization_id = ?
      ORDER BY act_count DESC, p.year DESC
      LIMIT 1
    `).get(orgId);
  }

  if (!period) {
    return res.json({
      period: null,
      summary: { totalTCO2e: 0, scope1TCO2e: 0, scope2TCO2e: 0, scope3TCO2e: 0, biogenicTCO2e: 0 },
      byScope: [],
      byCategory: [],
      bySite: [],
      uncertainty: { totalKgCO2e: 0, uncertaintyRelativePct: 0, minKg: 0, maxKg: 0 },
      alerts: []
    });
  }

  // Activités de la période
  const activities: any[] = db.prepare(`
    SELECT a.*, s.name as site_name
    FROM activity_records a
    JOIN sites s ON a.site_id = s.id
    WHERE a.reporting_period_id = ? AND a.status = 'active'
  `).all(period.id);

  let scope1Kg = 0;
  let scope2Kg = 0;
  let scope3Kg = 0;
  let biogenicKg = 0;
  const siteMap: Record<string, { name: string; tco2e: number }> = {};
  const catMap: Record<string, { label: string; scope: number; tco2e: number }> = {};
  const uncItems: Array<{ emissionKgCO2e: number; uncertaintyAbsoluteKg: number }> = [];

  for (const act of activities) {
    if (act.is_biogenic) {
      biogenicKg += act.emission_kg_co2e;
    } else {
      if (act.scope === 1) scope1Kg += act.emission_kg_co2e;
      else if (act.scope === 2) scope2Kg += act.emission_kg_co2e;
      else if (act.scope === 3) scope3Kg += act.emission_kg_co2e;
    }

    // Site breakdown
    if (!siteMap[act.site_name]) {
      siteMap[act.site_name] = { name: act.site_name, tco2e: 0 };
    }
    siteMap[act.site_name].tco2e += act.emission_t_co2e;

    // Category breakdown
    if (!catMap[act.category]) {
      catMap[act.category] = { label: act.category, scope: act.scope, tco2e: 0 };
    }
    catMap[act.category].tco2e += act.emission_t_co2e;

    uncItems.push({
      emissionKgCO2e: act.emission_kg_co2e,
      uncertaintyAbsoluteKg: act.uncertainty_absolute_kg || (act.emission_kg_co2e * 0.20)
    });
  }

  const uncAgg = aggregateUncertainty(uncItems);
  const totalTCO2e = (scope1Kg + scope2Kg + scope3Kg) / 1000.0;
  const revMMad = (period.revenue_mad && period.revenue_mad > 0) ? (period.revenue_mad / 1000000.0) : null;
  const intensityRevenueTCO2ePerMMad = revMMad ? totalTCO2e / revMMad : null;
  const intensityEmployeeTCO2ePerEmployee = (period.employee_count && period.employee_count > 0) ? totalTCO2e / period.employee_count : null;
  const intensityProductionTCO2ePerUnit = (period.production_units && period.production_units > 0) ? totalTCO2e / period.production_units : null;

  res.json({
    period,
    summary: {
      totalTCO2e,
      scope1TCO2e: scope1Kg / 1000.0,
      scope2TCO2e: scope2Kg / 1000.0,
      scope3TCO2e: scope3Kg / 1000.0,
      biogenicTCO2e: biogenicKg / 1000.0,
      totalActivitiesCount: activities.length,
      intensityRevenueTCO2ePerMMad,
      intensityEmployeeTCO2ePerEmployee,
      intensityProductionTCO2ePerUnit,
      productionUnitName: period.production_unit_name || 'unités'
    },
    total_tco2e: totalTCO2e,
    scope1_tco2e: scope1Kg / 1000.0,
    scope2_tco2e: scope2Kg / 1000.0,
    scope3_tco2e: scope3Kg / 1000.0,
    byScope: [
      { scope: 1, label: 'Scope 1 (Émissions directes)', tco2e: scope1Kg / 1000.0 },
      { scope: 2, label: 'Scope 2 (Électricité & Énergie indirecte)', tco2e: scope2Kg / 1000.0 },
      { scope: 3, label: 'Scope 3 (Autres émissions indirectes)', tco2e: scope3Kg / 1000.0 }
    ],
    byCategory: Object.values(catMap),
    bySite: Object.values(siteMap),
    uncertainty: {
      totalKgCO2e: uncAgg.totalKgCO2e,
      uncertaintyRelativePct: uncAgg.uncertaintyRelativePct,
      minKg: uncAgg.confidenceInterval95Kg.min,
      maxKg: uncAgg.confidenceInterval95Kg.max
    }
  });
});

// -------------------------------------------------------------
// 3. Exercices (Reporting Periods) & Clôture
// -------------------------------------------------------------

app.get('/api/organizations/:orgId/periods', authenticateToken, requireTenant, (req, res) => {
  const periods = db.prepare('SELECT * FROM reporting_periods WHERE organization_id = ? ORDER BY year DESC').all(req.organizationId!);
  res.json(periods);
});

app.post('/api/organizations/:orgId/periods', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { name, year, start_date, end_date, consolidation_approach } = req.body;
  if (!name || !year) {
    return res.status(400).json({ error: "Nom et année requis." });
  }

  const id = `per-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO reporting_periods (id, organization_id, name, year, start_date, end_date, consolidation_approach, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `);
  stmt.run(id, req.organizationId!, name, year, start_date || `${year}-01-01`, end_date || `${year}-12-31`, consolidation_approach || 'operational_control', new Date().toISOString());

  logAudit(req.organizationId!, req.user!.id, 'CREATE_REPORTING_PERIOD', 'reporting_periods', id, { name, year });
  res.status(201).json({ id, name, year, status: 'draft' });
});

// Mise à jour des métriques d'intensité carbone (Chiffre d'affaires, effectif, production)
app.put('/api/organizations/:orgId/periods/:periodId/intensity', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { periodId, orgId } = req.params;
  const rev = req.body.revenue_mad !== undefined ? req.body.revenue_mad : req.body.revenueMad;
  const emp = req.body.employee_count !== undefined ? req.body.employee_count : req.body.employeeCount;
  const prod = req.body.production_units !== undefined ? req.body.production_units : req.body.productionUnits;
  const unitName = req.body.production_unit_name !== undefined ? req.body.production_unit_name : req.body.productionUnitName;

  const period: any = db.prepare('SELECT * FROM reporting_periods WHERE id = ? AND organization_id = ?').get(periodId, orgId);
  if (!period) return res.status(404).json({ error: "Exercice introuvable." });

  db.prepare(`
    UPDATE reporting_periods
    SET revenue_mad = ?, employee_count = ?, production_units = ?, production_unit_name = ?
    WHERE id = ? AND organization_id = ?
  `).run(
    Number(rev) || 0,
    Number(emp) || 0,
    Number(prod) || 0,
    unitName ? String(unitName) : 'unités',
    periodId,
    orgId
  );

  logAudit(orgId, req.user!.id, 'UPDATE_PERIOD_INTENSITY', 'reporting_periods', periodId, {
    revenue_mad: rev, employee_count: emp, production_units: prod, production_unit_name: unitName
  });

  const updated = db.prepare('SELECT * FROM reporting_periods WHERE id = ?').get(periodId);
  res.json(updated);
});

app.post('/api/organizations/:orgId/periods/:periodId/close', authenticateToken, requireTenant, requireRole(['admin']), (req, res) => {
  const { periodId } = req.params;
  const orgId = req.organizationId!;

  const period: any = db.prepare('SELECT * FROM reporting_periods WHERE id = ? AND organization_id = ?').get(periodId, orgId);
  if (!period) return res.status(404).json({ error: "Exercice introuvable." });
  if (period.status === 'closed') return res.status(400).json({ error: "Cet exercice est déjà clôturé." });

  // Contrôles stricts avant clôture :
  // 1. Tous les facteurs utilisés doivent être validés (aucun statut 'to_verify')
  const unverifiedStmt = db.prepare(`
    SELECT a.id, a.label, f.name as factor_name, f.status as factor_status
    FROM activity_records a
    JOIN emission_factors f ON a.factor_id = f.id
    WHERE a.reporting_period_id = ? AND f.status = 'to_verify'
  `);
  const unverified: any[] = unverifiedStmt.all(periodId);
  if (unverified.length > 0) {
    return res.status(422).json({
      error: `Clôture impossible : ${unverified.length} activité(s) utilisent des facteurs au statut 'to_verify' (amont+combustion non décomposé ou mix à valider). Régularisez ces facteurs avant clôture.`,
      unverifiedActivities: unverified
    });
  }

  // 2. Générer le snapshot immuable de l'exercice
  const activities = db.prepare('SELECT * FROM activity_records WHERE reporting_period_id = ?').all(periodId);
  const snapshot = {
    periodId,
    closedAt: new Date().toISOString(),
    closedBy: req.user!.email,
    activitiesCount: activities.length,
    activities
  };

  const closeStmt = db.prepare(`
    UPDATE reporting_periods
    SET status = 'closed', closed_at = ?, closed_by = ?, snapshot_json = ?
    WHERE id = ?
  `);
  closeStmt.run(new Date().toISOString(), req.user!.id, JSON.stringify(snapshot), periodId);

  logAudit(orgId, req.user!.id, 'CLOSE_INVENTORY', 'reporting_periods', periodId, { activitiesCount: activities.length });
  res.json({ message: "Exercice clôturé avec succès. L'inventaire est désormais immuable.", periodId });
});

// -------------------------------------------------------------
// 4. Sites d'Exploitation & Gouvernance Multi-Sites
// -------------------------------------------------------------

app.get('/api/organizations/:orgId/sites', authenticateToken, requireTenant, (req, res) => {
  const orgId = req.organizationId!;
  let query = `
    SELECT s.*, u.full_name as manager_name, u.email as manager_email,
           (SELECT COUNT(*) FROM activity_records WHERE site_id = s.id AND status = 'active') as activities_count,
           (SELECT COALESCE(SUM(emission_t_co2e), 0) FROM activity_records WHERE site_id = s.id AND status = 'active') as total_tco2e
    FROM sites s
    LEFT JOIN users u ON s.manager_user_id = u.id
    WHERE s.organization_id = ?
  `;
  const params: any[] = [orgId];

  // Si le rôle est site_manager, confiner à son propre site
  if (req.userRole === 'site_manager') {
    query += ' AND s.manager_user_id = ?';
    params.push(req.user!.id);
  }

  query += ' ORDER BY s.name ASC';
  const sites = db.prepare(query).all(...params);
  res.json(sites);
});

app.post('/api/organizations/:orgId/sites', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { name, city, address, manager_user_id } = req.body;
  if (!name || !city) return res.status(400).json({ error: "Nom et ville requis pour le site." });

  const id = `site-${Date.now()}`;
  db.prepare(`
    INSERT INTO sites (id, organization_id, name, city, address, manager_user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.organizationId!, name, city, address || '', manager_user_id || null, new Date().toISOString());

  logAudit(req.organizationId!, req.user!.id, 'CREATE_SITE', 'sites', id, { name, city, manager_user_id });

  const created = db.prepare(`
    SELECT s.*, u.full_name as manager_name, u.email as manager_email
    FROM sites s
    LEFT JOIN users u ON s.manager_user_id = u.id
    WHERE s.id = ?
  `).get(id);

  res.status(201).json(created);
});

app.put('/api/organizations/:orgId/sites/:siteId', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { siteId } = req.params;
  const { name, city, address, manager_user_id } = req.body;
  const orgId = req.organizationId!;

  const existing: any = db.prepare('SELECT * FROM sites WHERE id = ? AND organization_id = ?').get(siteId, orgId);
  if (!existing) return res.status(404).json({ error: "Site introuvable." });

  db.prepare(`
    UPDATE sites
    SET name = COALESCE(?, name),
        city = COALESCE(?, city),
        address = COALESCE(?, address),
        manager_user_id = ?
    WHERE id = ? AND organization_id = ?
  `).run(name || null, city || null, address !== undefined ? address : null, manager_user_id !== undefined ? (manager_user_id || null) : existing.manager_user_id, siteId, orgId);

  logAudit(orgId, req.user!.id, 'UPDATE_SITE', 'sites', siteId, { name, city, manager_user_id });

  const updated = db.prepare(`
    SELECT s.*, u.full_name as manager_name, u.email as manager_email
    FROM sites s
    LEFT JOIN users u ON s.manager_user_id = u.id
    WHERE s.id = ?
  `).get(siteId);

  res.json(updated);
});

app.delete('/api/organizations/:orgId/sites/:siteId', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { siteId } = req.params;
  const orgId = req.organizationId!;

  const site: any = db.prepare('SELECT * FROM sites WHERE id = ? AND organization_id = ?').get(siteId, orgId);
  if (!site) return res.status(404).json({ error: "Site introuvable." });

  const actCount: any = db.prepare('SELECT COUNT(*) as count FROM activity_records WHERE site_id = ?').get(siteId);
  if (actCount && actCount.count > 0) {
    return res.status(400).json({
      error: `Impossible de supprimer ce site : ${actCount.count} activité(s) y sont rattachées. Réaffectez ou supprimez d'abord ces activités.`
    });
  }

  db.prepare('DELETE FROM sites WHERE id = ? AND organization_id = ?').run(siteId, orgId);
  logAudit(orgId, req.user!.id, 'DELETE_SITE', 'sites', siteId, { name: site.name });

  res.json({ success: true, message: `Site '${site.name}' supprimé avec succès.` });
});

// -------------------------------------------------------------
// 5. Activités & Saisie (Moteur de Calcul en direct)
// -------------------------------------------------------------

app.get('/api/organizations/:orgId/activities', authenticateToken, requireTenant, (req, res) => {
  const orgId = req.organizationId!;
  const periodId = req.query.periodId as string;
  const siteId = req.query.siteId as string;

  let query = 'SELECT a.*, s.name as site_name FROM activity_records a JOIN sites s ON a.site_id = s.id WHERE a.organization_id = ?';
  const params: any[] = [orgId];

  if (periodId) {
    query += ' AND a.reporting_period_id = ?';
    params.push(periodId);
  }
  if (siteId) {
    query += ' AND a.site_id = ?';
    params.push(siteId);
  }

  // Filtrage selon le rôle si site_manager
  if (req.userRole === 'site_manager') {
    query += ' AND s.manager_user_id = ?';
    params.push(req.user!.id);
  }

  query += ' ORDER BY a.created_at DESC';
  const activities = db.prepare(query).all(...params);
  res.json(activities);
});

app.post('/api/organizations/:orgId/activities', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager', 'site_manager', 'contributor']), (req, res) => {
  const orgId = req.organizationId!;
  const reporting_period_id = req.body.reporting_period_id || req.body.periodId;
  const site_id = req.body.site_id || req.body.siteId;
  const factor_id = req.body.factor_id || req.body.factorId;
  const {
    category,
    label,
    quantity,
    unit,
    invoice_ref,
    supplier_name,
    notes,
    allowProvisionalScope1
  } = req.body;

  if (!reporting_period_id || !site_id || !label || quantity === undefined || !unit || !factor_id) {
    return res.status(400).json({ error: "Champs obligatoires manquants pour la saisie d'activité." });
  }

  // Vérifier si la période est clôturée
  const period: any = db.prepare('SELECT status FROM reporting_periods WHERE id = ? AND organization_id = ?').get(reporting_period_id, orgId);
  if (!period) return res.status(404).json({ error: "Exercice introuvable." });
  if (period.status === 'closed') {
    return res.status(403).json({ error: "Impossible de modifier un exercice clôturé. Créez une révision ou un nouvel exercice." });
  }

  // Contrôle géographique strict si le rôle est site_manager
  if (req.userRole === 'site_manager') {
    const isManagerOfSite: any = db.prepare('SELECT id FROM sites WHERE id = ? AND organization_id = ? AND manager_user_id = ?').get(site_id, orgId, req.user!.id);
    if (!isManagerOfSite) {
      return res.status(403).json({
        error: "Accès refusé : en tant que responsable de site (site_manager), vous ne pouvez saisir des activités que sur votre site géographique assigné."
      });
    }
  }

  // Récupérer le facteur d'émission
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
    uncertaintyPct: factorRow.uncertainty_pct,
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

    const actId = `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const insertStmt = db.prepare(`
      INSERT INTO activity_records (
        id, reporting_period_id, site_id, organization_id, category, scope, iso_category,
        label, quantity, unit, factor_id, factor_version, emission_kg_co2e, emission_t_co2e,
        is_biogenic, uncertainty_relative, uncertainty_absolute_kg, calculation_trace_json,
        invoice_ref, supplier_name, status, notes, created_by, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, 'active', ?, ?, ?
      )
    `);

    insertStmt.run(
      actId, reporting_period_id, site_id, orgId, category || factorRow.category,
      factorRow.scope, factorRow.iso_category, label, Number(quantity), String(unit),
      factorRow.id, factorRow.version, calcResult.emissionKgCO2e, calcResult.emissionTCO2e,
      calcResult.isBiogenic ? 1 : 0, calcResult.uncertaintyRelative, calcResult.uncertaintyAbsoluteKg,
      JSON.stringify(calcResult.trace), invoice_ref || null, supplier_name || null,
      notes || null, req.user!.id, new Date().toISOString()
    );

    logAudit(orgId, req.user!.id, 'CREATE_ACTIVITY', 'activity_records', actId, {
      label, quantity, unit, tco2e: calcResult.emissionTCO2e
    });

    res.status(201).json({
      id: actId,
      emission_kg_co2e: calcResult.emissionKgCO2e,
      emission_t_co2e: calcResult.emissionTCO2e,
      trace: calcResult.trace
    });
  } catch (err: any) {
    return res.status(422).json({ error: err.message });
  }
});

app.put('/api/organizations/:orgId/activities/:activityId', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager', 'site_manager']), (req, res) => {
  const { activityId } = req.params;
  const orgId = req.organizationId!;

  const act: any = db.prepare('SELECT a.*, p.status as period_status FROM activity_records a JOIN reporting_periods p ON a.reporting_period_id = p.id WHERE a.id = ? AND a.organization_id = ?').get(activityId, orgId);
  if (!act) return res.status(404).json({ error: "Activité introuvable." });
  if (act.period_status === 'closed') {
    return res.status(403).json({ error: "Interdit : l'activité appartient à un inventaire clôturé et immuable." });
  }

  const { quantity, notes } = req.body;
  if (quantity !== undefined) {
    db.prepare('UPDATE activity_records SET quantity = ? WHERE id = ?').run(Number(quantity), activityId);
  }
  res.json({ message: "Activité mise à jour avec succès." });
});

app.delete('/api/organizations/:orgId/activities/:activityId', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { activityId } = req.params;
  const orgId = req.organizationId!;

  const act: any = db.prepare('SELECT a.*, p.status as period_status FROM activity_records a JOIN reporting_periods p ON a.reporting_period_id = p.id WHERE a.id = ? AND a.organization_id = ?').get(activityId, orgId);
  if (!act) return res.status(404).json({ error: "Activité introuvable." });
  if (act.period_status === 'closed') {
    return res.status(403).json({ error: "Interdit : l'activité appartient à un inventaire clôturé." });
  }

  db.prepare('DELETE FROM activity_records WHERE id = ?').run(activityId);
  logAudit(orgId, req.user!.id, 'DELETE_ACTIVITY', 'activity_records', activityId, { label: act.label });
  res.json({ message: "Activité supprimée avec succès." });
});

// 5.d Gestion des pièces justificatives et preuves de factures (PDF, PNG, JPG)
app.post('/api/organizations/:orgId/activities/:activityId/evidence', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager', 'site_manager', 'contributor']), uploadEvidence.single('file'), (req, res) => {
  const { orgId, activityId } = req.params;
  const { invoice_ref, invoice_date } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier téléversé. Veuillez sélectionner une pièce jointe (PDF, PNG, JPG)." });
  }

  const activity: any = db.prepare('SELECT * FROM activity_records WHERE id = ? AND organization_id = ?').get(activityId, orgId);
  if (!activity) {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(404).json({ error: "Activité introuvable." });
  }

  const evidenceId = `evid-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO activity_evidences (
      id, activity_id, organization_id, file_name, file_path, file_size, mime_type, invoice_ref, invoice_date, uploaded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    evidenceId, activityId, orgId, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype,
    invoice_ref || activity.invoice_ref || null, invoice_date || null, req.user!.id, now
  );

  db.prepare(`
    UPDATE activity_records
    SET evidence_file_name = ?, evidence_file_path = ?, evidence_file_size = ?, evidence_uploaded_at = ?, invoice_ref = COALESCE(?, invoice_ref)
    WHERE id = ?
  `).run(req.file.originalname, req.file.filename, req.file.size, now, invoice_ref || null, activityId);

  logAudit(orgId, req.user!.id, 'UPLOAD_ACTIVITY_EVIDENCE', 'activity_records', activityId, {
    evidenceId, fileName: req.file.originalname, fileSize: req.file.size
  });

  res.status(201).json({
    success: true,
    id: evidenceId,
    activity_id: activityId,
    file_name: req.file.originalname,
    file_size: req.file.size,
    evidence: {
      id: evidenceId,
      activityId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      createdAt: now
    },
    created_at: now
  });
});

app.get('/api/organizations/:orgId/activities/:activityId/evidence', authenticateToken, requireTenant, (req, res) => {
  const { orgId, activityId } = req.params;
  const evidences = db.prepare(`
    SELECT id, activity_id, file_name, file_size, mime_type, invoice_ref, invoice_date, created_at
    FROM activity_evidences
    WHERE activity_id = ? AND organization_id = ?
    ORDER BY created_at DESC
  `).all(activityId, orgId);

  res.json(evidences);
});

app.get('/api/organizations/:orgId/evidences/:evidenceId/download', authenticateToken, requireTenant, (req, res) => {
  const { orgId, evidenceId } = req.params;
  const evidence: any = db.prepare('SELECT * FROM activity_evidences WHERE id = ? AND organization_id = ?').get(evidenceId, orgId);
  if (!evidence) {
    return res.status(404).json({ error: "Pièce justificative introuvable ou accès refusé." });
  }

  const physicalPath = path.join(UPLOADS_DIR, evidence.file_path);
  if (!fs.existsSync(physicalPath)) {
    return res.status(404).json({ error: "Fichier physique introuvable sur le serveur." });
  }

  res.download(physicalPath, evidence.file_name);
});

// -------------------------------------------------------------
// 6. Catalogue des Facteurs d'Émission (Protégé & Confidentiel)
// -------------------------------------------------------------

// 6.a Catalogue brut complet : Strictement réservé au rôle super_admin
app.get('/api/factors', authenticateToken, (req, res) => {
  if (!req.user?.is_superadmin) {
    return res.status(403).json({
      error: "Accès refusé : la consultation directe du catalogue brut des facteurs d'émission est strictement réservée à l'administration de la plateforme. Pour saisir vos activités, utilisez le sélecteur guidé (/api/activities/catalog-options) qui garantit la traçabilité sans exposer les pondérations internes."
    });
  }

  const search = req.query.q as string;
  const scope = req.query.scope as string;
  const category = req.query.category as string;
  const status = req.query.status as string;

  let query = 'SELECT * FROM emission_factors WHERE 1=1';
  const params: any[] = [];

  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }
  if (scope) {
    query += ' AND scope = ?';
    params.push(Number(scope));
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY scope ASC, name ASC LIMIT 300';
  const factors = db.prepare(query).all(...params);
  res.json(factors);
});

// 6.b Sélecteur d'Options d'Activités Sécurisé (Tenants & Invités d'Essai)
// Ne retourne QUE les métadonnées de saisie sans jamais divulguer les facteurs numériques ni pondérations internes !
app.get('/api/activities/catalog-options', (req, res) => {
  const category = req.query.category as string;
  const scope = req.query.scope as string;
  const search = req.query.q as string;

  let query = "SELECT id, name as label, category, scope, denominator_unit as expected_unit, perimeter, geography, status FROM emission_factors WHERE status != 'rejected'";
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (scope) {
    query += ' AND scope = ?';
    params.push(Number(scope));
  }
  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY scope ASC, name ASC LIMIT 150';
  const options = db.prepare(query).all(...params);
  res.json(options);
});

// 6.c Référentiel des 8 Profils Sectoriels Marocains
app.get(['/api/sector-questionnaires', '/api/sectors', '/api/trial/sectors'], (req, res) => {
  res.json(SECTOR_PROFILES);
});

// 6.d Annexe Méthodologique à Accès Contrôlé (Limité aux seuls facteurs mobilisés)
app.get('/api/organizations/:orgId/periods/:periodId/methodological-annex', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager', 'auditor']), (req, res) => {
  const { periodId } = req.params;
  const orgId = req.organizationId!;

  const factors: any[] = db.prepare(`
    SELECT DISTINCT f.id, f.name, f.category, f.scope, f.denominator_unit, f.geography, f.reference_year, f.source, f.perimeter, f.uncertainty_pct
    FROM activity_records a
    JOIN emission_factors f ON a.factor_id = f.id
    WHERE a.reporting_period_id = ? AND a.organization_id = ?
    ORDER BY f.scope ASC, f.name ASC
  `).all(periodId, orgId);

  res.json({
    reportingPeriodId: periodId,
    factorsMobilizedCount: factors.length,
    factors,
    attribution: "Source de référence : Classeur Bilan Carbone Maroc (ADEME / ABC / Fondation Mohammed VI pour la Protection de l'Environnement / AMEE)",
    limitationNotice: "Note méthodologique : Lorsqu'une quantité physique et son résultat d'émissions sont connus, un facteur simple peut être déduit arithmétiquement. La protection du catalogue vise la confidentialité de la base globale et ne constitue pas un secret mathématique absolu."
  });
});

// 6.e Postes identifiés, non quantifiés (Règle de rigueur : pas de faux zéro)
app.get('/api/organizations/:orgId/activities/unquantified', authenticateToken, requireTenant, (req, res) => {
  const periodId = (req.query.periodId || req.query.reporting_period_id) as string;
  let query = 'SELECT * FROM unquantified_activities WHERE organization_id = ?';
  const params: any[] = [req.organizationId!];
  if (periodId) {
    query += ' AND reporting_period_id = ?';
    params.push(periodId);
  }
  query += ' ORDER BY created_at DESC';
  const items = db.prepare(query).all(...params);
  res.json(items);
});

app.post('/api/organizations/:orgId/activities/unquantified', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager', 'site_manager', 'contributor']), (req, res) => {
  const reporting_period_id = req.body.reporting_period_id || req.body.periodId;
  const { site_id, category, label, reason, notes } = req.body;
  if (!reporting_period_id || !category || !label) {
    return res.status(400).json({ error: "Champs obligatoires manquants (reporting_period_id, category, label)." });
  }

  const id = `unq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  db.prepare(`
    INSERT INTO unquantified_activities (id, reporting_period_id, organization_id, site_id, category, label, reason, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, reporting_period_id, req.organizationId!, site_id || null, category, label, reason || 'Poste identifié, non quantifié : facteur disponible insuffisant', notes || '', new Date().toISOString());

  logAudit(req.organizationId!, req.user!.id, 'CREATE_UNQUANTIFIED_ACTIVITY', 'unquantified_activities', id, { label, category, reason });
  res.status(201).json({ id, message: "Activité non quantifiée enregistrée avec motif explicite (aucun zéro factice n'est affecté)." });
});

// 6.f Génération du Rapport PDF Officiel Côté Serveur
app.get('/api/organizations/:orgId/periods/:periodId/pdf', authenticateToken, requireTenant, async (req, res) => {
  const { orgId, periodId } = req.params;
  const lang = (req.query.lang === 'en' ? 'en' : 'fr') as 'fr' | 'en';

  const org: any = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
  const period: any = db.prepare('SELECT * FROM reporting_periods WHERE id = ? AND organization_id = ?').get(periodId, orgId);
  if (!org || !period) return res.status(404).json({ error: "Organisation ou exercice introuvable." });

  const activities: any[] = db.prepare(`
    SELECT a.*, f.name as factor_name, f.source as factor_source
    FROM activity_records a
    LEFT JOIN emission_factors f ON a.factor_id = f.id
    WHERE a.reporting_period_id = ? AND a.organization_id = ? AND a.status = 'active'
    ORDER BY a.scope ASC, a.created_at ASC
  `).all(periodId, orgId);

  const unquantified: any[] = db.prepare(`
    SELECT * FROM unquantified_activities
    WHERE reporting_period_id = ? AND organization_id = ?
    ORDER BY created_at ASC
  `).all(periodId, orgId);

  const actions: any[] = db.prepare(`
    SELECT * FROM reduction_actions
    WHERE organization_id = ?
    ORDER BY target_year ASC
  `).all(orgId);

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
  const totalTCO2e = (s1 + s2 + s3) / 1000.0;
  const revMMad = (period.revenue_mad && period.revenue_mad > 0) ? (period.revenue_mad / 1000000.0) : null;
  const intensityRevenueTCO2ePerMMad = revMMad ? totalTCO2e / revMMad : null;
  const intensityEmployeeTCO2ePerEmployee = (period.employee_count && period.employee_count > 0) ? totalTCO2e / period.employee_count : null;
  const intensityProductionTCO2ePerUnit = (period.production_units && period.production_units > 0) ? totalTCO2e / period.production_units : null;

  const pdfData: ReportPdfData = {
    companyName: org.name,
    city: org.city || 'Maroc',
    ice: org.ice || '',
    sector: org.sector || 'Général',
    periodYear: period.year,
    consolidationApproach: period.consolidation_approach || 'operational_control',
    isPreliminary: period.status !== 'closed',
    status: period.status === 'closed'
      ? (lang === 'en' ? 'Locked / Final' : 'Clôturé & Immuable')
      : (lang === 'en' ? 'Draft in progress' : 'Brouillon en cours'),
    generatedDate: new Date().toISOString().split('T')[0],
    summary: {
      totalTCO2e,
      scope1TCO2e: s1 / 1000.0,
      scope2TCO2e: s2 / 1000.0,
      scope3TCO2e: s3 / 1000.0,
      biogenicTCO2e: bio / 1000.0,
      uncertaintyMinTCO2e: uncAgg.confidenceInterval95Kg.min / 1000.0,
      uncertaintyMaxTCO2e: uncAgg.confidenceInterval95Kg.max / 1000.0,
      uncertaintyPct: uncAgg.uncertaintyRelativePct,
      intensityRevenueTCO2ePerMMad: intensityRevenueTCO2ePerMMad || undefined,
      intensityEmployeeTCO2ePerEmployee: intensityEmployeeTCO2ePerEmployee || undefined,
      intensityProductionTCO2ePerUnit: intensityProductionTCO2ePerUnit || undefined,
      productionUnitName: period.production_unit_name || 'unités'
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
    })),
    reductionActions: actions.map(act => ({
      title: act.title,
      category: act.category,
      responsible: act.responsible,
      targetYear: act.target_year,
      savingsTCO2e: act.annual_savings_tco2e
    }))
  };

  try {
    const pdfBuffer = await generateReportPdf(pdfData, lang);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rapport_GES_${org.name.replace(/[^a-zA-Z0-9]/g, '_')}_${period.year}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: "Erreur lors de la génération du rapport PDF: " + err.message });
  }
});

// 6.g Génération du Rapport Excel (.xlsx) Officiel Côté Serveur (Audit ISO 14064 multi-onglets)
app.get('/api/organizations/:orgId/periods/:periodId/excel', authenticateToken, requireTenant, async (req, res) => {
  const { orgId, periodId } = req.params;
  const lang = (req.query.lang === 'en' ? 'en' : 'fr') as 'fr' | 'en';

  const org: any = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
  const period: any = db.prepare('SELECT * FROM reporting_periods WHERE id = ? AND organization_id = ?').get(periodId, orgId);
  if (!org || !period) return res.status(404).json({ error: "Organisation ou exercice introuvable." });

  const activities: any[] = db.prepare(`
    SELECT a.*, f.name as factor_name, f.source as factor_source
    FROM activity_records a
    LEFT JOIN emission_factors f ON a.factor_id = f.id
    WHERE a.reporting_period_id = ? AND a.organization_id = ? AND a.status = 'active'
    ORDER BY a.scope ASC, a.created_at ASC
  `).all(periodId, orgId);

  const unquantified: any[] = db.prepare(`
    SELECT * FROM unquantified_activities
    WHERE reporting_period_id = ? AND organization_id = ?
    ORDER BY created_at ASC
  `).all(periodId, orgId);

  const actions: any[] = db.prepare(`
    SELECT * FROM reduction_actions
    WHERE organization_id = ?
    ORDER BY target_year ASC
  `).all(orgId);

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
  const totalTCO2e = (s1 + s2 + s3) / 1000.0;
  const revMMad = (period.revenue_mad && period.revenue_mad > 0) ? (period.revenue_mad / 1000000.0) : null;
  const intensityRevenueTCO2ePerMMad = revMMad ? totalTCO2e / revMMad : null;
  const intensityEmployeeTCO2ePerEmployee = (period.employee_count && period.employee_count > 0) ? totalTCO2e / period.employee_count : null;
  const intensityProductionTCO2ePerUnit = (period.production_units && period.production_units > 0) ? totalTCO2e / period.production_units : null;

  const excelData: ExcelReportData = {
    companyName: org.name,
    city: org.city || 'Maroc',
    ice: org.ice || '',
    sector: org.sector || 'Général',
    periodYear: period.year,
    consolidationApproach: period.consolidation_approach || 'operational_control',
    status: period.status === 'closed'
      ? (lang === 'en' ? 'Locked / Final' : 'Clôturé & Immuable')
      : (lang === 'en' ? 'Draft in progress' : 'Brouillon en cours'),
    generatedDate: new Date().toISOString().split('T')[0],
    revenueMad: period.revenue_mad,
    employeeCount: period.employee_count,
    productionUnits: period.production_units,
    productionUnitName: period.production_unit_name,
    summary: {
      totalTCO2e,
      scope1TCO2e: s1 / 1000.0,
      scope2TCO2e: s2 / 1000.0,
      scope3TCO2e: s3 / 1000.0,
      biogenicTCO2e: bio / 1000.0,
      uncertaintyMinTCO2e: uncAgg.confidenceInterval95Kg.min / 1000.0,
      uncertaintyMaxTCO2e: uncAgg.confidenceInterval95Kg.max / 1000.0,
      uncertaintyPct: uncAgg.uncertaintyRelativePct,
      intensityRevenueTCO2ePerMMad: intensityRevenueTCO2ePerMMad || undefined,
      intensityEmployeeTCO2ePerEmployee: intensityEmployeeTCO2ePerEmployee || undefined,
      intensityProductionTCO2ePerUnit: intensityProductionTCO2ePerUnit || undefined
    },
    activities: activities.map(a => ({
      category: a.category,
      scope: a.scope,
      label: a.label,
      quantity: a.quantity,
      unit: a.unit,
      emissionKgCO2e: a.emission_kg_co2e,
      emissionTCO2e: a.emission_t_co2e,
      factorId: a.factor_id,
      factorName: a.factor_name,
      factorSource: a.factor_source,
      uncertaintyPct: a.uncertainty_relative,
      invoiceRef: a.invoice_ref,
      supplierName: a.supplier_name,
      evidenceFileName: a.evidence_file_name
    })),
    unquantified: unquantified.map(u => ({
      category: u.category,
      label: u.label,
      reason: u.reason,
      notes: u.notes
    })),
    reductionActions: actions.map(act => ({
      title: act.title,
      category: act.category,
      responsible: act.responsible,
      targetYear: act.target_year,
      savingsTCO2e: act.annual_savings_tco2e,
      costMad: act.cost_mad,
      status: act.status
    }))
  };

  try {
    const excelBuffer = await generateExcelReport(excelData, lang);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Inventaire_GES_${org.name.replace(/[^a-zA-Z0-9]/g, '_')}_${period.year}.xlsx"`);
    res.send(excelBuffer);
  } catch (err: any) {
    res.status(500).json({ error: "Erreur lors de la génération du classeur Excel: " + err.message });
  }
});

// 6.g Gouvernance, Cycle de Revue et États d'Inventaire
app.get('/api/organizations/:orgId/periods/:periodId/reviews', authenticateToken, requireTenant, (req, res) => {
  const reviews = db.prepare('SELECT * FROM dossier_reviews WHERE reporting_period_id = ? ORDER BY created_at DESC').all(req.params.periodId);
  res.json(reviews);
});

app.post('/api/organizations/:orgId/periods/:periodId/reviews', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager', 'auditor']), (req, res) => {
  const { periodId } = req.params;
  const { status, comment } = req.body;
  const allowed = [
    'draft', 'collection', 'in_review', 'corrections_requested', 'validated', 'closed',
    'to_complete', 'ready_for_review', 'reviewed_internal', 'locked'
  ];

  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ error: `Statut invalide. Statuts autorisés : ${allowed.join(', ')}` });
  }

  const id = `rev-${Date.now()}`;
  db.prepare(`
    INSERT INTO dossier_reviews (id, reporting_period_id, reviewer_id, reviewer_name, status, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, periodId, req.user!.id, req.user!.full_name, status, comment || '', new Date().toISOString());

  // Mettre à jour le statut dans reporting_periods
  if (status === 'closed' || status === 'locked') {
    db.prepare('UPDATE reporting_periods SET status = ?, closed_at = ?, closed_by = ? WHERE id = ?')
      .run('closed', new Date().toISOString(), req.user!.id, periodId);
  } else {
    db.prepare('UPDATE reporting_periods SET status = ?, closed_at = NULL, closed_by = NULL WHERE id = ?')
      .run(status, periodId);
  }

  logAudit(req.organizationId!, req.user!.id, 'UPDATE_DOSSIER_STATE', 'reporting_periods', periodId, { status, comment });

  res.status(201).json({ id, status, comment, created_at: new Date().toISOString() });
});

app.put('/api/organizations/:orgId/periods/:periodId/status', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager', 'auditor']), (req, res) => {
  const { periodId, orgId } = req.params;
  const { status, comment } = req.body;
  const allowed = [
    'draft', 'collection', 'in_review', 'corrections_requested', 'validated', 'closed',
    'to_complete', 'ready_for_review', 'reviewed_internal', 'locked'
  ];

  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ error: `Statut invalide. Statuts autorisés : ${allowed.join(', ')}` });
  }

  const period: any = db.prepare('SELECT * FROM reporting_periods WHERE id = ? AND organization_id = ?').get(periodId, orgId);
  if (!period) return res.status(404).json({ error: "Exercice introuvable." });

  if (status === 'closed' || status === 'locked') {
    db.prepare('UPDATE reporting_periods SET status = ?, closed_at = ?, closed_by = ? WHERE id = ?')
      .run('closed', new Date().toISOString(), req.user!.id, periodId);
  } else {
    db.prepare('UPDATE reporting_periods SET status = ?, closed_at = NULL, closed_by = NULL WHERE id = ?')
      .run(status, periodId);
  }

  const revId = `rev-${Date.now()}`;
  db.prepare(`
    INSERT INTO dossier_reviews (id, reporting_period_id, reviewer_id, reviewer_name, status, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(revId, periodId, req.user!.id, req.user!.full_name, status, comment || `Statut passé à '${status}'`, new Date().toISOString());

  logAudit(orgId, req.user!.id, 'UPDATE_PERIOD_STATUS', 'reporting_periods', periodId, { status, comment });

  const updated = db.prepare('SELECT * FROM reporting_periods WHERE id = ?').get(periodId);
  res.json({ success: true, period: updated });
});

// 6.h Robots.txt et Sitemap.xml pour le référencement naturel
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Allow: /fr/
Allow: /en/
Disallow: /api/
Disallow: /activities
Disallow: /report
Disallow: /dashboard
Disallow: /cbam
Sitemap: http://localhost:5000/sitemap.xml
`);
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const baseUrl = 'http://localhost:5000';
  const routes = [
    '/fr/', '/en/',
    '/fr/solutions-sectorielles', '/en/sector-solutions',
    '/fr/methodologie', '/en/methodology',
    '/fr/macf-cbam', '/en/cbam',
    '/fr/guides', '/en/guides',
    '/fr/actualites', '/en/news',
    '/fr/tarifs', '/en/pricing',
    '/fr/contact', '/en/contact'
  ];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const r of routes) {
    xml += `  <url><loc>${baseUrl}${r}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }
  xml += '</urlset>';
  res.send(xml);
});

// -------------------------------------------------------------
// 7. Module Export Europe — MACF / CBAM (Règlement UE 2023/956 Régime Définitif 2026)
// -------------------------------------------------------------

app.get(['/api/cbam/installations', '/api/organizations/:orgId/cbam/installations'], authenticateToken, requireTenant, (req, res) => {
  const orgId = req.organizationId!;
  const installations = db.prepare(`
    SELECT i.*,
           (SELECT COUNT(*) FROM cbam_products WHERE installation_id = i.id) as products_count,
           (SELECT COALESCE(SUM(annual_export_eu_tonnes), 0) FROM cbam_products WHERE installation_id = i.id) as total_export_tonnes
    FROM cbam_installations i
    WHERE i.organization_id = ?
    ORDER BY i.name ASC
  `).all(orgId);
  res.json(installations);
});

app.post(['/api/cbam/installations', '/api/organizations/:orgId/cbam/installations'], authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const orgId = req.organizationId!;
  const { name, city, unlocode } = req.body;
  const coordinates = req.body.coordinates || (req.body.latitude && req.body.longitude ? `${req.body.latitude}, ${req.body.longitude}` : null);
  if (!name || !city) return res.status(400).json({ error: "Nom et ville de l'installation requis." });

  const id = `inst-${Date.now()}`;
  db.prepare(`
    INSERT INTO cbam_installations (id, organization_id, name, city, unlocode, coordinates, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, orgId, name, city, unlocode || null, coordinates || null, new Date().toISOString());

  logAudit(orgId, req.user!.id, 'CREATE_CBAM_INSTALLATION', 'cbam_installations', id, { name, city, unlocode });

  const created = db.prepare('SELECT * FROM cbam_installations WHERE id = ?').get(id);
  res.status(201).json(created);
});

app.get(['/api/cbam/products', '/api/organizations/:orgId/cbam/products'], authenticateToken, requireTenant, (req, res) => {
  const orgId = req.organizationId!;
  const products = db.prepare(`
    SELECT p.*, i.name as installation_name, i.city as installation_city, i.unlocode, i.coordinates as installation_coordinates
    FROM cbam_products p
    JOIN cbam_installations i ON p.installation_id = i.id
    WHERE p.organization_id = ?
    ORDER BY p.name ASC
  `).all(orgId);
  res.json(products);
});

app.post(['/api/cbam/products', '/api/organizations/:orgId/cbam/products'], authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const orgId = req.organizationId!;
  const {
    installation_id,
    name,
    cn_code,
    sector,
    annual_production_tonnes,
    annual_export_eu_tonnes,
    specific_direct_emissions,
    specific_indirect_emissions,
    specific_total_emissions,
    precursors_json
  } = req.body;

  if (!installation_id || !name || !cn_code || !annual_production_tonnes) {
    return res.status(400).json({ error: "Installation, libellé du produit, code NC et tonnage annuel requis." });
  }

  // Vérifier appartenance installation
  const inst: any = db.prepare('SELECT id FROM cbam_installations WHERE id = ? AND organization_id = ?').get(installation_id, orgId);
  if (!inst) return res.status(404).json({ error: "Installation industrielle introuvable pour cette organisation." });

  const id = `prod-cbam-${Date.now()}`;
  db.prepare(`
    INSERT INTO cbam_products (
      id, organization_id, installation_id, name, cn_code, sector,
      annual_production_tonnes, annual_export_eu_tonnes,
      specific_direct_emissions, specific_indirect_emissions, specific_total_emissions,
      precursors_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orgId, installation_id, name, cn_code, sector || 'Fer et Acier',
    Number(annual_production_tonnes), Number(annual_export_eu_tonnes || 0),
    Number(specific_direct_emissions || 0), Number(specific_indirect_emissions || 0), Number(specific_total_emissions || 0),
    typeof precursors_json === 'string' ? precursors_json : JSON.stringify(precursors_json || []),
    new Date().toISOString()
  );

  logAudit(orgId, req.user!.id, 'CREATE_CBAM_PRODUCT', 'cbam_products', id, { name, cn_code, specific_total_emissions });

  const created = db.prepare(`
    SELECT p.*, i.name as installation_name, i.city as installation_city, i.unlocode
    FROM cbam_products p
    JOIN cbam_installations i ON p.installation_id = i.id
    WHERE p.id = ?
  `).get(id);

  res.status(201).json(created);
});

app.post(['/api/cbam/calculate', '/api/organizations/:orgId/cbam/calculate'], authenticateToken, requireTenant, (req, res) => {
  try {
    const alloc = calculateCBAMSpecificEmbeddedEmissions({
      ...req.body,
      productionTonnage: Number(req.body.productionTonnage),
      cnCode: String(req.body.cnCode || '')
    });
    res.json(alloc);
  } catch (err: any) {
    res.status(422).json({ error: err.message });
  }
});

app.get(['/api/cbam/dossiers', '/api/organizations/:orgId/cbam/dossiers'], authenticateToken, requireTenant, (req, res) => {
  const orgId = req.organizationId!;
  const dossiers = db.prepare(`
    SELECT d.*, p.name as product_name, p.cn_code, p.sector, i.name as installation_name, i.unlocode
    FROM cbam_importer_dossiers d
    JOIN cbam_products p ON d.cbam_product_id = p.id
    JOIN cbam_installations i ON p.installation_id = i.id
    WHERE d.organization_id = ?
    ORDER BY d.created_at DESC
  `).all(orgId);
  res.json(dossiers);
});

app.post(['/api/cbam/dossiers', '/api/organizations/:orgId/cbam/dossiers'], authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const orgId = req.organizationId!;
  const cbam_product_id = req.body.cbam_product_id || req.body.cbamProductId;
  const importer_name = req.body.importer_name || req.body.importerName;
  const importer_country = req.body.importer_country || req.body.importerCountry;
  const importer_eori = req.body.importer_eori || req.body.importerEori;
  const reference_period = req.body.reference_period || req.body.referencePeriod;
  const export_tonnes = req.body.export_tonnes ?? req.body.exportedTonnes ?? req.body.exportTonnes;
  const carbon_price_paid_mad = req.body.carbon_price_paid_mad ?? req.body.carbonPricePaidLocalMAD ?? req.body.carbonPricePaidMAD;

  if (!cbam_product_id || !importer_name || !importer_country || !export_tonnes) {
    return res.status(400).json({ error: "Produit, client importateur UE, pays et tonnage exporté requis." });
  }

  // Récupérer le produit et son installation
  const product: any = db.prepare(`
    SELECT p.*, i.name as installation_name, i.city as installation_city, i.unlocode, i.coordinates,
           o.name as org_name, o.ice as org_ice, o.city as org_city
    FROM cbam_products p
    JOIN cbam_installations i ON p.installation_id = i.id
    JOIN organizations o ON p.organization_id = o.id
    WHERE p.id = ? AND p.organization_id = ?
  `).get(cbam_product_id, orgId);

  if (!product) return res.status(404).json({ error: "Produit MACF introuvable." });

  const expT = Number(export_tonnes);
  const seeDir = Number(product.specific_direct_emissions || 0);
  const seeIndir = Number(product.specific_indirect_emissions || 0);
  const seeTotal = Number(product.specific_total_emissions || 0);
  const seePre = Math.max(0, Number((seeTotal - seeDir - seeIndir).toFixed(4)));

  const totalDirTCO2e = Number((expT * seeDir).toFixed(3));
  const totalIndirTCO2e = Number((expT * seeIndir).toFixed(3));
  const totalPreTCO2e = Number((expT * seePre).toFixed(3));
  const totalEmbeddedTCO2e = Number((expT * seeTotal).toFixed(3));

  const dossierPayload = {
    cbamDeclaration: {
      version: "2026.1",
      regulation: "Regulation (EU) 2023/956 - Definitive Regime",
      reportingPeriod: reference_period || `Année civile ${new Date().getFullYear()} (Régime définitif MACF)`,
      operator: {
        companyName: product.org_name,
        country: "Morocco (MA)",
        ice: product.org_ice,
        city: product.org_city
      },
      installation: {
        name: product.installation_name,
        city: product.installation_city,
        unlocode: product.unlocode || "MA NDR",
        coordinates: product.coordinates || "35.0805° N, 2.9312° W"
      },
      declarantImporter: {
        importerName: importer_name,
        importerCountry: importer_country,
        importerEori: importer_eori || "En cours d'attribution"
      },
      goodsExported: {
        productName: product.name,
        cnCode: product.cn_code,
        sector: product.sector,
        exportedQuantityTonnes: expT
      },
      specificEmbeddedEmissionsTCO2ePerTonne: {
        directSEE: seeDir,
        indirectSEE: seeIndir,
        precursorSEE: seePre,
        totalSEE: seeTotal
      },
      totalExportEmissionsTCO2e: {
        directTCO2e: totalDirTCO2e,
        indirectTCO2e: totalIndirTCO2e,
        precursorTCO2e: totalPreTCO2e,
        totalEmbeddedTCO2e: totalEmbeddedTCO2e
      },
      carbonPricePaidCountryOfOriginMAD: Number(carbon_price_paid_mad || 0),
      complianceStatement: "Calculé et vérifié selon l'Annexe IV du Règlement (UE) 2023/956. Les facteurs d'émission d'électricité et combustibles sont sourcés et traçables.",
      verificationStatus: "Audit Ready - Certifiable ISO 14065 par vérificateur accrédité UE"
    }
  };

  const id = `dossier-${Date.now()}`;
  db.prepare(`
    INSERT INTO cbam_importer_dossiers (
      id, organization_id, cbam_product_id, importer_name, importer_country,
      importer_eori, reference_period, dossier_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orgId, cbam_product_id, importer_name, importer_country,
    importer_eori || null, reference_period || `Exercice ${new Date().getFullYear()}`,
    JSON.stringify(dossierPayload, null, 2),
    new Date().toISOString()
  );

  logAudit(orgId, req.user!.id, 'CREATE_CBAM_DOSSIER', 'cbam_importer_dossiers', id, { importer_name, export_tonnes, totalEmbeddedTCO2e });

  const created = db.prepare(`
    SELECT d.*, p.name as product_name, p.cn_code, p.sector, i.name as installation_name, i.unlocode
    FROM cbam_importer_dossiers d
    JOIN cbam_products p ON d.cbam_product_id = p.id
    JOIN cbam_installations i ON p.installation_id = i.id
    WHERE d.id = ?
  `).get(id);

  res.status(201).json(created);
});

app.get(['/api/cbam/dossiers/:dossierId/download', '/api/organizations/:orgId/cbam/dossiers/:dossierId/download'], authenticateToken, requireTenant, (req, res) => {
  const { dossierId } = req.params;
  const orgId = req.organizationId!;

  const dossier: any = db.prepare(`
    SELECT * FROM cbam_importer_dossiers WHERE id = ? AND organization_id = ?
  `).get(dossierId, orgId);

  if (!dossier) return res.status(404).json({ error: "Dossier MACF introuvable." });

  let parsed: any;
  try {
    parsed = JSON.parse(dossier.dossier_json);
  } catch (e) {
    parsed = { dossier_json: dossier.dossier_json };
  }

  const filename = `CBAM_Declaration_${(dossier.importer_eori || dossier.id).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(parsed, null, 2));
});

// -------------------------------------------------------------
// 8. Plan de Réduction, Trajectoire SBTi / CDN & Simulations
// -------------------------------------------------------------

app.get(['/api/reduction/actions', '/api/organizations/:orgId/reduction-actions'], authenticateToken, requireTenant, (req, res) => {
  const actions = db.prepare('SELECT * FROM reduction_actions WHERE organization_id = ? ORDER BY target_year ASC').all(req.organizationId!);
  res.json(actions);
});

app.post(['/api/reduction/actions', '/api/organizations/:orgId/reduction-actions'], authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { title, category, responsible, cost_mad, annual_savings_tco2e, target_year, site_id, reporting_period_id } = req.body;
  if (!title || !target_year) return res.status(400).json({ error: "Titre et année cible requis." });

  const id = `act-red-${Date.now()}`;
  db.prepare(`
    INSERT INTO reduction_actions (id, organization_id, reporting_period_id, site_id, title, category, responsible, cost_mad, annual_savings_tco2e, target_year, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?)
  `).run(id, req.organizationId!, reporting_period_id || null, site_id || null, title, category || 'Général', responsible || '', Number(cost_mad || 0), Number(annual_savings_tco2e || 0), Number(target_year), new Date().toISOString());

  logAudit(req.organizationId!, req.user!.id, 'CREATE_REDUCTION_ACTION', 'reduction_actions', id, { title, target_year, annual_savings_tco2e });

  const created = db.prepare('SELECT * FROM reduction_actions WHERE id = ?').get(id);
  res.status(201).json(created);
});

app.put(['/api/reduction/actions/:actionId', '/api/organizations/:orgId/reduction-actions/:actionId'], authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { actionId } = req.params;
  const orgId = req.organizationId!;
  const existing: any = db.prepare('SELECT * FROM reduction_actions WHERE id = ? AND organization_id = ?').get(actionId, orgId);
  if (!existing) return res.status(404).json({ error: "Action introuvable." });

  const { title, category, responsible, cost_mad, annual_savings_tco2e, target_year, status, site_id, reporting_period_id } = req.body;

  db.prepare(`
    UPDATE reduction_actions
    SET title = COALESCE(?, title),
        category = COALESCE(?, category),
        responsible = COALESCE(?, responsible),
        cost_mad = CASE WHEN ? IS NOT NULL THEN ? ELSE cost_mad END,
        annual_savings_tco2e = CASE WHEN ? IS NOT NULL THEN ? ELSE annual_savings_tco2e END,
        target_year = CASE WHEN ? IS NOT NULL THEN ? ELSE target_year END,
        status = COALESCE(?, status),
        site_id = CASE WHEN ? IS NOT NULL THEN ? ELSE site_id END,
        reporting_period_id = CASE WHEN ? IS NOT NULL THEN ? ELSE reporting_period_id END
    WHERE id = ? AND organization_id = ?
  `).run(
    title || null,
    category || null,
    responsible || null,
    cost_mad !== undefined ? 1 : null, Number(cost_mad || 0),
    annual_savings_tco2e !== undefined ? 1 : null, Number(annual_savings_tco2e || 0),
    target_year !== undefined ? 1 : null, Number(target_year || 0),
    status || null,
    site_id !== undefined ? 1 : null, site_id || null,
    reporting_period_id !== undefined ? 1 : null, reporting_period_id || null,
    actionId,
    orgId
  );

  logAudit(orgId, req.user!.id, 'UPDATE_REDUCTION_ACTION', 'reduction_actions', actionId, { title, status, annual_savings_tco2e });

  const updated = db.prepare('SELECT * FROM reduction_actions WHERE id = ?').get(actionId);
  res.json(updated);
});

app.delete(['/api/reduction/actions/:actionId', '/api/organizations/:orgId/reduction-actions/:actionId'], authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { actionId } = req.params;
  const orgId = req.organizationId!;
  const existing: any = db.prepare('SELECT * FROM reduction_actions WHERE id = ? AND organization_id = ?').get(actionId, orgId);
  if (!existing) return res.status(404).json({ error: "Action introuvable." });

  db.prepare('DELETE FROM reduction_actions WHERE id = ? AND organization_id = ?').run(actionId, orgId);
  logAudit(orgId, req.user!.id, 'DELETE_REDUCTION_ACTION', 'reduction_actions', actionId, { title: existing.title });

  res.json({ success: true, message: "Action supprimée du plan de réduction." });
});

app.get('/api/organizations/:orgId/trajectory', authenticateToken, requireTenant, (req, res) => {
  const orgId = req.organizationId!;
  const targetYear = req.query.targetYear ? Number(req.query.targetYear) : 2030;
  const reductionPct = req.query.reductionPct ? Number(req.query.reductionPct) : 30; // ex: 30% d'abattement
  const reqBaselineYear = req.query.baselineYear ? Number(req.query.baselineYear) : null;

  // 1. Récupérer tous les exercices avec leurs totaux d'émissions
  const periods: any[] = db.prepare(`
    SELECT p.id, p.name, p.year, p.status,
           COALESCE(SUM(a.emission_t_co2e), 0) as total_tco2e,
           COALESCE(SUM(CASE WHEN a.scope = 1 THEN a.emission_t_co2e ELSE 0 END), 0) as scope1_tco2e,
           COALESCE(SUM(CASE WHEN a.scope = 2 THEN a.emission_t_co2e ELSE 0 END), 0) as scope2_tco2e,
           COALESCE(SUM(CASE WHEN a.scope = 3 THEN a.emission_t_co2e ELSE 0 END), 0) as scope3_tco2e
    FROM reporting_periods p
    LEFT JOIN activity_records a ON a.reporting_period_id = p.id AND a.status = 'active'
    WHERE p.organization_id = ?
    GROUP BY p.id, p.name, p.year, p.status
    ORDER BY p.year ASC
  `).all(orgId);

  // 2. Déterminer l'année de référence (Baseline)
  let baselinePeriod = periods.find(p => reqBaselineYear ? p.year === reqBaselineYear : p.total_tco2e > 0);
  if (!baselinePeriod && periods.length > 0) {
    baselinePeriod = periods[0];
  }

  const baselineYear = baselinePeriod ? baselinePeriod.year : 2024;
  const baselineEmissions = baselinePeriod ? Number(baselinePeriod.total_tco2e) : 0;

  // 3. Récupérer les actions du plan de réduction
  const actions: any[] = db.prepare(`
    SELECT * FROM reduction_actions
    WHERE organization_id = ?
    ORDER BY target_year ASC
  `).all(orgId);

  // 4. Calcul de l'objectif cible (ex: -30% ou -42% aligné SBTi / CDN Maroc 2030)
  const targetEmissions = Math.max(0, baselineEmissions * (1 - (reductionPct / 100)));
  const targetReductionTco2e = Math.max(0, baselineEmissions - targetEmissions);

  // Cumul des économies prévues
  const totalPlannedSavings = actions
    .filter(a => ['proposed', 'in_progress', 'completed'].includes(a.status))
    .reduce((sum, a) => sum + (Number(a.annual_savings_tco2e) || 0), 0);

  // 5. Générer la courbe de trajectoire pluriannuelle année par année
  const trajectoryYears: any[] = [];
  const startY = Math.min(baselineYear, new Date().getFullYear());
  const endY = Math.max(targetYear, startY + 1);
  const totalSpan = Math.max(1, targetYear - baselineYear);

  for (let y = startY; y <= endY; y++) {
    // Calcul cible linéaire
    let targetAtYear = baselineEmissions;
    if (y >= baselineYear) {
      const progressFraction = Math.min(1, Math.max(0, (y - baselineYear) / totalSpan));
      targetAtYear = baselineEmissions * (1 - (reductionPct / 100) * progressFraction);
    }

    // Cumul des actions effectives jusqu'à cette année
    const cumulativeSavingsAtYear = actions
      .filter(a => a.target_year <= y && ['proposed', 'in_progress', 'completed'].includes(a.status))
      .reduce((sum, a) => sum + (Number(a.annual_savings_tco2e) || 0), 0);

    const projectedAtYear = Math.max(0, baselineEmissions - cumulativeSavingsAtYear);

    // Émissions réelles constatées si un exercice existe
    const actualPeriod = periods.find(p => p.year === y);

    trajectoryYears.push({
      year: y,
      target_tco2e: Number(targetAtYear.toFixed(2)),
      projected_tco2e: Number(projectedAtYear.toFixed(2)),
      cumulative_savings_tco2e: Number(cumulativeSavingsAtYear.toFixed(2)),
      actual_tco2e: actualPeriod ? Number(actualPeriod.total_tco2e.toFixed(2)) : null
    });
  }

  const coveragePct = targetReductionTco2e > 0
    ? Number(((totalPlannedSavings / targetReductionTco2e) * 100).toFixed(1))
    : 100;

  const gapTco2e = Math.max(0, Number((targetReductionTco2e - totalPlannedSavings).toFixed(2)));

  res.json({
    baselineYear,
    baselineEmissions: Number(baselineEmissions.toFixed(2)),
    targetYear,
    targetReductionPct: reductionPct,
    targetEmissions: Number(targetEmissions.toFixed(2)),
    targetReductionTco2e: Number(targetReductionTco2e.toFixed(2)),
    totalPlannedSavings: Number(totalPlannedSavings.toFixed(2)),
    coveragePct,
    gapTco2e,
    actionsCount: actions.length,
    history: periods.map(p => ({
      id: p.id,
      name: p.name,
      year: p.year,
      status: p.status,
      total_tco2e: Number(p.total_tco2e.toFixed(2)),
      scope1: Number(p.scope1_tco2e.toFixed(2)),
      scope2: Number(p.scope2_tco2e.toFixed(2)),
      scope3: Number(p.scope3_tco2e.toFixed(2))
    })),
    trajectory: trajectoryYears,
    actions
  });
});

// -------------------------------------------------------------
// 9. Commercial, Devis & Abonnements
// -------------------------------------------------------------

app.get('/api/commercial/quotes', authenticateToken, requireTenant, (req, res) => {
  const quotes = db.prepare('SELECT * FROM quotes WHERE organization_id = ? ORDER BY created_at DESC').all(req.organizationId!);
  res.json(quotes);
});

app.post('/api/commercial/quotes', authenticateToken, requireTenant, (req, res) => {
  const { plan_name, extra_sites_count, extra_users_count, discount_mad, base_amount_mad } = req.body;
  const orgId = req.organizationId!;

  let basePrice = 12000; // Défaut
  if (base_amount_mad !== undefined) {
    basePrice = Number(base_amount_mad);
  } else if (plan_name === 'pme_climat' || plan_name === 'Pack PME Climat') {
    basePrice = 4900;
  } else if (plan_name === 'entreprise_macf' || plan_name === 'Pack Entreprise & Exportateur MACF') {
    basePrice = 14500;
  } else if (plan_name === 'grand_compte' || plan_name === 'Pack Grand Compte & Industrie') {
    basePrice = 29000;
  } else if (plan_name === 'Essentiel') {
    basePrice = 12000;
  } else if (plan_name === 'Entreprise') {
    basePrice = 24000;
  } else if (plan_name === 'Export Europe') {
    basePrice = 45000;
  }

  const sitesCost = (extra_sites_count || 0) * 2000;
  const usersCost = (extra_users_count || 0) * 800;
  const subtotalHT = Math.max(0, basePrice + sitesCost + usersCost - (discount_mad || 0));
  const tvaAmount = subtotalHT * 0.20;
  const totalTTC = subtotalHT + tvaAmount;

  const quoteId = `quote-${Date.now()}`;
  const quoteNumber = `DEV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  db.prepare(`
    INSERT INTO quotes (
      id, quote_number, organization_id, plan_name, base_amount_mad,
      extra_sites_count, extra_users_count, discount_mad, tva_rate, tva_amount_mad,
      total_ttc_mad, status, valid_until, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.20, ?, ?, 'sent', ?, ?, ?)
  `).run(
    quoteId, quoteNumber, orgId, plan_name || 'Entreprise', basePrice,
    extra_sites_count || 0, extra_users_count || 0, discount_mad || 0,
    tvaAmount, totalTTC, '2026-12-31', req.user!.id, new Date().toISOString()
  );

  res.status(201).json({
    id: quoteId,
    quoteNumber,
    baseAmountMAD: basePrice,
    extraSitesCostMAD: sitesCost,
    extraUsersCostMAD: usersCost,
    subtotalHT,
    tvaAmount,
    totalTTC,
    currency: 'MAD'
  });
});

// Téléchargement du devis proforma officiel au format PDF
app.get(['/api/commercial/quotes/:quoteId/pdf', '/api/organizations/:orgId/commercial/quotes/:quoteId/pdf'], authenticateToken, requireTenant, async (req, res) => {
  const quoteId = req.params.quoteId;
  const orgId = req.organizationId!;

  const quote: any = db.prepare(`
    SELECT q.*, o.name as org_name, o.city as org_city, o.ice as org_ice
    FROM quotes q
    JOIN organizations o ON q.organization_id = o.id
    WHERE (q.id = ? OR q.quote_number = ?) AND q.organization_id = ?
  `).get(quoteId, quoteId, orgId);

  if (!quote) {
    return res.status(404).json({ error: "Devis introuvable." });
  }

  try {
    const user = req.user;
    const subtotalHT = Number(quote.total_ttc_mad) - Number(quote.tva_amount_mad);
    const pdfBuffer = await generateQuotePdf({
      quoteNumber: quote.quote_number,
      date: new Date(quote.created_at).toLocaleDateString('fr-FR'),
      validUntil: new Date(quote.valid_until || Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      companyName: quote.org_name || 'Entreprise',
      contactName: user?.full_name,
      contactEmail: user?.email,
      city: quote.org_city || 'Casablanca',
      ice: quote.org_ice || '003456789000045',
      planName: quote.plan_name,
      baseAmountMAD: Number(quote.base_amount_mad),
      extraSitesCount: Number(quote.extra_sites_count || 0),
      extraSitesCostMAD: Number(quote.extra_sites_count || 0) * 2000,
      extraUsersCount: Number(quote.extra_users_count || 0),
      extraUsersCostMAD: Number(quote.extra_users_count || 0) * 800,
      discountMAD: Number(quote.discount_mad || 0),
      subtotalHT: subtotalHT,
      tvaRate: Number(quote.tva_rate || 0.20),
      tvaAmountMAD: Number(quote.tva_amount_mad),
      totalTTCMAD: Number(quote.total_ttc_mad),
      status: quote.status
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Devis_AtlasCarbone_${quote.quote_number}.pdf`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error("Erreur génération PDF devis:", err);
    res.status(500).json({ error: "Échec de génération du devis PDF: " + err.message });
  }
});

app.get('/api/commercial/subscription', authenticateToken, requireTenant, (req, res) => {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE organization_id = ?').get(req.organizationId!);
  res.json(sub);
});

// Mise à niveau d'abonnement (Upgrade)
app.post(['/api/commercial/subscription/upgrade', '/api/organizations/:orgId/commercial/subscription/upgrade'], authenticateToken, requireTenant, requireRole(['admin']), (req, res) => {
  const orgId = req.organizationId!;
  const { newPlanId } = req.body;

  const PLAN_LIMITS: Record<string, { name: string; priceMAD: number; sites: number; users: number; cbam: number }> = {
    pme_climat: { name: 'Pack PME Climat', priceMAD: 4900, sites: 1, users: 3, cbam: 0 },
    entreprise_macf: { name: 'Pack Entreprise & Exportateur MACF', priceMAD: 14500, sites: 5, users: 10, cbam: 1 },
    grand_compte: { name: 'Pack Grand Compte & Industrie', priceMAD: 29000, sites: 99, users: 99, cbam: 1 },
    Essentiel: { name: 'Pack Essentiel', priceMAD: 12000, sites: 1, users: 3, cbam: 0 },
    Entreprise: { name: 'Pack Entreprise', priceMAD: 24000, sites: 5, users: 10, cbam: 1 },
    'Export Europe': { name: 'Pack Export Europe MACF', priceMAD: 45000, sites: 10, users: 20, cbam: 1 }
  };

  const targetPlan = PLAN_LIMITS[newPlanId] || PLAN_LIMITS['entreprise_macf'];
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const existingSub: any = db.prepare('SELECT * FROM subscriptions WHERE organization_id = ?').get(orgId);
  if (existingSub) {
    db.prepare(`
      UPDATE subscriptions
      SET plan_name = ?, status = 'active', sites_limit = ?, users_limit = ?, cbam_access = ?, current_period_end = ?
      WHERE organization_id = ?
    `).run(targetPlan.name, targetPlan.sites, targetPlan.users, targetPlan.cbam, oneYearFromNow, orgId);
  } else {
    db.prepare(`
      INSERT INTO subscriptions (id, organization_id, plan_name, status, sites_limit, users_limit, cbam_access, current_period_end, created_at)
      VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)
    `).run(`sub-${Date.now()}`, orgId, targetPlan.name, targetPlan.sites, targetPlan.users, targetPlan.cbam, oneYearFromNow, new Date().toISOString());
  }

  logAudit(orgId, req.user!.id, 'UPGRADE_SUBSCRIPTION', 'subscriptions', orgId, { newPlan: targetPlan.name, limits: targetPlan });

  const updatedSub = db.prepare('SELECT * FROM subscriptions WHERE organization_id = ?').get(orgId);
  res.json({
    success: true,
    message: `Abonnement mis à niveau avec succès vers : ${targetPlan.name}.`,
    subscription: updatedSub
  });
});

// -------------------------------------------------------------
// 10. Site Public & Acquisition Leads Commerciale B2B
// -------------------------------------------------------------

const OFFICIAL_CONSULTANT_EMAIL = 'abdelaziz.motiaa@gmail.com';
const CALENDLY_CONSULTATION_URL = 'https://calendly.com/abdelaziz-motiaa/30min';

app.post('/api/leads', (req, res) => {
  const {
    company,
    full_name,
    email,
    phone,
    sector,
    city,
    employee_count,
    has_existing_bilan,
    main_objective,
    message,
    utm_source
  } = req.body;

  // Validation stricte des champs obligatoires
  if (!company || !full_name || !email || !phone || !sector) {
    return res.status(400).json({
      error: "Veuillez renseigner les champs obligatoires : entreprise, responsable, email, téléphone et secteur d'activité."
    });
  }

  const id = `lead-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const safeObjective = main_objective || 'Réaliser un premier bilan carbone';

  db.prepare(`
    INSERT INTO leads (
      id, full_name, email, phone, company, sector, city, employee_count,
      has_existing_bilan, main_objective, message, status, notes, meeting_booked,
      utm_source, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Nouveau', '', 0, ?, ?)
  `).run(
    id,
    full_name.trim(),
    email.trim().toLowerCase(),
    phone.trim(),
    company.trim(),
    sector.trim(),
    (city || '').trim(),
    employee_count || 'Non spécifié',
    has_existing_bilan || 'non',
    safeObjective,
    (message || '').trim(),
    utm_source || 'site_commercial',
    createdAt
  );

  // 1. Notification immédiate au consultant Abdelaziz Motiaa
  db.prepare(`
    INSERT INTO dev_notifications (id, recipient_email, subject, template_name, content_html, sent_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    `notif-admin-${Date.now()}`,
    OFFICIAL_CONSULTANT_EMAIL,
    `[Atlas Carbone] Nouvelle demande de qualification B2B — ${company.trim()}`,
    'lead_admin_alert',
    `<h2>Nouvelle demande de bilan carbone initial accompagné</h2>
     <p><strong>Entreprise :</strong> ${company.trim()}</p>
     <p><strong>Responsable :</strong> ${full_name.trim()}</p>
     <p><strong>Email :</strong> <a href="mailto:${email.trim()}">${email.trim()}</a></p>
     <p><strong>Téléphone :</strong> <a href="tel:${phone.trim()}">${phone.trim()}</a> | <a href="https://wa.me/${phone.trim().replace(/[^0-9]/g, '')}">WhatsApp</a></p>
     <p><strong>Secteur d'activité :</strong> ${sector.trim()}</p>
     <p><strong>Ville :</strong> ${(city || 'Non renseignée').trim()}</p>
     <p><strong>Taille entreprise :</strong> ${employee_count || 'Non spécifié'}</p>
     <p><strong>Bilan existant :</strong> ${has_existing_bilan || 'Non'}</p>
     <p><strong>Objectif principal :</strong> ${safeObjective}</p>
     <p><strong>Message :</strong></p>
     <blockquote style="background:#f1f5f9;padding:10px;border-left:4px solid #047857;">${(message || 'Aucun message spécifique').trim()}</blockquote>
     <p><em>Enregistré le ${new Date().toLocaleString('fr-FR')}</em></p>`,
    createdAt
  );

  // 2. Accusé de réception professionnel au prospect avec proposition de réservation Calendly
  db.prepare(`
    INSERT INTO dev_notifications (id, recipient_email, subject, template_name, content_html, sent_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    `notif-prospect-${Date.now()}`,
    email.trim().toLowerCase(),
    `Atlas Carbone — Confirmation de votre demande d'accompagnement`,
    'lead_prospect_confirmation',
    `<p>Bonjour ${full_name.trim()},</p>
     <p>Nous vous remercions pour l'intérêt porté à <strong>Atlas Carbone</strong> et à notre accompagnement pour la réalisation du bilan carbone de votre entreprise <strong>${company.trim()}</strong>.</p>
     <p>Votre demande a bien été transmise à notre consultant, <strong>Abdelaziz Motiaa</strong> (Ingénieur Environnement & Doctorant-Chercheur à l'UM6P, spécialisé dans la mesure et la quantification des émissions GES).</p>
     <div style="background:#f0fdf4;border:1px solid #86efac;padding:16px;border-radius:8px;margin:20px 0;">
       <h3 style="color:#166534;margin-top:0;">Étape suivante : Réserver votre consultation découverte gratuite (30 min)</h3>
       <p style="margin-bottom:12px;">Afin de cadrer précisément vos besoins, la consultation initiale de 30 minutes est offerte et sans engagement :</p>
       <p><a href="${CALENDLY_CONSULTATION_URL}" style="display:inline-block;background:#047857;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">Réserver mon créneau de 30 minutes</a></p>
     </div>
     <p>Si vous préférez un contact direct :</p>
     <ul>
       <li>Email : <a href="mailto:${OFFICIAL_CONSULTANT_EMAIL}">${OFFICIAL_CONSULTANT_EMAIL}</a></li>
       <li>Téléphone / WhatsApp : +212 671 581 167</li>
     </ul>
     <p>Bien cordialement,<br><strong>Atlas Carbone</strong> — Abdelaziz Motiaa</p>`,
    createdAt
  );

  res.status(201).json({
    success: true,
    message: "Votre demande a été transmise avec succès. Vous pouvez maintenant réserver votre consultation découverte de 30 minutes.",
    leadId: id,
    calendlyUrl: CALENDLY_CONSULTATION_URL
  });
});

// Enregistrer la confirmation d'un rendez-vous Calendly pris par un prospect
app.post('/api/leads/:id/meeting-booked', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare(`UPDATE leads SET meeting_booked = 1, status = 'Rendez-vous' WHERE id = ?`).run(id);
    res.json({ success: true, message: "Rendez-vous enregistré." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Administration des Leads (CRM Simple)
app.get('/api/admin/leads', authenticateToken, (req: any, res) => {
  // Accessible aux administrateurs plateforme ou d'organisation
  if (!req.user?.is_superadmin) {
    const isOrgAdmin = db.prepare(`SELECT 1 FROM memberships WHERE user_id = ? AND role IN ('admin', 'carbon_manager', 'commercial') LIMIT 1`).get(req.user.id);
    if (!isOrgAdmin) {
      return res.status(403).json({ error: "Accès réservé aux gestionnaires commerciaux et administrateurs." });
    }
  }

  const leads = db.prepare(`SELECT * FROM leads ORDER BY created_at DESC`).all();
  res.json({ leads });
});

app.patch('/api/admin/leads/:id/status', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const validStatuses = ['Nouveau', 'Contacté', 'Rendez-vous', 'Devis envoyé', 'Client', 'Clôturé'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Statut non valide. Valeurs autorisées : " + validStatuses.join(', ') });
  }

  const lead: any = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!lead) {
    return res.status(404).json({ error: "Lead introuvable." });
  }

  const newStatus = status || lead.status;
  const newNotes = notes !== undefined ? notes : lead.notes;

  db.prepare(`UPDATE leads SET status = ?, notes = ? WHERE id = ?`).run(newStatus, newNotes, id);
  res.json({ success: true, message: "Statut du prospect mis à jour.", lead: { ...lead, status: newStatus, notes: newNotes } });
});

// -------------------------------------------------------------
// 11. Service Frontend SPA en Production
// -------------------------------------------------------------

import path from 'node:path';
import fs from 'node:fs';

const clientDistPaths = [
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve('/home/abdelaziz/Desktop/PhD/analysis/atlas-carbone/client/dist')
];

let activeClientDist = '';
for (const p of clientDistPaths) {
  if (fs.existsSync(p)) {
    activeClientDist = p;
    break;
  }
}

if (activeClientDist) {
  console.log(`📦 Service frontend SPA activé depuis : ${activeClientDist}`);
  app.use(express.static(activeClientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(activeClientDist, 'index.html'));
  });
}

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Atlas Carbone Backend démarré sur http://localhost:${PORT}`);
});
