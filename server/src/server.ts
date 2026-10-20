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

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'atlas_carbone_secret_key_2026_maroc';

app.use(cors());
app.use(express.json());

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
    }
  }
}

// -------------------------------------------------------------
// Middlewares d'Authentification et d'Isolation Multi-Tenant
// -------------------------------------------------------------

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Authentification requise. Jeton d'accès manquant." });
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
  const orgId = (req.params.orgId || req.headers['x-organization-id'] || req.query.orgId) as string;

  if (!orgId) {
    return res.status(400).json({ error: "Identifiant d'entreprise requis (orgId manquant)." });
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

  res.json({
    period,
    summary: {
      totalTCO2e: (scope1Kg + scope2Kg + scope3Kg) / 1000.0,
      scope1TCO2e: scope1Kg / 1000.0,
      scope2TCO2e: scope2Kg / 1000.0,
      scope3TCO2e: scope3Kg / 1000.0,
      biogenicTCO2e: biogenicKg / 1000.0,
      totalActivitiesCount: activities.length
    },
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
// 4. Sites
// -------------------------------------------------------------

app.get('/api/organizations/:orgId/sites', authenticateToken, requireTenant, (req, res) => {
  const sites = db.prepare('SELECT * FROM sites WHERE organization_id = ?').all(req.organizationId!);
  res.json(sites);
});

app.post('/api/organizations/:orgId/sites', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { name, city, address } = req.body;
  if (!name || !city) return res.status(400).json({ error: "Nom et ville requis pour le site." });

  const id = `site-${Date.now()}`;
  db.prepare(`
    INSERT INTO sites (id, organization_id, name, city, address, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.organizationId!, name, city, address || '', new Date().toISOString());

  res.status(201).json({ id, name, city });
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
  const {
    reporting_period_id,
    site_id,
    category,
    label,
    quantity,
    unit,
    factor_id,
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
      allowProvisionalScope1: Boolean(allowProvisionalScope1)
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

// -------------------------------------------------------------
// 6. Catalogue des Facteurs d'Émission
// -------------------------------------------------------------

app.get('/api/factors', authenticateToken, (req, res) => {
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

  query += ' ORDER BY scope ASC, name ASC LIMIT 200';
  const factors = db.prepare(query).all(...params);
  res.json(factors);
});

// -------------------------------------------------------------
// 7. Module Export Europe — MACF / CBAM
// -------------------------------------------------------------

app.get('/api/cbam/products', authenticateToken, requireTenant, (req, res) => {
  const orgId = req.organizationId!;
  const products = db.prepare(`
    SELECT p.*, i.name as installation_name, i.city as installation_city, i.unlocode
    FROM cbam_products p
    JOIN cbam_installations i ON p.installation_id = i.id
    WHERE p.organization_id = ?
  `).all(orgId);
  res.json(products);
});

app.post('/api/cbam/calculate', authenticateToken, requireTenant, (req, res) => {
  const { processEmissionsTCO2e, precursorEmissionsTCO2e, productionTonnage, cnCode } = req.body;
  try {
    const alloc = calculateCBAMSpecificEmbeddedEmissions({
      processEmissionsTCO2e: Number(processEmissionsTCO2e),
      precursorEmissionsTCO2e: Number(precursorEmissionsTCO2e),
      productionTonnage: Number(productionTonnage),
      cnCode: String(cnCode || '')
    });
    res.json(alloc);
  } catch (err: any) {
    res.status(422).json({ error: err.message });
  }
});

app.get('/api/cbam/dossiers', authenticateToken, requireTenant, (req, res) => {
  const orgId = req.organizationId!;
  const dossiers = db.prepare(`
    SELECT d.*, p.name as product_name, p.cn_code
    FROM cbam_importer_dossiers d
    JOIN cbam_products p ON d.cbam_product_id = p.id
    WHERE d.organization_id = ?
  `).all(orgId);
  res.json(dossiers);
});

// -------------------------------------------------------------
// 8. Plan de Réduction & Simulations
// -------------------------------------------------------------

app.get('/api/reduction/actions', authenticateToken, requireTenant, (req, res) => {
  const actions = db.prepare('SELECT * FROM reduction_actions WHERE organization_id = ? ORDER BY target_year ASC').all(req.organizationId!);
  res.json(actions);
});

app.post('/api/reduction/actions', authenticateToken, requireTenant, requireRole(['admin', 'carbon_manager']), (req, res) => {
  const { title, category, responsible, cost_mad, annual_savings_tco2e, target_year } = req.body;
  if (!title || !target_year) return res.status(400).json({ error: "Titre et année cible requis." });

  const id = `act-red-${Date.now()}`;
  db.prepare(`
    INSERT INTO reduction_actions (id, organization_id, title, category, responsible, cost_mad, annual_savings_tco2e, target_year, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?)
  `).run(id, req.organizationId!, title, category || 'Général', responsible || '', Number(cost_mad || 0), Number(annual_savings_tco2e || 0), Number(target_year), new Date().toISOString());

  res.status(201).json({ id, title, target_year });
});

// -------------------------------------------------------------
// 9. Commercial, Devis & Abonnements
// -------------------------------------------------------------

app.get('/api/commercial/quotes', authenticateToken, requireTenant, (req, res) => {
  const quotes = db.prepare('SELECT * FROM quotes WHERE organization_id = ? ORDER BY created_at DESC').all(req.organizationId!);
  res.json(quotes);
});

app.post('/api/commercial/quotes', authenticateToken, requireTenant, (req, res) => {
  const { plan_name, extra_sites_count, extra_users_count, discount_mad } = req.body;
  const orgId = req.organizationId!;

  let basePrice = 12000; // Essentiel
  if (plan_name === 'Entreprise') basePrice = 24000;
  if (plan_name === 'Export Europe') basePrice = 45000;

  const sitesCost = (extra_sites_count || 0) * 2000;
  const usersCost = (extra_users_count || 0) * 800;
  const subtotalHT = basePrice + sitesCost + usersCost - (discount_mad || 0);
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
    subtotalHT,
    tvaAmount,
    totalTTC,
    currency: 'MAD'
  });
});

app.get('/api/commercial/subscription', authenticateToken, requireTenant, (req, res) => {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE organization_id = ?').get(req.organizationId!);
  res.json(sub);
});

// -------------------------------------------------------------
// 10. Site Public & Acquisition Leads
// -------------------------------------------------------------

app.post('/api/leads', (req, res) => {
  const { full_name, email, phone, company, sector, message, utm_source } = req.body;
  if (!full_name || !email || !company) {
    return res.status(400).json({ error: "Nom, email et entreprise requis." });
  }

  const id = `lead-${Date.now()}`;
  db.prepare(`
    INSERT INTO leads (id, full_name, email, phone, company, sector, message, utm_source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, full_name, email, phone || '', company, sector || '', message || '', utm_source || 'direct', new Date().toISOString());

  // Enregistrer accusé de réception dans dev_notifications
  db.prepare(`
    INSERT INTO dev_notifications (id, recipient_email, subject, template_name, content_html, sent_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    `notif-${Date.now()}`, email,
    'Bienvenue sur Atlas Carbone — Confirmation de votre demande de démonstration',
    'lead_acknowledgement',
    `<p>Bonjour ${full_name},</p><p>Nous avons bien reçu votre demande pour votre entreprise <strong>${company}</strong>. Un expert carbone vous contactera sous 24h.</p>`,
    new Date().toISOString()
  );

  res.status(201).json({ message: "Demande enregistrée avec succès. Un conseiller vous contactera.", leadId: id });
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
