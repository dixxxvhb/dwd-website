/* ═══════════════════════════════════════════════
   DWD — tracks.js
   The ProSeries track panels' Weekly Schedule, read from the Director
   (Dixon, 2026-10-30: "Read from the Director", rehearsals count).

   Source: public_site_schedule, every row (drop-in open or not, rehearsals
   included), sorted into tracks by track_label: "Prep", "Elite", "Pro",
   "Elite + Pro", "All tracks". No read of its own when it can help it:
   js/now.js exposes its 21-day read as window.__dwd_schedule21, and that
   always covers the two weeks used here. Only if it does not (or is
   missing) does this file read exactly those two weeks.

   Which week: a representative one. The two weeks starting next Monday
   (studio date), and for each weekday whichever of the two has more rows
   for that track, so a holiday week or a one-off cancellation does not
   empty a day.

   What it writes, per track:
     [data-week]             the schedule section's day blocks
     [data-week-hours]       "5 hrs" (tab meta and panel meta, one total)
     [data-week-days]        "Three days" (the description)
     [data-week-hours-word]  "Nine hours" (the description)

   Progressive enhancement, same contract as now.js and episodes.js: the
   typed markup is what this renders today, so no-JS readers and search
   engines read the same week. Feed down, a track with no rows, JS off:
   the typed week stands. Nothing here writes to the database.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var section = document.querySelector('.track-detail-section');
  if (!section) return;

  var sb = window.__dwd_sb;
  if (!sb) return; // supabase-js unavailable — the typed week stands

  var TRACKS = ['prep', 'elite', 'pro'];
  var LABEL = { prep: 'Prep', elite: 'Elite', pro: 'Pro' };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
  var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
               'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

  /* Same helpers, same reasons, as js/now.js: dates parse as LOCAL dates
     (a UTC midnight is the previous evening in Eastern), and "today" is the
     studio's today, not the visitor's. */
  function localDate(iso) {
    if (!iso) return null;
    var m = String(iso).slice(0, 10).split('-');
    if (m.length !== 3) return null;
    var d = new Date(Number(m[0]), Number(m[1]) - 1, Number(m[2]));
    return isNaN(d.getTime()) ? null : d;
  }

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

  /* Minutes since midnight, or null. */
  function minutes(t) {
    var m = String(t || '').match(/^(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  /* "5:00". Each Weekly Schedule heading says "All times pm" (2026-10-31),
     so only a morning slot carries its own "am". */
  function clock(mins) {
    var h = Math.floor(mins / 60) % 12;
    if (h === 0) h = 12;
    var mm = String(mins % 60);
    return h + ':' + (mm.length < 2 ? '0' + mm : mm) + (mins < 720 ? ' am' : '');
  }

  /* 2.75 -> "2.75 hrs", 1 -> "1 hr" */
  function hoursLabel(h) {
    var n = Math.round(h * 100) / 100;
    return n + (n === 1 ? ' hr' : ' hrs');
  }

  /* Match the typed word's case: "Three" at a sentence start, "three" inside. */
  function cased(word, like) {
    var up = like && like.charAt(0) === like.charAt(0).toUpperCase();
    return up ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  }

  /* 9 -> "nine hours", 10.5 -> "ten and a half hours", 9.25 -> null (the
     typed words stand rather than a sentence that opens on "9.25"). */
  function hoursWords(h) {
    var n = Math.round(h * 100) / 100;
    var whole = Math.floor(n);
    if (!WORDS[whole]) return null;
    if (n === whole) return WORDS[whole] + (whole === 1 ? ' hour' : ' hours');
    if (n - whole === 0.5) return WORDS[whole] + ' and a half hours';
    return null;
  }

  /* track_label -> the tracks it trains. "Elite + Pro" is both, "All tracks"
     is all three. Anything unrecognised belongs to no track. */
  function tracksOf(label) {
    var s = String(label || '').toLowerCase();
    if (/\ball\b/.test(s)) return TRACKS.slice();
    var out = [];
    s.split(/[+\/,&]/).forEach(function (p) {
      p = p.replace(/\bonly\b/, '').trim();
      if (LABEL[p] && out.indexOf(p) < 0) out.push(p);
    });
    return out;
  }

  /* One track's representative week: [{ dow, hours, slots: [...] }]. */
  function weekFor(track, rows, weekStart) {
    var weekTwo = addDays(weekStart, 7);
    var weekEnd = addDays(weekStart, 13);
    var byDay = {}; // dow -> [rows in week one, rows in week two]
    var shares = false;
    rows.forEach(function (r) {
      var iso = String(r && (r.date || r.occurrence_date) || '').slice(0, 10);
      if (!iso || iso < weekStart || iso > weekEnd) return;
      var ts = tracksOf(r.track_label);
      if (ts.indexOf(track) < 0) return;
      var a = minutes(r.start_time), b = minutes(r.end_time);
      if (a == null || b == null || b <= a) return;
      var d = localDate(iso);
      if (!d) return;
      var all = ts.length === TRACKS.length;
      if (!all && ts.length > 1) shares = true;
      var dow = d.getDay();
      byDay[dow] = byDay[dow] || [[], []];
      byDay[dow][iso >= weekTwo ? 1 : 0].push({
        name: String(r.name || '').trim(), start: a, end: b, all: all, only: ts.length === 1
      });
    });

    var week = [];
    WEEK_ORDER.forEach(function (dow) {
      if (!byDay[dow]) return;
      var pick = byDay[dow][1].length > byDay[dow][0].length ? byDay[dow][1] : byDay[dow][0];
      if (!pick.length) return;
      pick.sort(function (x, y) {
        return (x.start - y.start) || (x.end - y.end) || x.name.localeCompare(y.name);
      });
      /* Hours are the time on the floor: overlapping rows count once. */
      var total = 0, runStart = null, runEnd = null;
      pick.forEach(function (s) {
        if (runEnd == null || s.start > runEnd) {
          if (runEnd != null) total += runEnd - runStart;
          runStart = s.start; runEnd = s.end;
        } else if (s.end > runEnd) {
          runEnd = s.end;
        }
      });
      if (runEnd != null) total += runEnd - runStart;
      week.push({ dow: dow, hours: total / 60, slots: pick });
    });
    week.shares = shares;
    return week;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* The typed markup, node for node: day head, then one li per slot. "All"
     marks an all-tracks block. "<Track> Only" marks a block no other track
     takes, on a track that otherwise trains alongside another (Elite and Pro
     share most of their week; Prep shares only the all-tracks block, so it
     carries none), and not when the name already says it ("Elite Rehearsal"). */
  function dayBlock(track, day, shares) {
    var block = el('div', 'td-day-block');
    var head = el('div', 'td-day-head');
    head.appendChild(el('span', 'td-day-name', DAYS[day.dow]));
    head.appendChild(el('span', 'td-day-hours', hoursLabel(day.hours)));
    block.appendChild(head);
    var ul = el('ul', 'td-slots');
    day.slots.forEach(function (s) {
      var li = el('li');
      li.appendChild(el('span', 'td-slot-time', clock(s.start) + ' to ' + clock(s.end)));
      var name = el('span', 'td-slot-name', s.name);
      var tag = null;
      if (s.all) tag = el('span', 'td-tag td-tag-all', 'All');
      else if (s.only && shares && !new RegExp('\\b' + track + '\\b', 'i').test(s.name)) {
        tag = el('span', 'td-tag', LABEL[track] + ' Only');
      }
      if (tag) {
        name.appendChild(document.createTextNode(' '));
        name.appendChild(tag);
      }
      li.appendChild(name);
      ul.appendChild(li);
    });
    block.appendChild(ul);
    return block;
  }

  /* What a reader sees, for the "already says this" check. Read part by
     part: the typed markup has whitespace between its tags, the render has
     none, so a plain textContent would never match. */
  function said(blocks) {
    return Array.prototype.map.call(blocks, function (b) {
      var parts = b.querySelectorAll('.td-day-name, .td-day-hours, .td-slot-time, .td-slot-name');
      return Array.prototype.map.call(parts, function (n) {
        return n.textContent.replace(/\s+/g, ' ').trim();
      }).join(' / ');
    }).join(' | ');
  }

  function setWords(sel, text) {
    if (!text) return;
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (n) {
      var next = cased(text, n.textContent);
      if (n.textContent !== next) n.textContent = next;
    });
  }

  function render(rows, weekStart) {
    TRACKS.forEach(function (track) {
      var week = weekFor(track, rows, weekStart);
      if (!week.length) return; // nothing scheduled: the typed week stands

      var total = week.reduce(function (sum, d) { return sum + d.hours; }, 0);
      setWords('[data-week-hours="' + track + '"]', hoursLabel(total));
      setWords('[data-week-hours-word="' + track + '"]', hoursWords(total));
      var n = week.length;
      setWords('[data-week-days="' + track + '"]',
        WORDS[n] ? WORDS[n] + (n === 1 ? ' day' : ' days') : null);

      var host = document.querySelector('.track-detail[data-track="' + track + '"] [data-week]');
      if (!host) return;
      var fresh = week.map(function (d) { return dayBlock(track, d, week.shares); });
      var typed = host.querySelectorAll('.td-day-block');
      /* Same words already on the page (the usual case, since the typed week
         is today's): leave the DOM alone, so nothing repaints or shifts. */
      if (said(typed) === said(fresh)) return;
      Array.prototype.forEach.call(typed, function (b) { b.parentNode.removeChild(b); });
      var before = host.querySelector('.td-schedule-link');
      fresh.forEach(function (b) { host.insertBefore(b, before); });
    });
  }

  var fired = false;

  function load() {
    if (fired) return;
    fired = true;

    var today = nyToday();
    if (!today) return;
    var d = localDate(today);
    var weekStart = addDays(today, ((8 - d.getDay()) % 7) || 7); // next Monday
    var weekEnd = addDays(weekStart, 13);

    var shared = window.__dwd_schedule21;
    var read = (typeof shared === 'function' && shared.from && shared.to &&
                shared.from <= weekStart && shared.to >= weekEnd)
      ? shared()
      : sb.rpc('public_site_schedule', { p_from: weekStart, p_to: weekEnd })
          .then(function (res) {
            if (res.error) { console.warn('track weeks:', res.error.message); return null; }
            return res.data || [];
          }, function (err) {
            console.warn('track weeks:', err && err.message);
            return null;
          });
    read.then(function (rows) {
      if (rows && rows.length) render(rows, weekStart);
    });
  }

  /* Every route shell carries the panels, so the read waits until they are
     actually near the viewport (hidden routes never intersect), the same
     gate now.js uses for the DROP IN panel. */
  if (typeof IntersectionObserver !== 'function') {
    load();
  } else {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { io.disconnect(); load(); return; }
      }
    }, { rootMargin: '600px 0px' });
    io.observe(section);
  }
})();
