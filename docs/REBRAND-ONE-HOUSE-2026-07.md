# REBRAND: One House, Three Volumes — dancewithdixon.com
**Spec date:** 2026-07-20 · **Author:** Fable (architect session) · **Status:** APPROVED PLAN, awaiting implementation
**Branch:** `rebrand/one-house` (this file lives on it). **Never push main directly — push = deploy on this repo.**

This spec is self-contained. A builder session with zero conversation context can execute it. Read it top to bottom before touching anything.

---

## 0. Mission

Rebrand the LIVE site (main's `index.html` + shared CSS) to the locked 2026-07-18 brand system:
- Retire blush `#f8d7c8` everywhere on live surfaces → **Family Pink `#FF7AA2`**.
- Express the "one house, three volumes" architecture: parent DWD = balanced anchor, dwdPROSERIES = loud, dwdCOLLECTIVE = hushed. Visitors should FEEL the arm change as they move between sections.
- Purge the 5 banned `*-transparent.webm` logos (11 references) and adopt the output-v2 logo system, done right this time (the 2026-07-20 swap was reverted over a bg-seam bug — see §4).
- Fix the Tamara Mark pull-quote (WORKSHEET item A4).
- Fix the 800–1280px nav wrap bug.

**The version4 / "THE PIECE" concept is SCRAPPED as a site direction** (Dixon, 2026-07-20). We salvage its assets (§8), not its choreography-document aesthetic. Do not port `v2/index.html`.

**What this is NOT:** a copy rewrite (live copy is already in the merged voice — leave it unless a section spec below says otherwise), a CSS-file consolidation (WORKSHEET D4 stays deferred), or a redesign of archive/poster pages (§9 Out of scope).

---

## 1. Ground rules (non-negotiable)

- **push = deploy.** All work on `rebrand/one-house`. Merge to main only on Dixon's explicit go after QA (§10).
- **No unseen UI ships.** Every visual change gets real visual QA before merge. This site does NOT render in the Claude Code Browser pane (screenshots time out — occluded renderer). **QA with Puppeteer screenshots**, cache-busted (`?v=N`). The `viewport` skill's sizes apply: desktop 1440, iPad 768, iPhone 390, PLUS 950 and 1100 (the nav-bug band).
- **Copy rules (any text you touch):** never em/en dashes (use period, comma, parens, or "to"); contractions always; no emojis anywhere in UI; no tricolons; dwdPS language is "apply" / "earn your spot" / "express interest," never "sign up"/"enroll"/"join"; it's a **company**, never "classes"/"lessons"; 100+ competition pieces (never "30+"/"dozens"); casing `dwdPROSERIES` / `dwdCOLLECTIVE`, parent is "Dance With Dixon" or "DWD," never "DWDC" for the parent. Deposit copy (if touched): "monthly deposits," "final balance when the comp slate locks" — NEVER "no extra fees"/"all-inclusive"/"no hidden fees," never a year-total on parent-facing UI.
- **HARD BLOCK:** iDance Orlando Festival is cancelled — must never appear. (Site is currently clean; keep it that way.)
- **Bebas Neue = large numerals only** (countdowns, dates, prices). Never words, never paragraphs.
- **Gold = Tamara memorial only.** Never a UI accent, never on ivory.

---

## 2. Token layer (Phase 1 — do this first, everything else builds on it)

Single source of truth: `css/styles.css :root`. `css/rebrand.css` `--rb-*` tokens become ALIASES of the root tokens (keep the names so 699 lines of rebrand.css keep working; they just stop carrying their own hexes).

### 2a. New/changed root tokens

```css
:root {
  /* ground */
  --forest: #0c1f17;        /* unchanged — canon dark ground */
  --forest-light: #1a3d2e;  /* unchanged */
  --forest-mid: #1e4432;    /* unchanged */

  /* voice */
  --ivory: #FAF3E8;         /* unchanged — all headline/body text on dark */
  --ivory-dim: #e8ddd0;     /* NEW — secondary text, muted labels, dividers. Replaces --cream-faint uses. */

  /* family signature */
  --terra: #C8614B;         /* unchanged — display-only on forest/ivory */
  --terra-light: #d4775f;   /* unchanged — BODY-TEXT swap on dark */
  --terra-dark: #a8503e;    /* unchanged — BODY-TEXT swap on light */

  /* pinks */
  --pink: #FF7AA2;          /* NEW — Family Pink. THE pink. */
  --pink-soft: #FF8FAB;     /* NEW — dwdPS Prep track badge ONLY */

  --seafoam: #6BAF8A;       /* unchanged — Elite badge / secondary green accents */
  --gold-tamara: #e2b955;   /* unchanged — memorial only (flat fallback) */
  /* Tamara rose-gold gradient (SVG stops): #c9956c → #e8c49a → #d4a574 */
}
```

### 2b. Migration map (mechanical, but verify each visually)

| Old | New | Notes |
|---|---|---|
| `--blush: #f8d7c8` | `--blush: var(--pink)` (alias), then rename call-sites to `--pink` | Blush is RETIRED. Family Pink is much hotter/darker than blush — every swapped surface needs an eyeball (see contrast rules below). |
| `--blush-light: #fbe8df` | delete; case-by-case → `--ivory` or `--pink` at low opacity | |
| `--cream: #f5f0e8` | `var(--ivory)` | Cream deprecated 2026-07-12. |
| `--cream-faint: #d4cfc0` | `var(--ivory-dim)` | |
| `--accent` (legacy alias) | `var(--terra)` | Then delete the alias. |
| `--rb-pink: #f8d7c8` (rebrand.css:18) | `var(--pink)` | |
| `--rb-ivory`, `--rb-terracotta`, `--rb-seafoam`, `--rb-gold`, `--rb-bg-base` | alias to root equivalents | Values already match; make them aliases so drift is impossible. |
| Literal `#f8d7c8` / `#fbe8df` / `#f5f0e8` in tighten.css, additions.css, amuse.css, dwdcon.css, fullout.css | tokens | Grep, swap, eyeball. Poster/IG sheets excluded (§9). |
| `--gold-light` (referenced additions.css:1975, defined nowhere) | delete the reference | Dead token; hover falls back to inherited color today. |
| `.a-badge-gold` (additions.css:1598) | rename `.a-badge-terra` | Misnomer — it's terracotta. Mechanical rename incl. HTML call-sites. |

Also update the docs that name blush as canon so the next session doesn't "correct" us backwards: `DESIGN.md` (13, 212), `design_tokens.json` (80, 234), `tailwind.design-md.js` (11, 25), `docs/WORKSHEET-2026-07.md:41` invariant line.

### 2c. Contrast rules (hard, from palette.md — enforce during every swap)

- Ivory on forest: unrestricted (15.6:1).
- **Family Pink `#FF7AA2` on forest: fine for text (6.9:1). On ivory: DISPLAY-ONLY (2.2:1)** — large/bold headlines, chips, buttons; never body copy on light.
- Terracotta `#C8614B` on forest OR ivory: display-only. Body text: `#d4775f` on dark, `#a8503e` on light.
- **Never terracotta or any mid-tone on `#1a3d2e` / `#1e4432`** (fails even UI contrast).
- Soft pink / seafoam on forest: fine for text + badges.
- Gold on forest only, never on ivory (1.7:1).
- Primary CTA buttons: terracotta bg + ivory label (large/bold), site-wide default. dwdPS-arm CTAs may use Family Pink bg + forest `#0c1f17` label.

---

## 3. Arm theming scaffold (Phase 1, same PR as tokens)

Add `data-arm` to every `<section class="page">` in `index.html` and to the `<body>` of standalone pages:

| Surface | `data-arm` |
|---|---|
| `page-home`, `page-teachers`, `page-gallery`, `page-shop`, `page-contact`, `page-privacy`, `404.html`, `offline.html` | `house` |
| `page-proseries`, `page-early-access`, `fullout.html` | `ps` |
| `page-adult-company`, `amuse-in-space.html`, `dwdcon.html` | `c` |
| `page-campaign`, `page-analytics`, `analytics.html` | `internal` (inherits house, no special styling) |

Scoped variables (new block at the end of `rebrand.css` or a new small `css/arms.css` — new file preferred, keep it under ~150 lines):

```css
[data-arm]          { --arm-accent: var(--terra); --arm-accent-body: var(--terra-light);
                      --arm-cta-bg: var(--terra); --arm-cta-text: var(--ivory); }
[data-arm="ps"]     { --arm-accent: var(--pink);  --arm-accent-body: var(--pink);
                      --arm-cta-bg: var(--pink);  --arm-cta-text: var(--forest); }
[data-arm="c"]      { --arm-accent: var(--terra); --arm-accent-body: var(--terra-light);
                      --arm-cta-bg: transparent;  --arm-cta-text: var(--ivory); }
                      /* dwdC CTAs: ghost button, 1px terracotta border */
```

Volume is more than a hue swap — per-arm styling intent (applies in §5 section passes):

- **house (parent DWD)** — the balanced anchor. Forest ground, ivory voice, terracotta accents, restrained. The only gold on the site: Tamara Mark + the gold star inside the parent logo asset. Current site is already closest to this; mostly a token swap.
- **ps (loud)** — full-chroma. Family-Pink-forward: pink section eyebrows/headline accents, pink CTAs, tighter/bolder type rhythm, big Bebas numerals (countdown, prices, track hours). Track accents are BADGE-BOUNDED: Prep `#FF8FAB`, Elite `#6BAF8A`, Pro `#C8614B` on badges/tags/labels only — never full surfaces, never section backgrounds, never leading a composition.
- **c (hushed)** — muted, photography-led, generous negative space. Fewer accents: thin 1px terracotta rules and rings (the dwdC ring signature), ghost CTAs, more air between blocks, images do the talking. No pink except where the Collective logo asset itself carries the Family Pink star.

---

## 4. Logo swap (Phase 2) — redo the reverted purge, correctly

**Why the last attempt failed:** transparent webms were swapped for solid-ground videos whose ground didn't sit seamlessly on the section behind them (bg-seam), and the header logo paused on a blank frame when the mobile menu opened. Lesson: **a solid-ground video may only sit on a background that is EXACTLY its ground color** (`#0c1f17` for `solid`, `#FAF3E8` for `ivory`), with no gradient/texture behind it. Anywhere else: static transparent PNG.

**Assets.** Copy from the canonical library `C:\Users\bowle\iCloud\iCloudDrive\Desktop\DWD\_brand\animated-logos\output-v2\` into `images/logos/v2/` (only the files actually referenced — this is a GitHub Pages repo, keep weight down; `idle` loops preferred for ambient placements, they're seamless):

- `solid/DWD-green-idle-solid.mp4`, `solid/ProSeries-green-idle-solid.mp4`, `solid/Collective-green-idle-solid.mp4` (or `full` where a one-shot intro fits better — hero)
- `still-solid/*.png` and `merch-alpha/*.png` as needed per the table below (merch-alpha = 4096² true-transparent; downscale to ≤1024px web copies, don't ship 4096 PNGs)

**Placement prescription — all 11 banned references in `index.html`** (line numbers from 2026-07-20 main; re-grep `transparent.webm` before editing, they will have shifted):

| Line (approx) | Placement | Replace with |
|---|---|---|
| 166 | preload/head reference | delete or repoint at the chosen hero asset |
| 259, 282 | home hero + home section mark | animated: `DWD-green-full-solid.mp4` IF the element sits on flat `#0c1f17`; else static transparent PNG (downscaled `merch-alpha/DWD-green-merch-alpha.png`) |
| 848 | adult-company section logo | static transparent Collective PNG (hushed arm — no motion), thin terracotta ring treatment per §3 |
| 1043 (+ its `poster=` PNG) | proseries section logo | `ProSeries-pink`-family asset — PS is Family-Pink-forward; animated idle-solid only if on flat forest, else static PNG |
| 1401 | teachers | static DWD PNG |
| 1482 | gallery | static DWD PNG |
| 1585 | shop | static DWD PNG |
| 1722 | contact | static DWD PNG |
| 1768, 1800 | campaign/analytics (internal) | static PNG, don't spend effort |

Then:
- **Delete** the 5 banned `.webm` files AND their `DWDPS-*-transparent.png` / `ProSeries-*-transparent.png` fake-alpha siblings from `images/logos/` once nothing references them. Grep the whole repo (`fullout.html`, `dwdcon.html`, `amuse*.html`, `sw.js` precache list, `manifest`) — not just index.html.
- **Every `<video>` logo:** `muted playsinline autoplay loop` (loop only for `idle` mode), `poster` = matching `still-solid` PNG, and a `prefers-reduced-motion` fallback that swaps to the static PNG (closes WORKSHEET A6's reduced-motion item).
- **Nav brand mark:** static PNG only (small size, no video in the fixed header — this is also what killed the header last time).
- **Service worker:** bump the cache version in `sw.js` — stale precache is a known footgun on this site.
- **Phase-2b (separate PR, after the swap ships):** port the live HTML/CSS/SVG logo embed for the hero (branch `feat/live-logo-embed`, 1 commit, has the v1 approach). This is the canon web answer; the mp4/PNG swap above is the sanctioned interim. Do not attempt it in the same PR as the swap.

---

## 5. Section passes (Phase 3) — what's a re-skin vs a real redesign

Work top-down in this order. "Re-skin" = tokens + arm variables + spot fixes, keep layout. "Redesign" = new layout for the section, built live-preview style so Dixon can watch (his design-mode preference — declare it at the start of the session).

| Section | Level | Spec |
|---|---|---|
| `page-home` hero | Re-skin+ | Keep structure. Swap logo per §4. **Adopt the v4 hero reel** (`images/video/hero-reel-1080.mp4` + poster, from the version4 branch, §8) as the hero background — default yes, flag to Dixon in review. Blush → pink swaps per §2. |
| `page-home` arm-entry cards ("ProSeries." / "The Collective." ENTER cards) | **Redesign** | This is where "separation of colors for each brand" must land hardest. Two entry cards, each rendered in its arm's volume: ProSeries card LOUD (Family Pink accents, pink CTA, track badges Prep/Elite/Pro as small colored tags, Bebas hour/price numerals); Collective card HUSHED (photo-led, thin terracotta ring, ghost CTA, more negative space). The contrast between the two cards side by side IS the brand statement. |
| `page-proseries` + `page-early-access` | Re-skin+ | Apply `ps` volume. Track cards get badge accents (badge-bounded rule). Salvage the v4 "training week" call-sheet content: Prep/Elite/Pro at 4/8/10 hrs/wk (§8). Countdown numerals stay Bebas. Express-interest copy untouched (it's correct). Deposit-framing rules from §1 if pricing copy is touched. |
| `page-adult-company` | **Redesign** | Currently reads like every other section. Rebuild hushed: large photography (pull best dwdC/company shots from `images/photos/opt/`), generous spacing, thin terracotta rules, ghost CTA, muted overall. This is the section that proves the site has volumes, not one template. |
| `page-teachers` | Re-skin+ | Apply house tokens (closes A6 teacher-card token item). **Salvage v4 faculty photos + credits** (§8): Jackson Haughton (hip hop), Madi Sprague (tap), Tori Ugalde, Yahia Icheboudene (Acro/Cirque — Cirque du Soleil OVO / La Nouba / MJ One). Tori's is an upscaled crop; keep until her real headshot exists. NO Malik card (removed from rotation June 2026) — verify he's not present. |
| `page-gallery` | Re-skin + pipeline | Tokens, plus **WORKSHEET D8**: batch the 4–11MB camera originals to ~1600px WebP (~278MB currently). Optionally adopt the v4 lightbox (prev/next/counter/swipe) — nice-to-have, not a gate. |
| `page-shop`, `page-contact`, `page-privacy` | Re-skin | Tokens + arm vars only. |
| `dwdcon.html` | Verify | Already close to brand (it's recent). Token-swap literals, confirm Tamara SVG intact, apply `data-arm="c"`. |
| `fullout.html`, `amuse-in-space.html` | Light touch | ARCHIVES of past events. Banned-asset grep + literal-hex token swap only. No redesign. |

**Tamara Mark fix (WORKSHEET A4, do during the home pass):** replace the CSS-drawn pull-quote mark (`rebrand.css:463–474`, `.bg-tamara`, index.html:801) with the canonical inline SVG already used in the footer (index.html:2060–2066): right circle smaller and higher (`cx=152 cy=70 r=49`), left larger lower (`cx=100 cy=115 r=65`), unfilled, rose-gold gradient stroke `#c9956c → #e8c49a → #d4a574`, `viewBox="20 10 200 190"`. Never equal circles, never flat fill, never on ivory.

---

## 6. Nav rebuild (Phase 4)

Bug: at ~800–1280px (worst 950–1100), 7 uppercase links with `letter-spacing:0.24em` + a `white-space:nowrap` CTA overflow the bar; the hamburger only engages at `max-width:900px` (`rebrand.css:624–631`, mirrored `editorial.css:367`).

Fix (all three, together):
1. **Raise the drawer breakpoint to 1150px** (both files — rebrand.css AND editorial.css must agree, that's the mirror trap).
2. Reduce link tracking to `0.14em` and cap the fluid font: `clamp(11px, 0.5rem + 0.25vw, 14px)` — links were widest exactly where space is tightest.
3. CTA: keep `white-space:nowrap`, but shorten the longest gated label if needed ("Express Interest →" fits; audit `data-reveal-after` variants at index.html:204–211).

Restyle while in there: nav CTA = `--arm-cta` tokens (Family Pink bg + forest text when the CTA is a ProSeries funnel action, which it currently is). QA at 800 / 950 / 1100 / 1200 / 1280 / 1440 via Puppeteer.

---

## 7. QA gates (Phase 5 — before ANY merge)

1. `grep -ri "transparent.webm"` → zero. `grep -ri "idance"` → zero. `grep -i "#f8d7c8\|#f5f0e8\|#fbe8df"` → zero outside `css/poster-pages.css`, `amuse-story-ig.html`, `merch-poll-ig.html` (§9 exclusions).
2. Puppeteer screenshot sweep: every `#page-*` hash route + `dwdcon.html` + `fullout.html`, at 390 / 768 / 950 / 1100 / 1440. Eyeball every one. Cache-bust.
3. Contrast spot-check per §2c (especially every new Family Pink placement — it's the risky swap).
4. Reduced-motion pass: `prefers-reduced-motion` shows static PNGs, no autoplaying logo video.
5. Mobile menu open/close with the new header — the blank-frame regression watch.
6. sw.js cache bump confirmed; hard-reload works.
7. **Dixon click-through of the deployed branch preview** (no-unseen-UI rule), then his explicit merge go. Merge = deploy. `/wrap` files nothing (site work lives in the repo), but update `docs/WORKSHEET-2026-07.md` checkboxes A4/A6/D8 if closed.

---

## 8. Salvage manifest (from branch `version4`, clone at `C:\Users\bowle\Code\dwd-website-s1`)

Cherry-pick FILES (git checkout from the branch or plain copy) — not the concept:

- `images/video/hero-reel-1080.mp4` + poster JPG/WebP → hero (§5)
- `images/teachers/*` v4 faculty headshots (Jackson, Madi, Tori, Yahia) + the credits copy in `v2/index.html`'s teachers section
- `images/intensive/intensive-day{1..4}.mp4`, `intensive-week.mp4` + real-frame posters → available for the fullout archive or PS page if wanted (optional)
- The `*-solid.mp4` logo set already on that branch's `images/logos/` (cross-check against output-v2 canon before trusting — output-v2 is authoritative)
- `js/motion.js` — reveal-on-scroll/rAF utilities; take only if the home redesign wants its reveal system (do NOT take the formation-dot layer — that's the scrapped aesthetic)
- v4 gallery lightbox JS (optional, §5 gallery)

Then leave `version4`, `version2`, `concept/the-program`, `season-one-v2` as archive branches. Don't delete.

---

## 9. Out of scope (explicit)

- `css/poster-pages.css`, `amuse-story-ig.html`, `merch-poll-ig.html` — one-off IG/poster generators, historical campaign artifacts. Excluded from the blush purge greps.
- WORKSHEET D4 (10-sheet CSS consolidation) — still deferred; the token layer (§2) de-fangs it.
- D9 minification, D1 spam guard, D2 focus trap — separate hygiene, not this project.
- Copy rewrites beyond what section specs name.
- The dwd app, reel kits, `design-md` tokens — same rebrand debt, DIFFERENT project (don't scope-creep into them; they're tracked in the brand-audit memory).
- `v2/` folder porting of any kind.

---

## 10. Phasing + delegation map (for the implementing session)

| Phase | Work | Model | Review depth |
|---|---|---|---|
| 1 | Token layer + aliases + docs updates + `data-arm` scaffold (§2–3) | builder-sonnet | Diff skim + grep gates |
| 2 | Logo swap + asset copy/downscale + sw bump (§4) | builder-sonnet | Puppeteer QA, line-by-line on the header |
| 2b | Live HTML logo embed port (separate PR) | builder-sonnet | Real visual QA (this exact swap failed once) |
| 3 | Section passes (§5) — re-skins | builder-sonnet (haiku for pure token find/replace) | Puppeteer per section |
| 3 | Home arm-cards + Collective **redesigns** (§5) | architect designs live w/ Dixon (mode a: live preview), builder implements | Full |
| 4 | Nav rebuild (§6) | builder-sonnet | Puppeteer at 6 widths |
| 5 | QA gates (§7) → Dixon go → merge | — | Dixon |

Defaults taken in this spec (flag to Dixon at review, proceed unless he objects): v4 hero reel adopted; nav brand mark = static PNG; poster/IG generators untouched; archives light-touch; gallery D8 folded in.
