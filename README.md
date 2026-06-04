# KRL1 — AI Product Management Portfolio

Portfolio interactif de **Carlin Mankoto**, AI Product Manager, construit autour de plusieurs expériences live :

- un **PM Toolkit** de 6 outils IA pour structurer discovery, priorisation, OKR, user stories, roadmap et analyse d'interviews ;
- un **RAG Explorer** pour interroger une base de connaissances product management depuis l'edge ;
- une page **Product Decisions** qui documente les arbitrages produit derrière KRL1 ;
- une **veille hebdo** Product / IA alimentée par un workflow Make ;
- un mini-jeu web **Pixel Runner**.

**Live :** [cmankotech.github.io/cmankotech](https://cmankotech.github.io/cmankotech/)

## Aperçu

![Portfolio KRL1](assets/readme-portfolio.jpg)

![PM Toolkit](assets/readme-pm-toolkit.jpg)

![RAG Explorer](assets/readme-rag-explorer.jpg)

## Projets

| Outil | Description |
|---|---|
| **PM Toolkit** | Hub qui relie 6 outils PM dans un workflow complet : discovery → priorisation → OKR → user stories → roadmap → interview analysis |
| **Backlog Prioritizer** | Priorisation de backlog via RICE ou MoSCoW |
| **Discovery Assistant** | Transformation de problèmes en hypothèses, questions d'interview et plans de test |
| **Epic → User Stories** | Décomposition d'epics en user stories avec critères d'acceptation INVEST |
| **OKR Builder** | Génération d'Objectives & Key Results à partir d'un contexte stratégique |
| **Roadmap Storyteller** | Transformation de listes de features en narratifs de roadmap adaptés à l'audience |
| **User Interview Analyzer** | Analyse d'interviews utilisateur : personas, pain points, opportunités |
| **RAG Explorer** | Recherche sémantique dans une base de connaissances PM embarquée dans le Worker |
| **Product Decisions** | 10 décisions produit derrière KRL1 : PLG, UX, contraintes, arbitrages et alternatives rejetées |
| **Veille hebdo** | Veille Product, IA et AI Builders automatisée avec Make, exposée via le Worker |
| **KRL1 Chat Widget** | Assistant flottant avec détection d'intent et routage contextuel vers les outils |
| **Pixel Runner** | Mini-jeu arcade en JavaScript : esquive d'obstacles et score local |

Chaque outil IA est une SPA autonome en HTML/CSS/JS vanilla, bilingue FR/EN. Le mini-jeu est aussi une page statique autonome.

## Architecture

```text
GitHub Pages (frontend)
  index.html, PM Toolkit, RAG Explorer, Product Decisions, Veille, Pixel Runner
  krl1-widget.js
        │ HTTPS
        ▼
Cloudflare Worker (proxy/)
  /orchestrate, /orchestrate-stream, /rag-query, /feedback, /veille, /stats
        │
        ├── Groq API — llama-3.3-70b-versatile
        ├── Workers AI — bge-small-en-v1.5 embeddings pour le RAG
        ├── KV — usage counter + stockage de la veille
        ├── Make — automation veille / feedback optionnel
        └── Langfuse — observabilité optionnelle
```

## Stack technique

- **Frontend :** HTML/CSS/JS vanilla, Google Fonts (Syne, DM Sans, Geist), thème sombre avec mode clair sur certaines pages
- **Chat widget :** `krl1-widget.js` — assistant conversationnel flottant avec détection d'intent et routage contextuel
- **Proxy :** Cloudflare Workers (JavaScript), CORS, secrets serveur, KV pour compteur d'usage et stockage de veille
- **RAG sémantique :** Workers AI (Cloudflare, bge-small-en-v1.5) — embeddings batch + cosine similarity, natif dans le Worker
- **LLM :** Groq API (llama-3.3-70b-versatile)
- **Automation :** Make pour la veille hebdomadaire et le pipeline feedback optionnel
- **Observabilité :** Langfuse optionnel, non bloquant côté Worker
- **Déploiement :** GitHub Pages (front) + Cloudflare Workers (proxy)

## Structure du projet

```text
├── index.html                  # Page portfolio principale
├── pm-toolkit.html             # Hub des 6 outils Product Management
├── rag-explorer.html           # Interface de recherche sémantique PM
├── product-decisions.html      # Décisions produit et arbitrages KRL1
├── veille.html                 # Veille Product / IA alimentée par Make
├── backlog-prioritizer.html    # Outil priorisation backlog
├── discovery-assistant.html    # Outil discovery produit
├── epic-to-userstories.html    # Outil décomposition d'epics
├── okr-builder.html            # Outil OKR
├── roadmap-storyteller.html    # Outil narratif roadmap
├── user-interview-analyzer.html# Outil analyse d'interviews
├── pixel-runner.html           # Mini-jeu arcade
├── how-i-built-this.html       # Récit technique et décisions d'architecture
├── krl1-architecture.html      # Vue dédiée de l'architecture KRL1
├── krl1-widget.js              # Widget chat IA autonome
├── tools/                      # Scripts de rendu pour les assets visuels
├── assets/                     # Fonds, vidéos et captures du README
├── orchestrator/               # Prototype Python LangGraph optionnel, non déployé
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
npx wrangler dev --config wrangler.toml
```

### RAG sémantique

Le pipeline RAG est natif dans le Worker (`proxy/src/index.js`). Aucune infra locale nécessaire : `POST /rag-query` fonctionne dès que le Worker est lancé.

### Tests

Depuis la racine :

```bash
node --test tests/proxy.test.mjs
```

### Documentation

Un contrôle automatique vérifie que les README restent alignés avec les pages publiques, les routes Worker, les bindings Cloudflare et les captures GitHub.

```bash
node tools/check-docs.cjs
```

Pour déployer le Worker en production :

```bash
npx wrangler deploy --config proxy/wrangler.toml
```

Le flag `--config` est obligatoire : sans lui, wrangler détecte le `wrangler.jsonc` racine (Cloudflare Pages) plutôt que le Worker.

Voir [`proxy/README.md`](proxy/README.md) pour plus de détails.
