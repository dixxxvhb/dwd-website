#!/usr/bin/env node
/**
 * Deterministic full-page screenshots, for proving a CSS change did not move
 * anything it was not supposed to move.
 *
 *   node scripts/qa/snap.js <outDir> [routes]
 *
 * Determinism is the whole job here. Everything that would differ between two
 * otherwise identical runs is pinned: reveal animations forced to their end
 * state, the hero video removed so its poster shows instead of a random frame,
 * the teacher slideshow forced to its first slide, every animation and
 * transition zeroed, lazy images made eager and waited on, and the sticky
 * chrome taken out of the flow so it cannot float over a different bit of the
 * page depending on scroll timing.
 *
 * Pair with pixdiff.js.
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('C:/Users/bowle/Code/DWDC-Instagram-Posts/node_modules/puppeteer');

const BASE = process.env.QA_BASE || 'http://localhost:8790';
const OUT = process.argv[2];
const ROUTES = (process.argv[3] || 'home,proseries,adult-company,teachers,gallery,shop,contact,privacy').split(',');
const WIDTHS = [{ w: 1280, tag: 'd' }, { w: 390, tag: 'm' }];

if (!OUT) {
  console.error('usage: node scripts/qa/snap.js <outDir> [routes]');
  process.exit(1);
}

const FREEZE = () => {
  // Reveals: end state, no observer race.
  document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visible'));

  // The hero loop plays a different frame every run. Remove it; the poster
  // still underneath is deterministic. Its caption swap goes with it.
  document.querySelectorAll('video').forEach((v) => { try { v.pause(); } catch (e) {} v.remove(); });
  document.querySelectorAll('.hero-photo').forEach((e) => e.classList.remove('hero-loop-on'));

  // The teachers/about slideshow cycles on a 5s interval.
  ['.about-slide', '.tch-slide'].forEach((sel) => {
    const slides = document.querySelectorAll(sel);
    slides.forEach((s, i) => s.classList.toggle('active', i === 0));
  });

  document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });

  const s = document.createElement('style');
  s.textContent = `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }
    .topnav, .chapter-rail, .mob-cta { position: absolute !important; }
    .reveal { opacity: 1 !important; transform: none !important; }
  `;
  document.head.appendChild(s);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ channel: 'chrome', headless: 'new' });

  for (const route of ROUTES) {
    for (const vp of WIDTHS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.w, height: 1000, deviceScaleFactor: 1 });
      await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
      await page.evaluate(async () => {
        if (navigator.serviceWorker) {
          const rs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(rs.map((r) => r.unregister()));
        }
        if (window.caches) {
          const ks = await caches.keys();
          await Promise.all(ks.map((k) => caches.delete(k)));
        }
      });
      await page.goto(BASE + '/#' + route, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 1400));
      await page.evaluate(FREEZE);
      // Wait for every image to actually resolve, or the page keeps growing.
      await page.evaluate(async () => {
        await Promise.all(
          Array.from(document.images)
            .filter((i) => !i.complete)
            .map((i) => new Promise((res) => { i.onload = i.onerror = res; }))
        );
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
      });
      await new Promise((r) => setTimeout(r, 900));
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise((r) => setTimeout(r, 300));

      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      const clipped = Math.min(h, 26000);
      await page.screenshot({
        path: path.join(OUT, `${route}-${vp.tag}.png`),
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: vp.w, height: clipped },
      });
      console.log(`${route}@${vp.tag}  ${vp.w}x${clipped}`);
      await page.close();
    }
  }

  await browser.close();
})();
