/**
 * Atlas Carbone - Module d'Intégration ERP & Connecteurs API Industriels (Phase 5)
 * Conforme à AGENTS.md :
 * - Facteurs d'émissions officiels du classeur certifié marocain (ONEE Mix Moyen, Diesel Pompe, Essence Pompe, Propane).
 * - Conversions déterministes à partir des montants en Dirhams marocains (MAD) ou quantités physiques.
 * - Protection anti-doublon absolue par référence de facture (invoice_ref) -> HTTP 409 Conflict.
 * - Authentification Machine-to-Machine par clé d'API (ak_live_...) avec hachage SHA-256.
 * - Isolation multi-tenant stricte et journalisation complète d'audit.
 */

import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { calculateEmission, EmissionFactorInput } from '../core/calculations.js';
import { BILL_CONVERSION_PRESETS, convertBillToPhysical } from '../core/units.js';

export const integrationsRouter = Router();

// Mapping des presets industriels marocains pour l'ingestion automatique
export const ERP_INVOICE_PRESETS: Record<string, {
  presetKey: string;
  defaultFactorId: string;
  category: string;
  scope: number;
  labelFr: string;
  labelEn: string;
  defaultPriceMad: number;
  unit: string;
  allowProvisionalScope1?: boolean;
}> = {
  'electricity_onee_mt': {
    presetKey: 'electricite_onee_mt_indus',
    defaultFactorId: 'FE-MA-0200', // ou FE-MA-0671 (0.642602 kgCO2e/kWh)
    category: 'electricite_reseau',
    scope: 2,
    labelFr: "Facture Électricité ONEE - Moyenne Tension (Ateliers, Usines)",
    labelEn: "ONEE Electricity Invoice - Medium Voltage",
    defaultPriceMad: 1.15,
    unit: 'kWh'
  },
  'electricity_onee_bt': {
    presetKey: 'electricite_onee_bt_pro',
    defaultFactorId: 'FE-MA-0200',
    category: 'electricite_reseau',
    scope: 2,
    labelFr: "Facture Électricité ONEE / Régie - Basse Tension (Bureaux, Agences)",
    labelEn: "ONEE / Utility Electricity Invoice - Low Voltage",
    defaultPriceMad: 1.25,
    unit: 'kWh'
  },
  'electricity_onee_ht': {
    presetKey: 'electricite_onee_ht_indus',
    defaultFactorId: 'FE-MA-0200',
    category: 'electricite_reseau',
    scope: 2,
    labelFr: "Facture Électricité ONEE - Haute Tension (Grande Industrie)",
    labelEn: "ONEE Electricity Invoice - High Voltage",
    defaultPriceMad: 0.98,
    unit: 'kWh'
  },
  'diesel_fleet': {
    presetKey: 'gasoil_flotte',
    defaultFactorId: 'FE-MA-0029', // Diesel Pompe (3.056 kgCO2e/litre)
    category: 'combustion_mobile',
    scope: 1,
    labelFr: "Facture Carburant Gasoil / Diesel (Flotte utilitaire & Groupes électrogènes)",
    labelEn: "Diesel Fuel Fleet Invoice",
    defaultPriceMad: 12.50,
    unit: 'litre'
  },
  'gasoline_fleet': {
    presetKey: 'essence_flotte',
    defaultFactorId: 'FE-MA-0030', // Essence Pompe (2.915 kgCO2e/litre)
    category: 'combustion_mobile',
    scope: 1,
    labelFr: "Facture Carburant Essence Sans Plomb (Flotte véhicules légers)",
    labelEn: "Unleaded Gasoline Fleet Invoice",
    defaultPriceMad: 14.20,
    unit: 'litre'
  },
  'propane_tank': {
    presetKey: 'propane_vrac_citerne',
    defaultFactorId: 'FE-MA-0020', // Propane GPL (3439 kgCO2e/tonne)
    category: 'combustion_fixe',
    scope: 1,
    labelFr: "Facture Gaz Propane Vrac Citerne (Chaudières et Fours industriels)",
    labelEn: "Bulk Propane Tank Invoice",
    defaultPriceMad: 11.00, // 11 MAD/kg = 11,000 MAD/tonne
    unit: 'tonne',
    allowProvisionalScope1: true
  }
};

