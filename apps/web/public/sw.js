const CACHE_VERSION = 'goweskit-v1.0.0';
const STATIC_CACHE_NAME = `goweskit-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `goweskit-api-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon.svg',
  '/icons/icon-192.svg',
  '/learn',
  '/garage',
  '/upgrade-lab',
  '/explore',
  '/safety',
  '/me',
  '/login',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== API_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST, PUT, DELETE should go straight to network)
  if (request.method !== 'GET') {
    return;
  }

  // API Requests: Network First, fallback to cached response (for offline learn & garage browsing)
  if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({ error: 'offline', message: 'You are currently offline. Showing cached workshop data.' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Static Assets & Navigation: Cache First with Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Refresh cache in background
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && request.url.startsWith('http')) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If navigation fails, return precached root shell
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
