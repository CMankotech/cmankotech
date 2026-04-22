# KRL1 — AI Product Management Portfolio

Portfolio interactif de **Carlin Mankoto**, AI Product Manager, intégrant une suite de projets : 6 outils IA pour le product management + 1 mini-jeu web.

**Live :** [cmankotech.github.io](https://cmankotech.github.io)

## Outils

| Outil | Description |
|---|---|
| **Backlog Prioritizer** | Priorisation de backlog via RICE ou MoSCoW |
| **Discovery Assistant** | Transformation de problèmes en hypothèses, questions d'interview et plans de test |
| **Epic → User Stories** | Décomposition d'epics en user stories avec critères d'acceptation (INVEST) |
| **OKR Builder** | Génération d'Objectives & Key Results à partir d'un contexte stratégique |
| **Roadmap Storyteller** | Transformation de listes de features en narratifs de roadmap adaptés à l'audience |
| **User Interview Analyzer** | Analyse d'interviews utilisateur : personas, pain points, opportunités |
| **Pixel Runner** | Mini-jeu arcade en JavaScript (esquive d'obstacles, score local) |

Chaque outil IA est une SPA autonome (HTML/CSS/JS vanilla), bilingue FR/EN. Le mini-jeu est aussi une page statique autonome.

## Architecture

```
┌─────────────────────────────────┐
│   GitHub Pages (frontend)       │
│   index.html + 7 projets HTML  │
│   krl1-widget.js (chat IA)     │
└──────────┬──────────────────────┘
           │ HTTPS
┌──────────▼──────────────────────┐
│   Cloudflare Worker (proxy/)    │
│   Sécurise les clés API        │
│   Orchestrateur planner→synth  │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│   Groq API (LLama 3.3 70B)     │
└─────────────────────────────────┘
           │ (optionnel)
┌──────────▼──────────────────────┐
│   LangGraph Orchestrator        │
│   (orchestrator/)               │
└─────────────────────────────────┘
```

## Stack technique

- **Frontend :** HTML/CSS/JS vanilla, Google Fonts (Syne, DM Sans), thème sombre
- **Chat widget :** `krl1-widget.js` — assistant conversationnel flottant avec détection d'intent et routage contextuel
- **Proxy :** Cloudflare Workers (JavaScript), KV pour compteur d'usage
- **Orchestrateur :** FastAPI + LangGraph (Python), optionnel
- **LLM :** Groq API (llama-3.3-70b-versatile)
- **Déploiement :** GitHub Pages (front) + Cloudflare Workers (proxy)

## Structure du projet

```
├── index.html                  # Page portfolio principale
├── backlog-prioritizer.html    # Outil priorisation backlog
├── discovery-assistant.html    # Outil discovery produit
├── epic-to-userstories.html    # Outil décomposition d'epics
├── okr-builder.html            # Outil OKR
├── roadmap-storyteller.html    # Outil narratif roadmap
├── user-interview-analyzer.html# Outil analyse d'interviews
├── pixel-runner.html           # Mini-jeu arcade
├── how-i-built-this.html       # Documentation technique du projet
├── krl1-widget.js              # Widget chat IA (44KB, autonome)
├── orchestrator/               # Service LangGraph (Python)
├── proxy/                      # Cloudflare Worker (JavaScript)
└── tests/                      # Tests du proxy
```

## Lancer en local

### Frontend

Servir les fichiers statiques depuis la racine :

```bash
npx serve .
```

### Proxy (Cloudflare Workers)

```bash
cd proxy
npx wrangler dev
```

### Orchestrateur (optionnel)

```bash
cd orchestrator
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8081 --reload
```

Voir [`orchestrator/README.md`](orchestrator/README.md) et [`proxy/README.md`](proxy/README.md) pour plus de détails.
