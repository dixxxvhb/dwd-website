# Front door: the website leads with this week — brief for builder-opus
Date: 2026-09-14 · Repo: `~/Code/dwd-website` · Branch: `front-door` off main (create it; never push) · Author: Fable

Routing line: **Source: Krehel craft (spacing scale, one hairline weight, 0.96 press) + the site's own Warm Editorial world; mode Persuade; why: 78% of visits land on the home page and leave at a median 3.5 seconds, so the page must say what a parent can do this week before it says who we are.**

## 1. Decision (what and why)
The home page becomes a front door with LIVE "this week" content and one primary action: drop in. The manifesto stays, demoted below the door. Site-wide, drop-ins move to the front of the nav and the phone sticky bar. The ProSeries page gets a "try a class first" door and its two stale facts fixed. Nothing else is restyled.

Evidence (30 days of `site_analytics`): 193 visitors, 53% phone, sources = direct, Google (26), Instagram (15). Home = 459 of 586 views, median exit 3.5s. Home CTA clicks: See Season One 8, ProSeries card 6, Express Interest 3. `/schedule/` has 1 recorded referral. The cheapest conversion on the site (a $20 online drop-in) is invisible from the front door.

Rejected: a full redesign (the look is fine and recent, the problem is order and content); a live Instagram embed (needs an API token and a maintenance habit; the freshest content we own is already in the database: the schedule, the Collective's next class, the Season One recaps); a "latest post" JSON Dixon would have to hand-edit.

## 2. Files you own
- `index.html` (the one shell; every `/<dir>/index.html` is generated from it)
- `js/main.js` (nav CTA + mobile sticky bar behaviour only)
- `js/now.js` (NEW: the live "this week" block, reads `public_site_schedule` + `public_site_dwdc_events`, same supabase client pattern as `js/dwdc-next.js`)
- `css/site.css` + rebuilt `css/site.min.css` (find the existing minify command in package.json or scripts)
- `sw.js` (bump the cache name one version)
- `scripts/build-routes.mjs` output: run `node scripts/build-routes.mjs` after every index.html change and commit the generated shells
Touch nothing else. `js/schedule.js`, `js/season.js`, `js/dwdc-next.js`, `js/episodes.js` are read-only for you.

## 3. Hard rules
- Never commit to main, never push, never deploy. Commit on `front-door` with explicit paths.
- Do your own recon first (read `DESIGN.md`, the home section of `index.html` lines ~367 to 675, `js/dwdc-next.js` for the feed pattern, `js/schedule.js` lines 1 to 60 for the RPC call shape, `css/site.css` for the existing `.entry`, `.btn`, `.mob-cta`, `.s1-*` classes). Write your exact-edit plan to `<scratchpad>/plan.md`, then build.
- Copy is in §4, verbatim. Anything missing gets `TODO(fable)`. No em dashes in visible text. No emojis. No new fonts, no new colors, brand tokens only. No new photos of dancers (photo release gate): reuse images already in `images/`.
- design-taste.md applies: subtractive; one focal point per screen; max two font sizes and two weights per component; no card inside a card; hierarchy by size and space, not color; one filled button per view.
- Progressive enhancement like `season.js`: the markup ships a sensible static fallback so a JS or network failure leaves a correct page, never an empty box.
- Phone first: build and judge at 390 wide before 1280.

## 4. Intent

### 4.1 Nav (desktop + mobile drawer)
Order becomes: **Home · Schedule · ProSeries · Collective · Teachers · Gallery · Contact**. The nav CTA (`.nav-cta-launch`, today "Express Interest") becomes `This week's classes →` linking to `/schedule/` with `data-track="nav-this-week"`, always visible (drop the `data-reveal-after` gate on this element only). Express Interest keeps living inside ProSeries and the home "Apply" line; it is no longer the site-wide button.

### 4.2 Home hero
Keep the identity block (wordmark, kicker, the Tamara Mark, the existing photo treatment). Change the CTA pair: primary `Drop in this week →` (filled, `/schedule/`, `data-track="home-hero-dropin"`), secondary text link `Apply for a chair →` (`#interest`, `data-track="home-hero-apply"`). The existing "See Season One" secondary is removed from the hero (the Season One tile below carries it).

### 4.3 NEW block directly under the hero: THIS WEEK (`#now`, `js/now.js`)
Kicker `THIS WEEK`. Three rows in the site's existing ledger/row grammar (look at how `.entry` rows or the schedule rows are built; borrow, do not invent a card style). Each row = a left label (Outfit, small caps kicker style), a Cormorant title line, one Outfit meta line, and a right-aligned text link. No boxes around rows; hairlines between.

Row 1, DROP IN (live from `public_site_schedule(today, today+13)`, rows where `drop_in_open`): title = `<Class name> · <Weekday> <Mon D> · <h:mm>` for the NEXT open occurrence; meta = `<price> a class · <bulk> each for 4+ · <spots_left> spots left` (omit the pieces that are null); link `Book it →` to `/schedule/`. If several classes are open in the window, the title names the next one and the meta ends with `+ <n> more open dates`. Static fallback text in the markup (used when the feed fails or is empty): title `Prep Technique · Tuesdays · 4:45`, meta `$20 a class, $70 for a month of Tuesdays`, link `See the schedule →`.

Row 2, PROSERIES (from `window.DWD_SEASON`, same numbers as everywhere): title `Season One is underway`, meta `<n> chairs open · Prep <a> · Elite <b> · Pro <c>` (open = max minus filled), link `Apply →` to `#interest`. If every chair is filled the meta reads `Every chair is taken · join the wait list` and the link reads `Wait list →`.

Row 3, COLLECTIVE (live from `public_site_dwdc_events`, the same next-row logic `dwdc-next.js` uses; reuse its query, do not duplicate the render): title = the event title, meta = `<Weekday> <Mon D> · <h:mm> · $15 at the door`, link `Details →` to `/collective/`. Fallback: title `Adult modern company`, meta `18 and up · no audition · $15 at the door`, link `About the Collective →`.

Analytics: each link carries `data-track` (`now-dropin`, `now-apply`, `now-collective`).

### 4.4 Home, below THIS WEEK (deletion pass)
Keep, in this order: the two program entries (ProSeries / Collective), the Season One tile (`#s1-home-teaser`, which now carries the only "See Season One" link), the choreography reel, the director byline. **Remove** `#season-one-cta` ("Spots remain / Auditions have wrapped" panel: duplicated by THIS WEEK row 2) and fold the Track Record stats (100+ pieces, years, 9 to 23) into the director byline as one meta line so the numbers stay but the standalone stat band goes. The "Already a company" story block stays only if it survives the squint test next to the Season One tile; if both say "Season One", keep the tile, cut the story block, and note it in the report.

### 4.5 Phone sticky bar (`#mob-cta`)
Label `This week · Prep Technique Tue 4:45` (static; if `js/now.js` finds an open drop-in it rewrites the label to `This week · <Class> <Weekday> <h:mm>`), button `Drop in →` to `/schedule/`, `data-track="mobile-sticky-dropin"`. Shown on home, proseries, teachers, gallery. On `/collective/` the label is `Next class` + the dwdC row when it exists, button `Details →` to `#dwdc-next`. On `/schedule/` and `/contact/` the bar is hidden (the page IS the action). Keep the existing show/hide-on-scroll behaviour.

### 4.6 ProSeries page
- Hero kicker/word swap: anywhere the hero says `Audition-based` it now says `By application`. The "NOW CASTING" three steps stay.
- Under the hero, before the tracks, a short "door" block, same row grammar as THIS WEEK, one row: kicker `TRY A CLASS FIRST`, title `Prep Technique · Tuesdays 4:45`, meta `Open to dancers ages 5 to 9 who are not enrolled. $20 a class, $70 for the month. Then apply if it fits.`, link `Drop in →` to `/schedule/` (`data-track="ps-try-first"`).
- The chairs line under `THIRTEEN CHAIRS REMAIN`: the breakdown reads `Prep 5 of 10 filled · Elite 6 of 10 filled · Pro 6 of 10 filled` so it can no longer be read as "remaining". Render from `DWD_SEASON` like the rest.
- Home "Spots Remain" copy `Auditions have wrapped` (if any copy of it survives elsewhere) becomes `Placement classes run all season`.

### 4.7 Schedule page
Dek becomes: `Every ProSeries class on the floor, Monday to Thursday. Rows with a price are open for drop-ins: pick your dates, pay online, show up. Four or more dates in one order and each one costs less.` Nothing else changes on this page.

### 4.8 Meta
`<title>` on the schedule shell: `Drop-in dance classes this week | Dance With Dixon, Orlando`. Meta description there: `Book a drop-in class at ProSeries in Orlando. $20 a class, less when you book four or more dates. Ages 5 to 19, pay online, show up, dance.` Home `<title>` stays. Add `Schedule` to the JSON-LD `hasPart`/sitelinks only if the existing block already lists pages.

### 4.9 Copy locked (verbatim; no other new sentences)
`This week's classes →` · `Drop in this week →` · `Apply for a chair →` · `THIS WEEK` · `Book it →` · `See the schedule →` · `Season One is underway` · `chairs open` · `Every chair is taken · join the wait list` · `Wait list →` · `Apply →` · `$15 at the door` · `Details →` · `About the Collective →` · `Adult modern company` · `18 and up · no audition · $15 at the door` · `Drop in →` · `TRY A CLASS FIRST` · `By application` · `Placement classes run all season` · the §4.6 meta line · the §4.7 dek · the §4.8 title and description.

## 5. Verification
- Run: `node scripts/build-routes.mjs --check` passes after you regenerate; the CSS minify step; a static server for the pages (the live Supabase feeds work from localhost, `USE_STUB` stays false).
- Iterate the home page at 390 against `DESIGN.md` and design-taste.md at least three times before the checks; run the squint test on the home page and say in the report what you deleted on each pass.
- Screenshots (`<scratchpad>/shots/front-door/`, exactly): `01-home-hero-now-390.png` (hero + THIS WEEK in one frame if it fits, else two frames 01a/01b), `02-home-below-390.png`, `03-home-1280-top.png`, `04-nav-drawer-390.png`, `05-sticky-bar-390.png`, `06-proseries-try-first-390.png`, `07-proseries-chairs-390.png`, `08-schedule-dek-390.png`, `09-now-fallback-390.png` (block with the network blocked or the feed mocked empty).
- Checks JSON:
```json
{ "routes_check_passes": false, "no_horizontal_scroll_390": false, "now_block_live_rows_render": false, "now_block_fallback_renders": false, "nav_order_and_cta": false, "sticky_bar_per_page_rules": false, "chairs_copy_reads_filled": false, "no_em_dash_in_visible_copy": false, "copy_verbatim": false, "sw_cache_bumped": false }
```

## 6. Report format (fixed)
```
STATUS: done | partial | blocked
FILES TOUCHED:
WHAT CHANGED: (three to six lines)
DELETION PASSES: (what went on each of the three passes)
CHECKS: (the JSON, filled)
SCREENSHOTS: (the named paths)
VERIFIED vs BELIEVED:
OPEN / BLOCKED:
```

---

# Addendum B (2026-09-14, Dixon: "make DROP IN bigger, more exciting, animated") — brief for builder-opus
Branch: `front-door-2` off main. Routing: **Krehel craft for the motion (one authored moment, 200 to 500 ms, 0.96 press) + Bebas numerals as the visual device; mode Persuade; why: the drop-in is the push, so it becomes the single focal point on every page it appears on, and nothing else gets louder.**

## B1. Decision
THIS WEEK row 1 is promoted out of the ledger into a **DROP IN feature panel** (`#dropin-feature`), placed directly under the home hero, above the remaining THIS WEEK ledger (which keeps rows 2 and 3 only). The same panel, in a compact modifier, replaces the ProSeries "TRY A CLASS FIRST" row and heads the schedule page above the week switcher. The hero's filled button stays but grows. Rejected: pink backgrounds, badges, multiple pulsing elements, confetti, a countdown clock (a clock creates false urgency for a weekly class), any second animated element on the same screen.

## B2. Files you own
`index.html`, `js/now.js` (the panel is rendered from the same feed and fallback), `js/main.js` (sticky bar copy only), `css/site.css` + rebuilt `site.min.css`, `sw.js` (bump to v43), regenerated route shells. Nothing else.

## B3. The panel (`.dropin-feature`)
Full-bleed band in `forest-light` (`#1a3d2e`) on the forest page, 24px inner gutter, max-width matching the site's content column. Layout at 390 (stacked, in this order):
1. Kicker `DROP IN · THIS WEEK` in the existing kicker style, pink.
2. **The price, Bebas Neue, 120px at 390, 160px at 1280**, ivory: `$20` (from the feed's `drop_in_fee_cents`; fallback `$20`). Directly to its right at desktop, below it at phone, two Outfit lines at 18px: `a class` and `$70 for a month of Tuesdays` (computed: bulk price × 4 when `drop_in_bulk_fee_cents` is present, else the fallback line). Max two font sizes besides the numeral.
3. Cormorant 32px: `Prep Technique · Tuesday Sep 22 · 4:45` (feed; fallback `Prep Technique · Tuesdays · 4:45`).
4. Outfit 16px muted: `Ages 5 to 9 · Garage at Exchange Dance · 6 spots left` (age band + room + spots from the feed; omit nulls).
5. One filled pink button, full width at 390, `Book Tuesday →` (the weekday from the feed; fallback `Book a class →`), href `/schedule/`, `data-track="dropin-feature-book"`. Height 56px, Outfit 600 18px, letter-spacing as the existing `.btn`.
6. Under the button, one muted line: `Pay online, show up, dance. Move it to another week if you can't make it.`
Desktop: two columns, numeral + lines left, class/meta/button right, vertically centered. No border, no card inside, no icon.

**The visual device**: behind the numeral a single soft radial pink wash (`#FF7AA2` at 14% alpha, 480px radius, blurred), offset up-left of the price. This is the ONE ambient layer the Persuade ruling allows.

## B4. Motion (the only things that move on any page)
- On scroll-reveal of the panel (use the site's existing reveal mechanism): the numeral rises 24px and fades in over 420ms with the site's ease; the class line and button follow at +80ms and +160ms. Runs once.
- The pink wash drifts 6% on a 9s ease-in-out loop (ambient, texture tier). Nothing else loops.
- Button: hover lifts the wash brightness, active scales 0.96 (Krehel). No pulse, no glow animation on the button.
- `@media (prefers-reduced-motion: reduce)`: reveal becomes an instant fade, the wash holds still.
- Hero and the THIS WEEK ledger: no new motion. The sticky bar keeps its existing behaviour.

## B5. Other drop-in surfaces
- Hero primary `Drop in this week →`: 56px tall, full width at 390, Outfit 600 18px. Secondary stays a text link.
- Sticky bar button reads `Drop in · $20 →` (price from the feed, fallback $20). Bar height 64px, button 44px, pink filled.
- ProSeries: replace the `TRY A CLASS FIRST` row with the panel in `.dropin-feature--compact` (numeral 88px, one column, kicker `TRY A CLASS FIRST · DROP IN`, the §4.6 meta sentence becomes the muted line under the button). Keep the 24px spacing rule and the ID-weight padding fix.
- Schedule page: the panel in compact form sits between the dek and the week switcher, kicker `DROP IN`, button `Pick your dates →` which scrolls to the list (`#sched-list` or the list's id) instead of linking away. The schedule ROWS that are open: price in Bebas 28px ivory, the `Add` control becomes pink filled 44px (closed rows unchanged, muted). Only one panel per page.
- Nav CTA stays outlined. Max one filled pink element per screen besides the panel's own button; if the hero button and the panel button can both be in one 1280 frame, that is accepted (they are the same action) but nothing else may be filled.

## B6. Copy locked
`DROP IN · THIS WEEK` · `a class` · `$70 for a month of Tuesdays` · `Book Tuesday →` / `Book a class →` · `Pay online, show up, dance. Move it to another week if you can't make it.` · `Drop in · $20 →` · `TRY A CLASS FIRST · DROP IN` · `DROP IN` · `Pick your dates →` · `spots left`.

## B7. Verification
Iterate the panel at 390 at least three times; run the squint test (the numeral must be the first thing the eye lands on, the button second, nothing else competes). Screenshots `<scratchpad>/shots/front-door-2/`: `01-home-panel-390.png`, `02-home-panel-1280.png`, `03-home-panel-reveal-midframe-390.png` (captured mid-animation, the ugliest frame), `04-sticky-390.png`, `05-proseries-compact-390.png`, `06-schedule-panel-390.png`, `07-schedule-open-row-390.png`, `08-reduced-motion-390.png`, `09-fallback-390.png`. Checks JSON: `{ "routes_check_passes", "css_check_passes", "no_horizontal_scroll_390", "one_ambient_layer_only", "reduced_motion_respected", "panel_live_and_fallback", "sticky_price_from_feed", "schedule_button_scrolls_not_navigates", "copy_verbatim", "sw_v43" }`. Report in the §6 format, commit on `front-door-2` with explicit paths, never push.
