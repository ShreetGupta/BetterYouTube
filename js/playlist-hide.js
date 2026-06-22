// PipeShift — hide #playlist until side-comments are ready (sc-active on <html>)
// Scoped to ytd-watch-flexy so it only applies on watch pages
const s = document.createElement('style');
s.id = 'psh-playlist-hide';
s.textContent = `
  html:not(.sc-active) ytd-watch-flexy #playlist,
  html:not(.sc-active) ytd-watch-flexy ytd-playlist-panel-renderer {
    display: none !important;
  }
`;
document.documentElement.appendChild(s);
