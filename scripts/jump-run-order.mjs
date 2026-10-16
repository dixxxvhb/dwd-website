// Pulls JUMP's public competition run order into jump/runorder-<start date>.json
// for the families' scoresheet (/jump/). Re-run whenever JUMP updates the
// schedule, then commit + push.
//   node scripts/jump-run-order.mjs <jumptour competition-schedule URL> <comp start date YYYY-MM-DD>
// Other studios' dancer names (the "(Name)" after a solo title) are dropped:
// the scoresheet only needs routine, studio and division.
import fs from 'node:fs';

const [url, start] = process.argv.slice(2);
if (!url || !/^\d{4}-\d{2}-\d{2}$/.test(start || '')) {
  console.error('usage: node scripts/jump-run-order.mjs <url> <YYYY-MM-DD>');
  process.exit(1);
}
const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
const decode = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#0?39;|&rsquo;|&#8217;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8211;/g, '-').replace(/\s+/g, ' ').trim();

const rows = [];
const rowRe = /<div class="cds-grid-row"[^>]*data-day="(\w+)"[^>]*>([\s\S]*?)(?=<div class="cds-grid-row"|<\/section>|$)/g;
for (const m of html.matchAll(rowRe)) {
  const day = m[1].slice(0, 3).toUpperCase();
  const time = decode(/cds-time">([^<]*)</.exec(m[2])?.[1] ?? '');
  for (const card of m[2].matchAll(/<div class="cds-num">#(\d+)<\/div><div class="cds-act">([\s\S]*?)<\/div><div class="cds-studio">([\s\S]*?)<\/div><div class="cds-cat">([\s\S]*?)<\/div>/g)) {
    rows.push({ no: +card[1], day, time, title: decode(card[2]).replace(/\s*\([^)]*\)\s*$/, ''), studio: decode(card[3]), division: decode(card[4]) });
  }
}
const seen = new Set();
const entries = rows.filter((r) => !seen.has(r.no) && seen.add(r.no)).sort((a, b) => a.no - b.no);
if (entries.length < 10) { console.error(`only ${entries.length} entries parsed; page shape changed?`); process.exit(1); }
const out = `jump/runorder-${start}.json`;
fs.writeFileSync(out, JSON.stringify({ source: url, fetched_at: new Date().toISOString(), entries }));
console.log(`${entries.length} entries -> ${out} (#${entries[0].no}..#${entries.at(-1).no})`);