/**
 * Dispatche un événement de webhook aux systèmes tiers connectés
 */
export async function dispatchWebhookEvent(orgId: string, event: string, payload: any) {
  try {
    const hooks: any[] = db.prepare('SELECT * FROM webhooks WHERE organization_id = ? AND is_active = 1').all(orgId);
    for (const hook of hooks) {
      let events: string[] = [];
      try {
        events = JSON.parse(hook.subscribed_events || '[]');
      } catch (_) {
        events = [hook.subscribed_events];
      }

      if (events.includes(event) || events.includes('*')) {
        const body = JSON.stringify({
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          event,
          created_at: new Date().toISOString(),
          organization_id: orgId,
          data: payload
        });
        const signature = crypto.createHmac('sha256', hook.secret_key).update(body).digest('hex');

        fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Atlas-Signature': signature,
            'X-Atlas-Event': event
          },
          body,
          signal: AbortSignal.timeout(5000)
        }).then(() => {
          db.prepare('UPDATE webhooks SET last_triggered_at = ? WHERE id = ?').run(new Date().toISOString(), hook.id);
        }).catch(err => {
          console.warn(`[Webhook] Échec de notification vers ${hook.url}:`, err.message);
        });
      }
    }
  } catch (err) {
    console.error('[Webhook Dispatcher Error]', err);
  }
}

/**
 * ----------------------------------------------------------------------
 * 1. GESTION DES CLÉS D'API MACHINE-TO-MACHINE (api_keys)
 * ----------------------------------------------------------------------
 */

// Lister les clés d'API de l'organisation
integrationsRouter.get('/api-keys', (req: Request, res: Response) => {
  const orgId = req.organizationId!;
  const keys: any[] = db.prepare(`
    SELECT id, name, key_prefix, permissions, is_active, last_used_at, created_at, created_by
    FROM api_keys
    WHERE organization_id = ?
    ORDER BY created_at DESC
  `).all(orgId);

  res.json({ keys });
});

// Créer une nouvelle clé d'API (affichée une seule fois à la génération)
integrationsRouter.post('/api-keys', (req: Request, res: Response) => {
  const orgId = req.organizationId!;
  if (req.userRole !== 'admin' && req.userRole !== 'super_admin' && !req.user?.is_superadmin) {
    return res.status(403).json({ error: "Permission insuffisante : seul un administrateur d'entreprise peut générer une clé d'API." });
  }
  const { name, permissions = 'read_write' } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: "Le nom du système ou de la clé d'API est requis (ex: 'Connecteur SAP Casablanca')." });
  }

  const validPerms = ['read_only', 'read_write', 'full'];
  const perm = validPerms.includes(permissions) ? permissions : 'read_write';

  // Génération d'une clé sécurisée ak_live_ + 48 caractères hex
  const rawSecret = crypto.randomBytes(24).toString('hex');
  const apiKey = `ak_live_${rawSecret}`;
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyPrefix = apiKey.substring(0, 14); // ex: ak_live_a1b2c3
  const keyId = `key-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();
  const userId = req.user?.id || null;

  db.prepare(`
    INSERT INTO api_keys (id, organization_id, name, key_hash, key_prefix, permissions, is_active, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(keyId, orgId, name.trim(), keyHash, keyPrefix, perm, userId, now);

  // Journalisation d'audit
  try {
    db.prepare(`
      INSERT INTO audit_events (id, organization_id, user_id, action, entity_type, entity_id, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orgId,
      userId,
      'create_api_key',
      'api_key',
      keyId,
      JSON.stringify({ name: name.trim(), key_prefix: keyPrefix, permissions: perm }),
      now
    );
  } catch (_) {}

  // Renvoyer la clé en clair UNIQUEMENT lors de la création
  res.status(201).json({
    id: keyId,
    name: name.trim(),
    key: apiKey,
    key_prefix: keyPrefix,
    permissions: perm,
    created_at: now,
    message: "Clé d'API générée avec succès. Copiez-la immédiatement : elle ne pourra plus jamais être affichée."
  });
});

// Révoquer ou supprimer une clé d'API
integrationsRouter.delete('/api-keys/:keyId', (req: Request, res: Response) => {
  const orgId = req.organizationId!;
  if (req.userRole !== 'admin' && req.userRole !== 'super_admin' && !req.user?.is_superadmin) {
    return res.status(403).json({ error: "Permission insuffisante : seul un administrateur d'entreprise peut révoquer une clé d'API." });
  }
  const { keyId } = req.params;

  const existing: any = db.prepare('SELECT id, name, key_prefix FROM api_keys WHERE id = ? AND organization_id = ?').get(keyId, orgId);
  if (!existing) {
    return res.status(404).json({ error: "Clé d'API introuvable." });
  }

  db.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ? AND organization_id = ?').run(keyId, orgId);

  try {
    db.prepare(`
      INSERT INTO audit_events (id, organization_id, user_id, action, entity_type, entity_id, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orgId,
      req.user?.id || null,
      'revoke_api_key',
      'api_key',
      keyId,
      JSON.stringify({ name: existing.name, key_prefix: existing.key_prefix }),
      new Date().toISOString()
    );
  } catch (_) {}

  res.json({ success: true, message: `Clé d'API '${existing.name}' (${existing.key_prefix}...) révoquée avec succès.` });
});

