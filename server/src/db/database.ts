/**
 * Atlas Carbone - Couche Base de Données Relationnelle (SQLite en mode WAL)
 * Utilise le module natif haute-performance node:sqlite de Node.js 22
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'atlas_carbone.db');
export const db = new DatabaseSync(DB_PATH);

// Configuration des pragmas pour l'intégrité relationnelle et les performances
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialisation du schéma relationnel complet
 */
export function initDatabaseSchema() {
  db.exec(`
    -- 1. Utilisateurs
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      is_superadmin INTEGER DEFAULT 0,
      mfa_secret TEXT,
      created_at TEXT NOT NULL
    );

    -- 2. Entreprises (Tenants)
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      legal_type TEXT,
      ice TEXT,
      city TEXT,
      sector TEXT,
      logo_url TEXT,
      onboarding_step INTEGER DEFAULT 1,
      onboarding_completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- 3. Adhésions et Rôles RBAC
    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      role TEXT NOT NULL, -- 'admin', 'carbon_manager', 'site_manager', 'contributor', 'auditor', 'commercial'
      created_at TEXT NOT NULL,
      UNIQUE(user_id, organization_id)
    );

    -- 4. Sites opérationnels
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT,
      manager_user_id TEXT REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    -- 5. Exercices de reporting (Inventaires GES)
    CREATE TABLE IF NOT EXISTS reporting_periods (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      consolidation_approach TEXT NOT NULL DEFAULT 'operational_control', -- 'operational_control', 'financial_control', 'equity_share'
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'collection', 'in_review', 'corrections_requested', 'validated', 'closed'
      closed_at TEXT,
      closed_by TEXT REFERENCES users(id),
      snapshot_json TEXT,
      revenue_mad REAL DEFAULT 0,
      employee_count INTEGER DEFAULT 0,
      production_units REAL DEFAULT 0,
      production_unit_name TEXT DEFAULT 'unités',
      created_at TEXT NOT NULL
    );

    -- 6. Catalogue de facteurs d'émission versionné
    CREATE TABLE IF NOT EXISTS emission_factors (
      id TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0',
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      scope INTEGER NOT NULL,
      iso_category INTEGER NOT NULL,
      ghg_category TEXT NOT NULL,
      value REAL NOT NULL,
      numerator_unit TEXT NOT NULL,
      denominator_unit TEXT NOT NULL,
      raw_unit TEXT,
      perimeter TEXT NOT NULL,
      geography TEXT NOT NULL,
      reference_year INTEGER NOT NULL,
      source TEXT NOT NULL,
      sheet_origin TEXT,
      row_origin INTEGER,
      uncertainty_pct REAL DEFAULT 0.20,
      status TEXT NOT NULL DEFAULT 'validated', -- 'extracted', 'to_verify', 'validated', 'rejected', 'archived'
      verification_note TEXT,
      access_level TEXT NOT NULL DEFAULT 'common_catalog', -- 'common_catalog', 'organization_private'
      organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (id, version)
    );

    -- 7. Données d'activité et calculs GES enregistrés
    CREATE TABLE IF NOT EXISTS activity_records (
      id TEXT PRIMARY KEY,
      reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
      site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      scope INTEGER NOT NULL,
      iso_category INTEGER NOT NULL,
      label TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      factor_id TEXT NOT NULL,
      factor_version TEXT NOT NULL DEFAULT '1.0',
      emission_kg_co2e REAL NOT NULL,
      emission_t_co2e REAL NOT NULL,
      is_biogenic INTEGER DEFAULT 0,
      uncertainty_relative REAL,
      uncertainty_absolute_kg REAL,
      calculation_trace_json TEXT NOT NULL,
      invoice_ref TEXT,
      supplier_name TEXT,
      evidence_url TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'excluded'
      exclusion_reason TEXT,
      notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    -- 8. Actions de réduction (Plan de transition)
    CREATE TABLE IF NOT EXISTS reduction_actions (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      reporting_period_id TEXT REFERENCES reporting_periods(id),
      site_id TEXT REFERENCES sites(id),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      responsible TEXT,
      cost_mad REAL DEFAULT 0,
      annual_savings_tco2e REAL DEFAULT 0,
      target_year INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'proposed', -- 'proposed', 'in_progress', 'completed', 'cancelled'
      created_at TEXT NOT NULL
    );

    -- 9. Module MACF / CBAM : Installations & Procédés
    CREATE TABLE IF NOT EXISTS cbam_installations (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      unlocode TEXT,
      coordinates TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cbam_products (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      installation_id TEXT NOT NULL REFERENCES cbam_installations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      cn_code TEXT NOT NULL,
      sector TEXT NOT NULL,
      annual_production_tonnes REAL NOT NULL,
      annual_export_eu_tonnes REAL DEFAULT 0,
      specific_direct_emissions REAL DEFAULT 0,
      specific_indirect_emissions REAL DEFAULT 0,
      specific_total_emissions REAL DEFAULT 0,
      precursors_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cbam_importer_dossiers (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      cbam_product_id TEXT NOT NULL REFERENCES cbam_products(id) ON DELETE CASCADE,
      importer_name TEXT NOT NULL,
      importer_country TEXT NOT NULL,
      importer_eori TEXT,
      reference_period TEXT NOT NULL,
      dossier_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 10. Devis, Abonnements & Facturation
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      quote_number TEXT UNIQUE NOT NULL,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      plan_name TEXT NOT NULL,
      base_amount_mad REAL NOT NULL,
      extra_sites_count INTEGER DEFAULT 0,
      extra_users_count INTEGER DEFAULT 0,
      discount_mad REAL DEFAULT 0,
      tva_rate REAL DEFAULT 0.20,
      tva_amount_mad REAL NOT NULL,
      total_ttc_mad REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
      valid_until TEXT NOT NULL,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      organization_id TEXT UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      plan_name TEXT NOT NULL DEFAULT 'essentiel', -- 'essentiel', 'entreprise', 'export_europe'
      status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'expired', 'cancelled'
      sites_limit INTEGER NOT NULL DEFAULT 2,
      users_limit INTEGER NOT NULL DEFAULT 3,
      cbam_access INTEGER NOT NULL DEFAULT 0,
      current_period_end TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 11. Piste d'audit immuable
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    -- 12. Demandes de contact et Leads
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT NOT NULL,
      sector TEXT,
      message TEXT,
      utm_source TEXT,
      created_at TEXT NOT NULL
    );

    -- 13. Notifications et Boîte d'envoi locale
    CREATE TABLE IF NOT EXISTS dev_notifications (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      template_name TEXT NOT NULL,
      content_html TEXT NOT NULL,
      sent_at TEXT NOT NULL
    );

    -- 14. Sessions d'essai sans compte (Essayer sans compte)
    CREATE TABLE IF NOT EXISTS guest_sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      sector TEXT NOT NULL,
      activities_json TEXT NOT NULL DEFAULT '[]',
      unquantified_json TEXT NOT NULL DEFAULT '[]',
      summary_json TEXT,
      expires_at TEXT NOT NULL,
      claimed_at TEXT,
      claimed_by_org_id TEXT REFERENCES organizations(id),
      created_at TEXT NOT NULL
    );

    -- 15. Postes identifiés, non quantifiés (facteur manquant ou indisponible)
    CREATE TABLE IF NOT EXISTS unquantified_activities (
      id TEXT PRIMARY KEY,
      reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      site_id TEXT REFERENCES sites(id),
      category TEXT NOT NULL,
      label TEXT NOT NULL,
      reason TEXT NOT NULL, -- 'facteur_manquant', 'donnee_non_disponible', 'en_attente_tiers'
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- 16. Cycle de revue et gouvernance des dossiers
    CREATE TABLE IF NOT EXISTS dossier_reviews (
      id TEXT PRIMARY KEY,
      reporting_period_id TEXT NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
      reviewer_id TEXT REFERENCES users(id),
      reviewer_name TEXT NOT NULL,
      status TEXT NOT NULL, -- 'draft', 'to_complete', 'ready_for_review', 'reviewed_internal', 'locked'
      comment TEXT,
      created_at TEXT NOT NULL
    );

    -- 17. Guides méthodologiques originaux (SEO & Pédagogie)
    CREATE TABLE IF NOT EXISTS guides (
      id TEXT PRIMARY KEY,
      slug_fr TEXT UNIQUE NOT NULL,
      slug_en TEXT UNIQUE NOT NULL,
      title_fr TEXT NOT NULL,
      title_en TEXT NOT NULL,
      summary_fr TEXT NOT NULL,
      summary_en TEXT NOT NULL,
      content_fr TEXT NOT NULL,
      content_en TEXT NOT NULL,
      category TEXT NOT NULL,
      reading_time_minutes INTEGER DEFAULT 5,
      created_at TEXT NOT NULL
    );

    -- 18. Actualités et veille réglementaire
    CREATE TABLE IF NOT EXISTS news_articles (
      id TEXT PRIMARY KEY,
      slug_fr TEXT UNIQUE NOT NULL,
      slug_en TEXT UNIQUE NOT NULL,
      title_fr TEXT NOT NULL,
      title_en TEXT NOT NULL,
      excerpt_fr TEXT NOT NULL,
      excerpt_en TEXT NOT NULL,
      content_fr TEXT NOT NULL,
      content_en TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published', 'archived'
      author TEXT NOT NULL DEFAULT 'Abdelaziz Motiaa',
      sources_json TEXT,
      published_at TEXT NOT NULL,
      updated_at TEXT,
      created_at TEXT NOT NULL
    );

    -- 19. Newsletter avec double opt-in & désinscription
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      lang TEXT NOT NULL DEFAULT 'fr',
      status TEXT NOT NULL DEFAULT 'pending_confirmation', -- 'pending_confirmation', 'confirmed', 'unsubscribed', 'suppressed'
      confirmation_token TEXT UNIQUE NOT NULL,
      confirmed_at TEXT,
      unsubscribed_at TEXT,
      consent_proof_ip TEXT,
      created_at TEXT NOT NULL
    );

    -- 20. Modules pédagogiques de l'Académie Bilan Carbone
    CREATE TABLE IF NOT EXISTS academy_modules (
      id TEXT PRIMARY KEY,
      module_number INTEGER NOT NULL,
      title_fr TEXT NOT NULL,
      title_en TEXT NOT NULL,
      summary_fr TEXT NOT NULL,
      summary_en TEXT NOT NULL,
      content_fr TEXT NOT NULL,
      content_en TEXT NOT NULL,
      example_fr TEXT NOT NULL,
      example_en TEXT NOT NULL,
      quiz_question_fr TEXT NOT NULL,
      quiz_question_en TEXT NOT NULL,
      quiz_options_fr TEXT NOT NULL, -- JSON
      quiz_options_en TEXT NOT NULL, -- JSON
      quiz_correct_index INTEGER NOT NULL,
      quiz_explanation_fr TEXT NOT NULL,
      quiz_explanation_en TEXT NOT NULL,
      action_link TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 20. Commandes et Souscriptions en Dirhams Marocains (MAD)
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      organization_id TEXT,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT,
      ice_number TEXT,
      city TEXT,
      plan_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      billing_cycle TEXT NOT NULL DEFAULT 'annual', -- 'annual', 'monthly'
      amount_ht_mad REAL NOT NULL,
      tva_rate REAL DEFAULT 0.20,
      tva_amount_mad REAL NOT NULL,
      total_ttc_mad REAL NOT NULL,
      payment_method TEXT NOT NULL, -- 'cmi_card', 'bank_transfer', 'quote'
      payment_status TEXT NOT NULL DEFAULT 'pending', -- 'paid', 'pending', 'cancelled'
      payment_reference TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- 21. Pièces justificatives et preuves de factures d'activité
    CREATE TABLE IF NOT EXISTS activity_evidences (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL REFERENCES activity_records(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      invoice_ref TEXT,
      invoice_date TEXT,
      uploaded_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    -- Index d'optimisation
    CREATE INDEX IF NOT EXISTS idx_activity_records_period ON activity_records(reporting_period_id);
    CREATE INDEX IF NOT EXISTS idx_activity_records_org ON activity_records(organization_id);
    CREATE INDEX IF NOT EXISTS idx_activity_evidences_act ON activity_evidences(activity_id);
    CREATE INDEX IF NOT EXISTS idx_activity_evidences_org ON activity_evidences(organization_id);
    CREATE INDEX IF NOT EXISTS idx_emission_factors_scope ON emission_factors(scope);
    CREATE INDEX IF NOT EXISTS idx_emission_factors_cat ON emission_factors(category);
    CREATE INDEX IF NOT EXISTS idx_cbam_products_org ON cbam_products(organization_id);
    CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_events(organization_id);
    CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions(session_token);
    CREATE INDEX IF NOT EXISTS idx_news_status ON news_articles(status);
    CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
  `);

  // Migrations douces pour bases de données existantes
  const safeAddCol = (table: string, columnDef: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
    } catch (_) {
      // Colonne déjà existante
    }
  };

  safeAddCol('organizations', 'onboarding_step INTEGER DEFAULT 1');
  safeAddCol('organizations', 'onboarding_completed INTEGER DEFAULT 0');
  safeAddCol('reporting_periods', 'revenue_mad REAL DEFAULT 0');
  safeAddCol('reporting_periods', 'employee_count INTEGER DEFAULT 0');
  safeAddCol('reporting_periods', 'production_units REAL DEFAULT 0');
  safeAddCol('reporting_periods', "production_unit_name TEXT DEFAULT 'unités'");
  safeAddCol('activity_records', 'evidence_file_name TEXT');
  safeAddCol('activity_records', 'evidence_file_path TEXT');
  safeAddCol('activity_records', 'evidence_file_size INTEGER');
  safeAddCol('activity_records', 'evidence_uploaded_at TEXT');
}
