// Held — service worker
// IMPORTANT: bump CACHE_VERSION on every deploy where you want installed
// users to pick up changes immediately. This is what stops the "old
// version stuck on my phone" problem.
const CACHE_VERSION = '2026-07-21';
const CACHE_NAME = `held-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache the shell, then activate immediately (don't wait for
// old tabs to close).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete every cache that isn't this version, then take
// control of all open tabs right away.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Page navigations (the HTML itself) → NETWORK FIRST. This guarantees
//   a new deploy is what people see the moment they're online, and only
//   falls back to the cached shell if they're offline.
// - Everything else (icons, manifest, fonts) → cache first, refresh in
//   the background (stale-while-revalidate), since those change rarely.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const isNavigation = request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
