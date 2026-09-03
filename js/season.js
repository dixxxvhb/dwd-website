/* ═══════════════════════════════════════════════
   DWD — season.js
   ONE source of truth for Season One chair counts.

   Five places on the page used to hardcode these numbers (fork facts on
   Home, the ProSeries track-tab chips, the cast-track chips, the pricing
   conversion band, and the cast footer sentence). They drifted. Now they
   all render from the object below.

   To update after a signing: edit `chairs` here. Nothing else.

   Progressive enhancement on purpose — the markup still ships the current
   numbers as text, so a JS failure leaves a correct (if stale) page rather
   than an empty one. Every render site carries a data-chairs attribute and
   an HTML comment pointing back at this file.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var SEASON = {
    // Filled / max per track. Verified 2026-09-02: 17 dancers signed.
    chairs: {
      prep:  { filled: 5, max: 10 },
      elite: { filled: 6, max: 10 },
      pro:   { filled: 6, max: 10 }
    },
    label: { prep: 'Prep', elite: 'Elite', pro: 'Pro' }
  };

  window.DWD_SEASON = SEASON;

  var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
               'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
               'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four',
               'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight',
               'twenty-nine', 'thirty'];

  function word(n) { return WORDS[n] !== undefined ? WORDS[n] : String(n); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function open(t) { return SEASON.chairs[t].max - SEASON.chairs[t].filled; }

  var TRACKS = ['prep', 'elite', 'pro'];

  var FORMATS = {
    // Home fork card: "Prep 5 · Elite 4 · Pro 4" (chairs OPEN, not filled)
    'fork-open': function () {
      return TRACKS.map(function (t) {
        return SEASON.label[t] + ' ' + open(t);
      }).join(' · ');
    },
    // Cast track head chip: "5 of 10 chairs filled"
    'filled': function (t) {
      return SEASON.chairs[t].filled + ' of ' + SEASON.chairs[t].max + ' chairs filled';
    },
    // Track tab chip: "5 of 10 chairs"
    'short': function (t) {
      return SEASON.chairs[t].filled + ' of ' + SEASON.chairs[t].max + ' chairs';
    },
    // Pricing band chip: "PREP · 5 of 10"
    'band': function (t) {
      return SEASON.label[t].toUpperCase() + ' · ' +
             SEASON.chairs[t].filled + ' of ' + SEASON.chairs[t].max;
    },
    // Pricing band heading: "Thirteen chairs remain."
    'remain-title': function () {
      var total = TRACKS.reduce(function (sum, t) { return sum + open(t); }, 0);
      return cap(word(total)) + ' chair' + (total === 1 ? '' : 's') + ' remain' + (total === 1 ? 's' : '') + '.';
    },
    // Cast footer: "Prep has five chairs open. Elite has four. Pro has four."
    'cast-footer': function () {
      var first = open('prep');
      var parts = [SEASON.label.prep + ' has ' + word(first) + ' chair' +
                   (first === 1 ? '' : 's') + ' open.'];
      ['elite', 'pro'].forEach(function (t) {
        parts.push(SEASON.label[t] + ' has ' + word(open(t)) + '.');
      });
      return parts.join(' ');
    }
  };

  function render() {
    document.querySelectorAll('[data-chairs]').forEach(function (el) {
      var fmt = FORMATS[el.dataset.chairs];
      if (!fmt) return;
      var track = el.dataset.chairsTrack;
      if (track && !SEASON.chairs[track]) return;
      el.textContent = fmt(track);
    });
  }

  SEASON.render = render;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
