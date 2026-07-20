// MML Service Worker — v1
// Caches the app shell so it loads instantly and works offline
const CACHE_NAME = 'mml-cache-v1';
const SHELL = [
  '/',
  '/index.html',
];

// Install: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fall back to network
self.addEventListener('fetch', event => {
  // Don't cache API calls — always go to network for those
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET requests
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback — return cached index
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});
