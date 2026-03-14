# KRL1 LangGraph Orchestrator

Ce service fournit un endpoint `/orchestrate` basé sur **LangGraph** pour KRL1.

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
