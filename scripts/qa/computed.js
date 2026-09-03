#!/usr/bin/env node
/**
 * Fingerprint the computed style and geometry of every element on every route.
 *
 *   node scripts/qa/computed.js <out.json>
 *   node scripts/qa/computed.js --compare <a.json> <b.json>
 *
 * Stricter and much faster than screenshot diffing. Stricter because it sees
 * changes a screenshot cannot — a colour behind an opaque element, a property
 * that only matters at another breakpoint. Faster because it never waits for
 * images, which is most of what a full-page screenshot pass spends its time on.
 *
 * Built to make the !important reduction in item 3.2e testable: each candidate
 * set needs one run, and a run is seconds rather than minutes.
 *
 * It does NOT replace pixdiff.js. This compares the DOM's own account of
 * itself; pixdiff compares what a person would actually see. Use both.
 */

const fs = require('fs');
const puppeteer = require('C:/Users/bowle/Code/DWDC-Instagram-Posts/node_modules/puppeteer');

const BASE = process.env.QA_BASE || 'http://localhost:8790';
const ROUTES = ['home', 'proseries', 'adult-company', 'teachers', 'gallery', 'shop', 'contact', 'privacy'];
const WIDTHS = [1280, 390];

// Everything the stylesheets actually fight over, plus geometry.
const PROPS = [
  'display', 'position', 'visibility', 'opacity', 'z-index', 'overflow',
  'top', 'right', 'bottom', 'left', 'float', 'clear', 'isolation',
  'color', 'background-color', 'background-image', 'background-size',
  'background-position', 'background-repeat', 'background-clip', 'mix-blend-mode',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
  'border-radius', 'box-shadow', 'outline-color', 'outline-width', 'outline-style',
  'outline-offset', 'filter', 'backdrop-filter', 'clip-path', 'mask-image',
  'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
  'line-height', 'letter-spacing', 'word-spacing', 'text-transform', 'text-align',
  'text-decoration-line', 'text-decoration-color', 'text-underline-offset',
  'text-shadow', 'text-overflow', 'white-space', 'word-break', 'overflow-wrap',
  'vertical-align', 'list-style-type', 'content',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
  'box-sizing', 'aspect-ratio',
  'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
  'justify-content', 'align-items', 'align-self', 'align-content',
  'gap', 'row-gap', 'column-gap', 'order',
  'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
  'transform', 'transform-origin', 'object-fit', 'object-position',
  'cursor', 'pointer-events', 'user-select', 'appearance', 'resize',
];

async function capture() {
  const browser = await puppeteer.launch({ channel: 'chrome', headless: 'new' });
  const out = {};
  for (const width of WIDTHS) {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: 1000 });
      await page.goto(`${BASE}/?launched=1#${route}`, { waitUntil: 'domcontentloaded' });
      // Long enough for the Supabase-backed blocks (the Episode Guide, the
      // Collective's next class) to have rendered or given up. Their elements
      // appear late, and a short wait makes the element count wobble between
      // runs, which reads as a difference when nothing changed.
      await new Promise((r) => setTimeout(r, 2600));
      // Freeze anything mid-flight. Without this the run-to-run noise is every
      // element currently part-way through a reveal transition: opacity 0.974
      // one run, 0.969 the next.
      await page.evaluate(() => {
        document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visible'));
        document.querySelectorAll('video').forEach((v) => { try { v.pause(); } catch (e) {} });
        const s = document.createElement('style');
        // animation-duration:0s, NOT animation:none. "none" reverts an element to
        // its pre-animation state, which for the home hero's H1 lines means
        // opacity 0 — they vanish. Zero duration snaps them to the END state,
        // which is what a visitor actually sees.
        s.textContent = '*,*::before,*::after{animation-duration:0s !important;animation-delay:0s !important;transition-duration:0s !important}';
        document.head.appendChild(s);
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      });
      // Images have to be settled: a container's height depends on whether the
      // pictures inside it have arrived, and half-loaded pages differ between
      // runs by hundreds of pixels.
      await page.evaluate(async () => {
        await Promise.all(
          Array.from(document.images)
            .filter((i) => !i.complete)
            .map((i) => new Promise((res) => { i.onload = i.onerror = res; }))
        );
      });
      await new Promise((r) => setTimeout(r, 700));
      const data = await page.evaluate((props) => {
        // Deterministic identity for every element: its position in the tree.
        const rows = [];
        const walk = (el, path) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const vals = props.map((p) => cs.getPropertyValue(p)).join('|');
          rows.push(
            path + '\u0000' +
            Math.round(r.width) + ',' + Math.round(r.height) + '\u0000' + vals
          );
          let i = 0;
          for (const c of el.children) walk(c, path + '/' + c.tagName + ':' + i++);
        };
        walk(document.body, 'body');
        return rows;
      }, PROPS);
      out[`${route}@${width}`] = data;
      await page.close();
    }
  }
  await browser.close();
  return out;
}

(async () => {
  if (process.argv[2] === '--compare') {
    const a = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
    const b = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
    let diffs = 0;
    let shown = 0;
    // Accumulate the FULL set of properties that moved, regardless of how many
    // examples get printed. When this drives a decision -- which !important
    // declarations are load-bearing -- a truncated list is worse than none,
    // because it looks complete.
    const changedProps = new Set();
    let boxChanged = false;
    for (const key of Object.keys(a)) {
      const ra = a[key];
      const rb = b[key] || [];
      if (ra.length !== rb.length) {
        console.log(`${key}: element count ${ra.length} -> ${rb.length}`);
        diffs++;
        continue;
      }
      let n = 0;
      for (let i = 0; i < ra.length; i++) {
        if (ra[i] !== rb[i]) {
          n++;
          const [pathA, boxA, valsA] = ra[i].split('\u0000');
          const [, boxB, valsB] = rb[i].split('\u0000');
          const va = valsA.split('|');
          const vb = valsB.split('|');
          const changed = [];
          for (let p = 0; p < va.length; p++) {
            if (va[p] !== vb[p]) {
              changedProps.add(PROPS[p]);
              changed.push(`${PROPS[p]}: ${va[p]} -> ${vb[p]}`);
            }
          }
          if (boxA !== boxB) { boxChanged = true; changed.unshift(`box ${boxA} -> ${boxB}`); }
          if (shown < 12) {
            console.log(`  ${key} ${pathA.slice(-70)}`);
            changed.slice(0, 4).forEach((c) => console.log(`      ${c}`));
            shown++;
          }
        }
      }
      if (n) { console.log(`${key}: ${n} elements differ`); diffs += n; }
    }
    if (changedProps.size) {
      console.log('\nPROPERTIES CHANGED (' + changedProps.size + '): ' + [...changedProps].sort().join(','));
    }
    if (boxChanged) console.log('geometry changed on at least one element');
    console.log(diffs ? `\n${diffs} differences` : '\nCOMPUTED-IDENTICAL');
    process.exit(diffs ? 1 : 0);
  }

  const out = process.argv[2];
  if (!out) { console.error('usage: node scripts/qa/computed.js <out.json>'); process.exit(1); }
  const data = await capture();
  fs.writeFileSync(out, JSON.stringify(data));
  const n = Object.values(data).reduce((s, v) => s + v.length, 0);
  console.log(`wrote ${out}: ${Object.keys(data).length} page states, ${n} elements`);
})();
