import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM accounts ORDER BY sort_order, id").all();
  res.json(rows);
});

router.post("/", (req, res) => {
  const { name, bank = "", emoji = "🏦", color = "#5B8DEF", soft = "#E9F0FE", balance = 0, seuil = null, watch_overdraft = 0 } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: "name is required" });
  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM accounts").get().m;
  const info = db.prepare(
    `INSERT INTO accounts (name, bank, emoji, color, soft, balance, seuil, watch_overdraft, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(name.trim(), bank, emoji, color, soft, Number(balance) || 0, seuil === null ? null : Number(seuil), watch_overdraft ? 1 : 0, maxOrder + 1);
  const row = db.prepare("SELECT * FROM accounts WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM accounts WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "not found" });
  const fields = ["name", "bank", "emoji", "color", "soft", "balance", "seuil", "watch_overdraft", "sort_order"];
  const next = { ...existing };
  for (const f of fields) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, f)) next[f] = req.body[f];
  }
  db.prepare(
    `UPDATE accounts SET name=?, bank=?, emoji=?, color=?, soft=?, balance=?, seuil=?, watch_overdraft=?, sort_order=? WHERE id=?`
  ).run(next.name, next.bank, next.emoji, next.color, next.soft, Number(next.balance) || 0, next.seuil === null || next.seuil === "" ? null : Number(next.seuil), next.watch_overdraft ? 1 : 0, Number(next.sort_order) || 0, req.params.id);
  const row = db.prepare("SELECT * FROM accounts WHERE id = ?").get(req.params.id);
  res.json(row);
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM accounts WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

export default router;
