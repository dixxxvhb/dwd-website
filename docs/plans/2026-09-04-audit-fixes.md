# Audit fixes + upgrade — builder briefs
n**STATUS: ALL PHASES DONE — shipped in 800095d (2026-09-05). See docs/STATUS.md.**
Date: 2026-09-04 · Repo: C:/Users/bowle/Code/dwd-website · Branch: audit-fixes-2026-09-04 (already checked out — stay on it) · Author: Fable
Source of findings: docs/audits/2026-09-04-full-site-audit.md (read it first, in full).
Scratch: C:/Users/bowle/AppData/Local/Temp/claude/C--Users-bowle/6348c57c-dc52-4d10-bf9a-f040f1516631/scratchpad/fix-<phase>/

## 0. Shared hard rules (every builder)
- Never commit, never push, never deploy, never switch branch. Never rename files unless this brief says so. Never invent content (copy, names, prices, dates) beyond what is written here — leave `TODO(fable)` and report it.
- Do your own recon first: read the owned files and their callers, write an exact-edit plan to `<scratch>/plan.md`, then build.
- Rendering: the Claude browser pane does NOT work on this site. Use the Puppeteer harness in scripts/qa (read scripts/qa/README.md). Local server: `python -m http.server 8790 -d C:/Users/bowle/Code/dwd-website` (start it if port 8790 is not answering; never kill it — a parallel builder may be using it).
- After ANY edit to index.html run `node scripts/build-routes.mjs` (it regenerates the six route shells from index.html) and `node scripts/build-faq-jsonld.mjs --check`. The shells (proseries/, collective/, teachers/, gallery/, contact/, privacy/) are BUILD OUTPUT — never hand-edit them.
- Brand walls: colours forest #0c1f17, Family Pink #FF7AA2, terracotta #C8614B (display-only on forest/ivory; body-size text on it uses terra-light #d4775f on dark / terra-dark #a8503e on light), ivory #FAF3E8, seafoam #6BAF8A, soft pink #FF8FAB. No gold except the Tamara Mark SVG. No emoji. Fonts unchanged. Casing when abbreviating: dwdPROSERIES / dwdCOLLECTIVE (lowercase dwd + caps arm), full names "Dance With Dixon ProSeries" / "Dance With Dixon Collective" are also fine; "DWD ProSeries" / "DWD Collective" are NOT.
- Design rules: subtractive. One primary CTA style site-wide. One focal point per screen. Max 2 font sizes + 2 weights per component. No decoration without a job. Tap targets ≥ 44px on mobile. Check 390px before calling anything done.
- The tree may be dirty from a parallel builder: build on top of what is there, never revert or reformat files you do not own.
- Verification for anything visual: iterate against the intent at least three times, then run `node scripts/qa/shoot.js <scratch>/shots --tiles` and read the tiles yourself. Reviewing means looking at the PNGs, not trusting the pass line.

Report format (fixed — use exactly this):
```
STATUS: done | partial | blocked
FILES TOUCHED: <paths, one per line>
WHAT CHANGED: <three to eight lines, plain words>
CHECKS: <the JSON, filled in>
SCREENSHOTS: <the named paths>
VERIFIED vs BELIEVED: <one line each>
OPEN / BLOCKED: <anything you could not do, and why>
```

---

## Phase 1 — legacy pages, orphans, 404, sitemap (builder: fix-legacy)
Files you own: dwdcon.html, fullout.html, amuse-in-space.html, amuse-story-ig.html, merch-poll-ig.html, js/amuse-form.js, 404.html, offline.html, sitemap.xml, robots.txt, manifest.json. NOTHING ELSE — in particular do not touch index.html, css/, js/main.js, or the route shells (another builder owns them; it will remove the hidden links to your pages).

