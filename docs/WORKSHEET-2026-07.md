# dancewithdixon.com — Worksheet — 2026-07-06

**Authored by Fable (architect pass, final Fable session). Implementer: Sonnet. Voice: Dixon.**
Static site, GitHub Pages, main = live. **A push here IS a production deploy — commits are free,
pushes are ASK-FIRST, every time.** Today is Jul 6; the intensive runs Jul 6–10; Season 1 starts
Aug 10. The site's chronic failure mode: **an event ends and the site keeps selling it** (A·Muse
did it for 8 days; the intensive will repeat it from Jul 11 unless Part A ships). This worksheet
fixes the instance AND the disease.

**Ground truth (live-verified 2026-07-06):**
- Live = main (`14455b0`). Jul 1 fix pass shipped. Date-gating engine works (campaign.js,
  `data-reveal-after`/`data-hide-after`, ISO timestamps w/ -04:00).
- **`summer_intensive_public_open` is still TRUE** (checked live in the app DB) — the Jul 5 close
  never happened; signups are open mid-intensive. Dixon's call same-day (Part B).
- Homepage pull-quote Tamara Mark still violates spec (css/rebrand.css:448–461: near-equal flat
  circles, no gradient). Footer/fullout/teachers SVGs are correct.
- The `dwdps2026` code puts a browser in PERMANENT preview mode (all eras visible at once) —
  Dixon's own view of the live site is not what visitors see.

## Session protocol

1. Read this file + the Jul 1 audit (`docs/audits/2026-07-01-full-site-audit.md`) before touching
   anything. Work Part A first — it's date-critical.
2. Done = verified in a local preview with BOTH a clean browser state AND `?launched=1` preview
   (never rely on a campaign-unlocked browser — it lies about gates), committed with a scoped
   message. **Push only with Dixon's explicit OK (push = deploy).** Batch pushes.
3. All parent/public copy is Dixon's voice: follow the writing-voice memory (no em dashes, no AI
   tells), warm/direct/theatrical, never corporate. New public copy gets Dixon's read before push.
4. Test dates by overriding the clock in DevTools or temporarily editing a gate locally — never
   commit test dates.

## Invariants

- **Gold `#e2b955` = Tamara Mark only.** The mark: two UNFILLED circles, right one SMALLER and
  slightly HIGHER, rose-gold gradient stroke, animated when possible. It's the memorial for
  Dixon's mom — get it exactly right or don't touch it.
- Brand: forest `#0c1f17` / pink `#f8d7c8` / terracotta `#C8614B` / ivory `#FAF3E8` (+ seafoam
  `#6BAF8A` for dwdPS). Cormorant Garamond / Outfit / Bebas Neue. NO emojis (the `✦` ornaments
  are fine). Casing: dwdPROSERIES / dwdCOLLECTIVE.
- Copy: never "no extra fees" / "all-inclusive" / "sign up" for ProSeries ("apply" / "earn your
  spot"; "sign up" is acceptable for one-off events like intensives). Deposit framing if fees
  appear. Instagram = @dwdproseries / @dwd_collective only; @dancewithdixon is YouTube/email.
- Dixon's bio facts: **100+ competition pieces** (never "30+" or vague "nearly every piece" —
  fix to the real number when touching bio copy); CAA strictly past tense.
- Never put secret iCal URLs or any secret in client code. Supabase anon key in the bundle is
  fine (RLS-gated, insert-only).
- Every new date-bound section MUST ship with its end-gate (`data-hide-after`) in the same
  commit, and be logged in `docs/ERAS.md` (created in A1). No exceptions — this rule is the cure.

---

## PART A — Before July 11 (the cliff; 1-2 sessions, push needed by Jul 10)

**A1 [M] Era system + ERAS.md.** Create `docs/ERAS.md`: a single table of every gated element —
selector/section, reveal-at, hide-at, which era owns it, what shows next. Backfill every existing
gate (the Jul 1 audit lists them). Then wire the missing gates:
- `data-hide-after="2026-07-11T00:00:00-04:00"` on ALL intensive surfaces: hero CTA, nav
  "Summer Intensive" item (both desktop AND the mobile menu entry), intensive ticker bands,
  `#proseries-intensive` section, intensive email signup (index.html ~335, 245, 678/690, 723,
  1242, 1274 — sweep for stragglers, the content audit counted 6+ CTAs).
- `data-hide-after="2026-06-28T00:00:00-04:00"` on the A·Muse triptych card (index.html ~423)
  and kill the stale RSVP path: amuse-in-space.html's form becomes a "this show has closed —
  watch the recap" state (page stays as archive).
