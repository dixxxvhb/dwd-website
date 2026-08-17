# ERAS.md — dancewithdixon.com date-gate registry

Every `data-reveal-after` / `data-hide-after` element on the site, plus the Season One
state machine, in one table. The attribute engine lives in `js/campaign.js`
(`applyProSeriesReveal()`, polled every 30s). Format: full ISO timestamp with explicit
`-04:00` offset (America/New_York, EDT).

**Rewritten 2026-08-16.** The previous version had drifted badly: it still documented ten
sections the Aug 3 dead-era purge deleted (the triptych and its four cards, the audition
clock, the audition wrap, three ticker bands, two coming-up cards, the sitewide audition
ticker), and every line number was stale. It was the one doc that made date-gate work safe
to touch, so a stale copy was actively dangerous. Trust the selector over the line number;
re-grep `data-reveal-after\|data-hide-after` to refresh.

**Rule (worksheet invariant): every new date-bound element ships with its end-gate in the
same commit, and gets a row here. No exceptions.** This rule was broken exactly once, by
`#s1-premiere` on 2026-08-03 — see the Season One section for what that cost and how it
was closed.

## Preview modes

| Param | Effect |
|---|---|
| `?launched=1` | Forces every gated element visible at once, and forces Season One state `premiere`. Session-scoped, never persisted. |
| `?s1state=premiere\|midseason\|finale\|wrapped` | Forces a single Season One state so each can be reviewed without waiting for the date. |
| `?type=canon\|house` | Display-type preview only (Anton replacement candidates). Not an era gate — see `css/type-preview.css`. |

## Eras, in order

1. **Pre-launch** (through 2026-05-01) — early access / "be first in line" email capture.
2. **Audition era** (2026-05-01 → 2026-06-06 1pm) — registration open for the Jun 6 audition.
3. **Victory-lap / intensive-signup era** (2026-06-06 1pm → 2026-06-12 5pm → 2026-07-11).
4. **Standing interest era** (2026-07-11 →) — auditions wrapped, rolling placement open,
   Express Interest is the CTA everywhere. **Permanent.** All the era-1-through-3 surfaces
   below are retired and stay retired; they are listed for history and because the elements
   still exist in the DOM (hidden), not because they will ever show again.
5. **Season One** (2026-08-10 → 2027-05-25) — runs *alongside* era 4, not instead of it.
   Standing interest is still the CTA; Season One is the ProSeries identity layered over it.
   Has its own four-state machine, below.

## Registry — index.html

| Selector / section | Reveal-at | Hide-at | State today (2026-08-16) |
|---|---|---|---|
| Nav "Register →" | — | 2026-06-12T17:00 | retired |
| Nav "Summer Intensive →" | 2026-06-12T17:00 | 2026-07-11T00:00 | retired |
| Nav "Express Interest →" | 2026-07-11T00:00 | — (standing) | **live**. One element serves desktop nav AND mobile menu; `.nav-cta-launch` items show/hide together via `.topnav.is-open`. Carries `.s1-cta-sky`, so it retires its sky fill at Season One state `wrapped` — see `css/season1.css`. |
| `#season-one-cta` hero block | 2026-07-11T00:00 | 2026-08-10T04:00 | retired (superseded by `#season-underway-cta`) |
| `#season-underway-cta` hero block | 2026-08-10T04:00 | — (standing) | **live** |
| `.email-signup-launch` | 2026-07-11T00:00 | — (standing) | **live** |
| `#s1-premiere` Season One announce band | 2026-08-10T04:00 | — (permanent by design) | **live**. Deliberately has no hide-gate: it is not a promo, it is the ProSeries opener for the whole season. Its *copy* is state-driven instead — see below. |
| `#proseries-interest` "Now casting." | 2026-07-11T00:00 | — (standing) | **live**. `campaign.js` keys the ProSeries hero CTA off this element's era. |
| Early-access — pre-launch state | — | 2026-05-01T00:00 | retired |
| Early-access — audition state | — | 2026-06-12T17:00 | retired |
| Early-access — intensive state | 2026-06-12T17:00 | 2026-07-11T00:00 | retired |
| Early-access — standing state | 2026-07-11T00:00 | — (standing) | **live**. Fourth state exists so `/#early-access` never renders empty. |

