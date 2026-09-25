/* ═══════════════════════════════════════════════
   DWD — schedule.js
   /schedule/ — the drop-in page: five weekly classes with their bookable
   dates as chips, the drop-in cart, and (behind one toggle) the full
   ProSeries week grid. Plan: docs/plans/2026-09-24-drop-in-finder.md.

   Reads public_site_schedule(p_from, p_to) via window.__dwd_sb.rpc, lets a
   visitor add open (drop-in) classes to a cart, and checks out through the
   drop-in-checkout edge function (Stripe Checkout redirect).

   The class list: two 21-day windows (the RPC's cap per call) fetched in
   parallel, grouped into weekly slots (class_id + weekday + start time). The
   markup ships a static list of the same five classes; this only replaces it
   when the feed answers with something truer (same contract as js/now.js).
   ?class=<slug> scrolls to one class, marks it and opens its later dates.

   The week grid is the old page, unchanged in behaviour, collapsed by
   default and loaded on first open (or straight away for #sched-list /
   ?week=). Nothing here runs until the schedule route is actually showing:
   every route shell carries this section, and Home has no use for the RPC.

   USE_STUB: the app's Phase 1 RPCs (public_site_schedule,
   drop_in_order_public) and the drop-in-checkout edge function are not live
   yet (master spec: C:/Users/bowle/Code/dwd/docs/plans/2026-09-12-drop-in-web-checkout.md).
   While true, the feed and the thank-you return are served from a local stub
   that mirrors the exact RPC row shape. Fable flips this to false once Phase
   1 is live on prod — nothing else in this file should need to change.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var page = document.getElementById('page-schedule');
  if (!page) return; // script gate — not the schedule route, do nothing

  var USE_STUB = false;

  var WAIVER_REVISION = 'v1.1';
  var CHECKOUT_URL = 'https://ipulrvhiuvgbvralybxx.supabase.co/functions/v1/drop-in-checkout';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdWxydmhpdXZnYnZyYWx5Ynh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2ODI0MzAsImV4cCI6MjA4NjI1ODQzMH0.O7MDYxkfqhQGNI58xyDq3HhsIm12OmgZRkJlyTXL0ug';
  var CART_KEY = 'dwd_dropin_cart';
  var MAX_LINES = 6;

  // Four or more dates in one order re-price to the class's bulk price. The
  // server is the authority (drop_in_order_create re-prices the lines); this
  // constant only mirrors it so the button and the summary never disagree with
  // Stripe. public_site_schedule carries drop_in_bulk_min, which overwrites it
  // when present so the threshold is not hardcoded in two places.
  var DROP_IN_BULK_MIN = 4;
  var EXCHANGE_ADDRESS = 'Exchange Dance Studio \u00b7 7409 Chancery Lane, Orlando, FL 32809';

  var DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  var DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // The class list shows this many dates per class; "More dates" opens the
  // rest of the window.
  var FINDER_VISIBLE = 4;
  // Two calls of 21 days each (the RPC caps one call at 21): six weeks out.
  var FINDER_WINDOW = 21;

  // ── Elements ──
  var elMain = page.querySelector('[data-sched-main]');
  var elFinderList = page.querySelector('[data-finder-list]');
  var elFull = page.querySelector('[data-sched-full]');
  var elFullToggle = page.querySelector('[data-sched-full-toggle]');
  var elFullBody = page.querySelector('[data-sched-full-body]');
  var elWeekNotice = page.querySelector('[data-sched-week-notice]');
  var elPending = page.querySelector('[data-sched-pending]');
  var elWeekLabel = page.querySelector('[data-sched-week-label]');
  var elWeekPrev = page.querySelector('[data-sched-week-prev]');
  var elWeekNext = page.querySelector('[data-sched-week-next]');
  var elWeekJump = page.querySelector('[data-sched-week-jump]');
  var elWeekJumpBtn = page.querySelector('[data-sched-week-jump-btn]');
  var elNotice = page.querySelector('[data-sched-notice]');
  var elList = page.querySelector('[data-sched-list]');
  var elCartBar = page.querySelector('[data-sched-cart-bar]');
  var elCartCount = page.querySelector('[data-sched-cart-count]');
  var elCartBulkNote = page.querySelector('[data-sched-cart-bulk-note]');
  var elCartCheckoutBtn = page.querySelector('[data-sched-checkout-btn]');
  var elCheckout = page.querySelector('[data-sched-checkout]');
  var elBack = page.querySelector('[data-sched-back]');
  var elSummaryList = page.querySelector('[data-sched-summary-list]');
  var elSummaryTotal = page.querySelector('[data-sched-summary-total]');
  var elBulkNote = page.querySelector('[data-sched-bulk-note]');
  var elForm = page.querySelector('[data-sched-form]');
  var elPayBtn = page.querySelector('[data-sched-pay-btn]');
  var elError = page.querySelector('[data-sched-error]');
  var elThankyou = page.querySelector('[data-sched-thankyou]');
  var elTyH1 = page.querySelector('[data-sched-ty-h1]');
  var elTyList = page.querySelector('[data-sched-ty-list]');
  var elTyTotal = page.querySelector('[data-sched-ty-total]');
  var elTyBulkNote = page.querySelector('[data-sched-ty-bulk-note]');
  var elTyAddress = page.querySelector('[data-sched-ty-address]');

  if (elTyAddress) elTyAddress.textContent = EXCHANGE_ADDRESS;

  var sb = window.__dwd_sb;

  // How far ahead the pager reaches. Six weeks is enough to hold the whole
  // October drop-in run in view from the middle of September; the RPC caps
  // one CALL at 21 days, not how far ahead a call may look.
  var MAX_WEEK_OFFSET = 6;

  var currentWeekOffset = 0;
  var currentRows = [];
  var droppedNotice = '';

  // The week grid loads on first open. gridReady: currentRows is a real
  // week's answer (not the empty array it starts as), so re-rendering it after
  // a chip tap cannot paint "No classes this week" over a list still loading.
  var gridLoaded = false;
  var gridReady = false;

  // The class list: rows by class_id|occurrence_date, for the chips.
  var finderRowsByKey = {};
  // The feed has answered (or failed) and the list on screen is final, so a
  // ?class= deep link can be aimed at it.
  var finderSettled = false;
  var deepLinkPending = true;

  // ── Date helpers (America/New_York, never the visitor's zone) ──
  var NY_FMT = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });

  function nyNowParts() {
    var parts = {};
    NY_FMT.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    return parts;
  }

  // "now" as a comparable string YYYY-MM-DD HH:MM in NY time.
  function nyNowStamp() {
    var p = nyNowParts();
    // hour12:false prints midnight as "24" in Chrome; "24:10" would sort after
    // every class that day and mark them all started (now.js has the same fix).
    var hour = p.hour === '24' ? '00' : p.hour;
    return p.year + '-' + p.month + '-' + p.day + ' ' + hour + ':' + p.minute;
  }

  function nyTodayIso() {
    var p = nyNowParts();
    return p.year + '-' + p.month + '-' + p.day;
  }

  function isPast(dateIso, startTime) {
    if (!dateIso || !startTime) return false;
    var stamp = String(dateIso).slice(0, 10) + ' ' + String(startTime).slice(0, 5);
    return stamp < nyNowStamp();
  }

  // Rows a visitor can still act on: not started yet, Monday to Thursday.
  function upcomingRows(rows) {
    return rows.filter(function (r) {
      if (isPast(r.date, r.start_time)) return false;
      var dow = new Date(String(r.date).slice(0, 10) + 'T00:00:00').getDay();
      return dow >= 1 && dow <= 4;
    });
  }

  // Of those, the ones a visitor can book right now.
  function bookableRows(rows) {
    return upcomingRows(rows).filter(function (r) { return r.drop_in_open && r.spots_left !== 0; });
  }

  // Monday of the week `offset` weeks from this week, off the studio's (NY)
  // calendar date. The visitor's own zone is never used: on a Sunday night in
  // California the local date is still Sunday while NY is already Monday, and
  // mixing the two sent the RPC a p_from later than its p_to (a 400).
  function mondayOf(offset) {
    var t = nyTodayIso().split('-');
    var today = new Date(Number(t[0]), Number(t[1]) - 1, Number(t[2]));
    var day = today.getDay(); // 0 Sun .. 6 Sat
    var diffToMonday = (day === 0) ? -6 : (1 - day);
    var monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday);
    monday.setDate(monday.getDate() + offset * 7);
    return monday;
  }

  function toIso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  function shortDateLabel(d) {
    return MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
  }

  // YYYY-MM-DD as a LOCAL date: new Date('2026-09-29') is UTC midnight, the
  // evening before in Eastern, and would print the wrong weekday.
  function localDate(iso) {
    var m = String(iso || '').slice(0, 10).split('-');
    return new Date(Number(m[0]), Number(m[1]) - 1, Number(m[2]));
  }

  // "Technique & Flexibility" -> "technique-flexibility". Derived from the
  // public name, never a table, so a renamed class gets its new link for free.
  // js/now.js carries the same function for the DROP IN panel's row links.
  function slugify(name) {
    return String(name || '').toLowerCase()
      .replace(/&/g, ' ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function minutesOf(t) {
    var m = String(t || '').match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  // "1 hr", "1 hr 30", "45 min".
  function lengthLabel(start, end) {
    var a = minutesOf(start), b = minutesOf(end);
    if (a == null || b == null || b <= a) return '';
    var mins = b - a, h = Math.floor(mins / 60), r = mins % 60;
    if (!h) return r + ' min';
    return h + ' hr' + (r ? ' ' + r : '');
  }

  function track(name) {
    try { if (typeof window.__dwd_track === 'function') window.__dwd_track(name); } catch (e) {}
  }

  // ── Cart (localStorage) ──
  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function writeCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }

  function cartHas(classId, occDate) {
    return readCart().some(function (l) { return l.class_id === classId && l.occurrence_date === occDate; });
  }

  function cartAdd(row) {
    var cart = readCart();
    if (cart.length >= MAX_LINES) return 'full';
    cart.push({
      class_id: row.class_id,
      occurrence_date: row.occurrence_date,
      date: row.date,
      name: row.name,
      label: [row.track_label, row.age_band, row.room].filter(Boolean).join(' \u00b7 '),
      start_time: row.start_time,
      fee_cents: row.drop_in_fee_cents,
      bulk_fee_cents: (typeof row.drop_in_bulk_fee_cents === 'number') ? row.drop_in_bulk_fee_cents : null
    });
    writeCart(cart);
    return 'ok';
  }

  function cartRemove(classId, occDate) {
    var cart = readCart().filter(function (l) { return !(l.class_id === classId && l.occurrence_date === occDate); });
    writeCart(cart);
    return cart;
  }

  // The cart hit the threshold, so every line that has a bulk price takes it.
  function bulkActive(cart) {
    return cart.length >= DROP_IN_BULK_MIN;
  }

  function anyBulk(cart) {
    return cart.some(function (l) { return typeof l.bulk_fee_cents === 'number'; });
  }

  function lineCents(line, active) {
    if (active && typeof line.bulk_fee_cents === 'number') return line.bulk_fee_cents;
    return line.fee_cents || 0;
  }

  function cartTotalCents(cart) {
    var active = bulkActive(cart);
    return cart.reduce(function (sum, l) { return sum + lineCents(l, active); }, 0);
  }

  // One muted line: the discount that applied, or how many dates away it is.
  function bulkNoteText(cart) {
    if (!cart.length || !anyBulk(cart)) return '';
    if (cart.length >= DROP_IN_BULK_MIN) return 'Four or more dates in one order. Each one costs less.';
    if (cart.length < 2) return '';
    var need = DROP_IN_BULK_MIN - cart.length;
    return 'Add ' + need + ' more and every date drops in price.';
  }

  function renderBulkNote(node, text) {
    if (!node) return;
    if (!text) { node.hidden = true; node.textContent = ''; return; }
    node.hidden = false;
    node.textContent = text;
  }

  // public_site_schedule names the threshold once; the site mirrors it.
  function applyBulkMin(rows) {
    for (var i = 0; i < rows.length; i++) {
      if (typeof rows[i].drop_in_bulk_min === 'number' && rows[i].drop_in_bulk_min > 0) {
        DROP_IN_BULK_MIN = rows[i].drop_in_bulk_min;
        return;
      }
    }
  }

  function money(cents) {
    var d = (cents || 0) / 100;
    return '$' + (d % 1 === 0 ? String(d) : d.toFixed(2));
  }

  // Prune cart lines no longer open/full against the freshest feed rows.
  // Returns { cart, droppedNames } so the caller can show the notice.
  function pruneCart(rows) {
    var cart = readCart();
    if (!cart.length) return { cart: cart, dropped: [] };
    var byKey = {};
    rows.forEach(function (r) { byKey[r.class_id + '|' + r.occurrence_date] = r; });
    var dropped = [];
    var kept = cart.filter(function (l) {
      // A date that has already started can never be bought, whichever week
      // is on screen. Without this it sat in the cart forever.
      if (isPast(l.date, l.start_time)) { dropped.push(l.name); return false; }
      var r = byKey[l.class_id + '|' + l.occurrence_date];
      // Only prune against rows we actually have data for this week; a line
      // for a different week is left alone here.
      if (!r) return true;
      var stillGood = r.drop_in_open && r.spots_left !== 0;
      if (!stillGood) dropped.push(l.name);
      return stillGood;
    });
    if (dropped.length !== cart.length - kept.length) { /* noop, defensive */ }
    if (kept.length !== cart.length) writeCart(kept);
    return { cart: kept, dropped: dropped };
  }

  // ── Stub feed ──────────────────────────────────────────────────────────
  function buildStubRows(fromIso, weekOffset) {
    var monday = new Date(fromIso + 'T00:00:00');
    var tue = addDays(monday, 1), wed = addDays(monday, 2), thu = addDays(monday, 3);

    // A moved class: its occurrence_date (the app roll's key) is Wednesday,
    // but it actually runs Thursday this week — date differs from
    // occurrence_date on purpose, per the feed row shape.
    var movedActualDay = thu;

    return [
      {
        class_id: 'stub-prep-ballet', occurrence_date: toIso(monday), date: toIso(monday),
        start_time: '17:00:00', end_time: '18:00:00', name: 'Technique & Flexibility',
        track_label: 'Prep', age_band: 'ages 5 to 9', room: 'Garage',
        drop_in_open: false, drop_in_fee_cents: null, spots_left: null,
        drop_in_opens_on: toIso(new Date(monday.getFullYear(), monday.getMonth() + 1, 1))
      },
      {
        class_id: 'stub-elite-ballet', occurrence_date: toIso(tue), date: toIso(tue),
        start_time: '16:45:00', end_time: '18:00:00', name: 'Ballet',
        track_label: 'Elite + Pro', age_band: 'ages 8 and up', room: 'Garage',
        drop_in_open: true, drop_in_fee_cents: 2500, drop_in_bulk_fee_cents: 2250,
        drop_in_bulk_min: 4, spots_left: 8
      },
      {
        class_id: 'stub-elite-rotation', occurrence_date: toIso(tue), date: toIso(tue),
        start_time: '19:00:00', end_time: '20:30:00', name: 'Rotation',
        track_label: 'Elite', age_band: 'ages 8 to 12', room: 'Studio A',
        drop_in_open: true, drop_in_fee_cents: 2500, drop_in_bulk_fee_cents: 2250,
        drop_in_bulk_min: 4, spots_left: 0
      },
      {
        class_id: 'stub-jazz-tech', occurrence_date: toIso(wed), date: toIso(wed),
        start_time: '16:00:00', end_time: '17:30:00', name: 'Jazz Technique',
        track_label: 'Elite + Pro', age_band: 'ages 8 and up', room: 'Studio A',
        drop_in_open: true, drop_in_fee_cents: 2000, drop_in_bulk_fee_cents: 1750,
        drop_in_bulk_min: 4, spots_left: 2
      },
      {
        class_id: 'stub-comp-choreo', occurrence_date: toIso(wed), date: toIso(movedActualDay),
        start_time: '18:30:00', end_time: '19:30:00', name: 'Competition Choreography',
        track_label: 'Pro Only', age_band: 'ages 10 and up', room: 'Studio A',
        drop_in_open: false, drop_in_fee_cents: null, spots_left: null,
        drop_in_opens_on: toIso(new Date(monday.getFullYear(), monday.getMonth() + 1, 1))
      },
      {
        class_id: 'stub-company-choreo', occurrence_date: toIso(thu), date: toIso(thu),
        start_time: '17:00:00', end_time: '18:00:00', name: 'Company Choreography',
        track_label: 'All Tracks', age_band: null, room: 'Garage',
        drop_in_open: true, drop_in_fee_cents: 1500, spots_left: 6
      }
    ];
    // Not returned: the holiday/empty week and no-open-rows week are
    // exercised via ?stub_week=empty / ?stub_week=noopen, see fetchWeek().
  }

  function fetchWeek(fromIso, toIso_) {
    if (USE_STUB) {
      var forced = new URLSearchParams(location.search).get('stub_week');
      return new Promise(function (resolve) {
        setTimeout(function () {
          if (forced === 'empty') return resolve([]);
          var rows = buildStubRows(fromIso, currentWeekOffset);
          if (forced === 'noopen') {
            rows = rows.map(function (r) { return Object.assign({}, r, { drop_in_open: false, drop_in_fee_cents: null, spots_left: null }); });
          }
          resolve(rows);
        }, 150);
      });
    }
    if (!sb) return Promise.reject(new Error('no supabase client'));
    return sb.rpc('public_site_schedule', { p_from: fromIso, p_to: toIso_ }).then(function (res) {
      if (res.error) throw res.error;
      return res.data || [];
    });
  }

  // ── Render ──
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function fmtTime(t) {
    if (!t) return '';
    var m = String(t).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return '';
    var h = Number(m[1]) % 12;
    if (h === 0) h = 12;
    return h + ':' + m[2];
  }

  function timeRange(start, end) {
    return fmtTime(start) + (end ? ' \u2013 ' + fmtTime(end) : '');
  }

  // Cart news (a line left the cart, nothing was charged): top of the page,
  // above whichever view is showing.
  function renderNotice(text) {
    if (!text) { elNotice.hidden = true; elNotice.textContent = ''; return; }
    elNotice.hidden = false;
    elNotice.textContent = text;
  }

  // Week-grid news (this week is done, six at a time): inside the full week,
  // where the visitor is looking when it happens.
  function renderWeekNotice(text) {
    if (!elWeekNotice) { renderNotice(text); return; }
    if (!text) { elWeekNotice.hidden = true; elWeekNotice.textContent = ''; return; }
    elWeekNotice.hidden = false;
    elWeekNotice.textContent = text;
  }

  function weekLabelFor(offset) {
    if (offset === 0) return 'This week';
    if (offset === 1) return 'Next week';
    return 'Week of ' + shortDateLabel(mondayOf(offset));
  }

  // The offset of the first week inside the pager's reach whose Monday falls on
  // or after October 1 — the week the drop-in classes are actually bookable in.
  // The year comes from NY today, never a literal, so this keeps working in
  // 2027. Returns -1 when October is out of reach (or already here).
  function octoberJumpOffset() {
    var year = Number(nyTodayIso().slice(0, 4));
    var oct1 = new Date(year, 9, 1);
    for (var o = 0; o <= MAX_WEEK_OFFSET; o++) {
      if (mondayOf(o).getTime() >= oct1.getTime()) return o;
    }
    return -1;
  }

  // Only worth saying while October is still ahead of the visitor AND they are
  // looking at a week before it.
  function updateJumpLine() {
    if (!elWeekJump || !elWeekJumpBtn) return;
    var todayIso = nyTodayIso();
    var oct1Iso = todayIso.slice(0, 4) + '-10-01';
    var jump = octoberJumpOffset();
    if (todayIso >= oct1Iso || jump < 0 || currentWeekOffset >= jump) {
      elWeekJump.hidden = true;
      return;
    }
    elWeekJump.hidden = false;
    elWeekJumpBtn.textContent = 'Booking for October? Jump to the week of ' +
      shortDateLabel(mondayOf(jump)) + ' \u2192';
  }

  function updateWeekLabels() {
    if (elWeekLabel) elWeekLabel.textContent = weekLabelFor(currentWeekOffset);
    if (elWeekPrev) elWeekPrev.hidden = currentWeekOffset <= 0;
    if (elWeekNext) elWeekNext.hidden = currentWeekOffset >= MAX_WEEK_OFFSET;
    updateJumpLine();
  }

  function renderCartBar() {
    var cart = readCart();
    if (!cart.length) { elCartBar.hidden = true; return; }
    elCartBar.hidden = false;
    var totalCents = cartTotalCents(cart);
    elCartCount.innerHTML = cart.length + (cart.length === 1 ? ' class' : ' classes') +
      ' \u00b7 <span class="sched-cart-amt">' + money(totalCents) + '</span>';
    renderBulkNote(elCartBulkNote, bulkNoteText(cart));
  }

  function renderLoading() {
    elList.innerHTML = '';
    var wrap = el('div', 'sched-skel');
    for (var i = 0; i < 3; i++) wrap.appendChild(el('div', 'sched-skel-row'));
    elList.appendChild(wrap);
  }

  function renderError() {
    elList.innerHTML = '';
    var p = el('p', 'sched-empty-line');
    p.innerHTML = 'The schedule is taking a minute. Refresh, or <a href="/contact/?reason=proseries">reach Dixon &rarr;</a>';
    elList.appendChild(p);
  }

  function renderNoSupabase() {
    renderError();
  }

  function renderRows(rows) {
    elList.innerHTML = '';

    if (!rows.length) {
      var p0 = el('p', 'sched-empty-line', 'No classes this week.');
      elList.appendChild(p0);
      return;
    }

    var visible = upcomingRows(rows);

    if (!visible.length) {
      elList.appendChild(el('p', 'sched-empty-line', 'No classes this week.'));
      return;
    }

    // Group by displayed date, Monday-Thursday only.
    var byDate = {};
    var order = [];
    visible.forEach(function (r) {
      var d = new Date(String(r.date).slice(0, 10) + 'T00:00:00');
      var dow = d.getDay();
      if (dow < 1 || dow > 4) return; // Mon-Thu only
      var key = r.date;
      if (!byDate[key]) { byDate[key] = []; order.push(key); }
      byDate[key].push(r);
    });
    order.sort();

    var anyOpen = false;
    var cart = readCart();

    order.forEach(function (dateKey) {
      var d = new Date(dateKey + 'T00:00:00');
      var head = el('h2', 'sched-day-head', DAY_NAMES[d.getDay()] + ' \u00b7 ' + MONTHS_SHORT[d.getMonth()].toUpperCase() + ' ' + d.getDate());
      elList.appendChild(head);

      var list = el('div', 'sched-day-list');
      byDate[dateKey].sort(function (a, b) { return String(a.start_time).localeCompare(String(b.start_time)); });

      byDate[dateKey].forEach(function (row) {
        var open = !!row.drop_in_open;
        if (open) anyOpen = true;
        var full = row.spots_left === 0;
        var added = cartHas(row.class_id, row.occurrence_date);

        var rowEl = el('div', 'sched-row' + (open ? '' : ' sched-row--closed'));

        rowEl.appendChild(el('div', 'sched-row-time', timeRange(row.start_time, row.end_time)));

        var metaWrap = el('div', 'sched-row-main');
        metaWrap.appendChild(el('div', 'sched-row-name', row.name));
        var metaBits = [row.track_label, row.age_band, row.room].filter(Boolean).join(' \u00b7 ');
        if (metaBits) metaWrap.appendChild(el('div', 'sched-row-meta', metaBits));
        rowEl.appendChild(metaWrap);

        var priceWrap = el('div', 'sched-row-price');
        if (open) {
          priceWrap.appendChild(el('div', 'sched-row-price-amt', money(row.drop_in_fee_cents)));
          if (typeof row.drop_in_bulk_fee_cents === 'number') {
            priceWrap.appendChild(el('div', 'sched-row-bulk', money(row.drop_in_bulk_fee_cents) + ' each for ' + DROP_IN_BULK_MIN + '+'));
          }
          if (typeof row.spots_left === 'number' && row.spots_left >= 1 && row.spots_left <= 3) {
            priceWrap.appendChild(el('div', 'sched-row-spots', row.spots_left + ' spot' + (row.spots_left === 1 ? '' : 's') + ' left'));
          }
        }
        else if (row.drop_in_opens_on) {
          /* Closed today only because it opens later. One muted line, same
             weight as the row's other facts, and no button beside it. */
          // Only when it opens in time for THIS date: a Sep 29 class that
          // "opens Oct 1" never opens, so the line would be a false promise.
          var opensIso = String(row.drop_in_opens_on).slice(0, 10);
          var opensOn = new Date(opensIso + 'T00:00:00');
          if (!isNaN(opensOn.getTime()) && opensIso <= String(row.date).slice(0, 10)) {
            priceWrap.appendChild(el('div', 'sched-row-bulk', 'Opens ' + shortDateLabel(opensOn)));
          }
        }
        rowEl.appendChild(priceWrap);

        var actionWrap = el('div', 'sched-row-action');
        if (open) {
          if (full) {
            actionWrap.appendChild(el('span', 'sched-row-full', 'Full'));
          } else {
            var btn = el('button', 'btn-ghost-arm tap-44 sched-add-btn' + (added ? ' is-added' : ''));
            btn.type = 'button';
            btn.setAttribute('data-track', 'dropin_add');
            btn.innerHTML = added ? '<span class="sched-check" aria-hidden="true"></span>Added' : 'Add';
            btn.addEventListener('click', function () {
              if (added) {
                cartRemove(row.class_id, row.occurrence_date);
                syncCart();
                return;
              }
              var cartNow = readCart();
              if (cartNow.length >= MAX_LINES) {
                renderWeekNotice('Six classes at a time. Check out, then add more.');
                return;
              }
              cartAdd(row);
              renderNotice('');
              renderWeekNotice('');
              syncCart();
            });
            actionWrap.appendChild(btn);
          }
        }
        rowEl.appendChild(actionWrap);

        list.appendChild(rowEl);
      });

      elList.appendChild(list);
    });

    if (!anyOpen) {
      var p = el('p', 'sched-empty-line');
      p.innerHTML = 'No drop-in spots this week. <a href="/contact/?reason=proseries">Ask Dixon &rarr;</a>';
      elList.appendChild(p);
    }
  }

  // `auto` is the first load only. From Thursday night to Sunday this week has
  // nothing left on it, and "No classes this week" was the whole list for the
  // ~60% of the Sept 16-21 Instagram ad visitors who landed Friday to Sunday.
  // So the first load walks forward to the first week with a drop-in that can
  // still be booked (people arrive here from "Drop in" buttons and ads).
  // Paging by hand never skips: a visitor who asks for a week gets it.
  var loadSeq = 0;
  function loadWeek(offset, auto) {
    var seq = ++loadSeq;
    currentWeekOffset = offset;
    gridReady = false;
    updateWeekLabels();
    renderLoading();

    if (!USE_STUB && !sb) {
      renderNoSupabase();
      return;
    }

    var monday = mondayOf(offset);
    var sunday = addDays(monday, 6);
    var fromIso = toIso(monday);
    var toIso_ = toIso(sunday);

    // The RPC refuses a p_from earlier than yesterday (NY time). Days before
    // today are never rendered anyway (isPast() drops them), so clamping the
    // request to today when the week's Monday has already passed loses
    // nothing and keeps "This week" working every day, not just Mondays.
    var rpcFromIso = fromIso;
    if (!USE_STUB) {
      var todayIso = nyTodayIso();
      if (todayIso > rpcFromIso) rpcFromIso = todayIso;
    }

    fetchWeek(rpcFromIso, toIso_).then(function (rows) {
      // A slower answer for a week the visitor already paged past must not
      // paint its rows under the newer week's label.
      if (seq !== loadSeq) return;
      if (auto && offset < MAX_WEEK_OFFSET && !bookableRows(rows).length) {
        loadWeek(offset + 1, true);
        return;
      }
      if (auto && offset > 0) {
        renderWeekNotice(offset === 1
          ? 'Nothing left to book this week. Here’s next week.'
          : 'Nothing open to book until the week of ' + shortDateLabel(mondayOf(offset)) + '.');
      }
      currentRows = rows;
      gridReady = true;
      applyBulkMin(rows);
      var pruned = pruneCart(rows);
      renderCartBar();
      paintChips();
      if (pruned.dropped.length) {
        renderNotice(pruned.dropped[0] + ' closed since you added it, so it left your cart.');
      }
      renderRows(rows);
    }).catch(function (err) {
      if (seq !== loadSeq) return;
      console.warn('schedule feed:', err && err.message);
      renderError();
    });
  }

  function stepWeek(delta) {
    var next = currentWeekOffset + delta;
    if (next < 0) next = 0;
    if (next > MAX_WEEK_OFFSET) next = MAX_WEEK_OFFSET;
    if (next === currentWeekOffset) return;
    renderWeekNotice('');
    loadWeek(next);
  }

  if (elWeekPrev) elWeekPrev.addEventListener('click', function () { stepWeek(-1); });
  if (elWeekNext) elWeekNext.addEventListener('click', function () { stepWeek(1); });
  if (elWeekJumpBtn) elWeekJumpBtn.addEventListener('click', function () {
    var jump = octoberJumpOffset();
    if (jump >= 0) { renderWeekNotice(''); loadWeek(jump); }
  });

  // ── The class list (the page's focal point) ──
  // One slot per weekly class: same class_id, same weekday (of `date`, the
  // day it actually runs), same start time. Only slots with at least one open
  // date make the list; their chips are the open dates, full ones included.
  function buildSlots(rows) {
    var byKey = {}, keys = [];
    rows.forEach(function (r) {
      if (!r || !r.class_id || !r.date || !r.start_time) return;
      if (!r.drop_in_open) return;
      if (isPast(r.date, r.start_time)) return;
      var dow = localDate(r.date).getDay();
      var k = r.class_id + '|' + dow + '|' + String(r.start_time).slice(0, 5);
      if (!byKey[k]) { byKey[k] = { dow: dow, open: [] }; keys.push(k); }
      byKey[k].open.push(r);
    });

    var slots = keys.map(function (k) {
      var s = byKey[k];
      s.open.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
      // The public name is the one the open dates carry. A per-date swap
      // title (a closed "Adv Ballet" week) never reaches here; if the open
      // dates themselves disagree, the name most of them carry wins.
      var counts = {}, name = s.open[0].name;
      s.open.forEach(function (r) {
        counts[r.name] = (counts[r.name] || 0) + 1;
        if (counts[r.name] > counts[name]) name = r.name;
      });
      s.name = name || 'Drop-in class';
      s.slug = slugify(s.name);
      s.ref = s.open.filter(function (r) { return r.name === name; })[0] || s.open[0];
      return s;
    });

    // Monday first, then by time; two classes at 4:45 go shorter first.
    function weekPos(d) { return d === 0 ? 7 : d; }
    slots.sort(function (a, b) {
      return (weekPos(a.dow) - weekPos(b.dow)) ||
        String(a.ref.start_time).localeCompare(String(b.ref.start_time)) ||
        String(a.ref.end_time || '').localeCompare(String(b.ref.end_time || '')) ||
        a.name.localeCompare(b.name);
    });
    return slots;
  }

  function chipKey(r) { return r.class_id + '|' + r.occurrence_date; }

  function renderFinder(slots) {
    if (!elFinderList || !slots.length) return false; // static list stands
    var soonIso = toIso(addDays(localDate(nyTodayIso()), 6));
    finderRowsByKey = {};
    var frag = document.createDocumentFragment();

    slots.forEach(function (s) {
      var ref = s.ref;
      var li = el('li', 'finder-class');
      li.setAttribute('data-class-slug', s.slug);

      var top = el('p', 'finder-top');
      var when = el('span', 'finder-when', DAY_SHORT[s.dow] + ' ' + fmtTime(ref.start_time));
      top.appendChild(when);
      // Not bookable this week: say when it starts, so "Tue 4:45" in late
      // September is not read as tonight. Same rule as the panel in now.js.
      var firstIso = String(s.open[0].date).slice(0, 10);
      if (firstIso > soonIso) {
        top.appendChild(el('span', 'finder-starts', 'Starts ' + shortDateLabel(localDate(firstIso))));
      }
      top.appendChild(el('span', 'finder-price', money(ref.drop_in_fee_cents)));
      li.appendChild(top);

      li.appendChild(el('h2', 'finder-name', s.name));
      var meta = [ref.track_label, ref.age_band, lengthLabel(ref.start_time, ref.end_time)]
        .filter(Boolean).join(' · ');
      if (meta) li.appendChild(el('p', 'finder-meta', meta));

      var dates = el('ul', 'finder-dates');
      dates.setAttribute('aria-label', 'Dates for ' + s.name);
      s.open.forEach(function (row, i) {
        finderRowsByKey[chipKey(row)] = row;
        var cell = el('li', 'finder-date');
        if (i >= FINDER_VISIBLE) { cell.className += ' is-extra'; cell.hidden = true; }
        var chip = el('button', 'finder-chip');
        chip.type = 'button';
        chip.setAttribute('data-key', chipKey(row));
        chip.setAttribute('data-track', 'dropin-chip:' + s.slug);
        cell.appendChild(chip);
        cell.appendChild(el('span', 'finder-chip-note'));
        dates.appendChild(cell);
      });
      if (s.open.length > FINDER_VISIBLE) {
        var moreCell = el('li', 'finder-date finder-date--more');
        var more = el('button', 'finder-more', 'More dates');
        more.type = 'button';
        more.setAttribute('aria-expanded', 'false');
        moreCell.appendChild(more);
        dates.appendChild(moreCell);
      }
      li.appendChild(dates);

      var note = el('p', 'finder-note');
      note.hidden = true;
      note.setAttribute('role', 'status');
      li.appendChild(note);

      frag.appendChild(li);
    });

    elFinderList.innerHTML = '';
    elFinderList.appendChild(frag);
    paintChips();
    return true;
  }

  // Chip state from the cart and the row: available, added, full, n left.
  function paintChips() {
    if (!elFinderList) return;
    var chips = elFinderList.querySelectorAll('.finder-chip');
    Array.prototype.forEach.call(chips, function (chip) {
      var row = finderRowsByKey[chip.getAttribute('data-key')];
      if (!row) return;
      var d = localDate(row.date);
      var full = row.spots_left === 0;
      var added = !full && cartHas(row.class_id, row.occurrence_date);
      var few = typeof row.spots_left === 'number' && row.spots_left >= 1 && row.spots_left <= 3;

      chip.className = 'finder-chip' + (added ? ' is-added' : '') + (full ? ' is-full' : '');
      chip.disabled = full;
      if (full) chip.removeAttribute('aria-pressed');
      else chip.setAttribute('aria-pressed', added ? 'true' : 'false');
      chip.innerHTML = '';
      if (added) {
        var tick = el('span', 'sched-check');
        tick.setAttribute('aria-hidden', 'true');
        chip.appendChild(tick);
      }
      chip.appendChild(document.createTextNode(shortDateLabel(d)));

      var noteText = full ? 'Full' : (few ? row.spots_left + ' left' : '');
      chip.setAttribute('aria-label', DAY_NAMES_LONG[d.getDay()] + ' ' + shortDateLabel(d) +
        (noteText ? ', ' + (full ? 'full' : row.spots_left + ' spot' + (row.spots_left === 1 ? '' : 's') + ' left') : ''));
      var note = chip.nextElementSibling;
      if (note) note.textContent = noteText;
    });
  }

  function setBlockNote(block, text) {
    var note = block && block.querySelector('.finder-note');
    if (!note) return;
    note.textContent = text || '';
    note.hidden = !text;
  }

  // Reveal the rest of a class's dates. `focus` moves keyboard focus to the
  // first date it revealed, since the button that had it is gone.
  function expandDates(block, focus) {
    var extra = block.querySelectorAll('.finder-date.is-extra');
    Array.prototype.forEach.call(extra, function (c) { c.hidden = false; });
    var moreCell = block.querySelector('.finder-date--more');
    if (moreCell) moreCell.parentNode.removeChild(moreCell);
    if (focus && extra.length) {
      var first = extra[0].querySelector('.finder-chip');
      if (first) first.focus();
    }
  }

  if (elFinderList) elFinderList.addEventListener('click', function (e) {
    var more = e.target.closest && e.target.closest('.finder-more');
    if (more) {
      expandDates(more.closest('.finder-class'), true);
      return;
    }
    var chip = e.target.closest && e.target.closest('.finder-chip');
    if (!chip || chip.disabled) return;
    var row = finderRowsByKey[chip.getAttribute('data-key')];
    if (!row || row.spots_left === 0) return;
    var block = chip.closest('.finder-class');
    if (cartHas(row.class_id, row.occurrence_date)) {
      cartRemove(row.class_id, row.occurrence_date);
      setBlockNote(block, '');
    } else {
      if (readCart().length >= MAX_LINES) {
        setBlockNote(block, 'Six classes at a time. Check out, then add more.');
        return;
      }
      cartAdd(row);
      setBlockNote(block, '');
      renderNotice('');
    }
    syncCart();
  });

  // One cart, three surfaces: the bar, the chips, and the week grid if open.
  function syncCart() {
    renderCartBar();
    paintChips();
    if (gridReady) renderRows(currentRows);
  }

  var finderSeq = 0;
  function loadFinder() {
    var seq = ++finderSeq;
    if (!USE_STUB && !sb) { settleFinder(false); return; }
    if (elFinderList) elFinderList.classList.add('is-loading');

    var today = localDate(nyTodayIso());
    var a0 = toIso(today), a1 = toIso(addDays(today, FINDER_WINDOW - 1));
    var b0 = toIso(addDays(today, FINDER_WINDOW)), b1 = toIso(addDays(today, FINDER_WINDOW * 2 - 1));

    Promise.all([fetchWeek(a0, a1), fetchWeek(b0, b1)]).then(function (res) {
      if (seq !== finderSeq) return;
      var rows = (res[0] || []).concat(res[1] || []);
      applyBulkMin(rows);
      var pruned = pruneCart(rows);
      renderCartBar();
      if (pruned.dropped.length) {
        renderNotice(pruned.dropped[0] + ' closed since you added it, so it left your cart.');
      }
      renderFinder(buildSlots(rows));
      settleFinder(true);
    }).catch(function (err) {
      if (seq !== finderSeq) return;
      console.warn('drop-in classes:', err && err.message);
      settleFinder(false);
    });
  }

  function settleFinder() {
    finderSettled = true;
    if (elFinderList) elFinderList.classList.remove('is-loading');
    applyDeepLink();
  }

  // ── ?class=<slug> ──
  function applyDeepLink() {
    if (!deepLinkPending || !finderSettled || !elFinderList) return;
    deepLinkPending = false;
    var blocks = elFinderList.querySelectorAll('.finder-class');
    Array.prototype.forEach.call(blocks, function (b) { b.classList.remove('is-linked'); });
    var slug = (new URLSearchParams(location.search).get('class') || '').trim().toLowerCase();
    if (!slug) return;
    var target = null;
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].getAttribute('data-class-slug') === slug) { target = blocks[i]; break; }
    }
    if (!target) return; // unknown slug: the normal page
    target.classList.add('is-linked');
    expandDates(target, false);
    scrollToBlock(target);
  }

  // Aim a few times: web fonts landing can still move the block after the
  // first jump. The visitor's own scroll cancels the rest.
  function scrollToBlock(block) {
    var cancelled = false;
    function cancel() { cancelled = true; }
    var evts = ['wheel', 'touchstart', 'keydown'];
    evts.forEach(function (ev) { window.addEventListener(ev, cancel, { passive: true }); });
    function aim() {
      if (cancelled) return;
      var nav = document.getElementById('topnav');
      var off = 16;
      if (nav) {
        var pos = window.getComputedStyle(nav).position;
        if (pos === 'fixed' || pos === 'sticky') off += nav.offsetHeight;
      }
      var y = Math.max(0, block.getBoundingClientRect().top + window.pageYOffset - off);
      try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); }
    }
    [0, 150, 400, 900].forEach(function (ms, i, all) {
      setTimeout(function () {
        aim();
        if (i === all.length - 1) evts.forEach(function (ev) { window.removeEventListener(ev, cancel); });
      }, ms);
    });
  }

  // ── The full ProSeries week (collapsed by default) ──
  // ?week=N (weeks from this one) or ?week=YYYY-MM-DD (the week holding that
  // date) opens it on that week; anything else opens it the normal way.
  function weekParamOffset() {
    var w = new URLSearchParams(location.search).get('week');
    if (!w) return null;
    if (/^\d{1,2}$/.test(w)) return Math.min(Number(w), MAX_WEEK_OFFSET);
    if (/^\d{4}-\d{2}-\d{2}$/.test(w)) {
      var t = localDate(w).getTime();
      for (var o = 0; o <= MAX_WEEK_OFFSET; o++) {
        if (t >= mondayOf(o).getTime() && t < mondayOf(o + 1).getTime()) return o;
      }
    }
    return null;
  }

  function wantsFullWeek() {
    return location.hash === '#sched-list' || new URLSearchParams(location.search).has('week');
  }

  function openFullWeek() {
    if (!elFullBody) return;
    elFullBody.hidden = false;
    if (elFull) elFull.classList.add('is-open');
    if (elFullToggle) elFullToggle.setAttribute('aria-expanded', 'true');
    if (!gridLoaded) {
      gridLoaded = true;
      var w = weekParamOffset();
      if (w == null) loadWeek(0, true); else loadWeek(w);
    }
  }

  function closeFullWeek() {
    if (!elFullBody) return;
    elFullBody.hidden = true;
    if (elFull) elFull.classList.remove('is-open');
    if (elFullToggle) elFullToggle.setAttribute('aria-expanded', 'false');
  }

  if (elFullToggle) elFullToggle.addEventListener('click', function () {
    if (elFullBody.hidden) openFullWeek(); else closeFullWeek();
  });

  // The static list's Book links (and any #sched-list link) land on the grid:
  // open it in the same tick main.js starts scrolling to it.
  window.addEventListener('hashchange', function () {
    if (location.hash === '#sched-list' && page.classList.contains('active')) openFullWeek();
  });

  // ── Checkout view ──
  function openCheckout() {
    var cart = readCart();
    if (!cart.length) return;
    elCheckout.hidden = false;
    elCartBar.hidden = true;
    elMain.hidden = true;
    elThankyou.hidden = true;
    elError.hidden = true;
    renderSummary();
    // The cart bar sits at the bottom of a long list; without this a phone
    // lands on the footer with the form above the screen.
    jumpToTop(elCheckout.querySelector('h2'));
  }

  function jumpToTop(focusEl) {
    var top = page.getBoundingClientRect().top + window.pageYOffset - 80;
    try { window.scrollTo({ top: Math.max(0, top), behavior: 'instant' }); } catch (e) { window.scrollTo(0, Math.max(0, top)); }
    if (focusEl) {
      focusEl.setAttribute('tabindex', '-1');
      try { focusEl.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function closeCheckout() {
    elCheckout.hidden = true;
    elMain.hidden = false;
    renderCartBar();
    paintChips();
    if (gridLoaded) loadWeek(currentWeekOffset);
    jumpToTop(null);
  }

  function renderSummary() {
    var cart = readCart();
    var active = bulkActive(cart);
    elSummaryList.innerHTML = '';
    cart.forEach(function (line) {
      var d = new Date(String(line.date).slice(0, 10) + 'T00:00:00');
      var li = el('li', 'sched-summary-line');
      var left = el('span', '', DAY_NAMES_LONG[d.getDay()] + ' \u00b7 ' + shortDateLabel(d) + ' \u00b7 ' + timeRange(line.start_time, null).split(' ')[0] + ' \u00b7 ' + line.name);
      li.appendChild(left);
      var right = el('span', 'sched-summary-line-right');
      right.appendChild(el('span', '', money(lineCents(line, active))));
      var rm = el('a', 'sched-remove-link tap-44', 'Remove');
      rm.href = '#';
      rm.addEventListener('click', function (e) {
        e.preventDefault();
        cartRemove(line.class_id, line.occurrence_date);
        if (!readCart().length) { closeCheckout(); return; }
        renderSummary();
      });
      right.appendChild(rm);
      li.appendChild(right);
      elSummaryList.appendChild(li);
    });
    var total = cartTotalCents(cart);
    renderBulkNote(elBulkNote, bulkNoteText(cart));
    elSummaryTotal.textContent = money(total);
    elPayBtn.textContent = 'Pay ' + money(total);
  }

  elCartCheckoutBtn.addEventListener('click', openCheckout);
  elBack.addEventListener('click', function (e) { e.preventDefault(); closeCheckout(); });

  // ── Submit ──
  elForm.addEventListener('submit', function (e) {
    e.preventDefault();
    elError.hidden = true;
    var cart = readCart();
    if (!cart.length) return;

    // Check every field here, in order, and send the parent to the first gap.
    // The form is novalidate so the browser's own bubbles don't fight ours.
    var checks = [
      ['sched-dancer-name', "Add the dancer's name."],
      ['sched-dancer-dob', "Add the dancer's date of birth."],
      ['sched-payer-name', 'Add your name.'],
      ['sched-payer-email', 'Add an email so the receipt reaches you.'],
      ['sched-payer-phone', 'Add a phone number in case class moves.']
    ];
    var firstBad = null, firstMsg = '';
    checks.forEach(function (c) {
      var input = document.getElementById(c[0]);
      if (!input) return;
      var v = input.value.trim();
      var bad = !v || (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      if (bad) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      if (bad && !firstBad) { firstBad = input; firstMsg = c[1]; }
    });
    var waiverEl = document.getElementById('sched-waiver');
    if (!firstBad && !waiverEl.checked) { firstBad = waiverEl; firstMsg = 'Check the waiver box to continue.'; }
    if (firstBad) {
      elError.hidden = false;
      elError.textContent = firstMsg;
      firstBad.focus();
      track('dropin-checkout:invalid');
      return;
    }

    var body = {
      lines: cart.map(function (l) { return { class_id: l.class_id, occurrence_date: l.occurrence_date }; }),
      dancer: {
        full_name: document.getElementById('sched-dancer-name').value.trim(),
        date_of_birth: document.getElementById('sched-dancer-dob').value
      },
      payer: {
        full_name: document.getElementById('sched-payer-name').value.trim(),
        email: document.getElementById('sched-payer-email').value.trim(),
        phone: document.getElementById('sched-payer-phone').value.trim()
      },
      waiver_accepted: true,
      waiver_revision: WAIVER_REVISION
    };

    elPayBtn.disabled = true;
    var prevLabel = elPayBtn.textContent;
    elPayBtn.textContent = 'One second\u2026';

    fetch(CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      },
      body: JSON.stringify(body)
    }).then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
      .then(function (r) {
        if (r.ok && r.json && r.json.url) {
          track('dropin-checkout:ok');
          window.top.location.href = r.json.url;
          return;
        }
        track('dropin-checkout:err');
        elPayBtn.disabled = false;
        elPayBtn.textContent = prevLabel;
        elError.hidden = false;
        elError.textContent = (r.json && r.json.error) || 'Something went wrong. Try again.';
        // Past lines are pruned before checkout opens; if the server still
        // names one, drop it only when it can actually be matched.
        var bad = r.json && r.json.line;
        if (bad && typeof bad === 'object' && bad.class_id) {
          var before = readCart().length;
          if (cartRemove(bad.class_id, bad.occurrence_date).length < before) {
            renderNotice('That class closed since you added it, so it left your cart.');
            if (!readCart().length) closeCheckout(); else renderSummary();
          }
        }
      })
      .catch(function () {
        track('dropin-checkout:err');
        elPayBtn.disabled = false;
        elPayBtn.textContent = prevLabel;
        elError.hidden = false;
        elError.textContent = "That didn't go through. Nothing was charged. Try again.";
      });
  });

  // ── Return from Stripe ──
  function renderThankyou(orderRows, dancerFirstName) {
    elMain.hidden = true;
    if (elPending) elPending.hidden = true;
    elCheckout.hidden = true;
    elCartBar.hidden = true;
    elThankyou.hidden = false;

    var days = {};
    orderRows.forEach(function (r) { days[String(r.date).slice(0, 10)] = true; });
    var dayKeys = Object.keys(days);
    if (dayKeys.length === 1) {
      var d = new Date(dayKeys[0] + 'T00:00:00');
      elTyH1.textContent = 'See you ' + DAY_NAMES_LONG[d.getDay()] + (dancerFirstName ? ', ' + dancerFirstName : '') + '.';
    } else {
      elTyH1.textContent = 'See you soon.';
    }

    elTyList.innerHTML = '';
    orderRows.forEach(function (r) {
      var d = new Date(String(r.date).slice(0, 10) + 'T00:00:00');
      var li = el('li', 'sched-summary-line');
      li.appendChild(el('span', '', DAY_NAMES_LONG[d.getDay()] + ' \u00b7 ' + shortDateLabel(d) + ' \u00b7 ' + timeRange(r.start_time, null).split(' ')[0] + ' \u00b7 ' + r.name + (r.room ? ' \u00b7 ' + r.room : '')));
      li.appendChild(el('span', '', money(r.fee_cents != null ? r.fee_cents : r.drop_in_fee_cents)));
      elTyList.appendChild(li);
    });
    var total = orderRows.reduce(function (s, r) { return s + (r.fee_cents != null ? r.fee_cents : (r.drop_in_fee_cents || 0)); }, 0);
    renderBulkNote(elTyBulkNote, (orderRows[0] && orderRows[0].bulk_applied) ? 'Four or more dates in one order. Each one costs less.' : '');
    elTyTotal.textContent = money(total);

    writeCart([]);
  }

  function pollPending(id, token, attempt) {
    if (attempt > 20) {
      renderThankyou([], null);
      elTyH1.textContent = 'Paid.';
      var fallback = el('p', '', "If your spot doesn't show in the Director's roll by tomorrow, email dancewithdixon@gmail.com.");
      elThankyou.appendChild(fallback);
      return;
    }
    setTimeout(function () {
      fetchOrder(id, token).then(function (rows) {
        var status = rows[0] && rows[0].status;
        if (status === 'paid') { renderThankyou(rows, rows[0].dancer_first_name || null); return; }
        pollPending(id, token, attempt + 1);
      }).catch(function () { pollPending(id, token, attempt + 1); });
    }, 3000);
  }

  function fetchOrder(id, token) {
    if (USE_STUB) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          if (id !== 'stub') { resolve([]); return; }
          var cart = readCart();
          var rows = (cart.length ? cart : buildStubRows(toIso(mondayOf(0)), 0).filter(function (r) { return r.drop_in_open; }).slice(0, 2))
            .map(function (l) {
              var active = bulkActive(cart);
              return Object.assign({
                status: 'paid', dancer_first_name: 'Remi', room: 'Garage',
                bulk_applied: active
              }, l, { fee_cents: lineCents(l, active) });
            });
          resolve(rows);
        }, 200);
      });
    }
    if (!sb) return Promise.reject(new Error('no supabase client'));
    return sb.rpc('drop_in_order_public', { p_id: id, p_token: token }).then(function (res) {
      if (res.error) throw res.error;
      return res.data || [];
    });
  }

  function handleReturn() {
    var params = new URLSearchParams(location.search);
    var order = params.get('order');
    var token = params.get('t');
    var cancelled = params.get('cancelled');

    if (cancelled === '1') {
      renderNotice('Nothing was charged. Your classes are still in the cart.');
      return false;
    }

    if (!order) return false;

    if (elFinderList) elFinderList.classList.add('is-loading');
    fetchOrder(order, token).then(function (rows) {
      var status = rows.length ? rows[0].status : null;
      if (status === 'paid') {
        renderThankyou(rows, rows[0].dancer_first_name || null);
      } else if (status === 'pending') {
        elMain.hidden = true;
        if (elPending) elPending.hidden = false;
        pollPending(order, token, 1);
      } else {
        // Wrong token, expired or cancelled order: show the normal page
        // instead of a lookup that never resolves.
        if (status === 'expired' || status === 'cancelled') {
          renderNotice('That checkout timed out. Nothing was charged.');
        }
        loadFinder();
      }
    }).catch(function (err) {
      console.warn('order lookup:', err && err.message);
      loadFinder();
    });
    return true;
  }

  // ── Init ──
  // Only once the schedule route is actually showing: this section sits in
  // every route shell, and a Home visitor has no use for the RPC calls.
  var started = false;
  function start() {
    if (started) return;
    started = true;
    var returning = handleReturn();
    if (new URLSearchParams(location.search).get('order') === 'stub') {
      // QA hook for the thank-you screenshot against the stub, per the brief's
      // verification step (checks thankyou_renders_from_rpc_or_stub).
    } else if (!returning) {
      loadFinder();
    }
    if (wantsFullWeek()) openFullWeek();
  }

  if (page.classList.contains('active')) start();

  // In-site navigation (a DROP IN row on Home is /schedule/?class=ballet):
  // main.js swaps the section with pushState and announces it here.
  window.addEventListener('dwd:route', function (e) {
    if (!e || !e.detail || e.detail.page !== 'schedule') return;
    deepLinkPending = true;
    start();
    applyDeepLink();
    if (wantsFullWeek()) openFullWeek();
  });
})();
