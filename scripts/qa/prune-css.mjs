#!/usr/bin/env node
/**
 * Delete CSS rules whose selectors need a class or id that exists nowhere else
 * in the repo.
 *
 *   node scripts/qa/prune-css.mjs            # report only
 *   node scripts/qa/prune-css.mjs --list      # report, naming every rule
 *   node scripts/qa/prune-css.mjs --write     # actually delete
 *
 * A rule goes only when EVERY one of its selector parts requires at least one
 * class or id name that appears in no HTML, JS, MJS, JSON or MD file in this
 * repository. Nothing can add a name that is not written down anywhere, so no
 * state — no hover, no media query, no database row, no Season One state — can
 * bring such a rule to life. Verified separately that this repo builds no class
 * names dynamically, which is the one thing that would defeat the test.
 *
 * Two bugs cost real time here, both caught by scripts/qa/pixdiff.js, and both
 * worth knowing about if you touch this parser:
 *
 *   1. The prelude cursor has to be per NESTING LEVEL. One shared cursor meant
 *      rules inside @media took a stale offset from the outer level and their
 *      cut ranges swallowed the rule before them.
 *   2. A comment sitting above a rule must not become part of its selector.
 *      "/* Gallery images direct (not .gallery-item wrapper) *(/" above
 *      ".gallery-grid img" made a live rule look dead, because .gallery-item is
 *      genuinely gone and the comment mentioning it was being read as part of
 *      the selector.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const LIST = process.argv.includes('--list');

const SHEETS = [
  'styles', 'additions', 'editorial', 'rebrand', 'audition',
  'poster-pages', 'tighten', 'arms', 'season1', 'story', 'convert', 'next-level',
];

/* ── Every place a class name could be written ────────────────────────── */
function collect(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'css') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p, acc);
    else if (/\.(html|js|mjs|json|md)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const haystack = collect('.').map((p) => readFileSync(p, 'utf8')).join('\n');

const TOKEN = /[.#](-?[_a-zA-Z][-_a-zA-Z0-9]*)/g;
const IGNORE = new Set(['active', 'visible', 'open', 'show', 'is-open', 'hidden', 'wide']);

function isOrphan(selector) {
  const parts = selector.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return false;
  return parts.every((part) => {
    const tokens = [...part.matchAll(TOKEN)].map((m) => m[1]).filter((t) => !IGNORE.has(t));
    if (!tokens.length) return false; // element-only selector: never touch
    return tokens.some((t) => !haystack.includes(t));
  });
}

/* ── Parse into a tree of blocks ─────────────────────────────────────── */

function parse(css) {
  const nodes = [];
  const stack = [{ children: nodes }];
  const start = [0];   // byte offset where this level's prelude begins
  const text = [''];   // prelude text WITHOUT comments, for analysis
  const lastCommentEnd = [-1];
  let i = 0;

  const depth = () => stack.length - 1;

  function reset(d, pos) {
    start[d] = pos;
    text[d] = '';
    lastCommentEnd[d] = -1;
  }

  while (i < css.length) {
    const c = css[i];

    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const stop = end === -1 ? css.length : end + 2;
      lastCommentEnd[depth()] = stop;
      i = stop;
      continue;
    }

    if (c === '"' || c === "'") {
      const quote = c;
      const from = i;
      i++;
      while (i < css.length) {
        if (css[i] === '\\') { i += 2; continue; }
        if (css[i] === quote) { i++; break; }
        i++;
      }
      text[depth()] += css.slice(from, i);
      continue;
    }

    if (c === '{') {
      const d = depth();
      const raw = text[d];
      const node = {
        prelude: raw.trim(),
        // Where the cut begins: the first non-whitespace byte at this level.
        cutStart: (() => {
          const slice = css.slice(start[d], i);
          return start[d] + (slice.length - slice.trimStart().length);
        })(),
        // A comment directly above the rule belongs to it, and is only pulled
        // into the cut when nothing but a single newline separates them — a
        // section header with a blank line after it survives.
        commentEnd: lastCommentEnd[d],
        children: [],
        atRule: raw.trim().startsWith('@'),
      };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
      reset(depth(), i + 1);
      i++;
      continue;
    }

    if (c === '}') {
      const node = stack.pop();
      if (node) node.end = i + 1;
      reset(depth(), i + 1);
      i++;
      continue;
    }

    if (c === ';') {
      reset(depth(), i + 1);
      i++;
      continue;
    }

    text[depth()] += c;
    i++;
  }
  return nodes;
}

/* Extend a cut backwards over the comment that documents the rule. */
function withComment(css, node) {
  let start = node.cutStart;
  if (node.commentEnd > -1 && node.commentEnd <= start) {
    const between = css.slice(node.commentEnd, start);
    if (/^[ \t]*\n?[ \t]*$/.test(between)) {
      // Walk back to the start of the comment.
      const open = css.lastIndexOf('/*', node.commentEnd);
      if (open > -1) {
        const beforeComment = css.slice(0, open);
        const lineStart = beforeComment.lastIndexOf('\n') + 1;
        if (/^[ \t]*$/.test(css.slice(lineStart, open))) start = lineStart;
        else start = open;
      }
    }
  }
  return start;
}

/* ── Decide what to cut ──────────────────────────────────────────────── */

function plan(css, nodes, cuts) {
  let kept = 0;
  for (const n of nodes) {
    if (n.end === undefined) { kept++; continue; }
    if (n.atRule) {
      if (/^@(media|supports|layer|container)\b/.test(n.prelude)) {
        const inner = plan(css, n.children, cuts);
        if (inner === 0 && n.children.length) {
          cuts.push({ start: withComment(css, n), end: n.end, what: n.prelude, empty: true });
        } else kept++;
      } else kept++;
      continue;
    }
    if (isOrphan(n.prelude)) {
      cuts.push({ start: withComment(css, n), end: n.end, what: n.prelude });
    } else kept++;
  }
  return kept;
}

let grandTotal = 0;
let bytesBefore = 0;
let bytesAfter = 0;

for (const name of SHEETS) {
  const file = path.join('css', name + '.css');
  let css;
  try { css = readFileSync(file, 'utf8'); } catch { continue; }
  bytesBefore += css.length;

  const cuts = [];
  plan(css, parse(css), cuts);
  cuts.sort((a, b) => a.start - b.start);

  const merged = [];
  for (const c of cuts) {
    const last = merged[merged.length - 1];
    if (last && c.start < last.end) continue;
    merged.push(c);
  }

  let out = '';
  let cursor = 0;
  for (const c of merged) {
    out += css.slice(cursor, c.start);
    cursor = c.end;
  }
  out += css.slice(cursor);
  out = out.replace(/\n{4,}/g, '\n\n\n').replace(/[ \t]+\n/g, '\n');

  bytesAfter += out.length;
  grandTotal += merged.length;
  console.log(
    `${name.padEnd(14)} ${String(merged.length).padStart(4)} rules  ` +
    `${String(css.length - out.length).padStart(7)} bytes` +
    (merged.some((c) => c.empty) ? `  (+${merged.filter((c) => c.empty).length} emptied @media)` : '')
  );
  if (LIST) merged.forEach((c) => console.log('    ' + c.what.replace(/\s+/g, ' ').slice(0, 100)));

  if (WRITE && merged.length) writeFileSync(file, out);
}

console.log(
  `\n${grandTotal} rules, ${bytesBefore - bytesAfter} bytes ` +
  `(${((1 - bytesAfter / bytesBefore) * 100).toFixed(1)}% of the site CSS)`
);
if (!WRITE) console.log('report only. re-run with --write to apply.');
