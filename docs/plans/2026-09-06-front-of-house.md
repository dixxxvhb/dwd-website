# Front of House: the website as the connecting point

Written 2026-09-06 by Fable after a full look at the live site (main = 800095d + hero rotation 96eaa28), the app's public surface, and every brand/strategy doc. This file is the authority for the website's next era. STATUS.md carries the running list.

## 1. The thesis

The Director app is backstage. The parent, dancer and teacher portals are the dressing rooms. Instagram is the street. The website has been a brochure standing next to all three. Its real job is **front of house**: the marquee, the box office, the lobby wall, the program, and the house doors. Everything a new person sees first, and the one door an existing family walks through to get backstage.

Four jobs, in priority order:

1. **The doors.** Every way into DWD lives here, and each one goes to the thing that already exists in the app. Today the site links to the app zero times. Families cannot sign in from it. Adults are sent to a contact form when the app has a real intake at `/join`. Youth drop-ins ($25, `/drop-in`) and private lessons ($75/hr) are invisible. Those are revenue doors, closed.
2. **The now.** What is playing this week, pulled from the app, never typed: chairs, the next episode, the newest recap, faculty, the Collective's next class, the season state.
3. **The wall.** Instagram made native. The audit says footage beats graphics three to one and the site currently sends people away to IG instead of showing it.
4. **The program.** The ProSeries page as a program you read in order (what, why, who, story, offer, questions, apply), half its current length.

Keep the One House look. It launched three days ago and it is right. This is an architecture change, not a restyle.

## 2. What the audit found (2026-09-06)

Verified against the working tree, the QA shooter (all six routes clean at 1280 and 390), and the app's `src/App.tsx` + `supabase/config.toml`.

**Already live from the database (keep, extend):** track prices + age labels from `proseries_config` (main.js:617); the Episode Guide from the `public_site_episodes` view (episodes.js); the Collective's next class from `public_site_dwdc_events` (dwdc-next.js); three forms writing to `website_contacts`, `email_signups`, `audition_registrations`.

**Hand-typed where it should be live:**
- Chair counts: `js/season.js` object plus the same numbers baked in markup. Verified 2026-09-02, drift by design the next time anyone signs.
- Teacher roster: hardcoded on `#page-teachers`. Guest faculty (Ashley Withee ballet Sept 8, Megan Montgomery) absent while the IG post is queued.
- Episode recaps: `data/episodes.json` holds only the readme. The Guide has a recap slot per episode and nothing fills it.
- Gallery: hand-curated sections by event. The app's media gallery (mig 330) now exists and will hold every event dump after the BAND exit.
- Season state: `eras.js` date gates and a state machine, not a DB row.

**Doors missing:**
- No Families / sign-in entry anywhere (nav, footer, mobile bar). Portal access is delivered only by out-of-band link.
- No link to `/drop-in`, `/join`, private lessons, or `/pay`. "Join the Collective" goes to `/contact/?reason=adult`.
- @dixonbowles is nowhere on the site; the strategy names it as the personal funnel.

**Copy drift to confirm with Dixon (site vs spec/config):** Prep ages 5–9 vs config 5–8 (open since July). Routine counts "3–5 / 4–6 / 5–8" vs spec fixed 3 / 5 / 6. Prep "1–2 competitions" vs Elite/Pro "4–6". Elite/Pro Tuesday times (site 4:45 start) vs MASTER (5:00). The site is likely the newer truth; the fix is to source schedule and routine counts from the app, not to edit HTML.

**Content questions for Dixon:** Tokyo Sunrise (home) and Heart of Gold (gallery) are 2024 CAA-era competition videos with CAA students in frame. Not on the banned list, but the rule is "no CAA student photos." Keep, or replace with Season One footage as it lands.

**Structure:** ProSeries is 18,227 px at 1280 with a nine-chapter sub-nav, and pricing leads. Five identical Express Interest CTAs on Home, none for anyone who already belongs. The "Spots Remain" card is a pink-to-terracotta gradient with a stray glyph doing no job. Seven 168 KB route shells each carry every section; `site.min.css` 196 KB (open item: under 120 KB raw).

**A promise nothing keeps:** the "Episode recaps" email capture inserts to `email_signups`, and no send exists (and by rule none is automatic). Either the recap goes out by hand after each episode, or the capture comes off.

## 3. The architecture (front of house)

