const CACHE = 'flightdeck-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Never cache the weather API — always go live
  if (e.request.url.includes('api.open-meteo.com') || e.request.url.includes('geocoding-api.open-meteo.com')) {
    return;
  }
  // Network-first for the HTML page itself, so edits show up on next load
  // instead of getting stuck behind a stale cached copy. Falls back to
  // cache only when offline.
  if (e.request.mode === 'navigate' || e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for icons/manifest (rarely change)
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
  );
});
