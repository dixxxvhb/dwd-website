/* ═══════════════════════════════════════════════
   DWD — dwdc-next.js
   The Collective's "Next class" block.

   Reads public_site_dwdc_events (anon-readable view, mig 317): upcoming,
   non-cancelled adult-program events out of the Director app's calendar.
   Dixon puts a class on that calendar with program=adult and this block
   fills itself in. Nothing here writes.

   The empty state is the markup default in index.html, not something this
   file paints. That matters: if the fetch fails, the CDN is blocked, or the
   view returns nothing, the page still reads as a finished page rather than
   an empty box. This script only ever ADDS a real class.

   Since 2026-09-24 the block sits in the Collective's joining screen, right
   above the page's one "Join the Collective" button. A found class puts its
   DATE first and biggest, in the spot the empty line held, and adds no
   button of its own: the page already has the one action. It also hands the
   phone sticky bar its "Next class" line (js/now.js used to, from a Home
   block that no longer exists).
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var block = document.getElementById('dwdc-next-class');
  if (!block) return;

  var sb = window.__dwd_sb;
  if (!sb) return; // supabase-js unavailable — the empty state stands

  var MAIN = block.querySelector('[data-dnc-main]');
  var MORE = block.querySelector('[data-dnc-more]');

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* Parse YYYY-MM-DD as a LOCAL date. `new Date('2026-09-14')` is parsed as
     UTC midnight, which in Eastern is the evening of the 13th — the class
     would advertise the wrong day. Build it from parts instead. */
  function localDate(iso) {
    if (!iso) return null;
    var m = String(iso).slice(0, 10).split('-');
    if (m.length !== 3) return null;
    var d = new Date(Number(m[0]), Number(m[1]) - 1, Number(m[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  /* "2:00 pm" from "14:00:00". Returns null for anything unparseable so the
     caller can just leave the time off rather than print "NaN:NaN". */
  function timeLabel(t) {
    if (!t) return null;
    var m = String(t).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    var h = Number(m[1]);
    var min = m[2];
    var mer = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ':' + min + ' ' + mer;
  }

  function longDate(d) {
    return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
  }

  function shortDate(d) {
    return MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
  }

  /* Date line: "Sunday, September 14 · 2:00 pm", or a range when the event
     spans days, or just the day when it is all-day / has no start time. */
  function dateLine(row) {
    var start = localDate(row.date);
    if (!start) return null;
    var end = localDate(row.end_date);
    var line = longDate(start);
    if (end && end.getTime() > start.getTime()) {
      line += ' to ' + shortDate(end);
      return line;
    }
    if (row.all_day) return line;
    var t = timeLabel(row.start_time);
    if (!t) return line;
    line += ' · ' + t;
    var te = timeLabel(row.end_time);
    if (te) line += ' to ' + te;
    return line;
  }

  function venueLine(row) {
    var bits = [];
    if (row.location_name) bits.push(row.location_name);
    if (row.location_address) bits.push(row.location_address);
    return bits.length ? bits.join(' · ') : null;
  }

  /* The published drop-in price is $15 (see the Cost row above it). Only
     override it when the calendar row actually carries a price, and never
     invent one: a null price means the standing price applies. */
  function priceLine(row) {
    if (typeof row.price_cents === 'number' && row.price_cents > 0) {
      var d = row.price_cents / 100;
      var txt = (d % 1 === 0) ? String(d) : d.toFixed(2);
      return '$' + txt + ' drop-in, pay at class';
    }
    if (row.price_cents === 0) return 'Free, just show up';
    return '$15 drop-in, pay at class';
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* Date first and biggest: when is the question an adult came here with.
     Then what it is, where, and the price, quieter. */
  function renderHero(row) {
    var frag = document.createDocumentFragment();

    frag.appendChild(el('span', 'dnc-eyebrow', 'Next class'));

    var dl = dateLine(row);
    if (dl) frag.appendChild(el('p', 'dnc-date', dl));

    frag.appendChild(el('p', 'dnc-title', row.title || 'Collective class'));

    var vl = venueLine(row);
    if (vl) frag.appendChild(el('p', 'dnc-venue', vl));

    frag.appendChild(el('p', 'dnc-price', priceLine(row)));

    MAIN.textContent = '';
    MAIN.appendChild(frag);
  }

  function renderMore(rows) {
    if (!rows.length) {
      MORE.hidden = true;
      return;
    }
    MORE.textContent = '';
    rows.forEach(function (row) {
      var li = el('li', 'dnc-more-item');
      var d = localDate(row.date);
      li.appendChild(el('span', 'dnc-more-date', d ? shortDate(d) : ''));
      li.appendChild(el('span', 'dnc-more-title', row.title || 'Collective class'));
      var t = row.all_day ? null : timeLabel(row.start_time);
      if (t) li.appendChild(el('span', 'dnc-more-time', t));
      MORE.appendChild(li);
    });
    MORE.hidden = false;
  }

  /* The phone sticky bar on /collective/ quotes the next class. main.js owns
     the bar's words; this only hands it a truer line. */
  function renderBar(row) {
    var label = document.querySelector('#mob-cta [data-mob-label]');
    var d = localDate(row.date);
    if (!label || !d) return;
    var t = row.all_day ? null : timeLabel(row.start_time);
    label.setAttribute('data-mob-collective',
      'Next class · ' + DAYS[d.getDay()].slice(0, 3) + ' ' + shortDate(d) + (t ? ' · ' + t : ''));
    if (window.DWD_MOB && window.DWD_MOB.repaint) window.DWD_MOB.repaint();
  }

  sb.from('public_site_dwdc_events')
    .select('*')
    .limit(3)
    .then(function (res) {
      if (res.error) {
        // Silent: the empty state in the markup is a correct page.
        console.warn('dwdc next class:', res.error.message);
        return;
      }
      /* The view already returns upcoming classes only; this is a belt for
         the day a class ran this morning and the view has not rolled over. */
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var rows = (res.data || []).filter(function (r) {
        var last = r && localDate(r.end_date || r.date);
        return last && last.getTime() >= today.getTime();
      });
      if (!rows.length) return;

      rows.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });

      block.dataset.state = 'live';
      renderHero(rows[0]);
      renderMore(rows.slice(1));
      renderBar(rows[0]);
    });
})();