| Surface | Job | Source of truth |
|---|---|---|
| **Marquee** (home) | What's playing now. One hero, one "now" strip (up next episode · chairs · newest recap), two program doors, one Families door. | `public_site_now` view (new), `public_site_episodes`, hero-entries |
| **Program** (ProSeries) | Read in order: what it is → why → the cast → the story → the offer → questions → apply. Target ≤ 10k px at 1280. | `proseries_config`, class definitions, `public_site_chairs` (new), `public_site_episodes` |
| **Episodes** (season hub, replaces Gallery's event sections) | One page per episode. Before: date, venue, what it is. After: recap line, the reel, the photo strip, results. The aftershow. | `public_site_episodes` + `data/episodes.json` now; app `media_items` with a `public` flag later |
| **The Wall** (Gallery reborn) | Latest from @dwdproseries and @dwd_collective, native. | `ig-feed` edge fn (Instagram Graph API, cached), fallback JSON from LEDGER |
| **Box office** | Express interest · Placement class · Youth drop-in → app `/drop-in` · Adults → app `/join` · Private lessons → contact reason · Events (dwdCON-style) → app pay pages | app routes that already exist |
| **House doors** (Families) | Sign in: parent PIN, dancer, teacher. One page that explains the three portals and installs the PWA. | app `/parent/login`, `/dancer/login`, `/teacher/login` |
| **The Guide** (Help lane) | Five evergreen pages parents search for, each ending in express interest. | static, FAQ JSON-LD pattern already in place |
| **Dixon** (Teachers → Faculty + Work with Dixon) | Faculty from the DB; commissions, guest teaching, judging as a real offer; @dixonbowles. | `public_site_faculty` view (new), contact reason |
| **Collective** | Unchanged in look; "next class" already live; Join → app `/join`; A·Muse archive stays. | `public_site_dwdc_events` |

Nav becomes: Home · ProSeries · Collective · Episodes · Guide · Faculty · **Families** · Express Interest. Contact folds into the footer and the Dixon page. Gallery becomes Episodes + The Wall.

## 4. The data spine (app side, one migration)

All `public_site_*` views are anon-readable, first names only, no last names, no photos of minors without `photo_release_granted`. Pattern already exists (migs 317 and the episodes view).

- `public_site_chairs`: per track, `filled` = active enrolled students on that track, `max` from `proseries_config`. Kills `season.js` chairs.
- `public_site_faculty`: teachers with `public = true`: display name, role line, disciplines, headshot URL, sort_order, `guest` flag + dates. Kills the hardcoded roster.
- `public_site_now`: one row: season state (premiere / midseason / finale / wrapped, set by the Director), next episode id + date, latest recap episode id, enrolled total. Replaces the date gates in eras.js for state; dates stay for the takeover windows.
- `public_site_episodes`: add `venue_name`, `city`, `kind` (competition / convention / showcase), `status`, and a `recap_url` column so recaps can live in the app instead of the JSON when Dixon prefers.
- Later, after the BAND exit stage 3: `public_site_media`: `media_items` where `public = true`, thumb + playback source (YouTube id or Bunny GUID via `bunny-playback` public token), keyed by episode.

Instagram: edge fn `ig-feed` holding a long-lived Instagram Graph token (Dixon connects once through Facebook Business login; token refresh on a 50-day cron), returns the latest 12 media per account cached in a table for 30 minutes. Fallback if he never connects it: `data/wall.json` maintained from LEDGER at `/wrap`.

## 5. Phases

**Phase 0, the doors (one session, no design work).** Families link in nav + footer + mobile bar → a `/families/` page with the three sign-ins. Box-office links: drop-in → app `/drop-in`, Collective Join → app `/join`, private lessons → contact reason `private`. @dixonbowles in the footer and on the Dixon page. `public_site_chairs` + `public_site_faculty` views (app mig) and the site reading them. Fold the recap email capture into a real promise or remove it.

**Phase 1, the program (two sessions).** ProSeries reorder and compression. Home marquee with the "now" strip. Episodes pages built off the Guide (before/after states). Contact folds into footer + Dixon page.

**Phase 2, the Guide (one session, copy is Fable's).** Five pages: Is my dancer ready for competitive training · What a season actually costs (deposit framing, radical transparency) · Prep, Elite or Pro: how placement works · A week inside ProSeries · How to choose a competition program in Orlando. Each ends on express interest. FAQ JSON-LD on each.

**Phase 3, the wall (one session after Dixon connects IG; else the fallback).** `ig-feed` edge fn + native feed on The Wall and a three-tile strip on the Marquee.

**Phase 4, media from the app (after BAND exit stage 3).** `public_site_media`, episode photo strips and reels served from the app's gallery, per-item public flag set in the Director.

**Phase 5, weight (standing open item).** One shell per route with only its sections, CSS under 120 KB raw.

## 6. Decisions Dixon owns before Phase 1

1. Tokyo Sunrise / Heart of Gold: keep the CAA-era videos or replace as Season One footage lands.
2. Prep ages (5–8 or 5–9) and the routine counts per track: which is policy; the app's config becomes the only source either way.
3. Instagram Graph API: will he do the one-time Facebook Business connect, or run the LEDGER fallback.
4. Public media from the app: per-item public flag in the Director (recommended) or Fable-curated per episode.
5. Dancer/Teammate of the Month on the site (first names, photo with release) or app-only.
6. Nav word for the house door: Families (recommended) or Sign in.

## 7. Rules that carry

Brand walls (palette, type, Tamara Mark, no emojis). Writing voice (no em dashes, Dixon's register). "Apply / express interest / earn your spot," never sign up. Deposit framing verbatim. CAA past tense, no CAA student photos. Founded 2025. First names only for minors on any public surface; photo release checked before any face. GitHub Pages deploys stay auto for session-verified work; app migrations and edge functions follow the app's deploy rule.