- While in campaign.js: drop the 2s polling to 30s (marketing gates don't need reflows every 2s).

**A2 [M] The Jul 11 – Aug 9 era (content + reveal).** New homepage state revealed
`2026-07-11T00:00:00-04:00`: hero pivots to Season One — "Season One begins August 10" +
countdown (reuse the audition countdown machinery), one CTA pair: "apply for rolling placement"
(→ the dwd app's audition-form intake, which is live and graceful) + email signup (source tag
`season-1`). A short "the intensive, wrapped" beat can link to the archived fullout page. Copy
drafted in Dixon's voice, DIXON REVIEWS BEFORE PUSH. Also add the hidden
`data-reveal-after="2026-08-10T04:00:00-04:00"` season-underway variant now (hero: "Season One
is underway" + rolling placement + Collective), so Aug 10 flips itself with nobody remembering.

**A3 [S] fullout.html → archive.** Same pattern as amuse: on Jul 11 the page gains a quiet
banner ("FULL OUT ran July 6–10, 2026") — register/pay CTAs and the sticky mobile bar hide,
recap stays. Add the missing og:image + twitter card NOW (it's being shared in DMs this week).
Keep the URL live (SEO + link history), no redirect.

**A4 [S] Fix the Tamara Mark (memorial — exact or nothing).** css/rebrand.css:448–461: replace
the CSS-drawn pull-quote circles with the footer's SVG markup (unequal radii r=65/r=49, right
higher, rose-gold gradient stroke, unfilled). Verify against the footer rendering side-by-side.

**A5 [S] Preview-mode decoupling.** campaign.js: the `dwdps2026` unlock must stop force-revealing
all eras. Preview = `?launched=1` URL param only (session-scoped, no localStorage). Keep the code
gate for the campaign HQ + analytics pages themselves. Then tell Dixon to hard-refresh — his
browser has been lying to him about what visitors see.

**A6 [S] Quick tech batch (same push).** (a) Bebas Neue actually loading on index.html — verify
computed font on `.tr-num`/eyebrows, fix the fonts URL if it renders fallback. (b) Contrast: the
cream-on-coral small buttons fail WCAG (2.73:1) — darken the coral or lighten text on those
labels. (c) Reduced-motion logo fix: fallback `img` must be a sibling (or use `poster`), not a
child that hides with the video. (d) sitemap.xml lastmod refresh + `noindex` meta on
analytics.html. (e) sw.js: compare `new URL(url).pathname` instead of raw url.endsWith (query
strings). (f) Teacher-card placeholder inline styles → brand tokens (Manrope out, Outfit in).

---

## PART B — Dixon's calls (this week)

| When | What |
|------|------|
| **today** | `summer_intensive_public_open` is STILL TRUE — decide: leave open for day-of/walk-in signups during the week, or flip it off in the app now. It must be OFF by Jul 10. |
| **by Jul 10** | Review + approve the A2 season-era copy (it's your voice, public). One read. |
| **by Jul 10** | Approve the Part A push (push = deploy). |
| **this week** | After A5 ships: hard-refresh your browser / clear the campaign unlock so you see the real site. |
| **whenever** | Sanction or retire the campaign look: `--oh-*` tokens + Anton/Manrope stay as the official "campaign palette" (document in DESIGN.md) or get migrated to brand tokens. Recommend: sanction + document — the campaign pages earned their look. |
| **decide** | Pro-track routine count on the site says "6 routines"; MASTER.md says 5 + optional solo. Which is the sales copy? (Also affects app deposit math conversations.) |

---

## PART C — Season-era content builds (Jul 15 – Aug 9; Dixon reviews all copy)

**C1 [M] Season One section.** The site has ZERO season content. Build a #season (or refreshed
#proseries) section: the three tracks as they now exist, weekly rhythm (nights/times once
Dixon confirms), faculty row (Dixon + rotation: Jackson, Madi, Tori), season timeline graphic
(Aug 10 start → comps window → May 25 showcase), deposit-framed fee mention ONLY if Dixon wants
fees public (his call — the app handles the real numbers). This is what the Aug 10 reveal (A2)
links into.

**C2 [S] Season FAQ.** 8-12 real parent questions (what tracks mean, rolling placement, what a
week looks like, comp expectations, how billing works at deposit-framing altitude, contact).
Cuts contact-form noise. Dixon voice, his review.

**C3 [S] Collective refresh.** dwdCOLLECTIVE section: A·Muse framed as past win ("our first
show"), what's next for the company (rehearsal cadence, interest form stays). Low drama, keeps
the adult funnel warm.

**C4 [S] Results/wins scaffold (hidden).** An empty, gated "results" pattern ready for the first
competition placements — build the markup now, reveal when there's something to show. Zero
maintenance until then.

**C5 [S] Parent-portal presence.** A small, always-on "current families" footer/nav link →
dwd-director.netlify.app parent portal, so the website serves enrolled families too, not just
prospects.

## PART D — Hygiene + deferred

- **D1 [S]** Merch poll spam guard: honeypot field + localStorage voted-flag (no CAPTCHA).
- **D2 [S]** Mobile menu: opaque overlay, `overflow:hidden` on body while open, focus trap +
  focus-return on close, and add the era-current CTA to the mobile menu (whatever era is live).
- **D3 [S]** Lazy-load campaign.js off the critical path for non-campaign pages (keep the gate
  poller in a tiny inline shim or load it deferred — gates must still apply on first paint
  without layout flash; verify).
- **D4 [M]** CSS consolidation (7+ sheets → 3): only if a session is otherwise idle — regression
  risk exceeds the ~50KB win; visual-diff every page if attempted.
- **D5 [S]** amuse-form.js CDN-failure path: mirror main.js's guard (graceful message, no native
  submit fallback that leaks form data into the query string).
- **D6 [S]** DESIGN.md: document the era system (ERAS.md pointer), the campaign-palette ruling
  from Part B, and the analytics/campaign access-code behavior post-A5.
- **D7 [S]** 404.html: add a one-line "page not found — heading home" message before redirect.

## Explicitly rejected — don't resurrect

- Deepening the PWA (offline sync, push) — marketing site, low ROI; keep manifest + SW as-is.
- Auto-flipping `summer_intensive_public_open` from the website — server flags belong to the app.
- CAPTCHA on any form (friction > spam risk at this traffic).
- Deleting amuse/fullout pages (archive pattern, never delete — they're the history).
- New fonts / palette drift beyond the sanctioned campaign set.

## Progress Log

| Task | Status | Session note |
|------|--------|--------------|
| A1 | [ ] | |
| A2 | [ ] | |
| A3 | [ ] | |
| A4 | [ ] | |
| A5 | [ ] | |
| A6 | [ ] | |
| C1 | [ ] | |
| C2 | [ ] | |
| C3 | [ ] | |
| C4 | [ ] | |
| C5 | [ ] | |
| D1–D7 | [ ] | |
