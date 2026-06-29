// Lokal Money BI — Service Worker
// Estrategia: Network-first para HTML (datos frescos), Cache-first para assets
const CACHE = 'lokal-bi-v2';
const OFFLINE_PAGE = '/index.html';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([OFFLINE_PAGE]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Solo cachear recursos del mismo origen (no APIs externas)
  if (url.origin !== self.location.origin) return;

  if (e.request.mode === 'navigate') {
    // HTML: network-first, fallback a caché si offline
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(OFFLINE_PAGE))
    );
  } else {
    // Assets (CSS, JS, fuentes, imágenes): cache-first
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        });
      })
    );
  }
});
