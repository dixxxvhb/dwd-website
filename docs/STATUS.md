# dwd-website — running status
(one file, three lists; newest first; commit hashes are the receipts)

## Open
- 2026-09-22 — FULL-SITE AUDIT: docs/audits/2026-09-22-full-site-audit.md. Functional + perf fixes LIVE (6766805, 5cc4df1). Visual fixes on branch `audit-0922` (b6aa8e9, worktree `~/Code/dwd-website-audit`, preview entry `dwd-website-audit` on :8796) WAITING FOR DIXON'S LOOK; merge = fast-forward main to the branch. Ten rulings listed in the audit (October drop-in panel, track schedules vs app, bio claims, logo gold sparkle, photo releases incl. pool photos). Analytics before 09-22 undercounts in-site navigation: re-baseline.
- 2026-09-12 — SCHEDULE + DROP-IN CART built on `schedule-drop-ins` (worktree `dwd-website-dropins`) against a local stub feed (`USE_STUB = true` in js/schedule.js): `/schedule/` route, week switcher, cart, checkout form, Stripe POST, thank-you/return handling. NOT deployed, NOT pushed (push is live on this repo). Blocked on the app spec's Phase 1 (dwd/docs/plans/2026-09-12-drop-in-web-checkout.md) — flip `USE_STUB` to `false` once `public_site_schedule` / `drop_in_order_public` / `drop-in-checkout` are live, then re-run scripts/qa/shoot.js against the real feed before merge. Dixon still needs to eyeball the built UI and confirm §4 copy before push.
- 2026-09-06 — FRONT OF HOUSE plan written: docs/plans/2026-09-06-front-of-house.md (audit of the live site + the architecture that makes the site the connecting point between the app, Instagram, and new people). Nothing built. Phase 0 (the doors: Families sign-in, app links for drop-in / join / privates, live chairs + faculty views) is one session and needs no design decision; §6 lists the six decisions Dixon owns before Phase 1.
- CSS refactor: css/site.css is 309KB source / 192KB min / 31KB gz. Getting raw under 120KB is a refactor (rules are all reachable per prune tools), not a prune. Not scheduled.
- `#page-proseries *, .amuse-feature * { padding: 0 }` reset: REMOVED on `audit-0922` (b6aa8e9), every ProSeries section re-QA'd at 390 + 1280. Closes on merge.
- Dixon to confirm the removed bio line ("performed with professional dance companies in New York") was not true; restore if it was.
- Dixon to eyeball ProSeries on his phone (collapsed story, cast name grid).

## Agreed
- One primary CTA style site-wide (Family Pink on forest); sky-blue Season One token = ProSeries hero type only.
- Collective keeps ghost buttons (hushed volume) — not a defect.
- ProSeries phone length target relaxed to "prices one screen down, form ~5 screens down" (14.5k px), not ≤12k.
- Analytics (Supabase) stays on every route except Privacy.

## Done
- 2026-09-05 800095d — full audit fixes + upgrade, LIVE. Plan: docs/plans/2026-09-04-audit-fixes.md (Phases 1, 2, 2-followup, 3 all done). Audit + resolution: docs/audits/2026-09-04-full-site-audit.md.
- 2026-09-04 9bf120f — full-site audit (64 findings) committed, findings only.

## Done (2026-09-05, hero rotation)
- Home hero rotation: 12 approved entries (A-K, M; L rejected by Dixon), one random pick per visit, `?hero=<letter>` QA override. Plan: docs/plans/2026-09-05-hero-rotation.md. Assets: images/photos/hero/ + video/hero-k*, hero-m*. Rebuild stills with scripts/build-hero-images.py; loops with scripts/encode-hero-loop.sh (recipes in comments).
- Open: J is a motion-blurred frame (Dixon kept it); K is a 2.4s ping-pong loop from a 4s 720p master; Collective adults have no written release on file (Dixon cleared verbally 2026-09-05).
