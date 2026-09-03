#!/usr/bin/env node
/**
 * Compare two directories of screenshots produced by snap.js.
 *
 *   node scripts/qa/pixdiff.js <beforeDir> <afterDir> [diffDir]
 *
 * Decoding happens inside headless Chrome via canvas, so this needs no image
 * dependency. Reports, per file: whether the dimensions match, how many pixels
 * differ beyond a small per-channel tolerance, and where the first difference
 * is. Writes a diff image highlighting changed pixels in magenta when a
 * diffDir is given.
 *
 * Tolerance exists because text antialiasing is not bit-exact between runs even
 * with identical CSS. A handful of pixels differing by a few levels is noise; a
 * block of pixels differing a lot is a layout change.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('C:/Users/bowle/Code/DWDC-Instagram-Posts/node_modules/puppeteer');

const [BEFORE, AFTER, DIFFDIR] = process.argv.slice(2);
const THRESHOLD = Number(process.env.PIX_THRESHOLD || 12); // per-channel
const FAIL_RATIO = Number(process.env.PIX_FAIL_RATIO || 0.001); // 0.1% of pixels

if (!BEFORE || !AFTER) {
  console.error('usage: node scripts/qa/pixdiff.js <beforeDir> <afterDir> [diffDir]');
  process.exit(1);
}

const files = fs.readdirSync(BEFORE).filter((f) => f.endsWith('.png')).sort();
if (!files.length) {
  console.error('no PNGs in ' + BEFORE);
  process.exit(1);
}
if (DIFFDIR) fs.mkdirSync(DIFFDIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ channel: 'chrome', headless: 'new' });
  const page = await browser.newPage();
  await page.goto('about:blank');

  let worst = 0;
  let failures = 0;

  for (const f of files) {
    const bPath = path.join(BEFORE, f);
    const aPath = path.join(AFTER, f);
    if (!fs.existsSync(aPath)) {
      console.log(`MISSING  ${f} (not in after)`);
      failures++;
      continue;
    }

    const result = await page.evaluate(
      async (b64a, b64b, threshold) => {
        async function load(b64) {
          const img = new Image();
          img.src = 'data:image/png;base64,' + b64;
          await img.decode();
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          c.getContext('2d').drawImage(img, 0, 0);
          return { c, w: img.width, h: img.height };
        }
        const A = await load(b64a);
        const B = await load(b64b);
        if (A.w !== B.w || A.h !== B.h) {
          return { sizeMismatch: true, a: [A.w, A.h], b: [B.w, B.h] };
        }
        const da = A.c.getContext('2d').getImageData(0, 0, A.w, A.h);
        const db = B.c.getContext('2d').getImageData(0, 0, B.w, B.h);
        const pa = da.data;
        const pb = db.data;
        const out = new ImageData(A.w, A.h);
        const po = out.data;
        let diff = 0;
        let firstY = -1;
        let firstX = -1;
        for (let i = 0; i < pa.length; i += 4) {
          const d =
            Math.abs(pa[i] - pb[i]) +
            Math.abs(pa[i + 1] - pb[i + 1]) +
            Math.abs(pa[i + 2] - pb[i + 2]);
          if (d > threshold) {
            diff++;
            if (firstY < 0) {
              const px = i / 4;
              firstY = Math.floor(px / A.w);
              firstX = px % A.w;
            }
            po[i] = 255; po[i + 1] = 0; po[i + 2] = 255; po[i + 3] = 255;
          } else {
            // Keep a dimmed copy of the original for context.
            po[i] = pa[i] * 0.25;
            po[i + 1] = pa[i + 1] * 0.25;
            po[i + 2] = pa[i + 2] * 0.25;
            po[i + 3] = 255;
          }
        }
        const oc = document.createElement('canvas');
        oc.width = A.w;
        oc.height = A.h;
        oc.getContext('2d').putImageData(out, 0, 0);
        return {
          w: A.w, h: A.h, total: pa.length / 4, diff, firstX, firstY,
          png: diff ? oc.toDataURL('image/png').split(',')[1] : null,
        };
      },
      fs.readFileSync(bPath).toString('base64'),
      fs.readFileSync(aPath).toString('base64'),
      THRESHOLD
    );

    if (result.sizeMismatch) {
      console.log(`SIZE     ${f.padEnd(22)} ${result.a.join('x')} -> ${result.b.join('x')}`);
      failures++;
      continue;
    }

    const ratio = result.diff / result.total;
    worst = Math.max(worst, ratio);
    const pct = (ratio * 100).toFixed(4);
    const bad = ratio > FAIL_RATIO;
    if (bad) failures++;
    const where = result.diff ? `  first@ ${result.firstX},${result.firstY}` : '';
    console.log(
      `${bad ? 'DIFF ' : 'ok   '} ${f.padEnd(22)} ${String(result.diff).padStart(9)} px  ${pct.padStart(8)}%${where}`
    );

    if (result.png && DIFFDIR) {
      fs.writeFileSync(path.join(DIFFDIR, f), Buffer.from(result.png, 'base64'));
    }
  }

  await browser.close();
  console.log(
    `\nworst ${(worst * 100).toFixed(4)}% differing (fail above ${(FAIL_RATIO * 100).toFixed(3)}%)`
  );
  console.log(failures ? `${failures} file(s) over threshold` : 'PIXEL-EQUIVALENT');
  process.exit(failures ? 1 : 0);
})();
