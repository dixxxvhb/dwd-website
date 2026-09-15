/* ═══════════════════════════════════════════════
   DWD — now.js
   The home page's THIS WEEK block (#now), plus the two small numbers
   elsewhere that have to agree with it.

   Three rows, three sources:
     1. DROP IN    — public_site_schedule(today, today+13), rows where
                     drop_in_open. The next open occurrence wins.
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
  var WINDOW_DAYS = 13;

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

  /* ── Row 1: the next open drop-in ─────────────────────────────────── */
  function renderDropIn(rows) {
    var open = (rows || []).filter(function (r) {
      return r && r.drop_in_open && r.occurrence_date;
    });
    if (!open.length) return; // static fallback stands

    open.sort(function (a, b) {
      return (a.occurrence_date + ' ' + (a.start_time || ''))
        .localeCompare(b.occurrence_date + ' ' + (b.start_time || ''));
    });

    var next = open[0];
    var d = localDate(next.occurrence_date);
    if (!d) return;

    var title = (next.name || 'Drop-in class') +
      ' · ' + DAYS[d.getDay()] + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
    var t = timeLabel(next.start_time);
    if (t) title += ' · ' + t;

    /* Meta: only the pieces the feed actually carries. A null price or a null
       spot count is a fact we do not have, never a zero to print. */
    var bits = [];
    var price = money(next.drop_in_fee_cents);
    if (price) bits.push(price + ' a class');
    var bulk = money(next.drop_in_bulk_fee_cents);
    var min = (typeof next.drop_in_bulk_min === 'number' && next.drop_in_bulk_min > 0)
      ? next.drop_in_bulk_min : 4;
    if (bulk) bits.push(bulk + ' each for ' + min + '+');
    if (typeof next.spots_left === 'number' && next.spots_left > 0) {
      bits.push(next.spots_left + ' spots left');
    }
    /* Distinct later DATES, not later rows: two open classes on one evening
       are one more date to a parent, not two. */
    var dates = {};
    open.forEach(function (r) { dates[r.occurrence_date] = 1; });
    var more = Object.keys(dates).length - 1;
    if (more > 0) bits.push('+ ' + more + ' more open date' + (more === 1 ? '' : 's'));

    var r = row('dropin');
    if (r) {
      setText(r, '[data-now-title]', title);
      if (bits.length) setText(r, '[data-now-meta]', bits.join(' · '));
      var link = r.querySelector('[data-now-link]');
      if (link) link.textContent = 'Book it →';
    }

    /* The phone sticky bar says the same true thing as row 1. main.js owns
       which label is showing; this only hands it a better one. */
    var label = document.querySelector('#mob-cta [data-mob-label]');
    if (label) {
      label.setAttribute('data-mob-dropin', 'This week · ' + (next.name || 'Drop-in') +
        ' ' + DAYS[d.getDay()].slice(0, 3) + (t ? ' ' + t : ''));
      if (window.DWD_MOB && window.DWD_MOB.repaint) window.DWD_MOB.repaint();
    }
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

  var block = document.getElementById('now');
  if (!block) return;

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
    io.observe(block);
  }
})();
