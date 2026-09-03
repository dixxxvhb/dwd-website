/* node shot_el.js <out> <route> <selector> <width> */
const puppeteer = require('C:/Users/bowle/Code/DWDC-Instagram-Posts/node_modules/puppeteer');
const [OUT, ROUTE, SEL, W] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ channel: 'chrome', headless: 'new' });
  const p = await b.newPage();
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.setViewport({ width: parseInt(W, 10), height: 1000 });
  await p.goto('http://localhost:8790/#' + ROUTE, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1300));
  await p.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible'));
    document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    const s = document.createElement('style');
    s.textContent = '.topnav,.chapter-rail,.mob-cta{position:absolute!important}*{animation-duration:0s!important;transition-duration:0s!important}';
    document.head.appendChild(s);
  });
  await new Promise(r => setTimeout(r, 900));
  const el = await p.$(SEL);
  if (!el) { console.log('NOT FOUND', SEL); await b.close(); return; }
  await el.scrollIntoView();
  await new Promise(r => setTimeout(r, 350));
  await el.screenshot({ path: OUT });
  const box = await el.boundingBox();
  console.log(OUT.split(/[\\/]/).pop(), 'w', Math.round(box.width), 'h', Math.round(box.height),
              'errors:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
