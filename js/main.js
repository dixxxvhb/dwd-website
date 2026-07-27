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

  function getPageFromHash() {
    const hash = window.location.hash.replace('#', '').split('?')[0];
    return validPages.includes(hash) ? hash : 'home';
  }

  function showPage(name) {
    if (!validPages.includes(name)) name = 'home';

    // Update pages
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.remove('active');
    });
    var target = document.getElementById('page-' + name);
    if (target) target.classList.add('active');

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
      'home': 'Dance With Dixon | Orlando Dance Company',
      'adult-company': 'Adult Company | DWD',
      'proseries': 'ProSeries | DWD',
      'teachers': 'Teachers | DWD',

      'gallery': 'Gallery | DWD',
      'shop': 'Merch | DWD',
      'contact': 'Contact | DWD',
      'campaign': 'Campaign HQ | DWD',
      'analytics': 'Analytics | DWD',
      'early-access': 'ProSeries Early Access | DWD'
    };
    document.title = titles[name] || titles['home'];
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
          // showPage scrolls to top — wait a tick, then scroll to the anchor.
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              var el = document.getElementById(hash);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            });
          });
          return;
        }
      }
      target.scrollIntoView({ behavior: 'smooth' });
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
      if (!validateForm(contactForm)) return;

      var activeToggle = contactForm.querySelector('.toggle-group .toggle-btn.active');
      var payload = {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        phone: '',
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
  var initialPage = getPageFromHash();
  if (initialPage !== 'home') {
    showPage(initialPage);
  } else {
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

