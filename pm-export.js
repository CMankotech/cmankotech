/* PM Toolkit — Notion export v1
   One-click "Export to Notion" via the Worker OAuth flow. Builds Notion blocks
   from the normalised session context (PMSession.context()) and opens the consent
   popup. The token never touches the browser : the Worker creates the page in the
   visitor's own workspace and postMessages the result back. Mirrors the IIFE-on-
   window shape of pm-core.js / pm-session.js. */
(function (G) {
  'use strict';

  var ENDPOINT = (G.PMCore && PMCore.ENDPOINT) || 'https://groq-proxy.cmankotech.workers.dev';
  var WORKER_ORIGIN = (function () { try { return new URL(ENDPOINT).origin; } catch (e) { return ENDPOINT; } })();

  function lang() {
    try { if (G.PMCore && PMCore.lang) return PMCore.lang(); } catch (e) {}
    try { if (G.currentLang === 'en' || G._lang === 'en') return 'en'; } catch (e) {}
    return 'fr';
  }

  var I18N = {
    fr: {
      btn: 'Export Notion', menu: 'Export Notion', full: 'Rapport complet',
      sending: 'Connexion…', created: 'Créé ✓', open: 'Ouvrir la page',
      empty: 'Rien à exporter pour le moment.',
      blocked: 'Popup bloquée : autorise les popups puis réessaie.',
      failed: 'Export interrompu. Réessaie.',
      notConfigured: 'Export Notion pas encore configuré.',
      privacy: 'Crée une page dans ton propre Notion. On ne conserve ni tes données ni ton accès.',
      sections: { discovery: 'Discovery', interview: 'Interviews', okr: 'OKR', backlog: 'Backlog', epic: 'User stories', roadmap: 'Roadmap' }
    },
    en: {
      btn: 'Export to Notion', menu: 'Export to Notion', full: 'Full report',
      sending: 'Connecting…', created: 'Created ✓', open: 'Open the page',
      empty: 'Nothing to export yet.',
      blocked: 'Popup blocked: allow popups and try again.',
      failed: 'Export interrupted. Try again.',
      notConfigured: 'Notion export not configured yet.',
      privacy: 'Creates a page in your own Notion. We keep neither your data nor your access.',
      sections: { discovery: 'Discovery', interview: 'Interviews', okr: 'OKRs', backlog: 'Backlog', epic: 'User stories', roadmap: 'Roadmap' }
    }
  };
  function T() { return I18N[lang()] || I18N.fr; }

  /* ── Notion block helpers ── */
  function rt(text) {
    var s = String(text == null ? '' : text);
    var out = [];
    while (s.length > 1900) { out.push({ type: 'text', text: { content: s.slice(0, 1900) } }); s = s.slice(1900); }
    out.push({ type: 'text', text: { content: s } });
    return out;
  }
  function h2(t) { return { object: 'block', type: 'heading_2', heading_2: { rich_text: rt(t) } }; }
  function para(t) { return { object: 'block', type: 'paragraph', paragraph: { rich_text: rt(t) } }; }
  function bullet(t) { return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: rt(t) } }; }
  function todo(t) { return { object: 'block', type: 'to_do', to_do: { rich_text: rt(t), checked: false } }; }
  function divider() { return { object: 'block', type: 'divider', divider: {} }; }

  var ALL_SECTIONS = ['discovery', 'interview', 'okr', 'backlog', 'epic', 'roadmap'];

  /* ── section → Notion blocks (mirrors product-brief buildMarkdown groupings,
        using the exact normalised shapes from PMSession.context()) ── */
  function sectionBlocks(section, ctx) {
    ctx = ctx || {};
    var en = lang() === 'en';
    var S = T().sections;
    var b = [];

    if (section === 'discovery') {
      var hyp = ctx.hypotheses || [];
      if (!(ctx._problem || ctx._target || hyp.length)) return [];
      b.push(h2(S.discovery));
      if (ctx._problem) b.push(para((en ? 'Problem: ' : 'Problème : ') + ctx._problem));
      if (ctx._target) b.push(para((en ? 'Target: ' : 'Cible : ') + ctx._target));
      hyp.forEach(function (h) { b.push(bullet((h.belief || '') + (h.signal ? (en ? ' — signal: ' : ' — signal : ') + h.signal : ''))); });

    } else if (section === 'interview') {
      var per = ctx.personas || [], pain = ctx.painPoints || [], opp = ctx.opportunities || [], quo = ctx.quotes || [];
      if (!(per.length || pain.length || opp.length || quo.length)) return [];
      b.push(h2(S.interview));
      per.forEach(function (p) { b.push(bullet((en ? 'Persona: ' : 'Persona : ') + (p.emoji ? p.emoji + ' ' : '') + (p.name || '') + (p.description ? ' — ' + p.description : ''))); });
      pain.forEach(function (p) { b.push(bullet((en ? 'Pain: ' : 'Pain : ') + (p.label || '') + (p.count ? ' (' + p.count + ')' : ''))); });
      opp.forEach(function (o) { b.push(bullet((en ? 'Opportunity: ' : 'Opportunité : ') + (o.title || '') + (o.description ? ' : ' + o.description : '') + (o.impact ? ' [' + o.impact + ']' : ''))); });
      quo.forEach(function (q) { b.push(bullet('“' + (q.text || '') + '”' + (q.profile ? ' — ' + q.profile : ''))); });

    } else if (section === 'okr') {
      var obj = ctx.objectives || [];
      if (!obj.length) return [];
      b.push(h2(S.okr));
      obj.forEach(function (o) {
        b.push(para('🎯 ' + (o.objective || '')));
        (o.keyResults || []).forEach(function (kr) { b.push(bullet(kr.text || '')); });
      });

    } else if (section === 'backlog') {
      var prio = ctx.priorities || [];
      if (!prio.length) return [];
      b.push(h2(S.backlog));
      prio.forEach(function (p, i) { b.push(bullet((i + 1) + '. ' + (p.label || '') + (p.justification ? ' — ' + p.justification : ''))); });

    } else if (section === 'epic') {
      var sto = ctx.stories || [];
      if (!sto.length) return [];
      b.push(h2(S.epic));
      sto.forEach(function (s) {
        b.push(para('• ' + (s.title || s.story || '')));
        (s.acceptanceCriteria || s.acceptance_criteria || []).slice(0, 8).forEach(function (a) { b.push(todo(a)); });
      });

    } else if (section === 'roadmap') {
      var rm = ctx.roadmap || {};
      if (!(rm.narrative || (rm.periods || []).length)) return [];
      b.push(h2(S.roadmap));
      if (rm.narrative) b.push(para(rm.narrative));
      (rm.periods || []).forEach(function (pr) {
        b.push(para((pr.label || pr.key || '') + (pr.theme ? ' — ' + pr.theme : '')));
        (pr.features || []).forEach(function (f) { b.push(bullet((f.title || '') + (f.why ? ' : ' + f.why : ''))); });
      });
    }
    return b;
  }

  function presentSections(ctx) {
    return ALL_SECTIONS.filter(function (s) { return sectionBlocks(s, ctx).length > 0; });
  }

  function ctxOf() {
    try { return G.PMSession && PMSession.context ? PMSession.context() : {}; } catch (e) { return {}; }
  }

  function buildPayload(scope, ctx) {
    ctx = ctx || ctxOf();
    var product = (ctx.product && ctx.product.name) || '';
    var blocks = [], title;
    if (scope === 'all') {
      title = 'Product Brief' + (product ? ' — ' + product : '');
      ALL_SECTIONS.forEach(function (s) {
        var sb = sectionBlocks(s, ctx);
        if (sb.length) { if (blocks.length) blocks.push(divider()); blocks = blocks.concat(sb); }
      });
    } else {
      title = (T().sections[scope] || scope) + (product ? ' — ' + product : '');
      blocks = sectionBlocks(scope, ctx);
    }
    return { title: title, blocks: blocks };
  }

  /* ── send : synchronous popup (avoids blockers) → prepare → navigate → await postMessage ── */
  function send(payload, onState) {
    var t = T();
    if (!payload || !payload.blocks || !payload.blocks.length) { onState({ kind: 'error', msg: t.empty }); return; }

    var popup = window.open('', 'pm_notion_oauth', 'width=640,height=760');
    if (!popup) { onState({ kind: 'error', msg: t.blocked }); return; }
    try { popup.document.write('<p style="font-family:system-ui;padding:24px;color:#333">' + t.sending + '</p>'); } catch (e) {}
    onState({ kind: 'sending' });

    var done = false;
    function finish(state) { if (done) return; done = true; window.removeEventListener('message', onMsg); onState(state); }
    function onMsg(e) {
      if (e.origin !== WORKER_ORIGIN) return;
      var d = e.data || {};
      if (d.source !== 'pm-export') return;
      if (d.ok) finish({ kind: 'created', url: d.url });
      else finish({ kind: 'error', msg: t.failed });
    }
    window.addEventListener('message', onMsg);

    fetch(ENDPOINT + '/export/prepare', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload: payload })
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          throw new Error(res.status === 503 ? t.notConfigured : (j.error || t.failed));
        });
      }
      return res.json();
    }).then(function (j) {
      if (!j.authorizeUrl) throw new Error(t.failed);
      try { popup.location.href = j.authorizeUrl; } catch (e) { throw new Error(t.blocked); }
    }).catch(function (err) {
      try { popup.close(); } catch (e) {}
      finish({ kind: 'error', msg: (err && err.message) || t.failed });
    });

    var poll = setInterval(function () {
      if (done) { clearInterval(poll); return; }
      if (popup.closed) { clearInterval(poll); finish({ kind: 'idle' }); }
    }, 800);
  }

  /* ── run : drive a button + status element through the export ── */
  function run(scope, btn, statusEl) {
    var t = T();
    var payload = buildPayload(scope, ctxOf());
    var orig = btn ? btn.textContent : '';
    send(payload, function (state) {
      if (!btn) return;
      if (state.kind === 'sending') {
        btn.disabled = true; btn.textContent = t.sending;
        if (statusEl) statusEl.textContent = '';
      } else if (state.kind === 'created') {
        btn.disabled = false; btn.textContent = t.created;
        if (statusEl) {
          statusEl.innerHTML = '';
          var a = document.createElement('a');
          a.href = state.url; a.target = '_blank'; a.rel = 'noopener';
          a.className = 'pmx-link'; a.textContent = t.open;
          statusEl.appendChild(a);
        }
        setTimeout(function () { btn.textContent = orig; }, 4000);
      } else if (state.kind === 'error') {
        btn.disabled = false; btn.textContent = orig;
        if (statusEl) statusEl.textContent = state.msg;
      } else {
        btn.disabled = false; btn.textContent = orig;
      }
    });
  }

  /* ── brief : populate a scope menu (full report + each present section) ── */
  function fillBriefMenu(listEl, statusEl) {
    if (!listEl) return;
    injectStyles();
    var t = T();
    var ctx = ctxOf();
    var opts = [{ scope: 'all', label: t.full }].concat(
      presentSections(ctx).map(function (s) { return { scope: s, label: t.sections[s] || s }; })
    );
    listEl.innerHTML = '';
    opts.forEach(function (o) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'pmx-opt'; btn.textContent = o.label;
      btn.addEventListener('click', function () {
        var d = listEl.closest && listEl.closest('details');
        if (d) d.removeAttribute('open');
        run(o.scope, btn, statusEl);
      });
      listEl.appendChild(btn);
    });
  }

  /* ── one-time shared styles for the export affordances ── */
  var _styled = false;
  function injectStyles() {
    if (_styled || typeof document === 'undefined' || !document.head) return;
    _styled = true;
    var css =
      '.pmx-menu{position:relative;display:inline-block}' +
      '.pmx-menu>summary{list-style:none;cursor:pointer}' +
      '.pmx-menu>summary::-webkit-details-marker{display:none}' +
      '.pmx-list{position:absolute;z-index:50;margin-top:6px;min-width:200px;display:flex;flex-direction:column;gap:2px;padding:6px;border-radius:12px;background:rgba(12,14,24,0.96);border:1px solid rgba(255,255,255,0.1);box-shadow:0 12px 40px rgba(0,0,0,0.5);backdrop-filter:blur(12px)}' +
      '.pmx-opt{text-align:left;padding:0.5rem 0.7rem;border-radius:8px;border:0;background:transparent;color:var(--text,#e2e8f0);font:inherit;font-size:0.85rem;cursor:pointer;transition:background .15s}' +
      '.pmx-opt:hover{background:rgba(96,165,250,0.14)}' +
      '.pmx-status{display:inline-flex;align-items:center;gap:0.4rem;margin-left:0.6rem;font-size:0.78rem;color:var(--dim,#94a3b8)}' +
      '.pmx-link{color:#60a5fa;text-decoration:underline;font-size:0.78rem}' +
      '[data-theme="light"] .pmx-list{background:rgba(255,255,255,0.98);border-color:rgba(15,23,42,0.12)}' +
      '[data-theme="light"] .pmx-opt{color:#0f172a}' +
      '[data-theme="light"] .pmx-opt:hover{background:rgba(59,130,246,0.12)}';
    var s = document.createElement('style');
    s.id = 'pm-export-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ── keep any [data-pmx-label] button text in sync with the active language ── */
  function syncLabels() {
    if (typeof document === 'undefined') return;
    var label = T().menu;
    var nodes = document.querySelectorAll('[data-pmx-label]');
    Array.prototype.forEach.call(nodes, function (el) { el.textContent = label; });
  }
  function initLabels() {
    syncLabels();
    try {
      new MutationObserver(syncLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'data-theme'] });
    } catch (e) {}
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLabels);
    else initLabels();
  }

  G.PMExport = {
    ENDPOINT: ENDPOINT,
    buildPayload: buildPayload,
    sectionBlocks: sectionBlocks,
    presentSections: presentSections,
    send: send,
    run: run,
    fillBriefMenu: fillBriefMenu,
    syncLabels: syncLabels,
    injectStyles: injectStyles,
    T: T,
    lang: lang
  };

})(window);
