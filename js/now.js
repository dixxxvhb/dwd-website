/* ═══════════════════════════════════════════════
   DWD — now.js
   The home page's THIS WEEK block (#now), plus the two small numbers
   elsewhere that have to agree with it.

   Three rows, three sources:
     1. DROP IN    — public_site_schedule(today, today+20), rows where
                     drop_in_open. Every weekly drop-in slot is listed.
     2. PROSERIES  — window.DWD_SEASON (js/season.js owns those numbers).
     3. COLLECTIVE — public_site_dwdc_events, the same next-row logic
                     js/dwdc-next.js uses.

   Progressive enhancement, same contract as season.js and dwdc-next.js: the
   markup in index.html already ships a correct static answer for all three
   rows. This file only ever REPLACES a line with something truer. Feed down,
   CDN blocked, Supabase absent, JS off — the block still reads as a finished
   page rather than an empty box. Nothing here writes.

   It also rewrites the phone sticky bar's label when a real open class is
   found, and renders the ProSeries "N of 10 filled" chips from DWD_SEASON.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // The RPC caps one call at 21 days. 20 keeps a class that opens next month
  // (Oct 1 drop-ins seen from late September) in view.
  var WINDOW_DAYS = 20;

  /* Parse YYYY-MM-DD as a LOCAL date. `new Date('2026-09-22')` is UTC
     midnight, which in Eastern is the evening of the 21st, so the row would
     advertise the wrong weekday. Build it from parts. Same helper, same
     reason, as js/dwdc-next.js. */
  function localDate(iso) {
    if (!iso) return null;
    var m = String(iso).slice(0, 10).split('-');
    if (m.length !== 3) return null;
    var d = new Date(Number(m[0]), Number(m[1]) - 1, Number(m[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  /* "4:45" — no meridiem. Every class on this schedule is a weeknight class;
     "4:45 pm" is three characters nobody needs. Returns null for anything
     unparseable so the caller leaves the time off rather than printing NaN. */
  function timeLabel(t) {
    if (!t) return null;
    var m = String(t).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    var h = Number(m[1]) % 12;
    if (h === 0) h = 12;
    return h + ':' + m[2];
  }

  function money(cents) {
    if (typeof cents !== 'number' || cents <= 0) return null;
    var d = cents / 100;
    return '$' + (d % 1 === 0 ? String(d) : d.toFixed(2));
  }

  /* Today in America/New_York as YYYY-MM-DD. The studio is in Orlando; a
     visitor in Seattle must not be shown yesterday's window. */
  function nyToday() {
    var parts = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    if (!parts.year) return null;
    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  function addDays(iso, n) {
    var d = localDate(iso);
    if (!d) return iso;
    d.setDate(d.getDate() + n);
    var mm = String(d.getMonth() + 1);
    var dd = String(d.getDate());
    if (mm.length < 2) mm = '0' + mm;
    if (dd.length < 2) dd = '0' + dd;
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function row(name) {
    var block = document.getElementById('now');
    return block ? block.querySelector('[data-now="' + name + '"]') : null;
  }

  function setText(scope, sel, text) {
    if (!scope || !text) return;
    var el = scope.querySelector(sel);
    if (el) el.textContent = text;
  }

  /* ── Row 2: ProSeries chairs, from DWD_SEASON ─────────────────────────
     Runs first and needs no network, so the one row that can always be
     right is right before anything is awaited. */
  function renderSeason() {
    var S = window.DWD_SEASON;
    if (!S || !S.chairs) return;
    var tracks = ['prep', 'elite', 'pro'];
    var open = {}, total = 0;
    for (var i = 0; i < tracks.length; i++) {
      var c = S.chairs[tracks[i]];
      if (!c) return;
      open[tracks[i]] = c.max - c.filled;
      total += open[tracks[i]];
    }

    var r = row('proseries');
    if (r) {
      var link = r.querySelector('[data-now-link]');
      if (total <= 0) {
        setText(r, '[data-now-meta]', 'Every chair is taken · join the wait list');
        if (link) link.textContent = 'Wait list →';
      } else {
        setText(r, '[data-now-meta]', total + ' chairs open · Prep ' + open.prep +
          ' · Elite ' + open.elite + ' · Pro ' + open.pro);
      }
    }

    /* The ProSeries pricing band's chips: "Prep 5 of 10 filled". The word is
       load-bearing — "5 of 10" under a heading reading "chairs remain" reads
       as five remaining. */
    var chips = document.querySelectorAll('[data-season-filled]');
    Array.prototype.forEach.call(chips, function (el) {
      var t = el.getAttribute('data-season-filled');
      var c = S.chairs[t];
      if (!c) return;
      el.textContent = ((S.label && S.label[t]) || t) + ' ' + c.filled + ' of ' + c.max + ' filled';
    });
  }

  /* ── The DROP IN panel (addendum B) ───────────────────────────────────
     Was row 1 of the ledger; it is now the page's one focal point, rendered
     into every .dropin-feature in the document (home, proseries, schedule —
     same feed, same answer, different kicker and button). Same contract as
     before: this only ever replaces a line with something truer, so a dead
     feed leaves the static panel standing as a correct page. */
  /* "YYYY-MM-DD HH:MM" in the studio's zone, to drop classes that have
     already started (the panel said "Book Tuesday" at 6pm Tuesday). */
  function nyNowStamp() {
    var p = {};
    try {
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    } catch (e) { return ''; }
    return p.year + '-' + p.month + '-' + p.day + ' ' + (p.hour === '24' ? '00' : p.hour) + ':' + p.minute;
  }

  function renderDropIn(rows) {
    var nowStamp = nyNowStamp();
    var today = nyToday();
    /* The day a class actually runs is `date`; occurrence_date is the roll's
       key and differs when a class moved. Started and full classes are not
       for sale, so they never appear. */
    function key(r) {
      return String(r.date || r.occurrence_date).slice(0, 10) + ' ' + String(r.start_time || '').slice(0, 5);
    }
    var open = (rows || []).filter(function (r) {
      if (!r || !r.drop_in_open || !(r.date || r.occurrence_date)) return false;
      if (r.spots_left === 0) return false;
      return !nowStamp || key(r) >= nowStamp;
    });
    if (!open.length) return; // static fallback stands

    /* Every drop-in, not one (Dixon, 2026-09-22: "advertise all drop ins").
       One row per weekly slot (weekday + time + class + track), carrying the
       slot's next bookable date. */
    open.sort(function (a, b) { return key(a).localeCompare(key(b)); });
    var slots = {}, order = [];
    open.forEach(function (r) {
      var d = localDate(r.date || r.occurrence_date);
      if (!d) return;
      var k = d.getDay() + '|' + String(r.start_time).slice(0, 5) + '|' + r.name + '|' + (r.track_label || '');
      if (slots[k]) return; // already holds the earliest date
      slots[k] = { r: r, d: d };
      order.push(k);
    });
    order.sort(function (a, b) {
      var sa = slots[a], sb = slots[b];
      return (sa.d.getDay() - sb.d.getDay()) ||
        String(sa.r.start_time).localeCompare(String(sb.r.start_time));
    });
    if (!order.length) return;

    var fees = order.map(function (k) { return slots[k].r.drop_in_fee_cents; })
      .filter(function (c) { return typeof c === 'number' && c > 0; });
    var minFee = fees.length ? Math.min.apply(null, fees) : null;
    var maxFee = fees.length ? Math.max.apply(null, fees) : null;
    var anyBulk = order.some(function (k) {
      var c = slots[k].r.drop_in_bulk_fee_cents;
      return typeof c === 'number' && c > 0;
    });
    var bulkMin = 4;
    order.forEach(function (k) {
      var m = slots[k].r.drop_in_bulk_min;
      if (typeof m === 'number' && m > 1) bulkMin = m;
    });
    var WORDS = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };

    var price = money(minFee);
    var rangeLine = (maxFee && maxFee > minFee) ? 'to ' + money(maxFee) + ' a class' : 'a class';
    var bulkLine = anyBulk ? 'Less when you book ' + (WORDS[bulkMin] || bulkMin) + ' or more' : null;
    /* A slot whose first bookable date is more than a week out says when it
       starts, so "Tue 4:45 Ballet" in late September is not read as tonight. */
    var soon = today ? addDays(today, 6) : null;

    function buildList(list) {
      while (list.firstChild) list.removeChild(list.firstChild);
      order.forEach(function (k) {
        var r = slots[k].r, d = slots[k].d;
        var li = document.createElement('li');
        li.className = 'dropin-row';
        var when = document.createElement('span');
        when.className = 'dropin-when';
        when.textContent = DAYS[d.getDay()].slice(0, 3) + ' ' + (timeLabel(r.start_time) || '');
        var iso = String(r.date || r.occurrence_date).slice(0, 10);
        if (soon && iso > soon) {
          var starts = document.createElement('span');
          starts.className = 'dropin-starts';
          starts.textContent = 'from ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
          when.appendChild(starts);
        }
        var what = document.createElement('span');
        what.className = 'dropin-what';
        var name = document.createElement('span');
        name.className = 'dropin-name';
        name.textContent = r.name || 'Drop-in class';
        var who = document.createElement('span');
        who.className = 'dropin-who';
        var bits = [];
        if (r.track_label) bits.push(r.track_label);
        if (r.age_band) bits.push(r.age_band);
        if (typeof r.spots_left === 'number' && r.spots_left > 0 && r.spots_left <= 3) {
          bits.push(r.spots_left + (r.spots_left === 1 ? ' spot left' : ' spots left'));
        }
        who.textContent = bits.join(' · ');
        what.appendChild(name);
        if (bits.length) what.appendChild(who);
        var cost = document.createElement('span');
        cost.className = 'dropin-cost';
        cost.textContent = money(r.drop_in_fee_cents) || '';
        li.appendChild(when);
        li.appendChild(what);
        li.appendChild(cost);
        list.appendChild(li);
      });
    }

    var panels = document.querySelectorAll('.dropin-feature');
    Array.prototype.forEach.call(panels, function (panel) {
      if (price) setText(panel, '[data-dropin-price]', price);
      setText(panel, '[data-dropin-range]', rangeLine);
      var bulkEl = panel.querySelector('[data-dropin-bulk]');
      if (bulkEl) {
        if (bulkLine) { bulkEl.textContent = bulkLine; bulkEl.hidden = false; }
        else bulkEl.hidden = true;
      }
      var list = panel.querySelector('[data-dropin-list]');
      if (list) buildList(list);
    });

    /* The sticky bar quotes the same floor price. main.js owns the bar's
       words; this only hands it truer ones. */
    if (price) window.DWD_DROPIN_PRICE = (maxFee > minFee ? 'from ' : '') + price;

    var label = document.querySelector('#mob-cta [data-mob-label]');
    if (label) {
      var only = order.length === 1 ? slots[order[0]] : null;
      label.setAttribute('data-mob-dropin', only
        ? (only.r.name || 'Drop-in') + ' · ' + DAYS[only.d.getDay()].slice(0, 3) + ' ' + (timeLabel(only.r.start_time) || '')
        : order.length + ' drop-in classes every week');
    }
    if (window.DWD_MOB && window.DWD_MOB.repaint) window.DWD_MOB.repaint();
  }

  /* ── Row 3: the Collective's next class ───────────────────────────── */
  function renderCollective(rows) {
    rows = (rows || []).filter(function (r) { return r && r.date; });
    if (!rows.length) return; // static fallback stands
    rows.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });

    var ev = rows[0];
    var d = localDate(ev.date);
    if (!d) return;

    var when = DAYS[d.getDay()] + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
    var t = ev.all_day ? null : timeLabel(ev.start_time);
    if (t) when += ' · ' + t;

    var r = row('collective');
    if (r) {
      setText(r, '[data-now-title]', ev.title || 'Collective class');
      setText(r, '[data-now-meta]', when + ' · $15 at the door');
      var link = r.querySelector('[data-now-link]');
      if (link) link.textContent = 'Details →';
    }

    /* /collective/ gets its own sticky label: the next class, not a drop-in. */
    var label = document.querySelector('#mob-cta [data-mob-label]');
    if (label) {
      label.setAttribute('data-mob-collective',
        'Next class · ' + (ev.title || 'Collective class') + ' · ' + when);
      if (window.DWD_MOB && window.DWD_MOB.repaint) window.DWD_MOB.repaint();
    }
  }

  renderSeason();

  var sb = window.__dwd_sb;
  if (!sb) return; // supabase-js unavailable — every static line stands

  /* #now and the panels all live in the DOM on every route shell, because
     every shell is a copy of the same index.html with a different section
     shown. Observe all of them: on /schedule/ and /proseries/ the panel is the
     visible one and #now never comes near the viewport. */
  var blocks = document.querySelectorAll('#now, .dropin-feature');
  if (!blocks.length) return;

  /* #now lives in the DOM on every route shell, because every shell is a copy
     of the same index.html with a different section shown. Firing two queries
     on /teachers/ to fill a block nobody is looking at is how a schedule RPC
     ends up being called fourteen times in a QA sweep (and 500ing once). So
     the fetch waits until the block is actually near the viewport — which also
     covers arriving on Home by client-side nav, where a route check would not. */
  var fired = false;

  function load() {
    if (fired) return;
    fired = true;

    var from = nyToday();
    if (from) {
      sb.rpc('public_site_schedule', { p_from: from, p_to: addDays(from, WINDOW_DAYS) })
        .then(function (res) {
          if (res.error) {
            // Silent: the static row in the markup is a correct page.
            console.warn('this week drop-ins:', res.error.message);
            return;
          }
          renderDropIn(res.data || []);
        }, function (err) {
          console.warn('this week drop-ins:', err && err.message);
        });
    }

    sb.from('public_site_dwdc_events')
      .select('*')
      .limit(3)
      .then(function (res) {
        if (res.error) {
          console.warn('this week collective:', res.error.message);
          return;
        }
        renderCollective(res.data || []);
      }, function (err) {
        console.warn('this week collective:', err && err.message);
      });
  }

  if (typeof IntersectionObserver !== 'function') {
    load();
  } else {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { io.disconnect(); load(); return; }
      }
    }, { rootMargin: '600px 0px' });
    Array.prototype.forEach.call(blocks, function (b) { io.observe(b); });
  }
})();
