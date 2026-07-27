import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM categories ORDER BY sort_order, id").all();
  res.json(rows);
});

router.post("/", (req, res) => {
  const { key, label, emoji = "✨", color = "#B8A88F", soft = "#F3ECE1", monthly_budget = 0, bucket = "envies" } = req.body || {};
  if (!key || !label) return res.status(400).json({ error: "key and label are required" });
  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM categories").get().m;
  try {
    const info = db.prepare(
      `INSERT INTO categories (key, label, emoji, color, soft, monthly_budget, bucket, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(key, label, emoji, color, soft, Number(monthly_budget) || 0, bucket, maxOrder + 1);
    const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    res.status(409).json({ error: "category key already exists" });
  }
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "not found" });
  const fields = ["label", "emoji", "color", "soft", "monthly_budget", "bucket", "sort_order"];
  const next = { ...existing };
  for (const f of fields) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, f)) next[f] = req.body[f];
  }
  db.prepare(
    `UPDATE categories SET label=?, emoji=?, color=?, soft=?, monthly_budget=?, bucket=?, sort_order=? WHERE id=?`
  ).run(next.label, next.emoji, next.color, next.soft, Number(next.monthly_budget) || 0, next.bucket, Number(next.sort_order) || 0, req.params.id);
  const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id);
  res.json(row);
});

router.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT key FROM categories WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "not found" });
  if (existing.key === "salaire") return res.status(400).json({ error: "cannot delete the income category" });
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

export default router;