/**
 * ----------------------------------------------------------------------
 * 2. CONNECTEUR AUTOMATIQUE DE FACTURES ÉNERGÉTIQUES MAROCAINES
 * Ingestion unitaire avec conversion déterministe MAD -> physique et anti-doublon
 * ----------------------------------------------------------------------
 */
integrationsRouter.post('/energy-invoice', (req: Request, res: Response) => {
  const orgId = req.organizationId!;
  const reporting_period_id = req.body.reporting_period_id || req.body.periodId;
  let site_id = req.body.site_id || req.body.siteId;
  const invoice_ref = req.body.invoice_ref ? String(req.body.invoice_ref).trim() : null;
  const supplier_name = req.body.supplier_name ? String(req.body.supplier_name).trim() : 'Fournisseur d\'énergie';
  const invoice_type = req.body.invoice_type || 'electricity_onee_mt';
  const bill_amount_mad = req.body.bill_amount_mad !== undefined ? Number(req.body.bill_amount_mad) : null;
  let quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : null;
  let unit = req.body.unit ? String(req.body.unit).trim() : null;
  const unit_price_mad = req.body.unit_price_mad !== undefined ? Number(req.body.unit_price_mad) : null;
  const invoice_date = req.body.invoice_date || new Date().toISOString().split('T')[0];
  const custom_label = req.body.label || req.body.description;

  if (!reporting_period_id) {
    return res.status(400).json({ error: "L'identifiant de la période de reporting (reporting_period_id) est requis." });
  }

  if (!invoice_ref) {
    return res.status(400).json({ error: "Le numéro ou référence de facture (invoice_ref) est requis pour assurer la traçabilité et l'anti-doublon." });
  }

  // Vérifier la période
  const period: any = db.prepare('SELECT id, status, name, year FROM reporting_periods WHERE id = ? AND organization_id = ?').get(reporting_period_id, orgId);
  if (!period) {
    return res.status(404).json({ error: "Exercice comptable de reporting introuvable pour cette entreprise." });
  }
  if (period.status === 'closed') {
    return res.status(403).json({ error: `L'exercice ${period.name || period.year} est clôturé. Aucune nouvelle facture ne peut y être intégrée.` });
  }

  // Si site non spécifié, prendre le site siège ou le premier site actif
  if (!site_id) {
    const defaultSite: any = db.prepare('SELECT id FROM sites WHERE organization_id = ? ORDER BY created_at ASC LIMIT 1').get(orgId);
    if (!defaultSite) {
      return res.status(400).json({ error: "Aucun site configuré pour cette entreprise. Veuillez d'abord créer au moins un site opérationnel." });
    }
    site_id = defaultSite.id;
  } else {
    const siteCheck: any = db.prepare('SELECT id FROM sites WHERE id = ? AND organization_id = ?').get(site_id, orgId);
    if (!siteCheck) {
      return res.status(404).json({ error: "Le site spécifié est introuvable pour cette organisation." });
    }
  }

  // RÈGLE MÉTHODOLOGIQUE CLÉ : DÉTECTION ET REJET ABSOLU DES DOUBLONS
  const existingDuplicate: any = db.prepare(`
    SELECT id, label, created_at, emission_t_co2e, quantity, unit
    FROM activity_records
    WHERE organization_id = ? AND reporting_period_id = ? AND invoice_ref = ? AND status = 'active'
  `).get(orgId, reporting_period_id, invoice_ref);

  if (existingDuplicate) {
    return res.status(409).json({
      error: `DOUBLON DÉTECTÉ : La facture '${invoice_ref}' a déjà été comptabilisée le ${new Date(existingDuplicate.created_at).toLocaleDateString('fr-FR')} (Activité ID: ${existingDuplicate.id}, Émissions: ${existingDuplicate.emission_t_co2e} tCO2e).`,
      details: {
        duplicate_ref: invoice_ref,
        existing_record_id: existingDuplicate.id,
        existing_emission_tco2e: existingDuplicate.emission_tco2e,
        rule: "Pour garantir la conformité ISO 14064-1 et GHG Protocol, Atlas Carbone interdit le double enregistrement d'une même facture d'énergie."
      }
    });
  }

  // Résolution du preset ou configuration personnalisée
  const preset = ERP_INVOICE_PRESETS[invoice_type] || ERP_INVOICE_PRESETS['electricity_onee_mt'];
  const effectivePriceMad = unit_price_mad || preset.defaultPriceMad;

  // Calcul de la quantité physique si le montant en MAD a été fourni
  let convertedFromMad = false;
  if ((quantity === null || isNaN(quantity) || unit === 'MAD') && bill_amount_mad !== null && !isNaN(bill_amount_mad)) {
    if (bill_amount_mad <= 0) {
      return res.status(400).json({ error: "Le montant de la facture en MAD doit être supérieur à 0." });
    }
    quantity = bill_amount_mad / effectivePriceMad;
    unit = preset.unit;
    convertedFromMad = true;
  } else if (quantity === null || isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ error: "Vous devez fournir soit le montant de la facture en MAD ('bill_amount_mad'), soit la quantité physique consommée ('quantity')." });
  }

  if (!unit) {
    unit = preset.unit;
  }

  // Facteur d'émission
  const factorId = req.body.factor_id || preset.defaultFactorId;
  const factorRow: any = db.prepare('SELECT * FROM emission_factors WHERE id = ?').get(factorId);
  if (!factorRow) {
    return res.status(404).json({ error: `Facteur d'émission introuvable dans le référentiel : ${factorId}` });
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

  const activityLabel = custom_label || `${preset.labelFr} — Ref: ${invoice_ref} (${supplier_name})`;

  try {
    const calcResult = calculateEmission({
      activityLabel,
      quantity,
      unit,
      factor: factorInput,
      activityUncertaintyPct: convertedFromMad ? 0.08 : 0.03, // Incertitude légèrement plus élevée si conversion monétaire
      allowProvisionalScope1: Boolean(preset.allowProvisionalScope1 || req.body.allowProvisionalScope1),
      billAmountMad: bill_amount_mad || undefined,
      billPresetId: preset.presetKey,
      unitPriceMad: effectivePriceMad
    });

    const actId = `act-erp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

    db.prepare(`
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
    `).run(
      actId,
      reporting_period_id,
      site_id,
      orgId,
      preset.category,
      preset.scope,
      preset.scope === 1 ? 1 : 2,
      activityLabel,
      quantity,
      unit,
      factorInput.id,
      factorInput.version || '1.0',
      calcResult.emissionKgCO2e,
      calcResult.emissionTCO2e,
      calcResult.isBiogenic ? 1 : 0,
      calcResult.uncertaintyRelative,
      calcResult.uncertaintyAbsoluteKg,
      JSON.stringify(calcResult.trace),
      invoice_ref,
      supplier_name,
      `Importé automatiquement via connecteur ERP. Date facture: ${invoice_date}.${convertedFromMad ? ` Montant: ${bill_amount_mad} MAD HT au tarif de ${effectivePriceMad} MAD/${unit}.` : ''}`,
      req.user?.id || null,
      now
    );

    // Journaliser dans erp_sync_logs
    const syncLogId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    db.prepare(`
      INSERT INTO erp_sync_logs (
        id, organization_id, api_key_id, source_system, import_type,
        total_records, successful_records, failed_records, total_emissions_tco2e,
        details_json, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, 1, 0, ?, ?, ?)
    `).run(
      syncLogId,
      orgId,
      req.apiKey?.id || null,
      req.apiKey ? `api_key:${req.apiKey.name}` : 'manual_connector',
      'energy_invoice',
      calcResult.emissionTCO2e,
      JSON.stringify({
        activity_id: actId,
        invoice_ref,
        invoice_type,
        supplier_name,
        amount_mad: bill_amount_mad,
        quantity,
        unit,
        emission_t_co2e: calcResult.emissionTCO2e
      }),
      now
    );

    // Déclencher les webhooks
    dispatchWebhookEvent(orgId, 'activity.created', {
      activity_id: actId,
      reporting_period_id,
      invoice_ref,
      emission_t_co2e: calcResult.emissionTCO2e,
      scope: preset.scope
    });

    res.status(201).json({
      success: true,
      activity_id: actId,
      invoice_ref,
      supplier_name,
      reporting_period_id,
      site_id,
      category: preset.category,
      scope: preset.scope,
      quantity,
      unit,
      bill_amount_mad,
      emission_kg_co2e: calcResult.emissionKgCO2e,
      emission_t_co2e: calcResult.emissionTCO2e,
      is_monetary_estimate: convertedFromMad,
      conversion_summary: convertedFromMad
        ? `${bill_amount_mad?.toLocaleString('fr-FR')} MAD ÷ ${effectivePriceMad} MAD/${unit} = ${quantity.toFixed(2)} ${unit}`
        : `${quantity.toFixed(2)} ${unit}`,
      calculation_trace: calcResult.trace,
      created_at: now
    });
  } catch (err: any) {
    res.status(400).json({ error: `Erreur lors du calcul d'émission de la facture : ${err.message}` });
  }
});

