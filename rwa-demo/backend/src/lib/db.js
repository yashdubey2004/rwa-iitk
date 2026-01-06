import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export function getDb() {
  if (!db) {
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, 'rwa.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDb() {
  const db = getDb();

  db.prepare(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    stablecoin_balance REAL NOT NULL DEFAULT 0
  )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS bonds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bond_name TEXT NOT NULL,
    interest_rate REAL NOT NULL,
    maturity_date TEXT NOT NULL,
    total_value REAL NOT NULL,
    total_tokens INTEGER NOT NULL,
    token_price REAL NOT NULL
  )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS user_bond_holdings (
    user_id INTEGER NOT NULL,
    bond_id INTEGER NOT NULL,
    tokens_owned INTEGER NOT NULL,
    invested_amount REAL NOT NULL,
    last_yield_calculated TEXT NOT NULL,
    accrued_yield REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, bond_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (bond_id) REFERENCES bonds(id)
  )`).run();
}
