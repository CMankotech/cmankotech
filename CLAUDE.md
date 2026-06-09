# Design preferences

- **Pas de "liserets"** : éviter les bordures colorées en accent (left ou top) sur les cards/boxes — c'est un pattern que l'utilisateur n'aime pas visuellement ("ça fait trop vibe coding basique"). Préférer :
  - les bordures animées en conic-gradient (`@property --tc-angle`, `conic-gradient(from var(--tc-angle,0deg),...)`, keyframes `tc-spin`) — voir `.tool-card` (pm-toolkit.html), `.chunk-card` (rag-explorer.html), `.cat-block` (veille.html)
  - ou des bordures neutres discrètes : `border:1px solid rgba(255,255,255,0.07)`
