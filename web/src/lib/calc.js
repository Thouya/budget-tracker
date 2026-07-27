// Pure functions that turn raw API data (accounts, categories, transactions,
// subscriptions, installments, settings) into the derived numbers the UI shows:
// balances, projections, the proactive overdraft alert, the multi-month
// forecast, and the 50/30/20 plan. No React, no fetching — easy to reason
// about and to unit-test independently of the UI.

const MS_DAY = 24 * 60 * 60 * 1000;

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

export function daysInMonth(year, month0) {
  return new Date(year, month0 + 1, 0).getDate();
}

export function frenchDate(d) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
}

function subsForDay(subscriptions, accountId, year, month0, day) {
  return subscriptions.filter((s) => {
    if (!s.active) return false;
    if (accountId != null && s.account_id !== accountId) return false;
    if (s.day_of_month !== day) return false;
    if (s.frequency === "mensuel") return true;
    return Number(s.month_of_year) === month0 + 1;
  });
}

function installmentsForDay(installments, accountId, isoDate) {
  return installments.filter((p) => {
    if (accountId != null && p.account_id !== accountId) return false;
    if (p.paid_count >= p.count) return false;
    return p.next_date === isoDate;
  });
}

/** Amount spent this month so far in "variable" categories (not rent, not
 * subscriptions, not savings) — used as a daily burn-rate estimate for the
 * days that haven't happened yet. */
function variableDailyRate(transactions, categories, accountId, today) {
  const excluded = new Set(
    categories.filter((c) => ["loyer", "abos", "epargne", "salaire"].includes(c.key)).map((c) => c.id)
  );
  const mk = monthKey(today);
  const elapsedDays = today.getDate();
  let sum = 0;
  for (const t of transactions) {
    if (t.type !== "depense") continue;
    if (accountId != null && t.account_id !== accountId) continue;
    if (!t.date.startsWith(mk)) continue;
    if (excluded.has(t.category_id)) continue;
    sum += Math.abs(t.amount);
  }
  return elapsedDays > 0 ? sum / elapsedDays : 0;
}

/** Simulate an account's balance day by day to the end of the month, applying
 * known subscriptions/installments on their due day and a flat estimate for
 * everything else. Returns { endOfMonth, crossing: {date, day} | null }. */
export function simulateAccount({ account, transactions, categories, subscriptions, installments, seuil, today = new Date() }) {
  const year = today.getFullYear();
  const month0 = today.getMonth();
  const lastDay = daysInMonth(year, month0);
  const dailyRate = variableDailyRate(transactions, categories, account.id, today);
  const effectiveSeuil = account.seuil ?? seuil;

  let running = account.balance;
  let crossing = null;
  const upcoming = [];

  for (let day = today.getDate() + 1; day <= lastDay; day++) {
    const date = new Date(year, month0, day);
    const iso = date.toISOString().slice(0, 10);

    running -= dailyRate;

    for (const s of subsForDay(subscriptions, account.id, year, month0, day)) {
      running -= s.amount;
      upcoming.push({ kind: "subscription", id: s.id, label: s.name, emoji: s.emoji, soft: s.soft, amount: s.amount, date: iso, day });
    }
    for (const p of installmentsForDay(installments, account.id, iso)) {
      running -= p.per_amount;
      upcoming.push({ kind: "installment", id: p.id, label: p.name + " — " + (p.source || "échéance"), emoji: p.emoji, soft: p.soft, amount: p.per_amount, date: iso, day });
    }

    if (!crossing && running < effectiveSeuil) {
      crossing = { date: iso, day, balance: running };
    }
  }

  if (dailyRate > 0) {
    upcoming.push({
      kind: "estimate",
      id: "estimate",
      label: "Courses & loisirs (estim.)",
      emoji: "🔮",
      soft: "#F3ECE1",
      amount: Math.round(dailyRate * (lastDay - today.getDate()) * 100) / 100,
      date: null,
      day: lastDay,
    });
  }

  return { endOfMonth: running, crossing, upcoming, dailyRate };
}

export function accountAlert({ account, simulation, seuil, anticipationDays, today = new Date() }) {
  const effectiveSeuil = account.seuil ?? seuil;
  if (account.balance < effectiveSeuil) {
    return {
      active: true,
      text: `${account.name} est déjà sous le seuil de ${Math.round(effectiveSeuil)} €.`,
      sub: `Solde actuel : ${account.balance.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €. On regarde ce qui peut être décalé ?`,
    };
  }
  if (simulation.crossing) {
    const daysAway = Math.round((new Date(simulation.crossing.date) - today) / MS_DAY);
    if (daysAway <= anticipationDays) {
      const biggest = [...simulation.upcoming]
        .filter((u) => u.date && u.date <= simulation.crossing.date)
        .sort((a, b) => b.amount - a.amount)[0];
      const dateLabel = frenchDate(new Date(simulation.crossing.date));
      return {
        active: true,
        text: `À ce rythme, ${account.name} passe sous ${Math.round(effectiveSeuil)} € vers le ${dateLabel}.`,
        sub: biggest
          ? `En cause surtout ${biggest.label.toLowerCase()} de ${biggest.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € le ${frenchDate(new Date(biggest.date))}. On l'anticipe ensemble ?`
          : "On l'anticipe ensemble ?",
      };
    }
  }
  return { active: false, text: "", sub: "" };
}

