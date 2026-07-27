# Budget Tracker

Ton budget perso, pensé pour t'empêcher de découvrir le découvert le 28 du mois : vue consolidée de tes comptes, projection de fin de mois, alertes proactives, abonnements, paiements en plusieurs fois, prévision multi-mois et plan de dépenses 50/30/20.

Implémentation de la maquette [Claude Design](https://claude.ai/design) `Budget.dc.html`, en React (frontend) + Express/SQLite (backend), avec mot de passe unique et persistance en base — pas de compte multi-utilisateur, c'est un outil perso.

## Structure

```
server/   API Express + SQLite (better-sqlite3)
web/      Frontend React + Vite
```

## Développement local

Terminal 1 — API :
```
cd server
npm install
APP_PASSWORD=devpassword npm run dev
```

Terminal 2 — frontend (proxy `/api` vers `localhost:3000`) :
```
cd web
npm install
npm run dev
```

Ouvre `http://localhost:5173`, connecte-toi avec `devpassword`.

Au premier lancement, l'app démarre **vide** : va dans les réglages (icône renard 🦊 sur l'accueil) pour ajouter tes comptes, ton salaire, ton seuil d'alerte et tes budgets par catégorie.

## Déploiement avec Docker

1. Copie `.env.example` en `.env` et renseigne `APP_PASSWORD` et `SESSION_SECRET` (génère ce dernier avec `openssl rand -hex 32`).
2. Lance :
   ```
   docker compose up -d --build
   ```
3. L'app est servie sur `http://<host>:3000` (ou le port choisi via `HOST_PORT`).

Les données SQLite sont persistées dans le volume Docker `budget-data` — elles survivent aux redéploiements/`docker compose down` (tant que tu ne fais pas `docker compose down -v`).

### Derrière un reverse proxy (recommandé pour un accès distant)

Le cookie de session est marqué `Secure` en production : il ne circule qu'en HTTPS. Mets l'app derrière un reverse proxy qui termine le TLS (Caddy, Nginx, Traefik) et proxy-passe vers `localhost:3000`. Exemple minimal avec [Caddy](https://caddyserver.com/) :

```
budget.example.com {
    reverse_proxy localhost:3000
}
```

Si tu testes en HTTP simple (pas de TLS, accès local ou par IP), décommente `DISABLE_SECURE_COOKIE=1` dans `.env` sinon la connexion ne persistera pas.

## Sauvegarde

La base SQLite vit dans le volume `budget-data`. Pour sauvegarder :
```
docker compose exec budget-tracker sh -c "sqlite3 /app/server/data/budget.sqlite '.backup /app/server/data/backup.sqlite'"
docker cp $(docker compose ps -q budget-tracker):/app/server/data/backup.sqlite ./backup-$(date +%F).sqlite
```

## Sécurité

- Mot de passe unique (pas de comptes multiples), protège l'accès à l'app.
- Session par cookie signé HMAC, httpOnly, `Secure` en production.
- Aucune donnée n'est envoyée à un tiers : tout reste dans ta base SQLite auto-hébergée.
