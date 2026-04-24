/* Glass DA primitives — glass + liquid utility classes
   Include with: <script src="glass.js"></script>
   Injects a <style> tag + delegates pointer tracking.

   Utility classes:
     .glass-edge    — rotating conic-gradient edge ring on hover/focus (Tier A)
     .glass-pointer — cursor-tracked radial specular on hover (Tier A)
     .glass-shimmer — gradient sweep on hover (Tier C)
     .glass-focus   — pulsing halo on :focus-visible (Tier C)

   Respects prefers-reduced-motion. */
(function () {
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    /* Animatable angle custom property for the edge ring */
    '@property --glass-angle{syntax:"<angle>";initial-value:0deg;inherits:false}',

    /* ── EDGE RING (Tier A) ──────────────────────────────────────────────── */
    '.glass-edge{position:relative;isolation:isolate}',
    '.glass-edge::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;' +
      'background:conic-gradient(from var(--glass-angle,0deg),' +
        'rgba(96,165,250,0) 0deg,rgba(96,165,250,0.55) 80deg,' +
        'rgba(167,139,250,0) 160deg,rgba(34,211,238,0.5) 240deg,' +
        'rgba(96,165,250,0) 320deg);' +
      '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);' +
      '-webkit-mask-composite:xor;mask-composite:exclude;' +
      'pointer-events:none;opacity:0;transition:opacity 0.4s;z-index:0}',
    '.glass-edge:hover::before,.glass-edge:focus-visible::before{opacity:0.75;' +
      'animation:glass-edge-spin 9s linear infinite}',
    '@keyframes glass-edge-spin{to{--glass-angle:360deg}}',

    /* ── POINTER-TRACKED SPECULAR (Tier A) ───────────────────────────────── */
    '.glass-pointer{--gmx:50%;--gmy:50%}',
    '.glass-pointer::after{content:"";position:absolute;inset:0;border-radius:inherit;' +
      'background:radial-gradient(circle at var(--gmx) var(--gmy),' +
        'rgba(255,255,255,0.18) 0%,rgba(255,255,255,0) 50%);' +
      'opacity:0;transition:opacity 0.3s;pointer-events:none;' +
      'mix-blend-mode:overlay;z-index:1}',
    '.glass-pointer:hover::after{opacity:1}',

    /* ── SHIMMER SWEEP (Tier C) ──────────────────────────────────────────── */
    '.glass-shimmer{position:relative;overflow:hidden;isolation:isolate}',
    '.glass-shimmer::before{content:"";position:absolute;inset:0;border-radius:inherit;' +
      'background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,0.22) 50%,transparent 75%);' +
      'transform:translateX(-120%);transition:transform 0.55s ease;pointer-events:none;z-index:0}',
    '.glass-shimmer:hover::before{transform:translateX(120%)}',
    '.glass-shimmer>*{position:relative;z-index:1}',

    /* ── PULSING FOCUS HALO (Tier C) ─────────────────────────────────────── */
    '.glass-focus:focus-visible{outline:none;' +
      'box-shadow:0 0 0 3px rgba(96,165,250,0.2),0 0 24px -4px rgba(96,165,250,0.4);' +
      'animation:glass-focus-pulse 2.4s ease-in-out infinite}',
    '@keyframes glass-focus-pulse{' +
      '0%,100%{box-shadow:0 0 0 3px rgba(96,165,250,0.2),0 0 24px -4px rgba(96,165,250,0.4)}' +
      '50%{box-shadow:0 0 0 4px rgba(96,165,250,0.28),0 0 32px -4px rgba(167,139,250,0.5)}}',

    /* ── REDUCED MOTION RESPECT ──────────────────────────────────────────── */
    '@media(prefers-reduced-motion:reduce){' +
      '.glass-edge:hover::before,.glass-edge:focus-visible::before{animation:none;opacity:0.4}' +
      '.glass-focus:focus-visible{animation:none}' +
      '.glass-shimmer::before{transition:none}}'
  ].join('');
  document.head.appendChild(styleEl);

  /* Delegate pointer tracking — one listener, scales to N .glass-pointer elements */
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.glass-pointer');
    if (!el) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty('--gmx', ((e.clientX - r.left) / r.width * 100) + '%');
    el.style.setProperty('--gmy', ((e.clientY - r.top) / r.height * 100) + '%');
  }, { passive: true });
})();
