import { Router } from "express";
import { db } from "../db.js";

const router = Router();
const ALLOWED = new Set(["salaire", "seuil", "anticipation_days", "savings_target_pct"]);

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const out = {};
  for (const r of rows) out[r.key] = Number(r.value);
  res.json(out);
});

router.put("/", (req, res) => {
  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  const tx = db.transaction((entries) => {
    for (const [k, v] of entries) {
      if (!ALLOWED.has(k)) continue;
      upsert.run(k, String(v));
    }
  });
  tx(Object.entries(req.body || {}));
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const out = {};
  for (const r of rows) out[r.key] = Number(r.value);
  res.json(out);
});

export default router;
