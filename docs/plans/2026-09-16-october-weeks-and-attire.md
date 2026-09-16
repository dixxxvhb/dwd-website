# Schedule page: reach October weeks + attire on the thank-you screen — brief for builder-opus
Date: 2026-09-16 · Repo: `~/Code/dwd-website` (GitHub Pages) · Author: Fable

## 1. Decision (what and why)
The drop-in poster goes on Instagram today and says the four $25 classes open in **October**. The database already opens them from Oct 1 (`public_site_schedule` returns `drop_in_open=true` for Tue Oct 6 / Wed Oct 7 / Oct 13-14 / Oct 20-21, verified on prod 2026-09-16). The site cannot show them: `/schedule/` has three fixed week chips (this week, next week, week of Sept 28), so October is unreachable until Sept 22. Fix on the site only, no RPC change (the RPC caps one CALL at 21 days; it does not cap how far ahead a call may look).

Two changes:
1. **Week switcher becomes a pager** that reaches six weeks ahead (offsets 0..6, so through the week of Oct 26 today). Keep the existing text-link look (`.sched-week-btn`), not a new component: `‹ Earlier` · label · `Later ›`. Label = `This week` / `Next week` / `Week of Oct 5`. `Earlier` hidden at offset 0; `Later` hidden at offset 6. Under the switcher, only while NY today is before Oct 1 and the current offset is below the October week, one muted line in the existing `.sched-row-bulk` style: `Booking for October? Jump to the week of Oct 5 →` (a text button; it loads that offset). Compute "the week of Oct 5" as the Monday of the first week containing Oct 1 or later that has any Monday-to-Sunday span on/after Oct 1; today that is Oct 5. Hardcode nothing about the year.
2. **Thank-you "Before class" block** gets the attire line. Replace the three `<p>` lines after the address with exactly these three:
   - `Arrive ten minutes early.`
   - `All black, form-fitting. Leotard and tights, or a fitted top and leggings. Hair pulled back off the face.`
   - `No street shoes on the floor. Bring water.`

## 2. Files you own
- `js/schedule.js` (switcher logic, `updateWeekLabels`, `loadWeek`, `mondayOf`; the stub feed must still work for any offset)
- `schedule/index.html` (switcher markup, thank-you block)
- `css/site.css` (only the `.sched-week-*` block; append, do not restyle anything else)
- `sw.js` cache bump if the repo's convention is to bump it when js/css change (check git log for the pattern)
Touch nothing else. Branch `october-weeks` off main. Commit on the branch with explicit paths. Never push, never deploy.

## 3. Hard rules
- Read `DESIGN.md` and the schedule section of `css/site.css` first. Brand tokens only, no emojis, no new dependencies, no new fonts.
- Copy is verbatim from §1. Anything missing gets `TODO(fable)`.
- The cart, checkout, thank-you polling and `USE_STUB` paths keep working. Cart lines from a far week must survive switching weeks (pruneCart already only prunes against rows it has; keep that).
- 390px wide: switcher fits on one line, nothing truncates, no horizontal page scroll.
- Do your own recon; write your exact-edit plan to `<scratchpad>/plan.md` before editing.

## 4. Verification
- Serve the site locally (any static server) and load `/schedule/` against the LIVE feed (`USE_STUB=false`, which is the shipped state).
- Iterate the switcher look at least three times against the existing header before you shoot.
- Screenshots to `<scratchpad>/shots/`: `01-this-week-390.png` (jump line visible), `02-week-oct5-390.png` (Tue Oct 6 rows show Add, Wed Oct 7 Jazz shows Add), `03-week-oct26-desktop.png` (Later hidden), `04-thankyou-390.png` (use the existing QA hook for the thank-you against the stub).
- Checks JSON:
```json
{ "offsets_0_to_6_load": false, "later_hidden_at_6": false, "earlier_hidden_at_0": false, "jump_line_only_before_oct1": false, "oct6_rows_show_add": false, "oct7_jazz_shows_add_4_15": false, "thankyou_copy_verbatim": false, "no_horizontal_scroll_390": false, "stub_path_still_works": false }
```

## 5. Report format (fixed — use exactly this)
```
STATUS: done | partial | blocked
FILES TOUCHED: <paths, one per line>
WHAT CHANGED: <three to six lines, plain words>
CHECKS: <the JSON above, filled in>
SCREENSHOTS: <the named paths>
VERIFIED vs BELIEVED: <one line each>
OPEN / BLOCKED: <anything you could not do, and why>
```
