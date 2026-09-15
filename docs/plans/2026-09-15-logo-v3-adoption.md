# Logo v3 adoption on dancewithdixon.com — brief for builder-opus
Date: 2026-09-15 · Repo: ~/Code/dwd-website · Branch: logo-v3 (create from main) · Author: Fable

## 1. Decision (what and why)
Dixon approved the v3 logo system today (three marks: dwdPS, dwdC, DWD; one colorway each). The website still serves pre-brand-lock PNGs from `images/logos/` and a legacy JSON-LD logo URL. Every logo on the site becomes a v3 static (SVG for inline/img use, PNG only for favicons and social/OG images). Old logo files are deleted from the repo; v3 is the only logo available. Rejected alternative: embedding the animated video logo on the site (the July `feat/live-logo-embed` branch). Statics only; motion stays in reels.

## 2. Files you own
- `images/logos/**` — delete every existing file; add `images/logos/v3/` holding only the SVG/PNG files actually referenced.
- Every `*.html` (and any shared header/footer include or JS that injects a logo) — swap each logo `<img>` / `<link rel=icon>` / `apple-touch-icon` / `og:image` / JSON-LD `logo` to v3.
- `site.webmanifest` / `manifest.json` if present — icons to v3 glyph/compact PNGs.
- Any file referencing `transparent.webm` — remove the reference and the tag around it.
- `docs/plans/2026-09-15-logo-v3-adoption.md` — append your report at the bottom.

## 3. Hard rules
- Never rename or move files outside your owned list. Never push (GitHub Pages builds on push to main). Commit on `logo-v3` with explicit paths only (`git add <paths>`), never `git add -A`, never stash/checkout/reset. Never invent copy; leave a `TODO(fable)` marker and report it.
- Do your own recon first: read owned files and callers, write your exact-edit plan to `<scratchpad>/plan.md`, then build.
- Read `~/.claude/design-taste.md` before touching anything visible. No emojis. No new dependencies.
- The v3 static files are generated locally, NOT read from iCloud (they are cloud-only placeholders on this PC): `cd ~/Code/dwd-logo-v2 && node scripts/render-statics-v3.mjs --stem-names` writes `out/v3/statics/<stem>-<tier>-<ground>.svg` and `-<px>.png` (stems dwdPS / dwdC / DWD; tiers hero / compact / glyph; grounds dark / light / transparent). If the flag is wrong, read the script header and use what it documents. Copy ONLY the files you need into the repo.
- Tier by displayed size: hero >160px, compact 64-160px, glyph <64px. Never show hero below 160px.
- Brand: dwdPS mark for ProSeries surfaces, dwdC for Collective, DWD for the parent brand / anything shared. Never ship a `*-transparent.webm`.
- The tree may be dirty from a parallel agent: build on top, do not revert.

## 4. Intent
Header/nav logo: the mark for that page's brand at its rendered height (most nav logos are 40-56px → glyph tier; a hero-section logo >160px → hero tier). Match the ground: dark pages use `-dark`, ivory pages `-light`; transparent only when the mark sits on a photo with a scrim. Keep each logo's box size and position exactly as it is now (layout shape must not change); only the art changes. Favicons: glyph 32 + 64 (dark ground); apple-touch-icon compact 180 (resize from the nearest PNG with a tool already in the repo or plain ImageMagick/sharp if present, no new deps). OG image: keep whatever OG image exists unless it IS a logo, in which case use hero-dark 1024. JSON-LD `logo` → absolute URL of `DWD-hero-light-1024.png`. Alt text: "Dance With Dixon", "dwdPROSERIES", "dwdCOLLECTIVE". Check 390px width on the home page and /schedule/.

## 5. Verification
- Run: the repo's existing local preview (read README / package.json; if plain static, `npx serve .` or python http.server). After: grep the repo for `images/logos/` and `.webm`; only `images/logos/v3/` paths may remain, zero webm.
- Screenshots to `<scratchpad>/shots/`: `01-home-desktop.png`, `02-home-390.png`, `03-proseries-page.png`, `04-favicon-32px-crop.png`.
- Iterate against the mark at its real size at least three times: the glyph must read at 32px.
```json
{ "no_legacy_logo_refs": false, "no_webm_refs": false, "all_pages_render": false, "favicons_valid": false, "layout_unchanged": false, "committed_on_logo_v3_branch": false }
```

## 6. Report format (fixed — use exactly this)
```
STATUS: done | partial | blocked
FILES TOUCHED: <paths, one per line>
WHAT CHANGED: <three to six lines, plain words>
CHECKS: <the JSON above, filled in>
SCREENSHOTS: <the named paths>
VERIFIED vs BELIEVED: <one line each>
OPEN / BLOCKED: <anything you could not do, and why>
```

---

## Builder report (builder-opus, 2026-09-15)

STATUS: done
BRANCH: logo-v3 (not pushed)

Deviation from §4 worth Fable's eye: every in-page `<img>` uses the **transparent**
ground, not `-dark`/`-light`. The v3 `-dark`/`-light` statics carry a full-bleed opaque
`<rect>`; no logo surface on this site is a flat exact-match ground (the topnav is
`rgba(12,31,23,0.82)` over scrolling content, the hero marks carry `drop-shadow`, the
Collective mark sits on a photo). An opaque tile would have shown as a visible square.
`-transparent` is byte-identical art to `-dark` minus that rect, so the brief's
"match the ground" intent is met without the seam. `-dark` PNGs are used where an
opaque tile is correct: favicons, apple-touch-icon, manifest.

Also: glyph and compact SVGs contain zero `<text>` nodes, so the 148KB embedded Outfit
font was stripped (163KB -> 15KB each). Hero SVGs have 2 `<text>` nodes; font kept.

Tier map (measured from css/site.css, not guessed):
nav 42/52px -> DWD glyph · contact 44px -> DWD glyph · teachers 56/72px -> DWD glyph ·
footer 88px -> DWD compact · s1-logo 96-120px -> dwdPS compact · ps-story 140px -> dwdPS
compact · home hero min(360px,90%) -> DWD hero · ps-hero 620/420/160px -> dwdPS hero ·
collective hero 620/420/220px -> dwdC hero.
