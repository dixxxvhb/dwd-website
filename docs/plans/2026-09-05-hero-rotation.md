# Home hero rotation — brief for builder hero-rotation
n**STATUS: DONE — shipped 2026-09-05. Dixon approved A-K + M, rejected L. M re-cut at SS=34.5.**
Date: 2026-09-05 · Repo: C:/Users/bowle/Code/dwd-website · Branch: create `hero-rotation` off main and stay on it · Author: Fable
Scratch: C:/Users/bowle/AppData/Local/Temp/claude/C--Users-bowle/6348c57c-dc52-4d10-bf9a-f040f1516631/scratchpad/hero-build/
Candidate list + verified source paths: `C:/Users/bowle/AppData/Local/Temp/claude/C--Users-bowle/6348c57c-dc52-4d10-bf9a-f040f1516631/scratchpad/hero/candidates.json` (use the `rank` numbers below to look up paths). Preview thumbnails you can Read: `.../scratchpad/hero/thumbs/<rank>.jpg`.

## 1. Decision
The home hero becomes a per-visit rotation of twelve approved entries (nine stills, three muted loops) instead of one still + one loop. One entry is chosen at load and stays for the visit; no carousel, no crossfade, no timer (site rule: one thing animates, and the loop already is that thing). Dixon approved these twelve on 2026-09-05 (A–M minus L); nothing else may be added. Rejected alternative: an auto-advancing slideshow — it would fight the loop, cost LCP, and violate the one-motion rule.

Entries (letter → candidates.json rank → caption chip text):
- A → 1 → "John Nuzzi · Solo Work · Tremaine" (current still; NOTE the current caption year "2024" is unverified — drop the year)
- B → 6 → "Daisy · Summer Intensive Showcase · 2026" (current loop; reuse the existing four hero-loop files, do not re-encode)
- C → 3 → "John Nuzzi · Aura · Groove 2025"
- D → 4 → "John Nuzzi · Heart of Gold · Groove 2025"
- E → 17 → "John Nuzzi · Aura · Groove 2025"
- F → 2 → "dwdCOLLECTIVE · A·Muse in Space · Orlando Ballet"
- G → 5 → same chip as F
- H → 14 → same chip as F
- I → 15 → same chip as F
- J → 7 → "Daisy · Summer Intensive Showcase · 2026"
- K → 8 → "Dixon · In the room" (loop)
- M → 16 → "Summer Intensive Showcase · 2026" (loop)

