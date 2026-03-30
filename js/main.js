/* ═══════════════════════════════════════════════
   DWD — Dance With Dixon
   Main JavaScript
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── HASH ROUTING ──
  const validPages = [
    'home', 'about', 'adult-company', 'proseries',
    'classes-events', 'gallery', 'shop', 'contact', 'campaign'
  ];

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

    // Update nav
    document.querySelectorAll('.sidebar nav a').forEach(function (a) {
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
      'about': 'About Dixon Bowles | DWD',
      'adult-company': 'Adult Company | DWD',
      'proseries': 'ProSeries | DWD',
      'classes-events': 'Classes & Events | DWD',

      'gallery': 'Gallery | DWD',
      'shop': 'Shop | DWD',
      'contact': 'Contact | DWD',
      'campaign': 'Campaign HQ | DWD'
    };
    document.title = titles[name] || titles['home'];
  }

  // Listen for hash changes
  window.addEventListener('hashchange', function () {
    var hash = window.location.hash.replace('#', '').split('?')[0];

    // If hash matches a valid page, route to it
    if (validPages.includes(hash)) {
      showPage(hash);
      return;
    }

    // If hash matches an element ID on the current page, scroll to it
    var target = document.getElementById(hash);
    if (target) {
      closeMobileMenu();
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
    sidebar.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('visible');
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

  function collectLightboxImages() {
    lightboxImages = Array.from(document.querySelectorAll('[data-lightbox]'));
  }

  function openLightbox(index) {
    if (!lightboxImages.length) return;
    lightboxIndex = index;
    lightboxImg.src = lightboxImages[lightboxIndex].src;
    lightboxImg.alt = lightboxImages[lightboxIndex].alt;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
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

  // Bind gallery image clicks
  collectLightboxImages();
  lightboxImages.forEach(function (img, i) {
    img.addEventListener('click', function () {
      openLightbox(i);
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

  // Lightbox keyboard nav
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });

  // ── SUPABASE CLIENT ──
  var supabaseUrl = 'https://ipulrvhiuvgbvralybxx.supabase.co';
  var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdWxydmhpdXZnYnZyYWx5Ynh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2ODI0MzAsImV4cCI6MjA4NjI1ODQzMH0.O7MDYxkfqhQGNI58xyDq3HhsIm12OmgZRkJlyTXL0ug';
  var supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  // ── FORM HELPERS ──
  function validateForm(form) {
    var valid = true;
    form.querySelectorAll('[required]').forEach(function (field) {
      field.classList.remove('invalid');
      if (!field.value.trim()) {
        field.classList.add('invalid');
        valid = false;
      }
      if (field.type === 'email' && field.value.trim()) {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(field.value.trim())) {
          field.classList.add('invalid');
          valid = false;
        }
      }
    });
    if (!valid) {
      var firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
    }
    return valid;
  }

  function showFormSuccess(form) {
    var successEl = form.parentElement.querySelector('.form-success') ||
                    form.querySelector('.form-success') ||
                    form.nextElementSibling;
    if (successEl && successEl.classList.contains('form-success')) {
      successEl.classList.add('show');
      setTimeout(function () { successEl.classList.remove('show'); }, 5000);
    }
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

  // ── PROSERIES INTEREST FORM ──
  var psForm = document.querySelector('[data-form="proseries-interest"]');
  if (psForm) {
    psForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(psForm)) return;

      var trackVal = document.getElementById('ps-track').value;
      var trackMap = {
        'Pro (Ages 12+, 10 hrs/wk)': 'pro',
        'Elite (Ages 8\u201312, 6 hrs/wk)': 'elite',
        'Prep (Ages 5\u20138, 4 hrs/wk)': 'prep',
        'Not sure yet': 'unsure'
      };

      var child = {
        name: document.getElementById('ps-dancer-name').value.trim(),
        age: document.getElementById('ps-age').value ? parseInt(document.getElementById('ps-age').value, 10) : null,
        dance_experience: document.getElementById('ps-experience').value || '',
        preferred_track: trackMap[trackVal] || 'unsure',
        notes: ''
      };

      var payload = {
        parent_name: document.getElementById('ps-parent-name').value.trim(),
        parent_email: document.getElementById('ps-email').value.trim() || null,
        parent_phone: document.getElementById('ps-phone').value.trim() || null,
        children: [child],
        how_heard: document.getElementById('ps-heard').value || '',
        general_notes: document.getElementById('ps-questions').value.trim() || ''
      };

      setSubmitLoading(psForm, true);
      supabase.from('proseries_interests').insert(payload)
        .then(function (res) {
          setSubmitLoading(psForm, false);
          if (res.error) {
            console.error('Interest form error:', res.error);
            showFormError(psForm, 'Something went wrong. Please try again.');
          } else {
            psForm.reset();
            showFormSuccess(psForm);
          }
        });
    });
  }

  // ── CONTACT FORM ──
  var contactForm = document.querySelector('[data-form="contact"]');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(contactForm)) return;

      var payload = {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        phone: document.getElementById('contact-phone').value.trim() || '',
        reason: document.getElementById('contact-reason').value || '',
        how_heard: document.getElementById('contact-heard').value || '',
        message: document.getElementById('contact-message').value.trim() || ''
      };

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

  // Clear invalid state on input
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(function (field) {
    field.addEventListener('input', function () {
      field.classList.remove('invalid');
    });
    field.addEventListener('change', function () {
      field.classList.remove('invalid');
    });
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
