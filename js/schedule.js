/* ═══════════════════════════════════════════════
   DWD — schedule.js
   /schedule/ — the drop-in page, "D" (Dixon, 2026-11-07; plan
   docs/plans/2026-11-07-booking-d.md): the campaign band while one runs,
   one strip of class days, the picked day's classes as one kind of row, and
   the order (desktop aside, phone bar + sheet). The cart, prices, the 4+
   discount, the age check and checkout are the same code as before.

   Reads public_site_schedule(p_from, p_to) via window.__dwd_sb.rpc (two
   21-day windows, the RPC's cap per call), lets a visitor add open (drop-in)
   classes to a cart, and checks out through the drop-in-checkout edge
   function (Stripe Checkout redirect).

   ?day=YYYY-MM-DD (or tg) opens a day; ?class=<slug> opens that class's
   first open date and marks its row (js/now.js links its rows that way).
   The full ProSeries week grid is the old page, unchanged in behaviour,
   collapsed by default and loaded on first open (or straight away for
   #sched-list / ?week=). Nothing here runs until the schedule route is
   actually showing: every route shell carries this section.

   USE_STUB serves the feed and the thank-you return from a local stub that
   mirrors the exact RPC row shape (QA only; false in production).
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var page = document.getElementById('page-schedule');
  if (!page) return; // script gate — not the schedule route, do nothing

  var USE_STUB = false;

  var WAIVER_REVISION = 'v1.2'; // dwd 98ddd17e, waiver/drop-in/ (2026-10-30)
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
  // Tap for directions (persona pass 2026-10-31): the same search link the
  // "What to know" address in index.html carries.
  var EXCHANGE_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Exchange+Dance+Studio%2C+7409+Chancery+Lane%2C+Orlando%2C+FL+32809';

  // The campaign band (D, 2026-11-07). Its markup is the rule: the dates
  // (data-tg-date), the cutoff (data-tg-before), each morning's color, the
  // closed day and the teachers' photos. A class on one of those dates that
  // starts before the cutoff is a campaign class: it lives on the one wide
  // tile and stays out of the week grid. js/now.js and
  // scripts/check-classes-jsonld.mjs read the same dates and cutoff.
  var elBand = page.querySelector('[data-tg]');
  var TG_BEFORE = (elBand && elBand.getAttribute('data-tg-before')) || '';
  var TG_DATES = [], TG_TONE = {}, TG_CLOSED = {}, TEACHERS = {};
  if (elBand && TG_BEFORE) {
    Array.prototype.forEach.call(elBand.querySelectorAll('[data-tg-date]'), function (n) {
      var d = n.getAttribute('data-tg-date');
      if (TG_DATES.indexOf(d) === -1) TG_DATES.push(d);
      TG_TONE[d] = n.getAttribute('data-tone') || '';
    });
    TG_DATES.sort();
    Array.prototype.forEach.call(elBand.querySelectorAll('[data-tg-closed]'), function (n) {
      TG_CLOSED[n.getAttribute('data-tg-closed')] = (n.textContent || '').trim() || 'Closed';
    });
    Array.prototype.forEach.call(elBand.querySelectorAll('[data-teacher]'), function (n) {
      var t = { guest: n.hasAttribute('data-guest'), photo: n.getAttribute('data-photo') || '', photos: {} };
      Array.prototype.forEach.call(n.attributes, function (a) {
        if (a.name.indexOf('data-photo-') === 0) t.photos[a.name.slice(11)] = a.value;
      });
      TEACHERS[n.getAttribute('data-teacher')] = t;
    });
  }
  var TG_LAST = TG_DATES.length ? TG_DATES[TG_DATES.length - 1] : '';
  var TG_LABEL = (elBand && elBand.getAttribute('data-tg-label')) || 'This week';
  var TG_SHORT = (elBand && elBand.getAttribute('data-tg-short')) || TG_LABEL;
  var TG_UNIT = (elBand && elBand.getAttribute('data-tg-unit')) || 'classes';

  var DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  var DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Two calls of 21 days each (the RPC caps one call at 21): six weeks out.
  var FINDER_WINDOW = 21;

  // ── Elements ──
  var elMain = page.querySelector('[data-sched-main]');
  var elPick = page.querySelector('[data-bk-pick]');
  var elHead = page.querySelector('[data-bk-head]');
  var elStripbar = page.querySelector('[data-bk-stripbar]');
  var elStrip = page.querySelector('[data-bk-strip]');
  var elNext = page.querySelector('[data-bk-next]');
  var elPanel = page.querySelector('[data-bk-panel]');
  var elOrder = page.querySelector('[data-bk-order]');
  var elOrderSheet = page.querySelector('[data-bk-order-sheet]');
  var elSheet = page.querySelector('[data-bk-sheet]');
  var elScrim = page.querySelector('[data-bk-scrim]');
  var elSheetOpen = page.querySelector('[data-bk-sheet-open]');
  var elBarMeter = page.querySelector('[data-bk-bar-meter]');
  var elCoMeter = page.querySelector('[data-bk-co-meter]');
  var elSumbox = page.querySelector('[data-bk-sumbox]');
  var elSumShort = page.querySelector('[data-bk-sum-short]');
  var elTyLede = page.querySelector('[data-bk-ty-lede]');
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
  var elDob = page.querySelector('#sched-dancer-dob');
  var elAgeOk = page.querySelector('[data-sched-age-ok]');
  var elAgeOkBox = page.querySelector('#sched-age-ok');
  var elAgeNote = page.querySelector('[data-sched-age-note]');
  var elPayBtn = page.querySelector('[data-sched-pay-btn]');
  var elError = page.querySelector('[data-sched-error]');
  var elThankyou = page.querySelector('[data-sched-thankyou]');
  var elTyH1 = page.querySelector('[data-sched-ty-h1]');
  var elTyList = page.querySelector('[data-sched-ty-list]');
  var elTyTotal = page.querySelector('[data-sched-ty-total]');
  var elTyBulkNote = page.querySelector('[data-sched-ty-bulk-note]');
  var elTyAddress = page.querySelector('[data-sched-ty-address]');

  if (elTyAddress) {
    elTyAddress.textContent = '';
    var tyMap = el('a', '', EXCHANGE_ADDRESS);
    tyMap.href = EXCHANGE_MAPS_URL;
    tyMap.target = '_blank';
    tyMap.rel = 'noopener';
    elTyAddress.appendChild(tyMap);
  }

  var sb = window.__dwd_sb;

  // How far ahead the pager reaches. Six weeks is enough to hold the whole
  // October drop-in run in view from the middle of September; the RPC caps
  // one CALL at 21 days, not how far ahead a call may look.
  var MAX_WEEK_OFFSET = 6;

  var currentWeekOffset = 0;
  var currentRows = [];
  // The Monday and Sunday (ISO) of the week currentRows belongs to.
  var shownWeekFrom = '';
  var shownWeekTo = '';
  var droppedNotice = '';

  // The week grid loads on first open. gridReady: currentRows is a real
  // week's answer (not the empty array it starts as), so re-rendering it after
  // a chip tap cannot paint "No classes this week" over a list still loading.
  var gridLoaded = false;
  var gridReady = false;

  // A ?class= deep link waits for the days to load before it marks its row.
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
      age_band: row.age_band || null,
      start_time: row.start_time,
      end_time: row.end_time || null,
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

  // ── Same-time clash (persona pass 2026-10-31) ──
  // One dancer per order, so two classes that overlap on one date can't both
  // be hers: Technique & Flexibility and Ballet both start Tuesday at 4:45,
  // and the cart used to take (and charge) both. Lines saved before end_time
  // was kept count as an hour long.
  function minutesOf(t) {
    var m = String(t || '').match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  function cartClash(row) {
    var day = String(row.occurrence_date).slice(0, 10);
    var s = minutesOf(row.start_time);
    if (s == null) return null;
    var e = minutesOf(row.end_time) || s + 60;
    var cart = readCart();
    for (var i = 0; i < cart.length; i++) {
      var l = cart[i];
      if (String(l.occurrence_date).slice(0, 10) !== day || l.class_id === row.class_id) continue;
      var ls = minutesOf(l.start_time);
      if (ls == null) continue;
      var le = minutesOf(l.end_time) || ls + 60;
      if (s < le && ls < e) return l;
    }
    return null;
  }

  function clashText(line) {
    return 'Your cart already has ' + line.name + ' at ' + fmtTime(line.start_time) +
      ' that day. One dancer can’t be in both. Booking a second dancer? Check out once for each.';
  }

  // A bare "Elite + Pro" read like a level a drop-in has to have (persona pass
  // 2026-10-31); it is who the dancer joins. The full week keeps the bare label.
  function trackWords(label) {
    var t = String(label || '').replace(/\s+only$/i, '').trim();
    if (!t) return '';
    return /^all tracks$/i.test(t) ? 'All tracks' : 'With the ' + t + ' team';
  }

  // Rooms are Exchange's names ("Garage", "Studio A"); a first-timer has never
  // seen "Garage" used as a room before the thank-you.
  function roomWords(room) {
    var r = String(room || '').trim();
    if (!r) return '';
    return /\b(room|studio)\b/i.test(r) ? r : r + ' room';
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

  // The one bulk price every line in the cart shares, or null when the lines
  // differ (or one has none). Only a shared price can be named in the note.
  function sharedBulkCents(cart) {
    var c = cart.length ? cart[0].bulk_fee_cents : null;
    if (typeof c !== 'number') return null;
    for (var i = 1; i < cart.length; i++) {
      if (cart[i].bulk_fee_cents !== c) return null;
    }
    return c;
  }

  // One muted line: the discount that applied, or how many dates away it is.
  // Amounts come from the cart (2026-10-30), never a literal; a cart mixing
  // two bulk prices keeps the general wording.
  function bulkNoteText(cart) {
    if (!cart.length || !anyBulk(cart)) return '';
    var each = sharedBulkCents(cart);
    if (cart.length >= DROP_IN_BULK_MIN) {
      if (each == null) return 'Four or more dates in one order. Each one costs less.';
      var full = cart.reduce(function (sum, l) { return sum + (l.fee_cents || 0); }, 0);
      var saved = full - cartTotalCents(cart);
      return cart.length + ' dates at ' + money(each) + ' each.' +
        (saved > 0 ? ' You save ' + money(saved) + '.' : '');
    }
    if (cart.length < 2) return '';
    var need = DROP_IN_BULK_MIN - cart.length;
    if (each == null) return 'Add ' + need + ' more and every date drops in price.';
    return 'Add ' + need + ' more and each date drops to ' + money(each) + '.';
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

  // "$22.50 each for 4+": a class's multi-buy price, under its single price
  // in the class list and in the week grid. Empty when the feed has none.
  function bulkEachLine(row) {
    if (!row || typeof row.drop_in_bulk_fee_cents !== 'number') return '';
    return money(row.drop_in_bulk_fee_cents) + ' each for ' + DROP_IN_BULK_MIN + '+';
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
        drop_in_open: true, drop_in_fee_cents: 2000, drop_in_bulk_fee_cents: 1750,
        drop_in_bulk_min: 4, spots_left: 8
      },
      {
        class_id: 'stub-elite-rotation', occurrence_date: toIso(tue), date: toIso(tue),
        start_time: '19:00:00', end_time: '20:30:00', name: 'Rotation',
        track_label: 'Elite', age_band: 'ages 8 to 12', room: 'Studio A',
        drop_in_open: true, drop_in_fee_cents: 2000, drop_in_bulk_fee_cents: 1750,
        drop_in_bulk_min: 4, spots_left: 0
      },
      {
        class_id: 'stub-jazz-tech', occurrence_date: toIso(wed), date: toIso(wed),
        start_time: '16:00:00', end_time: '17:30:00', name: 'Jazz Technique',
        track_label: 'Elite + Pro', age_band: 'ages 8 and up', room: 'Studio A',
        drop_in_open: true, drop_in_fee_cents: 1500, drop_in_bulk_fee_cents: 1250,
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
    // "4:45 pm" with a no-break space, so a caller's split(' ') keeps it whole.
    return h + ':' + m[2] + ' ' + (Number(m[1]) >= 12 ? 'pm' : 'am');
  }

  // "5:00 to 6:00 pm": one meridiem when both ends share it, like llms.txt.
  // Words, not a dash: public copy carries no en dashes.
  function timeRange(start, end) {
    var a = fmtTime(start);
    if (!end) return a;
    var b = fmtTime(end);
    return (a.slice(-2) === b.slice(-2) ? a.slice(0, -3) : a) + ' to ' + b;
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

  // The empty week line. Thanksgiving week's mornings are all on the menu
  // card, so that week points up at it instead of reading as closed.
  function emptyWeekText() {
    for (var i = 0; i < TG_DATES.length; i++) {
      if (TG_DATES[i] >= shownWeekFrom && TG_DATES[i] <= shownWeekTo && elBand && !elBand.hidden) {
        return 'Evening classes are off this week. The masterclasses are above.';
      }
    }
    return 'No classes this week.';
  }

  function renderRows(rows) {
    elList.innerHTML = '';

    if (!rows.length) {
      var p0 = el('p', 'sched-empty-line', emptyWeekText());
      elList.appendChild(p0);
      return;
    }

    var visible = upcomingRows(rows);

    if (!visible.length) {
      elList.appendChild(el('p', 'sched-empty-line', emptyWeekText()));
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
          var bulkLine = bulkEachLine(row);
          if (bulkLine) priceWrap.appendChild(el('div', 'sched-row-bulk', bulkLine));
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
              var clash = cartClash(row);
              if (clash) {
                renderWeekNotice(clashText(clash));
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

    fetchWeek(rpcFromIso, toIso_).then(function (all) {
      // A slower answer for a week the visitor already paged past must not
      // paint its rows under the newer week's label.
      if (seq !== loadSeq) return;
      // The Thanksgiving menu's classes are booked from the card at the top,
      // so the week leaves them out (nothing shows twice, and a week holding
      // only menu classes is not where the first load stops). The cart is
      // still checked against every row.
      var rows = all.filter(function (r) { return !isTgRow(r); });
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
      shownWeekFrom = fromIso;
      shownWeekTo = toIso_;
      gridReady = true;
      applyBulkMin(all);
      var pruned = pruneCart(all);
      renderOrder();
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

  // ── Campaign classes ──
  // A menu class: on one of the card's dates, starting before its cutoff
  // ("10:00:00" < "13:00"). Kept out of the class list and the week grid.
  function isTgRow(r) {
    return !!r && TG_DATES.indexOf(String(r.date).slice(0, 10)) !== -1 &&
      String(r.start_time) < TG_BEFORE;
  }

  // Localhost only: ?tg=demo fills the seven seatings with open rows to see
  // the menu without Director classes. Prices are Dixon's tentative 10-31
  // numbers (Tuesday's two-hour jazz and the 1.5 hour seatings $20, the
  // one-hour classes $15) and Wednesday's second seating is full. Each
  // morning's rows go in latest first so the start-time sort is exercised.
  // Never reaches checkout: these class_ids do not exist on the server.
  var TG_DEMO = {
    '2026-11-24': [['10:00:00', '12:00:00', 'Jazz', null, 2000], ['12:00:00', '13:00:00', 'Musical Theatre', null, 1500]],
    '2026-11-25': [['10:00:00', '11:30:00', 'Contemporary Fusion', 'ages 9 and under', 2000], ['11:30:00', '13:00:00', 'Contemporary Fusion', 'ages 10 and up', 2000]],
    '2026-11-27': [['10:00:00', '11:00:00', 'Jazz Funk', 'ages 9 and under', 1500], ['11:00:00', '12:00:00', 'Jazz Funk', 'ages 10 and up', 1500], ['12:00:00', '13:00:00', 'Stretch & Strengthen', null, 1500]]
  };
  function tgDemoRows() {
    if (!/^(localhost|127\.)/.test(location.hostname)) return [];
    if (new URLSearchParams(location.search).get('tg') !== 'demo') return [];
    var out = [];
    TG_DATES.forEach(function (d) {
      (TG_DEMO[d] || []).forEach(function (s, i) {
        out.unshift({
          class_id: 'tg-demo-' + d + '-' + i, occurrence_date: d, date: d,
          start_time: s[0], end_time: s[1], name: s[2],
          track_label: null, age_band: s[3], room: null,
          drop_in_open: true, drop_in_fee_cents: s[4], spots_left: (d === '2026-11-25' && i === 1) ? 0 : 20
        });
      });
    });
    return out;
  }

  // ── D: the strip of days, the day, the order (2026-11-07) ──────────────
  // Every open drop-in date in the two 21-day windows becomes a day on the
  // strip. A campaign's classes (isTgRow) are ONE wide tile instead of one
  // tile per morning. The panel shows the picked day; every class is the same
  // row. The order renders three times from the one cart: the desktop aside,
  // the phone bar, and the phone sheet.

  var allRows = [];
  var rowsByKey = {};   // class_id|occurrence_date -> feed row
  var slotRows = {};    // class_id|weekday|HH:MM -> open rows, by date
  var dayList = [];
  var dayKey = null;    // 'tg' or YYYY-MM-DD
  var daysLoaded = false;
  var expandedSlots = {};
  var STATIC_PANEL = elPanel ? elPanel.innerHTML : '';

  var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  function word(n) { return WORDS[n] || String(n); }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function byStart(a, b) {
    return String(a.date).localeCompare(String(b.date)) || String(a.start_time).localeCompare(String(b.start_time));
  }
  function rowKey(r) { return r.class_id + '|' + r.occurrence_date; }
  function slotKey(r) { return r.class_id + '|' + localDate(r.date).getDay() + '|' + String(r.start_time).slice(0, 5); }

  // "Jazz with Tori Ugalde" -> { cls: 'Jazz', teacher: 'Tori Ugalde' }. The
  // Director names a campaign class after its teacher; weekly classes have none.
  function splitName(name) {
    var m = String(name || '').match(/^(.*\S)\s+with\s+(.+)$/i);
    return m ? { cls: m[1], teacher: m[2] } : { cls: String(name || ''), teacher: '' };
  }

  function toneOf(dateIso) { return TG_TONE[String(dateIso).slice(0, 10)] || ''; }
  function toneVar(dateIso, isTg) {
    var t = isTg ? toneOf(dateIso) : '';
    return t ? 'var(--bk-' + t + ')' : 'var(--bk-neutral)';
  }

  function teacherPhoto(teacher, dateIso) {
    var t = TEACHERS[teacher];
    if (!t) return '';
    var tone = toneOf(dateIso);
    return (tone && t.photos[tone]) || t.photo || '';
  }

  // "ages 10 and up" -> "Ages 10 and up"; nothing for a class without a band.
  function ageLabel(band) { return band ? cap(String(band).trim()) : ''; }

  function timeBits(t) {
    var s = fmtTime(t); // "4:45 pm"
    var i = s.lastIndexOf(' ');
    return i > 0 ? [s.slice(0, i), s.slice(i + 1)] : [s, ''];
  }

  function shortTime(t) { return fmtTime(t).replace(/:00(?=\s)/, '').replace(/\s+/g, ''); } // "10am", "4:45pm"

  function campaignOn() {
    if (!elBand || !TG_DATES.length) return false;
    if (nyTodayIso() > TG_LAST) return false;
    if (!daysLoaded) return true;
    return dayList.some(function (d) { return d.tg; });
  }

  function applyCampaign() {
    var on = campaignOn();
    if (elBand) elBand.hidden = !on;
    if (elPick) elPick.hidden = !on;
    if (elHead) elHead.hidden = on;
  }

  function indexRows(rows) {
    rowsByKey = {};
    slotRows = {};
    rows.forEach(function (r) {
      if (!r || !r.class_id || !r.date || !r.start_time) return;
      rowsByKey[rowKey(r)] = r;
      if (!r.drop_in_open || isTgRow(r) || isPast(r.date, r.start_time)) return;
      var k = slotKey(r);
      (slotRows[k] = slotRows[k] || []).push(r);
    });
    Object.keys(slotRows).forEach(function (k) { slotRows[k].sort(byStart); });
  }

  function buildDays(rows) {
    var open = rows.filter(function (r) {
      return r && r.class_id && r.date && r.start_time && r.drop_in_open && !isPast(r.date, r.start_time);
    });
    var byDate = {}, keys = [], tgRows = [];
    open.forEach(function (r) {
      if (isTgRow(r)) { tgRows.push(r); return; }
      var d = String(r.date).slice(0, 10);
      if (!byDate[d]) { byDate[d] = []; keys.push(d); }
      byDate[d].push(r);
    });
    keys.sort();
    var days = keys.map(function (d) { return { key: d, date: d, rows: byDate[d].sort(byStart), tg: false }; });
    if (tgRows.length && nyTodayIso() <= TG_LAST) {
      tgRows.sort(byStart);
      var tgDay = { key: 'tg', date: String(tgRows[0].date).slice(0, 10), rows: tgRows, tg: true };
      var at = 0;
      while (at < days.length && days[at].date <= tgDay.date) at++;
      days.splice(at, 0, tgDay);
    }
    return days;
  }

  function currentDay() {
    for (var i = 0; i < dayList.length; i++) if (dayList[i].key === dayKey) return dayList[i];
    return null;
  }

  // ?day=YYYY-MM-DD (or tg), then ?class=<slug>'s first open date, then the
  // campaign while it runs, then the first day with something to book.
  function pickInitialDay() {
    var q = new URLSearchParams(location.search);
    var want = (q.get('day') || '').trim();
    var slug = (q.get('class') || '').trim().toLowerCase();
    var found = null;
    if (want) dayList.forEach(function (d) { if (!found && (d.key === want || (want !== 'tg' && d.tg && d.rows.some(function (r) { return String(r.date).slice(0, 10) === want; })))) found = d; });
    if (!found && slug) {
      dayList.forEach(function (d) {
        if (found) return;
        if (d.rows.some(function (r) { return slugify(splitName(r.name).cls) === slug || slugify(r.name) === slug; })) found = d;
      });
    }
    if (!found) dayList.forEach(function (d) { if (!found && d.tg) found = d; });
    if (!found) found = dayList[0] || null;
    dayKey = found ? found.key : null;
  }

  function dayInOrder(day, cart) {
    return cart.some(function (l) {
      if (day.tg) return isTgRow(l);
      return String(l.date).slice(0, 10) === day.date && !isTgRow(l);
    });
  }

  function renderSkeleton() {
    if (!elStrip || elStrip.children.length) return;
    for (var i = 0; i < 6; i++) elStrip.appendChild(el('span', 'bk-tile is-skel'));
  }

  function renderStrip() {
    if (!elStrip) return;
    elStrip.innerHTML = '';
    var cart = readCart();
    var lastMonth = -1, tiles = null;
    dayList.forEach(function (day) {
      var d = localDate(day.date);
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        var grp = el('div', 'bk-grp');
        grp.appendChild(el('p', 'bk-grp-l', MONTHS_LONG[lastMonth]));
        tiles = el('div', 'bk-tiles');
        grp.appendChild(tiles);
        elStrip.appendChild(grp);
      }
      var on = day.key === dayKey;
      var b = el('button', 'bk-tile' + (day.tg ? ' bk-tile--tg' : '') + (on ? ' is-on' : ''));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.setAttribute('data-bk-day', day.key);
      b.setAttribute('data-track', 'bk-day:' + (day.tg ? 'tg' : day.date));
      var n = day.rows.length;
      if (day.tg) {
        b.appendChild(el('span', 'bk-tile-dw', TG_SHORT.toUpperCase()));
        var nums = el('span', 'bk-tile-dn');
        TG_DATES.forEach(function (iso) {
          var s = el('span', '', String(localDate(iso).getDate()));
          s.style.color = toneVar(iso, true);
          nums.appendChild(s);
        });
        b.appendChild(nums);
        b.appendChild(el('span', 'bk-tile-ct', n + ' ' + TG_UNIT));
        b.setAttribute('aria-label', TG_LABEL + ', ' + n + ' ' + TG_UNIT);
      } else {
        b.appendChild(el('span', 'bk-tile-dw', DAY_SHORT[d.getDay()].toUpperCase()));
        b.appendChild(el('span', 'bk-tile-dn', String(d.getDate())));
        b.appendChild(el('span', 'bk-tile-ct', n + (n === 1 ? ' class' : ' classes')));
        b.setAttribute('aria-label', DAY_NAMES_LONG[d.getDay()] + ' ' + MONTHS_LONG[d.getMonth()] + ' ' + d.getDate() + ', ' + n + (n === 1 ? ' class' : ' classes'));
      }
      if (dayInOrder(day, cart)) {
        var dot = el('span', 'bk-tile-dot');
        dot.setAttribute('aria-hidden', 'true');
        b.appendChild(dot);
        b.setAttribute('aria-label', b.getAttribute('aria-label') + ', in your order');
      }
      tiles.appendChild(b);
    });
    updateArrow();
  }

  function keepTileInView() {
    var on = elStrip && elStrip.querySelector('.bk-tile.is-on');
    if (!on) return;
    var s = elStrip.getBoundingClientRect(), t = on.getBoundingClientRect();
    if (t.left < s.left + 8 || t.right > s.right - 48) {
      elStrip.scrollLeft += (t.left - s.left) - 72;
    }
    updateArrow();
  }

  function updateArrow() {
    if (!elNext || !elStrip) return;
    elNext.hidden = elStrip.scrollWidth - elStrip.clientWidth - elStrip.scrollLeft < 8;
  }

  function dealLine() {
    var pairs = {}, list = [];
    allRows.forEach(function (r) {
      if (!r.drop_in_open || typeof r.drop_in_bulk_fee_cents !== 'number' || typeof r.drop_in_fee_cents !== 'number') return;
      if (isPast(r.date, r.start_time)) return;
      if (pairs[r.drop_in_fee_cents] == null) { pairs[r.drop_in_fee_cents] = r.drop_in_bulk_fee_cents; list.push(r.drop_in_fee_cents); }
    });
    if (!list.length) return null;
    list.sort(function (a, b) { return b - a; });
    var p = el('p', 'bk-deal');
    var pips = el('span', 'bk-pips');
    pips.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < DROP_IN_BULK_MIN; i++) pips.appendChild(el('i'));
    p.appendChild(pips);
    var t = el('span');
    t.appendChild(el('b', '', 'Book ' + DROP_IN_BULK_MIN + ' or more in one order'));
    t.appendChild(document.createTextNode(' and each class costs less: ' + list.map(function (fee, i) {
      return money(fee) + ' classes ' + (i === 0 ? 'drop to ' : 'to ') + money(pairs[fee]);
    }).join(', ') + '.'));
    p.appendChild(t);
    return p;
  }

  function rowEl(r, opts) {
    opts = opts || {};
    var isTg = isTgRow(r);
    var nm = splitName(r.name);
    var full = r.spots_left === 0;
    var added = !full && cartHas(r.class_id, r.occurrence_date);
    var li = el('div', 'bk-row' + (added ? ' is-on' : '') + (full ? ' is-full' : ''));
    li.setAttribute('data-slug', slugify(nm.cls));
    li.style.setProperty('--tone', toneVar(r.date, isTg));

    var tb = timeBits(r.start_time);
    var t = el('p', 'bk-t');
    t.appendChild(el('b', '', tb[0]));
    t.appendChild(el('i', '', tb[1]));
    var len = lengthLabel(r.start_time, r.end_time);
    if (len) t.appendChild(el('small', '', len));
    li.appendChild(t);

    var photo = nm.teacher ? teacherPhoto(nm.teacher, r.date) : '';
    if (photo) {
      var img = el('img', 'bk-av');
      img.src = photo; img.alt = ''; img.width = 56; img.height = 56;
      img.loading = 'lazy'; img.decoding = 'async';
      li.appendChild(img);
    } else {
      var mark = el('span', 'bk-av bk-av--mark');
      var mi = el('img');
      mi.src = '/images/logos/v3/dwdPS-compact-transparent.svg'; mi.alt = ''; mi.width = 34; mi.height = 34;
      mark.appendChild(mi);
      li.appendChild(mark);
    }

    var main = el('div', 'bk-main-c');
    main.appendChild(el('h4', 'bk-cls', nm.cls));
    var by = el('p', 'bk-by');
    if (nm.teacher) {
      by.appendChild(el('span', '', nm.teacher));
      if (TEACHERS[nm.teacher] && TEACHERS[nm.teacher].guest) by.appendChild(el('span', 'bk-guest', 'Guest'));
    } else if (r.track_label) {
      by.appendChild(el('span', '', trackWords(r.track_label)));
    }
    var age = ageLabel(r.age_band);
    if (age) by.appendChild(el('span', 'bk-age', age));
    main.appendChild(by);
    li.appendChild(main);

    var price = el('p', 'bk-px', money(r.drop_in_fee_cents));
    if (typeof r.spots_left === 'number' && r.spots_left >= 1 && r.spots_left <= 3) {
      price.appendChild(el('small', '', r.spots_left + (r.spots_left === 1 ? ' spot left' : ' spots left')));
    }
    li.appendChild(price);

    var act = el('div', 'bk-act');
    var btn = el('button', 'bk-add tap-44' + (added ? ' is-on' : ''));
    btn.type = 'button';
    btn.setAttribute('data-bk-add', rowKey(r));
    btn.setAttribute('data-track', 'dropin_add');
    if (full) {
      btn.disabled = true;
      btn.textContent = 'Full';
    } else {
      btn.setAttribute('aria-pressed', added ? 'true' : 'false');
      btn.setAttribute('aria-label', (added ? 'Remove ' : 'Add ') + nm.cls + ', ' + DAY_NAMES_LONG[localDate(r.date).getDay()] + ' ' + shortDateLabel(localDate(r.date)) + ' at ' + fmtTime(r.start_time));
      if (added) {
        btn.innerHTML = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7"/></svg>';
        btn.appendChild(document.createTextNode('Added'));
      } else {
        btn.textContent = 'Add';
      }
    }
    act.appendChild(btn);
    li.appendChild(act);

    if (opts.chips) {
      var others = (slotRows[slotKey(r)] || []).filter(function (o) { return rowKey(o) !== rowKey(r); });
      if (others.length) {
        var k = slotKey(r);
        var also = el('div', 'bk-also');
        also.appendChild(el('span', 'bk-also-l', 'Other ' + DAY_NAMES_LONG[localDate(r.date).getDay()] + 's:'));
        var show = expandedSlots[k] ? others : others.slice(0, 3);
        show.forEach(function (o) {
          var oFull = o.spots_left === 0;
          var oOn = !oFull && cartHas(o.class_id, o.occurrence_date);
          var few = typeof o.spots_left === 'number' && o.spots_left >= 1 && o.spots_left <= 3;
          var c = el('button', 'bk-chip' + (oOn ? ' is-on' : '') + (oFull ? ' is-full' : ''));
          c.type = 'button';
          c.setAttribute('data-bk-chip', rowKey(o));
          c.setAttribute('data-track', 'dropin-chip:' + slugify(nm.cls));
          var od = localDate(o.date);
          if (oOn) c.innerHTML = '<span class="sched-check" aria-hidden="true"></span>';
          c.appendChild(oFull ? el('s', '', shortDateLabel(od)) : document.createTextNode(shortDateLabel(od)));
          if (oFull) c.appendChild(el('em', '', 'Full'));
          else if (few) c.appendChild(el('em', '', o.spots_left + ' left'));
          c.disabled = oFull;
          if (!oFull) c.setAttribute('aria-pressed', oOn ? 'true' : 'false');
          c.setAttribute('aria-label', nm.cls + ', ' + DAY_NAMES_LONG[od.getDay()] + ' ' + shortDateLabel(od) + (oFull ? ', full' : (oOn ? ', in your order' : '')));
          also.appendChild(c);
        });
        if (others.length > 3 && !expandedSlots[k]) {
          var more = el('button', 'bk-chip bk-chip--more', 'More');
          more.type = 'button';
          more.setAttribute('data-bk-more', k);
          also.appendChild(more);
        }
        li.appendChild(also);
      }
    }

    var note = el('p', 'bk-row-note');
    note.setAttribute('role', 'status');
    note.hidden = true;
    li.appendChild(note);
    return li;
  }

  function nextDayButton(label, target) {
    var b = el('button', 'bk-next');
    b.type = 'button';
    b.setAttribute('data-bk-go', target.key);
    var d = localDate(target.date);
    b.appendChild(el('span', '', label));
    b.appendChild(el('b', '', (target.tg ? TG_LABEL : DAY_NAMES_LONG[d.getDay()] + ', ' + shortDateLabel(d)) + ' →'));
    return b;
  }

  function renderPanel() {
    if (!elPanel) return;
    var day = currentDay();
    elPanel.innerHTML = '';
    elPanel.classList.remove('is-loading');
    if (!day) {
      var p = el('p', 'bk-empty');
      p.innerHTML = 'No drop-in spots are open right now. <a href="/contact/?reason=proseries">Ask Dixon &rarr;</a>';
      elPanel.appendChild(p);
      return;
    }
    var head = el('div', 'bk-ph');
    if (day.tg) {
      var mornings = {};
      day.rows.forEach(function (r) { mornings[String(r.date).slice(0, 10)] = true; });
      var m = Object.keys(mornings).length;
      head.appendChild(el('h3', '', TG_LABEL));
      head.appendChild(el('p', '', cap(word(day.rows.length)) + ' ' + TG_UNIT + ' over ' + word(m) + (TG_BEFORE <= '13:00' ? ' mornings' : ' days')));
    } else {
      var d = localDate(day.date);
      head.appendChild(el('h3', '', DAY_NAMES_LONG[d.getDay()] + ', ' + MONTHS_LONG[d.getMonth()] + ' ' + d.getDate()));
      head.appendChild(el('p', '', day.rows.length + (day.rows.length === 1 ? ' class' : ' classes') + ' with open spots'));
    }
    elPanel.appendChild(head);
    var deal = dealLine();
    if (deal) elPanel.appendChild(deal);

    if (day.tg) {
      var byDate = {};
      day.rows.forEach(function (r) { var k = String(r.date).slice(0, 10); (byDate[k] = byDate[k] || []).push(r); });
      var dates = Object.keys(byDate).concat(Object.keys(TG_CLOSED)).filter(function (x, i, a) { return a.indexOf(x) === i; }).sort();
      var firstD = Object.keys(byDate).sort()[0];
      dates.forEach(function (iso) {
        if (iso < firstD) return;
        var dd = localDate(iso);
        if (!byDate[iso]) {
          if (!TG_CLOSED[iso]) return;
          var rest = el('div', 'bk-rest');
          rest.appendChild(el('b', '', String(dd.getDate())));
          rest.appendChild(el('span', '', DAY_NAMES[dd.getDay()]));
          rest.appendChild(el('em', '', TG_CLOSED[iso]));
          elPanel.appendChild(rest);
          return;
        }
        var dh = el('div', 'bk-dayh');
        dh.style.setProperty('--tone', toneVar(iso, true));
        dh.appendChild(el('b', '', String(dd.getDate())));
        dh.appendChild(el('span', '', DAY_NAMES[dd.getDay()]));
        var who = [];
        byDate[iso].forEach(function (r) { var t = splitName(r.name).teacher; if (t && who.indexOf(t) === -1) who.push(t); });
        if (who.length) dh.appendChild(el('small', '', who.join(', ')));
        elPanel.appendChild(dh);
        byDate[iso].forEach(function (r) { elPanel.appendChild(rowEl(r)); });
      });
      var after = null;
      dayList.forEach(function (x) { if (!after && !x.tg && x.date > TG_LAST) after = x; });
      if (after) elPanel.appendChild(nextDayButton('Weekly classes pick up again', after));
    } else {
      var list = el('div', 'bk-rows');
      day.rows.forEach(function (r) { list.appendChild(rowEl(r, { chips: true })); });
      elPanel.appendChild(list);
      var idx = dayList.indexOf(day);
      if (idx >= 0 && dayList[idx + 1]) elPanel.appendChild(nextDayButton('Next class day', dayList[idx + 1]));
    }
  }

  function selectDay(key) {
    if (key === dayKey) return;
    dayKey = key;
    renderStrip();
    renderPanel();
    keepTileInView();
    // Bring the new day's top up under the strip when it starts above it.
    var bar = elStripbar && elStripbar.getBoundingClientRect();
    var top = elPanel.getBoundingClientRect().top;
    if (bar && top < bar.bottom) {
      var y = window.pageYOffset + top - bar.height - stickOffset() - 8;
      try { window.scrollTo({ top: Math.max(0, y), behavior: 'instant' }); } catch (e) { window.scrollTo(0, Math.max(0, y)); }
    }
  }

  function toggleRow(r, noteHost) {
    if (!r) return;
    if (cartHas(r.class_id, r.occurrence_date)) {
      cartRemove(r.class_id, r.occurrence_date);
    } else {
      if (r.spots_left === 0) return;
      var full = readCart().length >= MAX_LINES;
      var clash = full ? null : cartClash(r);
      if (full || clash) {
        var note = noteHost && noteHost.querySelector('.bk-row-note');
        if (note) {
          note.textContent = full ? 'Six classes at a time. Check out, then add more.' : clashText(clash);
          note.hidden = false;
          clearCartBar(note);
        }
        return;
      }
      cartAdd(r);
      renderNotice('');
    }
    syncCart();
  }

  // The bar is fixed over the bottom of a phone; a note opened low on the
  // screen would sit under it (QA 2026-10-31), so nudge the page up.
  function clearCartBar(node) {
    if (!elCartBar || elCartBar.hidden || getComputedStyle(elCartBar).display === 'none') return;
    var over = node.getBoundingClientRect().bottom - elCartBar.getBoundingClientRect().top;
    if (over > 0) window.scrollBy(0, over + 12);
  }

  if (elPanel) elPanel.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var add = t.closest('[data-bk-add]');
    if (add && !add.disabled) { toggleRow(rowsByKey[add.getAttribute('data-bk-add')], add.closest('.bk-row')); return; }
    var chip = t.closest('[data-bk-chip]');
    if (chip && !chip.disabled) { toggleRow(rowsByKey[chip.getAttribute('data-bk-chip')], chip.closest('.bk-row')); return; }
    var more = t.closest('[data-bk-more]');
    if (more) {
      expandedSlots[more.getAttribute('data-bk-more')] = true;
      renderPanel();
      return;
    }
    var go = t.closest('[data-bk-go]');
    if (go) selectDay(go.getAttribute('data-bk-go'));
  });

  if (elStrip) {
    elStrip.addEventListener('click', function (e) {
      var tile = e.target.closest && e.target.closest('[data-bk-day]');
      if (tile) selectDay(tile.getAttribute('data-bk-day'));
    });
    elStrip.addEventListener('scroll', updateArrow, { passive: true });
  }
  if (elNext) elNext.addEventListener('click', function () {
    var by = Math.round(elStrip.clientWidth * 0.7);
    try { elStrip.scrollBy({ left: by, behavior: 'smooth' }); } catch (e) { elStrip.scrollLeft += by; }
  });
  window.addEventListener('resize', function () { updateArrow(); setStick(); });

  // ── The order: one cart, drawn in the aside, the bar and the sheet ──
  function sortedCart() { return readCart().slice().sort(byStart); }

  function lineEl(line, active) {
    var isTg = isTgRow(line);
    var nm = splitName(line.name);
    var d = localDate(line.date);
    var li = el('li', 'bk-line');
    var dt = el('span', 'bk-dt');
    dt.style.setProperty('--tone', toneVar(line.date, isTg));
    dt.appendChild(el('b', '', String(d.getDate())));
    dt.appendChild(el('span', '', DAY_SHORT[d.getDay()].toUpperCase()));
    li.appendChild(dt);
    var w = el('span', 'bk-line-w');
    w.appendChild(el('b', '', nm.cls));
    w.appendChild(el('small', '', (nm.teacher ? nm.teacher + ' · ' : '') + shortDateLabel(d) + ', ' + shortTime(line.start_time)));
    li.appendChild(w);
    var cents = lineCents(line, active);
    var px = el('span', 'bk-line-px', money(cents));
    if (cents !== (line.fee_cents || 0)) px.appendChild(el('s', '', money(line.fee_cents)));
    li.appendChild(px);
    var x = el('button', 'bk-x');
    x.type = 'button';
    x.setAttribute('data-bk-remove', line.class_id + '|' + line.occurrence_date);
    x.setAttribute('aria-label', 'Remove ' + nm.cls + ', ' + DAY_NAMES_LONG[d.getDay()] + ' ' + shortDateLabel(d));
    x.innerHTML = '<svg viewBox="0 0 10 10" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M1 1l8 8M9 1l-8 8"/></svg>';
    li.appendChild(x);
    return li;
  }

  function meterText(cart) {
    if (!anyBulk(cart) && cart.length) return '';
    if (cart.length >= 2) return bulkNoteText(cart);
    var need = DROP_IN_BULK_MIN - cart.length;
    var each = cart.length ? sharedBulkCents(cart) : null;
    if (cart.length === 1 && each != null) return 'Add ' + need + ' more and each date drops to ' + money(each) + '.';
    return 'Book ' + DROP_IN_BULK_MIN + ' or more in one order and each class costs less.';
  }

  function meterEl(cart, cls) {
    var won = cart.length >= DROP_IN_BULK_MIN && anyBulk(cart);
    var m = el('div', (cls || 'bk-meter') + (won ? ' is-won' : ''));
    var bars = el('span', 'bk-bars');
    bars.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < DROP_IN_BULK_MIN; i++) bars.appendChild(el('i', i < cart.length ? 'is-f' : ''));
    m.appendChild(bars);
    var txt = meterText(cart);
    if (txt) m.appendChild(el('p', '', txt));
    return m;
  }

  function fillOrder(host, cart) {
    if (!host) return;
    host.innerHTML = '';
    var h = el('h2', 'bk-order-h', 'Your order');
    if (cart.length) h.appendChild(el('span', '', cart.length + (cart.length === 1 ? ' class' : ' classes')));
    host.appendChild(h);
    if (!cart.length) {
      var empty = el('div', 'bk-order-empty');
      empty.appendChild(el('p', '', 'Nothing yet. Pick a day, then tap Add on a class.'));
      empty.appendChild(meterEl(cart));
      host.appendChild(empty);
      return;
    }
    var active = bulkActive(cart);
    var ul = el('ul', 'bk-lines');
    cart.forEach(function (l) { ul.appendChild(lineEl(l, active)); });
    host.appendChild(ul);
    host.appendChild(meterEl(cart));
    var tot = el('div', 'bk-total');
    tot.appendChild(el('span', '', 'Total'));
    tot.appendChild(el('span', '', money(cartTotalCents(cart))));
    host.appendChild(tot);
    var go = el('button', 'btn arm-cta bk-go tap-44', 'Check out');
    go.type = 'button';
    go.setAttribute('data-bk-checkout', '');
    go.setAttribute('data-track', 'dropin_checkout_start');
    host.appendChild(go);
    var fine = el('p', 'bk-fine');
    fine.innerHTML = 'One dancer per order. You pay by card on Stripe&rsquo;s secure page. Paying with Step Up? <a href="https://dwd-director.netlify.app/drop-in" target="_blank" rel="noopener">Use the DWD family app</a>.';
    host.appendChild(fine);
  }

  function renderOrder() {
    var cart = sortedCart();
    fillOrder(elOrder, cart);
    fillOrder(elOrderSheet, cart);
    if (!cart.length) {
      elCartBar.hidden = true;
      closeSheet();
      return;
    }
    // The checkout and thank-you views hide the bar themselves.
    if (elCheckout.hidden && elThankyou.hidden) elCartBar.hidden = false;
    elCartCount.innerHTML = cart.length + (cart.length === 1 ? ' class' : ' classes') +
      ' · <span class="sched-cart-amt">' + money(cartTotalCents(cart)) + '</span>' +
      '<svg class="bk-chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 8l4-4 4 4"/></svg>';
    if (elBarMeter) {
      elBarMeter.innerHTML = '';
      elBarMeter.appendChild(meterEl(cart, 'bk-meter bk-meter--bar'));
    }
    renderBulkNote(elCartBulkNote, '');
  }

  function orderClick(e) {
    var x = e.target.closest && e.target.closest('[data-bk-remove]');
    if (x) {
      var k = x.getAttribute('data-bk-remove').split('|');
      cartRemove(k[0], k[1]);
      syncCart();
      return;
    }
    if (e.target.closest && e.target.closest('[data-bk-checkout]')) {
      closeSheet();
      openCheckout();
    }
  }
  if (elOrder) elOrder.addEventListener('click', orderClick);
  if (elOrderSheet) elOrderSheet.addEventListener('click', orderClick);

  // ── The phone's order sheet ──
  var sheetReturn = null;
  function openSheet() {
    if (!elSheet || !readCart().length) return;
    sheetReturn = document.activeElement;
    elSheet.hidden = false;
    if (elScrim) elScrim.hidden = false;
    document.documentElement.classList.add('bk-sheet-open');
    var h = elSheet.querySelector('[data-bk-sheet-close]');
    if (h) try { h.focus({ preventScroll: true }); } catch (e) {}
  }
  function closeSheet() {
    if (!elSheet || elSheet.hidden) return;
    elSheet.hidden = true;
    if (elScrim) elScrim.hidden = true;
    document.documentElement.classList.remove('bk-sheet-open');
    if (sheetReturn && sheetReturn.focus) try { sheetReturn.focus({ preventScroll: true }); } catch (e) {}
  }
  if (elSheetOpen) elSheetOpen.addEventListener('click', openSheet);
  if (elScrim) elScrim.addEventListener('click', closeSheet);
  if (elSheet) elSheet.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-bk-sheet-close]')) closeSheet();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  // The strip sticks under the fixed topnav.
  function stickOffset() {
    var nav = document.getElementById('topnav');
    if (!nav) return 0;
    var pos = getComputedStyle(nav).position;
    return (pos === 'fixed' || pos === 'sticky') ? nav.offsetHeight : 0;
  }
  function setStick() { page.style.setProperty('--bk-stick', stickOffset() + 'px'); }

  // One cart, every surface: the order, the strip's dots, the day, the week grid.
  function syncCart() {
    renderOrder();
    if (daysLoaded) { renderStrip(); renderPanel(); }
    if (gridReady) renderRows(currentRows);
  }

  var daySeq = 0;
  function loadDays() {
    var seq = ++daySeq;
    renderSkeleton();
    renderOrder();
    if (!USE_STUB && !sb) { settleDays(false); return; }
    if (elPanel) elPanel.classList.add('is-loading');

    var today = localDate(nyTodayIso());
    var a0 = toIso(today), a1 = toIso(addDays(today, FINDER_WINDOW - 1));
    var b0 = toIso(addDays(today, FINDER_WINDOW)), b1 = toIso(addDays(today, FINDER_WINDOW * 2 - 1));

    Promise.all([fetchWeek(a0, a1), fetchWeek(b0, b1)]).then(function (res) {
      if (seq !== daySeq) return;
      var rows = (res[0] || []).concat(res[1] || []);
      var demo = tgDemoRows();
      if (demo.length) rows = rows.filter(function (r) { return !isTgRow(r); }).concat(demo);
      applyBulkMin(rows);
      allRows = rows;
      indexRows(rows);
      var pruned = pruneCart(rows);
      if (pruned.dropped.length) {
        renderNotice(pruned.dropped[0] + ' closed since you added it, so it left your cart.');
      }
      dayList = buildDays(rows);
      daysLoaded = true;
      applyCampaign();
      pickInitialDay();
      renderStrip();
      renderPanel();
      renderOrder();
      keepTileInView();
      settleDays(true);
    }).catch(function (err) {
      if (seq !== daySeq) return;
      console.warn('drop-in classes:', err && err.message);
      settleDays(false);
    });
  }

  function settleDays(ok) {
    if (elPanel) elPanel.classList.remove('is-loading');
    if (!ok) {
      if (elStrip) elStrip.innerHTML = '';
      if (elStripbar) elStripbar.hidden = true;
      if (elPanel) {
        elPanel.innerHTML = STATIC_PANEL;
        var p = el('p', 'bk-empty');
        p.innerHTML = 'The schedule is taking a minute. Refresh, or <a href="/contact/?reason=proseries">reach Dixon &rarr;</a>';
        elPanel.insertBefore(p, elPanel.firstChild);
      }
      return;
    }
    applyDeepLink();
  }

  // ── ?class=<slug>: mark the class's row on the day it opened on ──
  function applyDeepLink() {
    if (!deepLinkPending || !daysLoaded || !elPanel) return;
    deepLinkPending = false;
    var slug = (new URLSearchParams(location.search).get('class') || '').trim().toLowerCase();
    if (!slug) return;
    var rows = elPanel.querySelectorAll('.bk-row');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute('data-slug') === slug) {
        rows[i].classList.add('is-linked');
        scrollToBlock(rows[i]);
        return;
      }
    }
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
    closeSheet();
    renderSummary();
    // The order is the point on a desktop; on a phone it folds to one line
    // so the form starts on the first screen.
    if (elSumbox) elSumbox.open = window.matchMedia('(min-width: 900px)').matches;
    // The phone's Back (or a swipe) used to leave /schedule/ from here, which
    // from Instagram meant back to Instagram with the form lost (persona pass
    // 2026-10-31). One history entry for the open checkout; Back closes it.
    if (!checkoutInHistory) {
      try {
        history.pushState({ schedCheckout: true }, '', location.href);
        checkoutInHistory = true;
      } catch (e) {}
    }
    // The cart bar sits at the bottom of a long list; without this a phone
    // lands on the footer with the form above the screen.
    jumpToTop(elCheckout.querySelector('h2'));
  }

  var checkoutInHistory = false;

  // Every in-page way out of checkout (the Back link, removing the last line,
  // a class that closed) goes through history, so the entry openCheckout
  // pushed never lingers for a second Back to land on.
  function leaveCheckout() {
    if (checkoutInHistory) { history.back(); return; }
    closeCheckout();
  }

  window.addEventListener('popstate', function (e) {
    if (!checkoutInHistory || (e.state && e.state.schedCheckout)) return;
    checkoutInHistory = false;
    if (!elCheckout.hidden) closeCheckout();
  });

  // Two tabs share one cart. The other tab's change repaints this one, so the
  // Pay button never shows a total the order won't charge.
  window.addEventListener('storage', function (e) {
    if (e.key !== CART_KEY) return;
    if (!elCheckout.hidden) {
      if (!readCart().length) { leaveCheckout(); return; }
      renderSummary();
      return;
    }
    if (elThankyou.hidden) syncCart();
  });

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
    renderOrder();
    if (daysLoaded) { renderStrip(); renderPanel(); }
    if (gridLoaded) loadWeek(currentWeekOffset);
    jumpToTop(null);
  }

  function renderSummary() {
    var cart = sortedCart();
    var active = bulkActive(cart);
    elSummaryList.innerHTML = '';
    cart.forEach(function (line) { elSummaryList.appendChild(lineEl(line, active)); });
    var total = cartTotalCents(cart);
    if (elCoMeter) {
      elCoMeter.innerHTML = '';
      elCoMeter.appendChild(meterEl(cart));
    }
    renderBulkNote(elBulkNote, '');
    elSummaryTotal.textContent = money(total);
    if (elSumShort) elSumShort.innerHTML = cart.length + (cart.length === 1 ? ' class' : ' classes') + ' · <b>' + money(total) + '</b>';
    elPayBtn.textContent = 'Pay ' + money(total);
    renderAgeNote();
  }

  // The summary's x: same as the order's, but checkout stays open until the
  // last line goes.
  elSummaryList.addEventListener('click', function (e) {
    var x = e.target.closest && e.target.closest('[data-bk-remove]');
    if (!x) return;
    var k = x.getAttribute('data-bk-remove').split('|');
    cartRemove(k[0], k[1]);
    if (!readCart().length) { leaveCheckout(); return; }
    renderSummary();
  });

  // ── Age note (2026-10-30) ──
  // One line under the date of birth when the dancer's age on a cart class's
  // date falls outside that class's band ("ages 10 and up"), for the first
  // such class, with a "Yes, book it anyway" box Pay waits on (Dixon,
  // 2026-10-31: warn them and make sure they want it; nobody checks at
  // class). It is rewritten, and the box cleared, whenever the date or the
  // cart changes. Bands it reads: "ages 5 to 9", "ages 10 and
  // up", "ages 9 and under" (the Thanksgiving seatings). Anything else,
  // "all ages" included, says nothing.
  function parseBand(band) {
    var s = String(band || '').trim().toLowerCase().replace(/[\u2013\u2014]/g, '-');
    var m = s.match(/^ages?\s+(\d{1,2})\s*(?:to|-)\s*(\d{1,2})$/);
    if (m) return Number(m[1]) <= Number(m[2]) ? { min: Number(m[1]), max: Number(m[2]) } : null;
    m = s.match(/^ages?\s+(\d{1,2})\s*(?:\+|and up|and older|and over)$/);
    if (m) return { min: Number(m[1]), max: null };
    m = s.match(/^ages?\s+(\d{1,2})\s*(?:and under|and younger|and below)$/);
    return m ? { min: 0, max: Number(m[1]) } : null;
  }

  // Carts saved before lines carried age_band still have it inside label.
  function lineBand(line) {
    if (line.age_band) return String(line.age_band).trim();
    var bits = String(line.label || '').split(' \u00b7 ');
    for (var i = 0; i < bits.length; i++) {
      if (/^ages?\s/i.test(bits[i])) return bits[i].trim();
    }
    return '';
  }

  // Whole years on the class's date; null while the date is half typed (a
  // date field reports year 0002 mid-entry) or after the class.
  function ageOn(dobIso, dateIso) {
    var b = String(dobIso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    var c = String(dateIso || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!b || !c || Number(b[1]) < 1900) return null;
    var age = Number(c[1]) - Number(b[1]);
    if (c[2] + c[3] < b[2] + b[3]) age--; // birthday not reached yet that year
    return age >= 0 ? age : null;
  }

  function ageNoteText(cart, dobIso) {
    for (var i = 0; i < cart.length; i++) {
      var band = lineBand(cart[i]);
      var range = parseBand(band);
      var age = range ? ageOn(dobIso, cart[i].date) : null;
      if (age == null) continue;
      if (age < range.min || (range.max != null && age > range.max)) {
        return 'Heads up: ' + cart[i].name + ' is for ' + band.charAt(0).toLowerCase() + band.slice(1) +
          ', and your dancer will be ' + age + ' that day. Still want it?';
      }
    }
    return '';
  }

  // When the date of birth fits every class that has an age range, say so
  // (2026-11-07). The warning and its box are unchanged.
  function renderAgeNote() {
    if (!elAgeNote || !elDob) return;
    var cart = readCart();
    var warn = ageNoteText(cart, elDob.value);
    var ok = '';
    if (!warn && cart.length && ageOn(elDob.value, cart[0].date) != null &&
        cart.some(function (l) { return parseBand(lineBand(l)); })) {
      ok = 'Fits every class in this order';
    }
    var text = warn || ok;
    elAgeNote.classList.toggle('is-ok', !warn && !!ok);
    if (elAgeNote.textContent === text) return;
    elAgeNote.textContent = text;
    if (elAgeOk) {
      elAgeOk.hidden = !warn;
      if (elAgeOkBox) elAgeOkBox.checked = false;
    }
  }

  if (elDob) {
    elDob.addEventListener('input', renderAgeNote);
    elDob.addEventListener('change', renderAgeNote);
  }

  elCartCheckoutBtn.addEventListener('click', openCheckout);
  elBack.addEventListener('click', function (e) { e.preventDefault(); leaveCheckout(); });

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
      var msg = fieldProblem(input, c[1]);
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      if (msg && !firstBad) { firstBad = input; firstMsg = msg; }
    });
    if (!firstBad && elAgeOk && !elAgeOk.hidden && elAgeOkBox && !elAgeOkBox.checked) {
      firstBad = elAgeOkBox; firstMsg = 'Check "Yes, book it anyway" to keep a class outside the age range.';
    }
    var waiverEl = document.getElementById('sched-waiver');
    if (!firstBad && !waiverEl.checked) { firstBad = waiverEl; firstMsg = 'Check the waiver box to continue.'; }
    // A cart from before the same-time check, or one another tab filled.
    if (!firstBad) {
      for (var ci = 0; ci < cart.length; ci++) {
        var other = cartClash(cart[ci]);
        if (other) {
          firstBad = elPayBtn;
          firstMsg = cart[ci].name + ' and ' + other.name + ' are at the same time. One dancer can’t be in both, so remove one.';
          break;
        }
      }
    }
    if (firstBad) {
      showFormError(firstBad, firstMsg);
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
    // The free database can take 15 s or more when it is busy; a button that
    // still says "One second" by then reads as frozen.
    var slowTimer = setTimeout(function () { elPayBtn.textContent = 'Still working\u2026'; }, 6000);

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
        clearTimeout(slowTimer);
        if (r.ok && r.json && r.json.url) {
          track('dropin-checkout:ok');
          window.top.location.href = r.json.url;
          return;
        }
        track('dropin-checkout:err');
        elPayBtn.disabled = false;
        elPayBtn.textContent = prevLabel;
        elError.hidden = false;
        elError.removeAttribute('data-kind');
        elError.textContent = familyError(r.json && r.json.error);
        // Past lines are pruned before checkout opens; if the server still
        // names one, drop it only when it can actually be matched.
        var bad = r.json && r.json.line;
        if (bad && typeof bad === 'object' && bad.class_id) {
          var before = readCart().length;
          if (cartRemove(bad.class_id, bad.occurrence_date).length < before) {
            renderNotice('That class closed since you added it, so it left your cart.');
            if (!readCart().length) leaveCheckout(); else renderSummary();
          }
        }
      })
      .catch(function () {
        clearTimeout(slowTimer);
        track('dropin-checkout:err');
        elPayBtn.disabled = false;
        elPayBtn.textContent = prevLabel;
        elError.hidden = false;
        elError.removeAttribute('data-kind');
        elError.textContent = "That didn't go through. Nothing was charged. Try again.";
      });
  });

  // ── Form errors (persona pass 2026-10-31) ──
  // A field's message sits under that field. It used to sit under Pay, which
  // was off-screen once focus jumped to the first empty field, so a phone saw
  // red boxes and no words. The waiver and cart messages stay under Pay,
  // which is where the parent is looking when they show.
  function fieldProblem(input, emptyMsg) {
    var v = input.value.trim();
    if (!v) return emptyMsg;
    if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return "That email doesn't look right. The receipt goes there.";
    }
    if (input.id === 'sched-dancer-dob') {
      var age = ageOn(v, toIso(new Date()));
      // drop_in_order_create refuses outside 3 to 25; say so before the round trip.
      if (age == null || age < 3 || age > 25) return "Check the dancer's date of birth.";
    }
    if (input.type === 'tel' && v.replace(/\D/g, '').length < 10) {
      return 'Add the phone number with its area code, in case class moves.';
    }
    return '';
  }

  function fieldErrorSlot(input) {
    var id = input.id + '-error';
    var slot = document.getElementById(id);
    if (!slot) {
      slot = el('p', 'sched-field-error');
      slot.id = id;
      slot.setAttribute('role', 'alert');
      (input.closest('.field') || input.parentElement).appendChild(slot);
      var desc = input.getAttribute('aria-describedby') || '';
      if (desc.split(' ').indexOf(id) === -1) input.setAttribute('aria-describedby', (desc + ' ' + id).trim());
    }
    return slot;
  }

  function clearFormErrors() {
    elForm.querySelectorAll('.sched-field-error').forEach(function (p) { p.textContent = ''; });
    elError.hidden = true;
    elError.removeAttribute('data-kind');
  }

  function showFormError(target, msg) {
    clearFormErrors();
    if (target.matches && target.matches('.field input')) {
      fieldErrorSlot(target).textContent = msg;
    } else {
      elError.hidden = false;
      elError.textContent = msg;
      elError.setAttribute('data-kind', target.id === 'sched-waiver' ? 'waiver' : 'cart');
    }
    if (target === elPayBtn) return;
    // focus() leaves a field the browser counts as on screen where it is, even
    // under the topnav; place it below (scroll-margin-top in site.css).
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
    var r = target.getBoundingClientRect();
    var below = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    if (r.top < below || r.bottom > window.innerHeight) target.scrollIntoView({ block: 'start' });
  }

  // A message goes the moment its field is fixed, not on the next Pay.
  function clearFixed(e) {
    var t = e.target;
    if (!t || !t.id) return;
    if (t.id === 'sched-waiver') {
      if (t.checked && elError.getAttribute('data-kind') === 'waiver') { elError.hidden = true; elError.removeAttribute('data-kind'); }
      return;
    }
    var slot = document.getElementById(t.id + '-error');
    if (slot && slot.textContent && !fieldProblem(t, slot.textContent)) {
      slot.textContent = '';
      t.removeAttribute('aria-invalid');
    }
  }
  elForm.addEventListener('input', clearFixed);
  elForm.addEventListener('change', clearFixed);

  // A sentence written for families (drop_in_order_create's RAISE lines) comes
  // through as it is. Anything else gets plain words: on 2026-10-31 a busy
  // database's own "canceling statement due to statement timeout" reached the
  // page. Nothing is charged before Stripe, so the line can say so.
  function familyError(msg) {
    var m = String(msg || '').trim();
    var written = /^[A-Z]/.test(m) && /[.!?]$/.test(m) &&
      !/statement|timeout|violates|constraint|relation|column|function|syntax|permission|deadlock|JWT|null value|ERROR/.test(m);
    return written ? m : "We couldn't hold your spot just now. Nothing was charged. Try again in a minute.";
  }

  // ── Add to calendar: one .ics per class, studio time (2026-11-07) ──
  function icsStamp(dateIso, t) {
    return String(dateIso).slice(0, 10).replace(/-/g, '') + 'T' + String(t || '00:00').slice(0, 5).replace(':', '') + '00';
  }
  function icsEscape(s) { return String(s || '').replace(/([,;\\])/g, '\\$1'); }
  function icsHref(line) {
    var now = new Date();
    var stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    var end = line.end_time || (function () {
      var m = minutesOf(line.start_time) + 60;
      return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    })();
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dance With Dixon//Drop-in//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + icsStamp(line.date, line.start_time) + '-' + slugify(line.name) + '@dancewithdixon.com',
      'DTSTAMP:' + stamp,
      'DTSTART;TZID=America/New_York:' + icsStamp(line.date, line.start_time),
      'DTEND;TZID=America/New_York:' + icsStamp(line.date, end),
      'SUMMARY:' + icsEscape(line.name + ' (Dance With Dixon)'),
      'LOCATION:' + icsEscape('Exchange Dance Studio, 7409 Chancery Lane, Orlando, FL 32809'),
      'DESCRIPTION:' + icsEscape('Arrive ten minutes early. All black, form-fitting. Bring water.'),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  }

  // ── Return from Stripe ──
  // drop_in_order_public answers ONE row per order: status,
  // dancer_first_name, amount_cents (what Stripe charged), bulk_applied, and
  // lines [{date, name, start_time, end_time, room}], which carry no price.
  // (Until 2026-10-04 this read one row per class, the stub's old shape, and
  // every paid family saw "See you undefined" and a $0 total.)
  function renderThankyou(order) {
    elMain.hidden = true;
    if (elPending) elPending.hidden = true;
    elCheckout.hidden = true;
    elCartBar.hidden = true;
    closeSheet();
    elThankyou.hidden = false;

    var lines = (order && Array.isArray(order.lines)) ? order.lines.slice().sort(byStart) : [];
    var dancerFirstName = (order && order.dancer_first_name) || null;
    var days = {};
    lines.forEach(function (l) { days[String(l.date).slice(0, 10)] = true; });
    var dayKeys = Object.keys(days);
    if (dayKeys.length === 1) {
      var d = localDate(dayKeys[0]);
      elTyH1.textContent = 'See you ' + DAY_NAMES_LONG[d.getDay()] + (dancerFirstName ? ', ' + dancerFirstName : '') + '.';
    } else {
      elTyH1.textContent = 'See you soon.';
    }
    if (elTyLede) {
      elTyLede.hidden = !lines.length;
      elTyLede.textContent = (dancerFirstName || 'Your dancer') + ' is booked for ' + word(lines.length) + (lines.length === 1 ? ' class.' : ' classes.');
    }

    elTyList.innerHTML = '';
    lines.forEach(function (r) {
      var d = localDate(r.date);
      var nm = splitName(r.name);
      var li = el('li', 'bk-tk');
      li.style.setProperty('--tone', toneVar(r.date, isTgRow(r)));
      var db = el('span', 'bk-tk-d');
      db.appendChild(el('b', '', String(d.getDate())));
      db.appendChild(el('span', '', DAY_SHORT[d.getDay()].toUpperCase() + ' ' + MONTHS_SHORT[d.getMonth()].toUpperCase()));
      li.appendChild(db);
      var m = el('span', 'bk-tk-m');
      m.appendChild(el('b', '', nm.cls));
      m.appendChild(el('small', '', [nm.teacher ? 'with ' + nm.teacher : '', timeRange(r.start_time, r.end_time), roomWords(r.room)].filter(Boolean).join(' · ')));
      li.appendChild(m);
      var cal = el('a', 'bk-cal tap-44', 'Add to calendar');
      cal.href = icsHref(r);
      cal.setAttribute('download', 'dwd-' + slugify(nm.cls) + '-' + String(r.date).slice(0, 10) + '.ics');
      cal.setAttribute('data-track', 'dropin-add-calendar');
      li.appendChild(cal);
      elTyList.appendChild(li);
    });
    renderBulkNote(elTyBulkNote, (order && order.bulk_applied) ? 'Four or more dates in one order. Each one costs less.' : '');
    elTyTotal.textContent = money(order ? order.amount_cents : 0);
    elTyTotal.parentNode.hidden = !order;

    writeCart([]);
    jumpToTop(elTyH1);
  }

  function pollPending(id, token, attempt) {
    if (attempt > 20) {
      renderThankyou(null);
      elTyH1.textContent = 'Paid.';
      var fallback = el('p', '', "If your spot doesn't show in the Director's roll by tomorrow, email dancewithdixon@gmail.com.");
      elThankyou.appendChild(fallback);
      return;
    }
    setTimeout(function () {
      fetchOrder(id, token).then(function (rows) {
        var status = rows[0] && rows[0].status;
        if (status === 'paid') { renderThankyou(rows[0]); return; }
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
          if (!cart.length) cart = buildStubRows(toIso(mondayOf(0)), 0).filter(function (r) { return r.drop_in_open; }).slice(0, 2);
          // Same shape as drop_in_order_public: one row, the classes in lines.
          resolve([{
            status: 'paid', dancer_first_name: 'Remi',
            amount_cents: cartTotalCents(cart), bulk_applied: bulkActive(cart),
            lines: cart.map(function (l) {
              return { date: l.occurrence_date, name: l.name, start_time: l.start_time, end_time: l.end_time, room: 'Garage' };
            })
          }]);
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

    if (elPanel) elPanel.classList.add('is-loading');
    fetchOrder(order, token).then(function (rows) {
      var status = rows.length ? rows[0].status : null;
      if (status === 'paid') {
        renderThankyou(rows[0]);
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
        loadDays();
      }
    }).catch(function (err) {
      console.warn('order lookup:', err && err.message);
      loadDays();
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
    setStick();
    applyCampaign(); // hides the band after its last day even if the feed fails
    renderOrder();
    var returning = handleReturn();
    if (new URLSearchParams(location.search).get('order') === 'stub') {
      // QA hook for the thank-you screenshot against the stub, per the brief's
      // verification step (checks thankyou_renders_from_rpc_or_stub).
    } else if (!returning) {
      loadDays();
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
