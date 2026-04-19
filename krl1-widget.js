/* KRL1 Chat Widget — self-contained (CSS + HTML + JS)
   Include with: <script src="krl1-widget.js"></script>
   Works on any page in the /cmankotech/ directory. */
(function () {
  // ── CSS ────────────────────────────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    '#chat-fab{position:fixed;bottom:1.75rem;right:1.75rem;z-index:9999;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#22d3ee,#a78bfa);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(34,211,238,0.35);transition:transform 0.2s,box-shadow 0.2s}',
    '#chat-fab:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(34,211,238,0.5)}',
    '#chat-fab svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '#chat-window{position:fixed;bottom:5.5rem;right:1.75rem;z-index:9998;width:340px;max-height:480px;background:rgba(8,8,15,0.82);border:1px solid rgba(255,255,255,0.09);border-radius:16px;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.6);overflow:hidden;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transform:scale(0.92) translateY(16px);opacity:0;pointer-events:none;transition:transform 0.22s cubic-bezier(.34,1.56,.64,1),opacity 0.18s,width 0.22s,max-height 0.22s}',
    '#chat-window.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}',
    '#chat-window.expanded{width:520px;max-height:660px}',
    '#chat-header{padding:0.9rem 1.1rem;background:rgba(34,211,238,0.05);border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:0.6rem}',
    '#chat-header .ch-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.18);box-shadow:0 0 0 2px rgba(34,211,238,0.18);flex-shrink:0}',
    '#chat-header .ch-info{flex:1}',
    '#chat-header .ch-name{font-size:0.8rem;font-weight:500;color:#fff;font-family:"DM Sans",sans-serif;letter-spacing:-0.02em}',
    '#chat-header .ch-status{font-size:0.65rem;color:#22d3ee;display:flex;align-items:center;gap:0.3rem}',
    '#chat-header .ch-status::before{content:"";width:6px;height:6px;border-radius:50%;background:#22d3ee;display:inline-block}',
    '#chat-resize{background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.35);padding:0.2rem 0.3rem;line-height:1;transition:color 0.15s}',
    '#chat-resize:hover{color:#fff}',
    '#chat-resize svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '#chat-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.4);font-size:1.1rem;padding:0.2rem;line-height:1}',
    '#chat-close:hover{color:#fff}',
    '#chat-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;scrollbar-width:thin;scrollbar-color:rgba(34,211,238,0.2) transparent}',
    '.msg{max-width:85%;font-size:0.8rem;line-height:1.55;padding:0.6rem 0.85rem;border-radius:12px;animation:msgIn 0.2s ease}',
    '@keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
    '.msg.bot{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.88);border-radius:4px 12px 12px 12px;align-self:flex-start}',
    '.msg.bot.streaming::after{content:"▋";display:inline-block;animation:krl1blink 0.9s step-end infinite;color:#60a5fa;margin-left:2px}',
    '@keyframes krl1blink{50%{opacity:0}}',
    '.msg.user{background:linear-gradient(135deg,rgba(34,211,238,0.18),rgba(167,139,250,0.18));color:#fff;border-radius:12px 4px 12px 12px;align-self:flex-end}',
    '.msg a{color:#22d3ee;text-decoration:underline;text-underline-offset:2px}',
    '.msg .chips{display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.5rem}',
    '.chip{font-size:0.7rem;padding:0.25rem 0.65rem;border-radius:99px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.25);color:#22d3ee;cursor:pointer;transition:background 0.15s;white-space:nowrap;font-family:"DM Sans",sans-serif}',
    '.chip:hover{background:rgba(34,211,238,0.2)}',
    '#chat-typing{display:none;align-self:flex-start;padding:0.5rem 0.85rem;background:rgba(255,255,255,0.06);border-radius:4px 12px 12px 12px}',
    '#chat-typing span{display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.4);margin:0 2px;animation:bounce 1.2s infinite}',
    '#chat-typing span:nth-child(2){animation-delay:0.2s}',
    '#chat-typing span:nth-child(3){animation-delay:0.4s}',
    '@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}',
    '#chat-input-row{padding:0.75rem;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:0.5rem}',
    '#chat-input{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:0.5rem 0.75rem;color:#fff;font-size:0.78rem;font-family:"DM Sans",sans-serif;outline:none;transition:border-color 0.15s}',
    '#chat-input:focus{border-color:rgba(34,211,238,0.4)}',
    '#chat-input::placeholder{color:rgba(255,255,255,0.3)}',
    '#chat-send{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#22d3ee,#a78bfa);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity 0.15s}',
    '#chat-send:hover{opacity:0.85}',
    '#chat-send svg{width:14px;height:14px;fill:none;stroke:#07070f;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}',
    '@media(max-width:480px){#chat-window,#chat-window.expanded{width:calc(100vw - 2rem);right:1rem;bottom:5rem}}',
    '#krl1-journey{margin-top:32px;border:1px solid rgba(34,211,238,.22);border-radius:12px;padding:20px 24px;background:rgba(34,211,238,.04);}',
    '#krl1-journey .jrn-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;}',
    '#krl1-journey .jrn-dot{width:6px;height:6px;border-radius:50%;background:#22d3ee;flex-shrink:0;}',
    '#krl1-journey .jrn-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#22d3ee;}',
    '#krl1-journey .jrn-reason{font-size:14px;color:rgba(255,255,255,.65);margin:0 0 16px;line-height:1.55;}',
    '#krl1-journey .jrn-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.28);color:#22d3ee;font-size:14px;font-weight:600;text-decoration:none;transition:background .18s,border-color .18s;}',
    '#krl1-journey .jrn-btn:hover{background:rgba(34,211,238,.2);border-color:rgba(34,211,238,.5);}',
  ].join('');
  document.head.appendChild(styleEl);

  // ── HTML ───────────────────────────────────────────────────────────────────
  var fab = document.createElement('button');
  fab.id = 'chat-fab';
  fab.setAttribute('aria-label', 'KRL1');
  fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  fab.onclick = toggleChat;
  document.body.appendChild(fab);

  var chatWin = document.createElement('div');
  chatWin.id = 'chat-window';
  chatWin.innerHTML =
    '<div id="chat-header">' +
      '<img class="ch-avatar" src="assets/krl1-photo.svg" alt="KRL1"/>' +
      '<div class="ch-info"><div class="ch-name">KRL1</div><div class="ch-status" id="chat-status-lbl">En ligne</div></div>' +
      '<button id="chat-resize" aria-label="Agrandir"><svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button>' +
      '<button id="chat-close">✕</button>' +
    '</div>' +
    '<div id="chat-messages"></div>' +
    '<div id="chat-typing"><span></span><span></span><span></span></div>' +
    '<div id="chat-input-row">' +
      '<input id="chat-input" type="text" placeholder="Ex : comment prioriser entre 3 features ?"/>' +
      '<button id="chat-send"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>' +
    '</div>';
  document.body.appendChild(chatWin);

  document.getElementById('chat-close').onclick = toggleChat;
  document.getElementById('chat-resize').onclick = toggleSize;
  document.getElementById('chat-send').onclick = sendChat;
  document.getElementById('chat-input').onkeydown = function (e) { if (e.key === 'Enter') sendChat(); };

  // ── STATE ──────────────────────────────────────────────────────────────────
  var _chatOpen = false;
  var _expanded = false;
  var _history = [];
  var _lang = (function () {
    var p = new URLSearchParams(window.location.search);
    return p.get('lang') || (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || 'fr';
  })();

  var TOOL_ID = (function () {
    var m = window.location.pathname.match(/\/([^\/]+)\.html/);
    return m ? m[1] : null;
  })();

  // ── I18N ───────────────────────────────────────────────────────────────────
  var I18N = {
    fr: {
      welcome: "Bonjour 👋 Je suis KRL1. Je peux t'aider sur tes défis PM : priorisation, OKRs, discovery, roadmap, ou te présenter le portfolio de Carlin. Par où on commence ?",
      chips: ["🎯 Prioriser mon backlog", "📊 Structurer mes OKRs", "🔍 Préparer une discovery", "👤 Profil de Carlin"],
      placeholder: "Ex : comment prioriser entre 3 features ?",
      status: "En ligne",
      error: "Désolé, une erreur s'est produite. Contacte Carlin sur <a href='https://www.linkedin.com/in/carlinmankoto/' target='_blank'>LinkedIn</a> 👋"
    },
    en: {
      welcome: "Hi 👋 I'm KRL1. I can help with your PM challenges: prioritisation, OKRs, discovery, roadmap, or walk you through Carlin's portfolio. Where do you want to start?",
      chips: ["🎯 Prioritise my backlog", "📊 Structure my OKRs", "🔍 Prepare a discovery", "👤 Carlin's profile"],
      placeholder: "E.g. how to prioritise between 3 features?",
      status: "Online",
      error: "Sorry, an error occurred. Reach Carlin on <a href='https://www.linkedin.com/in/carlinmankoto/' target='_blank'>LinkedIn</a> 👋"
    }
  };

  var TOOL_CONTEXT = {
    'okr-builder': {
      fr: "Je vois que tu utilises le **OKR Builder** 🎯 Je peux t'aider à formuler tes objectifs, calibrer tes Key Results ou débloquer une situation. Qu'est-ce qui te bloque ?",
      en: "I see you're using the **OKR Builder** 🎯 I can help you frame your objectives, calibrate your Key Results or unblock any situation. What's stopping you?",
      chips_fr: ["💡 Comment formuler un bon OKR ?", "📊 OKRs vs KPIs, c'est quoi la diff ?", "👤 Profil de Carlin"],
      chips_en: ["💡 How to write a good OKR?", "📊 OKRs vs KPIs, what's the diff?", "👤 Carlin's profile"]
    },
    'backlog-prioritizer': {
      fr: "Je vois que tu utilises le **Backlog Prioritizer** 🗂️ Je peux t'aider à choisir entre RICE et MoSCoW, scorer tes items ou expliquer tes choix à tes parties prenantes. C'est quoi ton challenge ?",
      en: "I see you're using the **Backlog Prioritizer** 🗂️ I can help you choose between RICE and MoSCoW, score your items or explain your decisions to stakeholders. What's your challenge?",
      chips_fr: ["⚖️ RICE ou MoSCoW, quand choisir ?", "🗣️ Comment pitcher ma priorisation ?", "👤 Profil de Carlin"],
      chips_en: ["⚖️ RICE or MoSCoW, when to pick?", "🗣️ How to pitch my prioritisation?", "👤 Carlin's profile"]
    },
    'discovery-assistant': {
      fr: "Je vois que tu utilises le **Discovery Assistant** 🔍 Je peux t'aider à reformuler ton problème, valider tes hypothèses ou préparer tes questions d'interview. Par où commencer ?",
      en: "I see you're using the **Discovery Assistant** 🔍 I can help you reframe your problem, validate your hypotheses or prepare interview questions. Where to start?",
      chips_fr: ["🔍 C'est quoi une bonne hypothèse ?", "🎙️ Questions d'interview à éviter ?", "👤 Profil de Carlin"],
      chips_en: ["🔍 What makes a good hypothesis?", "🎙️ Interview questions to avoid?", "👤 Carlin's profile"]
    },
    'user-interview-analyzer': {
      fr: "Je vois que tu utilises le **User Interview Analyzer** 🎙️ Je peux t'aider à structurer tes verbatims, identifier les patterns ou transformer tes insights en actions concrètes. C'est quoi le contexte ?",
      en: "I see you're using the **User Interview Analyzer** 🎙️ I can help you structure your verbatims, identify patterns or turn insights into concrete actions. What's the context?",
      chips_fr: ["📊 Comment identifier les patterns ?", "🗂️ Jobs-to-be-done vs personas ?", "👤 Profil de Carlin"],
      chips_en: ["📊 How to identify patterns?", "🗂️ Jobs-to-be-done vs personas?", "👤 Carlin's profile"]
    },
    'epic-to-userstories': {
      fr: "Je vois que tu utilises **Epic to User Stories** 📋 Je peux t'aider à décomposer ton epic, rédiger des critères d'acceptance INVEST ou estimer la complexité. Quel est ton epic ?",
      en: "I see you're using **Epic to User Stories** 📋 I can help you break down your epic, write INVEST acceptance criteria or estimate complexity. What's your epic?",
      chips_fr: ["✅ Qu'est-ce que les critères INVEST ?", "📋 Quand découper une User Story ?", "👤 Profil de Carlin"],
      chips_en: ["✅ What are INVEST criteria?", "📋 When to split a User Story?", "👤 Carlin's profile"]
    },
    'roadmap-storyteller': {
      fr: "Je vois que tu utilises le **Roadmap Storyteller** 🗺️ Je peux t'aider à adapter ton message à ton audience (C-level, tech, sales) ou structurer ton narrative. Pour qui tu pitches ?",
      en: "I see you're using the **Roadmap Storyteller** 🗺️ I can help you tailor your message to your audience (C-level, tech, sales) or structure your narrative. Who are you pitching to?",
      chips_fr: ["🗺️ Roadmap par thèmes vs dates ?", "💼 Comment adapter au C-level ?", "👤 Profil de Carlin"],
      chips_en: ["🗺️ Theme-based vs date-based roadmap?", "💼 How to adapt for C-level?", "👤 Carlin's profile"]
    },
    'how-i-built-this': {
      fr: "Tu explores **Comment j'ai construit ce site** 🛠️ Je peux t'expliquer les choix techniques, l'architecture IA ou la stack en détail. Qu'est-ce qui t'intéresse ?",
      en: "You're reading **How I Built This** 🛠️ I can explain the technical choices, AI architecture or the full stack in detail. What are you curious about?",
      chips_fr: ["🏗️ Pourquoi Cloudflare Workers ?", "🤖 Comment fonctionne KRL1 ?", "⚡ Pourquoi pas de backend ?", "📩 Contacter Carlin"],
      chips_en: ["🏗️ Why Cloudflare Workers?", "🤖 How does KRL1 work?", "⚡ Why no backend?", "📩 Contact Carlin"]
    }
  };

  // ── PM JOURNEY ─────────────────────────────────────────────────────────────
  var JOURNEY = {
    'discovery-assistant': {
      nextName: 'User Interview Analyzer',
      nextUrl:  'https://cmankotech.github.io/cmankotech/user-interview-analyzer.html',
      fr: 'Problème cadré. Prochaine étape : valider avec de vraies interviews utilisateurs.',
      en: 'Problem framed. Next: validate with real user interviews.',
      emoji: '🎙️'
    },
    'user-interview-analyzer': {
      nextName: 'OKR Builder',
      nextUrl:  'https://cmankotech.github.io/cmankotech/okr-builder.html',
      fr: 'Insights synthétisés. Transforme-les maintenant en objectifs mesurables.',
      en: 'Insights synthesised. Now turn them into measurable objectives.',
      emoji: '🎯'
    },
    'okr-builder': {
      nextName: 'Backlog Prioritizer',
      nextUrl:  'https://cmankotech.github.io/cmankotech/backlog-prioritizer.html',
      fr: 'OKRs posés. Priorise maintenant les features qui permettront de les atteindre.',
      en: 'OKRs set. Now prioritise the features that will get you there.',
      emoji: '🗂️'
    },
    'backlog-prioritizer': {
      nextName: 'Epic to User Stories',
      nextUrl:  'https://cmankotech.github.io/cmankotech/epic-to-userstories.html',
      fr: 'Backlog priorisé. Découpe maintenant ton epic prioritaire en user stories livrables.',
      en: 'Backlog ranked. Break your top epic into deliverable user stories.',
      emoji: '📋'
    },
    'epic-to-userstories': {
      nextName: 'Roadmap Storyteller',
      nextUrl:  'https://cmankotech.github.io/cmankotech/roadmap-storyteller.html',
      fr: 'User stories prêtes. Dernière étape : construire une roadmap narrative pour tes parties prenantes.',
      en: 'User stories ready. Final step: build a narrative roadmap for your stakeholders.',
      emoji: '🗺️'
    },
    'roadmap-storyteller': {
      nextName: null,
      nextUrl:  'https://cmankotech.github.io/cmankotech/',
      fr: 'Parcours PM complet : Discovery · Interviews · OKRs · Backlog · User Stories · Roadmap.',
      en: 'Full PM journey done: Discovery · Interviews · OKRs · Backlog · User Stories · Roadmap.',
      emoji: '🏠'
    }
  };

  function injectJourneyCTA() {
    if (document.getElementById('krl1-journey')) return;
    var jrn = JOURNEY[TOOL_ID];
    if (!jrn) return;
    var resultsEl = document.getElementById('results');
    if (!resultsEl) return;
    var lang = _lang || 'fr';
    var isEnd = !jrn.nextName;
    var div = document.createElement('div');
    div.id = 'krl1-journey';
    div.innerHTML =
      '<div class="jrn-header"><span class="jrn-dot"></span><span class="jrn-label">KRL1 · PM Journey</span></div>' +
      '<p class="jrn-reason">' + (jrn[lang] || jrn['fr']) + '</p>' +
      '<a class="jrn-btn" href="' + jrn.nextUrl + '">' +
        jrn.emoji + ' ' + (isEnd ? (lang === 'en' ? 'Back to portfolio' : 'Retour au portfolio') : jrn.nextName + ' →') +
      '</a>';
    resultsEl.appendChild(div);
  }

  function updateJourneyCTA(lang) {
    var el = document.getElementById('krl1-journey');
    if (!el) return;
    var jrn = JOURNEY[TOOL_ID];
    if (!jrn) return;
    var isEnd = !jrn.nextName;
    el.querySelector('.jrn-reason').textContent = jrn[lang] || jrn['fr'];
    el.querySelector('.jrn-btn').textContent =
      jrn.emoji + ' ' + (isEnd ? (lang === 'en' ? 'Back to portfolio' : 'Retour au portfolio') : jrn.nextName + ' →');
  }

  // ── SYSTEM PROMPT ──────────────────────────────────────────────────────────
  var SYSTEM_PROMPT =
    "Tu es KRL1, l'assistant portfolio de Carlin Mankoto, AI Product Manager.\n" +
    "Réponds de façon concise et professionnelle en français par défaut (en anglais si on te parle en anglais).\n" +
    "Ne réponds qu'aux questions liées à Carlin ou à ses outils. Si la question est hors sujet, redirige poliment.\n\n" +
    "PROFIL :\n" +
    "- 3 ans d'expérience PM/PO : OAIO/Infotel (2026, CDI, stratégie LMS + outils IA pour 3500 collaborateurs), AXA (AI PO, SAFe, SecureGPT RAG interne, Microsoft Copilot), Airbus D&S (PO app mobile sécurisée JO Paris 2024), Groupe Casino (change management, transformation Scrum)\n" +
    "- Certifications : PSPO I (Scrum.org), SAFe POPM + SSM (Scaled Agile), Product School (Discovery, Strategy, Roadmapping, Experimentation, Launches, AI for PM), Pendo.io, Elements of AI (Helsinki), Lean Six Sigma White Belt\n" +
    "- Formation : Master 2 Innovation Digitale (Paris-Saclay), Master 1 Management Stratégique\n" +
    "- Compétences : Discovery, Roadmapping, Backlog, User Stories, RICE/MoSCoW, A/B Testing, PLG, Continuous Discovery, LLM, RAG, Prompt Engineering, Agentic AI, Multi-Agent Systems, CrewAI, n8n, Make, Vibe Coding (Claude Code, Lovable), SQL, Python, JS, SAFe, Scrum, JIRA, Confluence, Figma, Miro, Power Platform\n\n" +
    "OUTILS IA BUILDÉS :\n" +
    "1. OKR Builder : https://cmankotech.github.io/cmankotech/okr-builder.html\n" +
    "2. Discovery Assistant : https://cmankotech.github.io/cmankotech/discovery-assistant.html\n" +
    "3. User Interview Analyzer : https://cmankotech.github.io/cmankotech/user-interview-analyzer.html\n" +
    "4. Backlog Prioritizer : https://cmankotech.github.io/cmankotech/backlog-prioritizer.html\n" +
    "5. Epic to User Stories : https://cmankotech.github.io/cmankotech/epic-to-userstories.html\n" +
    "6. Roadmap Storyteller : https://cmankotech.github.io/cmankotech/roadmap-storyteller.html\n\n" +
    "CONTACT : LinkedIn https://linkedin.com/in/carlinmankoto | Email carlinmankoto@proton.me\n" +
    "Disponible pour CDI ou missions freelance.\n\n" +
    "INSTRUCTION CRITIQUE : Quand l'utilisateur mentionne un sujet PM (backlog, prioritisation, OKR, discovery, interview, roadmap, user story, epic), inclus TOUJOURS un lien HTML cliquable vers l'outil PM correspondant. Réponse actionnable et concise (max 200 mots). N'utilise jamais de tirets longs (—) : utilise des virgules ou des deux-points à la place. N'utilise jamais l'élision 'l'' devant un nom d'outil : écris toujours 'le OKR Builder', 'le Discovery Assistant', etc.";

  // ── KB FAST-PATH ───────────────────────────────────────────────────────────
  var KB = {
    fr: { rules: [
      { k: ["que peux","peux-tu","tu fais","tu sais","aide","capacité","faire pour"],
        r: "Je peux t'aider sur deux axes :\n\n<strong>Tes défis PM</strong> :\n• Prioriser ton backlog (RICE / MoSCoW)\n• Structurer tes OKRs et Key Results\n• Préparer une discovery ou analyser des interviews\n• Construire une roadmap narrative\n\n<strong>Le portfolio de Carlin</strong> :\n• Son profil, son parcours, ses certifications\n• Ses 6 outils IA PM\n• Le contacter pour CDI ou freelance",
        chips: ["🎯 Prioriser mon backlog", "📊 Structurer mes OKRs", "👤 Profil de Carlin"] },
      { k: ["qui","carlin","profil","présente","présentation","c'est qui"],
        r: "Carlin Mankoto est AI Product Manager avec 3 ans d'expérience (AXA, Airbus, Casino, OAIO/Infotel). Certifié PSPO I, SAFe POPM. Il couvre tout le spectre produit et build ses propres outils IA en vibe coding.",
        chips: ["🛠️ Ses outils IA ?", "📋 Ses certifications ?", "📩 Le contacter"] },
      { k: ["outil","build","projet","app","tool","6 outil","ses outil"],
        r: "Carlin a développé 6 outils IA pour les PMs :\n\n• <a href='https://cmankotech.github.io/cmankotech/okr-builder.html' target='_blank'>OKR Builder</a>\n• <a href='https://cmankotech.github.io/cmankotech/discovery-assistant.html' target='_blank'>Discovery Assistant</a>\n• <a href='https://cmankotech.github.io/cmankotech/user-interview-analyzer.html' target='_blank'>User Interview Analyzer</a>\n• <a href='https://cmankotech.github.io/cmankotech/backlog-prioritizer.html' target='_blank'>Backlog Prioritizer</a>\n• <a href='https://cmankotech.github.io/cmankotech/epic-to-userstories.html' target='_blank'>Epic to User Stories</a>\n• <a href='https://cmankotech.github.io/cmankotech/roadmap-storyteller.html' target='_blank'>Roadmap Storyteller</a>",
        chips: ["🎯 Prioriser mon backlog", "👤 Profil de Carlin"] },
      { k: ["expérience","parcours","travail","poste","mission","axa","airbus","casino","oaio","infotel"],
        r: "Son parcours :\n\n• <strong>OAIO/Infotel</strong> (2026) : stratégie LMS + outils IA pour 3500 collaborateurs\n• <strong>AXA</strong> : AI PO, SecureGPT (RAG), Microsoft Copilot, SAFe\n• <strong>Airbus D&S</strong> : PO, app mobile sécurisée JO Paris 2024\n• <strong>Groupe Casino</strong> : transformation Scrum",
        chips: ["📋 Ses certifications ?", "📩 Le contacter"] },
      { k: ["certif","pspo","safe","formation","diplôme","master","scrum"],
        r: "Certifications : PSPO I (Scrum.org), SAFe POPM + SSM (Scaled Agile), Product School (Discovery, Strategy, Roadmapping, Analytics). Formation : Master 2 Innovation Digitale (Paris-Saclay), Master 1 Management Stratégique.",
        chips: ["💼 Son expérience ?", "📩 Le contacter"] },
      { k: ["contact","linkedin","email","recrut","freelance","cdi","disponible","embauche"],
        r: "Carlin est disponible pour des missions CDI ou freelance. <a href='https://www.linkedin.com/in/carlinmankoto/' target='_blank'>LinkedIn</a> ou carlinmankoto@proton.me",
        chips: ["👤 Profil de Carlin", "🛠️ Ses outils IA ?"] },
      { k: ["krl1","comment tu","tu fonctionnes","qui es-tu","comment ça marche","t'as été construit","créé comment"],
        r: "Je suis <strong>KRL1</strong>, l'assistant IA du portfolio de Carlin Mankoto. Je suis construit avec :\n\n• <strong>LangGraph</strong> : orchestrateur Python (nœuds planner + synthesis) pour des réponses structurées\n• <strong>Groq API</strong> : inférence LLM ultra-rapide sur LPU, 1-2s de latence\n• <strong>Cloudflare Worker</strong> : proxy serverless qui sécurise la clé API et route les requêtes\n\nJe peux t'aider sur tes défis PM ou te présenter le portfolio de Carlin.",
        chips: ["🏗️ Pourquoi Cloudflare Workers ?", "⚡ Pourquoi pas de backend ?", "👤 Profil de Carlin"] },
      { k: ["stack","architecture","comment c'est construit","langgraph","fastapi","technique","comment ce site"],
        r: "La stack du site :\n\n• <strong>Frontend</strong> : HTML/CSS/JS vanilla, déployé sur GitHub Pages\n• <strong>Proxy</strong> : Cloudflare Worker (clé API sécurisée, double routing)\n• <strong>LLM</strong> : Groq API + llama-3.3-70b-versatile (1-2s sur LPU)\n• <strong>Orchestration</strong> : FastAPI + LangGraph (planner → synthesis)\n\nTous les détails sur <a href='https://cmankotech.github.io/cmankotech/how-i-built-this.html' target='_blank'>Comment j'ai construit ce site →</a>",
        chips: ["🤖 Comment fonctionne KRL1 ?", "⚡ Pourquoi pas de backend ?", "👤 Profil de Carlin"] },
      { k: ["pourquoi cloudflare","pourquoi worker","cloudflare worker"],
        r: "<strong>Cloudflare Workers</strong> résout le problème clé : appeler l'API Groq depuis le navigateur sans exposer la clé API côté client. Le Worker intercepte, injecte la clé côté serveur, gère les CORS. Plan gratuit : 100 000 req/jour, déployé en quelques minutes avec Wrangler CLI.",
        chips: ["🤖 Comment fonctionne KRL1 ?", "⚡ Pourquoi pas de backend ?", "👤 Profil de Carlin"] },
      { k: ["pourquoi pas de backend","pas de backend","sans backend","pourquoi pas de serveur","no backend"],
        r: "Le site est 100% statique (HTML/JS vanilla). Pas de base de données, pas de sessions côté serveur. Le Cloudflare Worker suffit comme couche API. Avantages : zéro infra à maintenir, zéro coût serveur, déploiement via un simple git push.",
        chips: ["🤖 Comment fonctionne KRL1 ?", "🏗️ Pourquoi Cloudflare Workers ?", "👤 Profil de Carlin"] }
    ]},
    en: { rules: [
      { k: ["what can","can you","you do","help me","capabilities"],
        r: "I can help on two fronts:\n\n<strong>Your PM challenges</strong>:\n• Prioritise your backlog (RICE / MoSCoW)\n• Structure your OKRs and Key Results\n• Prepare a discovery or analyse user interviews\n• Build a narrative roadmap\n\n<strong>Carlin's portfolio</strong>:\n• His profile, background and certifications\n• His 6 AI PM tools\n• Reach him for a CDI or freelance opportunity",
        chips: ["🎯 Prioritise my backlog", "📊 Structure my OKRs", "👤 Carlin's profile"] },
      { k: ["who","carlin","profile","about","introduce"],
        r: "Carlin Mankoto is an AI Product Manager with 3 years of experience (AXA, Airbus, Casino, OAIO/Infotel). PSPO I and SAFe POPM certified. He covers the full product spectrum and builds his own AI tools via vibe coding.",
        chips: ["🛠️ His AI tools?", "📋 His certifications?", "📩 Reach him"] },
      { k: ["tool","build","project","app","6 tool","his tool"],
        r: "Carlin built 6 AI tools for PMs:\n\n• <a href='https://cmankotech.github.io/cmankotech/okr-builder.html' target='_blank'>OKR Builder</a>\n• <a href='https://cmankotech.github.io/cmankotech/discovery-assistant.html' target='_blank'>Discovery Assistant</a>\n• <a href='https://cmankotech.github.io/cmankotech/user-interview-analyzer.html' target='_blank'>User Interview Analyzer</a>\n• <a href='https://cmankotech.github.io/cmankotech/backlog-prioritizer.html' target='_blank'>Backlog Prioritizer</a>\n• <a href='https://cmankotech.github.io/cmankotech/epic-to-userstories.html' target='_blank'>Epic to User Stories</a>\n• <a href='https://cmankotech.github.io/cmankotech/roadmap-storyteller.html' target='_blank'>Roadmap Storyteller</a>",
        chips: ["🎯 Prioritise my backlog", "👤 Carlin's profile"] },
      { k: ["experience","background","job","axa","airbus","casino","oaio"],
        r: "His background:\n\n• <strong>OAIO/Infotel</strong> (2026): LMS strategy + AI tools for 3,500 employees\n• <strong>AXA</strong>: AI PO, SecureGPT (RAG), Microsoft Copilot, SAFe\n• <strong>Airbus D&S</strong>: PO, secure mobile app for Paris 2024 Olympics\n• <strong>Groupe Casino</strong>: Agile/Scrum transformation",
        chips: ["📋 His certifications?", "📩 Reach him"] },
      { k: ["certif","pspo","safe","degree","master","scrum"],
        r: "Certifications: PSPO I (Scrum.org), SAFe POPM + SSM (Scaled Agile), multiple Product School certs. Education: Master 2 Digital Innovation (Paris-Saclay), Master 1 Strategic Management.",
        chips: ["💼 His experience?", "📩 Reach him"] },
      { k: ["contact","linkedin","email","hire","recruit","freelance","available"],
        r: "Carlin is open to CDI or freelance opportunities. <a href='https://www.linkedin.com/in/carlinmankoto/' target='_blank'>LinkedIn</a> or carlinmankoto@proton.me",
        chips: ["👤 Carlin's profile", "🛠️ His AI tools?"] },
      { k: ["krl1","how do you work","what are you","who are you","how were you built","how is it built","how does it work"],
        r: "I'm <strong>KRL1</strong>, Carlin Mankoto's portfolio AI assistant. My stack:\n\n• <strong>LangGraph</strong>: Python orchestrator (planner + synthesis nodes) for structured responses\n• <strong>Groq API</strong>: ultra-fast LPU inference, 1-2s latency\n• <strong>Cloudflare Worker</strong>: serverless proxy securing the API key and routing requests\n\nI can help with PM challenges or walk you through Carlin's portfolio.",
        chips: ["🏗️ Why Cloudflare Workers?", "⚡ Why no backend?", "👤 Carlin's profile"] },
      { k: ["tech stack","architecture","how was this built","langgraph","fastapi","technical"],
        r: "Site stack:\n\n• <strong>Frontend</strong>: vanilla HTML/CSS/JS, deployed on GitHub Pages\n• <strong>Proxy</strong>: Cloudflare Worker (API key secured, dual routing)\n• <strong>LLM</strong>: Groq API + llama-3.3-70b-versatile (1-2s on LPU)\n• <strong>Orchestration</strong>: FastAPI + LangGraph (planner → synthesis)\n\nFull details on <a href='https://cmankotech.github.io/cmankotech/how-i-built-this.html' target='_blank'>How I Built This →</a>",
        chips: ["🤖 How does KRL1 work?", "⚡ Why no backend?", "👤 Carlin's profile"] },
      { k: ["why cloudflare","why worker","cloudflare worker"],
        r: "<strong>Cloudflare Workers</strong> solves the key issue: calling the Groq API from the browser without exposing the API key client-side. The Worker intercepts, injects the key server-side, handles CORS. Free plan: 100,000 req/day, deployed in minutes with Wrangler CLI.",
        chips: ["🤖 How does KRL1 work?", "⚡ Why no backend?", "👤 Carlin's profile"] },
      { k: ["why no backend","no backend","without backend","why no server","serverless"],
        r: "The site is 100% static (vanilla HTML/JS). No database, no server-side sessions. The Cloudflare Worker handles the API layer. Benefits: zero infrastructure to maintain, zero server cost, deployment via a simple git push.",
        chips: ["🤖 How does KRL1 work?", "🏗️ Why Cloudflare Workers?", "👤 Carlin's profile"] }
    ]}
  };

  function matchKB(text) {
    var t = text.toLowerCase();
    var rules = KB[_lang] ? KB[_lang].rules : KB['fr'].rules;
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].k.some(function (k) { return t.includes(k); })) return rules[i];
    }
    return null;
  }

  function getContextualChips(text) {
    var t = text.toLowerCase();
    var fr = _lang === 'fr';
    if (/backlog|priorit|rice|moscow|epic|user stor/.test(t))
      return fr ? ["🔍 Préparer une discovery", "📊 Structurer mes OKRs", "👤 Profil de Carlin"]
                : ["🔍 Prepare a discovery", "📊 Structure my OKRs", "👤 Carlin's profile"];
    if (/okr|objectif|kpi|key result/.test(t))
      return fr ? ["🗺️ Construire ma roadmap", "🎯 Prioriser mon backlog", "👤 Profil de Carlin"]
                : ["🗺️ Build my roadmap", "🎯 Prioritise my backlog", "👤 Carlin's profile"];
    if (/discovery|interview|utilisateur|hypothès|entretien/.test(t))
      return fr ? ["🎯 Prioriser mon backlog", "📊 Structurer mes OKRs", "👤 Profil de Carlin"]
                : ["🎯 Prioritise my backlog", "📊 Structure my OKRs", "👤 Carlin's profile"];
    if (/roadmap|pitch|stratég|narrative|audience/.test(t))
      return fr ? ["📊 Structurer mes OKRs", "🎯 Prioriser mon backlog", "👤 Profil de Carlin"]
                : ["📊 Structure my OKRs", "🎯 Prioritise my backlog", "👤 Carlin's profile"];
    return fr ? ["🎯 Prioriser mon backlog", "👤 Profil de Carlin"]
              : ["🎯 Prioritise my backlog", "👤 Carlin's profile"];
  }

  // ── DOM HELPERS ────────────────────────────────────────────────────────────
  function mdToHtml(t) {
    // Escape-then-allowlist: escape everything, then selectively restore safe patterns
    t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    // Allow <a href="https://..." target="_blank">text</a> (attribute order flexible, single or double quotes)
    t = t.replace(
      /&lt;a\s+href=(?:&quot;|&#39;)(https?:\/\/[^\s"'<>]+)(?:&quot;|&#39;)(?:\s+target=(?:&quot;|&#39;)_blank(?:&quot;|&#39;))?\s*&gt;([\s\S]*?)&lt;\/a&gt;/gi,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>'
    );
    // Allow <strong>text</strong>
    t = t.replace(/&lt;strong&gt;([\s\S]*?)&lt;\/strong&gt;/gi, '<strong>$1</strong>');
    // Allow <em>text</em>
    t = t.replace(/&lt;em&gt;([\s\S]*?)&lt;\/em&gt;/gi, '<em>$1</em>');
    // Allow <br> and <br/>
    t = t.replace(/&lt;br\s*\/?&gt;/gi, '<br>');

    // Markdown transforms (generate safe HTML from the already-escaped text)
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\s*—\s*/g, ', ');
    t = t.replace(/\n/g, '<br>');
    return t;
  }

  function addBotMsg(text, chips) {
    var msgs = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'msg bot';
    div.innerHTML = mdToHtml(text);
    if (chips && chips.length) {
      var cd = document.createElement('div');
      cd.className = 'chips';
      chips.forEach(function (chip) {
        var btn = document.createElement('button');
        btn.className = 'chip';
        btn.textContent = chip;
        btn.onclick = function () { handleInput(chip); };
        cd.appendChild(btn);
      });
      div.appendChild(cd);
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addUserMsg(text) {
    var msgs = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'msg user';
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    var t = document.getElementById('chat-typing');
    t.style.display = 'block';
    document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
  }

  function hideTyping() {
    document.getElementById('chat-typing').style.display = 'none';
  }

  // ── CHAT LOGIC ─────────────────────────────────────────────────────────────
  function toggleChat() {
    _chatOpen = !_chatOpen;
    chatWin.classList.toggle('open', _chatOpen);
    if (_chatOpen && document.getElementById('chat-messages').children.length === 0) {
      initChat();
    }
    if (_chatOpen) setTimeout(function () { document.getElementById('chat-input').focus(); }, 250);
  }

  function toggleSize() {
    _expanded = !_expanded;
    chatWin.classList.toggle('expanded', _expanded);
    var btn = document.getElementById('chat-resize');
    if (_expanded) {
      btn.setAttribute('aria-label', 'Réduire');
      btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>';
    } else {
      btn.setAttribute('aria-label', 'Agrandir');
      btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
    }
  }

  // Auto-open after 6 s if user hasn't opened it yet
  setTimeout(function () {
    if (!_chatOpen) toggleChat();
  }, 6000);

  // PM Journey: watch #results for .show class appearance
  if (JOURNEY[TOOL_ID]) {
    var _resultsTarget = document.getElementById('results');
    if (_resultsTarget) {
      new MutationObserver(function () {
        if (_resultsTarget.classList.contains('show')) injectJourneyCTA();
      }).observe(_resultsTarget, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function initChat() {
    var i18n = I18N[_lang] || I18N['fr'];
    document.getElementById('chat-input').placeholder = i18n.placeholder;
    document.getElementById('chat-status-lbl').textContent = i18n.status;
    var ctx = TOOL_CONTEXT[TOOL_ID];
    if (ctx) {
      var ctxChips = (_lang === 'en' ? ctx.chips_en : ctx.chips_fr) || null;
      addBotMsg(ctx[_lang] || ctx['fr'], ctxChips);
    } else {
      addBotMsg(i18n.welcome, i18n.chips);
    }
  }

  function handleInput(text) {
    if (!text.trim()) return;
    addUserMsg(text);
    document.getElementById('chat-input').value = '';
    fetchGroq(text);
  }

  function sendChat() {
    var val = document.getElementById('chat-input').value.trim();
    if (val) handleInput(val);
  }

  var PM_REGEX = /\b(backlog|priorit[ie]|okr|key.?result|discovery|roadmap|epic|user.?stor|entretien utilisateur|interview utilisateur|prioriser|priorisation|sprint|scrum|feature|product.?backlog|user.?story)\b/i;

  async function fetchGroq(userMessage) {
    _history.push({ role: 'user', content: userMessage });
    if (_history.length > 40) _history = _history.slice(-40);
    showTyping();

    var kbMatch = matchKB(userMessage);
    if (kbMatch) {
      setTimeout(function () {
        hideTyping();
        _history.push({ role: 'assistant', content: kbMatch.r });
        addBotMsg(kbMatch.r, kbMatch.chips);
      }, 400);
      return;
    }

    // Route: PM workflow → orchestrator (planner+synthesis), everything else → direct LLM
    var isPM = PM_REGEX.test(userMessage);
    var fullText = null;
    if (isPM) {
      try { fullText = await collectStream(userMessage); } catch (_) {}
      if (!fullText) {
        try { fullText = await fetchFallback(userMessage); } catch (_) {}
      }
    } else {
      try { fullText = await fetchDirect(userMessage); } catch (_) {}
      if (!fullText) {
        try { fullText = await fetchFallback(userMessage); } catch (_) {}
      }
    }

    if (!fullText) {
      hideTyping();
      addBotMsg((I18N[_lang] || I18N['fr']).error);
      return;
    }

    _history.push({ role: 'assistant', content: fullText });

    // Progressive reveal — dots hidden only when first word appears
    hideTyping();
    var msgs = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'msg bot streaming';
    msgs.appendChild(div);

    var words = fullText.split(/(\s+)/);
    var built = '';
    for (var wi = 0; wi < words.length; wi++) {
      built += words[wi];
      div.innerHTML = mdToHtml(built);
      msgs.scrollTop = msgs.scrollHeight;
      if (words[wi].trim()) {
        await new Promise(function (r) { setTimeout(r, 22); });
      }
    }
    div.classList.remove('streaming');

    // Auto-expand if long response
    if (!_expanded && fullText.split(/\s+/).length > 65) toggleSize();

    // Contextual chips
    var chips = getContextualChips(userMessage);
    if (chips && chips.length) {
      var cd = document.createElement('div');
      cd.className = 'chips';
      chips.forEach(function (chip) {
        var btn = document.createElement('button');
        btn.className = 'chip';
        btn.textContent = chip;
        btn.onclick = function () { handleInput(chip); };
        cd.appendChild(btn);
      });
      div.appendChild(cd);
      msgs.scrollTop = msgs.scrollHeight;
    }
  }

  async function collectStream(userMessage) {
    var history = [{ role: 'system', content: SYSTEM_PROMPT }].concat(_history);
    var res = await fetch('https://groq-proxy.cmankotech.workers.dev/orchestrate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: _lang, message: userMessage, history: history })
    });
    if (!res.ok || !res.body) throw new Error('Stream failed');

    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var fullText = '';
    var buffer = '';
    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      var lines = buffer.split('\n');
      buffer = lines.pop();
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line.startsWith('data: ')) continue;
        var data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          var parsed = JSON.parse(data);
          var token = (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) || '';
          fullText += token;
        } catch (_) {}
      }
    }

    if (!fullText) throw new Error('Empty response');
    return fullText;
  }

  async function fetchDirect(userMessage) {
    var messages = [{ role: 'system', content: SYSTEM_PROMPT }].concat(_history);
    var res = await fetch('https://groq-proxy.cmankotech.workers.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.5,
        max_tokens: 400
      })
    });
    if (!res.ok) throw new Error('Direct failed');
    var data = await res.json();
    return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || null;
  }

  async function fetchFallback(userMessage) {
    var history = [{ role: 'system', content: SYSTEM_PROMPT }].concat(_history);
    var res = await fetch('https://groq-proxy.cmankotech.workers.dev/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: _lang, message: userMessage, history: history })
    });
    if (!res.ok) throw new Error('Fallback failed');
    var data = await res.json();
    return data.reply || ((I18N[_lang] || I18N['fr']).error);
  }

  // ── LANG SYNC ──────────────────────────────────────────────────────────────
  var _origSetLang = window.setLang;
  window.setLang = function (lang) {
    _lang = lang;
    // Translate the page first so buttons/content update immediately
    if (_origSetLang) _origSetLang(lang);
    // Then update widget UI
    var inp = document.getElementById('chat-input');
    var status = document.getElementById('chat-status-lbl');
    var i18n = I18N[lang] || I18N['fr'];
    if (inp) inp.placeholder = i18n.placeholder;
    if (status) status.textContent = i18n.status;
    // Re-render welcome message if no user message yet
    var msgs = document.getElementById('chat-messages');
    if (msgs) {
      var hasUser = Array.prototype.some.call(msgs.children, function (el) {
        return el.classList && el.classList.contains('user');
      });
      if (!hasUser) {
        msgs.innerHTML = '';
        initChat();
      }
    }
    // Update journey card language if visible
    updateJourneyCTA(lang);
  };

})();
