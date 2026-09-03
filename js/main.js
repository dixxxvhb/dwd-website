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
    'gallery', 'shop', 'contact', 'campaign', 'analytics', 'privacy',
    'early-access'
  ];

  // Legacy hash redirects — Performances was merged into Collective (#adult-company),
  // About was merged into Teachers, and A·Muse content lives at #amuse.
  const legacyHashRedirects = {
    'classes-events': 'adult-company',
    'performances':   'adult-company',
    'about':          'teachers'
  };
  (function applyLegacyRedirect() {
    var raw = window.location.hash.replace('#', '').split('?')[0];
    if (legacyHashRedirects[raw]) {
      window.location.hash = '#' + legacyHashRedirects[raw];
    }
  })();

  var routedByAnchor = false;

  function getPageFromHash() {
    const hash = window.location.hash.replace('#', '').split('?')[0];
    return validPages.includes(hash) ? hash : 'home';
  }

  // ── ANCHOR SCROLLING ──
  // #interest sits roughly 14,700px down the ProSeries page, and that page is
  // still growing while we scroll: campaign.js flips date-gated bands from
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
      mob.hidden = !['home', 'proseries', 'early-access'].includes(name);
      document.body.classList.toggle('mob-cta-on', !mob.hidden);
    }

    // Update nav (sidebar — hidden but kept for compat — and topnav)
    document.querySelectorAll('.sidebar nav a, .topnav nav a, .topnav .brand, .topnav .nav-cta').forEach(function (a) {
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
      'adult-company': 'Adult Company | DWD',
      // Season One is the ProSeries identity for the 2026-27 season, so the
      // route title carries it (audit M3, 2026-08-16 — the season appeared 22
      // times in the page body and zero times in any metadata).
      'proseries': 'ProSeries: Season One | DWD',
      'teachers': 'Teachers | DWD',

      'gallery': 'Gallery | DWD',
      'shop': 'Merch | DWD',
      'contact': 'Contact | DWD',
      'campaign': 'Campaign HQ | DWD',
      'analytics': 'Analytics | DWD',
      'early-access': 'ProSeries Early Access | DWD'
    };
    document.title = titles[name] || titles['home'];

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

    // If hash matches a valid page, route to it
    if (validPages.includes(hash)) {
      showPage(hash);
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
  var hamburger = document.getElementById('hamburger');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');

  function openMobileMenu() {
    sidebar.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (sidebar) sidebar.classList.remove('open');
    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    if (overlay) overlay.classList.remove('visible');
    var topnav = document.getElementById('topnav');
    var toggle = document.getElementById('topnav-toggle');
    if (topnav) topnav.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-open');
    document.body.style.overflow = '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      if (sidebar.classList.contains('open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
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

  function showFormSuccess(form) {
    // Show modal for email signup forms, fall back to inline for contact/other
    var isEmailForm = form.dataset.form && form.dataset.form.indexOf('signup') !== -1;
    var isPSInterest = form.dataset.form === 'proseries-interest';
    if (isEmailForm || isPSInterest) {
      showSuccessModal();
      return;
    }
    var successEl = form.parentElement.querySelector('.form-success') ||
                    form.querySelector('.form-success') ||
                    form.nextElementSibling;
    if (successEl && successEl.classList.contains('form-success')) {
      successEl.classList.add('show');
      setTimeout(function () { successEl.classList.remove('show'); }, 5000);
    }
  }

  function showSuccessModal() {
    // Don't create duplicates
    if (document.getElementById('dwd-success-modal')) {
      document.getElementById('dwd-success-modal').classList.add('open');
      return;
    }

    var modal = document.createElement('div');
    modal.id = 'dwd-success-modal';
    modal.className = 'dwd-success-modal';
    modal.innerHTML = '<div class="dwd-success-backdrop"></div>' +
      '<div class="dwd-success-card">' +
        '<button class="dwd-success-close" aria-label="Close">&times;</button>' +
        '<img src="images/logos/DWDPS-pink.png" alt="dwdPS" class="dwd-success-logo">' +
        '<h2 class="dwd-success-title">You\'re on the list.</h2>' +
        '<p class="dwd-success-sub">We\'ll reach out when it\'s time. In the meantime, follow along.</p>' +
        '<a href="https://instagram.com/dwdproseries" target="_blank" rel="noopener" class="dwd-success-btn">Follow @dwdproseries</a>' +
      '</div>';

    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(function () { modal.classList.add('open'); });

    // Close handlers
    modal.querySelector('.dwd-success-close').addEventListener('click', function () {
      modal.classList.remove('open');
    });
    modal.querySelector('.dwd-success-backdrop').addEventListener('click', function () {
      modal.classList.remove('open');
    });
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

  // ── TEACHERS / ABOUT PHOTO SLIDESHOW ──
  // (.about-slide was the original About page; .tch-slide is the new Teachers
  //  Dixon-director photo column. Same shuffle cycler handles both.)
  ['.about-slide', '.tch-slide'].forEach(function (sel) {
    var slides = document.querySelectorAll(sel);
    if (slides.length < 2) return;
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove('active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('active');
    }, 5000);
  });

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

  var initialPage = getPageFromHash();
  if (routedByAnchor) {
    // handled above
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
