export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return;

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  console.info('[PWA] New version ready.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[PWA] Service worker registration failed:', err);
        });
    });
  }
});
