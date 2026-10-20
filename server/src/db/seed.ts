/**
 * Atlas Carbone - Script de Seeding de la Base de Données
 * Initialise le catalogue de facteurs, les utilisateurs types, 3 entreprises isolées et les jeux d'essai.
 */

import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { db, initDatabaseSchema } from './database.js';
import { calculateEmission, calculateCBAMSpecificEmbeddedEmissions, EmissionFactorInput } from '../core/calculations.js';

export function runSeeds() {
  console.log("--> Initialisation du schéma de la base de données...");
  initDatabaseSchema();

  // 1. Charger le catalogue de facteurs d'émissions
  const factorCountStmt = db.prepare('SELECT COUNT(*) as count FROM emission_factors');
  const factorCountRow: any = factorCountStmt.get();

  if (factorCountRow.count === 0) {
    const possiblePaths = [
      path.resolve(process.cwd(), 'data/catalog_seed.json'),
      path.resolve(process.cwd(), '../data/catalog_seed.json'),
      path.resolve('/home/abdelaziz/Desktop/PhD/analysis/atlas-carbone/data/catalog_seed.json')
    ];
    let catalogPath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        catalogPath = p;
        break;
      }
    }

    if (catalogPath) {
      console.log(`--> Chargement du catalogue de facteurs d'émissions depuis ${catalogPath}...`);
      const factors: any[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO emission_factors (
          id, version, name, category, scope, iso_category, ghg_category,
          value, numerator_unit, denominator_unit, raw_unit, perimeter,
          geography, reference_year, source, sheet_origin, row_origin,
          uncertainty_pct, status, verification_note, access_level, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
      `);

      for (const f of factors) {
        insertStmt.run(
          f.id, f.version, f.name, f.category, f.scope, f.iso_category, f.ghg_category,
          f.value, f.numerator_unit, f.denominator_unit, f.raw_unit || null, f.perimeter,
          f.geography, f.reference_year, f.source, f.sheet_origin || null, f.row_origin || null,
          f.uncertainty_pct || 0.20, f.status || 'validated', f.verification_note || null,
          f.access_level || 'common_catalog', new Date().toISOString()
        );
      }
      console.log(`✅ ${factors.length} facteurs d'émissions insérés avec succès.`);
    }
  }

  // 2. Utilisateurs de démonstration
  const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const userCountRow: any = userCountStmt.get();

  if (userCountRow.count === 0) {
    console.log("--> Création des utilisateurs et des entreprises de démonstration...");
    const salt = bcrypt.genSaltSync(10);
    const hash = (pwd: string) => bcrypt.hashSync(pwd, salt);

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, is_superadmin, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const users = [
      { id: 'usr-superadmin', email: 'superadmin@atlascarbone.ma', pwd: hash('AtlasSuperAdmin2026!'), name: 'Dr. Karim Benjelloun', super: 1 },
      { id: 'usr-commercial', email: 'commercial@atlascarbone.ma', pwd: hash('AtlasCommercial2026!'), name: 'Yasmine Mansouri', super: 0 },
      { id: 'usr-admin-agro', email: 'admin@agro-atlas.ma', pwd: hash('AgroAtlas2026!'), name: 'Tariq El Alami (DG Agro)', super: 0 },
      { id: 'usr-carbone-agro', email: 'carbone@agro-atlas.ma', pwd: hash('CarboneAtlas2026!'), name: 'Salma Berrada (Resp. RSE)', super: 0 },
      { id: 'usr-site-agadir', email: 'site.agadir@agro-atlas.ma', pwd: hash('SiteAgadir2026!'), name: 'Omar Kabbaj (Dir. Agadir)', super: 0 },
      { id: 'usr-auditeur', email: 'auditeur@verifcarbone.ma', pwd: hash('Auditeur2026!'), name: 'Gilles Morvan (Auditeur Tiers)', super: 0 },
      { id: 'usr-admin-plast', email: 'admin@plasturgie-nord.ma', pwd: hash('Plasturgie2026!'), name: 'Fatima Zahra Tazi', super: 0 },
      { id: 'usr-export-metal', email: 'export@metal-oriental.ma', pwd: hash('MetalExport2026!'), name: 'Mehdi Chraibi (Dir. Usine MACF)', super: 0 }
    ];

    for (const u of users) {
      insertUser.run(u.id, u.email, u.pwd, u.name, u.super, new Date().toISOString());
    }

    // 3. Entreprises isolées
    const insertOrg = db.prepare(`
      INSERT INTO organizations (id, name, legal_type, ice, city, sector, logo_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrg.run('org-agro-atlas', 'Atlas Agro-Alimentaire SARL', 'SARL', '001234567000089', 'Casablanca', 'Industrie agroalimentaire', null, new Date().toISOString());
    insertOrg.run('org-plasturgie-nord', 'Plasturgie du Nord SA', 'SA', '009876543000012', 'Tanger', 'Plasturgie et emballages techniques', null, new Date().toISOString());
    insertOrg.run('org-metal-oriental', 'Métallurgie & Tréfilerie de l Oriental SA', 'SA', '005544332000077', 'Nador', 'Sidérurgie et métaux de base (MACF)', null, new Date().toISOString());

    // 4. Adhésions et rôles RBAC
    const insertMembership = db.prepare(`
      INSERT INTO memberships (id, user_id, organization_id, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertMembership.run('mem-1', 'usr-admin-agro', 'org-agro-atlas', 'admin', new Date().toISOString());
    insertMembership.run('mem-2', 'usr-carbone-agro', 'org-agro-atlas', 'carbon_manager', new Date().toISOString());
    insertMembership.run('mem-3', 'usr-site-agadir', 'org-agro-atlas', 'site_manager', new Date().toISOString());
    insertMembership.run('mem-4', 'usr-auditeur', 'org-agro-atlas', 'auditor', new Date().toISOString());

    insertMembership.run('mem-5', 'usr-admin-plast', 'org-plasturgie-nord', 'admin', new Date().toISOString());
    insertMembership.run('mem-6', 'usr-commercial', 'org-agro-atlas', 'commercial', new Date().toISOString());

    insertMembership.run('mem-7', 'usr-export-metal', 'org-metal-oriental', 'admin', new Date().toISOString());

    // 5. Sites pour Org 1
    const insertSite = db.prepare(`
      INSERT INTO sites (id, organization_id, name, city, address, manager_user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertSite.run('site-casa-siege', 'org-agro-atlas', 'Siège & Usine Casablanca', 'Casablanca', 'Zone Industrielle Sidi Bernoussi, Allée des Potiers', 'usr-admin-agro', new Date().toISOString());
    insertSite.run('site-agadir-cond', 'org-agro-atlas', 'Entrepôt & Conditionnement Agadir', 'Agadir', 'Parc Industriel d Anza', 'usr-site-agadir', new Date().toISOString());

    // Sites pour Org 2 & 3
    insertSite.run('site-tanger-freezone', 'org-plasturgie-nord', 'Usine Tanger Free Zone', 'Tanger', 'Ilot 12, TFZ Aéroport', 'usr-admin-plast', new Date().toISOString());
    insertSite.run('site-nador-metal', 'org-metal-oriental', 'Complexe Industriel Nador Port', 'Nador', 'Zone Industrielle Selouane', 'usr-export-metal', new Date().toISOString());

    // 6. Exercices de reporting
    const insertPeriod = db.prepare(`
      INSERT INTO reporting_periods (id, organization_id, name, year, start_date, end_date, consolidation_approach, status, closed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPeriod.run(
      'per-agro-2025', 'org-agro-atlas', 'Bilan GES 2025 (Exercice Clôturé)', 2025,
      '2025-01-01', '2025-12-31', 'operational_control', 'closed',
      '2026-02-15T14:30:00Z', new Date().toISOString()
    );

    insertPeriod.run(
      'per-agro-2026', 'org-agro-atlas', 'Bilan GES 2026 (En cours de collecte)', 2026,
      '2026-01-01', '2026-12-31', 'operational_control', 'collection',
      null, new Date().toISOString()
    );

    insertPeriod.run(
      'per-plast-2025', 'org-plasturgie-nord', 'Exercice 2025 Initial', 2025,
      '2025-01-01', '2025-12-31', 'operational_control', 'draft',
      null, new Date().toISOString()
    );

    // 7. Données d'activité pour Org 1 (Exercice 2025)
    console.log("--> Calcul et insertion des activités réelles pour l'exercice démo...");
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
        ?, ?, ?, ?, ?, ?
      )
    `);

    // Helper pour récupérer un facteur
    const getFactorById = (factorId: string) => {
      const q = db.prepare('SELECT * FROM emission_factors WHERE id = ? LIMIT 1');
      const row: any = q.get(factorId);
      if (!row) {
        throw new Error(`Facteur introuvable par ID: ${factorId}`);
      }
      return {
        id: row.id,
        name: row.name,
        value: row.value,
        numeratorUnit: row.numerator_unit,
        denominatorUnit: row.denominator_unit,
        scope: row.scope,
        perimeter: row.perimeter,
        isAlreadyCO2e: true,
        uncertaintyPct: row.uncertainty_pct,
        source: row.source
      } as EmissionFactorInput;
    };

    const feGazNaturel = getFactorById('FE-MA-0011'); // Gaz Naturel, amont et combustion (0.256 kWh)
    const feDiesel = getFactorById('FE-MA-0029'); // Diesel Pompe (3.056 litre)
    const feR410A = getFactorById('FE-MA-0104'); // R410A (2088 kg)
    const feCarton = getFactorById('FE-MA-0221'); // Carton neuf ou recyclé (1063 t)
    const feFret = getFactorById('FE-MA-0376'); // Fret ferroviaire / routier (0.03574 t.km)
    
    // Récupérer le facteur électrique Location-based
    const qElec = db.prepare("SELECT * FROM emission_factors WHERE category = 'electricite_reseau' AND perimeter = 'production_electrique' LIMIT 1");
    const rowElec: any = qElec.get();
    const feElecNet: EmissionFactorInput = {
      id: rowElec.id,
      name: rowElec.name,
      value: rowElec.value,
      numeratorUnit: rowElec.numerator_unit,
      denominatorUnit: rowElec.denominator_unit,
      scope: rowElec.scope,
      perimeter: rowElec.perimeter,
      isAlreadyCO2e: true,
      uncertaintyPct: rowElec.uncertainty_pct,
      source: rowElec.source
    };

    // Activité 1 : Gaz naturel chaudière (Casablanca)
    const res1 = calculateEmission({
      activityLabel: 'Gaz naturel chaudière vapeur Casa',
      quantity: 180000,
      unit: 'kWh',
      factor: { ...feGazNaturel, perimeter: 'combustion' }, // décomposé pour Scope 1
      activityUncertaintyPct: 0.05
    });
    insertActivity.run(
      'act-1', 'per-agro-2025', 'site-casa-siege', 'org-agro-atlas', 'combustion_fixe', 1, 1,
      'Gaz naturel chaudière vapeur Casa', 180000, 'kWh', feGazNaturel.id, '1.0',
      res1.emissionKgCO2e, res1.emissionTCO2e, 0, res1.uncertaintyRelative, res1.uncertaintyAbsoluteKg,
      JSON.stringify(res1.trace), 'FAC-AFRIQUIA-2025-10', 'Afriquia Gaz', 'active', 'Relevé mensuel compteur gaz', 'usr-admin-agro', new Date().toISOString()
    );

    // Activité 2 : Flotte commerciale diesel (Casablanca & Agadir)
    const res2 = calculateEmission({
      activityLabel: 'Carburant diesel véhicules utilitaires',
      quantity: 24000,
      unit: 'litre',
      factor: feDiesel,
      activityUncertaintyPct: 0.05
    });
    insertActivity.run(
      'act-2', 'per-agro-2025', 'site-casa-siege', 'org-agro-atlas', 'combustion_mobile', 1, 1,
      'Carburant diesel véhicules utilitaires', 24000, 'litre', feDiesel.id, '1.0',
      res2.emissionKgCO2e, res2.emissionTCO2e, 0, res2.uncertaintyRelative, res2.uncertaintyAbsoluteKg,
      JSON.stringify(res2.trace), 'RECAP-TOTAL-CARBURANT-2025', 'TotalEnergies Maroc', 'active', 'Cartes carburant flotte 12 camionnettes', 'usr-admin-agro', new Date().toISOString()
    );

    // Activité 3 : Climatisation et fuites R-410A (Agadir)
    const res3 = calculateEmission({
      activityLabel: 'Recharge fluide frigorigène chambre froide Agadir',
      quantity: 45,
      unit: 'kg',
      factor: feR410A,
      activityUncertaintyPct: 0.10
    });
    insertActivity.run(
      'act-3', 'per-agro-2025', 'site-agadir-cond', 'org-agro-atlas', 'emissions_fugitives', 1, 1,
      'Recharge fluide frigorigène chambre froide Agadir', 45, 'kg', feR410A.id, '1.0',
      res3.emissionKgCO2e, res3.emissionTCO2e, 0, res3.uncertaintyRelative, res3.uncertaintyAbsoluteKg,
      JSON.stringify(res3.trace), 'BON-INTERV-FROID-2025-08', 'Souss Climatisation SARL', 'active', 'Bordereau de recharge suite à maintenance', 'usr-site-agadir', new Date().toISOString()
    );

    // Activité 4 : Électricité réseau Casablanca (Location-based)
    const res4 = calculateEmission({
      activityLabel: 'Électricité moyenne tension usine Casablanca',
      quantity: 520000,
      unit: 'kWh',
      factor: feElecNet,
      activityUncertaintyPct: 0.02
    });
    insertActivity.run(
      'act-4', 'per-agro-2025', 'site-casa-siege', 'org-agro-atlas', 'electricite_reseau', 2, 2,
      'Électricité moyenne tension usine Casablanca', 520000, 'kWh', feElecNet.id, '1.0',
      res4.emissionKgCO2e, res4.emissionTCO2e, 0, res4.uncertaintyRelative, res4.uncertaintyAbsoluteKg,
      JSON.stringify(res4.trace), 'FACT-ONEE-ANNUEL-2025', 'ONEE Branche Électricité', 'active', 'Factures mensuelles MT 22kV', 'usr-admin-agro', new Date().toISOString()
    );

    // Activité 5 : Électricité réseau Agadir
    const res5 = calculateEmission({
      activityLabel: 'Électricité entrepôt frigorifique Agadir',
      quantity: 180000,
      unit: 'kWh',
      factor: feElecNet,
      activityUncertaintyPct: 0.02
    });
    insertActivity.run(
      'act-5', 'per-agro-2025', 'site-agadir-cond', 'org-agro-atlas', 'electricite_reseau', 2, 2,
      'Électricité entrepôt frigorifique Agadir', 180000, 'kWh', feElecNet.id, '1.0',
      res5.emissionKgCO2e, res5.emissionTCO2e, 0, res5.uncertaintyRelative, res5.uncertaintyAbsoluteKg,
      JSON.stringify(res5.trace), 'FACT-RAMSA-AGADIR-2025', 'RAMSA', 'active', 'Compteur basse tension force', 'usr-site-agadir', new Date().toISOString()
    );

    // Activité 6 : Cartons d'emballage Scope 3 Cat 1
    const res6 = calculateEmission({
      activityLabel: 'Cartons ondulés d expédition',
      quantity: 85,
      unit: 'tonne',
      factor: feCarton,
      activityUncertaintyPct: 0.15
    });
    insertActivity.run(
      'act-6', 'per-agro-2025', 'site-casa-siege', 'org-agro-atlas', 'achats_biens_services', 3, 4,
      'Cartons ondulés d expédition', 85, 'tonne', feCarton.id, '1.0',
      res6.emissionKgCO2e, res6.emissionTCO2e, 0, res6.uncertaintyRelative, res6.uncertaintyAbsoluteKg,
      JSON.stringify(res6.trace), 'ACHAT-CARTONNAGES-2025', 'GPC Carton', 'active', 'Bordereaux de pesée récapitulatifs', 'usr-admin-agro', new Date().toISOString()
    );

    // Activité 7 : Fret routier aval
    const res7 = calculateEmission({
      activityLabel: 'Fret ferroviaire distribution nationale',
      quantity: 350000, // tonne.km
      unit: 'tonne-km',
      factor: feFret,
      activityUncertaintyPct: 0.20
    });
    insertActivity.run(
      'act-7', 'per-agro-2025', 'site-casa-siege', 'org-agro-atlas', 'fret_marchandises_aval', 3, 3,
      'Fret ferroviaire distribution nationale', 350000, 'tonne-km', feFret.id, '1.0',
      res7.emissionKgCO2e, res7.emissionTCO2e, 0, res7.uncertaintyRelative, res7.uncertaintyAbsoluteKg,
      JSON.stringify(res7.trace), 'CONTRAT-LOGISTIQUE-ONCF-2025', 'ONCF Fret', 'active', 'Rapport annuel tonne-kilomètre', 'usr-admin-agro', new Date().toISOString()
    );

    // 8. Actions du plan de réduction pour Org 1
    const insertAction = db.prepare(`
      INSERT INTO reduction_actions (
        id, organization_id, reporting_period_id, site_id, title, category,
        responsible, cost_mad, annual_savings_tco2e, target_year, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAction.run(
      'act-red-1', 'org-agro-atlas', 'per-agro-2025', 'site-casa-siege',
      'Installation toiture solaire photovoltaïque 150 kWc', 'Énergie renouvelable',
      'Tariq El Alami', 1250000, 140.5, 2026, 'in_progress', new Date().toISOString()
    );

    insertAction.run(
      'act-red-2', 'org-agro-atlas', 'per-agro-2025', 'site-agadir-cond',
      'Remplacement groupes froids R-410A par solution basse GWP (R-290 Propane)', 'Fluides frigorigènes',
      'Omar Kabbaj', 480000, 95.0, 2027, 'proposed', new Date().toISOString()
    );

    insertAction.run(
      'act-red-3', 'org-agro-atlas', 'per-agro-2025', 'site-casa-siege',
      'Formation écoconduite et optimisation des tournées de livraison', 'Logistique',
      'Salma Berrada', 65000, 28.0, 2026, 'completed', new Date().toISOString()
    );

    // 9. Module MACF / CBAM pour Org 3 (Métallurgie)
    console.log("--> Initialisation du module exportateur MACF / CBAM...");
    const insertCbamInst = db.prepare(`
      INSERT INTO cbam_installations (id, organization_id, name, city, unlocode, coordinates, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertCbamInst.run(
      'inst-nador-1', 'org-metal-oriental', 'Aciérie & Laminoir Selouane Nador', 'Nador',
      'MA NDR', '35.0805° N, 2.9312° W', new Date().toISOString()
    );

    const insertCbamProduct = db.prepare(`
      INSERT INTO cbam_products (
        id, organization_id, installation_id, name, cn_code, sector,
        annual_production_tonnes, annual_export_eu_tonnes,
        specific_direct_emissions, specific_indirect_emissions, specific_total_emissions,
        precursors_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const precursorsData = [
      {
        name: "Ferrailles d'acier recyclées locales",
        supplier: "Maroc Récupération Métaux SARL (Casablanca)",
        country: "MA",
        quantityPerTonne: 0.95,
        specificEmissionsTCO2e: 0.05
      },
      {
        name: "Ferro-silico-manganèse (FeSiMn)",
        supplier: "Asturiana de Aleaciones SA",
        country: "ES",
        quantityPerTonne: 0.03,
        specificEmissionsTCO2e: 0.12
      }
    ];

    insertCbamProduct.run(
      'prod-acier-7214', 'org-metal-oriental', 'inst-nador-1',
      'Barres et profilés d armature pour béton en acier non allié',
      '7214 20 00', 'Fer et Acier',
      45000, 18500,
      0.425, 0.380, 0.975, // direct, indirect (élec ONEE), total avec précurseurs
      JSON.stringify(precursorsData), new Date().toISOString()
    );

    // Dossier d'export pour l'importateur UE
    const insertDossier = db.prepare(`
      INSERT INTO cbam_importer_dossiers (
        id, organization_id, cbam_product_id, importer_name, importer_country,
        importer_eori, reference_period, dossier_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleDossier = {
      reportingPeriod: "Année civile 2025 (Régime définitif MACF)",
      operatorName: "Métallurgie & Tréfilerie de l Oriental SA",
      installationCountry: "Maroc (MA)",
      unlocode: "MA NDR",
      productName: "Barres pour béton (CN 7214 20 00)",
      exportedQuantityTons: 18500,
      directSpecificEmissionsTCO2ePerTon: 0.425,
      indirectSpecificEmissionsTCO2ePerTon: 0.380,
      precursorsSpecificEmissionsTCO2ePerTon: 0.170,
      totalSpecificEmbeddedEmissions: 0.975,
      electricityFactorSource: "Mix moyen réseau national ONEE (0.6426 kgCO2e/kWh)",
      carbonPricePaidCountryOfOriginMAD: 0.0,
      verificationStatus: "Données prêtes pour vérification accréditée ISO 14065"
    };

    insertDossier.run(
      'dossier-espagne-001', 'org-metal-oriental', 'prod-acier-7214',
      'Iberica Aceros & Estructuras SL', 'Espagne (ES)', 'ESB12345678',
      '2025', JSON.stringify(sampleDossier), new Date().toISOString()
    );

    // 10. Abonnements et Devis
    const insertSub = db.prepare(`
      INSERT INTO subscriptions (
        id, organization_id, plan_name, status, sites_limit, users_limit, cbam_access, current_period_end, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSub.run('sub-agro', 'org-agro-atlas', 'entreprise', 'active', 5, 10, 0, '2027-01-01', new Date().toISOString());
    insertSub.run('sub-plast', 'org-plasturgie-nord', 'essentiel', 'trial', 2, 3, 0, '2026-12-31', new Date().toISOString());
    insertSub.run('sub-metal', 'org-metal-oriental', 'export_europe', 'active', 10, 20, 1, '2027-01-01', new Date().toISOString());

    const insertQuote = db.prepare(`
      INSERT INTO quotes (
        id, quote_number, organization_id, plan_name, base_amount_mad,
        extra_sites_count, extra_users_count, discount_mad, tva_rate, tva_amount_mad,
        total_ttc_mad, status, valid_until, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertQuote.run(
      'quote-2026-001', 'DEV-2026-0014', 'org-agro-atlas', 'Offre Entreprise (Multisites Maroc)',
      24000.0, 2, 5, 2000.0, 0.20, 4400.0, 26400.0, 'accepted', '2026-11-30', 'usr-commercial', new Date().toISOString()
    );

    console.log("✅ Seeding complet terminé avec succès !");
  } else {
    console.log("ℹ️ Base de données déjà initialisée avec des utilisateurs.");
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeeds();
}
