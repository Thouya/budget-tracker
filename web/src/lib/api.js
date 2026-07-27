const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) });
const del = (path) => request(path, { method: "DELETE" });

export const api = {
  me: () => get("/auth/me"),
  login: (password) => post("/auth/login", { password }),
  logout: () => post("/auth/logout", {}),

  settings: {
    get: () => get("/settings"),
    update: (patch) => put("/settings", patch),
  },
  accounts: {
    list: () => get("/accounts"),
    create: (data) => post("/accounts", data),
    update: (id, data) => put(`/accounts/${id}`, data),
    remove: (id) => del(`/accounts/${id}`),
  },
  categories: {
    list: () => get("/categories"),
    create: (data) => post("/categories", data),
    update: (id, data) => put(`/categories/${id}`, data),
    remove: (id) => del(`/categories/${id}`),
  },
  transactions: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return get(`/transactions${qs ? "?" + qs : ""}`);
    },
    create: (data) => post("/transactions", data),
    remove: (id) => del(`/transactions/${id}`),
  },
  subscriptions: {
    list: () => get("/subscriptions"),
    create: (data) => post("/subscriptions", data),
    update: (id, data) => put(`/subscriptions/${id}`, data),
    remove: (id) => del(`/subscriptions/${id}`),
  },
  installments: {
    list: () => get("/installments"),
    create: (data) => post("/installments", data),
    update: (id, data) => put(`/installments/${id}`, data),
    remove: (id) => del(`/installments/${id}`),
  },
};