Decisions:
1. dwdcon.html and fullout.html → replace each file's entire content with a minimal redirect stub: `<meta name="robots" content="noindex">`, `<link rel="canonical" href="https://dancewithdixon.com/proseries/">`, `<meta http-equiv="refresh" content="0; url=/proseries/">`, a one-line body "dwdCON / Full Out has wrapped. Taking you to ProSeries." with a plain link, no scripts, no stylesheet. Same filenames (inbound links keep resolving). Remove both from sitemap.xml.
2. amuse-story-ig.html, merch-poll-ig.html, js/amuse-form.js → `git rm` them (they are Instagram render assets and an unused script; git history keeps them). 
3. amuse-in-space.html → make it an archive page for a PAST event: title/OG "A·Muse in Space — June 27, 2026, Orlando Ballet", all copy in past tense ("was presented", "the cast performed"), remove every application/open-call CTA and form, and replace the (208) phone number with dancewithdixon@gmail.com. Keep the existing styling and the shared header/footer if it has them. Add it to sitemap.xml with lastmod 2026-09-04. Keep `noindex` OFF (it is a real archive page).
4. 404.html → a real not-found page in the site's look: load /css/site.css, forest background, the wordmark linking home, H1 "Nothing here.", one sentence "That page moved or never existed.", three text links: Home (/), ProSeries (/proseries/), Contact (/contact/). Remove the JS redirect entirely. Keep the `<title>` "Not found · Dance With Dixon". Must render correctly at 390 and 1280 (screenshot it).
5. robots.txt → remove the /analytics.html disallow; keep everything else; ensure `Sitemap:` line is present and correct.
6. manifest.json → description: "Dance With Dixon: elite youth training (dwdPROSERIES) and an adult modern company (dwdCOLLECTIVE) in Orlando." (the word "collective" must not describe the parent brand).
7. sitemap.xml → home URL must be `https://dancewithdixon.com/` (trailing slash), entries only for real pages: /, /proseries/, /collective/, /teachers/, /gallery/, /contact/, /privacy/, /amuse-in-space.html.

Verification:
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:8790/<each sitemap path>` all 200; dwdcon.html and fullout.html contain no "Register", "Pay", "Badge", or price text.
- `node scripts/qa/shoot.js <scratch>/shots 404` if routes.js supports it; otherwise a small Puppeteer script that screenshots /404.html and /amuse-in-space.html at 390 and 1280 to `<scratch>/shots/404-390.png`, `404-1280.png`, `amuse-390.png`, `amuse-1280.png`.
Checks JSON:
```json
{"legacy_pages_are_stubs": false, "ig_assets_removed": false, "amuse_past_tense_no_phone": false, "404_real_page_no_redirect": false, "sitemap_8_entries_home_slash": false, "robots_clean": false, "screenshots_reviewed": false}
```

---

## Phase 2 — main site: correctness, mobile, CTA, contrast, redundancy (builder: fix-main)
Files you own: index.html, css/site.css, js/main.js, js/eras.js, js/season.js (only if needed), the six route shells VIA build-routes.mjs only, data/ (only if the FAQ text changes — it should not). Do not touch Phase 1's files.

### 2a. Facts (index.html; the shells follow)
- Teachers bio (.tch-bio): replace the sentence "For nine years, I ran the competitive dance program..." with: "Nine years at Celebration Arts Academy: four teaching, five as competition director, and 100+ competition pieces along the way." Keep the rest of the paragraph's voice; make sure no sentence now contradicts "five competition seasons" (if that phrase remains it is consistent with five directing years).
- Remove "I performed with professional dance companies in New York." from the bio and remove the creds-list item "NYC professional company". If the creds list needs a replacement item to keep its rhythm, use "Adjunct professor of Jazz, Utah Valley University" only if it is not already there.
- Home Track Record stat: "9 / Years directing a youth competition program" → "5 / Years as a competition director". If a "9" is wanted elsewhere, the only truthful 9 is "9 / Years at one studio" — optional.
- A·Muse cast line "ages 16+" → "ages 18+".
- Casing: every "DWD ProSeries" → "dwdPROSERIES", "DWD Collective" → "dwdCOLLECTIVE" (visible copy, alt text, meta). Check index.html:96, 99, 656, 1914, 2417 and grep for more.
- Home meta description (index.html:12): "Dance With Dixon: elite youth training (dwdPROSERIES) and an adult modern company (dwdCOLLECTIVE) in Orlando." Home canonical → `https://dancewithdixon.com/` with trailing slash (js/main.js:220-222 too).
- Delete the stale "Season One begins August 10, 2026." tagline node (index.html:932) and its era gate if nothing else uses it.
- Phone inputs: remove the 555 placeholders (no placeholder, label does the work).
- Remove the hidden legacy nav CTAs at index.html:287-288 (Register / Summer Intensive) and their era attributes; remove the hidden link to /fullout and any link to /dwdcon; remove the `#page-shop` merch-poll section and its inbound link (index.html:1877, 2188-2294) plus its route entry in js/main.js and build-routes ROUTES if present, and its CSS.
- Footer privacy link and ProSeries privacy link → `/privacy/` path.
- Heading order on Contact and Privacy sections: one H1 then H2s, no skipped levels.

