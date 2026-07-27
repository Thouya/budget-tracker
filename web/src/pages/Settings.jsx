import { useState } from "react";
import { color, font } from "../lib/theme.js";
import { fmt0 } from "../lib/theme.js";
import { Card, Avatar, PrimaryButton } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { buildExportPrompt, parseImportJson } from "../lib/importExport.js";

const inputStyle = { width: "100%", border: `1.5px solid ${color.border}`, background: "#fff", borderRadius: 10, padding: "9px 10px", fontFamily: font.body, fontSize: 13.5, color: color.ink, outline: "none" };
const ACCOUNT_EMOJIS = ["🏦", "💙", "📈", "💰", "🐷", "💳"];
const ACCOUNT_COLORS = [
  { soft: "#E9F0FE", color: "#5B8DEF" },
  { soft: "#E2F7F9", color: "#14B8C4" },
  { soft: "#F0E9FE", color: "#9B6BEF" },
  { soft: "#FFEDE6", color: "#FF7A59" },
  { soft: "#E5F7EF", color: "#21C08A" },
];

export default function Settings({ data, reload, onClose, onLogout }) {
  const { accounts, categories, settings } = data;

  return (
    <div style={{ animation: "fadeUp .35s ease both", paddingBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 4px 18px" }}>
        <button onClick={onClose} aria-label="Fermer" style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: color.ink, padding: 0 }}>←</button>
        <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 20, color: color.ink }}>Réglages</div>
      </div>

      <GeneralSettings settings={settings} reload={reload} />
      <AccountsSettings accounts={accounts} reload={reload} />
      <CategoriesSettings categories={categories} reload={reload} />
      <ImportExportSettings data={data} reload={reload} />

      <button
        onClick={onLogout}
        style={{ width: "100%", marginTop: 20, border: `1.5px solid ${color.border}`, background: "#fff", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13, padding: 12, borderRadius: 14, color: color.red }}
      >
        Se déconnecter
      </button>
    </div>
  );
}

function GeneralSettings({ settings, reload }) {
  const [form, setForm] = useState({
    salaire: String(settings.salaire ?? ""),
    seuil: String(settings.seuil ?? ""),
    anticipation_days: String(settings.anticipation_days ?? ""),
    savings_target_pct: String(settings.savings_target_pct ?? ""),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api.settings.update({
        salaire: parseFloat(form.salaire.replace(",", ".")) || 0,
        seuil: parseFloat(form.seuil.replace(",", ".")) || 0,
        anticipation_days: Number(form.anticipation_days) || 0,
        savings_target_pct: parseFloat(form.savings_target_pct.replace(",", ".")) || 0,
      });
      setSaved(true);
      reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionLabel>Général</SectionLabel>
      <Card style={{ padding: 16, marginBottom: 20 }}>
        <FieldRow label="Salaire net mensuel (€)"><input value={form.salaire} onChange={(e) => setForm({ ...form, salaire: e.target.value.replace(/[^0-9.,]/g, "") })} style={inputStyle} /></FieldRow>
        <FieldRow label="Seuil plancher par défaut (€)"><input value={form.seuil} onChange={(e) => setForm({ ...form, seuil: e.target.value.replace(/[^0-9.,]/g, "") })} style={inputStyle} /></FieldRow>
        <FieldRow label="Anticipation des alertes (jours)"><input value={form.anticipation_days} onChange={(e) => setForm({ ...form, anticipation_days: e.target.value.replace(/[^0-9]/g, "") })} style={inputStyle} /></FieldRow>
        <FieldRow label="Cible d'épargne (% du salaire)"><input value={form.savings_target_pct} onChange={(e) => setForm({ ...form, savings_target_pct: e.target.value.replace(/[^0-9.,]/g, "") })} style={inputStyle} /></FieldRow>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
          <PrimaryButton onClick={save} disabled={saving} style={{ padding: "10px 16px", fontSize: 13.5 }}>{saving ? "…" : "Enregistrer"}</PrimaryButton>
          {saved && <span style={{ fontFamily: font.body, fontSize: 12, color: color.greenDark }}>Enregistré ✓</span>}
        </div>
      </Card>
    </>
  );
}

function AccountsSettings({ accounts, reload }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  async function remove(id) {
    if (!confirm("Supprimer ce compte et son historique ?")) return;
    await api.accounts.remove(id);
    reload();
  }

  return (
    <>
      <SectionLabel>Comptes</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
        {accounts.map((a) =>
          editingId === a.id ? (
            <AccountForm key={a.id} initial={a} onCancel={() => setEditingId(null)} onSaved={() => { setEditingId(null); reload(); }} />
          ) : (
            <Card key={a.id} style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar bg={a.soft} size={38} radius={11} fontSize={17}>{a.emoji}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 13.5, color: color.ink }}>{a.name}</div>
                <div style={{ fontFamily: font.body, fontWeight: 500, fontSize: 11.5, color: color.mutedLight }}>{a.bank} · {fmt0(a.balance)}{a.watch_overdraft ? " · surveillé" : ""}</div>
              </div>
              <button onClick={() => setEditingId(a.id)} style={linkBtn}>Modifier</button>
              <button onClick={() => remove(a.id)} style={{ ...linkBtn, color: color.red }}>Suppr.</button>
            </Card>
          )
        )}
      </div>
      {adding ? (
        <AccountForm onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />
      ) : (
        <AddLink onClick={() => setAdding(true)}>+ Ajouter un compte</AddLink>
      )}
      <div style={{ height: 20 }} />
    </>
  );
}

