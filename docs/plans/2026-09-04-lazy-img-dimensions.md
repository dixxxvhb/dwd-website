# Lazy image width/height — brief for builder-opus
Date: 2026-09-04 · Repo: C:/Users/bowle/Code/dwd-website · Branch: main · Author: Fable

## 1. Decision
Every `<img loading="lazy">` in `index.html` that lacks `width`/`height` gets both, set to the file's intrinsic pixel dimensions (or the 1x candidate's when srcset is used), so the browser reserves layout space and CLS drops. We are NOT changing rendered size: the site's CSS already sizes these images (mostly `width:100%; height:auto` or aspect-ratio rules), so intrinsic attributes only inform the aspect ratio. Rejected alternative: hand-typed guesses. Read the real file.

## 2. Files you own
- `index.html` — add the attributes.
- `<route>/index.html` for every route (proseries, collective, teachers, gallery, contact, privacy) — regenerate ONLY by running `node scripts/build-routes.mjs`, never hand-edit.
- `sw.js` — bump the cache version string by one (the repo does this on every content change; find the `vNN` constant).
Touch nothing else. Do not touch css/site.css (Fable is editing it in parallel; the tree may be dirty there — build on top, do not revert).

## 3. Hard rules
- Never rename/move files. Never commit or push. Never invent content.
- Do your own recon: read index.html and scripts/build-routes.mjs first; write your exact plan to the scratchpad before editing.
- Images whose src is a data: URI or a 1px placeholder gif with `data-src`: use the dimensions of the `data-src` target (or the srcset 1x candidate), not the placeholder.
- Missing file on disk → skip that img and list it in the report. Never fabricate numbers.
- ProSeries page images (`#page-proseries`) first; then the rest of the document.
- Do it with a small node script (sharp is NOT installed; read PNG/WebP/JPEG headers yourself or use `image-size` via `npx --yes image-size` if it resolves offline; a header parser for PNG IHDR + WebP VP8/VP8L/VP8X + JPEG SOF is ~40 lines and preferred). Keep the script in the scratchpad, not the repo.

## 4. Intent
After the change: `grep -o '<img[^>]*loading="lazy"[^>]*>' index.html | grep -vc 'width='` prints 0 (or only the skipped-missing ones). `node scripts/build-routes.mjs --check` passes after regeneration. No visual change: compare before/after screenshots of the ProSeries page at 1280 and 390 (use puppeteer from `~/Code/DWDC-Instagram-Posts`, `channel:'chrome'`, serve with `python -m http.server 8790` from the repo root — note the `.claude/CLAUDE.md` dev-server path is stale, serve from the repo). If any image's box changes size (a CSS rule uses only `width` and the new `height` attr now wins), fix by confirming CSS has `height:auto` for that selector — report it rather than adding new CSS unless it is one line in a file you own (you own none, so report).

## 5. Verification
- Run: `node scripts/build-routes.mjs && node scripts/build-routes.mjs --check`
- Measure: count of lazy imgs without width before/after; per-page pixel diff of ProSeries at 1280 and 390 (before vs after, `scripts/qa/pixdiff.js` exists — read its usage).
- Screenshots to `C:/Users/bowle/AppData/Local/Temp/claude/C--Users-bowle/eae98b4d-c73e-42d2-8dd9-87b291dc4258/scratchpad/shots/`: `01-proseries-1280-after.png`, `02-proseries-390-after.png`, `03-pixdiff.png` (or the diff summary text).
- Checks JSON:
```json
{ "lazy_imgs_without_dims": 0, "routes_check_passes": false, "no_visual_change_1280": false, "no_visual_change_390": false, "sw_version_bumped": false }
```

## 6. Report format (fixed)
```
STATUS: done | partial | blocked
FILES TOUCHED:
WHAT CHANGED:
CHECKS:
SCREENSHOTS:
VERIFIED vs BELIEVED:
OPEN / BLOCKED:
```
