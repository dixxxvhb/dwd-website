/* ═══════════════════════════════════════════════
   DWD — Site Analytics Tracker
   Lightweight, cookie-free, anonymous usage tracking
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // Skip tracking in dev / localhost
  if (location.hostname === 'localhost' || /^127\./.test(location.hostname)) return;

  // Skip automated browsers (Lighthouse, Puppeteer, QA runs): one audit
  // session wrote ~200 fake rows into site_analytics on 2026-09-22.
  if (navigator.webdriver || /HeadlessChrome|Lighthouse/.test(navigator.userAgent)) return;

  // Skip tracking for admin (anyone who's entered the access code)
  // Storage can throw (Safari private mode, blocked site data): track without it.
  function stored(storage, key) { try { return storage.getItem(key); } catch (e) { return null; } }
  if (stored(localStorage, 'dwd_analytics_auth') || stored(localStorage, 'dwd_campaign_auth')) return;

  // Reuse the Supabase client exposed by main.js
  var sb = window.__dwd_sb;
  if (!sb) return;

  // ── Identity (anonymous) ──
  function getId(storage, key) {
    var id = stored(storage, key);
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { storage.setItem(key, id); } catch (e) {}
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

  // The page name comes from the path: '/' is 'home', '/schedule/' is
  // 'schedule'. A hash only counts when it names a whole page (the legacy
  // /#proseries links); in-page anchors like #ps-faq are sections, not pages.
  function getPage() {
    var h = location.hash.replace('#', '').split('?')[0];
    if (h && (window.__dwd_pages || []).indexOf(h) !== -1) return h === 'adult-company' ? 'collective' : h;
    var p = location.pathname.replace(/^\/+|\/+$/g, '').replace(/\/(index\.html)?$/, '');
    if (p === 'index.html') p = '';
    return p ? p.replace(/\//g, '-') : 'home';
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
  if (!stored(sessionStorage, 'dwd_started')) {
    try { sessionStorage.setItem('dwd_started', '1'); } catch (e) {}
    send('session_start', { page: getPage() });
  }

  // ── Init: track first page ──
  enterPage();

  // ── Route change: main.js fires dwd:route from showPage(), after the URL
  // has been updated. The site navigates with pushState, which never fires
  // hashchange, so this is the only signal that catches in-site navigation.
  window.addEventListener('dwd:route', function () {
    if (getPage() === currentPage) return;
    exitPage();
    enterPage();
  });

  // ── Tab hidden / close: exit current page ──
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') exitPage();
    if (document.visibilityState === 'visible') { pageEnteredAt = Date.now(); }
  });

  // ── Click tracking on [data-track] elements ──
  // Capture phase: record the page the click happened ON, before the SPA
  // router swaps the URL for the page the click leads to.
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]');
    if (el) {
      send('click', { page: currentPage || getPage(), element: el.dataset.track });
    }
  }, true);

})();
