/* Curseur custom — pas d'aura. Ce script ne fait qu'une chose : taguer .cm-pointer
   les éléments cliquables custom (computed cursor 'pointer') pour qu'ils héritent
   de la main dégradée (cf. cursor.css), là où la liste CSS ne les couvre pas.
   Aucune boucle rAF, aucun rendu par frame. Désactivé sur tactile / souris non fine. */
(function () {
  if (window.__cmCursor) return;
  // Souris fine uniquement : pas de main custom sur tactile (le pointeur n'existe pas)
  if (!window.matchMedia || !matchMedia('(pointer:fine)').matches) return;
  window.__cmCursor = true;

  var CLICKABLE =
    'a,button,summary,label[for],[role="button"],[onclick],.proj-card,' +
    '.nav-cta,.lang-btn,.tt,.qr-card,.footer-link,' +
    'input[type="submit"],input[type="button"]';

  // Élément actuellement tagué .cm-pointer (main dégradée appliquée par JS).
  // On ne tague que les éléments custom dont le computed cursor vaut 'pointer'
  // et qui ne sont pas déjà couverts par la liste CSS : ça remplace la main
  // grise de l'OS partout, sans réénumérer toutes les classes du site.
  var tagged = null;
  function setTagged(el) {
    if (tagged === el) return;
    if (tagged) tagged.classList.remove('cm-pointer');
    tagged = el;
    if (el) el.classList.add('cm-pointer');
  }

  var lastEl = null;       // dernier élément survolé (cache du classement)

  function classify(el) {
    if (!el || el.nodeType !== 1) { setTagged(null); return; }
    // closest() couvre les éléments déjà transformés en main par le CSS
    // (leur computed n'est plus 'pointer' mais 'url(...)').
    if (el.closest && el.closest(CLICKABLE)) { setTagged(null); return; }
    if (getComputedStyle(el).cursor === 'pointer') { setTagged(el); return; }
    setTagged(null);
  }

  document.addEventListener('mousemove', function (e) {
    // getComputedStyle seulement quand la cible change (léger sur PC modeste)
    if (e.target !== lastEl) {
      lastEl = e.target;
      classify(e.target);
    }
  }, { passive: true });

  // Reset du classement quand la souris quitte la fenêtre
  document.addEventListener('mouseleave', function () {
    lastEl = null;
    setTagged(null);
  });
})();
