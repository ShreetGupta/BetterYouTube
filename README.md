# Better YouTube

<img src="icons/icon128.png" width="80" align="right" alt="BetterYouTube icon"/>

A lightweight Chrome extension that fixes three annoyances on YouTube — Dark grey theme, Side comments panel, Hides category chips.

---

## Features

### 1 — Soft Grey Dark Mode
YouTube's built-in dark mode uses near-black (`#0f0f0f`). Better YouTube replaces it with a softer grey (`#1c1c1c`) across every surface — nav bar, sidebar, watch page, menus, search results, scrollbars. Easier on the eyes for long sessions.

Only overrides background colours. Text, icons, and accent colours are left exactly as YouTube sets them.

Also suppresses the floating popup bar that appears in fullscreen mode.

### 2 — Side Comments Panel
On the watch page, the comments section is moved into the right sidebar so you can read comments without losing your place in the video.

- Comments sit above the related videos in a scrollable card
- The sidebar is sticky — it stays in view while the video plays
- Playlists are collapsed by default to give comments more room (you can still expand them)
- Comments are lazy-loaded by YouTube, so the extension triggers a quick invisible scroll on page load to kick that off
- Falls back gracefully on narrow viewports (below 1100px): layout reverts to YouTube's default single-column

### 3 — Hide Category Bar
The chips/category filter bar on the home feed (`All`, `Music`, `Gaming`, etc.) is removed. The bar adds no value if you rely on subscriptions or search, and its sticky positioning eats vertical space.

Removed via both CSS and a DOM observer so it stays gone even after YouTube's SPA re-renders it on navigation.

---

## Install
You can load it manually in any browser and It is also available in Firefox addon store.

**Manual loading Steps**:
1. Download this repo as zip and extract it.
2. Go to your browser's extensions page.
3. Enable **Developer mode** (toggle, top-right)
4. Click **Load unpacked**
5. Select the `Better YouTube` folder

That's it. The extension activates automatically on `youtube.com`.

Store link:

[![Firefox Add-ons](https://img.shields.io/amo/v/perfectyt)](https://addons.mozilla.org/en-US/firefox/addon/perfectyt/)

---

## File Structure

```
Better YouTube/
├── manifest.json
├── README.md
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── css/
│   ├── theme.css           # Grey dark mode overrides
│   ├── side-comments.css   # Watch page layout + comments card
│   └── hide-chips.css      # Category bar removal
└── js/
    ├── fullscreen.js       # Fullscreen popup suppression
    ├── side-comments.js    # Comments relocation logic
    └── hide-chips.js       # Category bar DOM observer
```

---

## Notes

- Requires YouTube's own dark mode to be enabled (the grey overrides only apply to `html[dark]`)
- No permissions beyond `*://www.youtube.com/*` — the extension cannot read data from any other site
- No background service worker, no storage, no network requests

---

## Huge Credits — Sidesy by abinjohn123

**This extension would not exist without [Sidesy](https://github.com/abinjohn123/sidesy) by [@abinjohn123](https://github.com/abinjohn123).**

Sidesy is the original extension that pioneered moving YouTube comments to a sidebar. After many failed attempts at reliable SPA navigation detection, studying Sidesy's source code was the breakthrough.

### Key insights from Sidesy's code

```js
// The check that actually works — credit: Sidesy by abinjohn123
function areCommentsReady() {
  const comments = document.getElementById('comments');
  return comments &&
         !comments.hasAttribute('hidden') &&
         comments.innerHTML.length > 100; // ensures content is actually loaded
}

// yt-navigate-finish is YouTube's own reliable SPA navigation event
document.addEventListener('yt-navigate-finish', onNavigate);
```

- Use `getElementById('comments')` not `querySelector('ytd-comments#comments')`
- `innerHTML.length > 100` ensures comments are actually loaded, not just present in DOM
- `cleanup()` should only disconnect observers — never touch the DOM during navigation
- `yt-navigate-finish` is sufficient — no background scripts or extra permissions needed
- YouTube updates `#comments` in-place, so you never need to move it back on navigation

### Check out Sidesy

Sidesy is more full-featured — toggle button, keyboard shortcut, scroll position preservation, and a polished popup. If you want those features, use Sidesy:

- **GitHub**: https://github.com/abinjohn123/sidesy
- **Chrome Web Store**: https://chromewebstore.google.com/detail/mlceikceecooilkgiikkopipedhjjech
- **Developer**: [@abinjohn123](https://github.com/abinjohn123)
