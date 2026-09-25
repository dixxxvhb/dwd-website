# /schedule/ becomes the drop-in page (2026-09-24)

Owner of the decision: Martha (Claude Code), from the 09-24 site review. Dixon looks at the screenshots before this merges (public, parent-facing surface).

## Why (the analytics)
- A paid Instagram ad (utm_medium=paid, campaign 52581481047091) ran Sept 16-21 and sent ~1,020 visitors to `/schedule`, 100% phones. Median time on page 3.1s. 0.5% opened a second page. 1% tapped anything. Zero drop-in bookings.
- ~60% of them landed Friday to Sunday, when the list said "No classes this week." (fixed on main d00901f: the first load now skips to the next week with classes).
- Even with that fixed, a cold visitor from an ad that said "NO AUDITION. JUST DROP IN." lands on a page headed "PROSERIES / This week at ProSeries / Every ProSeries class on the floor... Rows with a price are open for drop-ins". Next week (Sep 28) has 16 rows and ONE is bookable. The drop-in panel at the top lists all five classes but none of its rows can be tapped; its button only scrolls down to the grid.
- The SAME ROOM drop-in campaign runs Sept 24 to Oct 8 and first October classes are Tue Oct 6. More ad and story traffic is about to hit this exact page.

## The decision
`/schedule/` leads with the five weekly drop-in classes, each with its next bookable dates as tap targets. The full ProSeries week grid stays, behind one toggle. Two taps from landing to a filled cart: tap a date, tap Checkout.

## Files this build owns
`js/schedule.js`, the `#page-schedule` section of `index.html` (plus the generated `schedule/index.html` via `node scripts/build-routes.mjs`, never by hand), the schedule rules in `css/site.css` (then `node scripts/build-css.mjs`), and the DROP IN panel row markup/behaviour in `js/now.js` (rows become links, see 6). Nothing else. Do not touch `js/analytics.js` (Martha is editing it on main).

## Intent, top to bottom (390px is the real render)
1. **Ground.** The page sits on forest (`#0c1f17` family, the site's dark ground), not ivory. Dixon's newest rule (2026-09-23, loud): no cream/ivory by default. Ivory stays a deliberate accent at most.
2. **Header, message-matched to the ad and poster.** Kicker: `DROP IN · NO AUDITION` (the site's small-caps kicker style, pink). H1 (Cormorant): `No audition. Just drop in.` Dek (Outfit, max two lines at 390): `Five classes a week at Exchange Dance in Orlando. Pick a date, pay online, show up.` No "ProSeries", "rows", "open for drop-ins" or "Monday to Thursday" in the header.
3. **The five classes (the focal point).** One block per weekly drop-in slot, in weekday/time order. Each block:
   - day + time (`TUE 4:45`, Outfit bold small caps) and the price in Bebas on the right (`$20`, `$25`);
   - the class name in Cormorant, large;
   - one muted line: `Prep · ages 5 to 9` (track + public age label from the feed) and the length (`1 hr`, `1 hr 30`);
   - a row of date chips: the next 4 bookable dates (`Sep 29`, `Oct 6`, `Oct 13`, `Oct 20`) and a `More dates` chip that reveals the rest in the window. Chip states: available (outline), added (Family Pink fill + check, tap again to remove), full (`Full`, disabled, muted), 1 to 3 spots left (a small `2 left` under the chip). A class that is not bookable yet just starts its chips at its first open date and shows a small `Starts Oct 6` tag next to the time.
   - Chips are 44px tall minimum and wrap; no horizontal scrollers.
   - Blocks are separated by space and a hairline, not by boxes inside boxes (design-taste: nesting depth 2 max).
4. **Cart bar + checkout.** The existing sticky cart bar and checkout form, unchanged in behaviour (localStorage cart format, bulk pricing note, waiver, Stripe hand-off, thank-you, return handling, pruning). The cart bar's Checkout is the page's one primary (Family Pink). Chips are secondary.
5. **What to know** (three short lines under the classes, muted): where (`Exchange Dance · 7409 Chancery Lane, Orlando`), what to wear (reuse the attire copy that already exists on the thank-you screen), and `Can't make it? Move it to another week.`
6. **Deep links.** `/schedule/?class=<slug>` scrolls to that class's block, marks it (a Family Pink left rule, nothing louder) and opens its More dates. Slugs from the public name: `technique-flexibility`, `ballet`, `advanced-technique-tricks`, `contemporary`, `jazz` (derive, don't hard-code; unknown slug = normal page). In `js/now.js` every row of the DROP IN panel on Home and ProSeries becomes a link to its `?class=` URL (whole row tappable, same look). The ad and story link stickers will use these.
7. **The full ProSeries week.** Below the classes, one quiet toggle: `See the full ProSeries week`. Opening it shows today's pager + grid exactly as they work now (including d00901f's skip-empty-week first load and the October jump line). Collapsed by default. Opens automatically when the URL has `#sched-list` or `?week=`.
8. **Nav CTA copy.** The desktop nav button `THIS WEEK'S CLASSES →` becomes `DROP IN →` (it lands on this page, and on Thursday night "this week" was a lie). Keep its data-track value.
9. **Meta.** Update the /schedule/ title + description the way the other routes carry theirs (build-routes), e.g. title `Drop-in dance classes in Orlando | Dance With Dixon`, description naming ages, price range, no audition.

