import { useMemo, useState } from "react";
import { color, font } from "../lib/theme.js";
import { fmt, fmt0 } from "../lib/theme.js";
import { Card, Avatar, EmptyState } from "../components/ui.jsx";
import { monthsForecast, frenchDate, todayISO } from "../lib/calc.js";
import { api } from "../lib/api.js";

const SEGMENTS = [
  { key: "mois", label: "Ce mois" },
  { key: "abos", label: "Abos" },
  { key: "ech", label: "Échéances" },
  { key: "annee", label: "Année" },
];

export default function Forecast({ data, sims, reload }) {
  const [seg, setSeg] = useState("mois");
  const { accounts, categories, subscriptions, installments, settings } = data;

  if (!accounts.length) {
    return (
      <div style={{ animation: "fadeUp .35s ease both", paddingTop: 30 }}>
        <EmptyState emoji="📊" title="Rien à prévoir encore" sub="Ajoute un compte pour commencer à anticiper." />
      </div>
    );
  }

  const primaryAccount = accounts.find((a) => a.watch_overdraft) || accounts[0];
  const sim = sims[primaryAccount.id];

  return (
    <div style={{ animation: "fadeUp .35s ease both" }}>
      <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 22, color: color.ink, margin: "10px 4px 14px" }}>Anticiper</div>

      <div style={{ display: "flex", gap: 7, background: color.track, borderRadius: 14, padding: 4, marginBottom: 18 }}>
        {SEGMENTS.map((s) => {
          const active = seg === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSeg(s.key)}
              style={{
                flex: 1, border: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 12, padding: "9px 4px",
                borderRadius: 11, background: active ? "#fff" : "transparent", color: active ? color.green : color.muted,
                boxShadow: active ? "0 3px 8px -3px rgba(60,40,20,.35)" : "none",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {seg === "mois" && <MonthSeg account={primaryAccount} sim={sim} />}
      {seg === "abos" && <SubsSeg accounts={accounts} subscriptions={subscriptions} reload={reload} />}
      {seg === "ech" && <InstallmentsSeg accounts={accounts} installments={installments} reload={reload} />}
      {seg === "annee" && <YearSeg categories={categories} subscriptions={subscriptions} installments={installments} salaire={settings.salaire} />}
    </div>
  );
}

function MonthSeg({ account, sim }) {
  const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const named = sim.upcoming.filter((u) => u.date || u.kind === "estimate");
  return (
    <Card style={{ padding: 20, boxShadow: "0 8px 22px -14px rgba(60,40,20,.45)" }}>
      <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 13, color: color.mutedLight }}>
        PROJECTION {account.name.toUpperCase()} · {lastDay} {new Date().toLocaleDateString("fr-FR", { month: "long" }).toUpperCase()}
      </div>
      <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 38, color: sim.endOfMonth < 0 ? color.red : color.ink, margin: "2px 0 2px" }}>{fmt(sim.endOfMonth)}</div>
      {sim.alert.active && (
        <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 12.5, color: color.orangeText, background: color.orangeSoft, borderRadius: 12, padding: "9px 12px" }}>
          👀 {sim.alert.text} {sim.alert.sub}
        </div>
      )}
      <div style={{ marginTop: 16, fontFamily: font.body, fontWeight: 700, fontSize: 12, color: color.mutedLight }}>CE QUI ARRIVE ENCORE CE MOIS-CI</div>
      {named.length === 0 ? (
        <div style={{ padding: "16px 0", textAlign: "center", fontFamily: font.body, fontSize: 13, color: color.mutedLight }}>Rien de connu d'ici la fin du mois 👍</div>
      ) : (
        named.map((u) => (
          <div key={u.kind + u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${color.line}` }}>
            <Avatar bg={u.soft} size={36} radius={11} fontSize={16}>{u.emoji}</Avatar>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 13.5, color: color.ink }}>{u.label}</div>
              <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 11.5, color: color.mutedLight }}>{u.date ? frenchDate(new Date(u.date)) : "d'ici la fin du mois"}</div>
            </div>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: color.red }}>{fmt(-u.amount)}</div>
          </div>
        ))
      )}
    </Card>
  );
}

function SubsSeg({ accounts, subscriptions, reload }) {
  const [open, setOpen] = useState(false);
  const monthlyTotal = subscriptions.filter((s) => s.active).reduce((a, s) => a + s.amount * (s.frequency === "mensuel" ? 12 : 1), 0) / 12;
  const displayTotal = subscriptions.filter((s) => s.active && s.frequency === "mensuel").reduce((a, s) => a + s.amount, 0);
  const yearTotal = subscriptions.filter((s) => s.active).reduce((a, s) => a + (s.frequency === "mensuel" ? s.amount * 12 : s.amount), 0);

  async function remove(id) {
    await api.subscriptions.remove(id);
    reload();
  }

  return (
    <>
      <Card style={{ padding: "16px 18px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 12, color: color.mutedLight }}>TOTAL MENSUEL · {subscriptions.length} ABOS</div>
          <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 26, color: color.ink }}>{fmt(displayTotal)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 12, color: color.mutedLight }}>≈ SUR L'ANNÉE</div>
          <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 18, color: color.orange }}>{fmt0(yearTotal)}</div>
        </div>
      </Card>

      <Card style={{ padding: "6px 16px", marginBottom: 14 }}>
        {subscriptions.length === 0 ? (
          <div style={{ padding: "16px 0", textAlign: "center", fontFamily: font.body, fontSize: 13, color: color.mutedLight }}>Aucun abonnement suivi pour l'instant.</div>
        ) : (
          subscriptions.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${color.line}` }}>
              <Avatar bg={s.soft} size={38} radius={11} fontSize={17}>{s.emoji}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 13.5, color: color.ink }}>{s.name}</div>
                <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 11.5, color: color.mutedLight }}>
                  Le {s.day_of_month} · {s.frequency === "mensuel" ? "Mensuel" : s.frequency === "annuel" ? "Annuel" : "Autre"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: color.ink }}>{fmt(s.amount)}</div>
              </div>
              <button onClick={() => remove(s.id)} aria-label="Supprimer" style={{ border: "none", background: "none", cursor: "pointer", color: color.faint, fontSize: 16, padding: "0 0 0 6px" }}>✕</button>
            </div>
          ))
        )}
      </Card>

      {open ? (
        <SubForm accounts={accounts} onCancel={() => setOpen(false)} onSaved={() => { setOpen(false); reload(); }} />
      ) : (
        <AddLink onClick={() => setOpen(true)}>+ Ajouter un abonnement</AddLink>
      )}
    </>
  );
}

