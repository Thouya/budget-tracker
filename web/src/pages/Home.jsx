import { color, font } from "../lib/theme.js";
import { fmt, fmt0 } from "../lib/theme.js";
import { Card, SectionTitle, ProgressBar, Avatar, EmptyState } from "../components/ui.jsx";
import { accountTone, categorySpend, monthKey } from "../lib/calc.js";

export default function Home({ data, sims, onOpenSettings, onGoTab, onSelectAccount }) {
  const { accounts, categories, transactions, settings } = data;

  if (!accounts.length) {
    return (
      <EmptyStateWrap onOpenSettings={onOpenSettings} />
    );
  }

  const soldeConso = accounts.reduce((a, acc) => a + acc.balance, 0);
  const projConso = accounts.reduce((a, acc) => a + (sims[acc.id]?.endOfMonth ?? acc.balance), 0);

  const alertingAccount = accounts.find((a) => a.watch_overdraft && sims[a.id]?.alert?.active);

  const spendById = categorySpend(transactions, categories);
  const spendCats = categories.filter((c) => c.key !== "salaire");
  const spentTotal = spendCats.reduce((a, c) => a + (c.key === "epargne" ? 0 : spendById[c.id] || 0), 0);

  const recent = transactions.slice(0, 4);
  const monthLabel = new Date().toLocaleDateString("fr-FR", { month: "long" });

  return (
    <div style={{ animation: "fadeUp .35s ease both" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "8px 4px 16px" }}>
        <div>
          <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 14, color: color.muted }}>Salut 👋</div>
          <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 22, color: color.ink, lineHeight: 1.15 }}>
            Ton mois, en un<br />coup d'œil
          </div>
        </div>
        <button onClick={onOpenSettings} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }} aria-label="Réglages">
          <Avatar bg="#FFE3CF">🦊</Avatar>
        </button>
      </div>

      <div style={{ background: `linear-gradient(150deg, ${color.green} 0%, ${color.greenDeep} 100%)`, borderRadius: 26, padding: "22px 22px 18px", color: "#fff", boxShadow: "0 18px 34px -18px rgba(23,184,144,.7)" }}>
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 13, opacity: 0.88, letterSpacing: ".02em" }}>
          SOLDE TOTAL · {accounts.length} COMPTE{accounts.length > 1 ? "S" : ""}
        </div>
        <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 42, lineHeight: 1.05, marginTop: 4 }}>{fmt(soldeConso)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, background: "rgba(255,255,255,.16)", borderRadius: 14, padding: "9px 12px" }}>
          <span style={{ fontSize: 16 }}>🔮</span>
          <span style={{ fontFamily: font.body, fontWeight: 500, fontSize: 12.5, lineHeight: 1.3 }}>
            Fin de mois estimée · <b style={{ fontWeight: 700 }}>{fmt(projConso)}</b> après charges connues
          </span>
        </div>
      </div>

      {alertingAccount && (
        <div style={{ marginTop: 14, background: color.orangeSoft, border: `1.5px solid ${color.orangeRing}`, borderRadius: 22, padding: "15px 16px", display: "flex", gap: 12 }}>
          <Avatar bg={color.orange} size={38} radius={12} fontSize={19}>👀</Avatar>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 14.5, color: color.orangeDeep, lineHeight: 1.25 }}>
              {sims[alertingAccount.id].alert.text}
            </div>
            <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 12.5, color: color.orangeText, lineHeight: 1.35, marginTop: 3 }}>
              {sims[alertingAccount.id].alert.sub}
            </div>
            <button
              onClick={() => onGoTab("prevoir")}
              style={{ marginTop: 9, border: "none", background: color.orange, color: "#fff", fontFamily: font.body, fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 11, cursor: "pointer" }}
            >
              On regarde ensemble →
            </button>
          </div>
        </div>
      )}

      <SectionTitle action={<a onClick={() => onGoTab("comptes")} style={{ fontFamily: font.body, fontWeight: 600, fontSize: 13, color: color.green, cursor: "pointer" }}>Détail →</a>}>
        Tes comptes
      </SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {accounts.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              onSelectAccount(a.id);
              onGoTab("comptes");
            }}
            style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "none", padding: 0, cursor: "pointer" }}
          >
            <Card style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 13 }}>
              <Avatar bg={a.soft} size={40} radius={12} fontSize={19}>{a.emoji}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 14, color: color.ink }}>{a.name}</div>
                <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 12, color: color.mutedLight }}>{a.bank}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 17, color: accountTone(a.balance, a.seuil ?? settings.seuil) }}>{fmt(a.balance)}</div>
                {!!a.watch_overdraft && sims[a.id]?.alert?.active && (
                  <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 10.5, color: color.red }}>⚠ à surveiller</div>
                )}
              </div>
            </Card>
          </button>
        ))}
      </div>

      <SectionTitle action={<a onClick={() => onGoTab("plan")} style={{ fontFamily: font.body, fontWeight: 600, fontSize: 13, color: color.green, cursor: "pointer" }}>Plan →</a>}>
        Budget de {monthLabel}
      </SectionTitle>
      <Card style={{ padding: "8px 16px" }}>
        {spendCats.map((c) => {
          const spent = spendById[c.id] || 0;
          const pct = c.monthly_budget > 0 ? Math.min(100, (spent / c.monthly_budget) * 100) : spent > 0 ? 100 : 0;
          return (
            <div key={c.id} style={{ padding: "12px 0", borderBottom: `1px solid ${color.line}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8 }}>
                <span style={{ fontSize: 17 }}>{c.emoji}</span>
                <span style={{ flex: 1, fontFamily: font.body, fontWeight: 600, fontSize: 13.5, color: color.ink }}>{c.label}</span>
                <span style={{ fontFamily: font.body, fontWeight: 600, fontSize: 12.5, color: color.inkSoft }}>
                  {fmt(spent)} <span style={{ color: color.faint, fontWeight: 500 }}>/ {fmt0(c.monthly_budget)}</span>
                </span>
              </div>
              <ProgressBar pct={pct} bg={c.color} />
            </div>
          );
        })}
        <div style={{ padding: "12px 2px", display: "flex", justifyContent: "space-between", fontFamily: font.body, fontWeight: 600, fontSize: 13, color: color.muted }}>
          <span>Dépensé ce mois</span>
          <span style={{ fontFamily: font.display, color: color.ink }}>{fmt(spentTotal)}</span>
        </div>
      </Card>

      <div style={{ margin: "24px 4px 12px", fontFamily: font.display, fontWeight: 600, fontSize: 17, color: color.ink }}>Activité récente</div>
      <Card style={{ padding: "6px 16px" }}>
        {recent.length === 0 ? (
          <div style={{ padding: "16px 0", textAlign: "center", fontFamily: font.body, fontSize: 13, color: color.mutedLight }}>
            Pas encore d'opération. Appuie sur + pour commencer.
          </div>
        ) : (
          recent.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${color.line}` }}>
              <Avatar bg={t.category_soft || color.line} size={36} radius={11} fontSize={16}>{t.category_emoji || "✨"}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 13.5, color: color.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</div>
                <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 11.5, color: color.mutedLight }}>{frDate(t.date)} · {t.account_name}</div>
              </div>
              <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: t.amount < 0 ? color.ink : color.green }}>{signedFmt(t.amount)}</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

function EmptyStateWrap({ onOpenSettings }) {
  return (
    <div style={{ animation: "fadeUp .35s ease both", paddingTop: 30 }}>
      <EmptyState
        emoji="🦊"
        title="Bienvenue !"
        sub="Commence par ajouter tes comptes dans les réglages pour voir ton budget prendre vie."
        action={
          <button
            onClick={onOpenSettings}
            style={{ border: "none", cursor: "pointer", fontFamily: font.display, fontWeight: 600, fontSize: 14, padding: "12px 18px", borderRadius: 14, background: color.green, color: "#fff" }}
          >
            Ouvrir les réglages
          </button>
        }
      />
    </div>
  );
}

function frDate(iso) {
  if (iso === "") return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
}
function signedFmt(n) {
  const s = n < 0 ? "−" : "+";
  return s + Math.abs(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
