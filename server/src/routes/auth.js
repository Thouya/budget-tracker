import { Router } from "express";
import { checkPassword, issueSession, clearSession, isAuthenticated } from "../auth.js";

const router = Router();

router.post("/login", (req, res) => {
  const { password } = req.body || {};
  if (!process.env.APP_PASSWORD) {
    return res.status(500).json({ error: "APP_PASSWORD is not configured on the server" });
  }
  if (!checkPassword(password)) {
    return res.status(401).json({ error: "wrong password" });
  }
  issueSession(res);
  res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  res.json({ authenticated: isAuthenticated(req) });
});

export default router;
