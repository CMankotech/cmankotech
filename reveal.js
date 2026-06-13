/* Révélation au scroll (cf. reveal.css). Révèle en cascade les enfants directs des
   conteneurs [data-reveal] quand ils entrent dans le viewport, une seule fois.
   - data-reveal-stagger="0.07" : pas de cascade en secondes (défaut 0.07).
   - data-reveal=".selecteur" : cibler d'autres items que les enfants directs.
   - window.revealNow(el) : déclencher manuellement (contenu injecté dynamiquement).
   - window.revealScan() : ré-observer les nouveaux [data-reveal] après injection. */
(function () {
  var root = document.documentElement;
  // reveal.js tourne : on annule le fallback anti-flash posé dans le <head>
  if (window.__revealFallback) { clearTimeout(window.__revealFallback); window.__revealFallback = null; }

  // Pas d'IntersectionObserver -> on n'anime pas, tout reste visible
  if (!('IntersectionObserver' in window)) { root.classList.remove('reveal-on'); return; }

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealEl(c) {
    if (!c || c.classList.contains('is-revealed')) return;
    var step = parseFloat(c.getAttribute('data-reveal-stagger'));
    if (isNaN(step)) step = 0.07;
    var sel = c.getAttribute('data-reveal');
    var list = sel ? c.querySelectorAll(sel) : c.children;
    for (var i = 0; i < list.length; i++) {
      list[i].style.transitionDelay = (reduce ? 0 : i * step) + 's';
    }
    c.classList.add('is-revealed');
  }
  window.revealNow = revealEl;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { revealEl(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

  function scan() {
    document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach(function (c) { io.observe(c); });
  }
  window.revealScan = scan;
  scan();
})();
