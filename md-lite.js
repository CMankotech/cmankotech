/* md-lite.js — tiny, safe Markdown → HTML for AI-generated tool results.
   Escapes HTML first, then converts a limited, well-known subset.
   Exposes window.mdLite(text) -> HTML string. */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function inline(s) {
    // links [text](url)
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // inline code `code`
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // bold **text** or __text__
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // italic *text* or _text_  (avoid touching bold leftovers)
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');
    return s;
  }
  function mdLite(text) {
    if (text == null) return '';
    // If it already looks like rich HTML, leave it (still scoped by .prose CSS).
    if (/<(p|h[1-6]|ul|ol|li|strong|em|table|div|br|a)\b/i.test(text)) return text;

    var lines = esc(text).replace(/\r\n?/g, '\n').split('\n');
    var html = '', listType = null;
    function closeList() { if (listType) { html += '</' + listType + '>'; listType = null; } }

    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      var raw = ln.trim();
      if (!raw) { closeList(); continue; }

      var h = raw.match(/^(#{1,6})\s+(.*)$/);
      if (h) { closeList(); var lvl = Math.min(h[1].length, 4); html += '<h' + lvl + '>' + inline(h[2]) + '</h' + lvl + '>'; continue; }

      var ol = raw.match(/^\d+[.)]\s+(.*)$/);
      if (ol) { if (listType !== 'ol') { closeList(); listType = 'ol'; html += '<ol>'; } html += '<li>' + inline(ol[1]) + '</li>'; continue; }

      var ul = raw.match(/^[-*•]\s+(.*)$/);
      if (ul) { if (listType !== 'ul') { closeList(); listType = 'ul'; html += '<ul>'; } html += '<li>' + inline(ul[1]) + '</li>'; continue; }

      closeList();
      // group consecutive plain lines into one paragraph with <br>
      var para = [inline(raw)];
      while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#{1,6}\s|\d+[.)]\s|[-*•]\s)/.test(lines[i + 1].trim())) {
        i++; para.push(inline(lines[i].trim()));
      }
      html += '<p>' + para.join('<br>') + '</p>';
    }
    closeList();
    return html;
  }
  // Inline-only: escape + bold/italic/code/links, no block wrapping.
  // Use for short AI text rendered inside already-styled inline elements.
  function mdInline(text) {
    if (text == null) return '';
    return inline(esc(text)).replace(/\n/g, '<br>');
  }
  window.mdLite = mdLite;
  window.mdInline = mdInline;
})();