/**
 * ----------------------------------------------------------------------
 * 3. IMPORTATION MASSIVE DE FACTURES & DONNÉES D'ACTIVITÉ (bulk-import)
 * Support JSON et simulation dryRun préalable
 * ----------------------------------------------------------------------
 */
integrationsRouter.post('/bulk-import', (req: Request, res: Response) => {
  const orgId = req.organizationId!;
  const reporting_period_id = req.body.reporting_period_id || req.body.periodId;
  const default_site_id = req.body.site_id || req.body.siteId;
  const items: any[] = req.body.items || [];
  const dryRun = Boolean(req.body.dryRun);

  if (!reporting_period_id) {
    return res.status(400).json({ error: "L'identifiant de la période de reporting (reporting_period_id) est obligatoire." });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Le tableau d'éléments 'items' est requis et ne doit pas être vide." });
  }

  if (items.length > 500) {
    return res.status(400).json({ error: "La limite maximale par lot d'importation est de 500 enregistrements." });
  }

  // Vérifier la période
  const period: any = db.prepare('SELECT id, status, name FROM reporting_periods WHERE id = ? AND organization_id = ?').get(reporting_period_id, orgId);
  if (!period) {
    return res.status(404).json({ error: "Exercice de reporting introuvable pour cette entreprise." });
  }
  if (period.status === 'closed') {
    return res.status(403).json({ error: "Impossible d'importer dans un exercice clôturé." });
  }

  // Résoudre le site par défaut
  let fallbackSiteId = default_site_id;
  if (!fallbackSiteId) {
    const headSite: any = db.prepare('SELECT id FROM sites WHERE organization_id = ? ORDER BY created_at ASC LIMIT 1').get(orgId);
    if (!headSite) {
      return res.status(400).json({ error: "Aucun site n'existe pour cette organisation." });
    }
    fallbackSiteId = headSite.id;
  }

  const validItems: any[] = [];
  const duplicateItems: any[] = [];
  const errorItems: any[] = [];
  let totalProjectedTco2e = 0;

  // Pré-chargement des facteurs pour performance
  const factorCache = new Map<string, any>();

  // Étape 1 : Validation et simulation de chaque ligne
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const invoiceRef = item.invoice_ref ? String(item.invoice_ref).trim() : null;

    if (!invoiceRef) {
      errorItems.push({ index: idx, error: "Champ 'invoice_ref' manquant sur la ligne." });
      continue;
    }

    // Vérifier les doublons en base
    const existing = db.prepare(`
      SELECT id, emission_t_co2e FROM activity_records
      WHERE organization_id = ? AND reporting_period_id = ? AND invoice_ref = ? AND status = 'active'
    `).get(orgId, reporting_period_id, invoiceRef);

    if (existing) {
      duplicateItems.push({
        index: idx,
        invoice_ref: invoiceRef,
        existing_record_id: (existing as any).id,
        reason: "Facture déjà comptabilisée (anti-doublon)"
      });
      continue;
    }

    // Vérifier si doublon au sein du même lot (batch)
    if (validItems.some(v => v.invoice_ref === invoiceRef)) {
      duplicateItems.push({
        index: idx,
        invoice_ref: invoiceRef,
        reason: "Doublon présent plusieurs fois dans le même fichier d'importation"
      });
      continue;
    }

    const invoiceType = item.invoice_type || 'electricity_onee_mt';
    const preset = ERP_INVOICE_PRESETS[invoiceType] || ERP_INVOICE_PRESETS['electricity_onee_mt'];
    const unitPrice = item.unit_price_mad ? Number(item.unit_price_mad) : preset.defaultPriceMad;

    let qty = item.quantity !== undefined && item.quantity !== null ? Number(item.quantity) : null;
    let unit = item.unit ? String(item.unit).trim() : preset.unit;
    const amountMad = item.bill_amount_mad !== undefined && item.bill_amount_mad !== null ? Number(item.bill_amount_mad) : null;
    let convertedFromMad = false;

    if ((qty === null || isNaN(qty) || unit === 'MAD') && amountMad !== null && !isNaN(amountMad) && amountMad > 0) {
      qty = amountMad / unitPrice;
      unit = preset.unit;
      convertedFromMad = true;
    }

    if (qty === null || isNaN(qty) || qty <= 0) {
      errorItems.push({ index: idx, invoice_ref: invoiceRef, error: "Montant MAD ou quantité physique invalide ou nulle." });
      continue;
    }

    const factorId = item.factor_id || preset.defaultFactorId;
    let factorRow = factorCache.get(factorId);
    if (!factorRow) {
      factorRow = db.prepare('SELECT * FROM emission_factors WHERE id = ?').get(factorId);
      if (factorRow) factorCache.set(factorId, factorRow);
    }

    if (!factorRow) {
      errorItems.push({ index: idx, invoice_ref: invoiceRef, error: `Facteur d'émission introuvable : ${factorId}` });
      continue;
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

    const label = item.label || `${preset.labelFr} — Ref: ${invoiceRef}`;

    try {
      const calcResult = calculateEmission({
        activityLabel: label,
        quantity: qty,
        unit,
        factor: factorInput,
        activityUncertaintyPct: convertedFromMad ? 0.08 : 0.03,
        allowProvisionalScope1: Boolean(preset.allowProvisionalScope1 || item.allowProvisionalScope1),
        billAmountMad: amountMad || undefined,
        billPresetId: preset.presetKey,
        unitPriceMad: unitPrice
      });

      totalProjectedTco2e += calcResult.emissionTCO2e;

      validItems.push({
        index: idx,
        invoice_ref: invoiceRef,
        supplier_name: item.supplier_name || 'Fournisseur d\'énergie',
        site_id: item.site_id || fallbackSiteId,
        category: preset.category,
        scope: preset.scope,
        label,
        quantity: qty,
        unit,
        bill_amount_mad: amountMad,
        factor_id: factorInput.id,
        factor_version: factorInput.version || '1.0',
        emission_kg_co2e: calcResult.emissionKgCO2e,
        emission_t_co2e: calcResult.emissionTCO2e,
        is_biogenic: calcResult.isBiogenic ? 1 : 0,
        uncertainty_relative: calcResult.uncertaintyRelative,
        uncertainty_absolute_kg: calcResult.uncertaintyAbsoluteKg,
        calculation_trace: calcResult.trace,
        notes: `Import groupé ERP. ${convertedFromMad ? `Montant: ${amountMad} MAD.` : ''}`
      });
    } catch (calcErr: any) {
      errorItems.push({ index: idx, invoice_ref: invoiceRef, error: calcErr.message });
    }
  }

  // Si simulation (dryRun = true) : renvoyer les stats sans persister
  if (dryRun) {
    return res.json({
      dryRun: true,
      total_items: items.length,
      valid_count: validItems.length,
      duplicate_count: duplicateItems.length,
      error_count: errorItems.length,
      projected_total_tco2e: Math.round(totalProjectedTco2e * 1000) / 1000,
      valid_preview: validItems.slice(0, 10),
      duplicates: duplicateItems,
      errors: errorItems
    });
  }

  // Étape 2 : Insertion transactionnelle en base
  const now = new Date().toISOString();
  let insertedCount = 0;

  const insertActivity = db.prepare(`
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

  for (const v of validItems) {
    const actId = `act-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    insertActivity.run(
      actId,
      reporting_period_id,
      v.site_id,
      orgId,
      v.category,
      v.scope,
      v.scope === 1 ? 1 : 2,
      v.label,
      v.quantity,
      v.unit,
      v.factor_id,
      v.factor_version,
      v.emission_kg_co2e,
      v.emission_t_co2e,
      v.is_biogenic,
      v.uncertainty_relative,
      v.uncertainty_absolute_kg,
      JSON.stringify(v.calculation_trace),
      v.invoice_ref,
      v.supplier_name,
      v.notes,
      req.user?.id || null,
      now
    );
    insertedCount++;
  }

  // Journalisation dans erp_sync_logs
  const syncLogId = `sync-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  db.prepare(`
    INSERT INTO erp_sync_logs (
      id, organization_id, api_key_id, source_system, import_type,
      total_records, successful_records, failed_records, total_emissions_tco2e,
      details_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    syncLogId,
    orgId,
    req.apiKey?.id || null,
    req.apiKey ? `api_key:${req.apiKey.name}` : 'bulk_file_upload',
    'bulk_import',
    items.length,
    insertedCount,
    errorItems.length + duplicateItems.length,
    totalProjectedTco2e,
    JSON.stringify({
      inserted: insertedCount,
      duplicates: duplicateItems.length,
      errors: errorItems.length
    }),
    now
  );

  // Déclencher un webhook récapitulatif
  dispatchWebhookEvent(orgId, 'bulk_import.completed', {
    total: items.length,
    imported: insertedCount,
    duplicates: duplicateItems.length,
    total_tco2e: totalProjectedTco2e
  });

  res.status(201).json({
    dryRun: false,
    success: true,
    total_records: items.length,
    imported_count: insertedCount,
    duplicate_count: duplicateItems.length,
    error_count: errorItems.length,
    total_emissions_tco2e: Math.round(totalProjectedTco2e * 1000) / 1000,
    duplicates: duplicateItems,
    errors: errorItems,
    created_at: now
  });
});

