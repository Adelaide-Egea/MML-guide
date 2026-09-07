// Care Guide service worker — version is auto-bumped by bump.py on every deploy.
// Do NOT hand-edit CACHE_VERSION; run `python3 bump.py` instead.
const CACHE_VERSION = 'app-v34';   // AUTO-BUMP-LINE
const CORE = ['/', '/index.html', '/manifest.json'];

// Install: pre-cache core shell, activate immediately.
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(CORE)).catch(() => {}));
});

// Activate: delete every old cache, take control at once.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for navigations (always try fresh HTML), cache fallback offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isNav = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNav) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Other assets: cache-first, then network, and cache what we fetch.
  e.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
    )
  );
});
