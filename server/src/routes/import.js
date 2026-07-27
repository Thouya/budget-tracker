import { Router } from "express";
import { db } from "../db.js";

const router = Router();

function findAccountByName(name) {
  if (!name) return null;
  return db.prepare("SELECT * FROM accounts WHERE lower(name) = lower(?)").get(String(name).trim());
}
function findCategoryByKey(key) {
  if (!key) return null;
  return db.prepare("SELECT * FROM categories WHERE key = ?").get(String(key).trim());
}

router.post("/", (req, res) => {
  const body = req.body || {};
  const accountsIn = Array.isArray(body.accounts) ? body.accounts : [];
  const categoriesIn = Array.isArray(body.categories) ? body.categories : [];
  const transactionsIn = Array.isArray(body.transactions) ? body.transactions : [];
  const subscriptionsIn = Array.isArray(body.subscriptions) ? body.subscriptions : [];
  const installmentsIn = Array.isArray(body.installments) ? body.installments : [];

  const summary = { accountsCreated: 0, categoriesUpdated: 0, transactionsAdded: 0, subscriptionsAdded: 0, installmentsAdded: 0 };
  const errors = [];

  const run = db.transaction(() => {
    // 1. accounts: create only if no existing account matches the name (case-insensitive).
    //    Existing accounts are never overwritten by import — edit those by hand in Réglages.
    for (const [i, a] of accountsIn.entries()) {
      if (!a || !a.name || !String(a.name).trim()) {
        errors.push(`Compte #${i + 1} : nom manquant, ignoré.`);
        continue;
      }
      if (findAccountByName(a.name)) continue; // already exists, skip silently
      const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM accounts").get().m;
      db.prepare(
        `INSERT INTO accounts (name, bank, emoji, color, soft, balance, seuil, watch_overdraft, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        a.name.trim(), a.bank || "", a.emoji || "🏦", a.color || "#5B8DEF", a.soft || "#E9F0FE",
        Number(a.balance) || 0, a.seuil == null ? null : Number(a.seuil), a.watch_overdraft ? 1 : 0, maxOrder + 1
      );
      summary.accountsCreated++;
    }

    // 2. categories: update the target monthly budget for existing keys only.
    for (const [i, c] of categoriesIn.entries()) {
      if (!c || !c.key) {
        errors.push(`Catégorie #${i + 1} : clé manquante, ignorée.`);
        continue;
      }
      const existing = findCategoryByKey(c.key);
      if (!existing) {
        errors.push(`Catégorie "${c.key}" inconnue, ignorée (clés valides : loyer, courses, loisirs, abos, epargne, autre).`);
        continue;
      }
      if (c.monthly_budget != null) {
        db.prepare("UPDATE categories SET monthly_budget = ? WHERE id = ?").run(Number(c.monthly_budget) || 0, existing.id);
        summary.categoriesUpdated++;
      }
    }

    // 3. transactions — history only, does NOT touch account balances (the account's
    //    current balance is assumed to already reflect reality; import just backfills
    //    history for categorization/reporting).
    const insertTx = db.prepare(
      `INSERT INTO transactions (label, category_id, account_id, amount, type, date) VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const [i, t] of transactionsIn.entries()) {
      if (!t || !t.label || !t.amount || !t.type || !t.date || !t.account) {
        errors.push(`Transaction #${i + 1} : champs manquants (label, amount, type, date, account requis), ignorée.`);
        continue;
      }
      if (!["depense", "revenu"].includes(t.type)) {
        errors.push(`Transaction #${i + 1} "${t.label}" : type invalide "${t.type}", ignorée.`);
        continue;
      }
      const account = findAccountByName(t.account);
      if (!account) {
        errors.push(`Transaction #${i + 1} "${t.label}" : compte "${t.account}" introuvable, ignorée.`);
        continue;
      }
      let categoryId = null;
      if (t.type === "depense") {
        const cat = findCategoryByKey(t.category) || findCategoryByKey("autre");
        categoryId = cat ? cat.id : null;
      } else {
        const cat = findCategoryByKey("salaire");
        categoryId = cat ? cat.id : null;
      }
      const signed = t.type === "depense" ? -Math.abs(Number(t.amount)) : Math.abs(Number(t.amount));
      insertTx.run(t.label, categoryId, account.id, signed, t.type, t.date);
      summary.transactionsAdded++;
    }

    // 4. subscriptions
    for (const [i, s] of subscriptionsIn.entries()) {
      if (!s || !s.name || !s.amount || !s.day_of_month || !s.account) {
        errors.push(`Abonnement #${i + 1} : champs manquants (name, amount, day_of_month, account requis), ignoré.`);
        continue;
      }
      const account = findAccountByName(s.account);
      if (!account) {
        errors.push(`Abonnement #${i + 1} "${s.name}" : compte "${s.account}" introuvable, ignoré.`);
        continue;
      }
      db.prepare(
        `INSERT INTO subscriptions (name, emoji, soft, amount, day_of_month, month_of_year, frequency, account_id, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).run(
        s.name, s.emoji || "🔁", s.soft || "#FFEDE6", Math.abs(Number(s.amount)), Number(s.day_of_month),
        s.month_of_year == null ? null : Number(s.month_of_year), s.frequency || "mensuel", account.id
      );
      summary.subscriptionsAdded++;
    }

    // 5. installments
    for (const [i, p] of installmentsIn.entries()) {
      if (!p || !p.name || !p.total_amount || !p.count || !p.account) {
        errors.push(`Échéance #${i + 1} : champs manquants (name, total_amount, count, account requis), ignorée.`);
        continue;
      }
      const account = findAccountByName(p.account);
      if (!account) {
        errors.push(`Échéance #${i + 1} "${p.name}" : compte "${p.account}" introuvable, ignorée.`);
        continue;
      }
      const perAmount = p.per_amount != null ? Number(p.per_amount) : Math.round((Number(p.total_amount) / Number(p.count)) * 100) / 100;
      db.prepare(
        `INSERT INTO installments (name, emoji, soft, total_amount, per_amount, count, paid_count, source, next_date, account_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        p.name, p.emoji || "💳", p.soft || "#F0E9FE", Number(p.total_amount), perAmount, Number(p.count),
        Number(p.paid_count) || 0, p.source || "", p.next_date || null, account.id
      );
      summary.installmentsAdded++;
    }
  });

  try {
    run();
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  res.json({ ...summary, errors });
});

export default router;
