import { useState } from "react";
import { color, font } from "../lib/theme.js";
import { todayISO } from "../lib/calc.js";

export default function AddSheet({ categories, accounts, defaultAccountId, onClose, onSave }) {
  const [ttype, setTtype] = useState("depense");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [catId, setCatId] = useState(categories.find((c) => c.key !== "salaire")?.id ?? null);
  const [accountId, setAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const salaireCat = categories.find((c) => c.key === "salaire");
  const pickableCats = categories.filter((c) => c.key !== "salaire");

  async function save() {
    const amt = parseFloat(String(amount).replace(",", "."));
    if (!amt || amt <= 0) {
      setError("Entre un montant 🙂");
      return;
    }
    if (!accountId) {
      setError("Choisis un compte");
      return;
    }
    setSaving(true);
    try {
      const fallback = ttype === "revenu" ? "Entrée" : pickableCats.find((c) => c.id === catId)?.label || "Dépense";
      await onSave({
        label: label.trim() || fallback,
        category_id: ttype === "revenu" ? salaireCat?.id ?? null : catId,
        account_id: accountId,
        amount: amt,
        type: ttype,
        date: todayISO(),
      });
    } catch (e) {
      setError(e.message || "Erreur");
      setSaving(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,20,10,.35)", zIndex: 50 }} />
      <div
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: 0,
          width: "100%",
          maxWidth: 480,
          zIndex: 51,
          background: color.surface,
          borderRadius: "30px 30px 0 0",
          padding: "10px 22px calc(24px + env(safe-area-inset-bottom))",
          animation: "sheetUp .32s cubic-bezier(.2,.9,.3,1) both",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 42, height: 5, borderRadius: 3, background: "#E2D6C6", margin: "0 auto 16px" }} />
        <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 20, color: color.ink, marginBottom: 4 }}>Ajouter en 5 secondes</div>
        <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 12.5, color: color.mutedLight, marginBottom: 16 }}>
          La saisie rapide, c'est le secret pour tenir 💪
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setTtype("depense")}
            style={{
              flex: 1, border: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13,
              padding: 11, borderRadius: 13,
              background: ttype === "depense" ? "#FFEDE6" : "#fff",
              color: ttype === "depense" ? color.orangeDeep : color.mutedLight,
            }}
          >
            Dépense
          </button>
          <button
            onClick={() => setTtype("revenu")}
            style={{
              flex: 1, border: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13,
              padding: 11, borderRadius: 13,
              background: ttype === "revenu" ? color.greenSoft : "#fff",
              color: ttype === "revenu" ? color.greenDark : color.mutedLight,
            }}
          >
            Entrée
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
            inputMode="decimal"
            placeholder="0"
            autoFocus
            style={{ flex: 1, border: "none", outline: "none", fontFamily: font.display, fontWeight: 600, fontSize: 34, color: color.ink, background: "none", width: "100%" }}
          />
          <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: 28, color: color.faint }}>€</span>
        </div>

        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={ttype === "revenu" ? "Libellé (optionnel, ex. Prime, Remboursement…)" : "Libellé (optionnel, ex. Courses Lidl…)"}
          style={{ width: "100%", border: `1.5px solid ${color.border}`, background: "#fff", borderRadius: 14, padding: "11px 14px", fontFamily: font.body, fontWeight: 500, fontSize: 13.5, color: color.ink, outline: "none", marginBottom: 14, boxSizing: "border-box" }}
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[10, 20, 50].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              style={{ flex: 1, border: `1.5px solid ${color.border}`, background: "#fff", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13, padding: 9, borderRadius: 12, color: color.inkSoft }}
            >
              +{v} €
            </button>
          ))}
        </div>

        {ttype === "depense" && (
          <>
            <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 11, color: color.mutedLight, marginBottom: 8 }}>CATÉGORIE</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {pickableCats.map((c) => {
                const on = catId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCatId(c.id)}
                    style={{
                      border: `1.5px solid ${on ? c.color : color.border}`,
                      background: on ? c.soft : "#fff",
                      cursor: "pointer",
                      fontFamily: font.body,
                      fontWeight: 600,
                      fontSize: 12.5,
                      padding: "8px 12px",
                      borderRadius: 12,
                      color: on ? c.color : color.inkSoft,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{c.emoji}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 11, color: color.mutedLight, marginBottom: 8 }}>COMPTE</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {accounts.map((a) => {
            const on = accountId === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAccountId(a.id)}
                style={{
                  flex: "1 1 30%",
                  border: `1.5px solid ${on ? color.green : color.border}`,
                  background: on ? color.greenSoft : "#fff",
                  cursor: "pointer",
                  fontFamily: font.body,
                  fontWeight: 600,
                  fontSize: 11.5,
                  padding: "9px 4px",
                  borderRadius: 12,
                  color: on ? color.greenDark : color.inkSoft,
                }}
              >
                {a.name}
              </button>
            );
          })}
        </div>

        {error && <div style={{ color: color.red, fontFamily: font.body, fontWeight: 600, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

        <button
          onClick={save}
          disabled={saving}
          style={{
            width: "100%", border: "none", cursor: saving ? "default" : "pointer", fontFamily: font.display, fontWeight: 600,
            fontSize: 16, padding: 15, borderRadius: 16, background: color.green, color: "#fff", opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "…" : ttype === "revenu" ? "Ajouter l'entrée" : "Ajouter la dépense"}
        </button>
      </div>
    </>
  );
}
