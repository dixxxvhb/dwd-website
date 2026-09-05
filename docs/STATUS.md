# dwd-website — running status
(one file, three lists; newest first; commit hashes are the receipts)

## Open
- CSS refactor: css/site.css is 309KB source / 192KB min / 31KB gz. Getting raw under 120KB is a refactor (rules are all reachable per prune tools), not a prune. Not scheduled.
- `#page-proseries *, .amuse-feature * { padding: 0 }` (css/site.css ~4600) is a blunt reset that out-ranks class padding inside ProSeries. Kill it in a session that can re-QA every ProSeries section.
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
