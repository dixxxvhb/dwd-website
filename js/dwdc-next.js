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
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var block = document.getElementById('dwdc-next-class');
  if (!block) return;

  var sb = window.__dwd_sb;
  if (!sb) return; // supabase-js unavailable — the empty state stands

  var MAIN = block.querySelector('[data-dnc-main]');
  var MORE = block.querySelector('[data-dnc-more]');
  var BAND_TITLE = document.querySelector('[data-dnc-band-title]');

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

  /* The published drop-in price is $15 (see the Cost to Dance block). Only
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

  function renderHero(row) {
    var frag = document.createDocumentFragment();

    var title = el('h3', 'dnc-title', row.title || 'Collective class');
    frag.appendChild(title);

    var dl = dateLine(row);
    if (dl) frag.appendChild(el('p', 'dnc-date', dl));

    var vl = venueLine(row);
    if (vl) frag.appendChild(el('p', 'dnc-venue', vl));

    frag.appendChild(el('p', 'dnc-price', priceLine(row)));

    var cta = el('a', 'btn btn-outline dnc-cta');
    cta.href = '#contact?reason=adult';
    cta.setAttribute('data-track', 'dwdc-next-class-save');
    cta.innerHTML = 'Save my spot <em>&rarr;</em>';
    frag.appendChild(cta);

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

  function renderBand(row) {
    if (!BAND_TITLE) return;
    var d = localDate(row.date);
    if (!d) return;
    BAND_TITLE.textContent = 'Next up: ' + (row.title || 'a Collective class') +
      ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + '.';
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
      var rows = (res.data || []).filter(function (r) { return r && r.date; });
      if (!rows.length) return;

      rows.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });

      block.dataset.state = 'live';
      renderHero(rows[0]);
      renderMore(rows.slice(1));
      renderBand(rows[0]);
    });
})();
