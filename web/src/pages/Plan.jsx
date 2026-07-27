import { useMemo } from "react";
import { color, font } from "../lib/theme.js";
import { fmt, fmt0 } from "../lib/theme.js";
import { Card, Avatar, EmptyState } from "../components/ui.jsx";
import { categorySpend, planBuckets } from "../lib/calc.js";

export default function Plan({ data }) {
  const { categories, transactions, settings } = data;
  const salaire = settings.salaire;

  const buckets = useMemo(() => {
    const spendById = categorySpend(transactions, categories);
    return planBuckets({ categories, spendById, salaire, savingsTargetPct: settings.savings_target_pct });
  }, [categories, transactions, salaire, settings.savings_target_pct]);

  if (!salaire) {
    return (
      <div style={{ animation: "fadeUp .35s ease both", paddingTop: 30 }}>
        <EmptyState emoji="🎯" title="Renseigne ton salaire" sub="Va dans les réglages pour indiquer ton revenu net et voir ton plan 50/30/20." />
      </div>
    );
  }

  const savingsBucket = buckets.find((b) => b.key === "epargne");

  return (
    <div style={{ animation: "fadeUp .35s ease both" }}>
      <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 22, color: color.ink, margin: "10px 4px 4px" }}>Ton plan</div>
      <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 13, color: color.muted, margin: "0 4px 18px" }}>Repère 50/30/20 sur {fmt(salaire)} de revenu net</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {buckets.map((b) => (
          <Card key={b.key} style={{ padding: 18, boxShadow: "0 8px 22px -14px rgba(60,40,20,.45)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
              <Avatar bg={b.soft} size={40} radius={12} fontSize={19}>{b.emoji}</Avatar>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15.5, color: color.ink }}>{b.label}</div>
                <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 11.5, color: color.mutedLight }}>Cible {b.idealPct}% · {fmt0(b.ideal)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 18, color: b.color }}>{Math.round(b.realPct)}%</div>
                <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 11.5, color: color.mutedLight }}>{fmt0(b.realAmount)}</div>
              </div>
            </div>
            <div style={{ height: 12, borderRadius: 7, background: color.track, overflow: "hidden", position: "relative" }}>
              <div style={{ height: "100%", borderRadius: 7, width: `${b.realWidth}%`, background: b.color }} />
              <div style={{ position: "absolute", top: -2, bottom: -2, left: `${b.idealWidth}%`, width: 2, background: color.ink, opacity: 0.35 }} />
            </div>
            <div style={{ marginTop: 9, fontFamily: font.body, fontWeight: 500, fontSize: 12, color: b.ok ? color.greenDark : color.orangeDeep, lineHeight: 1.35 }}>
              {bucketNote(b)}
            </div>
          </Card>
        ))}
      </div>

      {savingsBucket && (
        <div style={{ marginTop: 16, background: `linear-gradient(150deg, ${color.purple} 0%, ${color.purpleDeep} 100%)`, borderRadius: 24, padding: 20, color: "#fff", boxShadow: "0 16px 30px -18px rgba(109,91,239,.7)" }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>🐷</div>
          <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 17, lineHeight: 1.2 }}>Astuce : l'épargne en premier</div>
          <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 13, lineHeight: 1.45, opacity: 0.92, marginTop: 6 }}>
            Tu épargnes <b>{fmt0(savingsBucket.realAmount)}</b>/mois pour une cible autour de <b>{fmt0(savingsBucket.ideal)}</b>.
            En programmant un virement automatique <b>dès la paie</b> (au lieu de « ce qui reste »), tu combles l'écart sans y penser.
          </div>
        </div>
      )}
      <div style={{ marginTop: 12, fontFamily: font.body, fontWeight: 500, fontSize: 11, color: color.faint, textAlign: "center", lineHeight: 1.4, padding: "0 10px" }}>
        Le 50/30/20 est un repère indicatif, pas une norme. À ajuster selon ta situation.
      </div>
    </div>
  );
}

function bucketNote(b) {
  if (b.key === "epargne") {
    return b.ok ? "Tu es sur la cible, continue comme ça 💪" : `En dessous de la cible : ${fmt0(b.ideal - b.realAmount)} d'écart.`;
  }
  if (b.ok) return "Marge confortable ici.";
  return "Un peu au-dessus de la cible — regarde ce qui peut bouger.";
}
