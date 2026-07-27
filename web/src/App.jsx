import { useEffect, useMemo, useState, useCallback } from "react";
import { color } from "./lib/theme.js";
import { api } from "./lib/api.js";
import { simulateAccount, accountAlert } from "./lib/calc.js";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Accounts from "./pages/Accounts.jsx";
import Forecast from "./pages/Forecast.jsx";
import Plan from "./pages/Plan.jsx";
import Settings from "./pages/Settings.jsx";
import BottomNav from "./components/BottomNav.jsx";
import AddSheet from "./components/AddSheet.jsx";
import Toast from "./components/Toast.jsx";
import { Spinner } from "./components/ui.jsx";

export default function App() {
  const [authState, setAuthState] = useState("checking"); // checking | out | in
  const [tab, setTab] = useState("accueil");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const loadData = useCallback(async () => {
    const [accounts, categories, transactions, subscriptions, installments, settings] = await Promise.all([
      api.accounts.list(),
      api.categories.list(),
      api.transactions.list({ limit: 500 }),
      api.subscriptions.list(),
      api.installments.list(),
      api.settings.get(),
    ]);
    setData({ accounts, categories, transactions, subscriptions, installments, settings });
  }, []);

  useEffect(() => {
    api.me().then((r) => {
      setAuthState(r.authenticated ? "in" : "out");
    }).catch(() => setAuthState("out"));
  }, []);

  useEffect(() => {
    if (authState === "in") loadData().catch(() => {});
  }, [authState, loadData]);

  const sims = useMemo(() => {
    if (!data) return {};
    const out = {};
    for (const account of data.accounts) {
      const sim = simulateAccount({
        account,
        transactions: data.transactions,
        categories: data.categories,
        subscriptions: data.subscriptions,
        installments: data.installments,
        seuil: data.settings.seuil,
      });
      const alert = accountAlert({ account, simulation: sim, seuil: data.settings.seuil, anticipationDays: data.settings.anticipation_days });
      out[account.id] = { ...sim, alert };
    }
    return out;
  }, [data]);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), 2200);
  }

  async function handleAddTransaction(payload) {
    await api.transactions.create(payload);
    await loadData();
    setAddOpen(false);
    showToast("Opération ajoutée ✓");
  }

  async function handleLogout() {
    await api.logout();
    setAuthState("out");
    setData(null);
  }

  if (authState === "checking") {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: color.bg }}>
        <Spinner />
      </div>
    );
  }

  if (authState === "out") {
    return <Login onLoggedIn={() => setAuthState("in")} />;
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: color.bg }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        height: "100dvh",
        maxWidth: 480,
        margin: "0 auto",
        background: color.surface,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 0 60px rgba(60,40,20,.06)",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 18px 24px" }}>
        {settingsOpen ? (
          <Settings data={data} reload={loadData} onClose={() => setSettingsOpen(false)} onLogout={handleLogout} />
        ) : (
          <>
            {tab === "accueil" && <Home data={data} sims={sims} onOpenSettings={() => setSettingsOpen(true)} onGoTab={setTab} onSelectAccount={setSelectedAccountId} />}
            {tab === "comptes" && <Accounts data={data} sims={sims} onOpenSettings={() => setSettingsOpen(true)} selected={selectedAccountId} onSelect={setSelectedAccountId} />}
            {tab === "prevoir" && <Forecast data={data} sims={sims} reload={loadData} />}
            {tab === "plan" && <Plan data={data} />}
          </>
        )}
      </div>

      {!settingsOpen && <BottomNav tab={tab} onChange={setTab} onAdd={() => setAddOpen(true)} />}

      {addOpen && data.accounts.length > 0 && (
        <AddSheet
          categories={data.categories}
          accounts={data.accounts}
          onClose={() => setAddOpen(false)}
          onSave={handleAddTransaction}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
