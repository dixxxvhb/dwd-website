#!/usr/bin/env node
/**
 * Refresh the Merch page's product list from the Coastal Threads store.
 *
 * The DWD merch store is a collection on Coastal Threads' Shopify shop. The
 * shop's product feed sends no CORS header, so a browser on dancewithdixon.com
 * cannot read it. This reads it here instead and writes data/merch.json, which
 * js/merch.js renders: the tour hoodie picker (one hoodie per name) and the
 * rest of the drop. Checkout always happens on Coastal Threads' site; this page
 * only links there.
 *
 * Run when the store changes (a new drop, a price, a new name):
 *   node scripts/build-merch.mjs
 *
 * See what would change without writing (exits 1 when the file is stale):
 *   node scripts/build-merch.mjs --check
 *
 * What a human should look at after a run: any product this script did not
 * recognise is listed under "New since last time". It still goes on the page,
 * under its store title, so read the title before pushing (first names only
 * for dancers, nothing that should not be public).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const STORE = 'https://shop.coastal-threads.com';
const COLLECTION = 'dwd-shop';
const FEED = `${STORE}/collections/${COLLECTION}/products.json?limit=250`;
const OUT = 'data/merch.json';

/* Display names and one plain line for the items that are not tour hoodies.
   The store's own titles are working titles ("Sports bra", "Amore short pink-
   DWD"); these are what the page shows. A product that is not listed here
   falls back to its store title and no line, so a new drop appears without an
   edit and gets its words later. */
const GEAR = {
  'sports-bra': { name: 'ProSeries Sports Bra', line: 'Forest green, the ProSeries mark on the back.' },
  'headband': { name: 'ProSeries Headband', line: 'Soft, stretchy and moisture-wicking.' },
  'unisex-cotton-shorts': { name: 'Amore Short, Pink', line: 'Soft cotton, relaxed fit.' },
  'unisex-cotton-shorts-1': { name: 'Amore Short, Green', line: 'Soft cotton, relaxed fit.' },
  'unisex-cotton-long-short': { name: 'Hey, Hi Long Short', line: 'Heavier cotton with a longer cut.' },
  'all-over-print-bandana': { name: 'Chicha Bandana', line: 'Headband, necktie or armband. The small size fits a dog.' },
};

/* Swatch colours for the hoodie's four fabric colours. */
const SWATCH = {
  'Black': '#0b0b0b',
  'Forest Green': '#1f3a2a',
  'Dark Heather': '#4a4d52',
  'Sport Grey': '#c4c6c8',
};

const TRACKS = ['PRO', 'ELITE', 'PREP'];

const img = (src) => src.split('?')[0];
const money = (v) => (Number(v) % 1 === 0 ? String(Number(v)) : Number(v).toFixed(2));

function sizeRange(values) {
  if (!values || !values.length) return '';
  return values.length === 1 ? values[0] : `${values[0]} to ${values[values.length - 1]}`;
}

function option(p, name) {
  const o = (p.options || []).find((x) => x.name.toLowerCase() === name);
  return o ? o.values : [];
}

/* "26/27 PROSERIES TOUR HOODY- ELITE Keke & PREP Finnie"
     -> { label: "Keke & Finnie", group: "family", names: [...] } */