/**
 * ----------------------------------------------------------------------
 * 4. JOURNAL D'AUDIT ET D'INGESTION ERP (erp_sync_logs)
 * ----------------------------------------------------------------------
 */
integrationsRouter.get('/logs', (req: Request, res: Response) => {
  const orgId = req.organizationId!;
  const logs: any[] = db.prepare(`
    SELECT l.*, k.name as api_key_name, k.key_prefix
    FROM erp_sync_logs l
    LEFT JOIN api_keys k ON l.api_key_id = k.id
    WHERE l.organization_id = ?
    ORDER BY l.created_at DESC
    LIMIT 50
  `).all(orgId);

  res.json({ logs });
});

/**
 * ----------------------------------------------------------------------
 * 5. WEBHOOKS SORTANTS POUR SYSTÈMES TIERS & ERP
 * ----------------------------------------------------------------------
 */
integrationsRouter.get('/webhooks', (req: Request, res: Response) => {
  const orgId = req.organizationId!;
  const webhooks: any[] = db.prepare(`
    SELECT id, name, url, subscribed_events, is_active, last_triggered_at, created_at
    FROM webhooks
    WHERE organization_id = ?
    ORDER BY created_at DESC
  `).all(orgId);

  res.json({ webhooks });
});

integrationsRouter.post('/webhooks', (req: Request, res: Response) => {
  const orgId = req.organizationId!;
  const { name, url, subscribed_events = ['activity.created', 'period.closed', 'cbam.dossier_created'] } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: "Le nom et l'URL cible HTTPS du webhook sont obligatoires." });
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.status(400).json({ error: "L'URL du webhook doit débuter par https:// ou http://" });
  }

  const webhookId = `wh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const secretKey = `whsec_${crypto.randomBytes(24).toString('hex')}`;
  const now = new Date().toISOString();
  const eventsJson = JSON.stringify(Array.isArray(subscribed_events) ? subscribed_events : [subscribed_events]);

  db.prepare(`
    INSERT INTO webhooks (id, organization_id, name, url, secret_key, subscribed_events, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).run(webhookId, orgId, name.trim(), url.trim(), secretKey, eventsJson, now);

  res.status(201).json({
    id: webhookId,
    name: name.trim(),
    url: url.trim(),
    secret_key: secretKey,
    subscribed_events: Array.isArray(subscribed_events) ? subscribed_events : [subscribed_events],
    created_at: now,
    message: "Webhook configuré avec succès. Utilisez la clé secrète pour vérifier l'en-tête X-Atlas-Signature (HMAC-SHA256)."
  });
});

