// Builds the copy-pasteable prompt that lets a Claude chat turn bank
// screenshots into JSON ready for this app's import endpoint. Keeping the
// user's real account names / category keys in the prompt means Claude
// references identifiers that will actually resolve on import.

export function buildExportPrompt(data, options = {}) {
  const { accounts, categories } = data;
  const { accountName, periodFrom, periodTo } = options;

  const accountList = accounts.length
    ? accounts.map((a) => `- "${a.name}"`).join("\n")
    : "- (aucun compte pour l'instant — ajoute-en dans les réglages avant d'importer des transactions)";

  const categoryList = categories
    .filter((c) => c.key !== "salaire")
    .map((c) => `- ${c.key} (${c.label})`)
    .join("\n");

  const accountSection = accountName
    ? `Compte concerné : "${accountName}" — mets "account": "${accountName}" sur toutes les lignes (ou omets carrément le champ, l'app appliquera ce compte par défaut à l'import).`
    : `Comptes existants (utilise exactement l'un de ces noms dans le champ "account" de chaque ligne) :\n${accountList}`;

  const periodSection = periodFrom || periodTo
    ? `\nPériode concernée : du ${periodFrom || "…"} au ${periodTo || "…"}. Toutes les dates extraites doivent tomber dans cette plage — si une date sur la capture semble en dehors, signale-le-moi au lieu de deviner.\n`
    : "";

  return `Je gère mon budget avec une app perso. Je vais te montrer des captures d'écran de virements ou de relevés bancaires : à chaque fois, extrais les lignes et réponds UNIQUEMENT avec un objet JSON valide (pas de texte autour, pas de bloc markdown), au format ci-dessous, que je collerai directement dans la zone d'import de l'app.

${accountSection}
${periodSection}
Catégories existantes (utilise exactement ces clés dans le champ "category", uniquement pour les dépenses) :
${categoryList}

Format JSON attendu :
{
  "transactions": [
    {
      "date": "AAAA-MM-JJ",
      "label": "Libellé court et clair",
      "amount": 12.34,
      "type": "depense",
      "category": "courses"${accountName ? "" : ',\n      "account": "Nom exact du compte"'}
    }
  ]
}

Règles :
- "amount" est toujours positif (le signe est déduit de "type": "depense" ou "revenu").
- Pour "revenu", omets "category" (l'app le classe automatiquement en salaire/entrée).
- Si une info manque sur la capture (catégorie ambiguë...), choisis la meilleure estimation plutôt que de laisser un champ vide.
- Si je te montre plusieurs captures dans la conversation, tu peux me redonner à chaque fois un JSON qui ne contient que les nouvelles lignes (je les importerai une par une), ou tout regrouper si je te le demande.

Important : l'import ajoute ces opérations à l'historique pour le suivi/catégorisation, mais ne modifie PAS le solde actuel des comptes (je l'ajuste moi-même dans les réglages si besoin) — donc pas d'inquiétude à avoir sur un double comptage.`;
}

export function parseImportJson(text) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Colle du JSON avant d'importer.");
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("JSON invalide — vérifie qu'il n'y a pas de texte en dehors des accolades.");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Le JSON doit être un objet avec des clés comme \"transactions\", \"subscriptions\", etc.");
  }
  return parsed;
}

const DATED_LISTS = ["transactions", "subscriptions", "installments"];
const ACCOUNT_FIELD = { transactions: "account", subscriptions: "account", installments: "account" };

/** Fill in a default account on rows that omit it, and drop rows whose date
 * falls outside the chosen period (installments use next_date). Returns the
 * adjusted payload plus a count of rows dropped for being out of range. */
export function applyImportDefaults(payload, { defaultAccount, periodFrom, periodTo }) {
  const out = { ...payload };
  let outOfRange = 0;

  for (const key of DATED_LISTS) {
    if (!Array.isArray(payload[key])) continue;
    const field = ACCOUNT_FIELD[key];
    out[key] = payload[key]
      .map((row) => (defaultAccount && !row[field] ? { ...row, [field]: defaultAccount } : row))
      .filter((row) => {
        if (!periodFrom && !periodTo) return true;
        const dateStr = key === "installments" ? row.next_date : row.date;
        if (!dateStr) return true; // nothing to check against, let the server validate
        if (periodFrom && dateStr < periodFrom) { outOfRange++; return false; }
        if (periodTo && dateStr > periodTo) { outOfRange++; return false; }
        return true;
      });
  }

  return { payload: out, outOfRange };
}
