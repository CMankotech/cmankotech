/* PM Toolkit — Session Manager v1
   Persists insights across all 6 PM tools via localStorage.
   Each tool saves its raw output; a shared canonical context is DERIVED on read
   (no migration, no double-write) so any insight can feed any downstream tool. */
(function(G) {
  'use strict';

  var KEY = 'pmSession_v1';          // base key ; per-project store is KEY + '::' + id
  var PROJ_KEY = 'pmProjects_v1';     // registry { current, list:[{id,name,createdAt,lastTs}] }
  var FLOW = ['discovery', 'interview', 'okr', 'backlog', 'epic', 'roadmap'];

  var META = {
    discovery: { name: 'Discovery Assistant',     url: 'discovery-assistant.html',    color: '#60a5fa' },
    interview: { name: 'Interview Analyzer',       url: 'user-interview-analyzer.html', color: '#34d399' },
    okr:       { name: 'OKR Builder',              url: 'okr-builder.html',             color: '#a78bfa' },
    backlog:   { name: 'Backlog Prioritizer',       url: 'backlog-prioritizer.html',     color: '#fb923c' },
    epic:      { name: 'Epic → Stories',           url: 'epic-to-userstories.html',     color: '#f472b6' },
    roadmap:   { name: 'Roadmap Storyteller',       url: 'roadmap-storyteller.html',     color: '#fbbf24' }
  };

  /* ── projects registry ──
     A session belongs to a project so a PM can juggle several products. Legacy
     single-session data (the old pmSession_v1 blob) is migrated into "Projet 1"
     on first access, so nothing is lost and old links keep working. */
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function loadProjects() { try { return JSON.parse(localStorage.getItem(PROJ_KEY) || 'null'); } catch(e) { return null; } }
  function dumpProjects(p) { try { localStorage.setItem(PROJ_KEY, JSON.stringify(p)); } catch(e) {} }

  function ensureProjects() {
    var p = loadProjects();
    if (p && p.current && Array.isArray(p.list) && p.list.length) return p;
    var id = uid();
    p = { current: id, list: [{ id: id, name: (lang() === 'en' ? 'Project 1' : 'Projet 1'), createdAt: Date.now(), lastTs: Date.now() }] };
    try { var legacy = localStorage.getItem(KEY); if (legacy && legacy !== '{}') localStorage.setItem(KEY + '::' + id, legacy); } catch(e) {}
    dumpProjects(p);
    return p;
  }
  function currentProjectId() { return ensureProjects().current; }
  function storeKey() { return KEY + '::' + currentProjectId(); }
  function touchProject() {
    var p = loadProjects(); if (!p) return;
    p.list.forEach(function(x) { if (x.id === p.current) x.lastTs = Date.now(); });
    dumpProjects(p);
  }

  function listProjects()        { return ensureProjects().list.slice(); }
  function createProject(name) {
    var p = ensureProjects();
    var id = uid();
    p.list.push({ id: id, name: name || ((lang() === 'en' ? 'Project ' : 'Projet ') + (p.list.length + 1)), createdAt: Date.now(), lastTs: Date.now() });
    p.current = id; dumpProjects(p);
    return id;
  }
  function switchProject(id) {
    var p = ensureProjects();
    if (p.list.some(function(x) { return x.id === id; })) { p.current = id; dumpProjects(p); }
  }
  function renameProject(id, name) {
    var p = ensureProjects();
    p.list.forEach(function(x) { if (x.id === id && name) x.name = name; });
    dumpProjects(p);
  }
  function deleteProject(id) {
    var p = ensureProjects();
    try { localStorage.removeItem(KEY + '::' + id); } catch(e) {}
    p.list = p.list.filter(function(x) { return x.id !== id; });
    if (!p.list.length) { var nid = uid(); p.list.push({ id: nid, name: (lang() === 'en' ? 'Project 1' : 'Projet 1'), createdAt: Date.now(), lastTs: Date.now() }); p.current = nid; }
    else if (p.current === id) p.current = p.list[0].id;
    dumpProjects(p);
  }

  /* ── storage (scoped to the current project) ── */
  function load()        { try { return JSON.parse(localStorage.getItem(storeKey()) || '{}'); } catch(e) { return {}; } }
  function dump(d)       { try { localStorage.setItem(storeKey(), JSON.stringify(d)); touchProject(); } catch(e) {} }
  function save(t, data) { var s = load(); s[t] = Object.assign({}, s[t] || {}, data, { _ts: Date.now() }); dump(s); }
  function get(t)        { return load()[t] || null; }
  function clearAll()    { try { localStorage.removeItem(storeKey()); } catch(e) {} }

  /* ── routing ── */
  function currentTool() {
    var p = (window.location.pathname + window.location.href).toLowerCase();
    if (p.includes('discovery-assistant'))     return 'discovery';
    if (p.includes('user-interview-analyzer')) return 'interview';
    if (p.includes('okr-builder'))             return 'okr';
    if (p.includes('backlog-prioritizer'))     return 'backlog';
    if (p.includes('epic-to-userstories'))     return 'epic';
    if (p.includes('roadmap-storyteller'))     return 'roadmap';
    return null;
  }
  function prevTool(t) { var i = FLOW.indexOf(t); return i > 0 ? FLOW[i-1] : null; }
  function nextTool(t) { var i = FLOW.indexOf(t); return i >= 0 && i < FLOW.length-1 ? FLOW[i+1] : null; }

  /* ── helpers ── */
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function truncate(s, n) { s = String(s||''); return s.length > n ? s.slice(0, n) + '…' : s; }
  function slug(s) { return String(s||'').toLowerCase().replace(/[^a-z0-9àâäéèêëïîôöùûüç ]/gi,'').replace(/\s+/g,' ').trim().slice(0,40); }
  function prune(o) { var out = {}; for (var k in o) { if (o[k] !== '' && o[k] != null) out[k] = o[k]; } return out; }
  function dedup(list, keyFn) {
    var seen = {}, out = [];
    (list || []).forEach(function(it) {
      if (!it) return;
      var k = keyFn ? keyFn(it) : slug(JSON.stringify(it));
      if (k && seen[k]) return;
      if (k) seen[k] = 1;
      out.push(it);
    });
    return out;
  }

  /* ── language (centralises the FR/EN detection duplicated across tools) ── */
  function lang() {
    try {
      var a = document.querySelector('.lang-btn.active');
      if (a && /(^|\s)en(\s|$)/i.test(a.textContent)) return 'en';
      if (new URLSearchParams(window.location.search).get('lang') === 'en') return 'en';
      if (window.currentLang === 'en' || window._lang === 'en') return 'en';
    } catch(e) {}
    return 'fr';
  }

  var LABELS = {
    fr: {
      persona:'Persona cible', hypothesis:'Hypothèses', painPoint:'Pain points identifiés',
      opportunity:'Opportunités', objective:'Objectifs stratégiques', priority:'Priorités du backlog',
      story:'User stories', quote:'Verbatims',
      persona_s:'persona', persona_p:'personas', hypothesis_s:'hypothèse', hypothesis_p:'hypothèses',
      pain_s:'pain point', pain_p:'pain points', opp_s:'opportunité', opp_p:'opportunités',
      obj_s:'objectif', obj_p:'objectifs', prio_s:'priorité', prio_p:'priorités',
      story_s:'user story', story_p:'user stories', quote_s:'verbatim', quote_p:'verbatims',
      panel:'Contexte PM', empty:'Aucun insight accumulé pour le moment.',
      notice:'Champs pré-remplis depuis ton contexte', undo:'Annuler', reapply:'Réappliquer au formulaire',
      lastStep:'Dernière étape'
    },
    en: {
      persona:'Target persona', hypothesis:'Hypotheses', painPoint:'Identified pain points',
      opportunity:'Opportunities', objective:'Strategic objectives', priority:'Backlog priorities',
      story:'User stories', quote:'Quotes',
      persona_s:'persona', persona_p:'personas', hypothesis_s:'hypothesis', hypothesis_p:'hypotheses',
      pain_s:'pain point', pain_p:'pain points', opp_s:'opportunity', opp_p:'opportunities',
      obj_s:'objective', obj_p:'objectives', prio_s:'priority', prio_p:'priorities',
      story_s:'user story', story_p:'user stories', quote_s:'quote', quote_p:'quotes',
      panel:'PM Context', empty:'No insights gathered yet.',
      notice:'Fields pre-filled from your context', undo:'Undo', reapply:'Re-apply to form',
      lastStep:'Last step'
    }
  };

  /* ── canonical context: derive normalised entities from the raw per-tool slots ── */
  var EXTRACTORS = {
    discovery: function(s) {
      var r = s.result || {};
      return {
        hypotheses: (r.hypotheses || []).map(function(h) {
          return { belief: h.belief || h.statement || (typeof h === 'string' ? h : ''), signal: h.signal || h.observable || '', source: 'discovery' };
        }),
        product: s.context ? { description: s.context, source: 'discovery' } : null,
        _problem: s.problem || '', _target: s.target || ''
      };
    },
    interview: function(s) {
      var r = s.result || {}, p = r.persona || {};
      return {
        personas: p.name ? [{ name: p.name, emoji: p.emoji || '', description: p.description || '', tags: p.tags || [], source: 'interview' }] : [],
        painPoints: (r.pain_groups || []).map(function(g) {
          return { label: g.group || '', count: g.count || (g.items || []).length, items: g.items || [], source: 'interview' };
        }),
        opportunities: (r.opportunities || []).map(function(o) {
          return { title: o.title || '', description: o.description || '', impact: o.impact || '', source: 'interview' };
        }),
        quotes: (r.quotes || []).map(function(q) { return { text: q.text || '', profile: q.profile || '', source: 'interview' }; }),
        product: s.context ? { description: s.context, source: 'interview' } : null
      };
    },
    okr: function(s) {
      var r = s.result || {};
      return {
        objectives: (r.okrs || []).map(function(o) {
          return { objective: o.objective || '', keyResults: (o.key_results || []).map(function(kr) {
            return { text: kr.text || '', baseline: kr.baseline || '', type: kr.type || '' };
          }), source: 'okr' };
        }),
        product: (s.productName || s.productType || s.ambitions) ? { name: s.productName || '', type: s.productType || '', description: s.ambitions || '', source: 'okr' } : null,
        _metrics: s.metrics || ''
      };
    },
    backlog: function(s) {
      var r = s.result || {};
      return {
        priorities: (r.items || []).map(function(it) {
          return { label: it.story || it.title || '', justification: it.justification || '', score: it.score, rank: it.rank, source: 'backlog' };
        }),
        product: s.context ? { description: s.context, source: 'backlog' } : null
      };
    },
    epic: function(s) {
      var r = s.result || {};
      return {
        stories: (r.stories || []).map(function(st) {
          return { id: st.id || '', title: st.title || '', story: st.story || '', priority: st.priority || '', effort: st.effort || '', type: st.type || '', acceptanceCriteria: st.acceptance_criteria || [], source: 'epic' };
        }),
        product: (s.epicTitle || s.epicDesc) ? { name: (s.epicTitle || '').split(/[—:·]/)[0].trim(), description: s.epicDesc || s.epicTitle || '', source: 'epic' } : null,
        personas: s.persona ? [{ name: s.persona, description: '', tags: [], source: 'epic' }] : [],
        _epicSummary: r.epic_summary || ''
      };
    },
    roadmap: function(s) {
      var r = s.result || {};
      return {
        roadmap: { narrative: r.narrative || '', periods: r.periods || [], talkingPoints: r.talking_points || [], source: 'roadmap' },
        product: (s.productName || s.vision) ? { name: s.productName || '', description: s.vision || '', source: 'roadmap' } : null
      };
    }
  };

  var ARRAY_KEYS = ['personas', 'hypotheses', 'painPoints', 'opportunities', 'quotes', 'objectives', 'priorities', 'stories'];
  var DEDUP_KEY = {
    personas: function(p) { return slug(p.name); },
    hypotheses: function(h) { return slug(h.belief); },
    painPoints: function(p) { return slug(p.label); },
    opportunities: function(o) { return slug(o.title); },
    quotes: function(q) { return slug(q.text); },
    objectives: function(o) { return slug(o.objective); },
    priorities: function(p) { return slug(p.label); },
    stories: function(st) { return slug(st.title || st.story); }
  };

  function context() {
    var s = load();
    var ctx = { product: null, roadmap: null, _problem: '', _target: '', _metrics: '', _epicSummary: '', _sources: [] };
    ARRAY_KEYS.forEach(function(k) { ctx[k] = []; });
    FLOW.forEach(function(t) {
      if (!s[t] || !EXTRACTORS[t]) return;
      ctx._sources.push(t);
      var f = EXTRACTORS[t](s[t]) || {};
      ARRAY_KEYS.forEach(function(k) { if (f[k] && f[k].length) ctx[k] = ctx[k].concat(f[k]); });
      if (f.product && (f.product.name || f.product.description || f.product.type)) ctx.product = Object.assign({}, ctx.product || {}, prune(f.product));
      if (f.roadmap && (f.roadmap.narrative || (f.roadmap.periods || []).length)) ctx.roadmap = f.roadmap;
      ['_problem', '_target', '_metrics', '_epicSummary'].forEach(function(k) { if (f[k]) ctx[k] = f[k]; });
    });
    ARRAY_KEYS.forEach(function(k) { ctx[k] = dedup(ctx[k], DEDUP_KEY[k]); });
    return ctx;
  }

  /* ── text formatting (i18n) — turns canonical entities into paste-ready blocks ── */
  function renderItem(kind, it) {
    if (kind === 'persona')      return (it.name || '') + (it.description ? ' : ' + it.description : '') + (it.tags && it.tags.length ? ' (' + it.tags.slice(0,3).join(', ') + ')' : '');
    if (kind === 'hypothesis')   return (it.belief || '') + (it.signal ? ' — signal : ' + it.signal : '');
    if (kind === 'painPoint')    return (it.label || '') + (it.count ? ' (' + it.count + ')' : '');
    if (kind === 'opportunity')  return (it.title || '') + (it.description ? ' : ' + it.description : '') + (it.impact ? ' [' + it.impact + ']' : '');
    if (kind === 'objective')    return (it.objective || '') + ((it.keyResults || []).length ? '\n' + it.keyResults.map(function(kr) { return '   → ' + (kr.text || ''); }).join('\n') : '');
    if (kind === 'priority')     return (it.label || '') + (it.justification ? ' : ' + it.justification : '');
    if (kind === 'story')        return it.title || it.story || '';
    if (kind === 'quote')        return '« ' + (it.text || '') + ' »' + (it.profile ? ' — ' + it.profile : '');
    return '';
  }
  function fmtBlock(kind, items) {
    if (!items || !items.length) return '';
    var L = LABELS[lang()];
    var head = L[kind] || '';
    var rows = items.map(function(it) { return '- ' + renderItem(kind, it); });
    return (head ? head + ' :\n' : '') + rows.join('\n');
  }
  // specs: [{ kind, items }] — assembles several blocks, skipping the empty ones.
  function lines(specs) {
    return (specs || []).map(function(sp) { return fmtBlock(sp.kind, sp.items); }).filter(Boolean).join('\n\n');
  }

  /* ── auto pre-fill (only fills empty fields unless force) + undo ── */
  var _undo = [];
  function registerUndo(fn) { _undo.push(fn); }
  function undoAutofill() { _undo.forEach(function(f) { try { f(); } catch(e) {} }); _undo = []; }
  function flashEl(el) {
    var o = el.style.borderColor;
    el.style.borderColor = 'rgba(255,255,255,0.28)';
    setTimeout(function() { el.style.borderColor = o; }, 900);
  }
  // specs: [{ sel, value }] where value is a string or a () => string. Returns filled elements.
  function autofill(specs, opts) {
    opts = opts || {};
    _undo = [];
    var filled = [];
    (specs || []).forEach(function(sp) {
      var el = typeof sp.sel === 'string' ? document.querySelector(sp.sel) : sp.sel;
      if (!el) return;
      var val = typeof sp.value === 'function' ? sp.value() : sp.value;
      if (val == null || val === '') return;
      if (el.value && !opts.force) return;
      el.value = val;
      filled.push(el);
      flashEl(el);
      (function(e) { registerUndo(function() { e.value = ''; }); })(el);
    });
    return filled;
  }
  function reapply() {
    try {
      if (window.pmImportInsights) {
        var filled = window.pmImportInsights({ force: true, scroll: true }) || [];
        var b = document.getElementById('pmInsightBanner');
        if (b) b.remove();
        showNotice(filled);
      }
    } catch(e) {}
  }

  /* ── insertion helpers ── */
  function anchorAfter() {
    return document.getElementById('pmContextPanel') || document.getElementById('pmNavBar');
  }

  /* ── nav bar (shown on every tool page) ── */
  function showNavBar() {
    var tool = currentTool();
    if (!tool || document.getElementById('pmNavBar')) return;

    var session = load();
    var next = nextTool(tool);

    var stepsHtml = FLOW.map(function(t, i) {
      var done    = !!session[t];
      var current = t === tool;
      var c       = META[t].color;
      var sep     = i < FLOW.length - 1
        ? '<span style="display:inline-block;width:12px;height:1px;background:rgba(255,255,255,0.08);vertical-align:middle;margin:0 2px"></span>'
        : '';
      return '<span title="' + META[t].name + '" style="display:inline-flex;align-items:center;justify-content:center;' +
        'width:20px;height:20px;border-radius:50%;font-size:0.52rem;font-weight:800;' +
        'border:1.5px solid ' + (current ? c : done ? c : 'rgba(255,255,255,0.1)') + ';' +
        'color:' + ((current || done) ? c : 'rgba(255,255,255,0.2)') + ';' +
        'background:' + (current ? 'rgba(255,255,255,0.05)' : 'transparent') + '">' + (i + 1) + '</span>' + sep;
    }).join('');

    var bar = document.createElement('div');
    bar.id = 'pmNavBar';
    bar.setAttribute('style',
      'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;' +
      'padding:0.45rem 0.85rem;background:rgba(255,255,255,0.02);' +
      'border:1px solid rgba(255,255,255,0.05);border-radius:8px'
    );
    bar.innerHTML =
      '<a href="pm-toolkit.html" style="color:#60a5fa;text-decoration:none;font-weight:700;' +
        'font-size:0.58rem;text-transform:uppercase;letter-spacing:0.1em;font-family:\'DM Sans\',sans-serif">◀ PM Toolkit</a>' +
      '<div style="display:flex;align-items:center;gap:2px">' + stepsHtml + '</div>' +
      (next
        ? '<a href="' + META[next].url + '" style="color:#475569;text-decoration:none;font-size:0.58rem;' +
            'font-weight:700;text-transform:uppercase;letter-spacing:0.1em;font-family:\'DM Sans\',sans-serif;' +
            'transition:color 0.2s" onmouseover="this.style.color=\'#e2e8f0\'" onmouseout="this.style.color=\'#475569\'">' +
            esc(META[next].name) + ' ▶</a>'
        : '<span style="color:#2d3748;font-size:0.58rem">' + LABELS[lang()].lastStep + '</span>'
      );

    var container = document.querySelector('.container');
    if (container) container.insertBefore(bar, container.firstChild);
  }

  /* ── PM Context panel: the full accumulated knowledge, on every tool page ── */
  function summary(ctx) {
    var L = LABELS[lang()];
    var parts = [];
    function add(n, key) { if (n) parts.push(n + ' ' + (n > 1 ? L[key + '_p'] : L[key + '_s'])); }
    add(ctx.personas.length, 'persona');
    add(ctx.hypotheses.length, 'hypothesis');
    add(ctx.painPoints.length, 'pain');
    add(ctx.opportunities.length, 'opp');
    add(ctx.objectives.length, 'obj');
    add(ctx.priorities.length, 'prio');
    add(ctx.stories.length, 'story');
    add(ctx.quotes.length, 'quote');
    return parts.join(' · ');
  }

  function showContextPanel() {
    var tool = currentTool();
    if (!tool || document.getElementById('pmContextPanel')) return;
    var ctx = context();
    if (!ctx._sources.length) return;
    var L = LABELS[lang()];

    var cats = [
      { key:'personas',      kind:'persona',     render:function(p){ return (p.emoji ? p.emoji + ' ' : '') + esc(p.name) + (p.description ? ' — ' + esc(truncate(p.description,80)) : ''); } },
      { key:'hypotheses',    kind:'hypothesis',  render:function(h){ return esc(truncate(h.belief,90)); } },
      { key:'painPoints',    kind:'painPoint',   render:function(p){ return esc(p.label) + (p.count ? ' (' + p.count + ')' : ''); } },
      { key:'opportunities', kind:'opportunity', render:function(o){ return esc(truncate(o.title,80)) + (o.impact ? ' [' + esc(o.impact) + ']' : ''); } },
      { key:'objectives',    kind:'objective',   render:function(o){ return esc(truncate(o.objective,90)); } },
      { key:'priorities',    kind:'priority',    render:function(p){ return esc(truncate(p.label,90)); } },
      { key:'stories',       kind:'story',       render:function(s){ return esc(truncate(s.title || s.story,90)); } },
      { key:'quotes',        kind:'quote',       render:function(q){ return '« ' + esc(truncate(q.text,80)) + ' »'; } }
    ];

    var body = '';
    cats.forEach(function(c) {
      var arr = ctx[c.key];
      if (!arr || !arr.length) return;
      var items = arr.map(function(it) {
        var col = (META[it.source] || {}).color || '#94a3b8';
        return '<li style="display:flex;align-items:flex-start;gap:0.5rem;padding:0.18rem 0;font-size:0.74rem;color:#94a3b8;line-height:1.4">' +
          '<span style="flex-shrink:0;width:6px;height:6px;border-radius:50%;margin-top:0.42rem;background:' + col + '"></span>' +
          '<span style="min-width:0">' + c.render(it) + '</span></li>';
      }).join('');
      body += '<div style="margin-bottom:0.7rem">' +
        '<div style="font-size:0.56rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#64748b;margin-bottom:0.15rem">' + esc(L[c.kind]) + '</div>' +
        '<ul style="list-style:none;margin:0;padding:0">' + items + '</ul></div>';
    });

    var panel = document.createElement('details');
    panel.id = 'pmContextPanel';
    panel.setAttribute('style',
      'margin-bottom:1.25rem;background:rgba(255,255,255,0.02);' +
      'border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:0.2rem 0.95rem');
    panel.innerHTML =
      '<summary style="cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:0.6rem 0;user-select:none">' +
        '<span style="display:flex;align-items:center;gap:0.5rem;min-width:0">' +
          '<span style="font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#cbd5e1">🧠 ' + esc(L.panel) + '</span>' +
          '<span style="font-size:0.72rem;color:#64748b;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">' + esc(summary(ctx)) + '</span>' +
        '</span>' +
        '<span style="font-size:0.55rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;flex-shrink:0">▾</span>' +
      '</summary>' +
      '<div style="padding:0.4rem 0 0.85rem">' + (body || '<div style="font-size:0.74rem;color:#64748b">' + esc(L.empty) + '</div>') + '</div>' +
      '<div style="padding:0 0 0.7rem">' +
        '<button onclick="if(window.PMSession)PMSession.reapply()" ' +
          'style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;' +
          'padding:0.3rem 0.75rem;border-radius:6px;border:1px solid rgba(255,255,255,0.12);' +
          'background:transparent;color:#94a3b8;cursor:pointer;font-family:\'DM Sans\',sans-serif;transition:opacity 0.2s" ' +
          'onmouseover="this.style.opacity=\'0.7\'" onmouseout="this.style.opacity=\'1\'">↻ ' + esc(L.reapply) + '</button>' +
      '</div>';

    var nav = document.getElementById('pmNavBar');
    var container = document.querySelector('.container');
    if (nav) nav.insertAdjacentElement('afterend', panel);
    else if (container) container.insertBefore(panel, container.firstChild);
  }

  /* ── auto-fill notice (replaces the old previous-tool-only import banner) ── */
  function showNotice(filled) {
    if (!filled || !filled.length) return;
    var tool = currentTool();
    if (!tool || document.getElementById('pmInsightBanner')) return;
    var L = LABELS[lang()];

    var banner = document.createElement('div');
    banner.id = 'pmInsightBanner';
    banner.setAttribute('style',
      'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:10px;' +
      'padding:0.7rem 0.95rem;margin-bottom:1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem');
    banner.innerHTML =
      '<div style="font-size:0.78rem;color:#94a3b8;display:flex;align-items:center;gap:0.5rem;min-width:0">' +
        '<span style="font-size:0.95rem">✨</span><span style="overflow:hidden;text-overflow:ellipsis">' + esc(L.notice) + '</span>' +
      '</div>' +
      '<button onclick="if(window.PMSession)PMSession.undoAutofill();var b=document.getElementById(\'pmInsightBanner\');if(b)b.remove();" ' +
        'style="flex-shrink:0;font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;' +
        'padding:0.28rem 0.7rem;border-radius:6px;border:1px solid rgba(255,255,255,0.12);' +
        'background:transparent;color:#94a3b8;cursor:pointer;font-family:\'DM Sans\',sans-serif;transition:opacity 0.2s" ' +
        'onmouseover="this.style.opacity=\'0.7\'" onmouseout="this.style.opacity=\'1\'">' + esc(L.undo) + '</button>';

    var anchor = anchorAfter();
    var container = document.querySelector('.container');
    if (anchor) anchor.insertAdjacentElement('afterend', banner);
    else if (container) {
      var langBar = container.querySelector('.lang-bar');
      if (langBar) langBar.insertAdjacentElement('afterend', banner);
      else container.insertBefore(banner, container.firstChild);
    }
  }

  /* ── init ── */
  function init() {
    document.addEventListener('DOMContentLoaded', function() {
      try { showNavBar(); } catch(e) {}
      try { showContextPanel(); } catch(e) {}
      var filled = [];
      try { if (window.pmImportInsights) filled = window.pmImportInsights({ scroll: false, force: false }) || []; } catch(e) {}
      try { showNotice(filled); } catch(e) {}
    });
  }

  /* ── public API ── */
  G.PMSession = {
    save: save, get: get, clear: clearAll, load: load,
    currentTool: currentTool, prevTool: prevTool, nextTool: nextTool,
    listProjects: listProjects, currentProjectId: currentProjectId,
    createProject: createProject, switchProject: switchProject,
    renameProject: renameProject, deleteProject: deleteProject,
    META: META, FLOW: FLOW,
    context: context, dedup: dedup, lang: lang,
    lines: lines, fmtBlock: fmtBlock,
    autofill: autofill, registerUndo: registerUndo, undoAutofill: undoAutofill, reapply: reapply,
    init: init, showNotice: showNotice, showNavBar: showNavBar, showContextPanel: showContextPanel
  };

})(window);
