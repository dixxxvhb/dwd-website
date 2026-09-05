/* DWD website QA shooter — Puppeteer, channel chrome.
   Usage: node shoot.js <outDir> [routes] [--tiles]
   Serves nothing itself; expects http://localhost:8790 up. */
const path = require('path');
const fs = require('fs');
const puppeteer = require('C:/Users/bowle/Code/DWDC-Instagram-Posts/node_modules/puppeteer');

const BASE = process.env.QA_BASE || 'http://localhost:8790';
const OUT = process.argv[2] || path.join(__dirname, 'out');
const ROUTES = (process.argv[3] || 'home,proseries,adult-company,teachers,gallery,contact,privacy').split(',');
const TILES = process.argv.includes('--tiles');
const WIDTHS = [{ w: 1280, h: 900, tag: 'd' }, { w: 390, h: 844, tag: 'm' }];

const PREP = `
  (async () => {
    if (navigator.serviceWorker) {
      const rs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(rs.map(r => r.unregister()));
    }
    if (window.caches) {
      const ks = await caches.keys();
      await Promise.all(ks.map(k => caches.delete(k)));
    }
  })();
`;

const FREEZE = `
  document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible'));
  document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager');
  const s = document.createElement('style');
  s.textContent = \`
    .topnav, .chapter-rail, .mob-cta { position: absolute !important; }
    *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }
    .reveal { opacity: 1 !important; transform: none !important; }
  \`;
  document.head.appendChild(s);
`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ channel: 'chrome', headless: 'new', args: ['--no-sandbox'] });
  const report = [];

  for (const route of ROUTES) {
    for (const vp of WIDTHS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1 });
      const errors = [], failed = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      // A media file aborted mid-download is not a failure: this script loads
      // "/" first to clear the service worker, then navigates to the route, and
      // navigating away from a playing <video> always cancels its range request.
      page.on('requestfailed', r => {
        const err = (r.failure() || {}).errorText || '';
        if (err === 'net::ERR_ABORTED' && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(r.url())) return;
        failed.push(r.url() + ' :: ' + err);
      });
      page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });

      const url = BASE + '/#' + route;
      await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
      await page.evaluate(PREP);
      await page.goto(url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 900));
      await page.evaluate(FREEZE);
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 500));

      const audit = await page.evaluate(() => {
        const active = document.querySelector('.page.active');
        const inActive = sel => Array.from((active || document).querySelectorAll(sel));
        const brokenImgs = Array.from(document.images)
          .filter(i => { const st = getComputedStyle(i); return st.display !== 'none' && i.offsetParent !== null; })
          .filter(i => i.complete && i.naturalWidth === 0)
          .map(i => i.currentSrc || i.src);
        const deadAnchors = inActive('a[href^="#"]')
          .map(a => a.getAttribute('href').slice(1).split('?')[0])
          .filter(h => h && !document.getElementById(h) && !document.getElementById('page-' + h))
          .filter((v, i, arr) => arr.indexOf(v) === i);
        const offDomain = inActive('a[href^="http"]')
          .map(a => a.href)
          // Social, maps, and the third-party legal links the privacy page is
          // required to carry are expected. Anything else off-domain on this
          // site is a CTA that escaped, which is what item 1.1 was about.
          .filter(h => !/instagram\.com|youtube\.com|youtu\.be|facebook\.com|maps\.|google\.com\/maps|stripe\.com|plaid\.com/.test(h))
          .filter((v, i, arr) => arr.indexOf(v) === i);
        return {
          activeId: active ? active.id : null,
          title: document.title,
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          docH: document.documentElement.scrollHeight,
          brokenImgs, deadAnchors, offDomain,
        };
      });

      const overflow = audit.scrollW > audit.clientW + 1;
      report.push({ route, vp: vp.tag, ...audit, overflow, errors, failed });

      if (TILES) {
        // Wait for every image to actually resolve before measuring. These
        // pages carry lazy images with no width/height, so the document keeps
        // growing while you tile it and the same section shows up twice.
        await page.evaluate(async () => {
          document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; });
          await Promise.all(Array.from(document.images)
            .filter(i => !i.complete)
            .map(i => new Promise(res => { i.onload = i.onerror = res; })));
        });
        await new Promise(r => setTimeout(r, 700));
        const h = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), 24000);
        await page.setViewport({ width: vp.w, height: vp.h });
        const tileH = 1400;
        for (let y = 0, n = 0; y < h; y += tileH, n++) {
          await page.evaluate(yy => window.scrollTo(0, yy), y);
          await new Promise(r => setTimeout(r, 220));
          await page.screenshot({
            path: path.join(OUT, `${route}-${vp.tag}-${String(n).padStart(2, '0')}.png`),
          });
        }
      }
      await page.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  let bad = 0;
  for (const r of report) {
    const issues = [];
    if (r.errors.length) issues.push(`console:${r.errors.length}`);
    if (r.failed.length) issues.push(`failed:${r.failed.length}`);
    if (r.brokenImgs.length) issues.push(`brokenImg:${r.brokenImgs.length}`);
    if (r.overflow) issues.push(`overflow ${r.scrollW}>${r.clientW}`);
    if (r.deadAnchors.length) issues.push(`deadAnchor:${r.deadAnchors.join('|')}`);
    if (r.offDomain.length) issues.push(`offDomain:${r.offDomain.join('|')}`);
    if (issues.length) { bad++; console.log(`FAIL ${r.route}@${r.vp}  ${issues.join('  ')}`); }
    else console.log(`ok   ${r.route}@${r.vp}  (${r.activeId}, h=${r.docH})`);
  }
  for (const r of report) {
    r.errors.slice(0, 4).forEach(e => console.log(`  [${r.route}@${r.vp}] console: ${e.slice(0, 200)}`));
    r.failed.slice(0, 6).forEach(e => console.log(`  [${r.route}@${r.vp}] req: ${e.slice(0, 200)}`));
    r.brokenImgs.slice(0, 6).forEach(e => console.log(`  [${r.route}@${r.vp}] img: ${e.slice(0, 200)}`));
  }
  console.log(bad ? `\n${bad} route/viewport combos with issues` : '\nALL CLEAN');
})();
