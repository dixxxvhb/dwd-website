/* ═══════════════════════════════════════════════
   DWD — Dance With Dixon
   Main JavaScript
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── HASH ROUTING ──
  const validPages = [
    'home', 'adult-company', 'proseries',
    'teachers',
    'gallery', 'shop', 'contact', 'privacy'
  ];

  // Legacy hash redirects — Performances was merged into Collective (#adult-company),
  // About was merged into Teachers, and A·Muse content lives at #amuse.
  const legacyHashRedirects = {
    'classes-events': 'adult-company',
    'performances':   'adult-company',
    'about':          'teachers',
    // #early-access retired 2026-09-02 (item 2.4). Its whole job was capturing
    // emails for a registration link that went out in June; the on-site interest
    // form is what those visitors actually want now. Not a page name: the
    // element-anchor branch below resolves #interest to its owning page.
    'early-access':   'interest'
  };
  (function applyLegacyRedirect() {
    var raw = window.location.hash.replace('#', '').split('?')[0];
    if (legacyHashRedirects[raw]) {
      window.location.hash = '#' + legacyHashRedirects[raw];
    }
  })();

  // ── PATH ROUTES (item 3.1) ──
  // Each of these has a real directory built by scripts/build-routes.mjs, so
  // /proseries is a page a search engine can index and a link preview can
  // describe. #shop is deliberately absent: merch left the nav in item 1.3 and
  // has no shell, so it stays hash-only.
  //
  // The old #hash links keep working forever. When one names a section that
  // HAS a path, the hash handler swaps the URL for the path with replaceState,
  // so a shared link is always the good kind.
  var ROUTE_PATH = {
    'home': '/',
    'proseries': '/proseries/',
    'adult-company': '/collective/',
    'teachers': '/teachers/',
    'gallery': '/gallery/',
    'contact': '/contact/',
    'privacy': '/privacy/'
  };

  var PATH_ROUTE = {};
  Object.keys(ROUTE_PATH).forEach(function (route) {
    var seg = ROUTE_PATH[route].replace(/^\/|\/$/g, '');
    if (seg) PATH_ROUTE[seg] = route;
  });

  var supportsPathRouting = !!(window.history && window.history.pushState);

  // The last non-empty path segment, lowercased, with any trailing slash or
  // index.html removed. Handles a project-page prefix (/dwd-website/proseries)
  // as well as the custom domain.
  function lastSegment(pathname) {
    var parts = String(pathname || '/').split('/').filter(Boolean);
    var last = parts.length ? parts[parts.length - 1].toLowerCase() : '';
    return last === 'index.html' ? (parts.length > 1 ? parts[parts.length - 2].toLowerCase() : '') : last;
  }

  function routeFromPath() {
    return PATH_ROUTE[lastSegment(window.location.pathname)] || null;
  }

  var routedByAnchor = false;

  function getPageFromHash() {
    const hash = window.location.hash.replace('#', '').split('?')[0];
    return validPages.includes(hash) ? hash : 'home';
  }

  // ── ANCHOR SCROLLING ──
  // #interest sits roughly 14,700px down the ProSeries page, and that page is
  // still growing while we scroll: eras.js flips date-gated bands from
  // display:none to block, and lazy images resolve their real heights. A single
  // scrollIntoView() fired on the next frame therefore aims at a layout that no
  // longer exists — measured landings were 1,514px short on a deep link and a
  // dead stop at y=137 on a CTA click.
  //
  // So: jump instantly (a 14,700px smooth scroll is nauseating anyway), then
  // re-aim until the target position stops moving. Bail the moment the visitor
  // takes over the scroll themselves.
  var settleTimer = null;

  function topnavOffset() {
    var nav = document.getElementById('topnav');
    if (!nav) return 12;
    var pos = window.getComputedStyle(nav).position;
    return (pos === 'fixed' || pos === 'sticky') ? nav.offsetHeight + 12 : 12;
  }

  function scrollToAnchor(id) {
    if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }

    var attempts = 0;
    var stable = 0;
    var last = null;
    var cancelled = false;

    function cancel() { cancelled = true; }
    ['wheel', 'touchstart', 'keydown'].forEach(function (evt) {
      window.addEventListener(evt, cancel, { once: true, passive: true });
    });

    // Re-aim on this schedule (ms between reads). The long tail matters: the
    // ProSeries page's lazy images carry no width/height, so a batch of them
    // can resolve a second or more after the jump and shove the target by
    // upwards of 1,500px. Measured drift settled by ~2.5s; the schedule runs
    // to ~4s with room to spare.
    var DELAYS = [0, 50, 50, 90, 150, 220, 300, 380, 460, 550, 650, 750];
    var started = Date.now();

    function step() {
      if (cancelled) return;
      var el = document.getElementById(id);
      if (!el) return;
      var y = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - topnavOffset());
      if (last !== null && Math.abs(y - last) <= 2) {
        stable++;
      } else {
        stable = 0;
      }
      last = y;
      window.scrollTo(0, y);

      var done = attempts >= DELAYS.length - 1 ||
                 (stable >= 3 && Date.now() - started > 900);
      if (done) {
        ['wheel', 'touchstart', 'keydown'].forEach(function (evt) {
          window.removeEventListener(evt, cancel);
        });
        return;
      }
      attempts++;
      settleTimer = setTimeout(step, DELAYS[attempts]);
    }

    requestAnimationFrame(step);
  }

  function showPage(name) {
    if (!validPages.includes(name)) name = 'home';

    // Update pages
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.remove('active');
    });
    var target = document.getElementById('page-' + name);
    if (target) target.classList.add('active');

    // Sticky mobile CTA bar (item M1): only on the conversion-relevant pages.
    var mob = document.getElementById('mob-cta');
    if (mob) {
      mob.hidden = !['home', 'proseries'].includes(name);
      document.body.classList.toggle('mob-cta-on', !mob.hidden);
    }

    // Update nav
    document.querySelectorAll('.topnav nav a, .topnav .brand, .topnav .nav-cta').forEach(function (a) {
      a.classList.toggle('active', a.dataset.page === name);
    });

    // Scroll to top
    window.scrollTo(0, 0);

    // Close mobile menu
    closeMobileMenu();

    // Re-trigger scroll animations on new page
    if (target) {
      target.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.remove('visible');
        observer.observe(el);
      });
      // Trigger immediately visible ones after short delay
      setTimeout(function () {
        target.querySelectorAll('.reveal').forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight) {
            el.classList.add('visible');
          }
        });
      }, 100);
    }

    // Update page title
    var titles = {
    'privacy': 'Privacy Policy | DWD',
      'home': 'Dance With Dixon | Orlando Dance Company',
      'adult-company': 'The Collective | DWD',
      // Season One is the ProSeries identity for the 2026-27 season, so the
      // route title carries it (audit M3, 2026-08-16 — the season appeared 22
      // times in the page body and zero times in any metadata).
      'proseries': 'ProSeries: Season One | DWD',
      'teachers': 'Teachers | DWD',

      'gallery': 'Gallery | DWD',
      'shop': 'Merch | DWD',
      'contact': 'Contact | DWD'
    };
    document.title = titles[name] || titles['home'];

    // Keep the canonical link and og:url pointing at the URL the visitor is
    // actually on. A crawler that executes JS and follows the nav would
    // otherwise read every section as canonical to the home page, which is the
    // exact problem item 3.1 exists to fix.
    if (ROUTE_PATH[name]) {
      var canonical = document.querySelector('link[rel="canonical"]');
      var ogUrl = document.querySelector('meta[property="og:url"]');
      var abs = 'https://dancewithdixon.com' + (ROUTE_PATH[name] === '/' ? '' : ROUTE_PATH[name]);
      if (canonical) canonical.setAttribute('href', abs || 'https://dancewithdixon.com/');
      if (ogUrl) ogUrl.setAttribute('content', abs || 'https://dancewithdixon.com/');
    }

    // A11y: move focus into the new page and announce the route change so
    // keyboard + screen-reader users get a landing point and a signal.
    if (target) {
      var focusEl = target.querySelector('h1, h2') || target;
      focusEl.setAttribute('tabindex', '-1');
      focusEl.focus({ preventScroll: true });
    }
    var announce = document.getElementById('route-announce');
    if (announce) announce.textContent = (titles[name] || 'Home').split('|')[0].trim() + ' — loaded';
  }

  // Listen for hash changes
  window.addEventListener('hashchange', function () {
    var hash = window.location.hash.replace('#', '').split('?')[0];

    // Legacy redirects — old Performances anchors land on the Collective page now.
    if (legacyHashRedirects[hash]) {
      window.location.hash = '#' + legacyHashRedirects[hash];
      return;
    }

    // If hash matches a valid page, route to it. If that page has a real path,
    // swap the URL for it so what gets shared and bookmarked is the good kind
    // of link. replaceState, not pushState: the hash change already made a
    // history entry, and this rewrites that entry rather than adding a second.
    if (validPages.includes(hash)) {
      showPage(hash);
      if (supportsPathRouting && ROUTE_PATH[hash]) {
        try { window.history.replaceState({ route: hash }, '', ROUTE_PATH[hash]); } catch (e) {}
      }
      return;
    }

    // If hash matches an element ID, scroll to it. If that element lives
    // on a page that isn't active (e.g. #amuse is inside #page-adult-company),
    // first switch to that page, then scroll once it's painted.
    var target = document.getElementById(hash);
    if (target) {
      closeMobileMenu();
      var owningPage = target.closest('.page');
      if (owningPage && !owningPage.classList.contains('active')) {
        var pageName = (owningPage.id || '').replace(/^page-/, '');
        if (validPages.includes(pageName)) {
          showPage(pageName);
          // showPage scrolls to top; scrollToAnchor takes it from there and
          // keeps re-aiming while the new page's layout settles.
          scrollToAnchor(hash);
          return;
        }
      }
      scrollToAnchor(hash);
      return;
    }

    // Unknown hash — go home
    showPage('home');
  });

  // ── SCROLL ANIMATIONS (staggered reveals) ──
  var revealQueue = [];
  var revealTimer = null;

  function processRevealQueue() {
    if (!revealQueue.length) {
      revealTimer = null;
      return;
    }
    var el = revealQueue.shift();
    el.classList.add('visible');
    revealTimer = setTimeout(processRevealQueue, 120);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        observer.unobserve(e.target);
        revealQueue.push(e.target);
        if (!revealTimer) {
          revealTimer = setTimeout(processRevealQueue, 50);
        }
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(function (el) {
    observer.observe(el);
  });

  // ── MOBILE MENU ──
  // The topnav toggle is the only menu. The old <aside class="sidebar">, its
  // hamburger and its overlay were deleted from the markup on 2026-09-02
  // (item 3.4) along with the openMobileMenu/hamburger/overlay branches that
  // used to live here; they had been aria-hidden and unreachable since the
  // rebrand.
  function closeMobileMenu() {
    var topnav = document.getElementById('topnav');
    var toggle = document.getElementById('topnav-toggle');
    if (topnav) topnav.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-open');
    document.body.style.overflow = '';
  }

  // ── TOPNAV MOBILE TOGGLE ──
  var topnav = document.getElementById('topnav');
  var topnavToggle = document.getElementById('topnav-toggle');
  if (topnavToggle && topnav) {
    topnavToggle.addEventListener('click', function () {
      if (topnav.classList.contains('is-open')) {
        closeMobileMenu();
      } else {
        topnav.classList.add('is-open');
        topnavToggle.setAttribute('aria-expanded', 'true');
        document.documentElement.classList.add('menu-open');
      }
    });
    topnav.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', closeMobileMenu);
    });
  }

  // Close menu on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMobileMenu();
      closeLightbox();
    }
  });

  // ── GALLERY LIGHTBOX ──
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxImages = [];
  var lightboxIndex = 0;
  var lightboxPrevFocus = null; // store focus before opening

  function collectLightboxImages() {
    lightboxImages = Array.from(document.querySelectorAll('[data-lightbox]'));
  }

  function openLightbox(index) {
    if (!lightboxImages.length) return;
    lightboxPrevFocus = document.activeElement; // remember where focus was
    lightboxIndex = index;
    lightboxImg.src = lightboxImages[lightboxIndex].src;
    lightboxImg.alt = lightboxImages[lightboxIndex].alt;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Move focus into lightbox
    var closeBtn = lightbox.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Restore focus to trigger element
    if (lightboxPrevFocus) {
      lightboxPrevFocus.focus();
      lightboxPrevFocus = null;
    }
  }

  function swapLightboxImage(newIndex) {
    lightboxImg.style.opacity = '0';
    lightboxImg.style.transform = 'scale(0.97)';
    setTimeout(function () {
      lightboxIndex = newIndex;
      lightboxImg.src = lightboxImages[lightboxIndex].src;
      lightboxImg.alt = lightboxImages[lightboxIndex].alt;
      lightboxImg.style.opacity = '1';
      lightboxImg.style.transform = 'scale(1)';
    }, 180);
  }

  function nextImage() {
    swapLightboxImage((lightboxIndex + 1) % lightboxImages.length);
  }

  function prevImage() {
    swapLightboxImage((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length);
  }

  // Bind gallery image clicks + keyboard
  collectLightboxImages();
  lightboxImages.forEach(function (img, i) {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'View larger: ' + (img.alt || 'image'));
    img.addEventListener('click', function () {
      openLightbox(i);
    });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(i);
      }
    });
  });

  // Lightbox controls
  if (lightbox) {
    lightbox.querySelector('.lightbox-close').addEventListener('click', function (e) {
      e.stopPropagation();
      closeLightbox();
    });
    lightbox.querySelector('.lightbox-prev').addEventListener('click', function (e) {
      e.stopPropagation();
      prevImage();
    });
    lightbox.querySelector('.lightbox-next').addEventListener('click', function (e) {
      e.stopPropagation();
      nextImage();
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Lightbox keyboard nav + focus trap
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    // Focus trap — keep Tab within lightbox
    if (e.key === 'Tab') {
      var focusable = lightbox.querySelectorAll('button');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  // ── SUPABASE CLIENT ──
  var supabaseUrl = 'https://ipulrvhiuvgbvralybxx.supabase.co';
  var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdWxydmhpdXZnYnZyYWx5Ynh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2ODI0MzAsImV4cCI6MjA4NjI1ODQzMH0.O7MDYxkfqhQGNI58xyDq3HhsIm12OmgZRkJlyTXL0ug';
  // Guard the CDN: if supabase-js failed to load (ad blocker, network, CDN
  // outage), don't throw here — that would abort the rest of this IIFE and
  // kill form handlers + hash routing. Init as null and let each feature
  // fall back gracefully.
  var supabase = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : null;
  window.__dwd_sb = supabase; // expose for analytics.js (the tracker)

  // ── LIVE PRICING FROM PROSERIES CONFIG ──
  // Fetches active config from proseries_config table (anon RLS allows read)
  // Updates pricing on the page. Falls back silently to hardcoded HTML values on error.
  (function loadLivePricing() {
    if (!supabase) return; // CDN unavailable — keep the hardcoded HTML prices
    supabase
      .from('proseries_config')
      .select('track_prep_price_cents, track_elite_price_cents, track_pro_price_cents, track_prep_ages, track_elite_ages, track_pro_ages')
      .eq('is_active', true)
      .single()
      .then(function (result) {
        if (result.error || !result.data) return; // silent fallback to hardcoded HTML
        var c = result.data;
        var proDollars = Math.round(c.track_pro_price_cents / 100);
        var eliteDollars = Math.round(c.track_elite_price_cents / 100);
        var prepDollars = Math.round(c.track_prep_price_cents / 100);

        // Update track card prices (order: Pro, Elite, Prep)
        var priceEls = document.querySelectorAll('.track-price');
        if (priceEls[0]) priceEls[0].innerHTML = '$' + proDollars + ' <span>/ month</span>';
        if (priceEls[1]) priceEls[1].innerHTML = '$' + eliteDollars + ' <span>/ month</span>';
        if (priceEls[2]) priceEls[2].innerHTML = '$' + prepDollars + ' <span>/ month</span>';

        // Update track card age labels
        var levelEls = document.querySelectorAll('.track-level');
        if (levelEls[0] && c.track_pro_ages) levelEls[0].textContent = 'Ages ' + c.track_pro_ages + ' | Competitive';
        if (levelEls[1] && c.track_elite_ages) levelEls[1].textContent = 'Ages ' + c.track_elite_ages + ' | Competitive';
        if (levelEls[2] && c.track_prep_ages) levelEls[2].textContent = 'Ages ' + c.track_prep_ages + ' | Foundation';

        // Update fee table tuition range row
        var feeRows = document.querySelectorAll('.fee-table tbody tr');
        if (feeRows[0]) {
          var cells = feeRows[0].querySelectorAll('td');
          if (cells[1]) cells[1].textContent = '$' + prepDollars + '–$' + proDollars + ' / month';
        }
      });
  })();

  // ── FORM HELPERS ──
  function clearFieldError(field) {
    field.classList.remove('invalid');
    field.removeAttribute('aria-invalid');
    var slot = getOrCreateFieldErrorSlot(field);
    if (slot) {
      slot.textContent = '';
      slot.classList.remove('show');
    }
  }

  function getOrCreateFieldErrorSlot(field) {
    var group = field.closest('.form-group') || field.parentElement;
    if (!group) return null;
    var slot = group.querySelector(':scope > .form-field-error');
    if (!slot) {
      slot = document.createElement('span');
      slot.className = 'form-field-error';
      // Match input by id so screen readers announce the inline error.
      if (field.id) {
        slot.id = field.id + '-error';
        var existing = field.getAttribute('aria-describedby') || '';
        if (existing.indexOf(slot.id) === -1) {
          field.setAttribute('aria-describedby', (existing + ' ' + slot.id).trim());
        }
      }
      group.appendChild(slot);
    }
    return slot;
  }

  function setFieldError(field, msg) {
    field.classList.add('invalid');
    field.setAttribute('aria-invalid', 'true');
    var slot = getOrCreateFieldErrorSlot(field);
    if (slot) {
      slot.textContent = msg;
      slot.classList.add('show');
    }
  }

  function validateForm(form) {
    var valid = true;
    form.querySelectorAll('[required]').forEach(function (field) {
      clearFieldError(field);
      var value = field.value.trim();
      if (!value) {
        var labelEl = field.id ? form.querySelector('label[for="' + field.id + '"]') : null;
        var labelText = labelEl ? labelEl.textContent.trim().toLowerCase() : '';
        var fallback = field.type === 'email' ? 'an email address'
                     : field.tagName === 'TEXTAREA' ? 'a message'
                     : 'this field';
        var hint = labelText ? ('your ' + labelText) : fallback;
        setFieldError(field, 'Please enter ' + hint + '.');
        valid = false;
        return;
      }
      if (field.type === 'email') {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          setFieldError(field, 'That email doesn’t look right. Try again?');
          valid = false;
        }
      }
    });
    if (!valid) {
      var firstInvalid = form.querySelector('.invalid');
      if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
    }
    return valid;
  }

  // Clear per-field error the moment the user starts correcting it.
  document.addEventListener('input', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('invalid')) {
      clearFieldError(e.target);
    }
  }, true);

  // Inline success everywhere. The "You're on the list" modal this used to
  // raise for signup forms had exactly two triggers: the early-access form,
  // deleted in item 2.4, and a [data-form="proseries-interest"] that never
  // existed in the markup. A [data-persist] success stays up and takes the
  // form's place instead of flashing for five seconds and restoring an empty
  // field, which reads as though the submission did not take.
  function showFormSuccess(form) {
    var successEl = form.parentElement.querySelector('.form-success') ||
                    form.querySelector('.form-success') ||
                    form.nextElementSibling;
    if (!successEl || !successEl.classList.contains('form-success')) return;
    successEl.classList.add('show');
    if (successEl.hasAttribute('data-persist')) {
      form.hidden = true;
      successEl.setAttribute('tabindex', '-1');
      successEl.focus({ preventScroll: true });
      return;
    }
    setTimeout(function () { successEl.classList.remove('show'); }, 5000);
  }

  function showFormError(form, msg) {
    var errorEl = form.querySelector('.form-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'form-error';
      errorEl.setAttribute('aria-live', 'polite');
      form.appendChild(errorEl);
    }
    errorEl.textContent = msg || 'Something went wrong. Please try again.';
    errorEl.classList.add('show');
    setTimeout(function () { errorEl.classList.remove('show'); }, 5000);
  }

  function setSubmitLoading(form, loading) {
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.originalText || 'Submit';
      btn.disabled = false;
    }
  }

  // ── CONTACT REASON FROM THE HASH QUERY ──
  // Links like #contact?reason=adult arrive from the Collective page. The
  // routing already strips the query (getPageFromHash splits on "?"), so the
  // only job here is to flip the matching toggle before the visitor reads the
  // form. Unknown values are ignored and the default toggle stands.
  function applyContactReasonFromHash() {
    var parts = window.location.hash.replace('#', '').split('?');
    if (parts[0] !== 'contact' || !parts[1]) return;
    var reason = null;
    parts[1].split('&').forEach(function (kv) {
      var pair = kv.split('=');
      if (pair[0] === 'reason') reason = decodeURIComponent(pair[1] || '');
    });
    if (!reason) return;
    var group = document.querySelector('.toggle-group[data-name="reason"]');
    if (!group) return;
    var btn = group.querySelector('.toggle-btn[data-value="' + reason.replace(/"/g, '') + '"]');
    if (!btn) return;
    group.querySelectorAll('.toggle-btn').forEach(function (b) {
      b.classList.remove('active');
      b.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-checked', 'true');
  }
  window.addEventListener('hashchange', applyContactReasonFromHash);

  // ── TOGGLE GROUPS ──
  document.querySelectorAll('.toggle-group').forEach(function (group) {
    group.querySelectorAll('.toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        group.querySelectorAll('.toggle-btn').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
      });
    });
  });

  // ── CONTACT FORM ──
  var contactForm = document.querySelector('[data-form="contact"]');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: silently drop bot submissions (hidden field filled).
      var hp = document.getElementById('contact-website');
      if (hp && hp.value) { contactForm.reset(); showFormSuccess(contactForm); return; }

      if (!validateForm(contactForm)) return;

      var activeToggle = contactForm.querySelector('.toggle-group .toggle-btn.active');
      var phoneEl = document.getElementById('contact-phone');
      var payload = {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        phone: phoneEl ? phoneEl.value.trim() : '',
        reason: activeToggle ? activeToggle.dataset.value : 'general',
        how_heard: '',
        message: document.getElementById('contact-message').value.trim() || ''
      };

      if (!supabase) {
        showFormError(contactForm, 'Our form service is temporarily unavailable. Please email dancewithdixon@gmail.com and I’ll get right back to you.');
        return;
      }
      setSubmitLoading(contactForm, true);
      supabase.from('website_contacts').insert(payload)
        .then(function (res) {
          setSubmitLoading(contactForm, false);
          if (res.error) {
            console.error('Contact form error:', res.error);
            showFormError(contactForm, 'Something went wrong. Please try again.');
          } else {
            contactForm.reset();
            showFormSuccess(contactForm);
          }
        });
    });
  }

  // ── EMAIL SIGNUP FORMS ──
  document.querySelectorAll('[data-form^="signup"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: silently drop bot submissions.
      var hp = form.querySelector('.hp-field');
      if (hp && hp.value) { form.reset(); showFormSuccess(form); return; }

      if (!validateForm(form)) return;

      var emailInput = form.querySelector('input[type="email"]');
      var source = form.dataset.form.replace('signup-', '') || 'home';

      if (!supabase) {
        showFormError(form, 'Our signup service is temporarily unavailable. Please email dancewithdixon@gmail.com.');
        return;
      }
      setSubmitLoading(form, true);
      supabase.from('email_signups').insert({ email: emailInput.value.trim(), source: source })
        .then(function (res) {
          setSubmitLoading(form, false);
          if (res.error) {
            if (res.error.code === '23505') {
              // Duplicate email — still show success (already subscribed)
              form.reset();
              showFormSuccess(form);
            } else {
              console.error('Signup error:', res.error);
              showFormError(form, 'Something went wrong. Please try again.');
            }
          } else {
            form.reset();
            showFormSuccess(form);
          }
        });
    });
  });

  // -- EXPRESS INTEREST FORM (on-site, item 1.1) --
  // Writes the same audition_registrations row the Director app's /register
  // page writes. RLS (mig 136) only accepts an anon INSERT when
  // source='interest' AND payment_status='comped' AND amount_cents=0 -- any
  // other combination is rejected outright. Do not "simplify" this payload.
  (function interestForm() {
    var form = document.querySelector('[data-form="ps-interest"]');
    if (!form) return;

    var MAX_DANCERS = 4;
    var dancersWrap = document.getElementById('if-dancers');
    var addBtn = document.getElementById('if-add-dancer');
    var doneEl = document.getElementById('if-done');

    // Track cutoffs mirror the Director app's ProSeries config defaults
    // (track_elite_age_cutoff 8, track_pro_age_cutoff 12). The app reads them
    // live from proseries_config; the site carries the defaults so the form
    // never blocks on a fetch. Dixon confirms the real track at the placement
    // class, so a stale cutoff costs a slightly wrong preview line, nothing more.
    var ELITE_CUTOFF = 8;
    var PRO_CUTOFF = 12;
    var TRACK_NAME = { prep: 'Prep', elite: 'Elite', pro: 'Pro' };

    function easternTodayString() {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date());
    }

    function ageAsOf(dob, referenceDateISO) {
      if (!dob) return null;
      var birth = new Date(dob);
      var reference = new Date(referenceDateISO);
      if (isNaN(birth.getTime())) return null;
      var age = reference.getFullYear() - birth.getFullYear();
      var monthDiff = reference.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) age--;
      return age;
    }

    function assignTrack(dob) {
      var age = ageAsOf(dob, easternTodayString());
      if (age === null) return null;
      if (age < ELITE_CUTOFF) return 'prep';
      if (age < PRO_CUTOFF) return 'elite';
      return 'pro';
    }

    // Live "here is where that birthday starts them" line under each dancer.
    function updateTrackNote(fieldset) {
      var note = fieldset.querySelector('[data-track-note]');
      var dobEl = fieldset.querySelector('[data-child="date_of_birth"]');
      if (!note || !dobEl) return;
      var track = assignTrack(dobEl.value);
      var age = ageAsOf(dobEl.value, easternTodayString());
      if (!track || age === null || age < 3 || age > 25) {
        note.hidden = true;
        note.textContent = '';
        return;
      }
      var nameEl = fieldset.querySelector('[data-child="name"]');
      var who = (nameEl && nameEl.value.trim()) ? nameEl.value.trim() : 'That birthday';
      var verb = (nameEl && nameEl.value.trim()) ? ' starts in ' : ' starts them in ';
      note.textContent = who + verb + TRACK_NAME[track] +
        '. Dixon confirms the track at the placement class.';
      note.hidden = false;
    }

    function renumber() {
      var sets = dancersWrap.querySelectorAll('.ps-if-dancer');
      sets.forEach(function (fs, i) {
        fs.dataset.dancerIndex = String(i);
        var n = fs.querySelector('.ps-if-dancer-n');
        if (n) n.textContent = String(i + 1);
        fs.setAttribute('aria-label', 'Dancer ' + (i + 1));
      });
      if (addBtn) addBtn.hidden = sets.length >= MAX_DANCERS;
    }

    function addDancer() {
      var sets = dancersWrap.querySelectorAll('.ps-if-dancer');
      if (sets.length >= MAX_DANCERS) return;
      var i = sets.length;
      var fs = document.createElement('div');
      fs.className = 'ps-if-dancer';
      fs.setAttribute('role', 'group');
      fs.setAttribute('aria-label', 'Dancer ' + (i + 1));
      fs.dataset.dancerIndex = String(i);
      fs.innerHTML =
        '<div class="ps-if-legend">' +
          '<span class="ps-if-legend-txt">Dancer <span class="ps-if-dancer-n">' + (i + 1) + '</span></span>' +
          '<button type="button" class="ps-if-remove">Remove</button>' +
        '</div>' +
        '<div class="ps-if-row">' +
          '<div class="form-group">' +
            '<label for="if-child-name-' + i + '">First name</label>' +
            '<input type="text" id="if-child-name-' + i + '" data-child="name" required autocomplete="off" autocapitalize="words" placeholder="Dancer’s first name">' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="if-child-dob-' + i + '">Date of birth</label>' +
            '<input type="date" id="if-child-dob-' + i + '" data-child="date_of_birth" required min="1990-01-01" max="2026-12-31">' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="if-child-exp-' + i + '">Experience</label>' +
          '<select id="if-child-exp-' + i + '" data-child="experience_level" required>' +
            '<option value="">Select...</option>' +
            '<option value="beginner">0–2 years</option>' +
            '<option value="intermediate">3–5 years</option>' +
            '<option value="advanced">6–8 years</option>' +
            '<option value="elite">9+ years</option>' +
          '</select>' +
        '</div>' +
        '<p class="ps-if-track-note" data-track-note aria-live="polite" hidden></p>';
      dancersWrap.appendChild(fs);
      renumber();
      var first = fs.querySelector('input');
      if (first) first.focus();
    }

    if (addBtn) addBtn.addEventListener('click', addDancer);

    dancersWrap.addEventListener('click', function (e) {
      var rm = e.target.closest('.ps-if-remove');
      if (!rm) return;
      var fs = rm.closest('.ps-if-dancer');
      if (fs && dancersWrap.querySelectorAll('.ps-if-dancer').length > 1) {
        fs.remove();
        renumber();
      }
    });

    dancersWrap.addEventListener('input', function (e) {
      var fs = e.target.closest && e.target.closest('.ps-if-dancer');
      if (fs) updateTrackNote(fs);
    });
    dancersWrap.addEventListener('change', function (e) {
      var fs = e.target.closest && e.target.closest('.ps-if-dancer');
      if (fs) updateTrackNote(fs);
    });

    renumber();

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: silently drop bot submissions.
      var hp = form.querySelector('.hp-field');
      if (hp && hp.value) { showInterestDone(); return; }

      if (!validateForm(form)) return;

      var sets = Array.prototype.slice.call(dancersWrap.querySelectorAll('.ps-if-dancer'));
      var children = sets.map(function (fs) {
        var val = function (k) {
          var el = fs.querySelector('[data-child="' + k + '"]');
          return el ? el.value.trim() : '';
        };
        var dob = val('date_of_birth');
        return {
          name: val('name'),
          date_of_birth: dob,
          experience_level: val('experience_level'),
          preferred_track: assignTrack(dob) || 'prep',
          years_training: null,
          current_studios: '',
          medical_notes: '',
          allergies: '',
          additional_notes: '',
          status: 'registered'
        };
      });

      var phone = document.getElementById('if-parent-phone').value.trim();
      var howHeard = document.getElementById('if-how-heard').value;
      var note = document.getElementById('if-note').value.trim();

      var payload = {
        id: (window.crypto && window.crypto.randomUUID)
          ? window.crypto.randomUUID()
          : String(Date.now()) + '-' + Math.random().toString(16).slice(2),
        parent_name: document.getElementById('if-parent-name').value.trim(),
        parent_email: document.getElementById('if-parent-email').value.trim(),
        parent_phone: phone || null,
        address: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        emergency_contact_relationship: null,
        payment_method_preference: null,
        how_heard: howHeard || null,
        children: children,
        is_early_access: false,
        is_waitlisted: false,
        terms_agreed_at: null,
        source: 'interest',
        family_note: note || null,
        status: 'registered',
        payment_status: 'comped',
        amount_cents: 0
      };

      if (!supabase) {
        showFormError(form, 'Our form service is temporarily unavailable. Please email dancewithdixon@gmail.com and I’ll get right back to you.');
        return;
      }

      setSubmitLoading(form, true);
      // No .select() -- anon has no SELECT policy on audition_registrations
      // (mig 033), and asking for the row back turns a successful insert into
      // a misleading RLS error. The client-generated id above is the receipt.
      supabase.from('audition_registrations').insert(payload)
        .then(function (res) {
          setSubmitLoading(form, false);
          if (res.error) {
            console.error('Interest form error:', res.error);
            showFormError(form, 'Something went wrong. Please email dancewithdixon@gmail.com and I’ll get you on the list myself.');
            return;
          }
          window.__dwd_last_interest_id = payload.id; // QA receipt
          showInterestDone();
        });
    });

    function showInterestDone() {
      form.hidden = true;
      var wrap = document.getElementById('interest');
      if (wrap) {
        var title = wrap.querySelector(':scope > .ps-if-title');
        var sub = wrap.querySelector(':scope > .ps-if-sub');
        if (title) title.hidden = true;
        if (sub) sub.hidden = true;
      }
      if (doneEl) {
        doneEl.hidden = false;
        var h = doneEl.querySelector('.ps-if-title');
        if (h) {
          h.setAttribute('tabindex', '-1');
          h.focus({ preventScroll: true });
          h.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
    }
  })();

  // ── MERCH POLL FORM ──
  var merchForm = document.querySelector('[data-form="merch-poll"]');
  if (merchForm) {
    // Checkbox toggle → .is-selected on parent label (independent per card)
    merchForm.querySelectorAll('input[name="category"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var card = cb.closest('.merch-category-card');
        if (!card) return;
        card.classList.toggle('is-selected', cb.checked);
      });
    });

    merchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var checked = merchForm.querySelectorAll('input[name="category"]:checked');
      if (!checked.length) {
        showFormError(merchForm, 'Pick at least one category to vote.');
        return;
      }
      var rows = Array.prototype.map.call(checked, function (cb) { return { category: cb.value }; });

      if (!supabase) {
        showFormError(merchForm, 'Voting is temporarily unavailable. Please try again shortly.');
        return;
      }
      setSubmitLoading(merchForm, true);
      supabase.from('merch_poll_responses').insert(rows)
        .then(function (res) {
          setSubmitLoading(merchForm, false);
          if (res.error) {
            console.error('Merch vote error:', res.error);
            showFormError(merchForm, 'Something went wrong. Please try again.');
            return;
          }
          merchForm.style.display = 'none';
          var success = document.querySelector('.merch-vote-success');
          if (success) success.style.display = 'block';
        });
    });
  }

  // Clear invalid state on input
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(function (field) {
    field.addEventListener('input', function () {
      field.classList.remove('invalid');
    });
    field.addEventListener('change', function () {
      field.classList.remove('invalid');
    });
  });

  // ── HOME HERO LOOP (item 2.1) ──
  // Plays only when the visitor has not asked for reduced motion, and only
  // once the browser says it can actually play through. Until then the still
  // underneath is what shows, which is also what a no-JS, no-video or
  // blocked-media visitor gets. The caption swaps with the state rather than
  // crediting one dancer over footage of another.
  (function heroLoop() {
    var video = document.getElementById('hero-loop');
    if (!video) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced && reduced.matches) return;

    var photo = video.closest('.hero-photo');

    function on() {
      if (photo) photo.classList.add('hero-loop-on');
    }
    function off() {
      if (photo) photo.classList.remove('hero-loop-on');
    }

    video.addEventListener('playing', on);
    video.addEventListener('error', off);
    video.addEventListener('stalled', off);

    function start() {
      var attempt = video.play();
      // Autoplay can be refused (Low Power Mode, data saver, a per-site
      // setting). That is a normal outcome, not an error to log: the still
      // stays and the page is unchanged.
      if (attempt && attempt.catch) attempt.catch(function () { off(); });
    }

    var loaded = false;
    function begin() {
      if (video.readyState >= 3) { start(); return; }
      // play() on a preload="none" video starts the fetch itself. The old
      // load()-then-play() pair made Chrome open the file twice (2026-09-03:
      // 1.3 MB of range requests for a 700 KB loop on every home load).
      if (!loaded) {
        loaded = true;
        start();
      }
    }

    // Only fetch and play while the hero is actually on screen. The video lives
    // on #page-home, which is display:none on every other route, so an
    // unconditional load meant every visit to /#proseries still pulled the file
    // and then aborted the request. An observer never fires for an element with
    // no box, so this costs nothing off Home and pauses on scroll-away.
    if ('IntersectionObserver' in window && photo) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) begin();
          else if (!video.paused) video.pause();
        });
      }, { threshold: 0.15 }).observe(photo);
    } else {
      begin();
    }

    // If the visitor turns reduced motion on mid-session, stop.
    if (reduced && reduced.addEventListener) {
      reduced.addEventListener('change', function (e) {
        if (e.matches) { video.pause(); off(); }
      });
    }
  })();

  // ── TEACHERS / ABOUT PHOTO SLIDESHOW ──
  // (.about-slide was the original About page; .tch-slide is the new Teachers
  //  Dixon-director photo column. Same shuffle cycler handles both.)
  ['.about-slide', '.tch-slide'].forEach(function (sel) {
    var slides = document.querySelectorAll(sel);
    if (slides.length < 2) return;
    var i = 0;
    // Slides after the first carry data-src/data-srcset (2026-09-03) so a
    // Teachers visit fetches one photo, not twelve. Hydrate the slide that
    // is about to show, and the one after it so the fade never waits.
    function hydrate(el) {
      if (!el || !el.dataset.src) return;
      if (el.dataset.srcset) el.srcset = el.dataset.srcset;
      el.src = el.dataset.src;
      delete el.dataset.src;
      delete el.dataset.srcset;
    }
    hydrate(slides[1]);
    setInterval(function () {
      slides[i].classList.remove('active');
      i = (i + 1) % slides.length;
      hydrate(slides[i]);
      hydrate(slides[(i + 1) % slides.length]);
      slides[i].classList.add('active');
    }, 5000);
  });

  // ── PATH NAVIGATION ──
  // Intercept clicks on in-site path links so the SPA keeps its state instead
  // of re-downloading the whole shell. Anything this does not recognise —
  // /fullout, /dwdcon, a PDF, an external host — is left alone and navigates
  // normally, which is the point: this is an enhancement, not a router that
  // owns every link on the page.
  if (supportsPathRouting) {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      if (a.origin && a.origin !== window.location.origin) return;

      var href = a.getAttribute('href');
      if (!href || href.charAt(0) !== '/') return;

      var base = href.split('#')[0].split('?')[0];
      var route = PATH_ROUTE[lastSegment(base)] || (base === '/' ? 'home' : null);
      if (!route) return;

      e.preventDefault();
      closeMobileMenu();

      var target = ROUTE_PATH[route];
      if (window.location.pathname.replace(/\/$/, '') === target.replace(/\/$/, '') &&
          !window.location.hash) {
        window.scrollTo(0, 0);
        return;
      }

      try { window.history.pushState({ route: route }, '', target); } catch (err) {}
      showPage(route);
    });

    window.addEventListener('popstate', function () {
      var hash = window.location.hash.replace('#', '').split('?')[0];
      if (hash) {
        if (validPages.includes(hash)) { showPage(hash); return; }
        var el = document.getElementById(hash);
        if (el) {
          var owning = el.closest('.page');
          var name = owning ? (owning.id || '').replace(/^page-/, '') : '';
          if (validPages.includes(name)) showPage(name);
          scrollToAnchor(hash);
          return;
        }
      }
      showPage(routeFromPath() || 'home');
    });
  }

  // ── INIT: Load correct page from hash ──
  // A hash that names an ELEMENT rather than a page (e.g. /#interest, which
  // lives inside #page-proseries) has to resolve on first load too, not only
  // on hashchange — otherwise a shared or bookmarked deep link silently lands
  // on Home. Resolve the owning page first, then scroll to the anchor.
  (function routeInitialAnchor() {
    var raw = window.location.hash.replace('#', '').split('?')[0];
    if (!raw || validPages.includes(raw) || legacyHashRedirects[raw]) return;
    var el = document.getElementById(raw);
    if (!el) return;
    var owning = el.closest('.page');
    if (!owning) return;
    var pageName = (owning.id || '').replace(/^page-/, '');
    if (!validPages.includes(pageName)) return;
    showPage(pageName);
    scrollToAnchor(raw);
    routedByAnchor = true;
  })();

  applyContactReasonFromHash();

  // A generated shell sets window.__dwd_route; deriving it from the path as
  // well means a pushState URL still resolves after a hard reload, and that the
  // two can never disagree.
  var pathRoute = routeFromPath() || (validPages.includes(window.__dwd_route) ? window.__dwd_route : null);

  var initialPage = getPageFromHash();
  if (routedByAnchor) {
    // handled above
  } else if (!window.location.hash && pathRoute) {
    showPage(pathRoute);
    if (supportsPathRouting) {
      try { window.history.replaceState({ route: pathRoute }, '', ROUTE_PATH[pathRoute]); } catch (e) {}
    }
  } else if (initialPage !== 'home') {
    showPage(initialPage);
  } else {
    // Fresh no-hash load never calls showPage, so init the mobile CTA bar here.
    var mobInit = document.getElementById('mob-cta');
    if (mobInit) { mobInit.hidden = false; document.body.classList.add('mob-cta-on'); }
    // Trigger reveals on initial home page
    setTimeout(function () {
      var activePage = document.querySelector('.page.active');
      if (activePage) {
        activePage.querySelectorAll('.reveal').forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight) {
            el.classList.add('visible');
          }
        });
      }
    }, 100);
  }

})();

/* ============================================================
   ProSeries Track Tabs (Prep / Elite / Pro accordion)
   Click a tab to swap which detail panel is visible.
   ============================================================ */