## 2. Files you own
- `index.html` — the `.hero-photo` block only (picture + video + captions) and one small inline JSON/script for the pick; nothing else on the page.
- `css/site.css` — hero-photo rules only (~line 9680-9725 region and whatever `.hero-photo`/`.caption` rules exist). Then `node scripts/build-css.mjs`.
- `js/main.js` — the hero-loop block only (~line 1205-1275); extract/extend it so it works for whichever entry is active.
- NEW `js/hero.js` is allowed if cleaner (must be added to the shell script list and the sw precache list; then build-routes handles shells).
- NEW `images/photos/hero/` — one folder, files `<letter>-800.webp`, `<letter>-1600.webp`, `<letter>-800.jpg`, `<letter>-1600.jpg` for every still (A–J minus B) and poster stills for B, K, M.
- NEW `video/hero-k-480.webm/.mp4`, `hero-k-800.webm/.mp4`, same for `hero-m-*`. B keeps `video/hero-loop*`.
- `scripts/encode-hero-loop.sh` — parameterise for entry letter (SRC/SS/DUR/CROP/OUT already env-driven; add a name suffix).
- NEW `scripts/build-hero-images.py` (Python + PIL, both on the PC) — generates every still size from the master paths in candidates.json, so this is reproducible.
- `sw.js` — precache list if hero assets are precached (probably NOT: only precache A's poster, the rest load on demand).
- Six route shells via `node scripts/build-routes.mjs` only.
Touch nothing else. Never commit or push.

## 3. Hard rules
- Section 0 of docs/plans/2026-09-04-audit-fixes.md applies (no browser pane; Puppeteer harness; build-routes + build-css + faq --check after edits; brand walls; no emoji; never invent copy).
- Never modify the master files in iCloud or the catalog. Read only. Never touch `iCloudDrive\Phone Drop\`.
- Repo budget: all new hero images together ≤ 2.5 MB; K + M video files together ≤ 2.2 MB (each 480 ≤ 250 KB, each 800 ≤ 750 KB). Stills: 1600w ≤ 180 KB webp, jpg ≤ 260 KB.
- LCP must not regress: the chosen entry's 800/1600 still is the poster and is the first image request; the video (if any) stays `preload="none"` and only plays after the existing reduced-motion + IntersectionObserver gate. A is the no-JS fallback (markup default).
- No layout shift: the hero keeps its fixed aspect boxes; every `<img>` keeps width/height.

## 4. Intent
- **Pick logic** (inline, tiny, runs before the hero paints — put it in `<head>` or immediately before `.hero-photo`): choose a random entry, avoiding the letter stored in `localStorage['dwd-hero-last']` (try/catch), store the new one. Write the chosen entry's sources into the existing `<picture>`/`<img>` and `<video>` (or render the block from a 12-entry JSON array embedded in the page). Keep `?hero=K` as a query override for QA.
- **Per-entry focal points**: each entry carries two `object-position` values, desktop-column and phone-band, chosen BY YOU per image by looking at the render (start centre; adjust so the dancer's body is fully inside the tall crop and the head is inside the phone band). Record them in the JSON, applied via a CSS custom property.
- **Captions**: one `.caption` element, text set from the entry. The still/loop caption pair goes away.
- **Stills pipeline**: from each master, produce a 1600-wide and 800-wide version, cover-cropped to the hero's *desktop* aspect is WRONG (it must serve both crops) — so export the full frame resized to 1600 wide, no crop, and let object-fit + the focal point do the rest. Light, consistent grade: match A's contrast; no filters beyond mild levels. Groove-banner frames (C, D, E): leave the banner; Dixon accepted it.
- **Loops K and M**: cut a 7s muted segment from each master via the encode script with a PORTRAIT crop (2:3 like B's). Choose SS by scrubbing frames (Read extracted frames) — K: the beat where Dixon's arms are widest and he is clearly the subject; M: a moment where John or Daisy is airborne or fully extended and the cast reads clean. K needs a grade to sit with B: warm it slightly and lift the blacks (ffmpeg `eq`/`curves` — keep it subtle, no colour cast). Poster still for each loop = its first frame at 1600/800.
- **Rotation weight**: uniform. Twelve entries, three of them loops.
- Everything else on the hero (text column, logo, CTA) unchanged.

## 5. Verification
- Run: `node scripts/build-css.mjs && node scripts/build-routes.mjs && node scripts/build-routes.mjs --check && node scripts/build-css.mjs --check && node scripts/build-faq-jsonld.mjs --check`, then `node scripts/qa/shoot.js <scratch>/shots "" --tiles` (ALL CLEAN), `node scripts/qa/routes.js`, `node scripts/qa/live.js`.
- A Puppeteer script that loads `/?hero=<letter>` for all twelve at 1280 and 390 and screenshots the hero only → `<scratch>/shots/hero-<letter>-1280.png`, `hero-<letter>-390.png`. Also: 20 plain loads of `/` produce ≥ 6 distinct letters and never the same letter twice in a row; `prefers-reduced-motion: reduce` on a loop entry shows the poster and never fetches video; the no-JS render shows A with its caption; console clean; LCP element is the hero image.
- Sizes: print every new file's size and the totals against the budgets.
- Look at all 24 hero screenshots yourself and iterate the focal points at least three rounds before running the checks.
Checks JSON:
```json
{"twelve_entries_render": false, "focal_points_reviewed_3_rounds": false, "no_repeat_and_spread": false, "reduced_motion_no_video_fetch": false, "nojs_shows_A": false, "budgets_met": false, "lcp_is_hero_image": false, "all_qa_scripts_pass": false, "shoot_clean": false}
```

## 6. Report format
Same fixed format as docs/plans/2026-09-04-audit-fixes.md section 0, plus a table: letter · source file · focal desktop · focal phone · files + sizes.
