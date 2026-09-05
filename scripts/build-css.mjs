#!/usr/bin/env node
/**
 * Minify css/site.css into css/site.min.css.
 *
 * site.css is the SOURCE and stays readable: it is twelve stylesheets
 * concatenated in cascade order with their section banners intact, and roughly
 * a third of it is comments explaining why a rule exists. The shells link the
 * minified copy so a visitor does not download the commentary.
 *
 *   node scripts/build-css.mjs           # write css/site.min.css
 *   node scripts/build-css.mjs --check   # exit 1 if the built file is stale
 *
 * The minifier is deliberately conservative. It is a character scanner, not a
 * parser: it tracks whether it is inside a string or a url() so that a comment
 * marker inside `content: "/*"` or a data: URI is never mistaken for a comment,
 * and it only ever removes comments, collapses runs of whitespace, drops
 * whitespace around the punctuation where CSS does not need it, and removes the
 * semicolon before a closing brace. It never reorders, merges or rewrites a
 * declaration, which is what makes `scripts/qa/pixdiff.js` able to prove it
 * changed nothing.
 *
 * Two things it must NOT do, both learned the hard way in other codebases:
 *   - strip whitespace around `+`, `-`, `*`, `/` (calc() needs it, and
 *     `a + b` selectors are not the same as `a+b` inside :is() lists in every
 *     engine).
 *   - collapse the space in `@media (min-width: 700px) and (...)`, beyond the
 *     single-space rule below.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SRC = 'css/site.css';
const OUT = 'css/site.min.css';

export function minify(css) {
  let out = '';
  let i = 0;
  const n = css.length;

  while (i < n) {
    const c = css[i];

    // Comment
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      // A removed comment still separates tokens; leave a space and let the
      // whitespace collapser below decide whether it survives.
      out += ' ';
      continue;
    }

    // String — copied verbatim, escapes included.
    if (c === '"' || c === "'") {
      const quote = c;
      out += c;
      i++;
      while (i < n) {
        if (css[i] === '\\') { out += css[i] + (css[i + 1] || ''); i += 2; continue; }
        out += css[i];
        if (css[i] === quote) { i++; break; }
        i++;
      }
      continue;
    }

    // url(...) — unquoted URLs may contain anything but ')'.
    if ((c === 'u' || c === 'U') && /^url\(/i.test(css.slice(i, i + 4))) {
      const end = css.indexOf(')', i);
      if (end !== -1) {
        // Quoted URLs fall through to the string branch on the next pass; this
        // only fast-paths the unquoted form.
        const body = css.slice(i + 4, end);
        if (!/["']/.test(body)) {
          out += 'url(' + body.trim() + ')';
          i = end + 1;
          continue;
        }
      }
    }

    // Whitespace run -> single space
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f') {
      let j = i;
      while (j < n && /\s/.test(css[j])) j++;
      out += ' ';
      i = j;
      continue;
    }

    out += c;
    i++;
  }

  /* Drop the space on the safe side of punctuation.
   *
   * This list is SHORT on purpose, and it got short the hard way. The first
   * version also collapsed the whitespace around `:` and around `)`, and both
   * cost real damage that `scripts/qa/computed.js` caught:
   *
   *   `)` — a descendant combinator after a functional pseudo-class is a
   *   space. `.a:not(.b) .c` collapsed to `.a:not(.b).c`, which is a compound
   *   selector matching an entirely different element. Whole blocks of
   *   ProSeries went ivory-on-ivory. It also turned `@media (a) and (b)` into
   *   `(a)and (b)`, which is simply invalid.
   *
   *   `:` — `.a :hover` (descendant) and `.a:hover` (compound) are different
   *   selectors, and nothing here knows which side of a `{` it is on.
   *
   * `+`, `-`, `*`, `/` and `(` are absent for the same family of reasons:
   * calc() needs its spaces and `a + b` is a combinator.
   *
   * What is left — braces, semicolons and commas — is unambiguous in every
   * context CSS has, and the comments are where the bytes actually were
   * anyway: they are two thirds of this file. */
  out = out
    .replace(/\s*([{};,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

  return out + '\n';
}

const src = readFileSync(SRC, 'utf8');
const built = minify(src);

const check = process.argv.includes('--check');
const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;

if (check) {
  if (current !== built) {
    console.error(`STALE: ${OUT} does not match ${SRC}. Run: node scripts/build-css.mjs`);
    process.exit(1);
  }
  console.log(`${OUT} is in sync with ${SRC}.`);
} else {
  writeFileSync(OUT, built);
  const from = Buffer.byteLength(src);
  const to = Buffer.byteLength(built);
  console.log(
    `wrote ${OUT}: ${(from / 1024).toFixed(1)}KB -> ${(to / 1024).toFixed(1)}KB ` +
    `(${(100 - (to / from) * 100).toFixed(1)}% smaller)`
  );
}
