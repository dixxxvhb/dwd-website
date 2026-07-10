/* ═══════════════════════════════════════════════════════════════════════
 * DWD — Season One motion layer (js/motion.js)
 * Progressive-enhancement only. Every feature checks its own DOM/API
 * support and no-ops cleanly when absent — this script never assumes
 * css/season-one.css markup exists. Does not touch campaign.js's era
 * gating (data-reveal-after/data-hide-after `display` values) anywhere;
 * it only reads them where noted.
 * ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Shared: pause any .s1-managed <video> once it drops below 15%
  // visible (hero video + video-card rail videos alike). ──
  var pauseObserver = null;
  function watchForPause(video) {
    if (!('IntersectionObserver' in window)) return;
    if (!pauseObserver) {
      pauseObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.intersectionRatio < 0.15 && !v.paused) {
            v.pause();
          }
        });
      }, { threshold: [0, 0.15] });
    }
    pauseObserver.observe(video);
  }

  // ── Hero video: desktop-only (>=1024px) floating phone-frame video.
  // Skips entirely under reduced motion, data-saver/slow connections, or
  // narrow viewports. The file may not exist yet — errors are swallowed
  // quietly (no console noise from this script; a 404 will still show up
  // in the browser's own network panel, which is unavoidable and fine). ──
  function initHeroVideo() {
    var slot = document.getElementById('s1-hero-video');
    if (!slot) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;

    if (window.innerWidth < 1024) return;

    window.addEventListener('load', function () {
      var video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.autoplay = true;
      video.setAttribute('aria-hidden', 'true');
      video.className = 's1-managed';

      video.addEventListener('error', function () {
        video.remove();
      }, { once: true });

      video.addEventListener('canplaythrough', function () {
        video.classList.add('s1-video-live');
      }, { once: true });

      video.src = 'images/video/hero-reel-1080.mp4';
      slot.appendChild(video);
      watchForPause(video);
    });
  }

  // ── Reveal system: .s1-reveal / .s1-stagger / .s1-hero get .s1-in once
  // at 15% visibility. No IO support → reveal everything immediately. ──
  function initReveal() {
    var targets = document.querySelectorAll('.s1-reveal, .s1-stagger, .s1-hero');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('s1-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.intersectionRatio >= 0.15) {
          entry.target.classList.add('s1-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: [0, 0.15] });

    targets.forEach(function (el) { io.observe(el); });
  }

  // ── Click-to-play video cards (.s1-video-card). First click builds the
  // <video controls> from data-video/data-poster, plays it (user gesture,
  // so unmuted audio is fine), and pauses every other card's video. ──
  function initVideoCards() {
    document.addEventListener('click', function (e) {
      var card = e.target && e.target.closest ? e.target.closest('.s1-video-card') : null;
      if (!card) return;
      if (card.querySelector('video')) return; // already built — let native controls handle it

      var src = card.getAttribute('data-video');
      if (!src) return;
      var poster = card.getAttribute('data-poster');

      var video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'none';
      video.className = 's1-managed';
      if (poster) video.poster = poster;
      video.src = src;

      card.appendChild(video);
      card.classList.add('is-playing');

      document.querySelectorAll('.s1-video-card video.s1-managed').forEach(function (v) {
        if (v !== video) v.pause();
      });

      watchForPause(video);
      video.play().catch(function () {});
    });
  }

  // ── Sticky mobile bar. The bar is era-gated in HTML
  // (data-reveal-after/data-hide-after, applied by campaign.js) — this
  // code NEVER sets bar.style.display itself except on user dismiss; it
  // only reacts to campaign.js's own changes via MutationObserver. ──
  function initStickyBar() {
    var bar = document.getElementById('s1-mobile-bar');
    if (!bar) return;

    function dismissed() {
      try { return sessionStorage.getItem('s1:bar:dismissed') === '1'; }
      catch (e) { return false; }
    }

    function syncBody() {
      var revealed = bar.style.display !== 'none';
      document.body.classList.toggle('s1-has-bar', revealed && !dismissed());
    }
    syncBody();

    if ('MutationObserver' in window) {
      new MutationObserver(syncBody).observe(bar, { attributes: true, attributeFilter: ['style'] });
    }

    var dismissBtn = bar.querySelector('.s1-bar-x');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        try { sessionStorage.setItem('s1:bar:dismissed', '1'); } catch (e) {}
        bar.style.display = 'none';
        document.body.classList.remove('s1-has-bar');
      });
    }

    if ('IntersectionObserver' in window) {
      var watchIds = ['season-one-cta', 'season-underway-cta', 'proseries-interest'];
      var visible = Object.create(null);
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.intersectionRatio >= 0.3;
        });
        var anyVisible = Object.keys(visible).some(function (k) { return visible[k]; });
        bar.classList.toggle('s1-bar-hidden', anyVisible);
      }, { threshold: [0, 0.3, 1] });

      watchIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) io.observe(el);
      });
    }
  }

  initHeroVideo();
  initReveal();
  initVideoCards();
  initStickyBar();
})();
