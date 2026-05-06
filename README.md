# Better YouTube

<img src="icons/icon128.png" width="80" align="right" alt="BetterYouTube icon"/>

A lightweight Chrome extension that fixes three annoyances on YouTube — no settings UI, no trackers, no bloat. Load it and forget it.

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

1. Download or clone this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode** (toggle, top-right)
4. Click **Load unpacked**
5. Select the `Better YouTube` folder

That's it. The extension activates automatically on `youtube.com`.

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

## Credits

Built by combining three extensions:

- **GreyTube** — grey dark mode theme
- **SideCommentsYT** — comments panel
- **yt-hide-chips** — category bar removal
