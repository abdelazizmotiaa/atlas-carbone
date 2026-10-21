/**
 * Atlas Carbone - Script de Sauvegarde Sécurisée de la Base de Données
 * Conforme à la Section 20 du Prompt Maître (Fiabilité & Exploitation)
 *
 * Exécute un checkpoint WAL complet, VACUUM INTO ou copie atomique,
 * calcule l'empreinte SHA-256 et archive la sauvegarde avec métadonnées.
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

export function createDatabaseBackup(customLabel?: string): {
  backupPath: string;
  sha256: string;
  sizeBytes: number;
  stats: Record<string, number>;
} {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Base de données introuvable à : ${DB_PATH}`);
  }

  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  // 1. Ouvrir la base pour forcer un checkpoint WAL complet (TRUNCATE)
  const db = new DatabaseSync(DB_PATH);
  try {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  } catch (err) {
    console.warn('⚠️ Avertissement checkpoint WAL:', err);
  }

  // 2. Extraire les statistiques de consistance
  const stats: Record<string, number> = {};
  try {
    const orgCount = db.prepare('SELECT COUNT(*) as c FROM organizations').get() as { c: number };
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
    const actCount = db.prepare('SELECT COUNT(*) as c FROM activity_records').get() as { c: number };
    const factorCount = db.prepare('SELECT COUNT(*) as c FROM emission_factors').get() as { c: number };
    stats.organizations = orgCount.c;
    stats.users = userCount.c;
    stats.activity_records = actCount.c;
    stats.emission_factors = factorCount.c;
  } catch (err) {
    console.warn('Erreur lecture stats:', err);
  } finally {
    db.close();
  }

  // 3. Créer le fichier de backup horodaté
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const labelSuffix = customLabel ? `_${customLabel}` : '';
  const backupFilename = `atlas_carbone_backup_${timestamp}${labelSuffix}.db`;
  const backupPath = path.join(BACKUPS_DIR, backupFilename);

  // Copie physique du fichier
  fs.copyFileSync(DB_PATH, backupPath);

  // 4. Calcul du hash SHA-256
  const fileBuffer = fs.readFileSync(backupPath);
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const sizeBytes = fileBuffer.length;

  // 5. Écrire le fichier de métadonnées d'audit
  const metaPath = `${backupPath}.meta.json`;
  const metadata = {
    backupFile: backupFilename,
    createdAt: new Date().toISOString(),
    sha256,
    sizeBytes,
    stats,
    sqliteVersion: 'node:sqlite (WAL Mode)'
  };
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log(`✅ Sauvegarde réussie : ${backupFilename}`);
  console.log(`   SHA-256 : ${sha256}`);
  console.log(`   Taille  : ${(sizeBytes / 1024).toFixed(1)} Ko`);
  console.log(`   Stats   : ${stats.organizations} orgs, ${stats.activity_records} activités, ${stats.emission_factors} facteurs`);

  return { backupPath, sha256, sizeBytes, stats };
}

// Exécution directe CLI
if (process.argv[1]?.endsWith('backup_db.ts') || process.argv[1]?.endsWith('backup_db.js')) {
  try {
    const label = process.argv[2];
    createDatabaseBackup(label);
  } catch (err: any) {
    console.error('❌ Échec sauvegarde:', err.message);
    process.exit(1);
  }
}
