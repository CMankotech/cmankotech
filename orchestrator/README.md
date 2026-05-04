# KRL1 LangGraph Orchestrator — prototype optionnel

Ce dossier contient le prototype Python/LangGraph initial de l'orchestrateur KRL1.

Il n'est pas nécessaire pour le site en production : l'orchestration et le RAG sémantique ont été portés dans le Cloudflare Worker (`proxy/src/index.js`). Ce service reste utile pour expérimenter avec LangGraph, LangSmith et une architecture Python externe.

Pour le connecter au Worker, déployez ce service séparément puis configurez le secret Cloudflare `LANGGRAPH_ORCHESTRATOR_URL` avec l'URL de son endpoint `/orchestrate`.

## Setup

```bash
cd orchestrator
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Variables d'environnement

- `GROQ_KEY` (obligatoire)
- `GROQ_MODEL` (optionnel, défaut: `llama-3.3-70b-versatile`)
- `GROQ_BASE_URL` (optionnel, défaut: `https://api.groq.com/openai/v1`)
- `LANGSMITH_API_KEY` (optionnel, recommandé pour traces/observabilité)
- `LANGCHAIN_TRACING_V2=true` (optionnel, recommandé)
- `LANGCHAIN_PROJECT=krl1-orchestrator` (optionnel)

## Lancer

```bash
uvicorn app:app --host 0.0.0.0 --port 8081 --reload
```

## Endpoints

- `GET /health`
- `POST /orchestrate`
- `POST /rag-query`

Exemple payload:

```json
{
  "lang": "fr",
  "message": "Je dois préparer ma roadmap Q3",
  "history": [{"role":"user","content":"Contexte SaaS B2B"}]
}
```

Réponse:

```json
{
  "reply": "...",
  "plan": {"intent":"..."},
  "engine": "langgraph"
}
```

## Statut

- **Production actuelle :** Cloudflare Worker natif (`proxy/`)
- **Ce dossier :** prototype / fallback expérimental non déployé par défaut
