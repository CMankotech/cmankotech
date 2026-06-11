/* KRL1 Chat Widget â€” self-contained (CSS + HTML + JS)
   Include with: <script src="krl1-widget.js"></script>
   Works on any page in the /cmankotech/ directory. */
(function () {
  // â”€â”€ CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    /* Animated angle custom property for conic-gradient rotation (liquid edge) */
    '@property --krl1-angle{syntax:"<angle>";initial-value:0deg;inherits:false}',

    /* â”€â”€ FAB : glass pill + cursor-tracked specular â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    '#chat-fab{--mx:50%;--my:50%;position:fixed;bottom:1.75rem;right:1.75rem;z-index:9999;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#60a5fa,#a78bfa 55%,#22d3ee);box-shadow:0 4px 24px rgba(96,165,250,0.35),inset 0 1px 0 rgba(255,255,255,0.35),inset 0 -1px 0 rgba(0,0,0,0.15);transition:transform 0.25s cubic-bezier(.34,1.56,.64,1),box-shadow 0.25s;isolation:isolate;overflow:hidden}',
    '#chat-fab::before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at var(--mx) var(--my),rgba(255,255,255,0.55) 0%,rgba(255,255,255,0) 45%);opacity:0;transition:opacity 0.25s;pointer-events:none;mix-blend-mode:overlay}',
    '#chat-fab:hover{transform:scale(1.08);box-shadow:0 8px 36px rgba(96,165,250,0.55),inset 0 1px 0 rgba(255,255,255,0.45),inset 0 -1px 0 rgba(0,0,0,0.2)}',
    '#chat-fab:hover::before{opacity:1}',
    '#chat-fab:active{transform:scale(0.96)}',
    '#chat-fab svg{position:relative;z-index:1;width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))}',

    /* â”€â”€ CHAT WINDOW : frosted glass base + liquid edge ring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    '#chat-window{position:fixed;bottom:5.5rem;right:1.75rem;z-index:9998;width:340px;max-height:480px;background:linear-gradient(180deg,rgba(22,22,40,0.55) 0%,rgba(8,8,15,0.65) 100%);border:1px solid rgba(255,255,255,0.08);border-radius:18px;display:flex;flex-direction:column;box-shadow:0 1px 0 rgba(255,255,255,0.04) inset,0 20px 60px rgba(0,0,0,0.55),0 0 80px -20px rgba(96,165,250,0.25);overflow:hidden;backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);transform:scale(0.92) translateY(16px);opacity:0;pointer-events:none;transition:transform 0.22s cubic-bezier(.34,1.56,.64,1),opacity 0.18s,width 0.22s,max-height 0.22s;isolation:isolate}',
    /* Liquid edge â€” rotating conic-gradient ring (animates only when open) */
    '#chat-window::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:conic-gradient(from var(--krl1-angle,0deg),rgba(96,165,250,0) 0deg,rgba(96,165,250,0.55) 80deg,rgba(167,139,250,0) 160deg,rgba(34,211,238,0.5) 240deg,rgba(96,165,250,0) 320deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;opacity:0;transition:opacity 0.4s}',
    '#chat-window.open::before{opacity:0.8;animation:krl1-edge-spin 10s linear infinite}',
    '@keyframes krl1-edge-spin{to{--krl1-angle:360deg}}',
    /* Top inner specular line â€” the signature glass highlight */
    '#chat-window::after{content:"";position:absolute;top:0;left:18px;right:18px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);pointer-events:none;z-index:2}',
    '#chat-window.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}',
    '#chat-window.expanded{width:520px;max-height:660px}',

    /* â”€â”€ HEADER : soft luminous gradient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    '#chat-header{position:relative;padding:0.9rem 1.1rem;background:linear-gradient(180deg,rgba(96,165,250,0.1) 0%,rgba(96,165,250,0.02) 100%);border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:0.6rem;z-index:1}',
    '#chat-header .ch-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.2);box-shadow:0 0 0 2px rgba(96,165,250,0.22),0 0 16px rgba(96,165,250,0.2);flex-shrink:0}',
    '#chat-header .ch-info{flex:1}',
    '#chat-header .ch-name{font-size:0.8rem;font-weight:500;color:#fff;font-family:"DM Sans",sans-serif;letter-spacing:-0.02em}',
    '#chat-header .ch-status{font-size:0.65rem;color:#60a5fa;display:flex;align-items:center;gap:0.3rem}',
    '#chat-header .ch-status::before{content:"";width:6px;height:6px;border-radius:50%;background:#60a5fa;display:inline-block;box-shadow:0 0 6px rgba(96,165,250,0.8)}',
    '#chat-resize{background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.35);padding:0.2rem 0.3rem;line-height:1;transition:color 0.15s}',
    '#chat-resize:hover{color:#fff}',
    '#chat-resize svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '#chat-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.4);font-size:1.1rem;padding:0.2rem;line-height:1}',
    '#chat-close:hover{color:#fff}',

    /* â”€â”€ MESSAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    '#chat-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;scrollbar-width:thin;scrollbar-color:rgba(34,211,238,0.2) transparent;position:relative;z-index:1}',
    '.msg{max-width:85%;font-size:0.8rem;line-height:1.55;padding:0.6rem 0.85rem;border-radius:12px;animation:msgIn 0.2s ease}',
    '@keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
    '.msg.bot{background:linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03));border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.88);border-radius:4px 12px 12px 12px;align-self:flex-start;box-shadow:inset 0 1px 0 rgba(255,255,255,0.05)}',
    '.msg.bot.streaming::after{content:"â–‹";display:inline-block;animation:krl1blink 0.9s step-end infinite;color:#60a5fa;margin-left:2px}',
    '@keyframes krl1blink{50%{opacity:0}}',
    '.msg.user{background:linear-gradient(135deg,rgba(96,165,250,0.25),rgba(167,139,250,0.22));color:#fff;border-radius:12px 4px 12px 12px;align-self:flex-end;box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 2px 8px rgba(96,165,250,0.12);border:1px solid rgba(255,255,255,0.06)}',
    '.msg a{color:#60a5fa;text-decoration:underline;text-underline-offset:2px}',
    '.msg .chips{display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.5rem}',

    /* â”€â”€ CHIPS : glass shimmer on hover â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    '.chip{position:relative;font-size:0.7rem;padding:0.25rem 0.65rem;border-radius:99px;background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.25);color:#60a5fa;cursor:pointer;transition:background 0.2s,border-color 0.2s,transform 0.15s;white-space:nowrap;font-family:"DM Sans",sans-serif;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,0.08)}',
    '.chip::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,0.25) 50%,transparent 80%);transform:translateX(-120%);transition:transform 0.6s}',
    '.chip:hover{background:rgba(96,165,250,0.2);border-color:rgba(96,165,250,0.45);transform:translateY(-1px)}',
    '.chip:hover::before{transform:translateX(120%)}',

    /* â”€â”€ TYPING DOTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    '#chat-typing{display:none;align-self:flex-start;padding:0.5rem 0.85rem;background:rgba(255,255,255,0.06);border-radius:4px 12px 12px 12px;border:1px solid rgba(255,255,255,0.05)}',
    '#chat-typing span{display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.4);margin:0 2px;animation:bounce 1.2s infinite}',
    '#chat-typing span:nth-child(2){animation-delay:0.2s}',
    '#chat-typing span:nth-child(3){animation-delay:0.4s}',
    '@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}',

    /* â”€â”€ INPUT ROW : glass pills + liquid focus halo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    '#chat-input-row{padding:0.75rem;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:0.5rem;background:linear-gradient(0deg,rgba(0,0,0,0.2),transparent);position:relative;z-index:1}',
    '#chat-input{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:99px;padding:0.55rem 1rem;color:#fff;font-size:0.78rem;font-family:"DM Sans",sans-serif;outline:none;transition:border-color 0.2s,box-shadow 0.3s,background 0.2s;box-shadow:inset 0 1px 0 rgba(255,255,255,0.05)}',
    '#chat-input:hover{background:rgba(255,255,255,0.06)}',
    '#chat-input:focus{border-color:rgba(96,165,250,0.55);background:rgba(255,255,255,0.07);box-shadow:inset 0 1px 0 rgba(255,255,255,0.08),0 0 0 3px rgba(96,165,250,0.18),0 0 24px -4px rgba(96,165,250,0.4);animation:krl1-focus-pulse 2.4s ease-in-out infinite}',
    '@keyframes krl1-focus-pulse{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,0.08),0 0 0 3px rgba(96,165,250,0.18),0 0 24px -4px rgba(96,165,250,0.4)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,0.08),0 0 0 4px rgba(96,165,250,0.26),0 0 32px -4px rgba(167,139,250,0.5)}}',
    '#chat-input::placeholder{color:rgba(255,255,255,0.3)}',

    /* â”€â”€ SEND BUTTON : specular sweep on hover â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    '#chat-send{position:relative;width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#60a5fa,#a78bfa 55%,#22d3ee);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform 0.2s,box-shadow 0.2s;box-shadow:inset 0 1px 0 rgba(255,255,255,0.35),inset 0 -1px 0 rgba(0,0,0,0.15),0 2px 10px rgba(96,165,250,0.35);overflow:hidden;isolation:isolate}',
    '#chat-send::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,0.55) 50%,transparent 75%);transform:translateX(-120%);transition:transform 0.55s ease}',
    '#chat-send:hover{transform:scale(1.06);box-shadow:inset 0 1px 0 rgba(255,255,255,0.45),inset 0 -1px 0 rgba(0,0,0,0.2),0 4px 16px rgba(96,165,250,0.55)}',
    '#chat-send:hover::before{transform:translateX(120%)}',
    '#chat-send:active{transform:scale(0.95)}',
    '#chat-send svg{position:relative;z-index:1;width:14px;height:14px;fill:none;stroke:#07070f;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 1px rgba(255,255,255,0.3))}',

    /* â”€â”€ REDUCED MOTION RESPECT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    '@media(prefers-reduced-motion:reduce){#chat-window.open::before{animation:none;opacity:0.4}#chat-input:focus{animation:none}.chip::before,#chat-send::before{transition:none}}',

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

  // â”€â”€ HTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var fab = document.createElement('button');
  fab.id = 'chat-fab';
  fab.setAttribute('aria-label', 'KRL1');
  fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  fab.onclick = toggleChat;
  fab.addEventListener('pointermove', function (e) {
    var r = fab.getBoundingClientRect();
    fab.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    fab.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  });
  document.body.appendChild(fab);

  var chatWin = document.createElement('div');
  chatWin.id = 'chat-window';
  chatWin.innerHTML =
    '<div id="chat-header">' +
      '<img class="ch-avatar" src="assets/krl1-photo.svg" alt="KRL1"/>' +
      '<div class="ch-info"><div class="ch-name">KRL1</div><div class="ch-status" id="chat-status-lbl">En ligne</div></div>' +
      '<button id="chat-resize" aria-label="Agrandir"><svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button>' +
      '<button id="chat-close">âœ•</button>' +
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

  // â”€â”€ STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ I18N â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var I18N = {
    fr: {
      welcome: "Bonjour ðŸ‘‹ Je suis KRL1. Je peux t'aider sur tes dÃ©fis PM : priorisation, OKRs, discovery, roadmap, ou te prÃ©senter le portfolio de Carlin. Par oÃ¹ on commence ?",
      chips: ["ðŸŽ¯ Prioriser mon backlog", "ðŸ“Š Structurer mes OKRs", "ðŸ” PrÃ©parer une discovery"],
      placeholder: "Ex : comment prioriser entre 3 features ?",
      status: "En ligne",
      error: "DÃ©solÃ©, une erreur s'est produite. RÃ©essaie dans un instant."
    },
    en: {
      welcome: "Hi ðŸ‘‹ I'm KRL1. I can help with your PM challenges: prioritisation, OKRs, discovery, roadmap, or walk you through Carlin's portfolio. Where do you want to start?",
      chips: ["ðŸŽ¯ Prioritise my backlog", "ðŸ“Š Structure my OKRs", "ðŸ” Prepare a discovery"],
      placeholder: "E.g. how to prioritise between 3 features?",
      status: "Online",
      error: "Sorry, an error occurred. Please try again in a moment."
    }
  };

  var TOOL_CONTEXT = {
    'okr-builder': {
      fr: "Je vois que tu utilises le **OKR Builder** ðŸŽ¯ Je peux t'aider Ã  formuler tes objectifs, calibrer tes Key Results ou dÃ©bloquer une situation. Qu'est-ce qui te bloque ?",
      en: "I see you're using the **OKR Builder** ðŸŽ¯ I can help you frame your objectives, calibrate your Key Results or unblock any situation. What's stopping you?",
      chips_fr: ["ðŸ’¡ Comment formuler un bon OKR ?", "ðŸ“Š OKRs vs KPIs, c'est quoi la diff ?"],
      chips_en: ["ðŸ’¡ How to write a good OKR?", "ðŸ“Š OKRs vs KPIs, what's the diff?"]
    },
    'backlog-prioritizer': {
      fr: "Je vois que tu utilises le **Backlog Prioritizer** ðŸ—‚ï¸ Je peux t'aider Ã  choisir entre RICE et MoSCoW, scorer tes items ou expliquer tes choix Ã  tes parties prenantes. C'est quoi ton challenge ?",
      en: "I see you're using the **Backlog Prioritizer** ðŸ—‚ï¸ I can help you choose between RICE and MoSCoW, score your items or explain your decisions to stakeholders. What's your challenge?",
      chips_fr: ["âš–ï¸ RICE ou MoSCoW, quand choisir ?", "ðŸ—£ï¸ Comment pitcher ma priorisation ?"],
      chips_en: ["âš–ï¸ RICE or MoSCoW, when to pick?", "ðŸ—£ï¸ How to pitch my prioritisation?"]
    },
    'discovery-assistant': {
      fr: "Je vois que tu utilises le **Discovery Assistant** ðŸ” Je peux t'aider Ã  reformuler ton problÃ¨me, valider tes hypothÃ¨ses ou prÃ©parer tes questions d'interview. Par oÃ¹ commencer ?",
      en: "I see you're using the **Discovery Assistant** ðŸ” I can help you reframe your problem, validate your hypotheses or prepare interview questions. Where to start?",
      chips_fr: ["ðŸ” C'est quoi une bonne hypothÃ¨se ?", "ðŸŽ™ï¸ Questions d'interview Ã  Ã©viter ?"],
      chips_en: ["ðŸ” What makes a good hypothesis?", "ðŸŽ™ï¸ Interview questions to avoid?"]
    },
    'user-interview-analyzer': {
      fr: "Je vois que tu utilises le **User Interview Analyzer** ðŸŽ™ï¸ Je peux t'aider Ã  structurer tes verbatims, identifier les patterns ou transformer tes insights en actions concrÃ¨tes. C'est quoi le contexte ?",
      en: "I see you're using the **User Interview Analyzer** ðŸŽ™ï¸ I can help you structure your verbatims, identify patterns or turn insights into concrete actions. What's the context?",
      chips_fr: ["ðŸ“Š Comment identifier les patterns ?", "ðŸ—‚ï¸ Jobs-to-be-done vs personas ?"],
      chips_en: ["ðŸ“Š How to identify patterns?", "ðŸ—‚ï¸ Jobs-to-be-done vs personas?"]
    },
    'epic-to-userstories': {
      fr: "Je vois que tu utilises **Epic to User Stories** ðŸ“‹ Je peux t'aider Ã  dÃ©composer ton epic, rÃ©diger des critÃ¨res d'acceptance INVEST ou estimer la complexitÃ©. Quel est ton epic ?",
      en: "I see you're using **Epic to User Stories** ðŸ“‹ I can help you break down your epic, write INVEST acceptance criteria or estimate complexity. What's your epic?",
      chips_fr: ["âœ… Qu'est-ce que les critÃ¨res INVEST ?", "ðŸ“‹ Quand dÃ©couper une User Story ?"],
      chips_en: ["âœ… What are INVEST criteria?", "ðŸ“‹ When to split a User Story?"]
    },
    'roadmap-storyteller': {
      fr: "Je vois que tu utilises le **Roadmap Storyteller** ðŸ—ºï¸ Je peux t'aider Ã  adapter ton message Ã  ton audience (C-level, tech, sales) ou structurer ton narrative. Pour qui tu pitches ?",
      en: "I see you're using the **Roadmap Storyteller** ðŸ—ºï¸ I can help you tailor your message to your audience (C-level, tech, sales) or structure your narrative. Who are you pitching to?",
      chips_fr: ["ðŸ—ºï¸ Roadmap par thÃ¨mes vs dates ?", "ðŸ’¼ Comment adapter au C-level ?"],
      chips_en: ["ðŸ—ºï¸ Theme-based vs date-based roadmap?", "ðŸ’¼ How to adapt for C-level?"]
    },
    'how-i-built-this': {
      fr: "Tu explores **Comment j'ai construit ce site** ðŸ› ï¸ Je peux t'expliquer les choix techniques, l'architecture IA ou la stack en dÃ©tail. Qu'est-ce qui t'intÃ©resse ?",
      en: "You're reading **How I Built This** ðŸ› ï¸ I can explain the technical choices, AI architecture or the full stack in detail. What are you curious about?",
      chips_fr: ["ðŸ—ï¸ Pourquoi Cloudflare Workers ?", "ðŸ¤– Comment fonctionne KRL1 ?", "âš¡ Pourquoi pas de backend ?"],
      chips_en: ["ðŸ—ï¸ Why Cloudflare Workers?", "ðŸ¤– How does KRL1 work?", "âš¡ Why no backend?"]
    }
  };

  // â”€â”€ PM JOURNEY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var JOURNEY = {
    'discovery-assistant': {
      nextName: 'User Interview Analyzer',
      nextUrl:  'https://cmankotech.github.io/cmankotech/user-interview-analyzer.html',
      fr: 'ProblÃ¨me cadrÃ©. Prochaine Ã©tape : valider avec de vraies interviews utilisateurs.',
      en: 'Problem framed. Next: validate with real user interviews.',
      emoji: 'ðŸŽ™ï¸'
    },
    'user-interview-analyzer': {
      nextName: 'OKR Builder',
      nextUrl:  'https://cmankotech.github.io/cmankotech/okr-builder.html',
      fr: 'Insights synthÃ©tisÃ©s. Transforme-les maintenant en objectifs mesurables.',
      en: 'Insights synthesised. Now turn them into measurable objectives.',
      emoji: 'ðŸŽ¯'
    },
    'okr-builder': {
      nextName: 'Backlog Prioritizer',
      nextUrl:  'https://cmankotech.github.io/cmankotech/backlog-prioritizer.html',
      fr: 'OKRs posÃ©s. Priorise maintenant les features qui permettront de les atteindre.',
      en: 'OKRs set. Now prioritise the features that will get you there.',
      emoji: 'ðŸ—‚ï¸'
    },
    'backlog-prioritizer': {
      nextName: 'Epic to User Stories',
      nextUrl:  'https://cmankotech.github.io/cmankotech/epic-to-userstories.html',
      fr: 'Backlog priorisÃ©. DÃ©coupe maintenant ton epic prioritaire en user stories livrables.',
      en: 'Backlog ranked. Break your top epic into deliverable user stories.',
      emoji: 'ðŸ“‹'
    },
    'epic-to-userstories': {
      nextName: 'Roadmap Storyteller',
      nextUrl:  'https://cmankotech.github.io/cmankotech/roadmap-storyteller.html',
      fr: 'User stories prÃªtes. DerniÃ¨re Ã©tape : construire une roadmap narrative pour tes parties prenantes.',
      en: 'User stories ready. Final step: build a narrative roadmap for your stakeholders.',
      emoji: 'ðŸ—ºï¸'
    },
    'roadmap-storyteller': {
      nextName: null,
      nextUrl:  'https://cmankotech.github.io/cmankotech/',
      fr: 'Parcours PM complet : Discovery Â· Interviews Â· OKRs Â· Backlog Â· User Stories Â· Roadmap.',
      en: 'Full PM journey done: Discovery Â· Interviews Â· OKRs Â· Backlog Â· User Stories Â· Roadmap.',
      emoji: 'ðŸ '
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
      '<div class="jrn-header"><span class="jrn-dot"></span><span class="jrn-label">KRL1 Â· PM Journey</span></div>' +
      '<p class="jrn-reason">' + (jrn[lang] || jrn['fr']) + '</p>' +
      '<a class="jrn-btn" href="' + jrn.nextUrl + '">' +
        jrn.emoji + ' ' + (isEnd ? (lang === 'en' ? 'Back to portfolio' : 'Retour au portfolio') : jrn.nextName + ' â†’') +
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
      jrn.emoji + ' ' + (isEnd ? (lang === 'en' ? 'Back to portfolio' : 'Retour au portfolio') : jrn.nextName + ' â†’');
  }

  // â”€â”€ SYSTEM PROMPT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var SYSTEM_PROMPT =
    "Tu es KRL1, l'assistant portfolio de Carlin Mankoto, AI Product Manager.\n" +
    "RÃ©ponds de faÃ§on concise et professionnelle en franÃ§ais par dÃ©faut (en anglais si on te parle en anglais).\n" +
    "Ne rÃ©ponds qu'aux questions liÃ©es Ã  Carlin ou Ã  ses outils. Si la question est hors sujet, redirige poliment.\n\n" +
    "PROFIL :\n" +
    "- 3 ans d'expÃ©rience PM/PO : OAIO/Infotel (2026, CDI, stratÃ©gie LMS + outils IA pour 3500 collaborateurs), AXA (AI PO, SAFe, SecureGPT RAG interne, Microsoft Copilot), Airbus D&S (PO app mobile sÃ©curisÃ©e JO Paris 2024), Groupe Casino (change management, transformation Scrum)\n" +
    "- Certifications : PSPO I (Scrum.org), SAFe POPM + SSM (Scaled Agile), Product School (Discovery, Strategy, Roadmapping, Experimentation, Launches, AI for PM), Pendo.io, Elements of AI (Helsinki), Lean Six Sigma White Belt\n" +
    "- Formation : Master 2 Innovation Digitale (Paris-Saclay), Master 1 Management StratÃ©gique\n" +
    "- CompÃ©tences : Discovery, Roadmapping, Backlog, User Stories, RICE/MoSCoW, A/B Testing, PLG, Continuous Discovery, LLM, RAG, Prompt Engineering, Agentic AI, Multi-Agent Systems, CrewAI, n8n, Make, Vibe Coding (Claude Code, Lovable), SQL, Python, JS, SAFe, Scrum, JIRA, Confluence, Figma, Miro, Power Platform\n\n" +
    "OUTILS IA BUILDÃ‰S :\n" +
    "1. OKR Builder : https://cmankotech.github.io/cmankotech/okr-builder.html\n" +
    "2. Discovery Assistant : https://cmankotech.github.io/cmankotech/discovery-assistant.html\n" +
    "3. User Interview Analyzer : https://cmankotech.github.io/cmankotech/user-interview-analyzer.html\n" +
    "4. Backlog Prioritizer : https://cmankotech.github.io/cmankotech/backlog-prioritizer.html\n" +
    "5. Epic to User Stories : https://cmankotech.github.io/cmankotech/epic-to-userstories.html\n" +
    "6. Roadmap Storyteller : https://cmankotech.github.io/cmankotech/roadmap-storyteller.html\n\n" +
    "CONTACT : LinkedIn https://linkedin.com/in/carlinmankoto | Email carlinmankoto@proton.me\n" +
    "Disponible pour CDI ou missions freelance.\n\n" +
    "ARCHITECTURE TECHNIQUE DU SITE :\n" +
    "- Cloudflare Worker 'groq-proxy' (JS), routes : POST / (proxy Groq direct), /orchestrate (planner+synthesis sync), /orchestrate-stream (synthesis SSE), /rag-query (RAG sÃ©mantique), /feedback (analyse feedback), GET /stats (compteur KV), GET|POST /veille\n" +
    "- Flow /orchestrate-stream : Appel #1 Planner (llama-3.3-70b, temp 0.2, JSON strict : intent/confidence/user_goal/steps) â†’ Appel #2 Synthesis (temp 0.45, SSE stream). ctx.waitUntil pour Langfuse + KV non-bloquant\n" +
    "- RAG (/rag-query) : Workers AI bge-small-en-v1.5 (embeddings Cloudflare native), cosine similarity inline dans le Worker, KB de 15 documents PM/Agile/AI Product en code (chunks 300 mots, overlap 50), top-3 chunks injectÃ©s si intent=pm_workflow\n" +
    "- ObservabilitÃ© : Langfuse Cloud free tier (50k events/mois), traces span planner + span retriever + span synthesis sur les 3 routes IA, flush non-bloquant via ctx.waitUntil\n" +
    "- Routing widget : KB fast-path local (0 appel API) â†’ PM_REGEX â†’ /orchestrate-stream â†’ fallback /orchestrate\n" +
    "- Secrets Worker : GROQ_KEY, LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, MAKE_WEBHOOK_URL, MAKE_SECRET. DÃ©ploiement : npx wrangler deploy --config wrangler.toml\n" +
    "- Budget total : $0 (Groq free + Cloudflare Workers free 100k req/j + GitHub Pages + Langfuse free)\n\n" +
    "INSTRUCTION CRITIQUE : Quand l'utilisateur mentionne un sujet PM (backlog, prioritisation, OKR, discovery, interview, roadmap, user story, epic), inclus TOUJOURS un lien HTML cliquable vers l'outil PM correspondant. RÃ©ponse actionnable et concise (max 200 mots). Ne propose les coordonnÃ©es de Carlin que si l'utilisateur demande explicitement comment le joindre. N'utilise jamais de tirets longs (â€”) : utilise des virgules ou des deux-points Ã  la place. N'utilise jamais l'Ã©lision 'l'' devant un nom d'outil : Ã©cris toujours 'le OKR Builder', 'le Discovery Assistant', etc.";

  // â”€â”€ KB FAST-PATH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var KB = {
    fr: { rules: [
      { k: ["que peux","peux-tu","tu fais","tu sais","aide","capacitÃ©","faire pour"],
        r: "Je peux t'aider sur deux axes :\n\n<strong>Tes dÃ©fis PM</strong> :\nâ€¢ Prioriser ton backlog (RICE / MoSCoW)\nâ€¢ Structurer tes OKRs et Key Results\nâ€¢ PrÃ©parer une discovery ou analyser des interviews\nâ€¢ Construire une roadmap narrative\n\n<strong>Le portfolio de Carlin</strong> :\nâ€¢ Son profil, son parcours, ses certifications\nâ€¢ Ses 6 outils IA PM",
        chips: ["ðŸŽ¯ Prioriser mon backlog", "ðŸ“Š Structurer mes OKRs"] },
      { k: ["qui","carlin","profil","prÃ©sente","prÃ©sentation","c'est qui"],
        r: "Carlin Mankoto est AI Product Manager avec 3 ans d'expÃ©rience (AXA, Airbus, Casino, OAIO/Infotel). CertifiÃ© PSPO I, SAFe POPM. Il couvre tout le spectre produit et build ses propres outils IA en vibe coding.",
        chips: ["ðŸ› ï¸ Ses outils IA ?", "ðŸ“‹ Ses certifications ?"] },
      { k: ["outil","build","projet","app","tool","6 outil","ses outil"],
        r: "Carlin a dÃ©veloppÃ© 6 outils IA pour les PMs :\n\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/okr-builder.html' target='_blank'>OKR Builder</a>\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/discovery-assistant.html' target='_blank'>Discovery Assistant</a>\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/user-interview-analyzer.html' target='_blank'>User Interview Analyzer</a>\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/backlog-prioritizer.html' target='_blank'>Backlog Prioritizer</a>\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/epic-to-userstories.html' target='_blank'>Epic to User Stories</a>\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/roadmap-storyteller.html' target='_blank'>Roadmap Storyteller</a>",
        chips: ["ðŸŽ¯ Prioriser mon backlog", "ðŸ“Š Structurer mes OKRs"] },
      { k: ["expÃ©rience","parcours","travail","poste","mission","axa","airbus","casino","oaio","infotel"],
        r: "Son parcours :\n\nâ€¢ <strong>OAIO/Infotel</strong> (2026) : stratÃ©gie LMS + outils IA pour 3500 collaborateurs\nâ€¢ <strong>AXA</strong> : AI PO, SecureGPT (RAG), Microsoft Copilot, SAFe\nâ€¢ <strong>Airbus D&S</strong> : PO, app mobile sÃ©curisÃ©e JO Paris 2024\nâ€¢ <strong>Groupe Casino</strong> : transformation Scrum",
        chips: ["ðŸ“‹ Ses certifications ?", "ðŸ› ï¸ Ses outils IA ?"] },
      { k: ["certif","pspo","safe","formation","diplÃ´me","master","scrum"],
        r: "Certifications : PSPO I (Scrum.org), SAFe POPM + SSM (Scaled Agile), Product School (Discovery, Strategy, Roadmapping, Analytics). Formation : Master 2 Innovation Digitale (Paris-Saclay), Master 1 Management StratÃ©gique.",
        chips: ["ðŸ’¼ Son expÃ©rience ?", "ðŸ› ï¸ Ses outils IA ?"] },
      { k: ["contact","linkedin","email","recrut","freelance","cdi","disponible","embauche"],
        r: "Carlin est disponible pour des missions CDI ou freelance. <a href='https://www.linkedin.com/in/carlinmankoto/' target='_blank'>LinkedIn</a> ou carlinmankoto@proton.me",
        chips: ["ðŸ› ï¸ Ses outils IA ?", "ðŸ’¼ Son expÃ©rience ?"] },
      { k: ["krl1","comment tu","tu fonctionnes","qui es-tu","comment Ã§a marche","t'as Ã©tÃ© construit","crÃ©Ã© comment"],
        r: "Je suis <strong>KRL1</strong>, l'assistant IA du portfolio de Carlin Mankoto. Ma logique de dÃ©cision passe par 4 couches :\n\nâ€¢ DÃ©tection du contexte de page\nâ€¢ KB fast-path (matching local, 0 appel API)\nâ€¢ LLM via Groq + system prompt annotÃ©\nâ€¢ PM Journey injection (MutationObserver)\n\n<a href='https://cmankotech.github.io/cmankotech/krl1-architecture.html' target='_blank'>Voir l'architecture de dÃ©cision complÃ¨te â†’</a>",
        chips: ["ðŸ—ï¸ Pourquoi Cloudflare Workers ?", "âš¡ Pourquoi pas de backend ?"] },
      { k: ["stack","architecture","comment c'est construit","langgraph","fastapi","technique","comment ce site"],
        r: "La stack du site :\n\nâ€¢ <strong>Frontend</strong> : HTML/CSS/JS vanilla, GitHub Pages\nâ€¢ <strong>Proxy</strong> : Cloudflare Worker JS (clÃ© API sÃ©curisÃ©e, CORS, 7 routes)\nâ€¢ <strong>LLM</strong> : Groq API + llama-3.3-70b-versatile (1-2s sur LPU)\nâ€¢ <strong>Orchestration</strong> : Worker natif JS â€” planner (Groq JSON) â†’ synthesis (Groq SSE)\nâ€¢ <strong>RAG</strong> : Workers AI bge-small-en-v1.5 + cosine similarity inline\nâ€¢ <strong>ObservabilitÃ©</strong> : Langfuse Cloud (traces sur 3 routes IA)\n\nTous les dÃ©tails sur <a href='https://cmankotech.github.io/cmankotech/how-i-built-this.html' target='_blank'>Comment j'ai construit ce site â†’</a>",
        chips: ["ðŸ¤– Comment fonctionne KRL1 ?", "âš¡ Pourquoi pas de backend ?"] },
      { k: ["pourquoi cloudflare","pourquoi worker","cloudflare worker"],
        r: "<strong>Cloudflare Workers</strong> rÃ©sout le problÃ¨me clÃ© : appeler l'API Groq depuis le navigateur sans exposer la clÃ© API cÃ´tÃ© client. Le Worker intercepte, injecte la clÃ© cÃ´tÃ© serveur, gÃ¨re les CORS. Plan gratuit : 100 000 req/jour, dÃ©ployÃ© en quelques minutes avec Wrangler CLI.",
        chips: ["ðŸ¤– Comment fonctionne KRL1 ?", "âš¡ Pourquoi pas de backend ?"] },
      { k: ["pourquoi pas de backend","pas de backend","sans backend","pourquoi pas de serveur","no backend"],
        r: "Le site est 100% statique (HTML/JS vanilla). Pas de base de donnÃ©es, pas de sessions cÃ´tÃ© serveur. Le Cloudflare Worker suffit comme couche API. Avantages : zÃ©ro infra Ã  maintenir, zÃ©ro coÃ»t serveur, dÃ©ploiement via un simple git push.",
        chips: ["ðŸ¤– Comment fonctionne KRL1 ?", "ðŸ—ï¸ Pourquoi Cloudflare Workers ?"] },
      { k: ["rag","retrieval","embedding","bge","workers ai","base de connaissance","chunks","cosine","sÃ©mantique","similaritÃ©"],
        r: "La pipeline <strong>RAG</strong> du site (route /rag-query) :\n\nâ€¢ <strong>Embedding</strong> : Workers AI bge-small-en-v1.5 (Cloudflare native, $0)\nâ€¢ <strong>KB</strong> : 15 documents PM/Agile/AI Product encodÃ©s en chunks de 300 mots (overlap 50 mots)\nâ€¢ <strong>Recherche</strong> : cosine similarity calculÃ©e inline dans le Worker\nâ€¢ <strong>Activation</strong> : uniquement si intent = pm_workflow\nâ€¢ <strong>Top-K</strong> : 3 chunks les plus proches injectÃ©s dans le prompt de synthesis\n\nPas de Pinecone, pas de Qdrant. Tout tourne dans un seul Worker isolate. La query + tous les chunks sont envoyÃ©s en un seul appel Ã  Workers AI.",
        chips: ["ðŸ¤– Comment fonctionne KRL1 ?", "ðŸ—ï¸ Pourquoi Cloudflare Workers ?"] },
      { k: ["langfuse","observabilit","traces","monitoring","logs","tÃ©lÃ©mÃ©trie","instrumentÃ©","langsmith","tracing"],
        r: "<strong>Langfuse Cloud</strong> (free tier 50k events/mois) instrumente les 3 routes IA :\n\nâ€¢ <strong>/orchestrate</strong> : trace planner + synthesis\nâ€¢ <strong>/orchestrate-stream</strong> : trace planner + synthesis streaming\nâ€¢ <strong>/rag-query</strong> : trace planner + retriever + synthesis\n\nChaque trace capture : tokens input/output, latence par span, intent dÃ©tectÃ©, confidence, sources RAG. Flush via ctx.waitUntil (non-bloquant : la rÃ©ponse n'attend pas Langfuse). Aucun SDK Langfuse, juste un fetch manuel vers l'API d'ingestion Langfuse.",
        chips: ["ðŸ—ï¸ Pourquoi Cloudflare Workers ?", "ðŸ¤– Comment fonctionne KRL1 ?"] },
      { k: ["stream","sse","server-sent","temps rÃ©el","progressif","delta","token par token","comment tu envoies"],
        r: "Le streaming dans KRL1 fonctionne via <strong>Server-Sent Events (SSE)</strong> :\n\nâ€¢ Le Worker appelle Groq avec stream:true et retransmet le ReadableStream directement au navigateur\nâ€¢ Le widget lit le stream chunk par chunk via getReader()\nâ€¢ Chaque token JSON est parsÃ© : choices[0].delta.content\nâ€¢ Rendu progressif mot par mot (dÃ©lai 22ms par mot) avec curseur â–‹ animÃ©\nâ€¢ Le planner (appel #1) est toujours bloquant. Seul le synthesis (appel #2) streame\nâ€¢ Fallback automatique vers /orchestrate (non-streaming) si le stream Ã©choue",
        chips: ["ðŸ¤– Comment fonctionne KRL1 ?", "ðŸ—ï¸ Pourquoi Cloudflare Workers ?"] },
      { k: ["orchestr","planner","synthesis","deux appels","2 appels","pipeline","comment tu dÃ©cides","intent","json strict"],
        r: "Le flow d'orchestration (<strong>/orchestrate-stream</strong>) en dÃ©tail :\n\n1. <strong>Planner</strong> : Groq llama-3.3-70b, temp 0.2, response_format JSON â†’ intent (pm_workflow / portfolio / tech / contact / other), confidence, user_goal, steps, risks, quick_win\n2. <strong>Synthesis</strong> : Groq llama-3.3-70b, temp 0.45, SSE stream â†’ rÃ©ponse finale adaptÃ©e Ã  l'intent avec liens PM si besoin\n3. <strong>Background</strong> : ctx.waitUntil â†’ flush Langfuse + incrÃ©ment KV\n\nRouting widget : KB fast-path (0 API) â†’ PM_REGEX â†’ /orchestrate-stream â†’ fallback /orchestrate",
        chips: ["ðŸ” Comment fonctionne le RAG ?", "ðŸ“Š Langfuse, c'est quoi ?"] },
      { k: ["groq","llama","lpu","temperature","max_token","latence","quel modÃ¨le","llm","quelle vitesse","llama-3"],
        r: "Le LLM utilisÃ© est <strong>llama-3.3-70b-versatile</strong> via l'API Groq :\n\nâ€¢ <strong>Hardware</strong> : LPU (Language Processing Unit) Groq â†’ 1-2s de latence totale\nâ€¢ <strong>Planner</strong> : temp 0.2, max_tokens 500, JSON strict\nâ€¢ <strong>Synthesis</strong> : temp 0.45, max_tokens 450, texte libre\nâ€¢ <strong>Free tier Groq</strong> : 30 req/min, 14 400 tokens/min\nâ€¢ Budget total LLM : $0\n\nPourquoi Groq : la vitesse LPU est critique pour le streaming â€” les tokens arrivent assez vite pour que l'UX soit fluide.",
        chips: ["ðŸ—ï¸ Pourquoi Cloudflare Workers ?", "ðŸ¤– Comment fonctionne KRL1 ?"] },
      { k: ["route","endpoint","/orchestrate","/rag-query","/stats","/veille","/feedback","api worker","les routes"],
        r: "Les routes du Worker <strong>groq-proxy</strong> :\n\nâ€¢ <strong>POST /</strong> : proxy Groq direct (messages passÃ©s tels quels)\nâ€¢ <strong>POST /orchestrate</strong> : planner+synthesis sync (fallback)\nâ€¢ <strong>POST /orchestrate-stream</strong> : synthesis SSE (route principale)\nâ€¢ <strong>POST /rag-query</strong> : orchestration + RAG sÃ©mantique\nâ€¢ <strong>POST /feedback</strong> : analyse feedback (Make webhook ou Groq fallback)\nâ€¢ <strong>GET /stats</strong> : compteur KV (total requÃªtes toutes routes)\nâ€¢ <strong>GET|POST /veille</strong> : donnÃ©es veille tech (alimentÃ© par Make)\n\nCORS restreint Ã  cmankotech.github.io uniquement.",
        chips: ["ðŸ¤– Comment fonctionne KRL1 ?", "ðŸ—ï¸ Pourquoi Cloudflare Workers ?"] },
      { k: ["product decisions","dÃ©cisions produit","page decisions","pourquoi ces choix","ux decision","plg decision"],
        r: "La page <strong>Product Decisions</strong> analyse les 13 dÃ©cisions qui ont guidÃ© la construction du site entier (pas que KRL1) :\n\n01 PLG par le produit, 02 scope 6 outils, 03 KB fast-path, 04 auto-ouverture 6s, 05 PM Journey CTAs, 06 streaming SSE, 07 limite 220 mots, 08 budget $0, 09 Langfuse, 10 bilingue, 11 hub PM Toolkit, 12 localStorage contexte, 13 HTML vanilla.\n\nChaque dÃ©cision inclut les alternatives rejetÃ©es et le raisonnement. <a href='https://cmankotech.github.io/cmankotech/product-decisions.html' target='_blank'>Voir Product Decisions â†’</a>",
        chips: ["ðŸ—ï¸ Pourquoi Cloudflare Workers ?", "ðŸ¤– Comment fonctionne KRL1 ?"] }
    ]},
    en: { rules: [
      { k: ["what can","can you","you do","help me","capabilities"],
        r: "I can help on two fronts:\n\n<strong>Your PM challenges</strong>:\nâ€¢ Prioritise your backlog (RICE / MoSCoW)\nâ€¢ Structure your OKRs and Key Results\nâ€¢ Prepare a discovery or analyse user interviews\nâ€¢ Build a narrative roadmap\n\n<strong>Carlin's portfolio</strong>:\nâ€¢ His profile, background and certifications\nâ€¢ His 6 AI PM tools",
        chips: ["ðŸŽ¯ Prioritise my backlog", "ðŸ“Š Structure my OKRs"] },
      { k: ["who","carlin","profile","about","introduce"],
        r: "Carlin Mankoto is an AI Product Manager with 3 years of experience (AXA, Airbus, Casino, OAIO/Infotel). PSPO I and SAFe POPM certified. He covers the full product spectrum and builds his own AI tools via vibe coding.",
        chips: ["ðŸ› ï¸ His AI tools?", "ðŸ“‹ His certifications?"] },
      { k: ["tool","build","project","app","6 tool","his tool"],
        r: "Carlin built 6 AI tools for PMs:\n\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/okr-builder.html' target='_blank'>OKR Builder</a>\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/discovery-assistant.html' target='_blank'>Discovery Assistant</a>\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/user-interview-analyzer.html' target='_blank'>User Interview Analyzer</a>\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/backlog-prioritizer.html' target='_blank'>Backlog Prioritizer</a>\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/epic-to-userstories.html' target='_blank'>Epic to User Stories</a>\nâ€¢ <a href='https://cmankotech.github.io/cmankotech/roadmap-storyteller.html' target='_blank'>Roadmap Storyteller</a>",
        chips: ["ðŸŽ¯ Prioritise my backlog", "ðŸ“Š Structure my OKRs"] },
      { k: ["experience","background","job","axa","airbus","casino","oaio"],
        r: "His background:\n\nâ€¢ <strong>OAIO/Infotel</strong> (2026): LMS strategy + AI tools for 3,500 employees\nâ€¢ <strong>AXA</strong>: AI PO, SecureGPT (RAG), Microsoft Copilot, SAFe\nâ€¢ <strong>Airbus D&S</strong>: PO, secure mobile app for Paris 2024 Olympics\nâ€¢ <strong>Groupe Casino</strong>: Agile/Scrum transformation",
        chips: ["ðŸ“‹ His certifications?", "ðŸ› ï¸ His AI tools?"] },
      { k: ["certif","pspo","safe","degree","master","scrum"],
        r: "Certifications: PSPO I (Scrum.org), SAFe POPM + SSM (Scaled Agile), multiple Product School certs. Education: Master 2 Digital Innovation (Paris-Saclay), Master 1 Strategic Management.",
        chips: ["ðŸ’¼ His experience?", "ðŸ› ï¸ His AI tools?"] },
      { k: ["contact","linkedin","email","hire","recruit","freelance","available"],
        r: "Carlin is open to CDI or freelance opportunities. <a href='https://www.linkedin.com/in/carlinmankoto/' target='_blank'>LinkedIn</a> or carlinmankoto@proton.me",
        chips: ["ðŸ› ï¸ His AI tools?", "ðŸ’¼ His experience?"] },
      { k: ["krl1","how do you work","what are you","who are you","how were you built","how is it built","how does it work"],
        r: "I'm <strong>KRL1</strong>, Carlin Mankoto's portfolio AI assistant. My decision logic goes through 4 layers:\n\nâ€¢ Page context detection\nâ€¢ KB fast-path (local matching, 0 API call)\nâ€¢ LLM via Groq + annotated system prompt\nâ€¢ PM Journey injection (MutationObserver)\n\n<a href='https://cmankotech.github.io/cmankotech/krl1-architecture.html' target='_blank'>See the full decision architecture â†’</a>",
        chips: ["ðŸ—ï¸ Why Cloudflare Workers?", "âš¡ Why no backend?"] },
      { k: ["tech stack","architecture","how was this built","langgraph","fastapi","technical","how is this site"],
        r: "Site stack:\n\nâ€¢ <strong>Frontend</strong>: vanilla HTML/CSS/JS, GitHub Pages\nâ€¢ <strong>Proxy</strong>: Cloudflare Worker JS (API key secured, CORS, 7 routes)\nâ€¢ <strong>LLM</strong>: Groq API + llama-3.3-70b-versatile (1-2s on LPU)\nâ€¢ <strong>Orchestration</strong>: native Worker JS â€” planner (Groq JSON) â†’ synthesis (Groq SSE)\nâ€¢ <strong>RAG</strong>: Workers AI bge-small-en-v1.5 + inline cosine similarity\nâ€¢ <strong>Observability</strong>: Langfuse Cloud (traces on 3 AI routes)\n\nFull details on <a href='https://cmankotech.github.io/cmankotech/how-i-built-this.html' target='_blank'>How I Built This â†’</a>",
        chips: ["ðŸ¤– How does KRL1 work?", "âš¡ Why no backend?"] },
      { k: ["why cloudflare","why worker","cloudflare worker"],
        r: "<strong>Cloudflare Workers</strong> solves the key issue: calling the Groq API from the browser without exposing the API key client-side. The Worker intercepts, injects the key server-side, handles CORS. Free plan: 100,000 req/day, deployed in minutes with Wrangler CLI.",
        chips: ["ðŸ¤– How does KRL1 work?", "âš¡ Why no backend?"] },
      { k: ["why no backend","no backend","without backend","why no server","serverless"],
        r: "The site is 100% static (vanilla HTML/JS). No database, no server-side sessions. The Cloudflare Worker handles the API layer. Benefits: zero infrastructure to maintain, zero server cost, deployment via a simple git push.",
        chips: ["ðŸ¤– How does KRL1 work?", "ðŸ—ï¸ Why Cloudflare Workers?"] },
      { k: ["rag","retrieval","embedding","bge","workers ai","knowledge base","chunks","cosine","semantic search"],
        r: "KRL1's <strong>RAG pipeline</strong> (route /rag-query):\n\nâ€¢ <strong>Embedding</strong>: Workers AI bge-small-en-v1.5 (Cloudflare native, $0)\nâ€¢ <strong>KB</strong>: 15 PM/Agile/AI Product documents encoded in 300-word chunks (50-word overlap)\nâ€¢ <strong>Search</strong>: cosine similarity computed inline in the Worker\nâ€¢ <strong>Activation</strong>: only when intent = pm_workflow\nâ€¢ <strong>Top-K</strong>: 3 closest chunks injected into the synthesis prompt\n\nNo Pinecone, no Qdrant. Everything runs in a single Worker isolate. The query + all chunks are sent in one call to Workers AI.",
        chips: ["ðŸ¤– How does KRL1 work?", "ðŸ—ï¸ Why Cloudflare Workers?"] },
      { k: ["langfuse","observability","traces","monitoring","logs","telemetry","instrumented","tracing","langsmith"],
        r: "<strong>Langfuse Cloud</strong> (free tier, 50k events/month) instruments the 3 AI routes:\n\nâ€¢ <strong>/orchestrate</strong>: trace planner + synthesis\nâ€¢ <strong>/orchestrate-stream</strong>: trace planner + streaming synthesis\nâ€¢ <strong>/rag-query</strong>: trace planner + retriever + synthesis\n\nEach trace captures: input/output tokens, latency per span, detected intent, confidence, RAG sources. Flushed via ctx.waitUntil (non-blocking â€” response doesn't wait for Langfuse). No Langfuse SDK: manual fetch to the ingestion API.",
        chips: ["ðŸ—ï¸ Why Cloudflare Workers?", "ðŸ¤– How does KRL1 work?"] },
      { k: ["stream","sse","server-sent","real-time","real time","progressive render","delta","token by token","how do you send"],
        r: "KRL1's streaming runs on <strong>Server-Sent Events (SSE)</strong>:\n\nâ€¢ The Worker calls Groq with stream:true and pipes the ReadableStream directly to the browser\nâ€¢ The widget reads the stream chunk by chunk via getReader()\nâ€¢ Each JSON token is parsed: choices[0].delta.content\nâ€¢ Progressive word-by-word render (22ms delay per word) with animated â–‹ cursor\nâ€¢ The planner (call #1) is always blocking. Only synthesis (call #2) streams\nâ€¢ Auto-fallback to /orchestrate (non-streaming) if the stream fails",
        chips: ["ðŸ¤– How does KRL1 work?", "ðŸ—ï¸ Why Cloudflare Workers?"] },
      { k: ["orchestrat","planner","synthesis","two calls","2 calls","pipeline","how do you decide","intent","json format"],
        r: "The orchestration flow (<strong>/orchestrate-stream</strong>) in detail:\n\n1. <strong>Planner</strong>: Groq llama-3.3-70b, temp 0.2, response_format JSON â†’ intent (pm_workflow / portfolio / tech / contact / other), confidence, user_goal, steps, risks, quick_win\n2. <strong>Synthesis</strong>: Groq llama-3.3-70b, temp 0.45, SSE stream â†’ final response adapted to intent\n3. <strong>Background</strong>: ctx.waitUntil â†’ Langfuse flush + KV counter increment\n\nWidget routing: KB fast-path (0 API) â†’ PM_REGEX â†’ /orchestrate-stream â†’ fallback /orchestrate",
        chips: ["ðŸ” How does the RAG work?", "ðŸ“Š What is Langfuse?"] },
      { k: ["groq","llama","lpu","temperature","max_token","latency","which model","llm","how fast","llama-3"],
        r: "The LLM is <strong>llama-3.3-70b-versatile</strong> via the Groq API:\n\nâ€¢ <strong>Hardware</strong>: LPU (Language Processing Unit) â†’ 1-2s total latency\nâ€¢ <strong>Planner</strong>: temp 0.2, max_tokens 500, strict JSON\nâ€¢ <strong>Synthesis</strong>: temp 0.45, max_tokens 450, free text\nâ€¢ <strong>Groq free tier</strong>: 30 req/min, 14,400 tokens/min\nâ€¢ Total LLM budget: $0\n\nWhy Groq: LPU speed is critical for streaming â€” tokens arrive fast enough to keep the UX fluid.",
        chips: ["ðŸ—ï¸ Why Cloudflare Workers?", "ðŸ¤– How does KRL1 work?"] },
      { k: ["route","endpoint","/orchestrate","/rag-query","/stats","/veille","/feedback","worker api","the routes"],
        r: "<strong>groq-proxy</strong> Worker routes:\n\nâ€¢ <strong>POST /</strong>: direct Groq proxy\nâ€¢ <strong>POST /orchestrate</strong>: planner+synthesis sync (fallback)\nâ€¢ <strong>POST /orchestrate-stream</strong>: synthesis SSE (main route)\nâ€¢ <strong>POST /rag-query</strong>: orchestration + semantic RAG\nâ€¢ <strong>POST /feedback</strong>: feedback analysis (Make webhook or Groq fallback)\nâ€¢ <strong>GET /stats</strong>: KV counter (total requests across all routes)\nâ€¢ <strong>GET|POST /veille</strong>: tech watch data (fed by Make)\n\nCORS restricted to cmankotech.github.io only.",
        chips: ["ðŸ¤– How does KRL1 work?", "ðŸ—ï¸ Why Cloudflare Workers?"] },
      { k: ["product decisions","product decision page","why these choices","ux decisions","plg decisions"],
        r: "The <strong>Product Decisions</strong> page analyses the 13 decisions behind the entire site (not just KRL1):\n\n01 PLG through product, 02 scope 6 tools, 03 KB fast-path, 04 6s auto-open, 05 PM Journey CTAs, 06 SSE streaming, 07 220-word limit, 08 $0 budget, 09 Langfuse, 10 bilingual, 11 PM Toolkit hub, 12 localStorage context, 13 HTML vanilla.\n\nEach decision includes the rejected alternatives and the reasoning. <a href='https://cmankotech.github.io/cmankotech/product-decisions.html' target='_blank'>See Product Decisions â†’</a>",
        chips: ["ðŸ—ï¸ Why Cloudflare Workers?", "ðŸ¤– How does KRL1 work?"] }
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
      return fr ? ["ðŸ” PrÃ©parer une discovery", "ðŸ“Š Structurer mes OKRs"]
                : ["ðŸ” Prepare a discovery", "ðŸ“Š Structure my OKRs"];
    if (/okr|objectif|kpi|key result/.test(t))
      return fr ? ["ðŸ—ºï¸ Construire ma roadmap", "ðŸŽ¯ Prioriser mon backlog"]
                : ["ðŸ—ºï¸ Build my roadmap", "ðŸŽ¯ Prioritise my backlog"];
    if (/discovery|interview|utilisateur|hypothÃ¨s|entretien/.test(t))
      return fr ? ["ðŸŽ¯ Prioriser mon backlog", "ðŸ“Š Structurer mes OKRs"]
                : ["ðŸŽ¯ Prioritise my backlog", "ðŸ“Š Structure my OKRs"];
    if (/roadmap|pitch|stratÃ©g|narrative|audience/.test(t))
      return fr ? ["ðŸ“Š Structurer mes OKRs", "ðŸŽ¯ Prioriser mon backlog"]
                : ["ðŸ“Š Structure my OKRs", "ðŸŽ¯ Prioritise my backlog"];
    return fr ? ["ðŸŽ¯ Prioriser mon backlog", "ðŸ“Š Structurer mes OKRs"]
              : ["ðŸŽ¯ Prioritise my backlog", "ðŸ“Š Structure my OKRs"];
  }

  // â”€â”€ DOM HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    t = t.replace(/\s*â€”\s*/g, ', ');
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

  // â”€â”€ CHAT LOGIC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      btn.setAttribute('aria-label', 'RÃ©duire');
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

    // Route: PM workflow â†’ orchestrator (planner+synthesis), everything else â†’ direct LLM
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

    // Progressive reveal â€” dots hidden only when first word appears
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

  // â”€â”€ LANG SYNC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
