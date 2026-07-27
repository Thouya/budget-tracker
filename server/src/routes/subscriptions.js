import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM subscriptions ORDER BY day_of_month, id").all());
});

router.post("/", (req, res) => {
  const { name, emoji = "🔁", soft = "#FFEDE6", amount, day_of_month, month_of_year = null, frequency = "mensuel", account_id = null, active = 1 } = req.body || {};
  if (!name || !amount || !day_of_month) return res.status(400).json({ error: "name, amount, day_of_month are required" });
  const info = db.prepare(
    `INSERT INTO subscriptions (name, emoji, soft, amount, day_of_month, month_of_year, frequency, account_id, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(name, emoji, soft, Math.abs(Number(amount)), Number(day_of_month), month_of_year === null || month_of_year === "" ? null : Number(month_of_year), frequency, account_id, active ? 1 : 0);
  res.status(201).json(db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "not found" });
  const fields = ["name", "emoji", "soft", "amount", "day_of_month", "month_of_year", "frequency", "account_id", "active"];
  const next = { ...existing };
  for (const f of fields) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, f)) next[f] = req.body[f];
  }
  db.prepare(
    `UPDATE subscriptions SET name=?, emoji=?, soft=?, amount=?, day_of_month=?, month_of_year=?, frequency=?, account_id=?, active=? WHERE id=?`
  ).run(next.name, next.emoji, next.soft, Math.abs(Number(next.amount)), Number(next.day_of_month), next.month_of_year === null || next.month_of_year === "" ? null : Number(next.month_of_year), next.frequency, next.account_id, next.active ? 1 : 0, req.params.id);
  res.json(db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(req.params.id));
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM subscriptions WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

export default router;
