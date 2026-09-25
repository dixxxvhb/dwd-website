# dwd-website — running status
(one file, three lists; newest first; commit hashes are the receipts)

## Open
- 2026-09-25 — Waiting on Dixon (Apple Reminders set 09-24): the next dwdCOLLECTIVE class date (Mon 9/28 noon; once it is in the Director, public_site_dwdc_events feeds the Collective page and its sticky bar by itself) and professional photos of Tori + John (Tue 9/29 4pm; each Teachers entry carries a comment where the photo goes). Still-open rulings from 09-22: Teachers bio claims, @dixonbowles, waiver wording, "dwdCON returns", the young headshot. Unmerged July branches (version4, season-one-v2, feat/live-logo-embed, season-one-2026) need Dixon's call before deletion.
- 2026-09-22 — Audit rulings still open (docs/audits/2026-09-22-full-site-audit.md, rulings 3 and 6 to 10): Teachers bio claims, weak hero entries F/J/K, @dixonbowles absent, waiver wording (dwd repo generator, also its dev toolbar text), "dwdCON returns this season", the young-looking headshot. Plus the NOT DONE list in the same file (ProSeries one background, schedule finder, Collective one screen, CSS split, supabase-js shim). Analytics before 09-22 undercounts in-site navigation: re-baseline.
- 2026-09-12 — SCHEDULE + DROP-IN CART built on `schedule-drop-ins` (worktree `dwd-website-dropins`) against a local stub feed (`USE_STUB = true` in js/schedule.js): `/schedule/` route, week switcher, cart, checkout form, Stripe POST, thank-you/return handling. NOT deployed, NOT pushed (push is live on this repo). Blocked on the app spec's Phase 1 (dwd/docs/plans/2026-09-12-drop-in-web-checkout.md) — flip `USE_STUB` to `false` once `public_site_schedule` / `drop_in_order_public` / `drop-in-checkout` are live, then re-run scripts/qa/shoot.js against the real feed before merge. Dixon still needs to eyeball the built UI and confirm §4 copy before push.
- 2026-09-06 — FRONT OF HOUSE plan written: docs/plans/2026-09-06-front-of-house.md (audit of the live site + the architecture that makes the site the connecting point between the app, Instagram, and new people). Nothing built. Phase 0 (the doors: Families sign-in, app links for drop-in / join / privates, live chairs + faculty views) is one session and needs no design decision; §6 lists the six decisions Dixon owns before Phase 1.
- CSS refactor: css/site.css is 309KB source / 192KB min / 31KB gz. Getting raw under 120KB is a refactor (rules are all reachable per prune tools), not a prune. Not scheduled.
- Dixon to confirm the removed bio line ("performed with professional dance companies in New York") was not true; restore if it was.
- Dixon to eyeball ProSeries on his phone (collapsed story, cast name grid).

## Agreed
- One primary CTA style site-wide (Family Pink on forest); sky-blue Season One token = ProSeries hero type only.
- Collective keeps ghost buttons (hushed volume) — not a defect.
- ProSeries phone length target relaxed to "prices one screen down, form ~5 screens down" (14.5k px), not ≤12k.
- Analytics (Supabase) stays on every route except Privacy.

## Done
- 2026-09-25 ebd8493 — SITE CLEANUP LIVE (Dixon 09-24: "fully cleaned up merged and deployed"). Lane A b4e546d: ProSeries on one forest ground, one heading treatment, one ivory money panel, Why as one list, form fields visible (phone 15,682 to 14,077px). Lane B b41e979: Home THIS WEEK block gone + phone spacing (6,148 to 5,282px); Collective = one joining screen, "Next class: date coming soon." + Join -> /contact/?reason=adult, past shows collapsed (9,003 to 2,932px); Teachers text entries for Tori + John; Contact fields filled + labelled; footer separator; off-route media deferred (ebd8493 finished the ProSeries story posters); legacy /#page links redirect in <head> before paint. Live sweep ALL CLEAN; no off-route media on /, /schedule/, /collective/, /proseries/, /teachers/. Plan: docs/plans/2026-09-24-site-cleanup.md.
- 2026-09-24 d12c8ca — /schedule/ IS THE DROP-IN PAGE, LIVE (Dixon: "merged and deployed"). Review + analytics record: docs/audits/2026-09-24-site-review.md; live fixes d00901f, a532031, 3f4306b. Merged local branches with zero unique commits deleted (drop-in-bulk, front-door, front-door-2, rebrand/one-house, schedule-drop-ins, dropin-finder).
- 2026-09-22 3306774 — FULL-SITE AUDIT, all LIVE: functional (6766805), performance + hygiene (5cc4df1), visual after Dixon's look (b6aa8e9, incl. the #page-proseries padding reset removed), every drop-in advertised + Elite/Pro times matched to the Director feed (43a986f). Record: docs/audits/2026-09-22-full-site-audit.md.
- 2026-09-05 800095d — full audit fixes + upgrade, LIVE. Plan: docs/plans/2026-09-04-audit-fixes.md (Phases 1, 2, 2-followup, 3 all done). Audit + resolution: docs/audits/2026-09-04-full-site-audit.md.
- 2026-09-04 9bf120f — full-site audit (64 findings) committed, findings only.

## Done (2026-09-05, hero rotation)
- Home hero rotation: 12 approved entries (A-K, M; L rejected by Dixon), one random pick per visit, `?hero=<letter>` QA override. Plan: docs/plans/2026-09-05-hero-rotation.md. Assets: images/photos/hero/ + video/hero-k*, hero-m*. Rebuild stills with scripts/build-hero-images.py; loops with scripts/encode-hero-loop.sh (recipes in comments).
- Open: J is a motion-blurred frame (Dixon kept it); K is a 2.4s ping-pong loop from a 4s 720p master; Collective adults have no written release on file (Dixon cleared verbally 2026-09-05).
