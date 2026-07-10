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
| Nav "Register →" | index.html:244 | — | 2026-06-12T17:00 | Audition → retired | Nav "Summer Intensive →" (already revealed alongside) |
| Nav "Summer Intensive →" | index.html:245 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | No nav CTA takes its place (see note below) |
| `#audition-wrap` "That's a wrap" | index.html:305–325 | 2026-06-06T13:00 | *(own JS, not `data-hide-after`)* | Victory lap | Retires via `.audition-wrap--retired` class at 2026-06-10T00:00 (see `WRAP_RETIRE_MS` in campaign.js) |
| `#intensive-cta` hero CTA card | index.html:331–334 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | `#season-one-cta` (below) |
| `#season-one-cta` hero block (NEW, A2) | index.html:353–384 | 2026-07-11T00:00 | 2026-08-10T04:00 | Standing interest (pre-season, w/ countdown) | `#season-underway-cta` |
| `#season-underway-cta` hero block (NEW, A2) | index.html:386–405 | 2026-08-10T04:00 | — (standing) | Standing interest (season underway) | — (permanent for the season) |
| `#audition-clock` big countdown | index.html:411–420ish | — | 2026-06-06T13:00 | Audition → retired | `#audition-wrap` (reveals same instant) |
| `#audition-cta` sibling-of-hero | index.html:429–450ish | — | 2026-06-06T13:00 | Audition → retired | `#intensive-cta` era takes the visual slot |
| Triptych — Audition card | index.html:464 | — | 2026-06-06T13:00 | Audition → retired | n/a (triptych drops to fewer cards) |
| Triptych — A·Muse card | index.html:482 | — | 2026-06-28T00:00 | A·Muse → retired | n/a |
| Triptych — Summer Intensive card | index.html:498–502 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | No triptych card added for the standing-interest era (gap — see note) |
| `#audition` audition-day band | index.html:521 | — | 2026-06-06T13:00 | Audition → retired | n/a |
| ProSeries entries card — "Register to Audition" row | index.html:670 | — | 2026-06-12T17:00 | Audition → retired | "Summer Intensive" row (below) |
| ProSeries entries card — nested "Opens May 1" span | index.html:670 (nested) | — | 2026-05-01T00:00 | Pre-launch → retired | Nested "Open Now" span |
| ProSeries entries card — nested "Open Now" span | index.html:670 (nested) | 2026-05-01T00:00 | — | Audition | — |
| ProSeries entries card — "Summer Intensive" row (straggler, A1 sweep) | index.html:671 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | Row disappears; no standing-interest replacement row (gap — see note) |
| "Up Next · A·Muse" feature card | index.html:698 | — | 2026-06-28T00:00 | A·Muse → retired | n/a |
| Ticker — audition-era band | index.html:736 | — | 2026-06-12T17:00 | Audition → retired | Intensive ticker band |
| Ticker — intensive-era band | index.html:748 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | Season One ticker band |
| Ticker — Season One band (NEW, A2) | index.html:760 | 2026-07-11T00:00 | 2026-08-10T04:00 | Standing interest (pre-season) | Season-underway ticker band |
| Ticker — Season underway band (NEW, A2) | index.html:770 | 2026-08-10T04:00 | — (standing) | Standing interest (season underway) | — |
| Email-signup — audition-era block | index.html:794 | — | 2026-06-12T17:00 | Audition → retired | Intensive email-signup block |
| Email-signup — intensive-era block | index.html:801 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | `#season-one-cta`'s own email form covers this era (no dedicated `.email-signup` block added — the hero block carries it) |
| Coming-up card — "Details TBA" | index.html:1314 | — | 2026-06-12T17:00 | Audition → retired | Coming-up card "Sign-Up Open" |
| Coming-up card — "Sign-Up Open" | index.html:1320 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | Card disappears; the "Competition Season" card (ungated, always visible) remains |
| `#proseries-interest` (REWRITTEN, A2) | index.html:1338–1345 | 2026-07-11T00:00 | — (standing) | Standing interest | — (permanent state; content: "Auditions are done. The door is still open.") |
| `#proseries-intensive` | index.html:1350–1357ish | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | `#proseries-interest` (reveals same instant) |
| `#ps-hero-cta` runtime override (JS, not a data-attr) | index.html:1015 markup / js/campaign.js `applyProSeriesReveal()` | *(driven by `#proseries-intensive` / `#proseries-interest` visibility)* | — | All | Priority: intensive visible → fullout link; else interest visible → `#proseries-interest` "Express Interest"; else → `#early-access` "Get Early Access" |
| Early-access page — pre-launch state | index.html:1795 | — | 2026-05-01T00:00 | Pre-launch → retired | Early-access "launch" (audition) state |
| Early-access page — audition/launch state | index.html:1850 | — | 2026-06-12T17:00 | Audition → retired | Early-access "intensive" state |
| Early-access page — intensive state | index.html:1901 | 2026-06-12T17:00 | 2026-07-11T00:00 | Intensive → Standing interest | No standing-interest `/#early-access` state added (gap — page has no era past Jul 11; `#proseries-interest` on the ProSeries page is the intended landing spot instead) |
| `.audition-ticker` sitewide sticky bar | index.html:2042 | — | 2026-06-06T13:00 | Audition → retired | n/a (bar disappears; also dismissible client-side) |
| `.fo-archive-banner` (NEW, A3) | fullout.html:43 | 2026-07-11T00:00 | — (standing) | Intensive → Archive | — |
| `.fo-hero-cta` (Register & Pay + close note) | fullout.html:65–70 | — | 2026-07-11T00:00 | Intensive → Archive | Archive banner above already visible |
| `.fo-cta-band` "Register & Pay" button | fullout.html:140 | — | 2026-07-11T00:00 | Intensive → Archive | n/a (recap content stays) |
| `.fo-cta-band` "closes July 5" note | fullout.html:141 | — | 2026-07-11T00:00 | Intensive → Archive | n/a |
| `.fo-sticky-cta` mobile sticky bar | fullout.html:154 | — | 2026-07-11T00:00 | Intensive → Archive | n/a |

