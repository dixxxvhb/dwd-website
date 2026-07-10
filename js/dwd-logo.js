/* ================================================================
   <dwd-animated-logo variant="DWD-green" size="120">
   ================================================================
   Live HTML/CSS/JS/SVG port of the sanctioned Tamara Mark animated
   logo (see C:\Users\bowle\iCloud\iCloudDrive\Desktop\DWD\_brand\
   animated-logos\src\anim-*.html — the 12 standalone variant pages
   are the authoritative source). This replaces the deprecated
   fake-alpha *-transparent.webm generation.

   All 12 anim-*.html source variants are byte-identical except for:
     - the <title>
     - the --bg custom property (green vs pink demo backdrop — unused
       here, this component is always transparent)
     - which logo PNG resolves in
   The choreography (Tamara Mark seed draw-on, sparkle, bloom, shimmer
   sweep, finale sparkle, rest pulse) is otherwise pixel-for-pixel
   shared, so this file ports it ONCE and only parameterizes the
   resolved logo image per `variant`.

   This is a memorial animation (Tamara Mark). Do not retime, redesign,
   or otherwise "improve" the choreography below — it is a verbatim
   port of the timeline in anim-*.html.
   ================================================================ */
(function () {
  'use strict';

  if (customElements.get('dwd-animated-logo')) return;

  // Variant -> resolved alpha PNG, relative to ASSET_BASE.
  // Only variants actually placed on this site are listed. To add a
  // new one: copy its *-transparent-alpha.png from the brand source
  // assets folder into images/logos/animated/, then add an entry here.
  var ASSET_MAP = {
    'DWD-green': 'DWD-green-transparent-alpha.png',
    'DWD-pink': 'DWD-pink-transparent-alpha.png',
    'DWDC-pink': 'Collective-pink-transparent-alpha.png',
    'ProSeries-green': 'ProSeries-green-transparent-alpha.png',
    'ProSeries-pink': 'ProSeries-pink-transparent-alpha.png'
  };

  var ASSET_BASE = 'images/logos/animated/';

  // ---- Easing (ported verbatim from anim-*.html) ----

  function cubicBezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function sx(t) { return ((ax * t + bx) * t + cx) * t; }
    function sy(t) { return ((ay * t + by) * t + cy) * t; }
    function sd(t) { return (3 * ax * t + 2 * bx) * t + cx; }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++) {
        var dx = sx(t) - x;
        if (Math.abs(dx) < 1e-7) break;
        var d = sd(t);
        if (Math.abs(d) < 1e-7) break;
        t -= dx / d;
      }
      return sy(Math.max(0, Math.min(1, t)));
    };
  }

  var materialEase = cubicBezier(0.4, 0, 0.2, 1);
  var cssEaseOut = cubicBezier(0, 0, 0.58, 1);
  var cssEaseIn = cubicBezier(0.42, 0, 1, 1);
  var shimmerEase = cubicBezier(0.25, 0.46, 0.45, 0.94);
  var cssEase = cubicBezier(0.25, 0.1, 0.25, 1);

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothstep(t) { return t * t * (3 - 2 * t); }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function lerpColor(a, b, t) {
    var ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
    var ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    var br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    var r = Math.round(ar + (br - ar) * t);
    var g = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  // ---- Shared shadow-DOM template (identical across all variants) ----

  var TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML =
    '<style>' +
    ':host { display: block; position: relative; line-height: 0; }' +
    '.stage { position: relative; width: 100%; height: 100%; }' +
    '.logo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; filter: blur(18px); z-index: 1; }' +
    '.animation-layer { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none; }' +
    '.shimmer-container { position: absolute; inset: 0; z-index: 3; overflow: hidden; border-radius: 50%; pointer-events: none; opacity: 0; }' +
    '.shimmer { position: absolute; inset: -30%; width: 160%; height: 160%; background: linear-gradient(112deg, transparent 32%, rgba(232,196,154,0.04) 38%, rgba(232,196,154,0.10) 42%, rgba(255,255,255,0.18) 47%, rgba(232,196,154,0.10) 52%, rgba(232,196,154,0.04) 56%, transparent 62%); transform: translateX(-140%); }' +
    '</style>' +
    '<div class="stage" part="stage">' +
    '<img class="logo" part="logo" alt="">' +
    '<svg class="animation-layer" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
    '<linearGradient id="tm-gold" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" stop-color="#c9956c"/>' +
    '<stop offset="40%" stop-color="#e8c49a"/>' +
    '<stop offset="100%" stop-color="#d4a574"/>' +
    '</linearGradient>' +
    '<radialGradient id="tm-glow-grad">' +
    '<stop offset="0%" stop-color="#e8c49a"/>' +
    '<stop offset="100%" stop-color="transparent"/>' +
    '</radialGradient>' +
    '</defs>' +
    '<svg class="seed" x="375" y="360" width="250" height="237.5" viewBox="20 10 200 190" overflow="visible">' +
    '<circle class="tmBig" cx="100" cy="115" r="65" fill="none" stroke="url(#tm-gold)" stroke-width="1.8" stroke-linecap="round" opacity="0.75" transform="rotate(-83.8, 100, 115)" stroke-dasharray="408.41" stroke-dashoffset="408.41"/>' +
    '<circle class="tmSmall" cx="152" cy="70" r="49" fill="none" stroke="url(#tm-gold)" stroke-width="2.5" stroke-linecap="round" opacity="0.95" transform="rotate(204, 152, 70)" stroke-dasharray="307.88" stroke-dashoffset="307.88"/>' +
    '<g class="sparkle" opacity="0">' +
    '<circle class="flash" cx="107" cy="50" r="2" fill="#fff" opacity="0"/>' +
    '<line class="ray" x1="107" y1="50" x2="107" y2="36" stroke="#e8c49a" stroke-width="1.5" opacity="0" stroke-linecap="round"/>' +
    '<line class="ray" x1="107" y1="50" x2="120" y2="43" stroke="#e8c49a" stroke-width="1.2" opacity="0" stroke-linecap="round"/>' +
    '<line class="ray" x1="107" y1="50" x2="95" y2="42" stroke="#e8c49a" stroke-width="1.2" opacity="0" stroke-linecap="round"/>' +
    '<line class="ray" x1="107" y1="50" x2="116" y2="58" stroke="#e8c49a" stroke-width="1" opacity="0" stroke-linecap="round"/>' +
    '<line class="ray" x1="107" y1="50" x2="98" y2="59" stroke="#d4a574" stroke-width="1" opacity="0" stroke-linecap="round"/>' +
    '</g>' +
    '<circle class="glow" cx="107" cy="50" r="10" fill="url(#tm-glow-grad)" opacity="0"/>' +
    '</svg>' +
    '<circle class="bloomBig" cx="475" cy="491" r="81" fill="none" stroke="#e8c49a" stroke-width="1.8" stroke-linecap="round" opacity="0"/>' +
    '<circle class="bloomSmall" cx="540" cy="435" r="61" fill="none" stroke="#e8c49a" stroke-width="2.5" stroke-linecap="round" opacity="0"/>' +
    '<circle class="pulseRing" cx="473" cy="501" r="365" fill="none" stroke="#f9d6d6" stroke-width="2.2" opacity="0"/>' +
    '<circle class="pulseTamara" cx="540" cy="435" r="61" fill="none" stroke="url(#tm-gold)" stroke-width="2" opacity="0"/>' +
    '<g class="finaleSparkle" opacity="0">' +
    '<circle class="finaleFlash" cx="760" cy="267" r="3" fill="#fff" opacity="0"/>' +
    '<line class="finale-ray" x1="760" y1="267" x2="760" y2="247" stroke="#e8c49a" stroke-width="1.8" opacity="0" stroke-linecap="round"/>' +
    '<line class="finale-ray" x1="760" y1="267" x2="780" y2="255" stroke="#e8c49a" stroke-width="1.4" opacity="0" stroke-linecap="round"/>' +
    '<line class="finale-ray" x1="760" y1="267" x2="778" y2="282" stroke="#e8c49a" stroke-width="1.4" opacity="0" stroke-linecap="round"/>' +
    '<line class="finale-ray" x1="760" y1="267" x2="745" y2="285" stroke="#e8c49a" stroke-width="1.2" opacity="0" stroke-linecap="round"/>' +
    '<line class="finale-ray" x1="760" y1="267" x2="742" y2="252" stroke="#d4a574" stroke-width="1.2" opacity="0" stroke-linecap="round"/>' +
    '</g>' +
    '</svg>' +
    '<div class="shimmer-container" part="shimmer-container"><div class="shimmer"></div></div>' +
    '</div>';

  // Loop tuning — NOT part of the sacred choreography. The Acts below
  // (seed / bloom / shimmer / finale / rest-pulse) are a verbatim port
  // of anim-*.html's timeline. This is only the outer wrapper that
  // makes a single playthrough repeat, the way the old looping <video>
  // tags did.
  var HOLD_MS = 900;   // extra rest-pulse breathing before the loop fades out
  var FADE_MS = 600;   // crossfade duration into the next playthrough

  function DwdAnimatedLogo() {
    return Reflect.construct(HTMLElement, [], DwdAnimatedLogo);
  }

  DwdAnimatedLogo.prototype = Object.create(HTMLElement.prototype);
  DwdAnimatedLogo.prototype.constructor = DwdAnimatedLogo;
  Object.setPrototypeOf(DwdAnimatedLogo, HTMLElement);

  DwdAnimatedLogo.observedAttributes = ['size'];

  DwdAnimatedLogo.prototype.connectedCallback = function () {
    if (this._built) { this._maybeObserve(); return; }
    if (this._failed) return;

    var variant = this.getAttribute('variant');
    var file = variant && ASSET_MAP[variant];
    if (!file) {
      // Unknown/missing variant: leave the light-DOM fallback markup
      // (whatever <img> the author put inside the tag) showing as-is.
      return;
    }

    this._src = ASSET_BASE + file;
    this._reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._build();
  };

  DwdAnimatedLogo.prototype.attributeChangedCallback = function (name) {
    if (name === 'size') this._applySize();
  };

  DwdAnimatedLogo.prototype._applySize = function () {
    var size = this.getAttribute('size');
    if (!size) return;
    var v = /^\d+$/.test(size) ? size + 'px' : size;
    this.style.width = v;
    this.style.height = v;
  };

  DwdAnimatedLogo.prototype._build = function () {
    var self = this;
    var probe = new Image();
    probe.onload = function () {
      self._mount();
    };
    probe.onerror = function () {
      // Broken asset — never attach a shadow root, so the light-DOM
      // fallback <img> the author left inside the tag keeps rendering.
      self._failed = true;
    };
    probe.src = this._src;
  };

  DwdAnimatedLogo.prototype._mount = function () {
    var root = this.attachShadow({ mode: 'open' });
    root.appendChild(TEMPLATE.content.cloneNode(true));
    this._root = root;
    this._applySize();

    this._stage = root.querySelector('.stage');
    this._logo = root.querySelector('.logo');
    this._logo.src = this._src;
    this._shimmerContainer = root.querySelector('.shimmer-container');
    this._shimmerEl = root.querySelector('.shimmer');
    this._seed = root.querySelector('.seed');
    this._tmBig = root.querySelector('.tmBig');
    this._tmSmall = root.querySelector('.tmSmall');
    this._sparkle = root.querySelector('.sparkle');
    this._flash = root.querySelector('.flash');
    this._rays = root.querySelectorAll('.ray');
    this._glowEl = root.querySelector('.glow');
    this._bloomBig = root.querySelector('.bloomBig');
    this._bloomSmall = root.querySelector('.bloomSmall');
    this._pulseRing = root.querySelector('.pulseRing');
    this._pulseTamara = root.querySelector('.pulseTamara');
    this._finaleSparkle = root.querySelector('.finaleSparkle');
    this._finaleFlash = root.querySelector('.finaleFlash');
    this._finaleRays = root.querySelectorAll('.finale-ray');

    // This embed is always composited on a real transparent background,
    // so — matching what anim-*.html itself does for `transparent=1` —
    // the two faint "rest" ghost-pulse rings stay hidden. They exist to
    // read on a solid demo backdrop, not floating on arbitrary page bg.
    this._pulseRing.style.display = 'none';
    this._pulseTamara.style.display = 'none';

    this._initTimeline();
    this._resetToInitialState();

    this._built = true;

    if (this._reducedMotion) {
      this._renderAtTime(this._totalDuration);
      return;
    }
    this._maybeObserve();
  };

  DwdAnimatedLogo.prototype._maybeObserve = function () {
    if (this._playing) return;
    if (!('IntersectionObserver' in window)) { this._startLoop(); return; }
    var self = this;
    this._io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { self._startLoop(); break; }
      }
    }, { threshold: 0.2 });
    this._io.observe(this);
  };

  DwdAnimatedLogo.prototype._startLoop = function () {
    if (this._playing) return;
    this._playing = true;
    if (this._io) { this._io.disconnect(); this._io = null; }
    var self = this;
    this._loopStart = performance.now();
    function step(now) {
      self._advance(now - self._loopStart);
      self._raf = requestAnimationFrame(step);
    }
    this._raf = requestAnimationFrame(step);
  };

  DwdAnimatedLogo.prototype._advance = function (elapsed) {
    var fadeStart = this._totalDuration + HOLD_MS;
    var fadeEnd = fadeStart + FADE_MS;
    if (elapsed < fadeStart) {
      this._renderAtTime(elapsed);
    } else if (elapsed < fadeEnd) {
      this._renderAtTime(this._totalDuration);
      var t = (elapsed - fadeStart) / FADE_MS;
      this._stage.style.opacity = String(1 - t);
    } else {
      this._resetToInitialState();
      this._stage.style.opacity = '1';
      this._loopStart = performance.now();
      this._renderAtTime(0);
    }
  };

  DwdAnimatedLogo.prototype.disconnectedCallback = function () {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._io) { this._io.disconnect(); this._io = null; }
    this._playing = false;
  };

  // Explicit reset of every mutable prop to its literal initial value
  // (matches the initial markup/CSS in anim-*.html). Needed because
  // renderAtTime() only ever moves state forward from t=0 — nothing in
  // the timeline fires exactly at ms===0, so looping requires putting
  // everything back by hand before starting the next playthrough.
  DwdAnimatedLogo.prototype._resetToInitialState = function () {
    this._tmBig.style.strokeDashoffset = '408.41';
    this._tmSmall.style.strokeDashoffset = '307.88';
    this._sparkle.style.opacity = '0';
    this._flash.style.opacity = '0';
    this._flash.setAttribute('r', '2');
    for (var i = 0; i < this._rays.length; i++) this._rays[i].style.opacity = '0';
    this._glowEl.style.opacity = '0';
    this._seed.style.opacity = '1';

    this._bloomBig.setAttribute('cx', '475');
    this._bloomBig.setAttribute('cy', '491');
    this._bloomBig.setAttribute('r', '81');
    this._bloomBig.setAttribute('stroke-width', '1.8');
    this._bloomBig.setAttribute('stroke', '#e8c49a');
    this._bloomBig.style.opacity = '0';

    this._bloomSmall.setAttribute('cx', '540');
    this._bloomSmall.setAttribute('cy', '435');
    this._bloomSmall.setAttribute('r', '61');
    this._bloomSmall.setAttribute('stroke-width', '2.5');
    this._bloomSmall.setAttribute('stroke', '#e8c49a');
    this._bloomSmall.style.opacity = '0';

    this._logo.style.opacity = '0';
    this._logo.style.filter = 'blur(18px)';

    this._shimmerContainer.style.opacity = '0';
    this._shimmerEl.style.transform = 'translateX(-140%)';

    this._pulseRing.style.opacity = '0';
    this._pulseRing.setAttribute('stroke-width', '2.2');
    this._pulseTamara.style.opacity = '0';

    this._finaleSparkle.style.opacity = '0';
    this._finaleFlash.style.opacity = '0';
    this._finaleFlash.setAttribute('r', '3');
    for (var j = 0; j < this._finaleRays.length; j++) this._finaleRays[j].style.opacity = '0';

    this._stage.style.opacity = '1';
  };

  // ================================================================
  // TIMELINE — verbatim port of anim-*.html's declarative engine.
  // ts = 0.5 always (the "medium" preset baked half-speed in already).
  // ================================================================
  DwdAnimatedLogo.prototype._initTimeline = function () {
    var ts = 1 * 0.5;
    var timeline = [];
    function T(s, d, fn) { timeline.push({ s: s, d: d || 0, fn: fn }); }
    function P(s, fn) { timeline.push({ s: s, fn: fn, phase: true }); }

    var bloomStart = 3100 * ts;
    var shimmerStart = 4400 * ts;
    var finaleStart = 5200 * ts;
    var pulseStart = 5400 * ts;

    var tmBig = this._tmBig, tmSmall = this._tmSmall, sparkle = this._sparkle,
        flash = this._flash, rays = this._rays, glowEl = this._glowEl,
        seed = this._seed, bloomBig = this._bloomBig, bloomSmall = this._bloomSmall,
        logo = this._logo, shimmerContainer = this._shimmerContainer,
        shimmerEl = this._shimmerEl, pulseRing = this._pulseRing,
        pulseTamara = this._pulseTamara, finaleSparkle = this._finaleSparkle,
        finaleFlash = this._finaleFlash, finaleRays = this._finaleRays;

    // ACT 1: THE SEED
    T(300 * ts, 1600 * ts, function (t) {
      tmBig.style.strokeDashoffset = String(lerp(408.41, 0, materialEase(t)));
    });
    T(1900 * ts, 1200 * ts, function (t) {
      tmSmall.style.strokeDashoffset = String(lerp(307.88, 0, materialEase(t)));
    });
    T(1900 * ts, 0, function () { sparkle.style.opacity = '1'; });
    T(1900 * ts, 0, function () {
      flash.style.opacity = '0.9';
      flash.setAttribute('r', '6');
    });
    T(1900 * ts + 100 * ts, 0, function () { flash.setAttribute('r', '2'); });
    T(1900 * ts + 100 * ts, 500 * ts, function (t) {
      flash.style.opacity = String(lerp(0.9, 0, cssEaseOut(t)));
    });
    rays.forEach(function (ray, i) {
      var rs = 1900 * ts + i * 30 * ts;
      T(rs, 150 * ts, function (t) { ray.style.opacity = String(lerp(0, 0.8, cssEaseOut(t))); });
      T(rs + 150 * ts, 350 * ts, function (t) { ray.style.opacity = String(lerp(0.8, 0, cssEaseIn(t))); });
    });
    T(1900 * ts, 800 * ts, function (t) {
      glowEl.style.opacity = String(lerp(0, 0.25, cssEaseOut(t)));
    });

    // ACT 2: THE BLOOM
    T(bloomStart, 0, function () {
      bloomBig.style.opacity = '0.75';
      bloomSmall.style.opacity = '0.95';
    });
    T(bloomStart, 800 * ts, function (t) {
      seed.style.opacity = String(lerp(1, 0, cssEaseIn(t)));
    });
    T(bloomStart, 1300 * ts, function (t) {
      var et = easeInOutCubic(t);
      bloomBig.setAttribute('cx', String(lerp(475, 473, et)));
      bloomBig.setAttribute('cy', String(lerp(491, 501, et)));
      bloomBig.setAttribute('r', String(lerp(81, 365, et)));
      bloomBig.setAttribute('stroke-width', String(lerp(1.8, 3.5, et)));
      bloomBig.setAttribute('stroke', lerpColor('#e8c49a', '#f9d6d6', et));
      bloomBig.style.opacity = String(0.75 - t * 0.15);
    });
    T(bloomStart, 1300 * ts, function (t) {
      var et = easeInOutCubic(t);
      bloomSmall.setAttribute('cx', String(lerp(540, 473, et)));
      bloomSmall.setAttribute('cy', String(lerp(435, 501, et)));
      bloomSmall.setAttribute('r', String(lerp(61, 325, et)));
      bloomSmall.setAttribute('stroke-width', String(lerp(2.5, 2.0, et)));
      bloomSmall.setAttribute('stroke', lerpColor('#e8c49a', '#f9d6d6', et));
      bloomSmall.style.opacity = String(0.95 - t * 0.35);
    });
    T(bloomStart, 1400 * ts, function (t) {
      var et = smoothstep(t);
      logo.style.opacity = String(lerp(0, 1, et));
      logo.style.filter = 'blur(' + lerp(18, 0, et) + 'px)';
    });

    // ACT 3: SHIMMER SWEEP
    T(shimmerStart, 0, function () { shimmerContainer.style.opacity = '1'; });
    T(shimmerStart, 2000, function (t) {
      var et = shimmerEase(t);
      shimmerEl.style.transform = 'translateX(' + lerp(-140, 140, et) + '%) rotate(' + lerp(0, -8, et) + 'deg)';
    });
    T(shimmerStart, 800 * ts, function (t) {
      var et = easeInOutCubic(t);
      bloomBig.style.opacity = String(lerp(0.6, 0, et));
      bloomSmall.style.opacity = String(lerp(0.6, 0, et));
    });
    T(shimmerStart + 1800, 300, function (t) {
      shimmerContainer.style.opacity = String(lerp(1, 0, cssEase(t)));
    });

    // FINALE: logo sparkle echo
    T(finaleStart, 0, function () { finaleSparkle.style.opacity = '1'; });
    T(finaleStart, 0, function () {
      finaleFlash.style.opacity = '0.9';
      finaleFlash.setAttribute('r', '8');
    });
    T(finaleStart + 100 * ts, 0, function () { finaleFlash.setAttribute('r', '3'); });
    T(finaleStart + 100 * ts, 500 * ts, function (t) {
      finaleFlash.style.opacity = String(lerp(0.9, 0, cssEaseOut(t)));
    });
    finaleRays.forEach(function (ray, i) {
      var rs = finaleStart + i * 30 * ts;
      T(rs, 150 * ts, function (t) { ray.style.opacity = String(lerp(0, 0.8, cssEaseOut(t))); });
      T(rs + 150 * ts, 350 * ts, function (t) { ray.style.opacity = String(lerp(0.8, 0, cssEaseIn(t))); });
    });

    // ACT 4: REST — breathing pulses (phase-based, runs until the loop
    // wrapper decides to fade out and restart)
    P(pulseStart, function (elapsed) {
      var sec = elapsed / 1000;
      var phase = sec * 1.2;
      pulseRing.style.opacity = String(0.06 + Math.sin(phase) * 0.07);
      pulseRing.setAttribute('stroke-width', String(2.0 + Math.sin(phase) * 0.3));
    });
    P(pulseStart, function (elapsed) {
      var sec = elapsed / 1000;
      var phase = sec * 1.08;
      pulseTamara.style.opacity = String(0.04 + Math.sin(phase) * 0.06);
    });

    this.timeline = timeline;
    this._totalDuration = Math.ceil(Math.max(shimmerStart + 2100, pulseStart + 3000) / 1000) * 1000;
  };

  DwdAnimatedLogo.prototype._renderAtTime = function (ms) {
    if (ms < 0) ms = 0;
    var timeline = this.timeline;
    for (var i = 0; i < timeline.length; i++) {
      var e = timeline[i];
      if (e.phase) {
        if (ms >= e.s) e.fn(ms - e.s);
      } else if (e.d === 0) {
        if (ms >= e.s) e.fn(1);
      } else if (ms >= e.s) {
        e.fn(Math.min((ms - e.s) / e.d, 1));
      }
    }
  };

  customElements.define('dwd-animated-logo', DwdAnimatedLogo);
})();
