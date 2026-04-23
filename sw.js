const CACHE_NAME = 'dwd-site-v8';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/additions.css',
  '/css/editorial.css',
  '/css/rebrand.css',
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
      }).catch(() => caches.match(e.request) || caches.match('/index.html'))
    );
  } else {
    // Cache-first for images/fonts (rarely change)
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
  }
});
