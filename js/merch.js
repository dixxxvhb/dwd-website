/* ═══════════════════════════════════════════════
   DWD: /merch/
   The tour hoodie picker and the rest of the drop.

   The store is Coastal Threads' (a Shopify shop that sends no CORS header, so
   the browser cannot read its feed). scripts/build-merch.mjs reads it at build
   time and writes data/merch.json; this renders that file. Nothing here takes
   money or holds a cart: every button is a plain link to the product on
   Coastal Threads' site.

   The markup ships with working links to the shop in both lists, so a failed
   fetch leaves a page that still gets a family to the store.
   ═══════════════════════════════════════════════ */
(function () {
  'use strict';

  var page = document.getElementById('page-merch');
  if (!page) return;

  var GROUPS = [
    ['pro', 'Pro'],
    ['elite', 'Elite'],
    ['prep', 'Prep'],
    ['family', 'Families'],
    ['staff', 'Staff']
  ];

  var data = null, started = false;
  var current = null, colorIx = 0;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Shopify's image CDN resizes on the fly: ?width= on any file URL.
  function sized(url, w) { return url + '?width=' + w; }

  function productUrl(handle) {
    return data.store.collection + '/products/' + encodeURIComponent(handle);
  }

  // "Remi" -> "Remi's", "Keke & Finnie" -> "Keke & Finnie's". "John's Mom"
  // and anything ending in s keep a bare apostrophe.
  function possessive(label) {
    return /s$/i.test(label) ? label + "'" : label + "'s";
  }

  /* ── The stage: one hoodie, its colours, its link ── */

  function paintStage() {
    var h = current;
    if (!h) return;
    var c = h.colors[colorIx] || h.colors[0];
    var img = document.getElementById('merch-stage-img');
    var name = document.getElementById('merch-stage-name');
    var meta = document.getElementById('merch-stage-meta');
    var buy = document.getElementById('merch-stage-buy');
    var sw = document.getElementById('merch-swatches');

    if (img && c) {
      img.src = sized(c.img, 900);
      img.srcset = sized(c.img, 600) + ' 600w, ' + sized(c.img, 900) + ' 900w, ' + sized(c.img, 1400) + ' 1400w';
      img.sizes = '(max-width: 900px) 100vw, 42vw';
      img.alt = possessive(h.label) + ' tour hoodie in ' + c.name.toLowerCase() + ', front';
    }
    if (name) name.textContent = possessive(h.label) + ' tour hoodie';
    if (meta) {
      meta.textContent = '$' + h.price + ' · ' + h.sizes + (h.available ? '' : ' · sold out right now');
    }
    if (buy) {
      buy.href = productUrl(h.handle);
      buy.setAttribute('data-track', 'merch-buy-' + h.handle.replace(/^26-27-proseries-tour-hoody-/, 'hoodie-'));
    }
    if (sw) {
      sw.textContent = '';
      h.colors.forEach(function (col, i) {
        var b = el('button', 'mrch-swatch' + (i === colorIx ? ' is-on' : ''));
        b.type = 'button';
        b.style.setProperty('--sw', col.hex);
        b.setAttribute('aria-pressed', i === colorIx ? 'true' : 'false');
        b.setAttribute('aria-label', col.name);
        b.title = col.name;
        b.addEventListener('click', function () { colorIx = i; paintStage(); });
        sw.appendChild(b);
      });
      var lab = el('span', 'mrch-swatch-name', c ? c.name : '');
      sw.appendChild(lab);
    }
  }

  function pick(h, btn) {
    current = h;
    if (colorIx >= h.colors.length) colorIx = 0;
    var on = page.querySelectorAll('.mrch-name.is-on');
    for (var i = 0; i < on.length; i++) {
      on[i].classList.remove('is-on');
      on[i].setAttribute('aria-pressed', 'false');
    }
    if (btn) {
      btn.classList.add('is-on');
      btn.setAttribute('aria-pressed', 'true');
    }
    paintStage();
    if (window.__dwd_track) { try { window.__dwd_track('merch-pick'); } catch (e) {} }
  }

  function renderNames() {
    var box = document.getElementById('merch-names');
    if (!box) return;
    box.textContent = '';
    var first = null, firstBtn = null;
    GROUPS.forEach(function (g) {
      var list = data.hoodies.filter(function (h) { return h.group === g[0]; });
      if (!list.length) return;
      var wrap = el('div', 'mrch-group');
      wrap.appendChild(el('h3', 'mrch-group-title', g[1]));
      var row = el('div', 'mrch-chips');
      list.forEach(function (h) {
        var b = el('button', 'mrch-name', h.label);
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          pick(h, b);
          // On a phone the stage sits above the names: bring it back into
          // view so the tap visibly did something.
          var stage = document.getElementById('merch-stage');
          if (stage && window.matchMedia('(max-width: 900px)').matches) {
            var top = stage.getBoundingClientRect().top;
            if (top < 60 || top > window.innerHeight * 0.5) {
              window.scrollTo({ top: window.scrollY + top - 84, behavior: 'smooth' });
            }
          }
        });
        row.appendChild(b);
        // Open on the director's own hoodie: it shows the idea without
        // putting one dancer ahead of the rest.
        if (!first || h.label === 'Mr Dixon') { first = h; firstBtn = b; }
      });
      wrap.appendChild(row);
      box.appendChild(wrap);
    });
    if (first) pick(first, firstBtn);
  }

  /* ── The rest of the drop ── */

  function renderGear() {
    var grid = document.getElementById('merch-grid');
    if (!grid || !data.gear.length) return;
    grid.textContent = '';
    data.gear.forEach(function (g) {
      var li = el('li', 'mrch-card');
      var a = el('a', 'mrch-card-link');
      a.href = productUrl(g.handle);
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('data-track', 'merch-gear-' + g.handle);

      var ph = el('span', 'mrch-card-photo');
      g.images.forEach(function (src, i) {
        var im = document.createElement('img');
        im.src = sized(src, 600);
        im.srcset = sized(src, 400) + ' 400w, ' + sized(src, 600) + ' 600w, ' + sized(src, 900) + ' 900w';
        im.sizes = '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 300px';
        im.alt = i === 0 ? g.name : '';
        im.width = 600; im.height = 600;
        im.loading = 'lazy'; im.decoding = 'async';
        if (i === 1) im.className = 'mrch-card-alt';
        ph.appendChild(im);
      });
      a.appendChild(ph);

      var txt = el('span', 'mrch-card-text');
      txt.appendChild(el('span', 'mrch-card-name', g.name));
      txt.appendChild(el('span', 'mrch-card-price', '$' + g.price));
      if (g.line) txt.appendChild(el('span', 'mrch-card-line', g.line));
      txt.appendChild(el('span', 'mrch-card-sizes', g.available ? g.sizes : 'Sold out right now'));
      var sr = el('span', 'sr-only', ' at Coastal Threads (opens in a new tab)');
      txt.appendChild(sr);
      a.appendChild(txt);

      li.appendChild(a);
      grid.appendChild(li);
    });
  }

  function start() {
    if (started) return;
    started = true;
    fetch('/data/merch.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (!d || !d.store || !Array.isArray(d.hoodies) || !Array.isArray(d.gear)) throw new Error('bad shape');
        data = d;
        page.classList.add('mrch-live');
        if (d.hoodies.length) renderNames();
        renderGear();
      })
      .catch(function () {
        // The typed fallback links stay. Let a later visit to the page retry.
        started = false;
      });
  }

  function onRoute(name) { if (name === 'merch') start(); }

  if (page.classList.contains('active')) start();
  window.addEventListener('dwd:route', function (e) { onRoute(e && e.detail && e.detail.page); });
})();
