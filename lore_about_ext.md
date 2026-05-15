# BetterYouTube Extension — Complete Logic Documentation

> Extension version: **2.9.3** | Manifest: **MV3** | Target: `*://www.youtube.com/*`

---

## Overview

BetterYouTube is a browser extension with **three core features**:

1. **Dark Grey Theme** — softens YouTube's black dark mode to a softer grey
2. **Side Comments Panel** — moves the comments section into the right sidebar alongside video
3. **Hide Category Chips Bar** — removes the filter/chip bar from the home feed

---

## Architecture

### File Structure & Load Order

```
manifest.json
├── content_scripts[0]  →  run_at: document_start
│   ├── css/theme.css
│   ├── css/hide-chips.css
│   ├── js/fullscreen.js
│   ├── js/hide-chips.js
│   └── js/playlist-hide.js
│
└── content_scripts[1]  →  run_at: document_idle (default)
    ├── css/side-comments.css
    └── js/side-comments.js
```

The first group loads **as early as possible** (document_start) so that the theme and chip-hiding styles are applied before the page paints, preventing a flash of unstyled content. The side-comments panel is loaded later (document_idle) because it needs the DOM to be accessible.

No background service worker. No storage. No network requests. The extension has **zero permissions** beyond access to `youtube.com`.

---

## Feature 1: Dark Grey Theme (`css/theme.css`)

### Logic

The entire theme is **CSS-only**, scoped to `html[dark]` — YouTube's own dark mode attribute. This means the extension's theme only activates when the user has already enabled YouTube's native dark mode. The extension does not implement its own dark mode toggle.

### What it overrides

The CSS overrides YouTube's own CSS custom properties (variables) and directly targets component backgrounds:

| Target | New Value | Purpose |
|---|---|---|
| `--yt-spec-base-background` | `#191919` | Main page background |
| `--yt-spec-raised-background` | `#252525` | Cards and raised surfaces |
| `--yt-spec-menu-background` | `#252525` | Menus and dropdowns |
| `--yt-spec-badge-chip-background` | `#2b2b2b` | Chip/badge backgrounds |
| `--yt-spec-10-percent-background` | `rgba(255,255,255,0.08)` | Subtle overlays |

### Targeted Components

- **Page shell**: `body`, `ytd-app`, `#page-manager`, `ytd-page-manager` → `#191919`
- **Top nav bar**: `#masthead-container`, `ytd-masthead` → `#191919`
- **Left sidebar**: `tp-yt-app-drawer`, `ytd-guide-renderer`, `ytd-mini-guide-renderer` → `#191919`
- **Home/browse page**: `ytd-browse`, `ytd-two-column-browse-results-renderer`, `ytd-rich-grid-renderer` → `#191919`
- **Watch page**: `ytd-watch-flexy`, `#primary`, `#secondary`, `#primary-inner`, `#secondary-inner` → `#191919`
- **Video info**: `ytd-video-primary-info-renderer`, `ytd-video-secondary-info-renderer`, `ytd-watch-metadata` → `#191919`
- **Comments**: `ytd-comments` → `#1c1c1c` (slightly lighter for contrast)
- **Search results**: `ytd-search`, `ytd-section-list-renderer` → `#1c1c1c`
- **Menus/dropdowns**: `ytd-menu-popup-renderer`, `tp-yt-paper-dialog`, etc. → `#252525`
- **Scrollbars**: Document-level track → `#1c1c1c`, thumb → `#373737`, hover → `#434343`
- **Side Comments integration**: Keeps the comments card and its header in `#191919` when the side panel is active

---

## Feature 2: Hide Category Chips Bar (`css/hide-chips.css` + `js/hide-chips.js`)

### CSS Logic (`hide-chips.css`)

Hides the category filter bar on YouTube's home feed using `display: none !important` on four selectors to handle both standard and A/B variant layouts:

- `ytd-feed-filter-chip-bar-renderer` — main Polymer component
- `#chips-wrapper` — inner wrapper (some A/B layouts)
- `yt-chip-cloud-renderer` — cloud container
- `yt-chip-cloud-chip-renderer` — individual chips
- `#header.ytd-rich-grid-renderer` — the sticky black strip that contains the bar (collapses the gap)

### JavaScript Logic (`hide-chips.js`)

CSS alone isn't enough because YouTube's SPA can re-inject these elements on navigation. The JS uses a **debounced MutationObserver** pattern:

```
IIFE immediately invoked:
  1. Define target selectors: ['#frosted-glass', 'ytd-feed-filter-chip-bar-renderer', '#chips-wrapper']
  2. Run nuke() immediately — removes any already-present elements from the DOM
  3. Set up a MutationObserver on document.documentElement with { childList: true, subtree: true }
  4. On each mutation batch:
     - If a requestAnimationFrame timer is already queued, skip (debounce)
     - Otherwise, queue a rAF callback to call nuke() once per frame
     - This ensures at most one removal pass per animation frame, no matter how many mutations fire
```

The `nuke()` function calls `querySelectorAll(selector).forEach(el => el.remove())` for each target — it physically removes elements from the DOM rather than just hiding them, which is more robust.

---

## Feature 3: Fullscreen Popup Hider (`js/fullscreen.js`)

### Logic

YouTube shows a popup bar at the bottom of the screen even in fullscreen mode. This script hides all `ytd-popup-container` elements while fullscreen is active.

```
1. handleFullscreen():
   - Detect fullscreen state by checking ANY of three signals:
     a. ytd-watch-flexy[fullscreen] attribute exists
     b. ytd-app[is-fullscreen] attribute exists
     c. document.fullscreenElement is truthy
   - If fullscreen: set display: none !important on all ytd-popup-container elements
   - If not fullscreen: remove the display property (restore normal display)

2. Listen on three events:
   - fullscreenchange (standard)
   - webkitfullscreenchange (webkit/Safari fallback)
   - yt-navigate-finish (YouTube SPA navigation — re-check after page change)

3. Call handleFullscreen() once immediately on script load
```

---

## Feature 4: Playlist Hide During Load (`js/playlist-hide.js`)

### Logic

This is a small helper that injects a `<style>` tag to hide the playlist panel until the side-comments feature has finished activating.

```
1. Create a <style> element with id="byt-playlist-hide"
2. Set its CSS to:
   html:not(.sc-active) ytd-watch-flexy #playlist,
   html:not(.sc-active) ytd-watch-flexy ytd-playlist-panel-renderer {
     display: none !important;
   }
3. Append to document.documentElement immediately
```

The condition `html:not(.sc-active)` means the playlist is hidden only while the side-comments layout has NOT yet been activated. Once `sc-active` is added to `<html>`, the playlist becomes visible again. This prevents a layout flash where the playlist appears in the wrong position before the sidebar rearrangement is complete.

---

## Feature 5: Side Comments Panel (`js/side-comments.js` + `css/side-comments.css`)

This is the most complex feature. It moves the comments section out of the main column and into the right sidebar.

### CSS Layout Logic (`side-comments.css`)