## Known gaps (found during the A1 sweep, not fixed this session — flagging per protocol)

- **Nav loses its CTA entirely from 2026-07-11.** The "Register →" item is permanently
  hidden since 2026-06-12; "Summer Intensive →" now also hides 2026-07-11. Nothing revives
  a nav CTA for the standing-interest era. Visitors can still reach `#proseries-interest`
  via the ProSeries page, just not from a persistent nav button. Not in this worksheet's
  scope (A1/A2 didn't call for a new nav item) — flagging for a future pass.
- **Triptych, ProSeries-entries "fact" row, and the homepage `.email-signup` block don't
  get a standing-interest replacement card.** Only the new `#season-one-cta` /
  `#season-underway-cta` hero blocks and the revived `#proseries-interest` section carry
  the standing-interest message on the homepage/ProSeries page. This was the literal scope
  given (A2 named the hero block, the ticker, and `#proseries-interest` specifically) —
  noting the smaller secondary surfaces stay silent about the season era rather than
  showing stale intensive copy, which is at least not wrong, just quieter than it could be.
- **`/#early-access` page has no state past 2026-07-11.** Its intensive state now hides and
  nothing reveals after it — the page goes blank past the fragment if someone lands there
  directly. Not named in A1/A2 scope; flagging for a follow-up (either add a standing state
  or repoint the page to redirect/hash-jump to `#proseries-interest`).
- **JSON-LD Event schema for the intensive** (index.html, `#event-intensive-2026`,
  `eventStatus: EventScheduled`) is not updated to `EventCompleted`/removed after Jul 10.
  Structured data isn't touched by campaign.js (it's static, not gated) and wasn't in scope
  for A1–A5. Low urgency (doesn't affect the visible site), worth a follow-up pass.
