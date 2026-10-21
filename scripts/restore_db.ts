/**
 * Atlas Carbone - Script de Restauration Contrôlée de la Base de Données
 * Conforme à la Section 20 du Prompt Maître (Fiabilité & Exploitation)
 *
 * Vérifie l'intégrité SHA-256 de la sauvegarde, crée une copie de sécurité
 * de la base active, restaure le fichier et exécute PRAGMA integrity_check.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

function resolveDatabasePath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'server/data/atlas_carbone.db'),
    path.resolve(process.cwd(), 'data/atlas_carbone.db'),
    path.resolve(__dirname, '../server/data/atlas_carbone.db'),
    path.resolve(__dirname, '../../server/data/atlas_carbone.db')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve(process.cwd(), 'data/atlas_carbone.db');
}

const DB_PATH = resolveDatabasePath();
const BACKUPS_DIR = path.resolve(path.dirname(DB_PATH), 'backups');

export function restoreDatabase(backupFileOrPath: string, targetDbPath?: string): {
  restoredFrom: string;
  integrityOk: boolean;
  stats: Record<string, number>;
} {
  const destPath = targetDbPath || DB_PATH;
  let targetPath = backupFileOrPath;
  if (!fs.existsSync(targetPath)) {
    targetPath = path.join(BACKUPS_DIR, backupFileOrPath);
  }

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Fichier de sauvegarde introuvable : ${backupFileOrPath}`);
  }

  // 1. Vérification SHA-256 si métadonnées disponibles
  const metaPath = `${targetPath}.meta.json`;
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const fileBuffer = fs.readFileSync(targetPath);
    const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    if (actualHash !== meta.sha256) {
      throw new Error(`Échec de vérification cryptographique ! Attendu: ${meta.sha256}, Calculé: ${actualHash}`);
    }
    console.log(`🔒 Intégrité SHA-256 vérifiée avec succès : ${actualHash}`);
  }

  // 2. Sauvegarde de sécurité pré-restauration de la base active si elle existe
  if (fs.existsSync(destPath) && destPath === DB_PATH) {
    const preRestoreSafety = `${destPath}.pre_restore_${Date.now()}.bak`;
    fs.copyFileSync(destPath, preRestoreSafety);
    console.log(`🛡️ Copie de sécurité de la base actuelle créée : ${path.basename(preRestoreSafety)}`);
  }

  // 3. Remplacement physique
  fs.copyFileSync(targetPath, destPath);

  // Supprimer les fichiers WAL et SHM résiduels s'ils existent pour la cible
  const walPath = `${destPath}-wal`;
  const shmPath = `${destPath}-shm`;
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

  // 4. Contrôle d'intégrité SQLite
  const db = new DatabaseSync(destPath);
  let integrityOk = false;
  const stats: Record<string, number> = {};

  try {
    const integrityRes = db.prepare('PRAGMA integrity_check').all() as Array<{ integrity_check: string }>;
    integrityOk = integrityRes.length > 0 && integrityRes[0].integrity_check === 'ok';

    const orgCount = db.prepare('SELECT COUNT(*) as c FROM organizations').get() as { c: number };
    const actCount = db.prepare('SELECT COUNT(*) as c FROM activity_records').get() as { c: number };
    const factorCount = db.prepare('SELECT COUNT(*) as c FROM emission_factors').get() as { c: number };
    stats.organizations = orgCount.c;
    stats.activity_records = actCount.c;
    stats.emission_factors = factorCount.c;
  } finally {
    db.close();
  }

  if (!integrityOk) {
    throw new Error('❌ ÉCHEC du contrôle d’intégrité SQLite (PRAGMA integrity_check non ok)');
  }

  console.log(`✅ Restauration réussie depuis : ${path.basename(targetPath)}`);
  console.log(`   Contrôle intégrité : PRAGMA integrity_check = OK`);
  console.log(`   État de la base   : ${stats.organizations} orgs, ${stats.activity_records} activités, ${stats.emission_factors} facteurs`);

  return { restoredFrom: targetPath, integrityOk, stats };
}

// Exécution directe CLI
if (process.argv[1]?.endsWith('restore_db.ts') || process.argv[1]?.endsWith('restore_db.js')) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: tsx scripts/restore_db.ts <nom_du_fichier_backup>');
    process.exit(1);
  }
  try {
    restoreDatabase(target);
  } catch (err: any) {
    console.error('❌ Échec restauration:', err.message);
    process.exit(1);
  }
}
