# Live schedule + drop-in cart on dancewithdixon.com — brief for builder-opus
Date: 2026-09-12 · Repo: C:/Users/bowle/Code/dwd-website · Branch: `schedule-drop-ins` off main · Author: Fable · Status: BRIEF, decisions locked with Dixon 2026-09-12, audited (app spec §11), waits on Phase 1 of the app spec
Master spec (decisions, data model, the RPCs this page calls): `C:/Users/bowle/Code/dwd/docs/plans/2026-09-12-drop-in-web-checkout.md`. Read it first. Do not start the build until that spec's Phase 1 is live on prod (the two RPCs `public_site_schedule` and `drop_in_order_public`, and the edge function `drop-in-checkout`); until then build against a local stub JSON that mirrors the RPC row shape and say so in the report.

## 1. Decision (what and why)
A new `/schedule/` route shows the next three weeks of ProSeries classes from the app (no more hardcoded times), and the classes Dixon has opened for drop-in can be added to a cart and paid through Stripe Checkout. It is its own route with a nav item, not a block inside the ProSeries page, because a cart inside a long marketing page at 390 wide is hostile and the front-of-house plan already wants a live schedule. Rejected: a JSON file in `data/` (the service worker caches it cache-first, so it would go stale) and any client-side pricing (the edge function prices every line server-side; the page only displays).

## 2. Files you own
- `index.html` — new `<section class="page" id="page-schedule" data-arm="ps">`, the nav item `Schedule` between ProSeries and Collective (one shared `<nav aria-label="Primary navigation">` list serves desktop and mobile; there is no second copy), and one link inside each of the three `Weekly Schedule` track blocks: `This week's schedule and drop-ins →`.
- `js/schedule.js` — new: feed fetch, week switcher, cart, checkout POST, thank-you.
- `js/main.js` — only the `ROUTE_PATH` entry `'schedule': '/schedule/'` (lines ~43-51; `PATH_ROUTE` derives from it) and the script gate; nothing else.
- `css/site.css` — a new banner block `/* ── schedule + drop-ins ── */` appended in cascade order; then run `node scripts/build-css.mjs`.
- `scripts/build-routes.mjs` — add the `schedule` route with `supabase: true`, its title and OG description; then run it.
- `scripts/qa/shoot.js` — allowlist `dwd-director.netlify.app/drop-in` and `checkout.stripe.com`.
- `sw.js` — bump `CACHE_NAME`, add `/schedule/` to the precache list.
- `sitemap.xml` — add `/schedule/`.
- `docs/STATUS.md` — one Open line when you finish.
Touch nothing else. Copy (§4) is final unless marked `TODO(fable)`.

## 3. Hard rules
- Never rename or move files. Never commit or push (push is live on this repo). Never invent copy, prices, dates or the Exchange address: prices come from the feed, the address comes from `index.html`'s existing Collective "Where" block (reuse that string), anything else missing gets a `TODO(fable)` marker in the report.
- Do your own recon first: read `js/main.js` routing, `js/dwdc-next.js` (the existing Supabase read pattern and its `window.__dwd_sb` guard), `css/site.css` arm theming at ~6620–6672, `DESIGN.md`, and the ProSeries track panels. Write your exact-edit plan to `<scratchpad>/plan.md` before editing.
- No new dependencies, no Tailwind, no framework. Vanilla JS in the existing style. supabase-js via the existing CDN tag. No emoji anywhere. Brand tokens only (`--forest`, `--pink`, `--ivory`, the `--arm-*` vars). Cormorant Garamond for class names and headings, Outfit for everything else, Bebas only for the price and the cart count.
- One primary button per view: `Add` on rows is secondary (ghost, arm ring); the cart bar's `Check out` and the checkout view's `Pay $NN` are the pink fill. Never two fills on screen.
- No cards inside cards. Day groups are a heading and a list, not boxes.
- `.tap-44` on every inline link and the row buttons. Labels above fields, one column, never placeholder-as-label.
- The page must render correctly with `window.__dwd_sb` null (analytics-off routes): show the empty-state line, no errors.
- The tree may be dirty from a parallel agent: build on top, do not revert.

## 4. Intent

