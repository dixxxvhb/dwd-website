const puppeteer = require('C:/Users/bowle/Code/DWDC-Instagram-Posts/node_modules/puppeteer');
const BASE = 'http://localhost:8790';

const probe = () => ({
  page: (document.querySelector('.page.active') || {}).id,
  path: location.pathname,
  hash: location.hash,
  title: document.title,
  css: getComputedStyle(document.body).backgroundColor,
  canonical: (document.querySelector('link[rel=canonical]') || {}).href,
});

(async () => {
  const b = await puppeteer.launch({ channel: 'chrome', headless: 'new' });
  let fails = 0;
  const check = (label, got, want) => {
    const ok = Object.keys(want).every((k) => got[k] === want[k]);
    if (!ok) fails++;
    console.log((ok ? 'ok   ' : 'FAIL ') + label.padEnd(38) + JSON.stringify(got));
    if (!ok) console.log('       wanted ' + JSON.stringify(want));
  };

  // ── 1. Direct loads of each shell ──
  const shells = [
    ['/proseries/', 'page-proseries', 'ProSeries: Season One | DWD'],
    ['/collective/', 'page-adult-company', 'The Collective | DWD'],
    ['/teachers/', 'page-teachers', 'Teachers | DWD'],
    ['/gallery/', 'page-gallery', 'Gallery | DWD'],
    ['/contact/', 'page-contact', 'Contact | DWD'],
    ['/privacy/', 'page-privacy', 'Privacy Policy | DWD'],
    ['/', 'page-home', 'Dance With Dixon | Orlando Dance Company'],
  ];
  for (const [path, page, title] of shells) {
    const p = await b.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    const failed = [];
    p.on('requestfailed', (r) => {
      const e = (r.failure() || {}).errorText || '';
      if (e === 'net::ERR_ABORTED' && /\.(mp4|webm)$/.test(r.url())) return;
      failed.push(r.url());
    });
    p.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
    await p.goto(BASE + path, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const got = await p.evaluate(probe);
    check('load ' + path, { page: got.page, title: got.title, css: got.css }, {
      page, title, css: 'rgb(12, 31, 23)',
    });
    if (errs.length) { fails++; console.log('       console errors: ' + errs.slice(0, 2).join(' | ')); }
    if (failed.length) { fails++; console.log('       failed requests: ' + failed.slice(0, 3).join(' | ')); }
    await p.close();
  }

  // ── 2. Client-side nav + back/forward ──
  {
    const p = await b.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));
    // Count real document fetches. framenavigated also fires for pushState
    // (Chrome reports same-document navigations through it), so it cannot tell
    // an SPA transition from a reload.
    let navigations = 0;
    p.on('request', (r) => { if (r.resourceType() === 'document') navigations++; });

    await p.click('.topnav nav a[data-page="proseries"]');
    await new Promise((r) => setTimeout(r, 800));
    check('click nav -> /proseries', await p.evaluate(probe),
      { page: 'page-proseries', path: '/proseries/', title: 'ProSeries: Season One | DWD' });

    await p.click('.topnav nav a[data-page="gallery"]');
    await new Promise((r) => setTimeout(r, 800));
    check('click nav -> /gallery', await p.evaluate(probe),
      { page: 'page-gallery', path: '/gallery/' });

    await p.goBack();
    await new Promise((r) => setTimeout(r, 900));
    check('back -> /proseries', await p.evaluate(probe),
      { page: 'page-proseries', path: '/proseries/' });

    await p.goForward();
    await new Promise((r) => setTimeout(r, 900));
    check('forward -> /gallery', await p.evaluate(probe),
      { page: 'page-gallery', path: '/gallery/' });

    console.log('     (document fetches during SPA clicks: ' + navigations + ', want 0)');
    if (navigations !== 0) fails++;
    await p.close();
  }

  // ── 3. Old hash links still work, and upgrade themselves to paths ──
  for (const [hash, page, path] of [
    ['#proseries', 'page-proseries', '/proseries/'],
    ['#adult-company', 'page-adult-company', '/collective/'],
    ['#teachers', 'page-teachers', '/teachers/'],
    ['#performances', 'page-adult-company', '/collective/'],
    ['#about', 'page-teachers', '/teachers/'],
  ]) {
    const p = await b.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    await p.evaluate((h) => { window.location.hash = h; }, hash);
    await new Promise((r) => setTimeout(r, 1200));
    check('hash ' + hash, await p.evaluate(probe), { page, path, hash: '' });
    await p.close();
  }

  // ── 4. #shop has no path and must stay a hash ──
  {
    const p = await b.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(BASE + '/#shop', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));
    check('hash #shop stays a hash', await p.evaluate(probe),
      { page: 'page-shop', path: '/', hash: '#shop' });
    await p.close();
  }

  // ── 5. Element anchors still resolve from a shell ──
  {
    const p = await b.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(BASE + '/proseries#interest', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 4000));
    const got = await p.evaluate(() => ({
      page: (document.querySelector('.page.active') || {}).id,
      rectTop: Math.round(document.getElementById('interest').getBoundingClientRect().top),
    }));
    const ok = got.page === 'page-proseries' && Math.abs(got.rectTop - 85) < 40;
    if (!ok) fails++;
    console.log((ok ? 'ok   ' : 'FAIL ') + '/proseries#interest'.padEnd(38) + JSON.stringify(got));
    await p.close();
  }

  // ── 6. External / non-route paths are NOT intercepted ──
  {
    const p = await b.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 900));
    const handled = await p.evaluate(() => {
      const a = document.createElement('a');
      a.href = '/fullout';
      a.textContent = 'x';
      document.body.appendChild(a);
      let prevented = false;
      a.addEventListener('click', (e) => { prevented = e.defaultPrevented; e.preventDefault(); }, false);
      a.click();
      return prevented;
    });
    const ok = handled === false;
    if (!ok) fails++;
    console.log((ok ? 'ok   ' : 'FAIL ') + '/fullout not intercepted'.padEnd(38) + JSON.stringify({ prevented: handled }));
    await p.close();
  }

  await b.close();
  console.log(fails ? `\n${fails} FAILURES` : '\nROUTING ALL CLEAN');
  process.exit(fails ? 1 : 0);
})();
