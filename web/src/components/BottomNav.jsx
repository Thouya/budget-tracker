import { color, font } from "../lib/theme.js";

const TABS = [
  { key: "accueil", icon: "🏠", label: "Accueil" },
  { key: "comptes", icon: "💳", label: "Comptes" },
  { key: "prevoir", icon: "📊", label: "Prévoir" },
  { key: "plan", icon: "🎯", label: "Plan" },
];

export default function BottomNav({ tab, onChange, onAdd }) {
  return (
    <div
      style={{
        flex: "none",
        height: 84,
        background: "rgba(251,244,236,.92)",
        backdropFilter: "blur(12px)",
        borderTop: `1px solid #F0E6D9`,
        display: "flex",
        alignItems: "flex-start",
        padding: "11px 22px 0",
        zIndex: 20,
      }}
    >
      {TABS.map((t, i) => {
        const active = tab === t.key;
        const spacer = i === 1 ? { marginRight: 34 } : i === 2 ? { marginLeft: 34 } : {};
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "4px 0",
              ...spacer,
            }}
          >
            <span style={{ fontSize: 21, filter: active ? "none" : "grayscale(1) opacity(.55)" }}>{t.icon}</span>
            <span style={{ fontFamily: font.body, fontWeight: 700, fontSize: 10, color: active ? color.green : "#B0A392" }}>{t.label}</span>
          </button>
        );
      })}
      <button
        onClick={onAdd}
        aria-label="Ajouter une opération"
        style={{
          position: "absolute",
          bottom: 56,
          left: "50%",
          transform: "translateX(-50%)",
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: `linear-gradient(150deg, ${color.green}, ${color.greenDeep})`,
          border: `4px solid ${color.surface}`,
          cursor: "pointer",
          zIndex: 25,
          boxShadow: "0 12px 22px -8px rgba(23,184,144,.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 28,
          fontFamily: font.display,
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        +
      </button>
    </div>
  );
}
