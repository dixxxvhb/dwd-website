# ERAS.md — dancewithdixon.com date-gate registry

Every `data-reveal-after` / `data-hide-after` element on the live site, in one table. The
engine lives in `js/campaign.js` (`applyProSeriesReveal()`, polled every 30s). Format:
full ISO timestamp with explicit `-04:00` offset (America/New_York, EDT). Preview mode
(`?launched=1` or `window.__dwdLaunchPreview = true`) shows every era at once — it is
session-scoped only and never persists to localStorage (see A5 note at the bottom).

**Rule going forward (worksheet invariant): every new date-bound element ships with its
end-gate in the same commit, and gets a row here. No exceptions.**

## Eras, in order

1. **Pre-launch** (through 2026-05-01) — early access / "be first in line" email capture.
2. **Audition era** (2026-05-01 → 2026-06-06 1pm) — registration open for the Jun 6 audition.
3. **Victory-lap / intensive-signup era** (2026-06-06 1pm → 2026-06-12 5pm → 2026-07-11) —
   "That's a wrap" beat, then Summer Intensive sign-up open Jun 12–Jul 10.
4. **Standing interest era** (2026-07-11 →) — auditions wrapped, rolling placement open,
   Express Interest is the CTA everywhere. Sub-state at 2026-08-10: countdown card retires,
   season-underway card takes over (same era, same CTA, different copy).
5. **A·Muse** (through 2026-06-28) — its own short-lived triptych/feature card, independent
   of the ProSeries eras above.

## Registry

