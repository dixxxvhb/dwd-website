#!/usr/bin/env node
/**
 * Generate the FAQPage JSON-LD node in index.html's @graph from the FAQ markup
 * on the ProSeries page.
 *
 * Two copies of the same eight answers WILL drift, and the copy that drifts is
 * always the one nobody reads, which is exactly the one search engines use. So
 * the markup is the source and the structured data is generated from it.
 *
 * Run after editing #ps-faq:
 *   node scripts/build-faq-jsonld.mjs
 *
 * Verify without writing (exits 1 if regeneration is needed):
 *   node scripts/build-faq-jsonld.mjs --check
 */

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'index.html';
const html = readFileSync(FILE, 'utf8');

/* ── Pull the questions and answers out of the markup ─────────────────── */

const listMatch = html.match(
  /<div class="ps-faq-list" data-faq>([\s\S]*?)<\/div>\s*<p class="ps-faq-more"/
);
if (!listMatch) {
  console.error('Could not find the FAQ list markup ([data-faq]). Nothing written.');
  process.exit(1);
}

const items = [...listMatch[1].matchAll(
  /<summary class="ps-faq-q">([\s\S]*?)<\/summary>\s*<div class="ps-faq-a"><p>([\s\S]*?)<\/p><\/div>/g
)];
if (!items.length) {
  console.error('Found the FAQ list but no question/answer pairs. Nothing written.');
  process.exit(1);
}

/* Structured data wants real characters, not HTML escapes, and no markup. */
const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”',
  '&mdash;': '—', '&ndash;': '–', '&middot;': '·', '&nbsp;': ' ',
  '&rarr;': '→',
};

function plain(str) {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => (m in ENTITIES ? ENTITIES[m] : m))
    .replace(/\s+/g, ' ')
    .trim();
}

const faq = items.map((m) => ({ q: plain(m[1]), a: plain(m[2]) }));

/* ── Build the node ───────────────────────────────────────────────────── */

const node = {
  '@type': 'FAQPage',
  '@id': 'https://dancewithdixon.com/#proseries-faq',
  mainEntity: faq.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const NL = '\n';
// Indent to sit inside the "@graph" array at six spaces, like its siblings.
const rendered = JSON.stringify(node, null, 2)
  .split(NL)
  .map((line) => '      ' + line)
  .join(NL)
  .trimStart();

/* ── Splice it into the graph ──────────────────────────────────────────
   Surgically: find the existing FAQPage node and match its braces, rather than
   reformatting the whole graph or leaving a marker comment behind. A comment
   cannot live inside application/ld+json. The block has to parse as one JSON
   document, and a stray comment in there silently voids every node in the
   graph, not just this one.                                              */

function findNode(text, typeLiteral) {
  const at = text.indexOf(typeLiteral);
  if (at === -1) return null;
  const start = text.lastIndexOf('{', at);
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  return null;
}

const scriptRe = /(<script type="application\/ld\+json">\s*\n)([\s\S]*?)(\n\s*<\/script>)/;
const scriptMatch = html.match(scriptRe);
if (!scriptMatch) {
  console.error('Could not find the JSON-LD script block. Nothing written.');
  process.exit(1);
}

let graph = scriptMatch[2];
const existing = findNode(graph, '"@type": "FAQPage"');

if (existing) {
  graph = graph.slice(0, existing.start) + rendered + graph.slice(existing.end);
} else {
  // First run: insert before the WebSite node, which is last in the graph.
  const website = findNode(graph, '"@type": "WebSite"');
  if (!website) {
    console.error('Could not find the WebSite node to insert before. Nothing written.');
    process.exit(1);
  }
  graph = graph.slice(0, website.start) + rendered + ',' + NL + '      ' + graph.slice(website.start);
}

// Never write something that does not parse.
try {
  JSON.parse(graph);
} catch (err) {
  console.error('Refusing to write: the result is not valid JSON. ' + err.message);
  process.exit(1);
}

const out = scriptMatch[1] + graph + scriptMatch[3];
const next = html.replace(scriptRe, () => out);

if (process.argv.includes('--check')) {
  if (next === html) {
    console.log('FAQ JSON-LD is in sync (' + faq.length + ' questions).');
    process.exit(0);
  }
  console.error('FAQ JSON-LD is STALE. Run: node scripts/build-faq-jsonld.mjs');
  process.exit(1);
}

writeFileSync(FILE, next);
console.log('Wrote FAQPage JSON-LD with ' + faq.length + ' questions.');
faq.forEach((f, i) => console.log('  ' + (i + 1) + '. ' + f.q));
