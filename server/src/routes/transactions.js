import { Router } from "express";
import { db } from "../db.js";

const router = Router();

const SELECT_JOINED = `
  SELECT t.*, c.key AS category_key, c.label AS category_label, c.emoji AS category_emoji, c.soft AS category_soft,
         a.name AS account_name
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  JOIN accounts a ON a.id = t.account_id
`;

router.get("/", (req, res) => {
  const { account_id, month, limit } = req.query;
  const clauses = [];
  const params = [];
  if (account_id) {
    clauses.push("t.account_id = ?");
    params.push(account_id);
  }
  if (month) {
    clauses.push("substr(t.date, 1, 7) = ?");
    params.push(month);
  }
  let sql = SELECT_JOINED;
  if (clauses.length) sql += " WHERE " + clauses.join(" AND ");
  sql += " ORDER BY t.date DESC, t.id DESC";
  if (limit) sql += ` LIMIT ${Number(limit) || 50}`;
  res.json(db.prepare(sql).all(...params));
});

router.post("/", (req, res) => {
  const { label, category_id = null, account_id, amount, type, date } = req.body || {};
  if (!label || !account_id || !amount || !type || !date) {
    return res.status(400).json({ error: "label, account_id, amount, type, date are required" });
  }
  if (!["depense", "revenu"].includes(type)) return res.status(400).json({ error: "type must be depense or revenu" });
  const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(account_id);
  if (!account) return res.status(404).json({ error: "account not found" });
  const signed = type === "depense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount));

  const tx = db.transaction(() => {
    const info = db.prepare(
      `INSERT INTO transactions (label, category_id, account_id, amount, type, date) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(label, category_id, account_id, signed, type, date);
    db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(signed, account_id);
    return info.lastInsertRowid;
  });
  const id = tx();
  const row = db.prepare(SELECT_JOINED + " WHERE t.id = ?").get(id);
  res.status(201).json(row);
});

router.delete("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "not found" });
  const tx = db.transaction(() => {
    db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(existing.amount, existing.account_id);
    db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
  });
  tx();
  res.status(204).end();
});

export default router;
