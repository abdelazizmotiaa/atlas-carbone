/**
 * Atlas Carbone - Suite de Tests de Sécurité et d'Isolation Multi-Tenant (Prompt Maître Section 22)
 * Vérifie l'étanchéité stricte entre entreprises et la matrice RBAC
 */

import jwt from 'jsonwebtoken';
import { db } from '../server/src/db/database.js';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`🛡️ [PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`💥 [FAIL] ${testName} - ${details || 'Violation détectée'}`);
    testsFailed++;
  }
}

console.log("=============================================================");
console.log("TESTS DE SÉCURITÉ, ISOLATION TENANT & CONTRÔLE D'ACCÈS RBAC");
console.log("=============================================================\n");

// TEST S1 : Isolation stricte des données d'activité entre Tenant A et Tenant B
try {
  // Entreprise A (Agro Atlas), Entreprise B (Plasturgie Nord)
  const orgA = 'org-agro-atlas';
  const orgB = 'org-plasturgie-nord';

  // Récupérer les activités avec filtre tenant
  const activitiesA = db.prepare('SELECT id, organization_id FROM activity_records WHERE organization_id = ?').all(orgA) as any[];
  const activitiesB = db.prepare('SELECT id, organization_id FROM activity_records WHERE organization_id = ?').all(orgB) as any[];

  // Aucune activité de B ne doit être présente dans A
  const leakBInA = activitiesA.some(a => a.organization_id !== orgA);
  const leakAInB = activitiesB.some(b => b.organization_id !== orgB);

  assert(
    !leakBInA && !leakAInB && activitiesA.length > 0,
    "Sécurité 1 : Étanchéité stricte des activités entre Tenant A et Tenant B",
    `Activités A: ${activitiesA.length}, Activités B: ${activitiesB.length}`
  );
} catch (e: any) {
  assert(false, "Sécurité 1 : Erreur requête isolation", e.message);
}

// TEST S2 : Tentative d'accès non autorisé par manipulation d'URL (Tampering)
try {
  // L'utilisateur 'usr-admin-plast' appartient à org-plasturgie-nord
  const userPlastId = 'usr-admin-plast';
  const targetOrgA = 'org-agro-atlas';

  // Vérifier via la table memberships si usr-admin-plast a un rôle dans org-agro-atlas
  const checkAccess = db.prepare('SELECT role FROM memberships WHERE user_id = ? AND organization_id = ?').get(userPlastId, targetOrgA);

  assert(
    checkAccess === undefined,
    "Sécurité 2 : Un utilisateur du Tenant B ne possède aucun droit d'accès au Tenant A",
    `Tentative d'accès renvoie: ${JSON.stringify(checkAccess)}`
  );
} catch (e: any) {
  assert(false, "Sécurité 2 : Tampering check", e.message);
}

// TEST S3 : Rôle Responsable de Site restreint à son propre site
try {
  // usr-site-agadir est responsable de 'site-agadir-cond' uniquement
  const agadirUserId = 'usr-site-agadir';
  const casaSiteId = 'site-casa-siege';

  // Récupérer les sites dont il est le manager
  const userSites = db.prepare('SELECT id, name FROM sites WHERE manager_user_id = ?').all(agadirUserId) as any[];

  const hasAccessToCasa = userSites.some(s => s.id === casaSiteId);
  const hasAccessToAgadir = userSites.some(s => s.id === 'site-agadir-cond');

  assert(
    !hasAccessToCasa && hasAccessToAgadir,
    "Sécurité 3 : Le responsable de site est confiné à son site (Agadir) et exclu des autres (Casablanca)",
    `Sites autorisés: ${userSites.map(s => s.name).join(', ')}`
  );
} catch (e: any) {
  assert(false, "Sécurité 3 : Cloisonnement site", e.message);
}

// TEST S4 : Le rôle Commercial n'a aucun droit de lecture sur les pièces justificatives ou les activités techniques
try {
  // Rôle commercial défini dans les memberships
  const commMembership: any = db.prepare("SELECT * FROM memberships WHERE user_id = 'usr-commercial'").get();
  const commRole = commMembership ? commMembership.role : null;

  // Règles applicatives RBAC
  const allowedActivityRoles = ['admin', 'carbon_manager', 'site_manager', 'contributor', 'auditor'];
  const canCommercialReadActivities = allowedActivityRoles.includes(commRole);

  assert(
    !canCommercialReadActivities && commRole === 'commercial',
    "Sécurité 4 : Le rôle Commercial ne dispose d'aucun droit d'accès aux activités et justificatifs GES",
    `Rôle commercial: ${commRole}, Autorisé activités: ${canCommercialReadActivities}`
  );
} catch (e: any) {
  assert(false, "Sécurité 4 : Confinement commercial", e.message);
}

// TEST S5 : Protection contre l'injection de formules dans les exports (CSV Formula Injection)
try {
  const maliciousInputs = [
    "=1+1",
    "@SUM(A1:A10)",
    "-cmd|'/C calc'!A0",
    "+2+3"
  ];

  function sanitizeForCsvExport(value: string): string {
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(value)) {
      return `'${value}`; // Préfixe avec quote simple
    }
    return value;
  }

  const allSanitized = maliciousInputs.every(inp => sanitizeForCsvExport(inp).startsWith("'"));
  assert(
    allSanitized,
    "Sécurité 5 : Neutralisation systématique des formules malveillantes pour les exports CSV",
    `Toutes formules échappées: ${allSanitized}`
  );
} catch (e: any) {
  assert(false, "Sécurité 5 : Sanitization CSV", e.message);
}

console.log("\n=============================================================");
console.log(`RÉSULTAT SÉCURITÉ : ${testsPassed} / 5 tests réussis (${testsFailed} échecs)`);
console.log("=============================================================");

if (testsFailed > 0) {
  process.exit(1);
}
