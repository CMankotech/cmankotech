# Proxy — Cloudflare Worker

Proxy serverless qui sécurise la communication entre le frontend et l'API Groq. La clé API n'est jamais exposée côté client.

Le Worker contient aussi l'orchestration native du widget KRL1, le pipeline RAG sémantique via Workers AI, la veille hebdo alimentée par Make et un pipeline feedback optionnel.

## Routes

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/` | Proxy pass-through vers Groq (legacy) |
| `POST` | `/orchestrate` | Orchestrateur 2 étapes : planner → synthesis |
| `POST` | `/orchestrate-stream` | Version streaming SSE de l'orchestrateur |
| `POST` | `/rag-query` | Recherche sémantique dans la base de connaissances PM, puis synthèse LLM |
| `POST` | `/feedback` | Classification feedback via Make si configuré, sinon fallback Groq |
| `GET` | `/veille` | Dernière veille hebdo stockée dans KV (ou édition spécifique via `?week=24&year=2026`) |
| `GET` | `/veille/history` | Liste des éditions disponibles (index des semaines stockées dans KV) |
| `POST` | `/veille-refresh` | Fetch les flux RSS directement depuis le Worker, synthétise via Groq et stocke dans KV |
| `POST` | `/veille` | Mise à jour directe de la veille par Make, protégée par `x-make-secret` |
| `POST` | `/veille-ingest` | Reçoit les articles bruts de Make, synthétise chaque catégorie via Groq, stocke dans KV |
| `GET` | `/stats` | Statistiques d'utilisation publiques |

## Orchestrateur intégré

Le Worker embarque un orchestrateur à deux nœuds :

1. **Planner** — Classifie l'intent utilisateur (temp=0.2, 500 tokens max)
2. **Synthesis** — Génère une réponse actionnable avec liens vers les outils (temp=0.45, 450 tokens)

Si `LANGGRAPH_ORCHESTRATOR_URL` est configurée, le Worker peut déléguer `/orchestrate` au service Python LangGraph externe. Sinon, l'orchestration native du Worker est utilisée.

## RAG sémantique

`POST /rag-query` utilise Workers AI (`@cf/baai/bge-small-en-v1.5`) pour générer l'embedding de la requête, compare ce vecteur à la base PM embarquée dans le Worker, puis transmet le contexte retenu à Groq pour produire une réponse courte et actionnable.

## Veille hebdo

`GET /veille` expose publiquement la dernière édition de veille stockée dans KV.

`POST /veille` est appelé par Make et nécessite le header `x-make-secret`. Le payload reçu est stocké tel quel dans `VEILLE_STORE` sous la clé `veille_latest`.

`POST /veille-ingest` est la route principale utilisée par Make. Elle reçoit les articles bruts par catégorie (format `titre|url` séparé par `\n`), synthétise chaque catégorie via Groq (`llama-3.3-70b-versatile`, 2 phrases en français, temp=0.4), puis stocke le résultat structuré avec `updated_at`, `week` et les `categories` dans `VEILLE_STORE`.

## Feedback

`POST /feedback` envoie le feedback au webhook Make si `MAKE_WEBHOOK_URL` est configurée. Si Make est indisponible ou non configuré, le Worker utilise Groq pour catégoriser le message et retourne une réponse structurée.

## Observabilité

Langfuse est optionnel. Si `LANGFUSE_PUBLIC_KEY` et `LANGFUSE_SECRET_KEY` sont configurées, le Worker envoie les traces d'orchestration de façon non bloquante via `ctx.waitUntil()`.

## Sécurité

- Validation de l'origine pour les routes POST publiques du frontend (`https://cmankotech.github.io`)
- Headers CORS configurés pour l'origine autorisée uniquement
- Clé Groq injectée côté serveur via les secrets Cloudflare
- `POST /veille` protégé par secret partagé Make

## Configuration

Variables d'environnement (secrets Cloudflare) :

- `GROQ_KEY` — Clé API Groq (obligatoire)
- `LANGGRAPH_ORCHESTRATOR_URL` — URL de l'orchestrateur LangGraph optionnel, par exemple `https://example.com/orchestrate`
- `MAKE_SECRET` — secret partagé requis pour `POST /veille`
- `MAKE_WEBHOOK_URL` — webhook Make optionnel pour `/feedback`
- `LANGFUSE_PUBLIC_KEY` — clé publique Langfuse optionnelle
- `LANGFUSE_SECRET_KEY` — clé secrète Langfuse optionnelle

KV Namespaces :

- `USAGE_COUNTER` — Compteur d'utilisation incrémenté de façon asynchrone
- `VEILLE_STORE` — Stockage de la dernière veille hebdomadaire

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
