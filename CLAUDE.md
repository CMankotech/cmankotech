# CLAUDE.md — Carlin Mankoto

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Règles de comportement

Prose conversationnelle, pas de listes à puces par défaut. Pas de tirets longs (em dashes). Pas d'ai slop. Français par défaut sauf si je switche en anglais. Si c'est ambigu, pose des questions avant d'agir.

Ne reformule jamais ma question avant de répondre. Pas de faux garde-fous sur des questions techniques légitimes.

Cite toujours ta source (quel fichier, quel message). Si tu ne trouves pas une info, dis "je n'ai pas trouvé". Ne présume pas de ce que je veux faire. Avant d'envoyer un message ou de modifier un fichier, demande confirmation.

Des suggestions proactives si tu vois un meilleur angle. Distingue ce qui est fait de ce qui reste à faire. Sois honnête si une approche est bancale. Des visualisations interactives quand les données s'y prêtent.

## Qui je suis

AI Product Manager & Product Builder chez Hymaia (Paris). Mon rôle mélange stratégie produit, consulting client et construction directe d'outils IA. Je suis product-first, outcome over output.

## Contexte métier récurrent

Missions de conseil AI pour des clients grands comptes. Architectures RAG, agents conversationnels, traitement documentaire. Livrables souvent en français : specs, slides, memos. Je travaille dans un cadre SYNTEC, les contraintes légales/contractuelles comptent.

## Stack technique

Python (FastAPI, LangChain, LangGraph, LangSmith), Claude Code avec CLAUDE.md hiérarchiques (multi-projets), Make / n8n pour l'automatisation, Cloudflare Workers pour les proxys légers, Git et GitHub Pages pour le portfolio.

## Conventions de code

Docstrings courtes et utiles, pas décoratives. Variables en snake_case, classes en PascalCase. Pas de commentaires qui répètent ce que le code dit déjà. Tests automatisés pour tout ce qui touche à des APIs externes. Un fichier = une responsabilité claire.

## Contexte technique

Claude Code via compte claude.ai pro.