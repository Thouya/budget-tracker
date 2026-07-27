// Builds the copy-pasteable prompt that lets a Claude chat turn bank
// screenshots into JSON ready for this app's import endpoint. Keeping the
// user's real account names / category keys in the prompt means Claude
// references identifiers that will actually resolve on import.

export function buildExportPrompt(data) {
  const { accounts, categories } = data;

  const accountList = accounts.length
    ? accounts.map((a) => `- "${a.name}"`).join("\n")
    : "- (aucun compte pour l'instant — ajoute-en dans les réglages avant d'importer des transactions)";

  const categoryList = categories
    .filter((c) => c.key !== "salaire")
    .map((c) => `- ${c.key} (${c.label})`)
    .join("\n");

  return `Je gère mon budget avec une app perso. Je vais te montrer des captures d'écran de virements ou de relevés bancaires : à chaque fois, extrais les lignes et réponds UNIQUEMENT avec un objet JSON valide (pas de texte autour, pas de bloc markdown), au format ci-dessous, que je collerai directement dans la zone d'import de l'app.

Comptes existants (utilise exactement ces noms dans le champ "account") :
${accountList}

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
      "category": "courses",
      "account": "Nom exact du compte"
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
