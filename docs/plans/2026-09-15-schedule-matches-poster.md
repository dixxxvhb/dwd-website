# Website matches the drop-in poster — brief for builder-opus
Date: 2026-09-15 · Repo: ~/Code/dwd-website · Branch: main (commit with explicit paths, do NOT push; Fable pushes after live verification) · Author: Fable

## 1. Decision
The 2026-09-15 drop-in poster (`iCloudDrive\Desktop\fall-promos-2026-09-14\drop-in-v3\d1-doors-feed.png`, look at it) lists five classes with public names, an age line each, and "opens in October" on four. The data side is done in the app database (mig 362): `public_site_schedule` now returns the poster's names and age lines, and a new trailing column `drop_in_opens_on` (date or null) on rows that are closed today only because they open later. The site must (a) render that state and (b) stop hardcoding the old class name in fallbacks. Rejected: hardcoding the five classes in HTML; the feed is the authority.

## 2. Files you own
- `js/schedule.js` — closed-row rendering + stub rows
- `js/now.js` — nothing unless the fallback title is built here (read it; if the feed-driven title already flows, leave it)
- `index.html` — the three `data-dropin-title` / `data-dropin-meta` fallback blocks
- `schedule/index.html` — meta description + any static copy naming "Prep Technique" or "$20 a class"
- `collective/index.html` and `proseries/index.html` ONLY if they carry the same fallback block (grep `data-dropin-title`)
Nothing else.

## 3. Hard rules
- Feed is the authority. Never hardcode class names, prices, or ages except in the no-JS fallback text, which must match the poster: `Technique & Flexibility · Tuesdays · 4:45` / `Ages 5 to 9 · Garage at Exchange Dance`.
- Keep the existing `el()` / `setText` primitives, class names, and the closed-row style. No new deps. No emoji.
- Copy voice: warm, direct, no em dashes. Ampersand is a real `&amp;` in HTML.
- Do not touch the cart, checkout, pricing, or bulk logic.

## 4. Intent
- Schedule page closed rows: when `row.drop_in_opens_on` is a date string, the price column (currently empty for closed rows) shows one muted line `Opens Oct 1` (format: `Opens ` + short month + day, from the feed date, local-date parsed the way the file already parses dates). The action column shows nothing. Rows closed WITHOUT `drop_in_opens_on` stay exactly as today.
- The row name and age line already come from the feed, so `Technique & Flexibility`, `Contemporary`, `Jazz`, `Advanced Technique & Tricks`, `ages 10 and up`, `ages 12 and up` appear with no code change; confirm by reading, and verify live against the real feed (`USE_STUB` off) for the window Sept 15 to Oct 6, which spans the October rows.
- Stub rows (`buildStubRows`): rename the prep stub to `Technique & Flexibility`, add `drop_in_opens_on` to the two closed Elite/Pro stubs (a date next month) so the dev path exercises the new line, set their age_band to `ages 10 and up`.
- `schedule/index.html` meta description: `Drop in to a ProSeries class in Orlando. No audition. $20 to $25 a class, less when you book four or more dates. Ages 5 to 19. Pay online, show up, dance.`
- Home fallbacks (`index.html`, three blocks): title `Technique &amp; Flexibility &middot; Tuesdays &middot; 4:45`, meta unchanged (`Ages 5 to 9 &middot; Garage at Exchange Dance`).

## 5. Verification
- Serve the site locally (any static server) and load `/schedule/` against the LIVE feed; screenshot the week containing Tuesday Sept 22 and the week containing Tuesday Oct 6 at 390px wide and at desktop.
- Screenshots to `<scratchpad>/shots-site/`: `01-schedule-sept22-390.png`, `02-schedule-oct6-390.png`, `03-schedule-oct6-desktop.png`, `04-home-panel-390.png`.
- Checks JSON:
```json
{
  "five_poster_classes_visible_in_oct_week": false,
  "opens_oct_1_line_on_closed_october_rows": false,
  "technique_and_flexibility_open_sept22_at_20": false,
  "age_lines_match_poster": false,
  "no_prep_technique_string_left_in_owned_files": false,
  "no_console_errors": false,
  "committed_with_explicit_paths_not_pushed": false
}
```

## 6. Report format (fixed)
```
STATUS: done | partial | blocked
FILES TOUCHED:
WHAT CHANGED:
CHECKS: <JSON>
SCREENSHOTS:
VERIFIED vs BELIEVED:
OPEN / BLOCKED:
```
