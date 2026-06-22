# PipeShift

<img src="icons/icon128.png" width="80" align="right" alt="PipeShift icon"/>

A lightweight browser extension that fixes three annoyances on YouTube — Replacing the harsh pitch black with dark grey theme, Side comments panel, Hides category bar.

---

## FEATURES

**🐢 Dark Grey Dark Mode**

**🐢 Side Comments Panel**

**🐢 Hide Category Bar**

---

## Install
You can load it manually in any browser and It is also available in Firefox addon store.

**Manual loading Steps**:
1. Click on the green Code button and click on the download zip, then extract that zip in any location you want the extension to be.
2. Go to your browser's extensions page.
3. Enable **Developer mode** (toggle, top-right)
4. Click **Load unpacked**
5. Select the `PipeShift` folder

That's it. The extension activates automatically on `youtube.com`.
Make sure not to delete the folder or the extension will be removed.
Ignore the reload button that appears in the extensions page.
For updating you can just replace the folder, browser will load it automatically if folder name and path is not changed.

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