## Data
- `public_site_schedule(p_from, p_to)` refuses `p_from < yesterday` and windows over 21 days. Fetch two windows (today to today+20, today+21 to today+41) in parallel and merge. Keep the stale-response guard pattern already in schedule.js.
- A weekly slot = same `class_id` + weekday + `start_time`. Chips come from rows with `drop_in_open`. Use the public name from open rows (a per-date swap title can differ on a closed date, e.g. the Tue 6:00 slot is "Adv Ballet" on Sep 29 and "Advanced Technique & Tricks" from Oct 6).
- Price per slot from `drop_in_fee_cents`; bulk threshold/fee from the feed (`drop_in_bulk_min`, `drop_in_bulk_fee_cents`), as schedule.js already does.
- Pruning, "started classes leave the cart", NY-time math: reuse what exists; do not write a second date library.
- Empty/failed feed: the static markup must still read as a finished page (the site's progressive-enhancement contract, see now.js header). Ship a static fallback list of the five classes with a `Book` link to the full week, replaced when the feed answers.

## Hard rules
- Branch `dropin-finder` in a worktree at `C:\Users\bowle\Code\dwd-website-finder`. **Never push `main`** (push to main = live deploy). Push the branch when done.
- Edit `index.html`, run `node scripts/build-routes.mjs` then `--check`; edit `css/site.css`, run `node scripts/build-css.mjs` then `--check`. Never hand-edit a generated shell.
- QA with Puppeteer (`require('C:/Users/bowle/Code/DWDC-Instagram-Posts/node_modules/puppeteer')`, `channel: 'chrome'`) against a static server your script starts and stops itself. Block `/sw.js`. Intercept every non-read Supabase call and anything to `drop-in-checkout` with a fake response (CORS headers included; let OPTIONS preflights and the `public_*` RPC reads through). Nothing reaches the live DB or Stripe.
- Voice: plain, warm, direct. No em dashes. No emoji. Gold only in the Tamara Mark. Casing `dwdPS`, `dwdC`, `dwdPROSERIES`. Say "apply", never "sign up", for ProSeries enrollment (drop-ins are "book").
- Design: read `C:\Users\bowle\.claude\design-taste.md` first. One focal point (the class list), one primary button per view, max 2 sizes + 2 weights per component, spacing from 4/8/12/16/24/32/48, labels above fields.

## Verification (attach every file)
Screenshots at 390x844 and 1280x900, saved to `C:\Users\bowle\AppData\Local\Temp\claude\C--Users-bowle\ce052655-b9a8-415d-bd4d-292a4090a7e5\scratchpad\finder\`:
- `01-land-390.png` / `01-land-1280.png`: first screen on landing (viewport only).
- `02-full-390.png`: full page at 390.
- `03-two-chips-390.png`: after tapping two dates (cart bar visible).
- `04-deeplink-contemporary-390.png`: `/schedule/?class=contemporary` first screen.
- `05-full-week-open-390.png`: toggle opened.
- `06-checkout-390.png`: checkout form reached from the chips.
- `07-home-dropin-row-link-390.png`: Home DROP IN panel, rows as links.
Iterate on the look at least three times against design-taste.md before reporting. Then `checks.json` in the same folder: `{ "build_routes_check": bool, "build_css_check": bool, "console_errors": [...], "failed_requests": [...], "taps_landing_to_checkout_form": n, "deeplink_ok": bool, "full_week_toggle_ok": bool, "cart_format_unchanged": bool, "no_live_writes": bool }`.

## Report format
Five lines max of what changed, the branch + commit hash, the paths of the screenshots and checks.json, and anything you decided that this brief did not cover (one line each).
