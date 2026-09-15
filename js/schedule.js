/* ═══════════════════════════════════════════════
   DWD — schedule.js
   /schedule/ — live ProSeries schedule + drop-in cart.

   Reads public_site_schedule(p_from, p_to) via window.__dwd_sb.rpc, lets a
   visitor add open (drop-in) classes to a cart, and checks out through the
   drop-in-checkout edge function (Stripe Checkout redirect).

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
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ── Elements ──
  var elH1 = page.querySelector('[data-sched-h1]');
  var elWeekSwitch = page.querySelector('[data-sched-week-switch]');
  var elWeek3Btn = page.querySelector('[data-sched-week-3-label]');
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

  var currentWeekOffset = 0;
  var currentRows = [];
  var droppedNotice = '';

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
    return p.year + '-' + p.month + '-' + p.day + ' ' + p.hour + ':' + p.minute;
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

  // Monday of the week `offset` weeks from this week, computed off the
  // visitor's local calendar date (the switcher labels are about which week,
  // not a precise instant) but row-level "has this passed" always uses NY time.
  function mondayOf(offset) {
    var today = new Date();
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

  function renderNotice(text) {
    if (!text) { elNotice.hidden = true; elNotice.textContent = ''; return; }
    elNotice.hidden = false;
    elNotice.textContent = text;
  }

  function updateWeekLabels() {
    var m2 = mondayOf(2);
    elWeek3Btn.textContent = 'Week of ' + shortDateLabel(m2);
    Array.prototype.forEach.call(elWeekSwitch.querySelectorAll('[data-sched-week]'), function (btn) {
      btn.classList.toggle('active', Number(btn.dataset.schedWeek) === currentWeekOffset);
    });
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

    var visible = rows.filter(function (r) { return !isPast(r.date, r.start_time); });

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
            priceWrap.appendChild(el('div', 'sched-row-bulk', money(row.drop_in_bulk_fee_cents) + ' each for 4+'));
          }
          if (typeof row.spots_left === 'number' && row.spots_left >= 1 && row.spots_left <= 3) {
            priceWrap.appendChild(el('div', 'sched-row-spots', row.spots_left + ' spot' + (row.spots_left === 1 ? '' : 's') + ' left'));
          }
        }
        else if (row.drop_in_opens_on) {
          /* Closed today only because it opens later. One muted line, same
             weight as the row's other facts, and no button beside it. */
          var opensOn = new Date(String(row.drop_in_opens_on).slice(0, 10) + 'T00:00:00');
          if (!isNaN(opensOn.getTime())) {
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
                renderCartBar();
                renderRows(currentRows);
                return;
              }
              var cartNow = readCart();
              if (cartNow.length >= MAX_LINES) {
                renderNotice('Six classes at a time. Check out, then add more.');
                return;
              }
              cartAdd(row);
              renderNotice('');
              renderCartBar();
              renderRows(currentRows);
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

  function loadWeek(offset) {
    currentWeekOffset = offset;
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
      currentRows = rows;
      applyBulkMin(rows);
      var pruned = pruneCart(rows);
      renderCartBar();
      if (pruned.dropped.length) {
        renderNotice(pruned.dropped[0] + ' closed since you added it, so it left your cart.');
      }
      renderRows(rows);
    }).catch(function (err) {
      console.warn('schedule feed:', err && err.message);
      renderError();
    });
  }

  elWeekSwitch.querySelectorAll('[data-sched-week]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      loadWeek(Number(btn.dataset.schedWeek));
    });
  });

  // ── Checkout view ──
  function openCheckout() {
    var cart = readCart();
    if (!cart.length) return;
    elCheckout.hidden = false;
    elCartBar.hidden = true;
    page.querySelector('.sched-header').hidden = true;
    elList.hidden = true;
    elThankyou.hidden = true;
    elError.hidden = true;
    renderSummary();
  }

  function closeCheckout() {
    elCheckout.hidden = true;
    page.querySelector('.sched-header').hidden = false;
    elList.hidden = false;
    renderCartBar();
    loadWeek(currentWeekOffset);
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

    var waiverEl = document.getElementById('sched-waiver');
    if (!waiverEl.checked) {
      elError.hidden = false;
      elError.textContent = 'Check the waiver box to continue.';
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
          window.top.location.href = r.json.url;
          return;
        }
        elPayBtn.disabled = false;
        elPayBtn.textContent = prevLabel;
        elError.hidden = false;
        elError.textContent = (r.json && r.json.error) || 'Something went wrong. Try again.';
        if (r.json && r.json.line) {
          cartRemove(r.json.line, null);
          renderNotice('That class closed since you added it, so it left your cart.');
        }
      })
      .catch(function () {
        elPayBtn.disabled = false;
        elPayBtn.textContent = prevLabel;
        elError.hidden = false;
        elError.textContent = "That didn't go through. Nothing was charged. Try again.";
      });
  });

  // ── Return from Stripe ──
  function renderThankyou(orderRows, dancerFirstName) {
    page.querySelector('.sched-header').hidden = true;
    elList.hidden = true;
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

    fetchOrder(order, token).then(function (rows) {
      if (!rows.length) return; // wrong token — normal schedule stands
      var status = rows[0].status;
      if (status === 'paid') {
        renderThankyou(rows, rows[0].dancer_first_name || null);
      } else if (status === 'pending') {
        page.querySelector('.sched-header').hidden = true;
        elList.hidden = true;
        elList.innerHTML = '<p class="sched-empty-line">Payment received, saving your spot\u2026</p>';
        elList.hidden = false;
        pollPending(order, token, 1);
      }
    }).catch(function (err) {
      console.warn('order lookup:', err && err.message);
    });
    return true;
  }

  // ── Init ──
  var returning = handleReturn();
  if (new URLSearchParams(location.search).get('order') === 'stub') {
    // QA hook for the thank-you screenshot against the stub, per the brief's
    // verification step (checks thankyou_renders_from_rpc_or_stub).
  } else if (!returning) {
    loadWeek(0);
  }
})();
