/* ═══════════════════════════════════════════════
   DWD — episodes.js
   The Season One Episode Guide, rendered from the Director calendar.

   Reads public_site_episodes (anon-readable view, mig 317): posted or
   confirmed competitions and conventions for the season, plus drafts Dixon
   has shared with parents. Nothing here writes.

   Shape of the list:
     S1:E1  The Premiere   — hardcoded in the markup, always first
     S1:E2… one row per view row, in date order
     S1:FINALE             — hardcoded in the markup, always last

   The static rows between those two are the fallback. If the fetch fails,
   the CDN is blocked, or the view comes back empty, they stay exactly as
   they are and the section reads as it always has. This file only ever
   replaces them with something better.

   Recaps: data/episodes.json is keyed by the view row's id and may carry
   { line, recap_url, photo } per episode. Dixon edits that file by hand
   after a comp; there is deliberately no admin UI for it.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var list = document.querySelector('[data-episode-list]');
  if (!list) return;

  var sb = window.__dwd_sb;
  if (!sb) return; // supabase-js unavailable — static rows stand

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* Parse YYYY-MM-DD as a LOCAL date. `new Date('2026-09-20')` is UTC
     midnight, which in Eastern is the evening of the 19th; an episode would
     advertise the wrong day and could read as "aired" a day early. */
  function localDate(iso) {
    if (!iso) return null;
    var parts = String(iso).slice(0, 10).split('-');
    if (parts.length !== 3) return null;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  function midnightToday() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  /* "Sep 20, 2026" · "Oct 16 to 18, 2026" · "Feb 28 to Mar 2, 2027" */
  function dateRange(startISO, endISO) {
    var a = localDate(startISO);
    if (!a) return '';
    var b = localDate(endISO);
    var head = MONTHS[a.getMonth()] + ' ' + a.getDate();
    if (!b || b.getTime() <= a.getTime()) {
      return head + ', ' + a.getFullYear();
    }
    var tail = (b.getMonth() === a.getMonth())
      ? String(b.getDate())
      : MONTHS[b.getMonth()] + ' ' + b.getDate();
    return head + ' to ' + tail + ', ' + b.getFullYear();
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* Optional competition mark, 20px to the left of the title.
     Nothing ships in images/comps/ today. Those are third-party competition
     logos and putting them on Dixon's site is his call, not this script's.

     To turn one on: put images/comps/<slug>.svg in the repo and add the slug
     to this list. The list exists so the page never speculatively requests a
     file that is not there — an onerror fallback works, but it costs a 404 per
     episode in the console and the network log, which is exactly the kind of
     noise that hides a real error later.

     Slugs currently in the view: titans-of-dance, jump, starquest,
     dreammaker, showstopper. The brand kit at
     _brand/comp-brands/assets/ has raster logos for all of them. */
  var COMP_MARKS = [];

  function markFor(slug) {
    if (!slug || COMP_MARKS.indexOf(slug) === -1) return null;
    var img = document.createElement('img');
    img.className = 's1-ep-mark';
    img.src = 'images/comps/' + slug + '.svg';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.width = 20;
    img.height = 20;
    img.loading = 'lazy';
    return img;
  }

  function buildRow(row, code, state, recap) {
    var wrap = el('div', 's1-ep s1-ep--live');
    if (state === 'aired') wrap.classList.add('s1-ep--aired');
    if (state === 'next') wrap.classList.add('s1-ep--next');

    wrap.appendChild(el('span', 's1-ep-code', code));

    var title = el('span', 's1-ep-title');
    var mark = markFor(row.brand_slug);
    if (mark) title.appendChild(mark);
    title.appendChild(document.createTextNode(row.name || 'Competition'));
    if (state === 'next') {
      title.appendChild(el('span', 's1-ep-flag', 'Up next'));
    }
    wrap.appendChild(title);

    var bits = [];
    var when = dateRange(row.start_date, row.end_date);
    if (state === 'aired' && when) bits.push('Aired ' + when);
    else if (when) bits.push(when);
    if (row.location) bits.push(row.location);
    var meta = el('span', 's1-ep-meta', bits.join(' · '));
    wrap.appendChild(meta);

    if (recap && recap.line) {
      var note = el('p', 's1-ep-recap');
      note.appendChild(document.createTextNode(recap.line));
      if (recap.recap_url) {
        var a = el('a', 's1-ep-recap-link', 'See the recap →');
        a.href = recap.recap_url;
        a.target = '_blank';
        a.rel = 'noopener';
        note.appendChild(document.createTextNode(' '));
        note.appendChild(a);
      }
      wrap.appendChild(note);
    }

    return wrap;
  }

  function render(rows, recaps) {
    var today = midnightToday();

    rows.sort(function (a, b) {
      return String(a.start_date).localeCompare(String(b.start_date));
    });

    // The first row that has not finished yet is "Up next".
    var nextIndex = -1;
    rows.forEach(function (r, i) {
      if (nextIndex !== -1) return;
      var end = localDate(r.end_date) || localDate(r.start_date);
      if (end && end.getTime() >= today.getTime()) nextIndex = i;
    });

    var finale = list.querySelector('[data-ep-fixed="last"]');
    var frag = document.createDocumentFragment();

    rows.forEach(function (r, i) {
      var end = localDate(r.end_date) || localDate(r.start_date);
      var state = 'plain';
      if (end && end.getTime() < today.getTime()) state = 'aired';
      else if (i === nextIndex) state = 'next';
      frag.appendChild(buildRow(r, 'S1:E' + (i + 2), state, recaps[r.id]));
    });

    // Only now, once the real rows are built, drop the placeholders.
    list.querySelectorAll('[data-ep-static]').forEach(function (n) {
      n.parentNode.removeChild(n);
    });

    if (finale) list.insertBefore(frag, finale);
    else list.appendChild(frag);

    list.setAttribute('data-episode-list', 'live');
  }

  // Recaps are optional and must never block or break the guide.
  var recapsPromise = fetch('data/episodes.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .catch(function () { return {}; });

  Promise.all([
    sb.from('public_site_episodes').select('*'),
    recapsPromise
  ]).then(function (results) {
    var res = results[0];
    var recaps = results[1] || {};
    if (res.error) {
      console.warn('episode guide:', res.error.message);
      return; // static rows stand
    }
    var rows = (res.data || []).filter(function (r) { return r && r.start_date; });
    if (!rows.length) return;
    render(rows, recaps);
  }).catch(function (err) {
    console.warn('episode guide:', err && err.message);
  });
})();
