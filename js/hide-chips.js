(() => {
  const TARGETS = [
    '#frosted-glass',
    'ytd-feed-filter-chip-bar-renderer',
    '#chips-wrapper',
  ];

  function nuke() {
    TARGETS.forEach(sel =>
      document.querySelectorAll(sel).forEach(el => el.remove())
    );
  }

  nuke();

  // Debounced observer — one pass per frame, not on every mutation
  let timer = null;
  new MutationObserver(() => {
    if (timer) return;
    timer = requestAnimationFrame(() => { timer = null; nuke(); });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
