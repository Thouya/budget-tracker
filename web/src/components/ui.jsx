import { color, font } from "../lib/theme.js";

export function Card({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: color.card,
        borderRadius: 22,
        boxShadow: "0 6px 18px -12px rgba(60,40,20,.4)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "22px 2px 12px" }}>
      <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 17, color: color.ink }}>{children}</div>
      {action}
    </div>
  );
}

export function ProgressBar({ pct, bg = color.green, trackHeight = 8 }) {
  return (
    <div style={{ height: trackHeight, borderRadius: 6, background: color.track, overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: 6, width: `${Math.max(0, Math.min(100, pct))}%`, background: bg, transition: "width .3s ease" }} />
    </div>
  );
}

export function Avatar({ children, bg, size = 42, radius = "50%", fontSize = 20 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        flex: "none",
      }}
    >
      {children}
    </div>
  );
}

export function Pill({ children, bg, fg }) {
  return (
    <span style={{ background: bg, color: fg, fontFamily: font.body, fontWeight: 700, fontSize: 10.5, padding: "4px 9px", borderRadius: 9 }}>
      {children}
    </span>
  );
}

export function PrimaryButton({ children, style, ...rest }) {
  return (
    <button
      style={{
        border: "none",
        cursor: "pointer",
        fontFamily: font.display,
        fontWeight: 600,
        fontSize: 15,
        padding: "13px 16px",
        borderRadius: 14,
        background: color.green,
        color: "#fff",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function EmptyState({ emoji = "🪴", title, sub, action }) {
  return (
    <div style={{ textAlign: "center", padding: "34px 18px", color: color.mutedLight }}>
      <div style={{ fontSize: 34, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, color: color.ink, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontFamily: font.body, fontSize: 13, lineHeight: 1.4, marginBottom: action ? 14 : 0 }}>{sub}</div>}
      {action}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: `3px solid ${color.track}`,
          borderTopColor: color.green,
          animation: "spin .7s linear infinite",
        }}
      />
    </div>
  );
}