### 2b. One CTA system
- ONE primary button style site-wide: Family Pink #FF7AA2 background, forest #0c1f17 text, Outfit, min-height 48px, the existing radius. Apply to the nav CTA, the hero CTAs, the sticky bar button, form submit buttons (Send message, Send me the recaps, + Add a dancer becomes a secondary/ghost button). Delete `--oh-coral` usage and the `s1-cta-sky` class from the nav CTA; the sky-blue token may remain ONLY inside the ProSeries hero block (`.ps-hero` and its children) as type colour, not on the button — the hero button is pink too.
- Nav CTA on phone: inside the open menu, render the Express Interest link as a full-width pink button at the bottom of the menu list (not display:none). Closed menu on phone: CTA stays hidden (the sticky bar covers it).
- Sticky bar `#mob-cta` on EVERY route (Home, ProSeries, Collective, Teachers, Gallery, Contact; not Privacy). It appears only after the page's first inline Express Interest button (or hero) has scrolled out of view, and hides while the `#interest` form is in view. Use an IntersectionObserver; no timers. Label stays.
- Body scroll lock while the mobile menu is open (`overflow:hidden` on html/body toggled with `.is-open`), restored on close and on navigate.
- Express Interest link count: Home = hero + final section (2). ProSeries = hero + directly under the tracks/prices + final (3). Remove the rest. The sticky bar handles the in-between.

### 2c. ProSeries mobile length (target ≤ 12,000px at 390; measure with shoot.js page heights)
- New order inside #page-proseries: hero → tracks + prices → the interest form (#interest) → cast → the rest (episodes, FAQ, recaps, etc.) → final CTA. The form moves; its id and JS hooks must keep working (live.js still passes).
- Cast: replace the tall per-dancer cards with a compact roster: a 3-column grid at 390 (4-6 at desktop) of name + track badge chips, one line each, no photos. Photos, if any, stay only in the gallery. Every name and track that exists in the markup today stays; nothing is added.
- Track badge "Pro": ivory-on-terracotta fails contrast — use forest text on the badge's colour, or terra-dark background; all three badges must pass 4.5:1 (measure with computed colours).
- Home entry-card eyebrows: terracotta on forest at 10-11px → terra-light #d4775f and ≥ 12px.
- scroll-margin-top on anchor targets = the real sticky chrome height at each breakpoint (measure it; the current 90px is wrong on /proseries/).

