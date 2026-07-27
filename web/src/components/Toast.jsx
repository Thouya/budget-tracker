import { font } from "../lib/theme.js";

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 108,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        background: "#2A241E",
        color: "#fff",
        fontFamily: font.body,
        fontWeight: 600,
        fontSize: 13,
        padding: "11px 18px",
        borderRadius: 14,
        animation: "toastIn .3s ease both",
        boxShadow: "0 10px 24px -10px rgba(0,0,0,.5)",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}