function readHoodie(p) {
  const tail = p.title.split(/HOODY\s*-\s*/i)[1] || p.title;
  const parts = tail.split('&').map((s) => s.trim()).filter(Boolean);
  let track = null;
  const names = [];
  const tracks = [];
  for (const part of parts) {
    const m = part.match(/^(PRO|ELITE|PREP)\s+(.+)$/i);
    if (m) {
      track = m[1].toUpperCase();
      names.push(m[2].trim());
    } else {
      names.push(part);
    }
    tracks.push(track);
  }
  let group;
  if (names.length > 1) group = 'family';
  else if (/^(director\s+)?(mr|ms|mrs|miss)\b/i.test(tail)) group = 'staff';
  else if (tracks[0] && TRACKS.includes(tracks[0])) group = tracks[0].toLowerCase();
  else group = 'family'; // "John's Mom" and anything else personal

  let label = names.join(' & ');
  if (names.length > 2) label = names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
  if (group === 'staff') label = label.replace(/^director\s+/i, '');

  const colors = [];
  for (const name of option(p, 'color')) {
    const v = p.variants.find((x) => x.option1 === name);
    const im = v && p.images.find((i) => (i.variant_ids || []).includes(v.id));
    if (im) colors.push({ name, hex: SWATCH[name] || '#888888', img: img(im.src) });
  }
  const back = p.images.find((i) => /-black-back-/.test(i.src)) || p.images.find((i) => /-back-/.test(i.src));

  return {
    handle: p.handle,
    label,
    group,
    price: money(p.variants[0].price),
    sizes: sizeRange(option(p, 'size')),
    colors,
    back: back ? img(back.src) : null,
    available: p.variants.some((v) => v.available),
  };
}

function readGear(p) {
  const known = GEAR[p.handle];
  return {
    handle: p.handle,
    name: known ? known.name : p.title.trim(),
    line: known ? known.line : '',
    price: money(p.variants[0].price),
    sizes: sizeRange(option(p, 'size')),
    images: p.images.slice(0, 2).map((i) => img(i.src)),
    available: p.variants.some((v) => v.available),
    known: !!known,
  };
}

const res = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 (site build)' } });
if (!res.ok) {
  console.error(`Could not read the store feed: HTTP ${res.status}. Nothing written.`);
  process.exit(1);
}
const { products } = await res.json();
if (!Array.isArray(products) || !products.length) {
  console.error('The store feed came back empty. Nothing written (the page keeps its last list).');
  process.exit(1);
}

const hoodies = [];
const gear = [];
for (const p of products) {
  if (/tour-hood/i.test(p.handle) || /TOUR HOOD/i.test(p.title)) hoodies.push(readHoodie(p));
  else gear.push(readGear(p));
}

const order = { pro: 0, elite: 1, prep: 2, family: 3, staff: 4 };
hoodies.sort((a, b) => order[a.group] - order[b.group] || a.label.localeCompare(b.label));

const data = {
  store: { name: 'Coastal Threads', url: STORE, collection: `${STORE}/collections/${COLLECTION}` },
  hoodies,
  gear: gear.map(({ known, ...g }) => g),
};
const json = JSON.stringify(data, null, 1) + '\n';

const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
const before = current ? JSON.parse(current) : { hoodies: [], gear: [] };
const had = new Set([...before.hoodies, ...before.gear].map((x) => x.handle));
const fresh = [...hoodies, ...gear].filter((x) => !had.has(x.handle));
const gone = [...had].filter((h) => ![...hoodies, ...gear].some((x) => x.handle === h));

console.log(`${hoodies.length} tour hoodies, ${gear.length} other items.`);
if (current && fresh.length) {
  console.log('New since last time:');
  fresh.forEach((x) => console.log(`  + ${x.label || x.name}  (${x.handle})`));
}
if (gone.length) {
  console.log('No longer in the store:');
  gone.forEach((h) => console.log(`  - ${h}`));
}
const unworded = gear.filter((g) => !g.known);
if (unworded.length) {
  console.log('Showing under the store title, no line yet (add to GEAR in this script):');
  unworded.forEach((g) => console.log(`  ? ${g.name}  (${g.handle})`));
}

if (process.argv.includes('--check')) {
  if (current !== json) {
    console.error(`STALE: ${OUT} differs from the store. Run: node scripts/build-merch.mjs`);
    process.exit(1);
  }
  console.log(`${OUT} matches the store.`);
} else if (current === json) {
  console.log(`${OUT} already matches the store.`);
} else {
  writeFileSync(OUT, json);
  console.log(`wrote ${OUT}`);
}
