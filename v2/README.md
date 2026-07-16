# /v2 — "THE PIECE" (v4 prototype, branch `version4`)

**Status: v4 prototype pass, 2026-07-16, branch `version4` (NOT live, not merged).**
Branch lineage: `version2` (approved v2 concept, tip 764e217) → `version4` (this).
`version2` stays as the approved checkpoint; `concept/the-program` and
`season-one-v2` remain archive. Dixon has NOT click-through'd the v4 pass yet.

## What this is
A clean-slate redesign for the whole site, ONE self-contained file (`index.html`),
zero legacy CSS. Design language: **the choreography document** — marley floor +
stage grid, spike tape as the accent system, live formation dots, counts as
structure, director margin notes, Tamara's mark upstage center.

Voice rule: **the visuals carry the metaphor, Dixon's own site copy carries the
words.** No em dashes, no winky theme-copy.

## The v4 pass (what changed from v2)
- **Tokens:** one ink ladder (`--ink-*`) instead of scattered alphas, a type
  scale, phrase easing (`--out`, `--io`). Inline style patches removed.
- **Motion identity:** hero count-in lands "5, 6, 7, 8" on the beat, headline on
  one (first Home view only, reduced-motion safe). Reveals settle like phrase
  ends. Ticker pauses on hover.
- **Formation layer 2.0:** dots are legible now, enter from the wings, walk
  slight arcs, hit marks in canon, and the rAF loop STOPS when settled +
  pauses when the tab hides. Sections re-block on scroll via
  `data-formation` on `.mark` (threeclumps for the tracks, windows for the
  week, bow for faculty, x on contact). Formation svg starts below the masthead.
- **Prints:** every photo sits in a `.ph` wrapper wearing the honey grade
  (desat + color-blend toward marley + warm-top/dark-floor soft-light). Tape
  vocabulary: `ptape a/b/c/d` variants, track-accent holdtapes on casting
  cards (Prep pink / Elite seafoam / Pro terracotta), spike-tape **X** on Contact.
- **Hero print** swapped Calor → Prelude in C Minor (no rival comp branding,
  portrait pose, palette-neutral). Calor lives on in the gallery.
- **ProSeries:** NEW training-week call sheet (Mon Prep / Tue-Wed Elite·Pro /
  Thu all tracks + 4/8/10 hrs), live "N days to curtain" tape, fixed slate
  posters (regenerated from the videos — real dance frames, committed on this
  branch only).
- **Teachers:** real credits — Jackson Haughton (Hip Hop), Madi Sprague (Tap),
  Tori Ugalde (Rotation), **Yahia Icheboudene (Acro & Cirque — Cirque du
  Soleil: OVO, La Nouba, MJ One)**. Director print size capped.
- **Gallery:** 13 prints (added Material Girl, My Days, We Can't Be Friends),
  varied tape/inset treatments, lightbox with prev/next/counter/arrows/swipe.
- **A11y:** skip link, focus traps + Escape + scroll lock (menu, lightbox),
  `aria-expanded`, `:focus-visible`, contrast bumps, full reduced-motion
  coverage, slate clips keyboard-operable.
- **Mobile:** Express Interest tape button + socials INSIDE the menu overlay
  (the <560px funnel leak is fixed).
- **Perf:** width/height on every img, lazy/async below fold, fetchpriority on
  the hero, settled-stop animation loop.
- **`?still=1`** — capture mode: every animation in its finished state, for
  screenshot rigs and reel captures (website-reel can use this).

## Structure
Hash-routed pages mirroring the live site: #home #proseries #collective
#teachers #gallery #merch #faq #contact. Router + formations + overlays in the
single file. `img/` holds resized derivatives (max ~1400px) — never hotlink
`../images/photos/*` originals (some are 8K px).

## Preview
python -m http.server 18790 -d C:/Users/bowle/Code/dwd-website-s1
→ http://localhost:18790/v2/  (browser caches hard; bust with ?v=N)
Screenshot rigs: append `&still=1`. Note: the Claude Code Browser pane may not
render this tab (occluded renderer = screenshots/IO stall); use Puppeteer
(DWDC-Instagram-Posts has it) — captureBeyondViewport keeps svh sane.

## Known gaps / next steps
- Dixon click-through + direction notes; iterate page by page.
- Tori headshot still the upscaled field photo; director headshot still
  pre-beard (no current bald+beard solo shot exists on this PC — take one).
- Merch stays a typographic stub linking to the live merch page.
- Contact links out to the real express-interest form; no forms wired here.
- A real port = replace live index.html wholesale + rewire forms, analytics,
  service worker, era gates (docs/ERAS.md). Do NOT merge into the legacy
  10-sheet CSS.
- The intensive poster regeneration touches `images/intensive/*-poster.jpg` —
  on THIS branch only; merging to main would (correctly) upgrade the live
  site's posters too.
