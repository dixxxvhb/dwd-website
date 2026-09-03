#!/usr/bin/env node
/**
 * End-to-end behaviour check of everything dynamic on the site.
 *
 *   node scripts/qa/live.js
 *
 * The interest-form submit is exercised for real, but its INSERT is intercepted
 * so the run leaves no row behind. The payload it would have sent is captured
 * and checked against the RLS contract instead.
 *
 * That interception only works if no service worker is controlling the page.
 * A controlling SW makes its own fetches, and Puppeteer's page-level request
 * interception cannot see them — the request sails past the stub and hits the
 * live database. That is not theoretical: it happened here, twice, and put two
 * junk rows in audition_registrations before it was spotted. So registration is
 * neutered before any script runs, and the check ABORTS rather than submit if a
 * worker is in control anyway.
 */
const puppeteer = require('C:/Users/bowle/Code/DWDC-Instagram-Posts/node_modules/puppeteer');
const B = 'http://localhost:8790';
const CORS = {
  'access-control-allow-origin': '*', 'access-control-allow-headers': '*',
  'access-control-allow-methods': '*', 'access-control-expose-headers': '*',
};

(async () => {
  const browser = await puppeteer.launch({
    channel: 'chrome', headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  let fails = 0;
  const say = (ok, label, detail) => {
    if (!ok) fails++;
    console.log((ok ? 'ok   ' : 'FAIL ') + label.padEnd(46) + (detail ?? ''));
  };

  /* ── 1. Episode Guide renders live from the view ── */
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(B + '/proseries', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2600));
    const eg = await p.evaluate(() => {
      const list = document.querySelector('[data-episode-list]');
      return {
        state: list.getAttribute('data-episode-list'),
        rows: [...list.querySelectorAll('.s1-ep')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
        next: (list.querySelector('.s1-ep--next .s1-ep-title') || {}).textContent || null,
      };
    });
    say(eg.state === 'live' && eg.rows.length === 7, 'Episode Guide live from public_site_episodes', `${eg.rows.length} rows`);
    say(/Titans/.test(eg.next || ''), 'Up next chip on the soonest competition', (eg.next || '').replace(/\s+/g, ' ').slice(0, 40));
    await p.close();
  }

  /* ── 2. Collective next class: empty state is the live state ── */
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(B + '/collective', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2600));
    const d = await p.evaluate(() => {
      const b = document.getElementById('dwdc-next-class');
      return { state: b.dataset.state, text: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) };
    });
    say(d.state === 'empty' && /next class date is being set/i.test(d.text),
      'Collective next class: empty state renders', d.state);
    await p.close();
  }

  /* ── 3. Hero loop plays ── */
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(B + '/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 3500));
    const v = await p.evaluate(() => {
      const el = document.getElementById('hero-loop');
      const cap = document.querySelector('.caption--loop');
      return {
        playing: !el.paused, t: +el.currentTime.toFixed(1),
        on: el.closest('.hero-photo').classList.contains('hero-loop-on'),
        caption: getComputedStyle(cap).display !== 'none' ? cap.textContent.trim() : null,
      };
    });
    say(v.playing && v.on && v.t > 0.5, 'Home hero loop plays', `t=${v.t}s`);
    say(/^Daisy/.test(v.caption || ''), 'Loop caption credits the right dancer', v.caption);
    await p.close();
  }

  /* ── 4. Chair counts come from season.js everywhere ── */
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(B + '/proseries', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const c = await p.evaluate(() => {
      const sites = [...document.querySelectorAll('[data-chairs]')];
      window.DWD_SEASON.chairs.prep.filled = 9;
      window.DWD_SEASON.render();
      const after = sites.filter((e) => /9 of 10|Prep 1\b|Prep has one/.test(e.textContent)).length;
      window.DWD_SEASON.chairs.prep.filled = 5;
      window.DWD_SEASON.render();
      return { total: sites.length, reacted: after };
    });
    say(c.total === 12 && c.reacted >= 4, 'Chair counts render from js/season.js',
      `${c.total} sites, ${c.reacted} follow one edit`);
    await p.close();
  }

  /* ── 5. Interest form: full client path, insert intercepted ── */
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 390, height: 844 });
    let payload = null;
    // Neuter the service worker BEFORE any page script runs. See the header.
    await p.evaluateOnNewDocument(() => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.register = () => Promise.reject(new Error('disabled for QA'));
      }
    });
    await p.goto(B + '/', { waitUntil: 'networkidle2' });
    await p.evaluate(async () => {
      const rs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(rs.map((r) => r.unregister()));
      const ks = await caches.keys();
      await Promise.all(ks.map((k) => caches.delete(k)));
    });
    await p.setCacheEnabled(false);
    await p.setRequestInterception(true);
    p.on('request', (q) => {
      if (q.url().includes('audition_registrations')) {
        if (q.method() === 'OPTIONS') return q.respond({ status: 204, headers: CORS, body: '' });
        try { payload = JSON.parse(q.postData()); } catch (e) { payload = 'unparseable'; }
        return q.respond({ status: 201, headers: CORS, contentType: 'application/json', body: '[]' });
      }
      q.continue();
    });
    await p.goto(B + '/proseries#interest', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 3000));

    // Hard stop: submitting while a worker controls the page writes to the
    // live database.
    if (await p.evaluate(() => !!navigator.serviceWorker.controller)) {
      say(false, 'ABORT: a service worker still controls the page', 'refusing to submit');
      await p.close();
      await browser.close();
      process.exit(1);
    }

    // Submit empty first: validation must stop it.
    await p.click('.ps-if-submit');
    await new Promise((r) => setTimeout(r, 400));
    const blocked = await p.evaluate(() => ({
      sent: !!window.__dwd_last_interest_id,
      invalid: document.querySelectorAll('.ps-if .invalid').length,
    }));
    say(!blocked.sent && blocked.invalid > 0, 'Empty submit blocked with inline errors',
      `${blocked.invalid} fields flagged`);

    await p.type('#if-parent-name', 'Walkthrough Check');
    await p.type('#if-parent-email', 'walkthrough@example.com');
    await p.type('#if-child-name-0', 'Rowan');
    await p.evaluate(() => {
      const d = document.getElementById('if-child-dob-0');
      d.value = '2013-06-01';
      d.dispatchEvent(new Event('input', { bubbles: true }));
      d.dispatchEvent(new Event('change', { bubbles: true }));
      const e = document.getElementById('if-child-exp-0');
      e.value = 'advanced';
      e.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 300));
    const note = await p.evaluate(() => {
      const n = document.querySelector('[data-track-note]');
      return n && !n.hidden ? n.textContent.trim() : null;
    });
    say(/starts in Pro/.test(note || ''), 'Live track preview reads the birthday', note);

    await p.click('.ps-if-submit');
    await new Promise((r) => setTimeout(r, 1500));
    const done = await p.evaluate(() => ({
      formHidden: document.querySelector('[data-form="ps-interest"]').hidden,
      doneShown: !document.getElementById('if-done').hidden,
    }));
    say(done.formHidden && done.doneShown, 'Success state replaces the form in place');

    const ok = payload && typeof payload === 'object' &&
      payload.source === 'interest' && payload.payment_status === 'comped' &&
      payload.amount_cents === 0 && payload.status === 'registered' &&
      Array.isArray(payload.children) && payload.children[0].preferred_track === 'pro' &&
      payload.children[0].status === 'registered' && typeof payload.id === 'string';
    say(ok, 'Payload matches the RLS contract',
      payload ? `source=${payload.source} pay=${payload.payment_status} amt=${payload.amount_cents} track=${payload.children[0].preferred_track}` : 'no request captured');
    await p.close();
  }

  /* ── 6. No off-domain CTA anywhere, on any route ── */
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    const bad = [];
    for (const r of ['', 'proseries', 'collective', 'teachers', 'gallery', 'contact', 'privacy']) {
      await p.goto(B + '/' + r, { waitUntil: 'networkidle2' });
      await new Promise((x) => setTimeout(x, 1800));
      const found = await p.evaluate(() => [...document.querySelectorAll('a[href]')]
        .map((a) => a.href)
        .filter((h) => /netlify\.app/.test(h)));
      if (found.length) bad.push(r + ': ' + found.join(','));
    }
    say(bad.length === 0, 'Zero off-domain CTAs on every route', bad.join(' | '));
    await p.close();
  }

  await browser.close();
  console.log(fails ? `\n${fails} FAILURES` : '\nLIVE BEHAVIOUR ALL GOOD');
  process.exit(fails ? 1 : 0);
})();