CSS variables defined on `:root`:
- `--sc-w: 420px` — sidebar width
- `--sc-top: 56px` — sticky offset (height of YouTube's top nav)
- `--sc-gap: 10px` — gap between primary and secondary columns
- `--sc-radius: 6px` — border radius of comments card
- `--sc-surface` / `--sc-border` — colors from YouTube's own variables with fallbacks

All layout rules are gated behind the `.sc-active` class on `<html>`:

**Two-column layout:**
- `#columns` → `display: flex`, `flex-flow: row nowrap`
- `#primary` → `flex: 1 1 auto`, `margin-right: var(--sc-gap)`
- `#secondary` → `flex: 0 0 420px`, `position: sticky`, `top: 56px`, `height: calc(100vh - 56px)`, `overflow-y: auto` — makes the sidebar scroll independently

**Comments card:**
- `#comments.sc-comments` → `width: 100%`, `height: 77.5vh`, `overflow-y: auto`, bordered card with subtle shadow, fade-in animation (`sc-in`)

**Loading state (`.sc-comments:not(.sc-loaded)`):**
- A `::after` pseudo-element covers the card with the surface color (white/dark overlay)
- A `::before` pseudo-element shows a CSS-only spinning border animation (`sc-spin`) centered in the card
- YouTube's native skeleton loaders (`#ghost-cards`, `ytd-comment-skeleton-renderer`) are hidden inside the card

**Loaded state (`.sc-loaded`):**
- The overlay and spinner disappear (`:not(.sc-loaded)` selectors no longer apply)
- Skeletons are still hidden to prevent flashing during player mode changes

**Related videos:** Forced to `width: 100%` to fit in the narrower sidebar.

**"Load more" spinners in related videos:** Collapsed to `height: 1px`, `opacity: 0` — invisible but still present so YouTube's IntersectionObserver can trigger infinite scroll loading.

**Narrow viewport (`max-width: 1099px`):** The `#secondary` is hidden entirely and `#primary` gets no right margin — fallback to normal single-column layout on small screens.

---

### JavaScript Logic (`side-comments.js`)

#### State Variables

```
obs1          — MutationObserver watching for #comments[hidden] removal
interval      — setInterval polling for commentsReady()
activated     — boolean: has activate() been called for this video?
nudgeTmr      — setInterval for post-layout resize nudges
playlistObs   — MutationObserver watching for playlist panel insertion
loadedObs     — MutationObserver watching for first comment thread
lastVideoUrl  — the 'v' param of the last processed URL (video ID)
```

#### Core Detection Logic: `commentsReady()`

```
function commentsReady():
  Get element with id="comments"
  Return true only if ALL of:
    - Element exists
    - It does NOT have the 'hidden' attribute
    - Its innerHTML.length > 100  ← ensures actual content loaded, not empty shell
```

This three-part check is the key insight credited to Sidesy — `innerHTML.length > 100` guards against false positives where the element exists in the DOM but hasn't populated yet.

#### Navigation Handling

YouTube is a **Single Page Application (SPA)**. The extension listens to two YouTube-specific events:

`yt-navigate-finish` — fires when YouTube completes navigation to a new page:
```
1. If NOT a watch page:
   - Remove 'sc-active' from <html>
   - Remove 'sc-comments' from #comments
   - cleanup() (soft — don't reset loaded state)
   - Return

2. If IS a watch page:
   - Get current video ID from URL ?v= param
   - If same video as lastVideoUrl → handleSameVideoLayout() (layout change, not new video)
   - If new video → set lastVideoUrl, cleanup(true) (hard reset), detect()
```

`yt-page-data-updated` — fires on player mode changes (miniplayer ↔ expanded, theater toggle):
```
1. If NOT a watch page → return
2. If same video as lastVideoUrl → handleSameVideoLayout()
```

#### Activation Flow: `detect()`

```
detect():
  1. If not a watch page → return
  2. Call watchAndCollapsePlaylist()
  3. Get #comments and #secondary-inner
  4. If both exist:
     - Add 'sc-active' to <html>    ← enables CSS layout immediately
     - Add 'sc-comments' to #comments
     - Move #comments into #secondary-inner (prepend)
  5. Call tryActivate() — if comments already ready, done
  6. If #comments has 'hidden' attribute:
     - Set up obs1 (MutationObserver) watching for 'hidden' attr removal
     - When hidden is removed: disconnect obs1, call tryActivate() or startInterval()
  7. Call forceCommentsLoad()        ← trick to trigger YouTube to load comments
  8. Call startInterval()            ← polling fallback
```

#### Force Comments Load: `forceCommentsLoad()`

YouTube lazily loads comments only when the user scrolls down. Since we moved comments to the sidebar (no scrolling required to see them), they'd never load. The fix:

```
forceCommentsLoad():
  1. Save current scroll position (window.scrollY)
  2. Instantly scroll to Y=800 (below the fold, where comments normally are)
  3. On next animation frame: instantly scroll back to saved position
```

This briefly scrolls the page programmatically to trigger YouTube's IntersectionObserver that initiates comment loading, then immediately returns to the user's position. The movement is invisible.

#### Polling Fallback: `startInterval()`

```
startInterval():
  If already running → return
  Set counter n = 0
  Every 500ms:
    n++
    If tryActivate() succeeds OR n >= 60 (30 seconds) → stop interval
```

30 seconds maximum polling. If comments haven't loaded in 30 seconds, the extension gives up.

#### `tryActivate()`

```
tryActivate():
  If already activated → return true
  If not commentsReady() → return false
  Set activated = true
  Disconnect obs1, stop interval
  Call activate()
  Return true
```

#### `activate()` — The Main Rearrangement

```
activate():
  Get #comments, #secondary-inner, #columns
  If any missing → return

  Add 'sc-active' to <html>
  Move #comments into #secondary-inner (prepend)
  Add 'sc-comments' class to #comments
  Call nudge()

  If comment threads (ytd-comment-thread-renderer) already exist in #comments:
    Add 'sc-loaded' class immediately
  Else:
    Set up loadedObs (MutationObserver) on #comments watching childList + subtree
    When first ytd-comment-thread-renderer appears:
      Add 'sc-loaded', disconnect loadedObs
```

The `sc-loaded` class removal of the loading spinner overlay is what makes the transition smooth — the spinner shows until real comment content exists.

#### `handleSameVideoLayout()` — Layout Change Without Navigation

For miniplayer ↔ expanded transitions and theater mode toggles where the video ID doesn't change:

```
handleSameVideoLayout():
  Get #comments, #secondary-inner
  Add 'sc-active' to <html>
  If #comments is not already in #secondary-inner → prepend it there
  Add 'sc-comments' class

  If sc-loaded not set but comment threads exist → add sc-loaded (re-apply)

  If not activated → detect() (full re-detect, e.g. returning from miniplayer)
  Else → nudge() (just fix layout)
```

#### `cleanup(resetLoaded)`

```
cleanup(resetLoaded):
  Disconnect and null: obs1, playlistObs, loadedObs
  Clear interval
  Set activated = false
  If resetLoaded is true:
    Remove 'sc-loaded' from #comments
    Remove all ytd-comment-thread-renderer elements from #comments
    (prevents stale threads from triggering premature sc-loaded on next video)
```

Called with `resetLoaded=false` (soft) on non-watch navigation (layout preserved).
Called with `resetLoaded=true` (hard) when navigating to a new video (full reset).

#### Playlist Auto-Collapse: `watchAndCollapsePlaylist()`

```
watchAndCollapsePlaylist():
  If ytd-playlist-panel-renderer already exists → collapsePlaylist(it) → return

  Set up playlistObs (MutationObserver) on document.body, childList + subtree
  When ytd-playlist-panel-renderer is added to DOM:
    collapsePlaylist(it)
    Disconnect playlistObs
```

`collapsePlaylist(pl)`:
```
  If already has 'collapsed' attribute → return (already collapsed)
  Try to find and click the native collapse button:
    Selectors: paper-icon-button#expand-button, yt-icon-button#expand-button,
               [aria-label*="collapse" i], [aria-label*="Collapse" i]
    If found → btn.click()  ← uses YouTube's own button so native "Next:" bar appears
  If not found → set 'collapsed' attribute manually + pl.collapsed = true
```

#### `nudge()` — Force Layout Recalculation

After the DOM rearrangement, browsers sometimes don't immediately reflow. This function triggers recalculation:

```
nudge():
  Clear any previous nudge timer
  Get #secondary element

  One-time jiggle: set scrollTop = 1, then on rAF set scrollTop = 0
  Dispatch a 'resize' event on window

  Every 500ms for up to 4 times:
    Dispatch 'resize' event on window
  
  If user scrolls the sidebar at any point:
    Cancel remaining nudge timers immediately
    (user is in control — don't interfere)
```

---

## Initial Load Logic

```
If document.readyState === 'loading':
  Wait for DOMContentLoaded event
  If watch page: set lastVideoUrl, detect()

Else (DOM already ready):
  If watch page: set lastVideoUrl, detect()
```

This handles both cases: extension loading before and after the DOM is parsed.

---

## CSS Classes Added to DOM Elements

| Class | Added to | Meaning |
|---|---|---|
| `sc-active` | `<html>` | Side comments layout is active (enables all CSS rules) |
| `sc-comments` | `#comments` | Marks comments element as the side panel |
| `sc-loaded` | `#comments` | Real comment content has appeared (removes loading spinner) |

---

## Summary of Key Design Decisions

| Decision | Reason |
|---|---|
| `innerHTML.length > 100` to detect loaded comments | DOM presence alone is insufficient; YouTube renders empty shells first |
| Physical DOM move of `#comments` to sidebar | CSS repositioning alone doesn't work reliably with YouTube's layout engine |
| `forceCommentsLoad()` scroll trick | YouTube won't load comments unless they're scrolled into the viewport |
| MutationObserver + interval fallback | YouTube's rendering is unpredictable; belt-and-suspenders approach |
| Listening to `yt-navigate-finish` | YouTube's own reliable SPA navigation event; no polling for URL changes needed |
| Tracking `lastVideoUrl` | Distinguishes real navigation (new video) from layout changes (same video) |
| `cleanup(resetLoaded)` with two modes | Soft reset for layout changes; hard reset for new videos to clear stale state |
| CSS gated on `html[dark]` for theme | Extension doesn't impose dark mode; respects user preference |
| Chips removed via both CSS and JS | CSS hides instantly; JS `nuke()` removes elements that get re-injected by YouTube's SPA |
| Playlist hidden until `sc-active` | Prevents a flash of playlist in wrong position during sidebar activation |
| `1px` invisible continuation items | Keeps YouTube's IntersectionObserver for infinite scroll working without visible spinners |
