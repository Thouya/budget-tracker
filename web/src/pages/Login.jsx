import { useState } from "react";
import { color, font } from "../lib/theme.js";
import { PrimaryButton } from "../components/ui.jsx";
import { api } from "../lib/api.js";

export default function Login({ onLoggedIn }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(password);
      onLoggedIn();
    } catch (e) {
      setError(e.status === 401 ? "Mot de passe incorrect." : e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: color.bg, padding: 20 }}>
      <form
        onSubmit={submit}
        style={{ width: "100%", maxWidth: 360, background: color.surface, borderRadius: 26, padding: 28, boxShadow: "0 20px 50px -20px rgba(60,40,20,.4)" }}
      >
        <div style={{ fontSize: 34, marginBottom: 8 }}>🦊</div>
        <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 22, color: color.ink, marginBottom: 4 }}>Ton budget, en un coup d'œil</div>
        <div style={{ fontFamily: font.body, fontSize: 13, color: color.muted, marginBottom: 20 }}>Entre le mot de passe pour continuer.</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
          style={{
            width: "100%", border: `1.5px solid ${color.border}`, background: "#fff", borderRadius: 14,
            padding: "13px 14px", fontFamily: font.body, fontSize: 15, color: color.ink, outline: "none", marginBottom: 12,
          }}
        />
        {error && <div style={{ color: color.red, fontFamily: font.body, fontWeight: 600, fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
        <PrimaryButton type="submit" style={{ width: "100%" }} disabled={loading}>
          {loading ? "…" : "Entrer"}
        </PrimaryButton>
      </form>
    </div>
  );
}
