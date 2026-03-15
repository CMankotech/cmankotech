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
    '#chat-window{position:fixed;bottom:5.5rem;right:1.75rem;z-index:9998;width:340px;max-height:480px;background:#0e0e1a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.6);overflow:hidden;transform:scale(0.92) translateY(16px);opacity:0;pointer-events:none;transition:transform 0.22s cubic-bezier(.34,1.56,.64,1),opacity 0.18s}',
    '#chat-window.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}',
    '#chat-header{padding:0.9rem 1.1rem;background:rgba(34,211,238,0.06);border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:0.6rem}',
    '#chat-header .ch-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.18);box-shadow:0 0 0 2px rgba(34,211,238,0.18);flex-shrink:0}',
    '#chat-header .ch-info{flex:1}',
    '#chat-header .ch-name{font-size:0.8rem;font-weight:700;color:#fff;font-family:"Syne",sans-serif}',
    '#chat-header .ch-status{font-size:0.65rem;color:#22d3ee;display:flex;align-items:center;gap:0.3rem}',
    '#chat-header .ch-status::before{content:"";width:6px;height:6px;border-radius:50%;background:#22d3ee;display:inline-block}',
    '#chat-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.4);font-size:1.1rem;padding:0.2rem;line-height:1}',
    '#chat-close:hover{color:#fff}',
    '#chat-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent}',
    '.msg{max-width:85%;font-size:0.8rem;line-height:1.55;padding:0.6rem 0.85rem;border-radius:12px;animation:msgIn 0.2s ease}',
    '@keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
    '.msg.bot{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.88);border-radius:4px 12px 12px 12px;align-self:flex-start}',
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
    '@media(max-width:480px){#chat-window{width:calc(100vw - 2rem);right:1rem;bottom:5rem}}',
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
  document.getElementById('chat-send').onclick = sendChat;
  document.getElementById('chat-input').onkeydown = function (e) { if (e.key === 'Enter') sendChat(); };

  // ── STATE ──────────────────────────────────────────────────────────────────
  var _chatOpen = false;
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
      welcome: "Bonjour 👋 Je suis KRL1. Je peux t'aider sur tes défis PM — priorisation, OKRs, discovery, roadmap — ou te présenter le portfolio de Carlin. Par où on commence ?",
      chips: ["🎯 Prioriser mon backlog", "📊 Structurer mes OKRs", "🔍 Préparer une discovery", "👤 Profil de Carlin"],
      placeholder: "Ex : comment prioriser entre 3 features ?",
      status: "En ligne",
      error: "Désolé, une erreur s'est produite. Contacte Carlin sur <a href='https://www.linkedin.com/in/carlinmankoto/' target='_blank'>LinkedIn</a> 👋"
    },
    en: {
      welcome: "Hi 👋 I'm KRL1. I can help with your PM challenges — prioritisation, OKRs, discovery, roadmap — or walk you through Carlin's portfolio. Where do you want to start?",
      chips: ["🎯 Prioritise my backlog", "📊 Structure my OKRs", "🔍 Prepare a discovery", "👤 Carlin's profile"],
      placeholder: "E.g. how to prioritise between 3 features?",
      status: "Online",
      error: "Sorry, an error occurred. Reach Carlin on <a href='https://www.linkedin.com/in/carlinmankoto/' target='_blank'>LinkedIn</a> 👋"
    }
  };

  var TOOL_CONTEXT = {
    'okr-builder': {
      fr: "Je vois que tu utilises l'**OKR Builder** 🎯 Je peux t'aider à formuler tes objectifs, calibrer tes Key Results ou débloquer une situation. Qu'est-ce qui te bloque ?",
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
    "INSTRUCTION CRITIQUE : Quand l'utilisateur mentionne un sujet PM (backlog, prioritisation, OKR, discovery, interview, roadmap, user story, epic), inclus TOUJOURS un lien HTML cliquable vers l'outil PM correspondant. Réponse actionnable et concise (max 200 mots).";

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
        r: "Son parcours :\n\n• <strong>OAIO/Infotel</strong> (2026) — stratégie LMS + outils IA pour 3500 collaborateurs\n• <strong>AXA</strong> — AI PO : SecureGPT (RAG), Microsoft Copilot, SAFe\n• <strong>Airbus D&S</strong> — PO : app mobile sécurisée JO Paris 2024\n• <strong>Groupe Casino</strong> — transformation Scrum",
        chips: ["📋 Ses certifications ?", "📩 Le contacter"] },
      { k: ["certif","pspo","safe","formation","diplôme","master","scrum"],
        r: "Certifications : PSPO I (Scrum.org), SAFe POPM + SSM (Scaled Agile), Product School (Discovery, Strategy, Roadmapping, Analytics). Formation : Master 2 Innovation Digitale (Paris-Saclay), Master 1 Management Stratégique.",
        chips: ["💼 Son expérience ?", "📩 Le contacter"] },
      { k: ["contact","linkedin","email","recrut","freelance","cdi","disponible","embauche"],
        r: "Carlin est disponible pour des missions CDI ou freelance. <a href='https://www.linkedin.com/in/carlinmankoto/' target='_blank'>LinkedIn</a> ou carlinmankoto@proton.me",
        chips: ["👤 Profil de Carlin", "🛠️ Ses outils IA ?"] }
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
        r: "His background:\n\n• <strong>OAIO/Infotel</strong> (2026) — LMS strategy + AI tools for 3,500 employees\n• <strong>AXA</strong> — AI PO: SecureGPT (RAG), Microsoft Copilot, SAFe\n• <strong>Airbus D&S</strong> — PO: secure mobile app for Paris 2024 Olympics\n• <strong>Groupe Casino</strong> — Agile/Scrum transformation",
        chips: ["📋 His certifications?", "📩 Reach him"] },
      { k: ["certif","pspo","safe","degree","master","scrum"],
        r: "Certifications: PSPO I (Scrum.org), SAFe POPM + SSM (Scaled Agile), multiple Product School certs. Education: Master 2 Digital Innovation (Paris-Saclay), Master 1 Strategic Management.",
        chips: ["💼 His experience?", "📩 Reach him"] },
      { k: ["contact","linkedin","email","hire","recruit","freelance","available"],
        r: "Carlin is open to CDI or freelance opportunities. <a href='https://www.linkedin.com/in/carlinmankoto/' target='_blank'>LinkedIn</a> or carlinmankoto@proton.me",
        chips: ["👤 Carlin's profile", "🛠️ His AI tools?"] }
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
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
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

  async function fetchGroq(userMessage) {
    _history.push({ role: 'user', content: userMessage });
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

    try {
      var result = await fetchStream(userMessage);
      _history.push({ role: 'assistant', content: result.text });
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
        result.div.appendChild(cd);
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
      }
    } catch (e) {
      hideTyping();
      try {
        var reply = await fetchFallback(userMessage);
        _history.push({ role: 'assistant', content: reply });
        addBotMsg(reply, getContextualChips(userMessage));
      } catch (e2) {
        addBotMsg((I18N[_lang] || I18N['fr']).error);
      }
    }
  }

  async function fetchStream(userMessage) {
    var history = [{ role: 'system', content: SYSTEM_PROMPT }].concat(_history);
    var res = await fetch('https://groq-proxy.cmankotech.workers.dev/orchestrate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: _lang, message: userMessage, history: history })
    });

    if (!res.ok || !res.body) throw new Error('Stream failed');

    hideTyping();
    var msgs = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'msg bot streaming';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;

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
          if (token) {
            fullText += token;
            div.innerHTML = mdToHtml(fullText);
            msgs.scrollTop = msgs.scrollHeight;
          }
        } catch (_) {}
      }
    }

    div.classList.remove('streaming');
    return { text: fullText, div: div };
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
    var inp = document.getElementById('chat-input');
    var status = document.getElementById('chat-status-lbl');
    var i18n = I18N[lang] || I18N['fr'];
    if (inp) inp.placeholder = i18n.placeholder;
    if (status) status.textContent = i18n.status;
    if (_origSetLang) _origSetLang(lang);
  };

})();