integrationsRouter.delete('/webhooks/:webhookId', (req: Request, res: Response) => {
  const orgId = req.organizationId!;
  const { webhookId } = req.params;

  db.prepare('DELETE FROM webhooks WHERE id = ? AND organization_id = ?').run(webhookId, orgId);
  res.json({ success: true, message: "Webhook supprimé avec succès." });
});

integrationsRouter.post('/webhooks/:webhookId/test', async (req: Request, res: Response) => {
  const orgId = req.organizationId!;
  const { webhookId } = req.params;

  const hook: any = db.prepare('SELECT * FROM webhooks WHERE id = ? AND organization_id = ?').get(webhookId, orgId);
  if (!hook) {
    return res.status(404).json({ error: "Webhook introuvable." });
  }

  const testPayload = {
    id: `evt-test-${Date.now()}`,
    event: 'ping',
    timestamp: new Date().toISOString(),
    organization_id: orgId,
    message: "Test de connectivité Atlas Carbone Webhook"
  };

  const bodyStr = JSON.stringify(testPayload);
  const signature = crypto.createHmac('sha256', hook.secret_key).update(bodyStr).digest('hex');

  try {
    const response = await fetch(hook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Atlas-Signature': signature,
        'X-Atlas-Event': 'ping'
      },
      body: bodyStr,
      signal: AbortSignal.timeout(5000)
    });

    db.prepare('UPDATE webhooks SET last_triggered_at = ? WHERE id = ?').run(new Date().toISOString(), hook.id);

    res.json({
      success: true,
      statusCode: response.status,
      statusText: response.statusText,
      signatureSent: signature,
      message: `Ping envoyé avec succès à ${hook.url} (Code HTTP ${response.status})`
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: `Échec d'envoi du webhook vers ${hook.url} : ${err.message}`
    });
  }
});
