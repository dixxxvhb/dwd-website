# QA scripts

The Claude Code browser pane cannot drive this site: JS scrollTo no-ops and
captures come back blank. Everything here runs Puppeteer against a local static
server instead. Puppeteer is not a dependency of this repo; the scripts resolve
it from `~/Code/DWDC-Instagram-Posts/node_modules/puppeteer` and launch with
`channel: 'chrome'`.

Start the server first:

```bash
python -m http.server 8790 -d C:/Users/bowle/Code/dwd-website
```

Every script unregisters the service worker and clears caches before loading, or
you end up testing the last deploy instead of your working tree.

## shoot.js

Full sweep. Loads every route at 1280 and 390 and fails on console errors,
failed or 4xx requests, broken images, horizontal overflow, dead `#anchors`, and
unexpected off-domain links (social, maps, and the privacy page's Stripe/Plaid
links are allowed; anything else is a CTA that escaped the site).

```bash
node scripts/qa/shoot.js <outDir> [routes] [--tiles]
```

`--tiles` also writes 1400px-tall screenshots per route. It waits for every
image to resolve first: these pages carry lazy images with no width/height, so
an unsettled page grows while you tile it and the same section shows up twice.

## contrast.js

Measures text-over-photo contrast on rendered pixels rather than estimating it.
Hides the text, photographs the rectangle behind it, and compares the worst
pixel in that rectangle against the text colour.

```bash
node scripts/qa/contrast.js <route> <textSelector> <width>
```

## shot-element.js

One element, one file. For reviewing a single component at a given width.

```bash
node scripts/qa/shot-element.js <out.png> <route> <selector> <width>
```

**Limitation.** `contrast.js` screenshots the element's rectangle in absolute
page coordinates. On very tall pages (ProSeries is ~18,000px) that capture can
land off target, in which case the reported ground will be obviously wrong — a
forest reading for something you know sits on pink, or an identical result for
two elements on different grounds. When the ground is a flat colour, cross-check
by reading the computed `color` of the text and the `background-color` of its
section and doing the arithmetic. The tool is at its best for text over
photographs, which is what it was written for.

## routes.js

Exercises the real URLs built by `scripts/build-routes.mjs`: a direct load of
every shell (right section, right title, stylesheet actually applied, no console
errors, no failed requests), client-side nav with back and forward, the old
`#hash` links upgrading themselves to paths, `#shop` correctly staying a hash
because it has no shell, an element anchor resolving from inside a shell, and
`/fullout` NOT being intercepted by the click handler.

```bash
node scripts/qa/routes.js
```

Exits non-zero on any failure. Run it after touching `js/main.js` routing or
`scripts/build-routes.mjs`.

## snap.js + pixdiff.js

The pair used to prove a CSS refactor changed nothing it was not supposed to.

```bash
node scripts/qa/snap.js /tmp/before          # before the change
# ... edit CSS ...
node scripts/qa/snap.js /tmp/after
node scripts/qa/pixdiff.js /tmp/before /tmp/after /tmp/diff
```

`snap.js` pins everything that would otherwise differ between two identical
runs: reveal animations forced to their end state, the hero video removed so its
poster shows rather than a random frame, the teacher slideshow forced to slide
one, all animation and transition durations zeroed, lazy images made eager and
awaited, fonts awaited, sticky chrome taken out of the flow. Two consecutive
runs on unchanged code are bit-for-bit identical, which is what makes it usable
as a gate.

`pixdiff.js` decodes both PNGs in headless Chrome via canvas (no image
dependency), compares per channel with a small tolerance for antialiasing noise,
and writes a diff image with changed pixels in magenta over a dimmed original.
Exits non-zero when more than 0.1% of a page's pixels moved. Both thresholds are
overridable: `PIX_THRESHOLD`, `PIX_FAIL_RATIO`.

## computed.js

Fingerprints the computed style and geometry of every element on every route, at
both widths, and compares two captures.

```bash
node scripts/qa/computed.js /tmp/before.json
# ... edit CSS ...
node scripts/qa/computed.js /tmp/after.json
node scripts/qa/computed.js --compare /tmp/before.json /tmp/after.json
```

Stricter than `pixdiff.js`, because it sees changes a screenshot cannot: a
colour behind an opaque element, a property that only bites at another
breakpoint. It also names every property that moved, which is what makes it
useful for deciding what a change actually did rather than just that it did
something. It does not replace `pixdiff.js` — that one compares what a person
would see. Use both.

## prune-css.mjs, prune-important.mjs, orphan-css.js, dead-css.js

The CSS refactor tools, in the order they are useful:

- `orphan-css.js` — reports rules whose class or id names appear nowhere outside
  `css/`. Read-only.
- `prune-css.mjs` — applies that (`--write`), or lists what it would cut
  (`--list`).
- `prune-important.mjs` — `--report` counts `!important` by property; `--all`
  strips them; `--keep a,b,c` keeps them only on the named properties and their
  shorthands. Pair with `computed.js`: strip everything, see which properties
  moved, keep only those, verify identical.
- `dead-css.js` — the DOM-matching alternative to `orphan-css.js`. Drives the
  site through every state and reports selectors that matched nothing. More
  thorough in principle, but it has blind spots (a class added on scroll, or
  only when a query returns a row), so it is a report to read, never an edit.

## live.js

End-to-end behaviour check of everything dynamic: the Episode Guide rendering
from its view, the Collective's empty state, the hero loop playing and crediting
the right dancer, chair counts following a single edit, the interest form's
validation, its live track preview, its success state, the exact payload it
sends, and the absence of any off-domain CTA on any route.

```bash
node scripts/qa/live.js
```

**It disables the service worker before submitting anything, and aborts if one
is still in control.** Puppeteer's page-level request interception cannot see
fetches made by a controlling service worker, so a stubbed INSERT sails straight
past it into the live database. That is how two junk rows ended up in
`audition_registrations` on 2026-09-03. If this check ever aborts, do not
"just try again" — find out why the worker is still there.
