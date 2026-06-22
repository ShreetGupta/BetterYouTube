// PipeShift — hide popup bar in fullscreen

function handleFullscreen() {
  const isFullscreen = !!(
    document.querySelector('ytd-watch-flexy[fullscreen]') ||
    document.querySelector('ytd-app[is-fullscreen]') ||
    document.fullscreenElement
  );
  document.querySelectorAll('ytd-popup-container').forEach(el => {
    if (isFullscreen) el.style.setProperty('display', 'none', 'important');
    else el.style.removeProperty('display');
  });
}

document.addEventListener('fullscreenchange', handleFullscreen);
document.addEventListener('webkitfullscreenchange', handleFullscreen);
document.addEventListener('yt-navigate-finish', handleFullscreen);
handleFullscreen();
