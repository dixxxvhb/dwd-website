const CACHE_NAME = 'dwd-site-v14';
const OFFLINE_URL = '/offline.html';
const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/styles.css',
  '/css/additions.css',
  '/css/editorial.css',
  '/css/rebrand.css',
  '/css/audition.css',
  '/css/poster-pages.css',
  '/css/tighten.css',
  '/images/logos/DWD-green.png',
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  var url = e.request.url;
  var isCodeFile = url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.html');

  if (e.request.mode === 'navigate' || isCodeFile) {
    // Network-first for navigation + code files (always get latest)
    e.respondWith(
      fetch(e.request).then((res) => {
        var clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      }).catch(() => {
        // Try cache, then fall through to offline page on navigations.
        return caches.match(e.request).then((cached) => {
          if (cached) return cached;
          if (e.request.mode === 'navigate') return caches.match(OFFLINE_URL);
          return caches.match('/index.html');
        });
      })
    );
  } else {
    // Cache-first for images/fonts (rarely change)
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
  }
});
