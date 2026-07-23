import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// S'assurer que le dossier data existe
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Fonction pour initialiser la connexion à la base de données
export async function getDbConnection() {
  const db = await open({
    filename: path.join(dataDir, 'students.db'),
    driver: sqlite3.Database
  });

  // Activer le mode WAL pour de meilleures performances avec accès concurrent (100 PCs)
  await db.exec('PRAGMA journal_mode = WAL;');

  // Création de la table des étudiants si elle n'existe pas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      fullName TEXT,
      lastName TEXT,
      firstName TEXT,
      middleName TEXT,
      idNumber TEXT,
      badgeNumber TEXT,
      etablissement TEXT,
      pourcentageExetat TEXT,
      dateNaissance TEXT,
      provinceEducationnelle TEXT,
      telParent1 TEXT,
      telParent2 TEXT,
      adresse TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}
