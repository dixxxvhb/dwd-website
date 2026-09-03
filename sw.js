const CACHE_NAME = 'dwd-site-v39';
const OFFLINE_URL = '/offline.html';
const ASSETS = [
  '/',
  '/index.html',
  // The six route shells (item 3.1). Each is a copy of index.html with its own
  // metadata; precaching them keeps a deep link working offline the same way
  // "/" already did.
  '/proseries/',
  '/collective/',
  '/teachers/',
  '/gallery/',
  '/contact/',
  '/privacy/',
  '/offline.html',
  '/css/site.css',
  '/images/logos/DWD-green.png',
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    // allSettled so one missing/404 asset degrades gracefully instead of
    // rejecting the whole install and silently killing offline for everyone.
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS.map((u) => cache.add(u).catch(function () {})))
    )
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
  // Match on pathname so query-stringed assets (e.g. main.js?v=4,
  // styles.css?v=2) still take the network-first path and never freeze in cache.
  var path;
  try { path = new URL(url).pathname; } catch (err) { path = url; }
  var isCodeFile = path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.html');

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
