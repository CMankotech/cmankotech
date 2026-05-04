# Proxy — Cloudflare Worker

Proxy serverless qui sécurise la communication entre le frontend et l'API Groq. La clé API n'est jamais exposée côté client.

Le Worker contient aussi l'orchestration native du widget KRL1 et le pipeline RAG sémantique via Workers AI.

## Routes

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/` | Proxy pass-through vers Groq (legacy) |
| `POST` | `/orchestrate` | Orchestrateur 2 étapes : planner → synthesis |
| `POST` | `/orchestrate-stream` | Version streaming (SSE) de l'orchestrateur |
| `POST` | `/rag-query` | Recherche sémantique dans la base de connaissances PM, puis synthèse LLM |
| `GET` | `/stats` | Statistiques d'utilisation publiques |

## Orchestrateur intégré

Le Worker embarque un orchestrateur à deux nœuds :

1. **Planner** — Classifie l'intent utilisateur (temp=0.2, 500 tokens max)
2. **Synthesis** — Génère une réponse actionnable avec liens vers les outils (temp=0.45, 450 tokens)

Si `LANGGRAPH_ORCHESTRATOR_URL` est configurée, le Worker peut déléguer `/orchestrate` au service Python LangGraph externe. Sinon, l'orchestration native du Worker est utilisée.

## RAG sémantique

`POST /rag-query` utilise Workers AI (`@cf/baai/bge-small-en-v1.5`) pour générer l'embedding de la requête, compare ce vecteur à la base PM embarquée dans le Worker, puis transmet le contexte retenu à Groq pour produire une réponse courte et actionnable.

## Sécurité

- Validation de l'origine (whitelist : `https://cmankotech.github.io`)
- Headers CORS configurés pour l'origine autorisée uniquement
- Clé API injectée côté serveur via les secrets Cloudflare

## Configuration

Variables d'environnement (secrets Cloudflare) :

- `GROQ_KEY` — Clé API Groq (obligatoire)
- `LANGGRAPH_ORCHESTRATOR_URL` — URL de l'orchestrateur LangGraph optionnel, par exemple `https://example.com/orchestrate`

KV Namespace :

- `USAGE_COUNTER` — Compteur d'utilisation (incrémenté de façon asynchrone via `ctx.waitUntil()`)

Bindings Cloudflare :

- `AI` — binding Workers AI requis pour `/rag-query`

## Développement

```bash
cd proxy
npx wrangler dev --config wrangler.toml
```

## Tests

Depuis la racine du dépôt :

```bash
node --test tests/proxy.test.mjs
```

## Déploiement

Depuis la racine du dépôt :

```bash
npx wrangler deploy --config proxy/wrangler.toml
```
