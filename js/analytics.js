/* ═══════════════════════════════════════════════
   DWD — Site Analytics Tracker
   Lightweight, cookie-free, anonymous usage tracking
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // Skip tracking in dev / localhost
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

  // Reuse the Supabase client exposed by main.js
  var sb = window.__dwd_sb;
  if (!sb) return;

  // ── Identity (anonymous) ──
  function getId(storage, key) {
    var id = storage.getItem(key);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
      storage.setItem(key, id);
    }
    return id;
  }

  var visitorId = getId(localStorage, 'dwd_vid');
  var sessionId = getId(sessionStorage, 'dwd_sid');

  // ── UTM params (captured once on page load) ──
  var params = new URLSearchParams(location.search);
  var utmSource = params.get('utm_source') || '';
  var utmMedium = params.get('utm_medium') || '';
  var utmCampaign = params.get('utm_campaign') || '';

  // ── Device ──
  var deviceType = window.innerWidth < 768 ? 'mobile' : 'desktop';

  // ── Core send function ──
  function send(eventType, extra) {
    var data = {
      event_type: eventType,
      visitor_id: visitorId,
      session_id: sessionId,
      device_type: deviceType,
      screen_width: window.innerWidth,
      referrer: document.referrer || '',
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign
    };
    if (extra) {
      for (var k in extra) data[k] = extra[k];
    }
    try { sb.from('site_analytics').insert(data).then(function () {}); } catch (e) {}
  }

  // ── Page tracking ──
  var currentPage = '';
  var pageEnteredAt = 0;

  function getPage() {
    var h = location.hash.replace('#', '').split('?')[0];
    return h || 'home';
  }

  function exitPage() {
    if (currentPage && pageEnteredAt) {
      var duration = Date.now() - pageEnteredAt;
      if (duration > 500) {
        send('page_exit', { page: currentPage, duration_ms: duration });
      }
    }
  }

  function enterPage() {
    currentPage = getPage();
    pageEnteredAt = Date.now();
    send('page_view', { page: currentPage });
  }

  // ── Session start (once per session) ──
  if (!sessionStorage.getItem('dwd_started')) {
    sessionStorage.setItem('dwd_started', '1');
    send('session_start', { page: getPage() });
  }

  // ── Init: track first page ──
  enterPage();

  // ── Hash change: exit old page, enter new ──
  window.addEventListener('hashchange', function () {
    exitPage();
    enterPage();
  });

  // ── Tab hidden / close: exit current page ──
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') exitPage();
    if (document.visibilityState === 'visible') { pageEnteredAt = Date.now(); }
  });

  // ── Click tracking on [data-track] elements ──
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) {
      send('click', { page: getPage(), element: el.dataset.track });
    }
  });

})();
