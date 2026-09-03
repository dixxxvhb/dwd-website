/* Measure real contrast of light text over a photo: hide the text, screenshot
   the exact rectangle it occupies, then compare the LIGHTEST pixel behind it
   against the text colour. node contrast.js <route> <textSel> <width> */
const puppeteer = require('C:/Users/bowle/Code/DWDC-Instagram-Posts/node_modules/puppeteer');
const [ROUTE, SEL, W] = process.argv.slice(2);

function lum(r, g, b) {
  const c = [r, g, b].map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(l1, l2) {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

(async () => {
  const b = await puppeteer.launch({ channel: 'chrome', headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: parseInt(W, 10), height: 1000 });
  await p.goto('http://localhost:8790/#' + ROUTE, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1400));
  await p.evaluate(() => {
    document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    const s = document.createElement('style');
    s.textContent = '.topnav,.chapter-rail,.mob-cta{position:absolute!important}';
    document.head.appendChild(s);
  });
  await new Promise(r => setTimeout(r, 900));

  const info = await p.evaluate((sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: r.x, y: r.y, w: r.width, h: r.height, color: cs.color, size: cs.fontSize, weight: cs.fontWeight };
  }, SEL);

  // Hide the text (and any shadow) so we photograph only what sits behind it.
  await p.evaluate((sel) => { document.querySelector(sel).style.visibility = 'hidden'; }, SEL);
  await new Promise(r => setTimeout(r, 200));

  const buf = await p.screenshot({
    clip: { x: Math.max(0, info.x), y: Math.max(0, info.y), width: Math.max(1, info.w), height: Math.max(1, info.h) },
  });

  // Decode the PNG without a dependency: use the browser itself.
  const px = await p.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const out = [];
    for (let i = 0; i < d.length; i += 4) out.push([d[i], d[i + 1], d[i + 2]]);
    return out;
  }, Buffer.from(buf).toString('base64'));

  const m = info.color.match(/\d+/g).map(Number);
  const textL = lum(m[0], m[1], m[2]);

  let worst = Infinity, worstPx = null;
  let sum = 0;
  for (const [r, g, bb] of px) {
    const l = lum(r, g, bb);
    sum += l;
    const rr = ratio(textL, l);
    if (rr < worst) { worst = rr; worstPx = [r, g, bb]; }
  }
  const avg = ratio(textL, sum / px.length);

  console.log(`${ROUTE} ${SEL} @${W}`);
  console.log(`  text ${info.color} ${info.size}/${info.weight}`);
  console.log(`  worst pixel rgb(${worstPx}) -> ${worst.toFixed(2)}:1`);
  console.log(`  average ground        -> ${avg.toFixed(2)}:1`);
  const large = parseFloat(info.size) >= 24 || (parseFloat(info.size) >= 18.66 && parseInt(info.weight, 10) >= 700);
  console.log(`  floor ${large ? '3.0 (large text)' : '4.5 (body text)'} -> ${worst >= (large ? 3 : 4.5) ? 'PASS' : 'FAIL on worst pixel'}`);
  await b.close();
})();
