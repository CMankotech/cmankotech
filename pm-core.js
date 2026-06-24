/* PM Toolkit — Shared AI core v1
   Single entry point for the Groq proxy call, JSON repair and friendly errors.
   The 6 tools used to duplicate fetch + parse + error handling; they now delegate
   here. Mirrors the module shape of pm-session.js (IIFE on window). */
(function (G) {
  'use strict';

  var ENDPOINT = 'https://groq-proxy.cmankotech.workers.dev';
  var MODEL = 'llama-3.3-70b-versatile';
  var TIMEOUT_MS = 30000;

  /* ── language (defers to PMSession, falls back to page globals) ── */
  function lang() {
    try {
      if (G.PMSession && PMSession.lang) return PMSession.lang();
      if (G.currentLang === 'en' || G._lang === 'en') return 'en';
    } catch (e) {}
    return 'fr';
  }

  /* ── friendly API errors (was copy-pasted in every tool) ── */
  function friendlyApiError(err, status, lg) {
    lg = lg || lang();
    var en = lg === 'en';
    if (status === 429) return en ? 'Rate limit reached : wait a moment and try again.' : 'Limite de requêtes atteinte : attends un instant et réessaie.';
    if (status === 503 || status === 502) return en ? 'Service temporarily unavailable : try again in a moment.' : 'Service temporairement indisponible : réessaie dans quelques instants.';
    if (status === 401) return en ? 'Authentication error : contact support.' : 'Erreur d\'authentification : contacte le support.';
    if (err && err.message) return err.message;
    return en ? ('Unexpected error (' + status + '). Try again or contact support.') : ('Erreur inattendue (' + status + '). Réessaie ou contacte le support.');
  }

  /* ── robust JSON extraction + light repair for LLM output ── */
  function parseJSON(text) {
    var clean = String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    try { return JSON.parse(clean); } catch (e) {}
    var match = clean.match(/\{[\s\S]*\}/) || clean.match(/\[[\s\S]*\]/);
    if (match) {
      var body = match[0];
      try { return JSON.parse(body); } catch (e2) {}
      // light repair: drop trailing commas before a closing } or ]
      var repaired = body.replace(/,\s*([}\]])/g, '$1');
      try { return JSON.parse(repaired); } catch (e3) {}
    }
    throw new Error(lang() === 'en' ? 'Could not parse the response. Try again.' : 'Impossible de parser la réponse. Réessaie.');
  }

  /* ── single proxy call ──
     callAI(prompt, opts) where opts is a maxTokens number OR an object:
       { maxTokens, temperature, messages, responseFormat, signal, timeout, lang }
     Returns the assistant message content string. */
  async function callAI(prompt, opts) {
    if (typeof opts === 'number') opts = { maxTokens: opts };
    opts = opts || {};
    var maxTokens = opts.maxTokens || 2000;
    var temperature = (opts.temperature == null) ? 0.5 : opts.temperature;
    var messages = opts.messages || [{ role: 'user', content: prompt }];

    // Use the caller's signal if provided, else manage our own timeout.
    var ownCtrl = opts.signal ? null : new AbortController();
    var signal = opts.signal || (ownCtrl && ownCtrl.signal);
    var timeout = ownCtrl ? setTimeout(function () { ownCtrl.abort(); }, opts.timeout || TIMEOUT_MS) : null;

    try {
      var payload = { model: MODEL, temperature: temperature, max_tokens: maxTokens, messages: messages };
      if (opts.responseFormat) payload.response_format = opts.responseFormat;
      var res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: signal,
        body: JSON.stringify(payload)
      });
      if (timeout) clearTimeout(timeout);
      if (!res.ok) {
        var e = {};
        try { e = await res.json(); } catch (_) {}
        throw new Error(friendlyApiError(e.error, res.status, opts.lang));
      }
      var data = await res.json();
      return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    } catch (err) {
      if (timeout) clearTimeout(timeout);
      throw err;
    }
  }

  /* ── convenience: call then parse ── */
  async function callJSON(prompt, opts) {
    return parseJSON(await callAI(prompt, opts));
  }

  /* ── premium editing: inline-editable result fields ──
     Tools tag editable nodes with data-ep="dot.path.into.result" in their render,
     then call PMCore.bindEditing(container, resultObject, onSave). On blur the edited
     text is written back at that path and onSave(result) persists + re-renders. */
  function getPath(obj, path) {
    return String(path).split('.').reduce(function(o, k) { return o == null ? o : o[k]; }, obj);
  }
  function setPath(obj, path, value) {
    var parts = String(path).split('.'), o = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (o[k] == null) o[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      o = o[k];
    }
    o[parts[parts.length - 1]] = value;
  }
  function bindEditing(container, data, onSave) {
    if (!container) return;
    injectStyles();
    var nodes = container.querySelectorAll('[data-ep]');
    Array.prototype.forEach.call(nodes, function(el) {
      if (el._pmEdit) return;
      el._pmEdit = true;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
      el.classList.add('pm-editable');
      if (!el.getAttribute('title')) el.setAttribute('title', lang() === 'en' ? 'Click to edit' : 'Cliquer pour éditer');
      el.addEventListener('blur', function() {
        var v = el.textContent.replace(/\s+$/, '');
        var path = el.getAttribute('data-ep');
        if (String(getPath(data, path) == null ? '' : getPath(data, path)) === v) return;
        setPath(data, path, v);
        try { onSave(data); } catch(e) {}
      });
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
      });
    });
  }

  /* ── confidence badge ── */
  function confidenceBadge(conf, lg) {
    if (conf == null || conf === '') return '';
    var n = typeof conf === 'number' ? conf : parseFloat(conf);
    if (isNaN(n)) return '';
    if (n > 1) n = n / 100;
    var pct = Math.round(n * 100);
    var level = n >= 0.75 ? 'hi' : (n >= 0.5 ? 'mid' : 'lo');
    var en = (lg || lang()) === 'en';
    var lbl = en ? 'confidence' : 'confiance';
    var note = en ? 'AI-estimated score' : 'score estimé par l\'IA';
    injectStyles();
    return '<span class="pm-conf pm-conf-' + level + '" title="' + note + '">' + pct + '% ' + lbl + '</span>'
      + '<span class="pm-conf-note">' + note + '</span>';
  }

  /* ── regenerate button (styling only ; tools wire their own onclick) ── */
  function regenButton(onclickExpr, lg) {
    injectStyles();
    var lbl = (lg || lang()) === 'en' ? 'Regenerate' : 'Régénérer';
    return '<button type="button" class="pm-regen" title="' + lbl + '" onclick="' + onclickExpr + '">↻</button>';
  }

  /* ── one-time shared styles for the premium affordances ── */
  var _stylesDone = false;
  function injectStyles() {
    if (_stylesDone || typeof document === 'undefined' || !document.head) return;
    _stylesDone = true;
    var css =
      '.pm-editable{outline:none;border-radius:5px;transition:background .15s,box-shadow .15s;cursor:text}' +
      '.pm-editable:hover{background:rgba(255,255,255,0.05)}' +
      '.pm-editable:focus{background:rgba(255,255,255,0.07);box-shadow:0 0 0 1px rgba(96,165,250,0.45)}' +
      '[data-theme="light"] .pm-editable:hover{background:rgba(15,23,42,0.04)}' +
      '[data-theme="light"] .pm-editable:focus{background:rgba(15,23,42,0.05);box-shadow:0 0 0 1px rgba(59,130,246,0.4)}' +
      '.pm-conf{display:inline-flex;align-items:center;gap:0.3rem;font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:0.2rem 0.55rem;border-radius:99px;vertical-align:middle}' +
      '.pm-conf-hi{color:#86efac;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.25)}' +
      '.pm-conf-mid{color:#fbbf24;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25)}' +
      '.pm-conf-lo{color:#fca5a5;background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.25)}' +
      '.pm-conf-note{margin-left:0.5rem;font-size:0.62rem;font-style:italic;color:var(--muted,#94a3b8);letter-spacing:0.01em;vertical-align:middle}' +
      '.pm-regen{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);color:var(--dim,#94a3b8);cursor:pointer;font-size:0.85rem;line-height:1;font-family:inherit;transition:all .18s;flex-shrink:0}' +
      '.pm-regen:hover{color:var(--text,#e2e8f0);border-color:rgba(96,165,250,0.45);background:rgba(96,165,250,0.1);transform:rotate(45deg)}' +
      '.pm-regen:disabled{opacity:0.4;cursor:wait;transform:none}';
    var s = document.createElement('style');
    s.id = 'pm-core-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ── public API ── */
  G.PMCore = {
    ENDPOINT: ENDPOINT,
    MODEL: MODEL,
    TIMEOUT_MS: TIMEOUT_MS,
    callAI: callAI,
    callJSON: callJSON,
    parseJSON: parseJSON,
    friendlyApiError: friendlyApiError,
    lang: lang,
    bindEditing: bindEditing,
    confidenceBadge: confidenceBadge,
    regenButton: regenButton,
    getPath: getPath,
    setPath: setPath
  };

})(window);