**Route + header.** `/schedule/`, title `Schedule · Dance With Dixon`. Page header on paper (ivory): kicker `PROSERIES` in terracotta caps, H1 `This week at ProSeries` in Cormorant, one dek line in Outfit: `Every class on the floor Monday to Thursday. The ones marked with a price are open for drop-ins: pay online, show up, dance.` Under it the week switcher: three text buttons `This week` · `Next week` · `Week of Oct 13` (the third label is computed from the Monday date), the active one underlined in the arm accent. The window passed to the RPC is Monday to Sunday of the chosen week; the RPC is called once per switch (`public_site_schedule(p_from, p_to)` via `window.__dwd_sb.rpc`).

**Day groups.** Monday to Thursday only (that is the ProSeries week; do not render empty Friday to Sunday). Each day: a small caps heading `MONDAY · OCT 6` and a list. Row grid at desktop: `[time 110px][name + meta 1fr][price 72px][action 96px]`; at 390 the price folds under the meta and the action stays right. Time in tabular Outfit (`4:45 – 6:00`), class name in Cormorant 22px, meta in muted Outfit 14px: `Elite + Pro · ages 8 and up · Garage` (track label, age band and room come straight from the row; join with ` · `; drop any null part).

**Row states.** Closed (drop_in_open false): time, name, meta, nothing else, and the row is slightly muted (opacity on the name, not a strikethrough). Open: price in Bebas (`$25`) and a ghost `Add` button. Added: the button reads `Added` with a check glyph drawn in CSS (no icon font, no emoji) and a click removes it. Full (spots_left === 0): price stays, the button is replaced by the word `Full` in muted text. Spots left between 1 and 3: a small line under the price, `2 spots left` (never for larger numbers). Rows whose start time (on `date`, America/New_York, computed with `Intl.DateTimeFormat` in that zone, never the visitor's zone) has already passed are not rendered. The hold on a seat lasts 35 minutes; if a visitor comes back from an expired Stripe page the cart is intact and the row may now say `Full`.

**Empty states.** No rows at all for the week (holiday): one italic Cormorant line, `No classes this week.` No open rows but classes exist: the schedule renders and under the last day one italic line `No drop-in spots this week. Ask Dixon →` linking to `/contact/?reason=proseries`. Feed error or no Supabase client: the italic line `The schedule is taking a minute. Refresh, or reach Dixon →` with the same link. Loading: three skeleton rows in the arm ring color at 20% opacity, no spinner.

**Feed row shape** (from `public_site_schedule`): `class_id, occurrence_date, date, start_time, end_time, name, track_label, age_band, room, drop_in_open, drop_in_fee_cents, spots_left`. `occurrence_date` is the class's own date (the key the app's roll uses); `date` is the day it actually runs (a moved class differs). **Always display `date`, always send `occurrence_date`.** Group rows into days by `date`.

**Cart.** `localStorage['dwd_dropin_cart']` = JSON array of `{class_id, occurrence_date, date, name, label, start_time, fee_cents}`. On every feed load, drop any cart line that is no longer open or is full, and if something was dropped show one line at the top of the list, `Tuesday Ballet closed since you added it, so it left your cart.` The cart bar is fixed to the bottom, full width, forest background, ivory text, appears only when the cart has at least one line, 64px tall, safe-area padded: left `2 classes · $50` (Bebas for the numerals), right the pink `Check out` fill. Max six lines; the seventh `Add` shows a one-line notice `Six classes at a time. Check out, then add more.`

**Checkout view** (replaces the list in place, back link `← Back to the schedule` at top, the cart bar hides). Left column at desktop / stacked at 390: the order summary as a plain list (day, time, class, price) with a `Remove` text link per line and the total in Bebas. Then the form: `Dancer's name`, `Dancer's date of birth` (date input), `Your name`, `Email`, `Phone`, the waiver checkbox with the exact label `I have read and agree to the Drop-In Class Waiver` where the last four words link to `https://dwd-director.netlify.app/contracts/drop-in-waiver-printable.html` in a new tab, then the Step Up line in muted Outfit: `Paying with Step Up For Students? Request your spot instead →` linking to `https://dwd-director.netlify.app/drop-in`. One pink fill `Pay $50` (amount recomputed from the cart). Under it, muted: `You'll pay on Stripe's secure page. Can't make it? Email dancewithdixon@gmail.com before class starts and we'll move you to another week. No refunds after the class has run.` (Approved by Dixon 2026-09-12, final.)

