import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM installments ORDER BY next_date, id").all());
});

router.post("/", (req, res) => {
  const { name, emoji = "💳", soft = "#F0E9FE", total_amount, per_amount, count, paid_count = 0, source = "", next_date = null, account_id = null } = req.body || {};
  if (!name || !total_amount || !per_amount || !count) {
    return res.status(400).json({ error: "name, total_amount, per_amount, count are required" });
  }
  const info = db.prepare(
    `INSERT INTO installments (name, emoji, soft, total_amount, per_amount, count, paid_count, source, next_date, account_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(name, emoji, soft, Number(total_amount), Number(per_amount), Number(count), Number(paid_count), source, next_date, account_id);
  res.status(201).json(db.prepare("SELECT * FROM installments WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM installments WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "not found" });
  const fields = ["name", "emoji", "soft", "total_amount", "per_amount", "count", "paid_count", "source", "next_date", "account_id"];
  const next = { ...existing };
  for (const f of fields) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, f)) next[f] = req.body[f];
  }
  db.prepare(
    `UPDATE installments SET name=?, emoji=?, soft=?, total_amount=?, per_amount=?, count=?, paid_count=?, source=?, next_date=?, account_id=? WHERE id=?`
  ).run(next.name, next.emoji, next.soft, Number(next.total_amount), Number(next.per_amount), Number(next.count), Number(next.paid_count), next.source, next.next_date, next.account_id, req.params.id);
  res.json(db.prepare("SELECT * FROM installments WHERE id = ?").get(req.params.id));
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM installments WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

export default router;