function SubForm({ accounts, onCancel, onSaved }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [frequency, setFrequency] = useState("mensuel");
  const [monthOfYear, setMonthOfYear] = useState("1");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? null);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name || !amount || !day) { setError("Remplis nom, montant et jour."); return; }
    try {
      await api.subscriptions.create({
        name, amount: parseFloat(amount.replace(",", ".")), day_of_month: Number(day), frequency,
        month_of_year: frequency === "mensuel" ? null : Number(monthOfYear), account_id: accountId,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Card style={{ padding: 16, marginBottom: 20 }}>
      <form onSubmit={submit}>
        <FormRow label="Nom"><TextInput value={name} onChange={setName} placeholder="Netflix" /></FormRow>
        <FormRow label="Montant (€)"><TextInput value={amount} onChange={(v) => setAmount(v.replace(/[^0-9.,]/g, ""))} placeholder="13.49" /></FormRow>
        <FormRow label="Jour du mois"><TextInput value={day} onChange={(v) => setDay(v.replace(/[^0-9]/g, ""))} placeholder="15" /></FormRow>
        <FormRow label="Fréquence">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={selectStyle}>
            <option value="mensuel">Mensuel</option>
            <option value="annuel">Annuel</option>
            <option value="autre">Autre</option>
          </select>
        </FormRow>
        {frequency !== "mensuel" && (
          <FormRow label="Mois">
            <select value={monthOfYear} onChange={(e) => setMonthOfYear(e.target.value)} style={selectStyle}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </FormRow>
        )}
        {accounts.length > 1 && (
          <FormRow label="Compte">
            <select value={accountId ?? ""} onChange={(e) => setAccountId(Number(e.target.value))} style={selectStyle}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </FormRow>
        )}
        {error && <div style={{ color: color.red, fontFamily: font.body, fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
        <FormActions onCancel={onCancel} />
      </form>
    </Card>
  );
}

function InstallmentsSeg({ accounts, installments, reload }) {
  const [open, setOpen] = useState(false);

  async function remove(id) {
    await api.installments.remove(id);
    reload();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {installments.length === 0 && (
        <Card style={{ padding: 20, textAlign: "center", fontFamily: font.body, fontSize: 13, color: color.mutedLight }}>Aucun paiement en plusieurs fois en cours.</Card>
      )}
      {installments.map((p) => {
        const remaining = p.count - p.paid_count;
        return (
          <Card key={p.id} style={{ padding: 18, boxShadow: "0 8px 22px -14px rgba(60,40,20,.45)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Avatar bg={p.soft} size={42} radius={12} fontSize={20}>{p.emoji}</Avatar>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: color.ink }}>{p.name}</div>
                <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 11.5, color: color.mutedLight }}>{p.source} · {fmt(p.per_amount)} × {p.count}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, color: color.ink }}>{fmt0(p.total_amount)}</div>
                <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 11, color: color.mutedLight }}>total</div>
              </div>
              <button onClick={() => remove(p.id)} aria-label="Supprimer" style={{ border: "none", background: "none", cursor: "pointer", color: color.faint, fontSize: 16 }}>✕</button>
            </div>
            <div style={{ height: 9, borderRadius: 6, background: color.track, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", borderRadius: 6, width: `${(p.paid_count / p.count) * 100}%`, background: color.purple }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.body, fontWeight: 600, fontSize: 12, color: color.inkSoft }}>
              <span>{remaining} échéance{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}</span>
              <span style={{ color: color.orange }}>Prochaine : {p.next_date ? frenchDate(new Date(p.next_date)) : "—"}</span>
            </div>
          </Card>
        );
      })}
      <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 12, color: color.mutedLight, textAlign: "center", lineHeight: 1.4, padding: "0 12px" }}>
        Ces échéances sont déjà comptées dans ta projection de solde 👍
      </div>

      {open ? (
        <InstallmentForm accounts={accounts} onCancel={() => setOpen(false)} onSaved={() => { setOpen(false); reload(); }} />
      ) : (
        <AddLink onClick={() => setOpen(true)}>+ Ajouter une échéance</AddLink>
      )}
    </div>
  );
}