export function monthLabel(mk) {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function shiftMonth(mk, delta) {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

/** Every "YYYY-MM" that has at least one transaction, most recent first. */
export function monthsWithData(transactions) {
  const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
  return [...set].sort().reverse();
}

/** Revenu / dépenses / épargne / net for one month — the building block for
 * the evolution/KPI view (is spending trending down, is the savings rate
 * trending up, month over month). */
export function monthSummary(transactions, categories, mk) {
  const epargneCat = categories.find((c) => c.key === "epargne");
  let revenu = 0;
  let depense = 0;
  let epargne = 0;
  for (const t of transactions) {
    if (!t.date.startsWith(mk)) continue;
    if (t.type === "revenu") {
      revenu += t.amount;
    } else {
      const amt = Math.abs(t.amount);
      depense += amt;
      if (epargneCat && t.category_id === epargneCat.id) epargne += amt;
    }
  }
  return {
    month: mk,
    revenu,
    depense,
    epargne,
    net: revenu - depense,
    savingsRate: revenu > 0 ? (epargne / revenu) * 100 : 0,
  };
}

export function categorySpend(transactions, categories, mk = monthKey()) {
  const byId = {};
  for (const c of categories) byId[c.id] = 0;
  for (const t of transactions) {
    if (t.type !== "depense") continue;
    if (!t.date.startsWith(mk)) continue;
    if (t.category_id == null) continue;
    byId[t.category_id] = (byId[t.category_id] || 0) + Math.abs(t.amount);
  }
  return byId;
}

export function accountTone(balance, seuil) {
  if (balance < 0) return "#F4514E";
  if (balance < seuil) return "#FF7A59";
  return "#2A241E";
}

export function gaugeWidth(balance, seuil) {
  const max = Math.max(seuil * 4, 1);
  return Math.max(4, Math.min(100, (balance / max) * 100));
}

/** Multi-month forecast: for each of the next `count` months, sum known
 * recurring charges (rent budget + subscriptions + scheduled installments)
 * against salary, and flag months where several one-off items concentrate. */
export function monthsForecast({ categories, subscriptions, installments, salaire, count = 4, today = new Date() }) {
  const rentBudget = categories.find((c) => c.key === "loyer")?.monthly_budget || 0;
  const monthlySubsTotal = subscriptions.filter((s) => s.active && s.frequency === "mensuel").reduce((a, s) => a + s.amount, 0);
  const baseline = rentBudget + monthlySubsTotal;

  const months = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = d.getFullYear();
    const month0 = d.getMonth();
    const items = [];

    for (const s of subscriptions) {
      if (!s.active || s.frequency === "mensuel") continue;
      if (Number(s.month_of_year) === month0 + 1) items.push({ label: s.name, amount: s.amount });
    }
    for (const p of installments) {
      if (!p.next_date || p.paid_count >= p.count) continue;
      const remaining = p.count - p.paid_count;
      const start = new Date(p.next_date);
      const monthsFromStart = (year - start.getFullYear()) * 12 + (month0 - start.getMonth());
      if (monthsFromStart >= 0 && monthsFromStart < remaining) {
        items.push({ label: p.name, amount: p.per_amount });
      }
    }

    const extra = items.reduce((a, it) => a + it.amount, 0);
    const charges = baseline + extra;
    months.push({
      name: d.toLocaleDateString("fr-FR", { month: "long" }),
      year,
      current: i === 0,
      heavy: items.length >= 2 || extra >= 150,
      items,
      charges,
      net: salaire - charges,
    });
  }

  const maxNet = Math.max(...months.map((m) => m.net), 1);
  return months.map((m) => ({
    ...m,
    barWidth: Math.max(6, (m.net / maxNet) * 100),
    note: m.heavy && m.items.length
      ? m.items.map((it) => `${it.label} (${it.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €)`).join(" + ") + " tombent ce mois-ci."
      : "",
  }));
}

const BUCKET_IDEAL = { besoins: 0.5, envies: 0.3, epargne: 0.2 };
const BUCKET_META = {
  besoins: { label: "Besoins", emoji: "🍞", color: "#5B8DEF", soft: "#E9F0FE" },
  envies: { label: "Envies", emoji: "🎉", color: "#9B6BEF", soft: "#F0E9FE" },
  epargne: { label: "Épargne", emoji: "🐷", color: "#14B8C4", soft: "#E2F7F9" },
};

export function planBuckets({ categories, spendById, salaire, savingsTargetPct }) {
  const real = { besoins: 0, envies: 0, epargne: 0 };
  for (const c of categories) {
    if (!BUCKET_META[c.bucket]) continue;
    real[c.bucket] += spendById[c.id] || 0;
  }
  const idealOverrides = savingsTargetPct != null ? { epargne: savingsTargetPct / 100 } : {};
  return ["besoins", "envies", "epargne"].map((key) => {
    const idealPct = idealOverrides[key] ?? BUCKET_IDEAL[key];
    const ideal = salaire * idealPct;
    const realAmount = real[key];
    const realPct = salaire > 0 ? (realAmount / salaire) * 100 : 0;
    const ok = key === "epargne" ? realPct >= idealPct * 100 - 2 : realPct <= idealPct * 100 + 2;
    return {
      key,
      ...BUCKET_META[key],
      idealPct: Math.round(idealPct * 100),
      ideal,
      realPct,
      realAmount,
      ok,
      realWidth: Math.min(100, realPct),
      idealWidth: Math.round(idealPct * 100),
    };
  });
}