**Submit.** Disable the button, label `One second…`. POST JSON to `https://ipulrvhiuvgbvralybxx.supabase.co/functions/v1/drop-in-checkout` with the anon key as `apikey` and `Authorization: Bearer <anon>` headers (same key `main.js` already holds), body per the master spec §4: `lines: [{class_id, occurrence_date}]`, `dancer: {full_name, date_of_birth}`, `payer: {full_name, email, phone}`, `waiver_accepted: true`, `waiver_revision: 'v1.1'` (a constant at the top of `schedule.js`). On `{url}` redirect the top window. On an error body `{error, line?}` print the message under the button in terracotta, re-enable the button, and if `line` names a class that is closed or full remove it from the cart with the same notice as above. Network failure: `That didn't go through. Nothing was charged. Try again.`

**Return.** If the URL has `order` and `t`: call `drop_in_order_public(p_id, p_token)`; on a row with status `paid`, render the thank-you in place of the list: kicker `YOU'RE IN`, H1 `See you <Day>, <Dancer first name>.` (or `See you soon` when classes span days), the class list (day · date · time · class · room), the total, then a short block headed `Before class`: the Exchange address line reused from the Collective section, and three short lines: `Arrive ten minutes early.` · `Dance clothes, no street shoes on the floor.` · `Bring water.` Clear the cart. Status `pending` (webhook not yet landed): show `Payment received, saving your spot…` and re-query every three seconds up to twenty times, then fall back to `Paid. If your spot doesn't show in the Director's roll by tomorrow, email dancewithdixon@gmail.com.` Zero rows (wrong token): render the normal schedule. If the URL has `cancelled=1`: normal schedule with the cart intact and one line at the top, `Nothing was charged. Your classes are still in the cart.`

**Track panels.** In each of the three `Weekly Schedule` blocks on the ProSeries page, one link under the list: `This week's schedule and drop-ins →` to `/schedule/`. Nothing else in those blocks changes.

**Analytics.** Fire the existing `site_analytics` insert for the route like other routes; add two events through the existing helper if one takes an event name: `dropin_add` and `dropin_checkout_start`. If the helper is page-views only, skip and say so.

## 5. Verification
- Run: `python -m http.server 8790` (or the launch.json entry), `node scripts/build-routes.mjs --check` then without `--check`, `node scripts/build-css.mjs`, `node scripts/qa/shoot.js` (must pass: no console errors, no 4xx, no overflow, no dead anchors, allowlisted off-domain links only).
- Measure: at 390 no horizontal overflow on the list, the cart bar, checkout and thank-you; the cart bar never covers the last row (bottom padding on the list equals the bar height); the `Add` button is at least 44px tall; the page with `window.__dwd_sb` null shows the error line and zero console errors.
- Screenshots (save to `<scratchpad>/shots/`, exactly these names): `01-week-desktop.png` (a week with two open rows, one added, one full), `02-week-390.png`, `03-checkout-390.png` (two lines in the summary, form filled, button enabled), `04-thankyou-390.png`, `05-empty-week.png`.
- Iterate against the ProSeries page's own rhythm at least three times before checks: same section padding scale, same heading sizes, same muted color.
- Checks JSON (every value must be true when you report):
```json
{
  "routes_built_and_check_passes": false,
  "css_built": false,
  "qa_shoot_passes_1280_and_390": false,
  "no_console_errors_with_and_without_supabase": false,
  "cart_survives_reload_and_prunes_closed_lines": false,
  "checkout_posts_expected_body_shape": false,
  "thankyou_renders_from_rpc_or_stub": false,
  "one_pink_fill_per_view": false,
  "no_emoji_no_icon_font": false
}
```

## 6. Report format (fixed — use exactly this)
```
STATUS: done | partial | blocked
FILES TOUCHED: <paths, one per line>
WHAT CHANGED: <three to six lines, plain words>
CHECKS: <the JSON above, filled in>
SCREENSHOTS: <the named paths>
VERIFIED vs BELIEVED: <one line each — what you actually ran and saw, versus what you assume>
OPEN / BLOCKED: <anything you could not do, and why; every TODO(fable) listed>
```