### 2d. Teachers page
- Hero: drop the full-bleed terracotta panel. Background forest; the photo keeps its half; eyebrow "Director · Rotation Faculty" in terra-light; H1 "Teachers" ivory; sub-line ivory at 90% opacity. All text ≥ 4.5:1.
- Replace the auto-carousel (12 slides, no controls) with a static 2×3 photo grid using at most six of the same images, `loading="lazy"`, width/height set, no JS. Remove the carousel JS in js/main.js:1137-1159 and its CSS.
- Bottom of the page: one pink primary "Express Interest" (to #interest on ProSeries → `/proseries/#interest`) and one text link "Contact" — the page must hand off to the funnel.
- Director credentials: Teachers keeps the full block. Home keeps the Track Record numbers only (delete the creds list at index.html:530-550 if it duplicates Teachers). ProSeries :1607 becomes one sentence + link "Meet the teachers →".

### 2e. Collective, Contact, Gallery
- Collective → Contact: exactly one CTA at the end of the page, label "Join the Collective →", href `/contact/?reason=adult`; remove the other two Contact links (:673, :730, :753 — keep the best-placed one, re-label).
- Router: preserve the query string on path navigation, and `applyContactReason` reads `reason` from `location.search` OR the hash. `/contact/?reason=adult` must pre-select the Adult Company toggle on load (test it).
- Contact reason toggle must do visible work: it swaps the heading + one helper line above the form ("Tell us about your dancer." vs "Tell us about you and your training." vs "What's on your mind?") and sets a hidden `reason` field that is included in the submission payload. Verify with live.js's stubbed insert that the payload carries `reason`.
- Gallery: add `data-lightbox` to the hero image (index.html:2001); scope lightbox prev/next to the images inside the CURRENT visible page section only; lightbox `<img>` gets the same srcset as the thumbnail. Replace the duplicated firebird photo on Gallery (:2064 or :2001) with a different existing image from images/ that already has a srcset family — pick one not used elsewhere; never add new files. Bottom of Gallery: add a short closing block with one pink "Express Interest" (to `/proseries/#interest`) so the page does not dead-end on Instagram.
- Remove the duplicated recaps email form from Home (:483-493); ProSeries keeps it.

### 2f. Small a11y
- All three form buttons ≥ 44px tall at 390. Skip link present on every route (it is in the shell). `prefers-reduced-motion` already gates the hero loop — leave it.

Verification (Phase 2):
- `node scripts/build-routes.mjs && node scripts/build-routes.mjs --check && node scripts/build-faq-jsonld.mjs --check`
- `node scripts/qa/routes.js` and `node scripts/qa/live.js` pass (read them; live.js stubs the insert — it must show the `reason` field in the contact payload).
- `node scripts/qa/shoot.js <scratch>/shots --tiles` clean; record every route's height at 390; ProSeries ≤ 12,000.
- A Puppeteer check script (`<scratch>/checks.js`) that prints: contrast of the nav CTA, Teachers hero eyebrow/sub, "Pro" badge, home entry eyebrows (all ≥ 4.5); count of Express Interest links on Home (2) and ProSeries (3); `#mob-cta` visible after scrolling 1500px on every non-privacy route at 390 and hidden while #interest is in view; body overflow hidden when the menu is open; `/contact/?reason=adult` pre-selects; Gallery lightbox next from the first gallery image stays within gallery images; grep for "New York", "NYC", "nine years, I ran", "16+", "DWD ProSeries", "DWD Collective", "555-", "fullout", "dwdcon", "s1-cta-sky" in index.html all → 0 (except s1-cta-sky may survive inside .ps-hero styles).
- Screenshots (exact names in `<scratch>/shots/`): `01-home-390.png`, `02-home-390-scrolled.png` (sticky bar visible), `03-proseries-390-tracks.png`, `04-proseries-390-form.png`, `05-teachers-1280.png`, `06-teachers-390.png`, `07-menu-open-390.png`, `08-contact-adult-390.png`, `09-gallery-390-bottom.png`, `10-collective-1280-bottom.png`.
Checks JSON:
```json
{"routes_rebuilt_and_check_pass": false, "faq_jsonld_in_sync": false, "shoot_clean_all_routes": false, "proseries_390_height_le_12000": false, "contrast_all_ge_4_5": false, "express_interest_counts_2_and_3": false, "mob_cta_on_all_six_routes": false, "menu_scroll_lock": false, "contact_reason_deeplink_and_payload": false, "lightbox_scoped": false, "forbidden_strings_zero": false, "live_js_pass": false, "screenshots_reviewed_3_iterations": false}
```

---

## Phase 3 — performance (builder: fix-perf; runs AFTER Phase 2 reports done; tree will be dirty — build on it)
Files you own: css/site.css (and a new css/site.min.css if you go that way), index.html `<head>` + script block only, scripts/build-routes.mjs (only for per-route script scoping), video/ (new phone-sized hero loop only), scripts/encode-hero-loop.sh.
Decisions:
1. CSS: run the repo's own `scripts/qa/prune-css.mjs` / `prune-important.mjs` flow (read them and scripts/qa/README.md). Dead-CSS removal must keep every class that js/main.js toggles (grep `classList` and `className` for the safelist). Then minify to css/site.min.css and point the shell at it; keep site.css as the source. Target: served stylesheet ≤ 120KB. Verify with `node scripts/qa/shoot.js` clean plus `node scripts/qa/pixdiff.js` (read it) against pre-prune screenshots for every route at 390 and 1280 — zero visual diffs beyond anti-aliasing.
2. Scripts: /privacy/ loads no Supabase bundle and no app scripts beyond main.js (routing needs it). Supabase loads `defer` and only on routes with forms (home, proseries, collective, contact) — implement in build-routes.mjs as a per-route flag, not by hand-editing shells.
3. Hero loop: produce `video/hero-loop-480.webm` (and .mp4) ≤ 250KB via scripts/encode-hero-loop.sh with ffmpeg (PC compute is fine); `<source media="(max-width: 767px)">` first. Reduced-motion behaviour unchanged.
4. Confirm the Teachers idle image fetch is gone (Phase 2 removed the carousel) — measure idle bytes at 390 for 15s.
Verification: cold-load bytes per route at 390 before/after (Puppeteer request log) written to `<scratch>/perf.json`; home ≤ 1.8MB. shoot.js clean. pixdiff zero.
Checks JSON:
```json
{"css_served_le_120kb": false, "pixdiff_zero_all_routes": false, "privacy_no_supabase": false, "hero_480_le_250kb_and_used_at_390": false, "home_cold_le_1_8mb": false, "shoot_clean": false}
```

---

## Phase 2-followup — Fable's review notes on Phase 2 (builder: fix-main-2; runs on the dirty tree, build on it)
Files you own: index.html, css/site.css, js/main.js, scripts/build-routes.mjs (buildSitemap only), the six shells + sitemap.xml via build-routes only.
Phase 2 shipped; these are corrections from my look at the renders. Same rules as section 0.
1. ProSeries length: collapse the 7-scene story behind a native `<details>` disclosure on phones only (≤ 767px): summary line "Read the Season One story" in the section's eyebrow style, first scene visible, the rest inside. Desktop unchanged. Re-measure: target ≤ 12,500px at 390.
2. Cast roster chips: three full-colour blocks (pink / seafoam / terracotta) on one screen is three accents doing work. Chips become forest-light (#1a3d2e) background, ivory text, no fill colour. Track colour lives ONLY in the "5 of 10 chairs filled" badge next to each track label. Keep the grid.
3. ProSeries chapter rail at 390: the first item "TRACKS" is clipped off the left edge. Give the scrolling rail leading padding so the first item is fully visible, and a right-edge fade so it reads as scrollable.
4. Sticky bar `#mob-cta` must hide while the phone menu is open (two pink Express Interest buttons are in the same viewport in 07-menu-open-390.png).
5. scripts/build-routes.mjs `buildSitemap()`: remove the /fullout and /dwdcon entries and add /amuse-in-space.html (lastmod 2026-09-04); home URL with trailing slash. Rebuild; sitemap.xml must then match Phase 1's 8-entry list exactly and survive `node scripts/build-routes.mjs`.
6. Delete the now-orphaned CSS for .ps-cast-* photo cards, .merch/#page-shop, and the Teachers carousel from css/site.css (grep js/main.js first for any class still toggled).
Verification: build-routes + --check, faq --check, routes.js, live.js, shoot.js --tiles clean; screenshots `<scratch>/shots/01-proseries-390-story-closed.png`, `02-proseries-390-cast.png`, `03-proseries-390-rail.png`, `04-menu-open-390.png`; print ProSeries 390 height.
Checks JSON: {"story_disclosure_phone_only": false, "proseries_390_le_12500": false, "chips_neutral_track_colour_in_badge_only": false, "rail_first_item_visible": false, "mob_cta_hidden_when_menu_open": false, "sitemap_from_build_matches_8": false, "orphan_css_removed": false, "all_qa_scripts_pass": false}

### Phase 3 addendum (Fable, after Phase 2 review)
- Also `git rm` css/dwdcon.css and css/fullout.css (nothing loads them since Phase 1).
- Phase 2 left `#page-proseries *, .amuse-feature * { padding: 0 }` (css/site.css ~4600) in place; leave it too — out of scope, do not "fix" it.
- Take the "before" screenshots for pixdiff from the CURRENT dirty tree (Phase 1 + 2 + 2-followup applied), not from main.