function InstallmentForm({ accounts, onCancel, onSaved }) {
  const [name, setName] = useState("");
  const [total, setTotal] = useState("");
  const [count, setCount] = useState("3");
  const [source, setSource] = useState("");
  const [nextDate, setNextDate] = useState(todayISO());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? null);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const totalNum = parseFloat(total.replace(",", "."));
    const countNum = Number(count);
    if (!name || !totalNum || !countNum) { setError("Remplis nom, montant total et nombre d'échéances."); return; }
    try {
      await api.installments.create({
        name, total_amount: totalNum, per_amount: Math.round((totalNum / countNum) * 100) / 100, count: countNum,
        paid_count: 0, source, next_date: nextDate, account_id: accountId,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Card style={{ padding: 16 }}>
      <form onSubmit={submit}>
        <FormRow label="Nom"><TextInput value={name} onChange={setName} placeholder="PC portable" /></FormRow>
        <FormRow label="Montant total (€)"><TextInput value={total} onChange={(v) => setTotal(v.replace(/[^0-9.,]/g, ""))} placeholder="899.96" /></FormRow>
        <FormRow label="Nombre d'échéances"><TextInput value={count} onChange={(v) => setCount(v.replace(/[^0-9]/g, ""))} placeholder="4" /></FormRow>
        <FormRow label="Source"><TextInput value={source} onChange={setSource} placeholder="PayPal 4×" /></FormRow>
        <FormRow label="Prochaine échéance">
          <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} style={selectStyle} />
        </FormRow>
        {accounts.length > 1 && (
          <FormRow label="Compte">
            <select value={accountId ?? ""} onChange={(e) => setAccountId(Number(e.target.value))} style={selectStyle}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </FormRow>
        )}
        {error && <div style={{ color: color.red, fontFamily: font.body, fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
        <FormActions onCancel={onCancel} />
      </form>
    </Card>
  );
}

function YearSeg({ categories, subscriptions, installments, salaire }) {
  const months = useMemo(() => monthsForecast({ categories, subscriptions, installments, salaire, count: 4 }), [categories, subscriptions, installments, salaire]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {months.map((m) => (
        <Card key={m.name + m.year} style={{ padding: "15px 16px", border: `1.5px solid ${m.heavy ? color.orangeRing : m.current ? "#BEE9D5" : color.line}`, boxShadow: "0 6px 18px -12px rgba(60,40,20,.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
            <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, color: color.ink, textTransform: "capitalize" }}>{m.name}</span>
            {m.heavy && <span style={{ background: color.orangeSoft, color: color.orangeDeep, fontFamily: font.body, fontWeight: 700, fontSize: 10.5, padding: "4px 9px", borderRadius: 9 }}>🌧 mois chargé</span>}
            {m.current && <span style={{ background: color.greenSoft, color: color.greenDark, fontFamily: font.body, fontWeight: 700, fontSize: 10.5, padding: "4px 9px", borderRadius: 9 }}>en cours</span>}
          </div>
          <div style={{ height: 10, borderRadius: 6, background: color.track, overflow: "hidden", marginBottom: 9 }}>
            <div style={{ height: "100%", borderRadius: 6, width: `${m.barWidth}%`, background: m.heavy ? color.orange : "#21C08A" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.body, fontWeight: 600, fontSize: 12 }}>
            <span style={{ color: color.mutedLight }}>Charges connues {fmt0(m.charges)}</span>
            <span style={{ color: color.ink }}>Reste ~{fmt0(m.net)}</span>
          </div>
          {m.heavy && m.note && (
            <div style={{ marginTop: 9, fontFamily: font.body, fontWeight: 500, fontSize: 11.5, color: color.orangeText, background: color.orangeSoft2, borderRadius: 10, padding: "8px 10px" }}>{m.note}</div>
          )}
        </Card>
      ))}
    </div>
  );
}

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const selectStyle = { width: "100%", border: `1.5px solid ${color.border}`, background: "#fff", borderRadius: 10, padding: "9px 10px", fontFamily: font.body, fontSize: 13.5, color: color.ink, outline: "none" };

function FormRow({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 11, color: color.mutedLight, marginBottom: 5 }}>{label.toUpperCase()}</div>
      {children}
    </div>
  );
}
function TextInput({ value, onChange, placeholder }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={selectStyle} />;
}
function FormActions({ onCancel }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
      <button type="button" onClick={onCancel} style={{ flex: 1, border: `1.5px solid ${color.border}`, background: "#fff", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13, padding: 11, borderRadius: 12, color: color.inkSoft }}>Annuler</button>
      <button type="submit" style={{ flex: 1, border: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13, padding: 11, borderRadius: 12, background: color.green, color: "#fff" }}>Enregistrer</button>
    </div>
  );
}
function AddLink({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ border: `1.5px dashed ${color.border}`, background: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13, padding: 12, borderRadius: 14, color: color.green, width: "100%" }}>
      {children}
    </button>
  );
}
