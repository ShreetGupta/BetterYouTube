/*
 * PipeShift — Side Comments
 * - Comments panel in right sidebar
 * - Playlist auto-collapsed on load via native button (user can expand freely)
 */

const WATCH = 'youtube.com/watch';

let obs1 = null;
let interval = null;
let activated = false;
let nudgeTmr = null;
let playlistObs = null;

let lastVideoUrl = null;

const isWatch = () => location.href.includes(WATCH);

const currentVideoKey = () => {
  try { return new URL(location.href).searchParams.get('v') || ''; }
  catch { return ''; }
};

function commentsReady() {
  const c = document.getElementById('comments');
  return c && !c.hasAttribute('hidden') && c.innerHTML.length > 100;
}

function cleanup() {
  obs1?.disconnect(); obs1 = null;
  playlistObs?.disconnect(); playlistObs = null;
  if (interval) { clearInterval(interval); interval = null; }
  activated = false;
}

function forceCommentsLoad() {
  const savedY = window.scrollY;
  window.scrollTo({ top: 800, behavior: 'instant' });
  requestAnimationFrame(() => {
    window.scrollTo({ top: savedY, behavior: 'instant' });
  });
}

// Click YouTube's own collapse button — produces the native "Next:" mini bar
function collapsePlaylist(pl) {
  if (pl.hasAttribute('collapsed')) return;
  const btn = pl.querySelector('paper-icon-button#expand-button, yt-icon-button#expand-button, [aria-label*="collapse" i], [aria-label*="Collapse" i]');
  if (btn) {
    btn.click();
  } else {
    pl.setAttribute('collapsed', '');
    try { pl.collapsed = true; } catch (e) { }
  }
}

function watchAndCollapsePlaylist() {
  const existing = document.querySelector('ytd-playlist-panel-renderer');
  if (existing) { collapsePlaylist(existing); return; }

  playlistObs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const pl = node.tagName === 'YTD-PLAYLIST-PANEL-RENDERER'
          ? node
          : node.querySelector?.('ytd-playlist-panel-renderer');
        if (pl) {
          collapsePlaylist(pl);
          playlistObs.disconnect();
          playlistObs = null;
          return;
        }
      }
    }
  });
  playlistObs.observe(document.body, { childList: true, subtree: true });
}

function detect() {
  if (!isWatch()) return;
  watchAndCollapsePlaylist();

  const c = document.getElementById('comments');
  const secInner = document.querySelector('#secondary-inner');
  if (c && secInner) {
    document.documentElement.classList.add('sc-active');
    c.classList.add('sc-comments');
    if (c.parentElement !== secInner) secInner.prepend(c);
  }

  if (tryActivate()) return;

  if (c?.hasAttribute('hidden')) {
    obs1 = new MutationObserver(() => {
      if (!c.hasAttribute('hidden')) {
        obs1?.disconnect(); obs1 = null;
        if (!tryActivate()) startInterval();
      }
    });
    obs1.observe(c, { attributes: true, attributeFilter: ['hidden'] });
  }

  forceCommentsLoad();
  startInterval();
}

function startInterval() {
  if (interval) return;
  let n = 0;
  interval = setInterval(() => {
    n++;
    if (tryActivate() || n >= 60) { clearInterval(interval); interval = null; }
  }, 500);
}

function tryActivate() {
  if (activated) return true;
  if (!commentsReady()) return false;
  activated = true;
  obs1?.disconnect(); obs1 = null;
  if (interval) { clearInterval(interval); interval = null; }
  activate();
  return true;
}

function activate() {
  const comments = document.getElementById('comments');
  const secInner = document.querySelector('#secondary-inner');
  const columns = document.querySelector('#columns');
  if (!comments || !secInner || !columns) return;

  document.documentElement.classList.add('sc-active');
  secInner.prepend(comments);
  comments.classList.add('sc-comments');
  nudge();
}

function handleSameVideoLayout() {
  // Same video — layout change (miniplayer/expanded/theater toggle)
  // Re-ensure comments are in the sidebar without resetting state
  const comments = document.getElementById('comments');
  const secInner = document.querySelector('#secondary-inner');
  if (!comments || !secInner) return;

  document.documentElement.classList.add('sc-active');
  if (comments.parentElement !== secInner) {
    secInner.prepend(comments);
  }
  comments.classList.add('sc-comments');


  if (!activated) {
    // Was deactivated (e.g. returning from miniplayer) — re-detect
    detect();
  } else {
    nudge();
  }
}

document.addEventListener('yt-navigate-finish', () => {
  if (!isWatch()) {
    document.documentElement.classList.remove('sc-active');
    document.getElementById('comments')?.classList.remove('sc-comments');
    cleanup();
    return;
  }
  const key = currentVideoKey();
  if (key && key === lastVideoUrl) {
    handleSameVideoLayout();
    return;
  }
  lastVideoUrl = key;
  cleanup();
  detect();
});

// YouTube also fires this on player mode changes (miniplayer, theater, etc.)
document.addEventListener('yt-page-data-updated', () => {
  if (!isWatch()) return;
  const key = currentVideoKey();
  if (key && key === lastVideoUrl) {
    handleSameVideoLayout();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (isWatch()) { lastVideoUrl = currentVideoKey(); detect(); }
  });
} else if (isWatch()) {
  lastVideoUrl = currentVideoKey();
  detect();
}

function nudge() {
  clearInterval(nudgeTmr);
  const sec = document.querySelector('#secondary');

  // One-time scrollTop jiggle to force layout recalculation
  if (sec) { sec.scrollTop = 1; requestAnimationFrame(() => { sec.scrollTop = 0; }); }
  window.dispatchEvent(new Event('resize'));

  // Subsequent nudges only fire resize events (no scrollTop reset)
  let t = 0;
  nudgeTmr = setInterval(() => {
    window.dispatchEvent(new Event('resize'));
    if (++t >= 4) clearInterval(nudgeTmr);
  }, 500);

  // Cancel nudge immediately if user scrolls the sidebar
  if (sec) {
    const cancel = () => {
      clearInterval(nudgeTmr);
      sec.removeEventListener('scroll', cancel);
    };
    sec.addEventListener('scroll', cancel, { passive: true });
  }
}
