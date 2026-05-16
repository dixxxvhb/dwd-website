// A·Muse in Space registration form handler.
// Standalone: doesn't depend on js/main.js. Loads the supabase client from
// the <script> tag in amuse-in-space.html.
//
// RLS pattern: anon INSERT only on amuse_registrations. Client generates
// the UUID locally and does NOT chain .select() (post mig-033 lockdown).

(function () {
  'use strict';

  var SUPABASE_URL = 'https://ipulrvhiuvgbvralybxx.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdWxydmhpdXZnYnZyYWx5Ynh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2ODI0MzAsImV4cCI6MjA4NjI1ODQzMH0.O7MDYxkfqhQGNI58xyDq3HhsIm12OmgZRkJlyTXL0ug';

  if (!window.supabase) {
    console.error('[amuse] supabase-js not loaded');
    return;
  }
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('[data-form="amuse-registration"]');
    if (!form) return;

    var successEl = form.querySelector('.form-success');
    var errorEl = form.querySelector('.form-error');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitText = submitBtn ? submitBtn.textContent : 'Send it';

    function setLoading(loading) {
      if (!submitBtn) return;
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? 'Sending…' : submitText;
    }

    function showError(msg) {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.classList.add('show');
      setTimeout(function () { errorEl.classList.remove('show'); }, 6000);
    }

    function showSuccess() {
      if (!successEl) return;
      successEl.classList.add('show');
    }

    function setFieldError(field, msg) {
      field.classList.add('invalid');
      var slot = field.parentElement.querySelector('.form-field-error');
      if (!slot) {
        slot = document.createElement('span');
        slot.className = 'form-field-error';
        field.parentElement.appendChild(slot);
      }
      slot.textContent = msg;
      slot.classList.add('show');
    }
    function clearFieldError(field) {
      field.classList.remove('invalid');
      var slot = field.parentElement.querySelector('.form-field-error');
      if (slot) { slot.textContent = ''; slot.classList.remove('show'); }
    }

    function validate() {
      var ok = true;
      var name = form.querySelector('#amuse-name');
      var email = form.querySelector('#amuse-email');
      [name, email].forEach(clearFieldError);

      if (!name.value.trim()) { setFieldError(name, 'Your name?'); ok = false; }
      var emailVal = email.value.trim();
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal) { setFieldError(email, 'Email so I can reach you.'); ok = false; }
      else if (!emailRe.test(emailVal)) { setFieldError(email, 'That email looks off — try again?'); ok = false; }

      if (!ok) {
        var firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) firstInvalid.focus();
      }
      return ok;
    }

    // Clear field errors as the user fixes them.
    form.addEventListener('input', function (e) {
      if (e.target && e.target.classList.contains('invalid')) clearFieldError(e.target);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: silently drop if the hidden field was filled (bot).
      var hp = form.querySelector('#amuse-website');
      if (hp && hp.value) {
        showSuccess(); // pretend it worked
        return;
      }

      if (!validate()) return;

      var id = (window.crypto && typeof window.crypto.randomUUID === 'function')
        ? window.crypto.randomUUID()
        : null;
      if (!id) {
        showError('Your browser is missing a needed feature. Please update and try again.');
        return;
      }

      var payload = {
        id: id,
        full_name: form.querySelector('#amuse-name').value.trim(),
        email:     form.querySelector('#amuse-email').value.trim(),
        phone:     form.querySelector('#amuse-phone').value.trim() || null,
        rehearsal_may_24: form.querySelector('#r-may-24').checked,
        rehearsal_may_31: form.querySelector('#r-may-31').checked,
        rehearsal_jun_14: form.querySelector('#r-jun-14').checked,
        rehearsal_jun_21: form.querySelector('#r-jun-21').checked,
        attending_show:   form.querySelector('#show-jun-27').checked,
        notes:      form.querySelector('#amuse-notes').value.trim() || null,
      };

      setLoading(true);

      // NO .select() chain — anon can't read amuse_registrations post-mig-033.
      sb.from('amuse_registrations').insert(payload).then(function (res) {
        setLoading(false);
        if (res && res.error) {
          console.error('[amuse] insert error', res.error);
          showError("Couldn't send that — please try again, or text (208) 241-1899.");
          return;
        }
        form.reset();
        showSuccess();
        // Scroll the success message into view on small screens.
        if (successEl && successEl.scrollIntoView) {
          successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  });
})();
