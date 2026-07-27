import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import "./db.js";
import { requireAuth } from "./auth.js";
import authRoutes from "./routes/auth.js";
import settingsRoutes from "./routes/settings.js";
import accountsRoutes from "./routes/accounts.js";
import categoriesRoutes from "./routes/categories.js";
import transactionsRoutes from "./routes/transactions.js";
import subscriptionsRoutes from "./routes/subscriptions.js";
import installmentsRoutes from "./routes/installments.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(cookieParser());
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
}

app.use("/api/auth", authRoutes);
app.use("/api", requireAuth);
app.use("/api/settings", settingsRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/installments", installmentsRoutes);

const webDist = path.join(__dirname, "..", "..", "web", "dist");
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`budget-tracker server listening on :${PORT}`);
  if (!process.env.APP_PASSWORD) {
    console.warn("WARNING: APP_PASSWORD is not set — login will be disabled until you set it.");
  }
});
