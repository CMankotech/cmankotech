/* PM Toolkit — Session Manager v1
   Persists insights across all 6 PM tools via localStorage.
   Each tool saves its output; the next tool shows an import banner. */
(function(G) {
  'use strict';

  var KEY = 'pmSession_v1';
  var FLOW = ['discovery', 'interview', 'okr', 'backlog', 'epic', 'roadmap'];

  var META = {
    discovery: { name: 'Discovery Assistant',     url: 'discovery-assistant.html',    color: '#60a5fa' },
    interview: { name: 'Interview Analyzer',       url: 'user-interview-analyzer.html', color: '#34d399' },
    okr:       { name: 'OKR Builder',              url: 'okr-builder.html',             color: '#a78bfa' },
    backlog:   { name: 'Backlog Prioritizer',       url: 'backlog-prioritizer.html',     color: '#fb923c' },
    epic:      { name: 'Epic → Stories',           url: 'epic-to-userstories.html',     color: '#f472b6' },
    roadmap:   { name: 'Roadmap Storyteller',       url: 'roadmap-storyteller.html',     color: '#fbbf24' }
  };

  /* ── storage ── */
  function load()        { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e) { return {}; } }
  function dump(d)       { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e) {} }
  function save(t, data) { var s = load(); s[t] = Object.assign({}, s[t] || {}, data, { _ts: Date.now() }); dump(s); }
  function get(t)        { return load()[t] || null; }
  function clearAll()    { try { localStorage.removeItem(KEY); } catch(e) {} }

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

  function buildPreview(fromTool, data) {
    if (fromTool === 'discovery') {
      return esc(truncate(data.problem || '', 110));
    }
    if (fromTool === 'interview') {
      var p = ((data.result || {}).persona || {});
      var opps = ((data.result || {}).opportunities || []).slice(0, 2).map(function(o) { return esc(o.title || ''); });
      var parts = [];
      if (p.name) parts.push('Persona : <strong>' + esc(p.name) + '</strong>');
      if (opps.length) parts.push(opps.join(', '));
      return parts.join(' · ');
    }
    if (fromTool === 'okr') {
      var objs = ((data.result || {}).okrs || []).slice(0, 2).map(function(o) { return esc(truncate(o.objective || '', 50)); });
      return objs.length ? 'Objectifs : ' + objs.join(' · ') : '';
    }
    if (fromTool === 'backlog') {
      var items = ((data.result || {}).items || []).slice(0, 3).map(function(it) { return esc(truncate(it.story || it.title || '', 45)); });
      return items.length ? 'Top backlog : ' + items.join(' / ') : '';
    }
    if (fromTool === 'epic') {
      var count = ((data.result || {}).stories || []).length;
      return count + ' user storie' + (count !== 1 ? 's' : '') + ' prête' + (count !== 1 ? 's' : '') + ' à intégrer dans la roadmap';
    }
    return '';
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
        : '<span style="color:#2d3748;font-size:0.58rem">Dernière étape</span>'
      );

    var container = document.querySelector('.container');
    if (container) container.insertBefore(bar, container.firstChild);
  }

  /* ── insight banner (shown when previous tool has data) ── */
  function showBanner() {
    var tool = currentTool();
    if (!tool || document.getElementById('pmInsightBanner')) return;

    var prev = prevTool(tool);
    if (!prev) return;

    var prevData = get(prev);
    if (!prevData) return;

    var m       = META[prev];
    var preview = buildPreview(prev, prevData);

    var banner = document.createElement('div');
    banner.id  = 'pmInsightBanner';
    banner.setAttribute('style',
      'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);' +
      'border-left:3px solid ' + m.color + ';border-radius:10px;' +
      'padding:0.85rem 1rem;margin-bottom:1.5rem;' +
      'display:flex;align-items:flex-start;justify-content:space-between;gap:1rem'
    );
    banner.innerHTML =
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:0.57rem;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;' +
          'color:' + m.color + ';margin-bottom:0.3rem">🔗 Insights · ' + esc(m.name) + '</div>' +
        (preview
          ? '<div style="font-size:0.77rem;color:#64748b;line-height:1.45;overflow:hidden;' +
              'white-space:nowrap;text-overflow:ellipsis">' + preview + '</div>'
          : '') +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;align-items:center;flex-shrink:0;margin-top:0.1rem">' +
        '<button id="pmImportBtn" onclick="if(window.pmImportInsights)window.pmImportInsights()" ' +
          'style="font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;' +
          'padding:0.28rem 0.75rem;border-radius:6px;border:1px solid ' + m.color + ';' +
          'background:transparent;color:' + m.color + ';cursor:pointer;font-family:\'DM Sans\',sans-serif;transition:opacity 0.2s" ' +
          'onmouseover="this.style.opacity=\'0.7\'" onmouseout="this.style.opacity=\'1\'">↓ Importer</button>' +
        '<button onclick="document.getElementById(\'pmInsightBanner\').remove()" ' +
          'style="background:none;border:none;color:#475569;cursor:pointer;font-size:0.95rem;' +
          'line-height:1;padding:0.1rem 0.3rem;border-radius:4px;transition:color 0.2s" ' +
          'onmouseover="this.style.color=\'#94a3b8\'" onmouseout="this.style.color=\'#475569\'">✕</button>' +
      '</div>';

    var container = document.querySelector('.container');
    if (!container) return;
    var langBar = container.querySelector('.lang-bar');
    if (langBar) langBar.insertAdjacentElement('afterend', banner);
    else container.insertBefore(banner, container.firstChild.nextSibling || container.firstChild);
  }

  /* ── init ── */
  function init() {
    document.addEventListener('DOMContentLoaded', function() {
      showNavBar();
      showBanner();
    });
  }

  /* ── public API ── */
  G.PMSession = {
    save: save, get: get, clear: clearAll,
    currentTool: currentTool, prevTool: prevTool, nextTool: nextTool,
    META: META, FLOW: FLOW, load: load,
    init: init, showBanner: showBanner, showNavBar: showNavBar
  };

})(window);