function AccountForm({ initial, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [bank, setBank] = useState(initial?.bank ?? "");
  const [balance, setBalance] = useState(String(initial?.balance ?? "0"));
  const [seuil, setSeuil] = useState(initial?.seuil != null ? String(initial.seuil) : "");
  const [watch, setWatch] = useState(!!initial?.watch_overdraft);
  const [emoji, setEmoji] = useState(initial?.emoji ?? ACCOUNT_EMOJIS[0]);
  const [palette, setPalette] = useState(() => ACCOUNT_COLORS.findIndex((c) => c.color === initial?.color) ?? 0);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Le nom est requis."); return; }
    const p = ACCOUNT_COLORS[Math.max(0, palette)];
    const payload = {
      name: name.trim(), bank, emoji, color: p.color, soft: p.soft,
      balance: parseFloat(balance.replace(",", ".")) || 0,
      seuil: seuil === "" ? null : parseFloat(seuil.replace(",", ".")),
      watch_overdraft: watch ? 1 : 0,
    };
    try {
      if (initial) await api.accounts.update(initial.id, payload);
      else await api.accounts.create(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Card style={{ padding: 16, marginBottom: 10 }}>
      <form onSubmit={submit}>
        <FieldRow label="Nom"><input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="LBP Courant" /></FieldRow>
        <FieldRow label="Banque"><input value={bank} onChange={(e) => setBank(e.target.value)} style={inputStyle} placeholder="La Banque Postale" /></FieldRow>
        <FieldRow label="Solde actuel (€)"><input value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^0-9.,-]/g, ""))} style={inputStyle} /></FieldRow>
        <FieldRow label="Seuil plancher (optionnel, sinon seuil par défaut)"><input value={seuil} onChange={(e) => setSeuil(e.target.value.replace(/[^0-9.,]/g, ""))} style={inputStyle} placeholder="100" /></FieldRow>
        <FieldRow label="Icône">
          <div style={{ display: "flex", gap: 6 }}>
            {ACCOUNT_EMOJIS.map((em) => (
              <button type="button" key={em} onClick={() => setEmoji(em)} style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${emoji === em ? color.green : color.border}`, background: emoji === em ? color.greenSoft : "#fff", fontSize: 16, cursor: "pointer" }}>{em}</button>
            ))}
          </div>
        </FieldRow>
        <FieldRow label="Couleur">
          <div style={{ display: "flex", gap: 6 }}>
            {ACCOUNT_COLORS.map((c, i) => (
              <button type="button" key={i} onClick={() => setPalette(i)} style={{ width: 26, height: 26, borderRadius: "50%", border: palette === i ? `2px solid ${color.ink}` : "2px solid transparent", background: c.color, cursor: "pointer" }} />
            ))}
          </div>
        </FieldRow>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: font.body, fontSize: 12.5, color: color.inkSoft, marginBottom: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={watch} onChange={(e) => setWatch(e.target.checked)} />
          Surveiller les alertes de découvert sur ce compte
        </label>
        {error && <div style={{ color: color.red, fontFamily: font.body, fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
        <FormActions onCancel={onCancel} />
      </form>
    </Card>
  );
}

function CategoriesSettings({ categories, reload }) {
  const editable = categories.filter((c) => c.key !== "salaire");
  return (
    <>
      <SectionLabel>Budgets par catégorie</SectionLabel>
      <Card style={{ padding: "6px 16px", marginBottom: 20 }}>
        {editable.map((c) => (
          <CategoryRow key={c.id} category={c} reload={reload} />
        ))}
      </Card>
    </>
  );
}

function CategoryRow({ category, reload }) {
  const [value, setValue] = useState(String(category.monthly_budget));
  const [saving, setSaving] = useState(false);

  async function commit() {
    const budget = parseFloat(value.replace(",", ".")) || 0;
    if (budget === category.monthly_budget) return;
    setSaving(true);
    try {
      await api.categories.update(category.id, { monthly_budget: budget });
      reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${color.line}` }}>
      <Avatar bg={category.soft} size={32} radius={10} fontSize={15}>{category.emoji}</Avatar>
      <div style={{ flex: 1, fontFamily: font.body, fontWeight: 600, fontSize: 13.5, color: color.ink }}>{category.label}</div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9.,]/g, ""))}
        onBlur={commit}
        style={{ width: 84, textAlign: "right", border: `1.5px solid ${color.border}`, borderRadius: 8, padding: "6px 8px", fontFamily: font.body, fontWeight: 600, fontSize: 13, color: color.ink, outline: "none", opacity: saving ? 0.6 : 1 }}
      />
      <span style={{ fontFamily: font.body, fontSize: 12, color: color.faint }}>€/mois</span>
    </div>
  );
}

