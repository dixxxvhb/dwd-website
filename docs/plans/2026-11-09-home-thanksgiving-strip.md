# Home Thanksgiving strip — brief for builder-opus
Date: 2026-11-09 · Repo: `C:\Users\bowle\Code\dwd-website` · Branch: `claude/home-thanksgiving-strip` (already checked out) · Author: lead session (Fable)

## 1. Decision (what and why)
The Thanksgiving Week masterclasses (Nov 24, 25 and 27, 2026) are the nearest thing a family can book, but Home never mentions them; they only live at the top of `/schedule/`. Add one slim strip to Home, directly under the hero and above the DROP IN feature panel, that names the week and links to `/schedule/`. It removes itself after the last class.

Rejected: repeating the menu (classes, teachers, times) on Home. The menu is on a staged reveal (`data-tg-reveal` in `js/schedule.js`), so Home must not name any class, teacher or time. Also rejected: replacing the hero button or the "Up next" card. This is an addition, nothing else on Home changes.

## 2. Files you own
- `index.html` — the strip's markup inside `#page-home`, between the end of the hero block and `<section class="dropin-feature" id="dropin-feature">`.
- `css/site.css` — the strip's styles, placed next to the existing `.tg` block (search `.tg {`).
- `js/now.js` — the small expiry rule that removes the strip.
- Generated, never hand-edited: `css/site.min.css` (run `node scripts/build-css.mjs`) and the route shells + `sitemap.xml` (run `node scripts/build-routes.mjs`).
Touch nothing else. If the change needs another file, STOP and report it.

## 3. Hard rules
- Never rename or move files. Never commit or push. The lead commits.
- The copy in section 4 is final and exact. Do not reword, add or drop a word. Anything you think is missing gets a `TODO(lead)` and a line in your report.
- Read `.claude/CLAUDE.md` and `scripts/qa/README.md` in the repo first. Do your own recon, write your edit plan to `C:\Users\bowle\AppData\Local\Temp\claude\2b4aa06fe7ca1652\693abe43-b35a-4d72-a183-be70c12c73fb\scratchpad\strip\plan.md`, then build.
- No emojis. No gold anywhere (gold is reserved for the Tamara Mark). No new fonts, no new images, no new dependencies. Use the tokens the `.tg` card already defines (`--tg-paper`, `--tg-ink`, `--tg-soft`, `--tg-terra`) so the strip reads as the same campaign as the menu.
- No `!important`. Class prefix `tgh-` (Thanksgiving, home) so nothing collides with `.tg-*`.
- Do not start more than one local server, and stop only the server you started (by its PID). Never kill processes by name.
- QA must never write to the live database: load pages only; do not submit forms or checkout.

## 4. Intent
**Markup.** A `<section class="tgh" data-tgh data-tgh-until="2026-11-27T13:00" aria-labelledby="tgh-title">` containing one link-wrapped or link-ended card. Whole strip is one clear tap target to `/schedule/` with `data-ref="home-tg-strip"` and `data-track="home-tg-strip"` (match how other Home links carry `data-ref` / `data-track`). Use a real `<a href="/schedule/">`; the site's router already handles path links.

**Copy (exact):**
- Kicker: `Thanksgiving Week · Nov 24, 25 + 27` (use `&middot;` as the site does)
- Heading (`<h2 id="tgh-title">`): `Three mornings of masterclasses.`
- Line: `Open to dancers from every studio. $15 to $20 a class at Exchange Dance.`
- Link text: `See the menu` followed by the same arrow treatment the hero button uses (`<em>&rarr;</em>` or the local equivalent).

**Look.** A cream paper band on the dark forest page, the same paper and ink as the menu card on `/schedule/`: paper background, ink heading in the display serif (Cormorant, as `.tg-title`), terra-cotta kicker in small tracked caps (as `.tg-sub` / `.tg-ww-lbl`), soft body line in the body font. Thin terra hairline rule top and bottom like the `.tg-ww` borders. It should feel like a card slipped under the hero, not a banner ad: restrained, no animation beyond the site's existing `reveal` class if that fits cleanly, no shadows heavier than the menu card's.
- Desktop (1280): one row inside the same max-width and side gutters as the DROP IN panel below it. Kicker and heading stacked on the left, body line under them, the link on the right, vertically centred. Roughly 120 to 160px tall.
- Phone (390): stacked, left-aligned or centred to match the menu card (centred), link last as a full-width 44px-min tap target. Under about 260px tall. No horizontal overflow at 320.
- Spacing above and below should match the rhythm between the hero and the DROP IN panel today; the strip must not push the hero buttons or crowd the DROP IN numeral.
- Focus state visible on the link (follow the site's existing focus style). Text contrast on paper at least 4.5:1 (ink and `--tg-soft` already pass; check the terra kicker at its size and use `--tg-ink` for it if terra fails at small sizes, then report which you used).

**Expiry.** In `js/now.js`, on load: if the current time in America/New_York is at or past the section's `data-tgh-until`, remove the section from the DOM. Follow the way `js/schedule.js` computes New York time for the `.tg` card (read it; reuse the same technique, do not import across files). If JS fails the strip simply stays, which is the accepted fallback. The strip exists only in `#page-home`; because every route shell contains the whole site, confirm it does not show on other routes (it sits inside the Home page section, so the router hides it).

**Edge cases.** No loading or empty state: the strip is static. Reduced motion: no motion at all.

## 5. Verification
- Run: `node scripts/build-css.mjs`, `node scripts/build-routes.mjs`, `node scripts/check-classes-jsonld.mjs`, then with a local server (`python -m http.server 8790 -d C:/Users/bowle/Code/dwd-website`, stop it by PID when done): `node scripts/qa/routes.js` and `node scripts/qa/shoot.js <scratchpad>/strip/shoot`.
- Measure: strip height at 1280 and 390; link tap height at 390; no overflow at 320; computed colour pairs for kicker, heading and line.
- Expiry test: in Puppeteer, override `Date` (or set `data-tgh-until` to a past stamp before `now.js` runs) and confirm the section is gone; confirm it is present today.
- Screenshots (save to `C:\Users\bowle\AppData\Local\Temp\claude\2b4aa06fe7ca1652\693abe43-b35a-4d72-a183-be70c12c73fb\scratchpad\strip\shots\`, exactly these names, Puppeteer per the QA README, finish reveal animations first): `01-home-1280.png` (viewport from top of page through the DROP IN panel), `02-home-390.png` (same, phone), `03-strip-1280.png` (the strip alone), `04-strip-390.png` (the strip alone), `05-home-390-expired.png`.
- Iterate on the look at least three times against the menu card on `/schedule/` before running the checks.
- Checks JSON:
```json
{
  "build_css_and_routes_ran": false,
  "routes_js_all_clean": false,
  "shoot_js_all_clean": false,
  "copy_matches_brief_exactly": false,
  "no_class_teacher_or_time_named": false,
  "strip_only_on_home": false,
  "expiry_removes_strip": false,
  "no_overflow_at_320": false,
  "contrast_at_least_4_5": false,
  "no_gold_no_emoji_no_important": false,
  "nothing_committed_or_pushed": false
}
```

## 6. Report format (fixed)
```
STATUS: done | partial | blocked
FILES TOUCHED: <paths, one per line>
WHAT CHANGED: <three to six lines, plain words>
CHECKS: <the JSON above, filled in>
SCREENSHOTS: <the named paths>
VERIFIED vs BELIEVED: <one line each>
OPEN / BLOCKED: <anything you could not do, and why>
```
