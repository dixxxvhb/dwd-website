#!/usr/bin/env node
/**
 * Find CSS rules whose selectors match nothing, anywhere, in any state.
 *
 *   node scripts/qa/dead-css.js [outFile.json]
 *
 * Why selector matching and not page.coverage.startCSSCoverage(): coverage
 * reports which BYTES were exercised during one session, so every :hover rule,
 * every unmatched media query and every state you did not happen to trigger
 * comes back "unused". Acting on that deletes working code. Matching asks a
 * different and much safer question — is there any element in the document this
 * selector could ever apply to — and a :hover rule on a button that exists
 * answers yes.
 *
 * To keep that honest the page is walked through every state the site has:
 * every route, both widths, all four Season One states, ?launched=1 with every
 * date gate forced open, and the JS-built UI (an extra dancer row in the
 * interest form, both forms in their success state, every <details> open, the
 * Episode Guide and the Collective next-class block rendered from their views).
 *
 * A selector that still matches nothing after all of that is a candidate. It is
 * a CANDIDATE, not a verdict: read the list before deleting anything. Selectors
 * for elements built by code paths this script does not reach will show up here
 * too, which is exactly why the output is a report and not an edit.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('C:/Users/bowle/Code/DWDC-Instagram-Posts/node_modules/puppeteer');

const BASE = process.env.QA_BASE || 'http://localhost:8790';
const OUTFILE = process.argv[2] || null;

const CSS_FILES = [
  'styles', 'additions', 'editorial', 'rebrand', 'audition',
  'poster-pages', 'tighten', 'arms', 'season1', 'story', 'convert', 'next-level',
];

const ROUTES = ['home', 'proseries', 'adult-company', 'teachers', 'gallery', 'shop', 'contact', 'privacy'];
const S1_STATES = ['premiere', 'midseason', 'finale', 'wrapped'];

/* ── Extract selectors from a stylesheet, with their source position ───── */

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function extractRules(css, file) {
  const clean = stripComments(css);
  const rules = [];
  let depth = 0;
  let buf = '';
  let start = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === '{') {
      if (depth === 0) {
        const sel = buf.trim();
        if (sel && !sel.startsWith('@')) {
          rules.push({ file, selector: sel, index: start });
        }
        buf = '';
      }
      depth++;
      continue;
    }
    if (c === '}') {
      depth--;
      if (depth === 0) { buf = ''; start = i + 1; }
      continue;
    }
    if (depth === 0) {
      if (!buf) start = i;
      buf += c;
    }
  }
  return rules;
}

/* Split a selector list and reduce each part to something querySelectorAll can
   evaluate: drop pseudo-elements and state pseudo-classes, keep structure. */
const STATE_PSEUDO = /::?(?:hover|active|focus|focus-within|focus-visible|visited|target|checked|disabled|enabled|placeholder-shown|autofill|user-invalid|before|after|placeholder|selection|marker|backdrop|first-line|first-letter|-webkit-[a-z-]+|-moz-[a-z-]+)\b(\([^)]*\))?/g;

function testable(part) {
  let s = part.replace(STATE_PSEUDO, '').trim();
  s = s.replace(/\s*>\s*$/, '').replace(/\s*\+\s*$/, '').replace(/\s*~\s*$/, '');
  return s;
}

