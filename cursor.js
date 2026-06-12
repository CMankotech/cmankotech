/* Halo de curseur — un cercle dégradé qui trail le curseur et grossit + s'illumine
   au survol des éléments cliquables. La flèche native (cursor.css) reste visible.
   Léger : une seule boucle rAF, uniquement transform/opacity, aucun blur.
   Désactivé sur écran tactile / souris non fine. Respecte prefers-reduced-motion. */
(function () {
  if (window.__cmCursor) return;
  // Souris fine uniquement : pas de halo sur tactile (le pointeur n'existe pas)
  if (!window.matchMedia || !matchMedia('(pointer:fine)').matches) return;
  window.__cmCursor = true;

  var CLICKABLE =
    'a,button,summary,label[for],[role="button"],[onclick],.proj-card,' +
    '.nav-cta,.lang-btn,.tt,.qr-card,.footer-link,' +
    'input[type="submit"],input[type="button"]';

  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  var halo = document.createElement('div');
  halo.id = 'cm-cursor';
  var ring = document.createElement('div');
  ring.className = 'cm-cursor-ring';
  halo.appendChild(ring);

  function mount() {
    document.body.appendChild(halo);
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  var tx = 0, ty = 0;      // cible (position réelle de la souris)
  var x = 0, y = 0;        // position lissée du halo
  var shown = false;

  // Élément actuellement tagué .cm-pointer (main dégradée appliquée par JS).
  // On ne tague que les éléments custom dont le computed cursor vaut 'pointer'
  // et qui ne sont pas déjà couverts par la liste CSS : ça remplace la main
  // grise de l'OS partout, sans réenmnumérer toutes les classes du site.
  var tagged = null;
  function setTagged(el) {
    if (tagged === el) return;
    if (tagged) tagged.classList.remove('cm-pointer');
    tagged = el;
    if (el) el.classList.add('cm-pointer');
  }

  var lastEl = null;       // dernier élément survolé (cache du classement)
  var lastClickable = false;

  function classify(el) {
    if (!el || el.nodeType !== 1) { setTagged(null); return false; }
    // closest() couvre les éléments déjà transformés en main par le CSS
    // (leur computed n'est plus 'pointer' mais 'url(...)').
    if (el.closest && el.closest(CLICKABLE)) { setTagged(null); return true; }
    var cur = getComputedStyle(el).cursor;
    if (cur === 'pointer') { setTagged(el); return true; }
    setTagged(null);
    return false;
  }

  document.addEventListener('mousemove', function (e) {
    tx = e.clientX;
    ty = e.clientY;
    if (!shown) {
      // Pas de flash en 0,0 : on place le halo direct au 1er mouvement
      x = tx; y = ty;
      shown = true;
      halo.classList.add('cm-on');
    }
    // getComputedStyle seulement quand la cible change (léger sur PC modeste)
    if (e.target !== lastEl) {
      lastEl = e.target;
      lastClickable = classify(e.target);
    }
    halo.classList.toggle('cm-active', lastClickable);
  }, { passive: true });

  // Masquer quand la souris quitte la fenêtre, réafficher au retour
  document.addEventListener('mouseleave', function () { halo.classList.remove('cm-on'); });
  document.addEventListener('mouseenter', function () { if (shown) halo.classList.add('cm-on'); });

  var ease = reduce ? 1 : 0.2;
  function loop() {
    x += (tx - x) * ease;
    y += (ty - y) * ease;
    halo.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