| Selector / section | File : line | Reveal-at | Hide-at | Era | What shows next |
|---|---|---|---|---|---|
| Nav "Register →" | index.html:204 | — | 2026-06-12T17:00 | Audition → retired | Nav "Summer Intensive →" (already revealed alongside) |
| Nav "Summer Intensive →" | index.html:205 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | Nav "Express Interest →" (below) |
| Nav "Express Interest →" (NEW, coordinator follow-up) | index.html:211 | 2026-07-11T00:00 | — (standing) | Standing interest | — (permanent nav CTA for the season). Same element serves desktop nav AND the mobile menu — this site has no separate mobile-only nav CTA; `.nav-cta-launch` items show/hide together via `.topnav.is-open` (see css/editorial.css:296,300). One row covers both breakpoints for the same reason the "Summer Intensive" row above does. |
| `#audition-wrap` "That's a wrap" | index.html:271–291 | 2026-06-06T13:00 | *(own JS, not `data-hide-after`)* | Victory lap | Retires via `.audition-wrap--retired` class at 2026-06-10T00:00 (see `WRAP_RETIRE_MS` in campaign.js) |
| `#intensive-cta` hero CTA card | index.html:297–300 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | `#season-one-cta` (below) |
| `#season-one-cta` hero block (NEW, A2) | index.html:319–350 | 2026-07-11T00:00 | 2026-08-10T04:00 | Standing interest (pre-season, w/ countdown) | `#season-underway-cta` |
| `#season-underway-cta` hero block (NEW, A2) | index.html:352–371 | 2026-08-10T04:00 | — (standing) | Standing interest (season underway) | — (permanent for the season) |
| `#audition-clock` big countdown | index.html:377–386ish | — | 2026-06-06T13:00 | Audition → retired | `#audition-wrap` (reveals same instant) |
| `#audition-cta` sibling-of-hero | index.html:395–416ish | — | 2026-06-06T13:00 | Audition → retired | `#intensive-cta` era takes the visual slot |
| Triptych — Audition card | index.html:430 | — | 2026-06-06T13:00 | Audition → retired | n/a (triptych drops to fewer cards) |
| Triptych — A·Muse card | index.html:448 | — | 2026-06-28T00:00 | A·Muse → retired | n/a |
| Triptych — Summer Intensive card | index.html:464–467 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | No triptych card added for the standing-interest era (gap — see note) |
| `#audition` audition-day band | index.html:487 | — | 2026-06-06T13:00 | Audition → retired | n/a |
| ProSeries entries card — "Register to Audition" row | index.html:636 | — | 2026-06-12T17:00 | Audition → retired | "Summer Intensive" row (below) |
| ProSeries entries card — nested "Opens May 1" span | index.html:636 (nested) | — | 2026-05-01T00:00 | Pre-launch → retired | Nested "Open Now" span |
| ProSeries entries card — nested "Open Now" span | index.html:636 (nested) | 2026-05-01T00:00 | — | Audition | — |
| ProSeries entries card — "Summer Intensive" row (straggler, A1 sweep) | index.html:637 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | Row disappears; no standing-interest replacement row (gap — see note) |
| "Up Next · A·Muse" feature card | index.html:664 | — | 2026-06-28T00:00 | A·Muse → retired | n/a |
| Ticker — audition-era band | index.html:702 | — | 2026-06-12T17:00 | Audition → retired | Intensive ticker band |
| Ticker — intensive-era band | index.html:714 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | Season One ticker band |
| Ticker — Season One band (NEW, A2) | index.html:726 | 2026-07-11T00:00 | 2026-08-10T04:00 | Standing interest (pre-season) | Season-underway ticker band |
| Ticker — Season underway band (NEW, A2) | index.html:736 | 2026-08-10T04:00 | — (standing) | Standing interest (season underway) | — |
| Email-signup — audition-era block | index.html:760 | — | 2026-06-12T17:00 | Audition → retired | Intensive email-signup block |
| Email-signup — intensive-era block | index.html:767 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | `#season-one-cta`'s own email form covers this era (no dedicated `.email-signup` block added — the hero block carries it) |
| Coming-up card — "Details TBA" | index.html:1280 | — | 2026-06-12T17:00 | Audition → retired | Coming-up card "Sign-Up Open" |
| Coming-up card — "Sign-Up Open" | index.html:1286 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | Card disappears; the "Competition Season" card (ungated, always visible) remains |
| `#proseries-interest` (REWRITTEN, A2) | index.html:1304–1311 | 2026-07-11T00:00 | — (standing) | Standing interest | — (permanent state; content: "Auditions are done. The door is still open.") |
| `#proseries-intensive` | index.html:1316–1323ish | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | `#proseries-interest` (reveals same instant) |
| `#ps-hero-cta` runtime override (JS, not a data-attr) | index.html:981 markup / js/campaign.js `applyProSeriesReveal()` | *(driven by `#proseries-intensive` / `#proseries-interest` visibility)* | — | All | Priority: intensive visible → fullout link; else interest visible → `#proseries-interest` "Express Interest"; else → `#early-access` "Get Early Access" |
| Early-access page — pre-launch state | index.html:1761 | — | 2026-05-01T00:00 | Pre-launch → retired | Early-access "launch" (audition) state |
| Early-access page — audition/launch state | index.html:1816 | — | 2026-06-12T17:00 | Audition → retired | Early-access "intensive" state |
| Early-access page — intensive state | index.html:1867 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | Early-access "standing interest" state (below) |
| Early-access page — standing interest state (NEW, coordinator follow-up) | index.html:1908 | 2026-07-11T00:00 | — (standing) | Standing interest | — (permanent; page never renders empty again). Content: "Auditions are done. The door is still open." + Express Interest CTA. Reuses the `.early-access-page` / `.ea-*` block structure of the three states above it. |
| `.audition-ticker` sitewide sticky bar | index.html:2028 | — | 2026-06-06T13:00 | Audition → retired | n/a (bar disappears; also dismissible client-side) |
| `.fo-archive-banner` (NEW, A3) | fullout.html:43 | 2026-07-11T00:00 | — (standing) | Intensive → Archive | — |
| `.fo-hero-cta` (Register & Pay + close note) | fullout.html:65–70 | — | 2026-07-11T00:00 | Intensive → Archive | Archive banner above already visible |
| `.fo-cta-band` "Register & Pay" button | fullout.html:140 | — | 2026-07-11T00:00 | Intensive → Archive | n/a (recap content stays) |
| `.fo-cta-band` "closes July 5" note | fullout.html:141 | — | 2026-07-11T00:00 | Intensive → Archive | n/a |
| `.fo-sticky-cta` mobile sticky bar | fullout.html:154 | — | 2026-07-11T00:00 | Intensive → Archive | n/a |
| JSON-LD `Event` node `#event-intensive-2026` (NOT a data-attr — static structured data) | index.html:47 (comment) | — | — | *(removed 2026-07-10)* | n/a. Was advertising the Jul 6-10 intensive as `EventScheduled` after the fact; removed entirely from the `@graph`, same treatment the past A-Muse JSON-LD got in the Jul 1 fix pass. Organization / LocalBusiness / WebSite nodes untouched. |

## Resolved this session (coordinator follow-up, 2026-07-10)

Three of the four gaps flagged above were closed in the same session, right after the
initial A1/A2/A3/A5 pass:

- **Nav CTA** — added "Express Interest →" (`index.html:211`, reveal-only 2026-07-11,
  standing). See the registry row above for why it's one element covering both desktop
  and mobile.
- **`/#early-access` standing state** — added a fourth state (`index.html:1908`,
  reveal-only 2026-07-11, standing) so the page never renders empty past the Jul 11 cliff.
- **JSON-LD intensive Event node** — removed entirely from the `@graph` (was
  `#event-intensive-2026`, `eventStatus: EventScheduled`, advertising a Jul 6-10 event
  after the fact). Organization / LocalBusiness / WebSite nodes untouched.

## Known gaps (found during the A1 sweep, still open)

- **Triptych, ProSeries-entries "fact" row, and the homepage `.email-signup` block don't
  get a standing-interest replacement card.** Only the `#season-one-cta` /
  `#season-underway-cta` hero blocks, the nav CTA, `#proseries-interest`, and the
  `/#early-access` standing state carry the standing-interest message. Noting the smaller
  secondary surfaces stay silent about the season era rather than showing stale intensive
  copy — not wrong, just quieter than it could be. Not raised as a blocker by the
  coordinator's follow-up; still open for a future pass if desired.
