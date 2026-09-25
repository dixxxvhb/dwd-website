#!/usr/bin/env node
/**
 * Do the drop-in Course nodes in index.html's JSON-LD still match the live
 * schedule? Search engines and AI assistants (ChatGPT sends real visitors,
 * utm_source=chatgpt.com) read those nodes as fact: a stale time or price
 * there is a wrong answer given to a parent.
 *
 *   node scripts/check-classes-jsonld.mjs
 *
 * Reads public_site_schedule (today to today+41, the two 21-day windows the
 * RPC allows) with the site's public key, groups open rows into weekly slots,
 * and compares each #dropin-<slug> node's day, start, end, price and 4+ price.
 * Exit 1 on any drift, missing slot or extra node. Added 2026-09-25.
 * When it fails: fix the node in index.html (then build-routes) and llms.txt.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const mainJs = readFileSync(join(root, 'js/main.js'), 'utf8');

const url = (mainJs.match(/supabaseUrl = '([^']+)'/) || [])[1];
const key = (mainJs.match(/supabaseKey = '([^']+)'/) || [])[1];
if (!url || !key) { console.error('Could not read the Supabase URL/key from js/main.js.'); process.exit(2); }

const block = html.match(/<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/);
const graph = JSON.parse(block[1])['@graph'];
const nodes = graph.filter((n) => n['@type'] === 'Course' && /#dropin-/.test(n['@id'] || ''));

const slugify = (s) => s.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const money = (c) => (c / 100).toFixed(2);

async function window(from, to) {
  const res = await fetch(url + '/rest/v1/rpc/public_site_schedule', {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_from: iso(from), p_to: iso(to) }),
  });
  if (!res.ok) throw new Error('public_site_schedule ' + res.status + ': ' + (await res.text()));
  return res.json();
}

const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }).split(',')[0]);
const rows = [...(await window(today, addDays(today, 20))), ...(await window(addDays(today, 21), addDays(today, 41)))]
  .filter((r) => r.drop_in_open);

const live = {};
for (const r of rows) {
  const slug = slugify(r.name);
  const day = DAYS[new Date(r.date + 'T12:00:00').getDay()];
  live[slug] = live[slug] || { day, start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5), price: money(r.drop_in_fee_cents), bulk: r.drop_in_bulk_fee_cents ? money(r.drop_in_bulk_fee_cents) : null };
}

const problems = [];
const seen = new Set();
for (const n of nodes) {
  const slug = n['@id'].split('#dropin-')[1];
  seen.add(slug);
  const l = live[slug];
  if (!l) { problems.push(`${slug}: in JSON-LD but no open drop-in in the next six weeks`); continue; }
  const s = n.hasCourseInstance.courseSchedule;
  const got = { day: s.byDay.split('/').pop(), start: s.startTime, end: s.endTime, price: n.offers[0].price, bulk: n.offers[1] ? n.offers[1].price : null };
  for (const k of Object.keys(got)) if (String(got[k]) !== String(l[k])) problems.push(`${slug}: ${k} is ${got[k]} in JSON-LD, ${l[k]} live`);
}
for (const slug of Object.keys(live)) if (!seen.has(slug)) problems.push(`${slug}: open live but missing from JSON-LD`);

if (problems.length) {
  console.error('Drop-in JSON-LD is STALE:\n  ' + problems.join('\n  '));
  console.error('Fix the #dropin-* nodes in index.html (then node scripts/build-routes.mjs) and llms.txt.');
  process.exit(1);
}
console.log(`Drop-in JSON-LD matches the live schedule (${nodes.length} classes).`);