function ImportExportSettings({ data, reload }) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function openPrompt() {
    setPrompt(buildExportPrompt(data));
    setPromptOpen(true);
    setCopied(false);
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setError("Impossible de copier automatiquement — sélectionne le texte à la main.");
    }
  }

  async function runImport() {
    setError("");
    setResult(null);
    let payload;
    try {
      payload = parseImportJson(importText);
    } catch (e) {
      setError(e.message);
      return;
    }
    setImporting(true);
    try {
      const res = await api.import(payload);
      setResult(res);
      setImportText("");
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <SectionLabel>Import / Export</SectionLabel>
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 13.5, color: color.ink, marginBottom: 4 }}>
          Exporter un prompt pour Claude
        </div>
        <div style={{ fontFamily: font.body, fontSize: 12, color: color.mutedLight, lineHeight: 1.4, marginBottom: 10 }}>
          Génère un texte à coller dans une conversation Claude : montre-lui ensuite tes captures d'écran de virements, il te renverra du JSON prêt à importer ci-dessous.
        </div>
        {!promptOpen ? (
          <button onClick={openPrompt} style={{ border: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13, padding: "10px 16px", borderRadius: 12, background: color.purple, color: "#fff" }}>
            Générer le prompt
          </button>
        ) : (
          <>
            <textarea
              readOnly
              value={prompt}
              rows={6}
              style={{ width: "100%", border: `1.5px solid ${color.border}`, borderRadius: 10, padding: 10, fontFamily: "ui-monospace, monospace", fontSize: 11.5, color: color.inkSoft, background: color.surface, resize: "vertical", marginBottom: 8 }}
            />
            <button onClick={copyPrompt} style={{ border: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13, padding: "9px 14px", borderRadius: 12, background: copied ? color.greenSoft : color.purple, color: copied ? color.greenDark : "#fff" }}>
              {copied ? "Copié ✓" : "Copier"}
            </button>
          </>
        )}
      </Card>

      <Card style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: font.body, fontWeight: 600, fontSize: 13.5, color: color.ink, marginBottom: 4 }}>Importer du JSON</div>
        <div style={{ fontFamily: font.body, fontSize: 12, color: color.mutedLight, lineHeight: 1.4, marginBottom: 10 }}>
          Colle ici le JSON généré par Claude (ou écrit à la main) — accepte <code>transactions</code>, <code>subscriptions</code>, <code>installments</code>, <code>accounts</code>, <code>categories</code>.
        </div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={6}
          placeholder='{ "transactions": [ ... ] }'
          style={{ width: "100%", border: `1.5px solid ${color.border}`, borderRadius: 10, padding: 10, fontFamily: "ui-monospace, monospace", fontSize: 12, color: color.ink, background: "#fff", resize: "vertical", marginBottom: 10 }}
        />
        {error && <div style={{ color: color.red, fontFamily: font.body, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
        {result && (
          <div style={{ background: color.greenSoft, borderRadius: 10, padding: "10px 12px", marginBottom: 10, fontFamily: font.body, fontSize: 12.5, color: color.greenDark, lineHeight: 1.5 }}>
            {result.transactionsAdded > 0 && <div>{result.transactionsAdded} transaction(s) ajoutée(s)</div>}
            {result.accountsCreated > 0 && <div>{result.accountsCreated} compte(s) créé(s)</div>}
            {result.categoriesUpdated > 0 && <div>{result.categoriesUpdated} budget(s) de catégorie mis à jour</div>}
            {result.subscriptionsAdded > 0 && <div>{result.subscriptionsAdded} abonnement(s) ajouté(s)</div>}
            {result.installmentsAdded > 0 && <div>{result.installmentsAdded} échéance(s) ajoutée(s)</div>}
            {!result.transactionsAdded && !result.accountsCreated && !result.categoriesUpdated && !result.subscriptionsAdded && !result.installmentsAdded && <div>Rien à importer trouvé dans ce JSON.</div>}
            {result.errors?.length > 0 && (
              <div style={{ marginTop: 6, color: color.orangeDeep }}>
                {result.errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
              </div>
            )}
          </div>
        )}
        <PrimaryButton onClick={runImport} disabled={importing} style={{ padding: "10px 16px", fontSize: 13.5 }}>
          {importing ? "…" : "Importer"}
        </PrimaryButton>
      </Card>
    </>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 11.5, color: color.mutedLight, letterSpacing: ".02em", margin: "0 4px 10px", textTransform: "uppercase" }}>{children}</div>;
}
function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: 11, color: color.mutedLight, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
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
const linkBtn = { border: "none", background: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 11.5, color: color.green, padding: "4px 2px" };
