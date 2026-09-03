/* ═══════════════════════════════════════════════
   DWD — eras.js
   The date-gate engine and the Season One state machine.

   Extracted from js/campaign.js on 2026-09-02 (item 3.4). That file was 1,010
   lines, of which roughly 950 were a password-gated dashboard for the April 1
   to May 1, 2026 launch campaign: a rollout that finished four months before
   this split, shipped to every visitor on every page, with its own access code
   sitting in the source. The dashboard and its #page-campaign route are
   deleted; git history has them. What survives is the machinery the live site
   actually depends on.

   Three things live here:

     1. data-reveal-after / data-hide-after. Elements appear and retire on a
        date without anyone redeploying. Registry: docs/ERAS.md.
     2. The Season One state machine. A computed state on <html data-s1-state>
        (premiere / midseason / finale / wrapped), consumed by css/season1.css.
     3. The season clock on #season-one-cta.

   Preview modes: ?launched=1 forces every gate open, ?s1state=<state> forces a
   single Season One state. Both are session-scoped and never persisted.

   THE RULE, from docs/ERAS.md: every new date-bound element ships with its
   end-gate and a row in that registry, in the same commit.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── PROSERIES PROGRESSIVE REVEAL ──
  // Elements with `data-reveal-after` are hidden until the given moment.
  // Format accepts either:
  //   - "YYYY-MM-DD"            → fires at midnight local time (legacy)
  //   - Full ISO with offset    → fires at that exact global moment
  //     e.g. "2026-04-15T12:00:00-04:00" for noon Eastern Daylight Time

  function getTodayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  // Preview helper — `?launched=1` (URL) OR `window.__dwdLaunchPreview = true` (eval)
  // forces every era visible at once (both reveal-after AND hide-after gates).
  // Session-scoped only — neither is ever written to localStorage, so the
  // preview can't outlive the tab. Production never sets these.
  function isLaunchPreview() {
    if (window.__dwdLaunchPreview === true) return true;
    try { return new URLSearchParams(window.location.search).get('launched') === '1'; }
    catch (e) { return false; }
  }

  // Pure date compare — has this attr's moment actually passed? No preview
  // short-circuit here; applyProSeriesReveal() applies the preview override
  // itself so it can treat data-reveal-after and data-hide-after oppositely
  // (preview always REVEALS, never HIDES).
  function dateHasPassed(attr) {
    if (!attr) return true;
    // Full ISO datetime — compare timestamps
    if (attr.indexOf('T') !== -1) {
      var revealMs = new Date(attr).getTime();
      if (isNaN(revealMs)) return false;
      return Date.now() >= revealMs;
    }
    // Legacy date-only — compare local-date string
    return getTodayStr() >= attr;
  }

  // Era preview (see-every-era-at-once) is granted ONLY by isLaunchPreview() —
  // `?launched=1` in the URL, or `window.__dwdLaunchPreview = true` set at eval
  // time. Both are session-scoped: neither persists to localStorage, so the
  // preview never outlives the tab or page load.
  //
  // History worth keeping (A5, 2026-07-10): a browser authenticated into the
  // campaign HQ used to force-reveal every era and suppress every hide, which
  // meant Dixon's own browser never showed him what visitors actually saw. That
  // coupling was cut then; the campaign HQ itself was deleted on 2026-09-02
  // (item 3.4), so nothing outside this file can influence eras any more.
  window.applyProSeriesReveal = function () {
    var preview = isLaunchPreview();

    // A single element frequently carries BOTH attributes now (an era window
    // has a start AND an end — e.g. the Summer Intensive surfaces reveal Jun 12
    // and hide Jul 11). Visibility has to be decided once, as one AND of both
    // conditions — NOT as two independent passes. Two independent passes (the
    // original implementation) is a real bug: whichever selector runs second
    // wins outright, so an element that correctly hid itself because its
    // reveal-after moment hasn't arrived yet gets un-hidden a few lines later
    // by the hide-after pass simply because its hide-after moment ALSO hasn't
    // arrived yet. Found live during A1/A2 verification (2026-07-10) once
    // #season-one-cta — reveal Jul 11, hide Aug 10 — started showing up early.
    document.querySelectorAll('[data-reveal-after], [data-hide-after]').forEach(function (el) {
      var revealAttr = el.dataset.revealAfter;
      var hideAttr = el.dataset.hideAfter;
      var revealed = preview || !revealAttr || dateHasPassed(revealAttr);
      var hidden = !preview && !!hideAttr && dateHasPassed(hideAttr);
      var visible = revealed && !hidden;

      if (visible) {
        el.style.display = '';
        // Hide the corresponding coming-soon banner
        var banner = el.previousElementSibling;
        if (banner && banner.classList.contains('coming-soon-banner')) {
          banner.style.display = 'none';
        }
      } else {
        el.style.display = 'none';
        // Show the coming-soon banner (only meaningful for the not-revealed-yet
        // case — an element already revealed-then-hidden doesn't get one back)
        var banner2 = el.previousElementSibling;
        if (revealAttr && !revealed && banner2 && banner2.classList.contains('coming-soon-banner')) {
          banner2.style.display = '';
        }
      }
    });

    // Fold the old .ps-hero away the instant the Season One premiere band is
    // itself revealed (2026-08-03: the band absorbed the hero's identity —
    // logo, label, CTA — so showing both back to back read as a repeat).
    // #s1-premiere's display was just decided by the loop above using the
    // same data-reveal-after gate (and the same preview override), so this
    // naturally follows it under ?launched=1 too: before Aug 10 the hero
    // shows exactly as before, from Aug 10 (or under preview) it's hidden
    // and the band is the one true opener.
    // 2026-08-16: the fold now ends with the season. While Season One is live
    // (premiere/midseason/finale) the band IS the ProSeries hero and the old
    // .ps-hero stays folded away. Once the season wraps, the band drops to
    // archive copy and the evergreen hero comes back — otherwise the page
    // would lose its own opener permanently, which is what the old
    // unconditional fold actually did.
    var s1PremiereEl = document.getElementById('s1-premiere');
    var psPage = document.getElementById('page-proseries');
    if (psPage && s1PremiereEl) {
      var bandUp = s1PremiereEl.style.display !== 'none';
      var seasonLive = s1CurrentState() !== 'wrapped';
      psPage.classList.toggle('s1-hero-folded', bandUp && seasonLive);
    }

    // Update hero CTA by era, in priority order. Bug fixed 2026-08-03: this
    // used to key off el.style.display, which under the `?launched=1`
    // preview is meaningless for era PRIORITY — the preview forces every
    // gated section to display (so Dixon can review every era at once),
    // including ones whose data-hide-after has long since passed. That made
    // a retired era (#proseries-intensive, hidden every real day since Jul 11)
    // outrank the live one under preview, so the hero CTA read "FULL OUT
    // Takeover Intensive" weeks after that intensive ended. isEraActuallyLive()
    // below ignores the preview flag entirely and checks real dates only, so
    // priority is correct in both preview and production — the preview still
    // visually shows every section, it just no longer wins the CTA fight.
    //   1. Standing interest era actually open (real dates) → express-interest.
    //   2. Otherwise (pre-launch) → early-access email capture.
    // (The intensive branch was removed 2026-08-03 along with #proseries-intensive.)
    function isEraActuallyLive(el) {
      if (!el) return false;
      var revealAttr = el.dataset.revealAfter;
      var hideAttr = el.dataset.hideAfter;
      var revealed = !revealAttr || dateHasPassed(revealAttr);
      var hidden = !!hideAttr && dateHasPassed(hideAttr);
      return revealed && !hidden;
    }
    // Both destinations are now the on-site form. This block used to hand the
    // hero CTA back to dwd-director.netlify.app at runtime, which silently
    // undid item 1.1 for this one button no matter what the markup said; the
    // else branch pointed at #early-access, retired in item 2.4. What is left
    // is the copy swap, which still earns its keep.
    var heroCta = document.getElementById('ps-hero-cta');
    var interestForm = document.getElementById('proseries-interest');
    if (heroCta) {
      heroCta.href = '#interest';
      heroCta.innerHTML = isEraActuallyLive(interestForm)
        ? 'Express Interest <span class="btn-arrow" aria-hidden="true">&rarr;</span>'
        : 'Tell me about your dancer <span class="btn-arrow" aria-hidden="true">&rarr;</span>';
    }
  };

  // ── SEASON ONE STATE MACHINE (rewritten 2026-08-16) ──
  // Season One is the ProSeries identity for the whole 40-week season, not a
  // two-week costume. Replaces the old binary premiere-window toggler, which
  // had no exit: it dropped the takeover on Aug 25 but left the announce band
  // up forever reading "Premieres August 10", the hero permanently folded, and
  // the sky accents only half-retreated (the .s1-cta-sky / .s1-ep-code rules
  // are class-based in the markup, so they survived the class going away while
  // the heading and track-tab accents reverted to pink). Four dated states now:
  //
  //   premiere    Aug 10 – Aug 24 2026   full midnight takeover
  //   midseason   Aug 25 – Apr 30 2027   sky accents only, normal page ground
  //   finale      May  1 – May 25 2027   takeover returns for the last stretch
  //   wrapped     after May 25 2027      archive tense, sky retires entirely
  //
  // The state lands on <html data-s1-state> — not just #page-proseries — so
  // surfaces outside the ProSeries page (the nav Express Interest CTA, which
  // carries .s1-cta-sky) can scope off it too. That is what makes sky retire
  // cleanly at 'wrapped' instead of stranding sky buttons on a pink page.
  //
  // #page-proseries still gets the .s1-premiere-window class for premiere AND
  // finale. That class is the expensive, heavily-tuned midnight takeover CSS
  // below — reusing it for the finale is deliberate, not a shortcut: the last
  // three weeks of the season earn the same volume as the first two.
  //
  // Preview: ?launched=1 / window.__dwdLaunchPreview forces 'premiere' as
  // before. ?s1state=midseason|finale|wrapped forces any single state so each
  // one can be reviewed without waiting months for the date.
  var S1_PREMIERE_START_MS = new Date('2026-08-10T00:00:00-04:00').getTime();
  var S1_PREMIERE_END_MS   = new Date('2026-08-24T23:59:59-04:00').getTime();
  var S1_FINALE_START_MS   = new Date('2027-05-01T00:00:00-04:00').getTime();
  var S1_SEASON_END_MS     = new Date('2027-05-25T23:59:59-04:00').getTime();
  var S1_STATES = ['premiere', 'midseason', 'finale', 'wrapped'];

  function s1StateOverride() {
    try {
      var q = new URLSearchParams(window.location.search).get('s1state');
      return q && S1_STATES.indexOf(q) !== -1 ? q : null;
    } catch (e) { return null; }
  }

  function s1CurrentState() {
    var forced = s1StateOverride();
    if (forced) return forced;
    if (isLaunchPreview()) return 'premiere';
    var now = Date.now();
    if (now < S1_PREMIERE_START_MS) return null;          // season hasn't opened
    if (now <= S1_PREMIERE_END_MS) return 'premiere';
    if (now < S1_FINALE_START_MS) return 'midseason';
    if (now <= S1_SEASON_END_MS) return 'finale';
    return 'wrapped';
  }

  window.applyS1PremiereWindow = function () {
    var page = document.getElementById('page-proseries');
    var state = s1CurrentState();

    if (state) {
      document.documentElement.setAttribute('data-s1-state', state);
    } else {
      document.documentElement.removeAttribute('data-s1-state');
    }
    if (!page) return;

    // Full takeover volume for the two bookend states only.
    page.classList.toggle('s1-premiere-window', state === 'premiere' || state === 'finale');
  };

  // ── S1 PREMIERE ENTRANCE CUE (added 2026-08-03) ──
  // One-shot: adds .s1-cue to #s1-premiere the first time it's actually
  // visible AND on-screen, which triggers the CSS entrance sequence in
  // season1.css. The band starts display:none behind its data-reveal-after
  // gate (applyProSeriesReveal flips that later, possibly long after this
  // script runs) — IntersectionObserver recalculates whenever the target's
  // box changes for ANY reason, including a display:none -> '' flip driven
  // by another script, so wiring this once at load (no polling) is enough;
  // it also fires correctly the moment ?launched=1 / the preview override
  // reveals the band immediately on page load.
  (function () {
    var s1el = document.getElementById('s1-premiere');
    if (!s1el) return;
    if (!('IntersectionObserver' in window)) {
      s1el.classList.add('s1-cue');
      return;
    }
    var s1io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          s1el.classList.add('s1-cue');
          s1io.unobserve(s1el);
        }
      });
    }, { threshold: 0.2 });
    s1io.observe(s1el);
  })();

  // Re-check every 30s so visitors on the page at an era boundary still see it
  // flip within the minute. These are marketing gates, not live event clocks —
  // they don't need a 2s reflow forever. The function is cheap (a few
  // querySelectorAlls + display flips), so polling forever is fine either way.
  setInterval(function () {
    if (typeof window.applyProSeriesReveal === 'function') {
      window.applyProSeriesReveal();
    }
    if (typeof window.applyS1PremiereWindow === 'function') {
      window.applyS1PremiereWindow();
    }
  }, 30000);

  // ── INIT ──
  function initEras() {
    window.applyProSeriesReveal();
    if (typeof window.applyS1PremiereWindow === 'function') {
      window.applyS1PremiereWindow();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEras);
  } else {
    initEras();
  }

  // Re-run on route change: a gated element sitting on a page that was
  // display:none still has to be evaluated once its page becomes active.
  window.addEventListener('hashchange', function () {
    setTimeout(initEras, 50);
  });

})();

/* ============================================================
   SEASON ONE — live countdown to Aug 10, 2026 kickoff.
   Self-contained: no .ics download, no dismissible sticky ticker,
   no localStorage. That machinery belongs to the retired June 6
   audition surfaces above and stays there — this is a fresh,
   minimal clock for the #season-one-cta hero block (A2).
   ============================================================ */
(function () {
  var SEASON_START_MS = new Date('2026-08-10T00:00:00-04:00').getTime();

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function renderSeasonClock() {
    var grids = document.querySelectorAll('[data-season-clock]');
    if (!grids.length) return;
    var diff = SEASON_START_MS - Date.now();
    grids.forEach(function (grid) {
      if (diff <= 0) {
        grid.innerHTML = '<span class="aclk-now">Underway.</span>';
        return;
      }
      var totalSec = Math.floor(diff / 1000);
      var days = Math.floor(totalSec / 86400);
      var hrs  = Math.floor((totalSec % 86400) / 3600);
      var mins = Math.floor((totalSec % 3600) / 60);
      var secs = totalSec % 60;
      function set(sel, val) {
        var el = grid.querySelector(sel);
        if (el) el.textContent = val;
      }
      set('[data-clk-days]', days);
      set('[data-clk-hrs]', pad2(hrs));
      set('[data-clk-mins]', pad2(mins));
      set('[data-clk-secs]', pad2(secs));
    });
  }

  function initSeasonClock() {
    renderSeasonClock();
    setInterval(renderSeasonClock, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSeasonClock);
  } else {
    initSeasonClock();
  }
})();
