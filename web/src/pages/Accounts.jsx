import { useMemo } from "react";
import { color, font } from "../lib/theme.js";
import { fmt, fmt0 } from "../lib/theme.js";
import { Card, Avatar, Pill, EmptyState } from "../components/ui.jsx";
import { accountTone, gaugeWidth } from "../lib/calc.js";

export default function Accounts({ data, sims, onOpenSettings, selected, onSelect }) {
  const { accounts, transactions, settings } = data;
  const activeId = accounts.some((a) => a.id === selected) ? selected : accounts[0]?.id;

  const history = useMemo(() => transactions.filter((t) => t.account_id === activeId), [transactions, activeId]);
  const activeAccount = accounts.find((a) => a.id === activeId);

  if (!accounts.length) {
    return (
      <div style={{ animation: "fadeUp .35s ease both", paddingTop: 30 }}>
        <EmptyState
          emoji="💳"
          title="Aucun compte pour l'instant"
          sub="Ajoute tes comptes dans les réglages pour voir le détail ici."
          action={
            <button onClick={onOpenSettings} style={{ border: "none", cursor: "pointer", fontFamily: font.display, fontWeight: 600, fontSize: 14, padding: "12px 18px", borderRadius: 14, background: color.green, color: "#fff" }}>
              Ouvrir les réglages
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp .35s ease both" }}>
      <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 22, color: color.ink, margin: "10px 4px 4px" }}>Mes comptes</div>
      <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 13, color: color.muted, margin: "0 4px 18px" }}>Solde courant, prévisionnel &amp; alerte propre</div>

      {accounts.map((a) => {
        const sim = sims[a.id];
        const seuil = a.seuil ?? settings.seuil;
        const alert = !!a.watch_overdraft && !!sim?.alert?.active;
        const gauge = gaugeWidth(a.balance, seuil);
        const underSeuil = a.balance < seuil;
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            style={{
              display: "block", width: "100%", textAlign: "left", border: "none", background: "none", padding: 0, cursor: "pointer",
              marginBottom: 16,
            }}
          >
            <Card style={{ padding: 18, border: `1.5px solid ${alert ? color.orangeRing : activeId === a.id ? color.green : color.line}`, boxShadow: "0 8px 22px -14px rgba(60,40,20,.45)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar bg={a.soft} size={44} radius={13} fontSize={21}>{a.emoji}</Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, color: color.ink }}>{a.name}</div>
                  <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 12, color: color.mutedLight }}>{a.bank}</div>
                </div>
                {alert && <Pill bg={color.redSoft} fg={color.red}>⚠ Alerte</Pill>}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, background: color.surface, borderRadius: 15, padding: 12 }}>
                  <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 11, color: color.mutedLight }}>SOLDE ACTUEL</div>
                  <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 22, color: accountTone(a.balance, seuil), marginTop: 2 }}>{fmt(a.balance)}</div>
                </div>
                <div style={{ flex: 1, background: color.surface, borderRadius: 15, padding: 12 }}>
                  <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 11, color: color.mutedLight }}>FIN DE MOIS</div>
                  <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 22, color: accountTone(sim?.endOfMonth ?? a.balance, seuil), marginTop: 2 }}>
                    {fmt(sim?.endOfMonth ?? a.balance)}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: font.body, fontWeight: 600, fontSize: 11, color: color.mutedLight, marginBottom: 5 }}>
                  <span>Seuil plancher {fmt0(seuil)}</span>
                  <span>{underSeuil ? "sous le seuil ⚠" : "au-dessus 👍"}</span>
                </div>
                <div style={{ height: 9, borderRadius: 6, background: color.track, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 6, width: `${gauge}%`, background: underSeuil ? color.orange : "#21C08A" }} />
                </div>
              </div>
            </Card>
          </button>
        );
      })}

      <div style={{ margin: "20px 4px 12px", fontFamily: font.display, fontWeight: 600, fontSize: 17, color: color.ink }}>
        Historique · {activeAccount?.name}
      </div>
      <Card style={{ padding: "6px 16px" }}>
        {history.length === 0 ? (
          <div style={{ padding: "16px 0", textAlign: "center", fontFamily: font.body, fontSize: 13, color: color.mutedLight }}>Pas encore d'opération sur ce compte.</div>
        ) : (
          history.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${color.line}` }}>
              <Avatar bg={t.category_soft || color.line} size={36} radius={11} fontSize={16}>{t.category_emoji || "✨"}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 13.5, color: color.ink }}>{t.label}</div>
                <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 11.5, color: color.mutedLight }}>
                  {new Date(t.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "")}
                </div>
              </div>
              <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: t.amount < 0 ? color.ink : color.green }}>
                {(t.amount < 0 ? "−" : "+") + Math.abs(t.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
