const CACHE_NAME = 'dwd-site-v44-audit';
// Photos live in their own cache so a code deploy (CACHE_NAME bump) does not
// throw away every image a returning visitor already has. Capped below.
const IMG_CACHE = 'dwd-img-v1';
const IMG_MAX = 150;
const OFFLINE_URL = '/offline.html';
// Only the shell a first visit actually needs offline. The route shells are
// near-identical 180KB copies of index.html; precaching all eight cost a new
// visitor ~390KB for pages they may never open. They are cached as they are
// visited (network-first below), which is when offline access to them matters.
const ASSETS = [
  '/',
  '/offline.html',
  // The MINIFIED sheet, because that is the one the pages link.
  '/css/site.min.css',
  '/images/logos/v3/DWD-glyph-transparent.svg',
  '/images/logos/v3/DWD-compact-dark-192.png',
  '/images/logos/v3/DWD-compact-dark-512.png'
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
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== IMG_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function trimImages() {
  caches.open(IMG_CACHE).then((cache) =>
    cache.keys().then((keys) => {
      if (keys.length <= IMG_MAX) return;
      return Promise.all(keys.slice(0, keys.length - IMG_MAX).map((k) => cache.delete(k)));
    })
  );
}

self.addEventListener('fetch', (e) => {
  var req = e.request;
  // Same-origin GETs only. Supabase inserts, the RPCs, the Stripe hand-off,
  // YouTube and the CDN bundle go straight to the network untouched.
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  var path = url.pathname;
  // Video is streamed with range requests; leave it to the browser.
  if (/\.(mp4|webm|mov)$/i.test(path)) return;

  if (req.mode === 'navigate') {
    // Network-first. Cached under the bare path: a ?ref= link still resolves
    // offline, and a Stripe return URL's order token never lands in storage.
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(path, clone));
        }
        return res;
      }).catch(() =>
        caches.match(path).then((cached) => cached || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  if (/\.(js|css|html|json)$/i.test(path)) {
    // Network-first for code (always the latest deploy). Offline, the cached
    // copy or nothing: never index.html standing in for a script.
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req).then((cached) => cached || Response.error()))
    );
    return;
  }

  // Images, fonts, icons: stale-while-revalidate. Serve what we have at once,
  // refresh it in the background, keep the newest IMG_MAX.
  e.respondWith(
    caches.open(IMG_CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        var network = fetch(req).then((res) => {
          if (res.ok && res.type === 'basic') {
            cache.put(req, res.clone()).then(trimImages);
          }
          return res;
        }).catch(() => cached || caches.match(req));
        return cached || network;
      })
    )
  );
});