(function () {
  function activateTrack(name) {
    document.querySelectorAll('.track-tab').forEach(function (t) {
      t.setAttribute('aria-selected', t.dataset.trackTab === name ? 'true' : 'false');
    });
    document.querySelectorAll('.track-detail').forEach(function (p) {
      p.setAttribute('data-active', p.dataset.track === name ? 'true' : 'false');
    });
  }
  document.addEventListener('click', function (ev) {
    var tab = ev.target.closest('.track-tab');
    if (!tab) return;
    var name = tab.dataset.trackTab;
    if (!name) return;
    ev.preventDefault();
    activateTrack(name);
  });
  // Keyboard support: left/right arrows move between tabs when one is focused
  document.addEventListener('keydown', function (ev) {
    var tab = document.activeElement;
    if (!tab || !tab.matches || !tab.matches('.track-tab')) return;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    var tabs = Array.from(document.querySelectorAll('.track-tab'));
    var idx = tabs.indexOf(tab);
    var next = ev.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
    tabs[next].focus();
    activateTrack(tabs[next].dataset.trackTab);
    ev.preventDefault();
  });
})();

// ── CHAPTER RAIL SCROLLSPY (added 2026-07-21) ──
// Highlights the active link in a .chapter-rail as its target section scrolls
// through view. Rail links keep default anchor behavior (no preventDefault) —
// the hashchange handler above already smooth-scrolls + activates the page.
// Selection is geometric (last target above the 40% viewport line) rather than
// trusting IntersectionObserver entries: short targets (e.g. the #dwdc-next
// banner) share the observer band with their tall neighbors and lose.
(function () {
  var rails = document.querySelectorAll('.chapter-rail');
  if (!rails.length) return;

  rails.forEach(function (rail) {
    var pairs = Array.from(rail.querySelectorAll('a[href^="#"]'))
      .map(function (link) {
        var target = document.getElementById(link.getAttribute('href').slice(1));
        return target ? { link: link, target: target } : null;
      })
      .filter(Boolean);
    if (!pairs.length) return;

    var lastActive = null;
    function setActive(link) {
      pairs.forEach(function (p) {
        p.link.classList.toggle('active', p.link === link);
      });
      // Keep the active chip visible in the horizontal mobile rail — but only when
      // it changes, so we never fight the user's own scroll.
      if (link && link !== lastActive) {
        lastActive = link;
        if (link.scrollIntoView) {
          try { link.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) {}
        }
      }
    }

    function update() {
      if (!rail.getClientRects().length) return; // page not active
      var line = window.innerHeight * 0.4;
      var current = pairs[0];
      pairs.forEach(function (p) {
        if (p.target.getBoundingClientRect().top <= line) current = p;
      });
      setActive(current.link);
    }

    update();
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener('hashchange', function () {
      setTimeout(update, 60);
    });
  });
})();
