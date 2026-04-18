# Proxy — Cloudflare Worker

Proxy serverless qui sécurise la communication entre le frontend et l'API Groq. La clé API n'est jamais exposée côté client.

## Routes

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/` | Proxy pass-through vers Groq (legacy) |
| `POST` | `/orchestrate` | Orchestrateur 2 étapes : planner → synthesis |
| `POST` | `/orchestrate-stream` | Version streaming (SSE) de l'orchestrateur |
| `GET` | `/stats` | Statistiques d'utilisation publiques |

## Orchestrateur intégré

Le Worker embarque un orchestrateur à deux nœuds :

1. **Planner** — Classifie l'intent utilisateur (temp=0.2, 500 tokens max)
2. **Synthesis** — Génère une réponse actionnable avec liens vers les outils (temp=0.45, 450 tokens)

Si une URL LangGraph est configurée, le Worker peut déléguer l'orchestration au service Python externe.

## Sécurité

- Validation de l'origine (whitelist : `https://cmankotech.github.io`)
- Headers CORS configurés pour l'origine autorisée uniquement
- Clé API injectée côté serveur via les secrets Cloudflare

## Configuration

Variables d'environnement (secrets Cloudflare) :

- `GROQ_KEY` — Clé API Groq (obligatoire)
- `LANGGRAPH_URL` — URL de l'orchestrateur LangGraph (optionnel)

KV Namespace :

- `USAGE_COUNTER` — Compteur d'utilisation (incrémenté de façon asynchrone via `ctx.waitUntil()`)

## Développement

```bash
cd proxy
npx wrangler dev
```

## Tests

```bash
node --test tests/proxy.test.mjs
```

## Déploiement

```bash
npx wrangler deploy
```
