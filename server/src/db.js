import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "budget.sqlite");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bank TEXT DEFAULT '',
  emoji TEXT DEFAULT '🏦',
  color TEXT DEFAULT '#5B8DEF',
  soft TEXT DEFAULT '#E9F0FE',
  balance REAL NOT NULL DEFAULT 0,
  seuil REAL,
  watch_overdraft INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT DEFAULT '✨',
  color TEXT DEFAULT '#B8A88F',
  soft TEXT DEFAULT '#F3ECE1',
  monthly_budget REAL NOT NULL DEFAULT 0,
  bucket TEXT NOT NULL DEFAULT 'envies',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('depense','revenu')),
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🔁',
  soft TEXT DEFAULT '#FFEDE6',
  amount REAL NOT NULL,
  day_of_month INTEGER NOT NULL,
  month_of_year INTEGER,
  frequency TEXT NOT NULL DEFAULT 'mensuel',
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS installments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '💳',
  soft TEXT DEFAULT '#F0E9FE',
  total_amount REAL NOT NULL,
  per_amount REAL NOT NULL,
  count INTEGER NOT NULL,
  paid_count INTEGER NOT NULL DEFAULT 0,
  source TEXT DEFAULT '',
  next_date TEXT,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL
);
`);

const defaultSettings = {
  salaire: "0",
  seuil: "100",
  anticipation_days: "15",
  savings_target_pct: "20",
};
const getSetting = db.prepare("SELECT value FROM settings WHERE key = ?");
const setSetting = db.prepare(
  "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING"
);
for (const [k, v] of Object.entries(defaultSettings)) {
  if (!getSetting.get(k)) setSetting.run(k, v);
}

const defaultCategories = [
  { key: "loyer", label: "Loyer & logement", emoji: "🏠", color: "#5B8DEF", soft: "#E9F0FE", bucket: "besoins", sort_order: 0 },
  { key: "courses", label: "Courses", emoji: "🛒", color: "#21C08A", soft: "#E5F7EF", bucket: "besoins", sort_order: 1 },
  { key: "loisirs", label: "Loisirs", emoji: "🎮", color: "#9B6BEF", soft: "#F0E9FE", bucket: "envies", sort_order: 2 },
  { key: "abos", label: "Abonnements", emoji: "🔁", color: "#FF7A59", soft: "#FFEDE6", bucket: "envies", sort_order: 3 },
  { key: "epargne", label: "Épargne", emoji: "🐷", color: "#14B8C4", soft: "#E2F7F9", bucket: "epargne", sort_order: 4 },
  { key: "autre", label: "Autre", emoji: "✨", color: "#B8A88F", soft: "#F3ECE1", bucket: "envies", sort_order: 5 },
  { key: "salaire", label: "Salaire", emoji: "💰", color: "#17B890", soft: "#E5F7EF", bucket: "revenu", sort_order: 6 },
];
const hasCat = db.prepare("SELECT 1 FROM categories WHERE key = ?");
const insCat = db.prepare(
  `INSERT INTO categories (key, label, emoji, color, soft, monthly_budget, bucket, sort_order)
   VALUES (@key, @label, @emoji, @color, @soft, 0, @bucket, @sort_order)`
);
for (const c of defaultCategories) {
  if (!hasCat.get(c.key)) insCat.run(c);
}