(async () => {
  const all = [];
  for (const f of CSS_FILES) {
    const p = path.join('css', f + '.css');
    if (!fs.existsSync(p)) continue;
    all.push(...extractRules(fs.readFileSync(p, 'utf8'), f + '.css'));
  }

  // One entry per distinct selector part, remembering every rule it came from.
  const parts = new Map();
  for (const r of all) {
    for (const raw of r.selector.split(',')) {
      const part = raw.trim().replace(/\s+/g, ' ');
      if (!part) continue;
      if (!parts.has(part)) parts.set(part, { part, testable: testable(part), rules: [] });
      parts.get(part).rules.push(r);
    }
  }

  const list = [...parts.values()].filter((p) => p.testable && !p.testable.startsWith('@'));
  console.log(`${all.length} rules, ${list.length} distinct selector parts`);

  const browser = await puppeteer.launch({ channel: 'chrome', headless: 'new' });
  const matched = new Set();
  const invalid = new Set();

  async function sweep(page, label) {
    const found = await page.evaluate((sels) => {
      const hit = [];
      const bad = [];
      for (const s of sels) {
        try {
          if (document.querySelector(s)) hit.push(s);
        } catch (e) {
          bad.push(s);
        }
      }
      return { hit, bad };
    }, list.map((p) => p.testable));
    found.hit.forEach((s) => matched.add(s));
    found.bad.forEach((s) => invalid.add(s));
    process.stdout.write(`  ${label}: ${matched.size} matched so far\n`);
  }

  // Bring every piece of JS-built UI into existence before sweeping.
  const EXERCISE = async (page) => {
    await page.evaluate(() => {
      document.querySelectorAll('details').forEach((d) => { d.open = true; });
      const add = document.getElementById('if-add-dancer');
      if (add) { add.click(); add.click(); }
      // Success states for both forms.
      const f = document.querySelector('[data-form="ps-interest"]');
      if (f) {
        f.hidden = true;
        const done = document.getElementById('if-done');
        if (done) done.hidden = false;
      }
      document.querySelectorAll('.ep-recaps').forEach((w) => {
        const form = w.querySelector('form');
        const ok = w.querySelector('.form-success');
        if (form) form.hidden = true;
        if (ok) ok.classList.add('show');
      });
      // Field error slots.
      document.querySelectorAll('form input[required]').forEach((i) => {
        i.classList.add('invalid');
        i.setAttribute('aria-invalid', 'true');
      });
      document.querySelectorAll('form').forEach((form) => {
        const e = document.createElement('div');
        e.className = 'form-error show';
        form.appendChild(e);
      });
      // Menus and overlays.
      const tn = document.getElementById('topnav');
      if (tn) tn.classList.add('is-open');
      document.documentElement.classList.add('menu-open');
      const lb = document.getElementById('lightbox');
      if (lb) lb.classList.add('open');
      // Track tabs: activate each panel in turn is not possible in one shot,
      // so mark them all selected/active.
      document.querySelectorAll('.track-tab').forEach((t) => t.setAttribute('aria-selected', 'true'));
      document.querySelectorAll('.track-detail').forEach((t) => t.setAttribute('data-active', 'true'));
      document.querySelectorAll('.toggle-btn').forEach((t) => t.classList.add('active'));
      document.querySelectorAll('.reveal').forEach((t) => t.classList.add('visible'));
      document.querySelectorAll('.merch-category-card').forEach((c) => c.classList.add('is-selected'));
      const mv = document.querySelector('.merch-vote-success');
      if (mv) mv.style.display = 'block';
      // Collective next class, live state.
      const dnc = document.getElementById('dwdc-next-class');
      if (dnc) dnc.dataset.state = 'live';
    });
    await new Promise((r) => setTimeout(r, 250));
  };

  for (const width of [1280, 390]) {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: 900 });
      await page.goto(`${BASE}/?launched=1#${route}`, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 1600));
      await EXERCISE(page);
      await sweep(page, `${route}@${width} launched`);
      await page.close();
    }
  }

  for (const state of S1_STATES) {
    for (const route of ['home', 'proseries']) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(`${BASE}/?s1state=${state}#${route}`, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 1600));
      await EXERCISE(page);
      await sweep(page, `${route} s1=${state}`);
      await page.close();
    }
  }

  // The three standalone pages have their own stylesheets but share tokens.
  for (const page_ of ['fullout.html', 'dwdcon.html', 'amuse-in-space.html']) {
    if (!fs.existsSync(page_)) continue;
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE}/${page_}`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await sweep(page, page_);
    await page.close();
  }

  await browser.close();

  const dead = list.filter((p) => !matched.has(p.testable) && !invalid.has(p.testable));
  const byFile = {};
  for (const d of dead) {
    for (const r of d.rules) {
      (byFile[r.file] = byFile[r.file] || new Set()).add(d.part);
    }
  }

  console.log(`\n${dead.length} selector parts matched nothing in any state.\n`);
  for (const f of Object.keys(byFile).sort()) {
    console.log(`── ${f} (${byFile[f].size})`);
    [...byFile[f]].sort().forEach((s) => console.log('   ' + s));
  }
  if (invalid.size) {
    console.log(`\n${invalid.size} selectors could not be parsed by querySelector (skipped).`);
  }

  if (OUTFILE) {
    fs.writeFileSync(OUTFILE, JSON.stringify(
      { dead: dead.map((d) => ({ part: d.part, files: [...new Set(d.rules.map((r) => r.file))] })) },
      null, 2
    ));
    console.log('\nwrote ' + OUTFILE);
  }
})();