## Registry — standalone event pages

Both retired events follow the same shape: an archive banner reveals the day after the
event, and every purchase path hides at the same instant.

| Page | Element | Reveal-at | Hide-at |
|---|---|---|---|
| fullout.html | `.fo-archive-banner` | 2026-07-11T00:00 | — |
| fullout.html | `.fo-hero-cta`, `.fo-btn` register, `.fo-cta-close`, `.fo-sticky-cta` | — | 2026-07-11T00:00 |
| dwdcon.html | `.dc-archive-banner` | 2026-07-27T00:00 | — |
| dwdcon.html | `.dc-cta-head` "That's a wrap." | 2026-07-27T00:00 | — |
| dwdcon.html | `.dc-cta-head` "Get your badge.", both `.dc-btn` register links, `.dc-hero-cta`, `.dc-sticky-cta` | — | 2026-07-27T00:00 |

**dwdcon.html gates added 2026-08-16.** They should have shipped with the page. dwdCON ran
July 26 and the page carried three live "Get Your Badge" CTAs pointing at the real
registration endpoint, ticket prices, and a sticky mobile bar for three weeks afterward,
with zero date gates of any kind, while still listed in `sitemap.xml`. If you add another
event page, copy fullout.html's gate structure, not dwdcon.html's original one.

## Season One state machine

Not an attribute gate — a computed state written to `<html data-s1-state>` by
`applyS1PremiereWindow()` in `campaign.js`, consumed by `css/season1.css`. Replaced the
binary `.s1-premiere-window` toggler on 2026-08-16.

| State | Window | Volume | Band copy |
|---|---|---|---|
| *(none)* | before 2026-08-10 | — | band not revealed |
| `premiere` | 2026-08-10 → 2026-08-24 | full midnight takeover | "Now premiering" / "Welcome to Season One." |
| `midseason` | 2026-08-25 → 2027-04-30 | sky accents only, normal page ground | "Now playing" / "Season One is on the air." |
| `finale` | 2027-05-01 → 2027-05-25 | full midnight takeover returns | "The Finale · May 25, 2027" / "One episode left." |
| `wrapped` | after 2027-05-25 | all sky retires to Family Pink | "August 2026 – May 2027" / archive paragraph |

Three things a future session must not undo:

- **The state goes on `<html>`, not `#page-proseries`.** The nav Express Interest CTA
  carries `.s1-cta-sky` and lives outside the ProSeries page. Scoping at the document root
  is the only reason sky can retire cleanly at `wrapped` instead of stranding sky buttons
  on a page whose accents have reverted to pink.
- **`premiere` and `finale` deliberately share the `.s1-premiere-window` class.** Reusing
  the takeover CSS for the last three weeks is intentional, not a copy-paste.
- **The hero fold ends with the season.** `.s1-hero-folded` applies while the band is up
  AND state is not `wrapped`. The original unconditional fold removed the ProSeries page's
  own hero permanently, which nobody intended.

### What the old binary window actually did

Worth recording, because it is the failure mode the invariant exists to prevent. The
Aug 3 implementation applied `.s1-premiere-window` between Aug 10–24 and removed it after.
On Aug 25 the page would have landed in a state nobody designed: the announce band still
up reading "Premieres August 10" forever (no hide-gate), the hero folded away permanently,
and sky only half-retreated — `.s1-cta-sky` buttons and `.s1-ep-code` chips stayed sky
because they are class-based in the markup, while heading accents and track-tab borders
reverted to Family Pink. It also carried dead code: a `.ps-hero .tagline` text swap that
ran every 30s against an element the fold had already hidden.
