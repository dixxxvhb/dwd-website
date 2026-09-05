#!/usr/bin/env node
/**
 * Find CSS whose class/id tokens appear NOWHERE outside css/.
 *
 *   node scripts/qa/orphan-css.js [--json out.json]
 *
 * This is the conservative companion to dead-css.js. That one asks "did this
 * selector match anything while I drove the site", which is powerful but has
 * blind spots: a class added on scroll, or only when a database returns a row,
 * looks dead when it is not.
 *
 * This asks a question with no blind spots. If a selector needs the class
 * `campaign-gate`, and the string "campaign-gate" appears in no HTML file, no
 * JS file and no JSON in this repo, then nothing can ever add it and the rule is
 * dead — no matter what state the page is in.
 *
 * It errs the other way: it will MISS dead rules whose tokens happen to appear
 * somewhere (a comment, a similar name). That is the right direction to err in
 * when the action is deletion.
 */

const fs = require('fs');
const path = require('path');

const CSS_DIR = 'css';
const SITE_SHEETS = [
  // The twelve source sheets were concatenated into css/site.css on
  // 2026-09-03. This list still named them until 2026-09-04, so every
  // one of these tools was reading nothing and cheerfully reporting
  // "0 dead rules". One name now, and it is the real file.
  'site',
];

/* ── Everything that could possibly name a class ─────────────────────── */

function collectSources(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'css') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collectSources(p, acc);
    else if (/\.(html|js|mjs|json|md)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const sources = collectSources('.');
const haystack = sources.map((p) => fs.readFileSync(p, 'utf8')).join('\n');
console.log(`scanning ${sources.length} non-CSS files for class and id names`);

/* ── Rules and their selector parts ──────────────────────────────────── */

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function extractParts(css) {
  const clean = stripComments(css);
  const out = [];
  let depth = 0, buf = '', start = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === '{') {
      if (depth === 0) {
        const sel = buf.trim();
        if (sel && !sel.startsWith('@')) out.push({ selector: sel, start, end: -1 });
        buf = '';
      }
      depth++;
      continue;
    }
    if (c === '}') {
      depth--;
      if (depth === 0) { buf = ''; start = i + 1; }
      continue;
    }
    if (depth === 0) { if (!buf.trim()) start = i; buf += c; }
  }
  return out;
}

const TOKEN = /[.#](-?[_a-zA-Z][-_a-zA-Z0-9]*)/g;

// Tokens that are structural rather than named features; never judge on these.
const IGNORE = new Set(['active', 'visible', 'open', 'show', 'is-open', 'hidden', 'wide']);

const report = {};
let totalDead = 0;

for (const name of SITE_SHEETS) {
  const p = path.join(CSS_DIR, name + '.css');
  if (!fs.existsSync(p)) continue;
  const css = fs.readFileSync(p, 'utf8');
  const dead = [];

  for (const rule of extractParts(css)) {
    const parts = rule.selector.split(',').map((s) => s.trim()).filter(Boolean);
    const deadParts = [];
    for (const part of parts) {
      const tokens = [...part.matchAll(TOKEN)].map((m) => m[1]).filter((t) => !IGNORE.has(t));
      if (!tokens.length) continue; // element/attribute-only selector: leave alone
      // Dead if ANY required token is absent from the whole non-CSS codebase:
      // a compound selector can never match without every one of its parts.
      const missing = tokens.filter((t) => !haystack.includes(t));
      if (missing.length) deadParts.push({ part, missing });
    }
    if (deadParts.length === parts.length && parts.length) {
      dead.push({ selector: rule.selector, missing: [...new Set(deadParts.flatMap((d) => d.missing))] });
    }
  }

  if (dead.length) {
    report[name + '.css'] = dead;
    totalDead += dead.length;
  }
}

console.log(`\n${totalDead} rules where every selector needs a name that exists nowhere else.\n`);

// Group by the missing token so families are obvious.
for (const [file, rules] of Object.entries(report)) {
  const families = {};
  for (const r of rules) {
    const key = r.missing.sort()[0];
    (families[key] = families[key] || []).push(r.selector);
  }
  console.log(`── ${file}  (${rules.length} rules)`);
  for (const [token, sels] of Object.entries(families).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`   ${String(sels.length).padStart(4)}  missing "${token}"`);
  }
  console.log('');
}

const jsonIdx = process.argv.indexOf('--json');
if (jsonIdx > -1 && process.argv[jsonIdx + 1]) {
  fs.writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(report, null, 2));
  console.log('wrote ' + process.argv[jsonIdx + 1]);
}
