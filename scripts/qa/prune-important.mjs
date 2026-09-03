#!/usr/bin/env node
/**
 * Remove !important from declarations where it is not doing anything.
 *
 *   node scripts/qa/prune-important.mjs --all            # strip every one
 *   node scripts/qa/prune-important.mjs --keep a,b,c     # keep only these properties
 *   node scripts/qa/prune-important.mjs --report         # counts by property
 *
 * Reads and writes css/site.css. Always pair with scripts/qa/computed.js:
 * strip, capture, compare. If a property's computed value moved anywhere, that
 * property's !important was load-bearing and goes back.
 *
 * Shorthands matter here. If padding-left changes when !important goes, it is
 * not enough to keep it on `padding-left` — the declaration that was winning
 * might have been `padding`. --keep expands each property to every shorthand
 * that can set it.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'css/site.css';

/* Longhand -> every shorthand that can set it. */
const SHORTHANDS = {
  'margin-top': ['margin', 'margin-block', 'margin-block-start'],
  'margin-right': ['margin', 'margin-inline', 'margin-inline-end'],
  'margin-bottom': ['margin', 'margin-block', 'margin-block-end'],
  'margin-left': ['margin', 'margin-inline', 'margin-inline-start'],
  'padding-top': ['padding', 'padding-block', 'padding-block-start'],
  'padding-right': ['padding', 'padding-inline', 'padding-inline-end'],
  'padding-bottom': ['padding', 'padding-block', 'padding-block-end'],
  'padding-left': ['padding', 'padding-inline', 'padding-inline-start'],
  'border-top-color': ['border', 'border-color', 'border-top'],
  'border-right-color': ['border', 'border-color', 'border-right'],
  'border-bottom-color': ['border', 'border-color', 'border-bottom'],
  'border-left-color': ['border', 'border-color', 'border-left'],
  'border-top-width': ['border', 'border-width', 'border-top'],
  'border-right-width': ['border', 'border-width', 'border-right'],
  'border-bottom-width': ['border', 'border-width', 'border-bottom'],
  'border-left-width': ['border', 'border-width', 'border-left'],
  'border-top-style': ['border', 'border-style', 'border-top'],
  'border-right-style': ['border', 'border-style', 'border-right'],
  'border-bottom-style': ['border', 'border-style', 'border-bottom'],
  'border-left-style': ['border', 'border-style', 'border-left'],
  'border-radius': ['border-radius'],
  'outline-color': ['outline'],
  'outline-width': ['outline'],
  'outline-style': ['outline'],
  'font-family': ['font'],
  'font-size': ['font'],
  'font-weight': ['font'],
  'font-style': ['font'],
  'line-height': ['font'],
  'background-color': ['background'],
  'background-image': ['background'],
  'background-size': ['background'],
  'background-position': ['background'],
  'background-repeat': ['background'],
  'flex-grow': ['flex'],
  'flex-shrink': ['flex'],
  'flex-basis': ['flex'],
  'flex-direction': ['flex-flow'],
  'flex-wrap': ['flex-flow'],
  'row-gap': ['gap'],
  'column-gap': ['gap'],
  'grid-template-columns': ['grid-template', 'grid'],
  'grid-template-rows': ['grid-template', 'grid'],
  'grid-column': ['grid-area'],
  'grid-row': ['grid-area'],
  'text-decoration-line': ['text-decoration'],
  'text-decoration-color': ['text-decoration'],
  'list-style-type': ['list-style'],
  'overflow': ['overflow'],
  'top': ['inset', 'inset-block', 'inset-block-start'],
  'right': ['inset', 'inset-inline', 'inset-inline-end'],
  'bottom': ['inset', 'inset-block', 'inset-block-end'],
  'left': ['inset', 'inset-inline', 'inset-inline-start'],
};

function expand(props) {
  const out = new Set();
  for (const p of props) {
    out.add(p);
    (SHORTHANDS[p] || []).forEach((s) => out.add(s));
    // A longhand may also be set by its own prefix family (border-top sets
    // border-top-color etc.), covered above; and `all` sets everything.
  }
  out.add('all');
  return out;
}

const css = readFileSync(FILE, 'utf8');

// Every "<prop>: <value> !important" occurrence, with the property captured.
const DECL = /([-a-zA-Z]+)\s*:\s*[^;{}]*?!important/g;

const args = process.argv.slice(2);

if (args.includes('--report')) {
  const counts = {};
  for (const m of css.matchAll(DECL)) counts[m[1]] = (counts[m[1]] || 0) + 1;
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log(`${[...css.matchAll(DECL)].length} !important declarations across ${rows.length} properties\n`);
  rows.forEach(([p, n]) => console.log(String(n).padStart(5) + '  ' + p));
  process.exit(0);
}

let keep = new Set();
const keepIdx = args.indexOf('--keep');
if (keepIdx > -1 && args[keepIdx + 1]) {
  keep = expand(args[keepIdx + 1].split(',').map((s) => s.trim()).filter(Boolean));
} else if (!args.includes('--all')) {
  console.error('usage: --all | --keep prop,prop | --report');
  process.exit(1);
}

let removed = 0;
let kept = 0;
const out = css.replace(DECL, (whole, prop) => {
  if (keep.has(prop)) { kept++; return whole; }
  removed++;
  return whole.replace(/\s*!important/, '');
});

writeFileSync(FILE, out);
console.log(`removed ${removed} !important, kept ${kept}`);
if (keep.size) console.log('kept on: ' + [...keep].sort().join(', '));
