# dancewithdixon.com — "Next Level" plan (written by Fable, 2026-09-02)

Scope: everything in the three tiers Dixon approved on 2026-09-02, in one plan, sequenced
for an Opus implementation session (or two). Branch: `rebrand/one-house` (merge-ready at
`10dff30`). **Push to `main` = deploy.** Every item here lands on the branch; deploy is a
separate decision. This document is the spec. The Opus prompt that points here lives at
`~/.claude/next-sessions/dwd-website-next-level-PROMPT.md`.

## Build log

A checkpoint per session. A fresh session resumes from the last entry.

### Session A — conversion (2026-09-02)

Branch `rebrand/one-house`, from `9fb74c4` to the tip listed below. Nothing
deployed. Six commits, one per plan item, in the prescribed order.

| Item | Commit | State |
|---|---|---|
| 2.5 chair counts | `4125dd6` | done. `js/season.js` owns all twelve strings across the five sites. The parent-quotes half of 2.5 is untouched: the Jill block stays commented until she says yes, and the component is not built yet, so nothing renders an empty box. |
| 1.1 interest form | `bdeff1c` | done. On-site form, real insert accepted by RLS. |
| 1.2 Collective next class | `4dc76e1` | done, shipping the empty state. The view returns zero rows because there is no adult class on the Director calendar yet, which Dixon confirmed is the launch state. Populated state verified by intercepting the view read. |
| 1.3 Merch off nav | `81a5dbe` | done. `#shop` route alive, poll linked from the ProSeries page end. |
| 1.4 faces in heroes | `cb1a8f0` | done for Teachers, Gallery, Contact, Collective. **Merch skipped on purpose**: its hero is a type lockup, never logo-only, and merch left the nav in 1.3 on Dixon's call. |
| 2.4 email capture | `32f3e90` | done. Early-access page deleted, two recap bands in, real insert accepted. |

**Three bugs found and fixed that were not in the plan.**

1. `campaign.js` rewrote `#ps-hero-cta`'s href back to `dwd-director.netlify.app`
   at runtime, so that one button kept leaving the site regardless of the markup.
   Fixed in 2.4; `scripts/qa/shoot.js` now fails the build on any unexpected
   off-domain anchor so it cannot recur silently.
2. Anchor scrolling never worked to a far target. `#interest` sits ~14,700px down
   a page that keeps growing (date-gated bands revealing, lazy images with no
   width/height resolving), so a `scrollIntoView` on the next frame aimed at a
   stale layout: deep links landed 1,514px short, CTA clicks dead-stopped at
   y=137. Replaced with `scrollToAnchor()` in `main.js`. This also fixed
   first-load deep links to any element anchor, which never resolved at all.
3. The site-wide terracotta focus ring measures 1.62:1 on Family Pink, under the
   3:1 UI floor. Overridden to forest inside the interest band only.

**Deliberate deviations from the plan.**

- Experience-level options are `beginner` / `intermediate` / `advanced` / `elite`,
  the real `EXPERIENCE_OPTIONS` values, not the `none` / `recreational` /
  `competitive` the plan's prose guessed at. The plan said to read the React page
  for exact values, so that is what shipped.
- The interest form carries one thing the plan does not specify: a live line
  under each dancer naming the track that birthday lands in, and saying Dixon
  confirms it at the placement class.
- New CSS went into a new `css/next-level.css` loaded after `convert.css`, rather
  than appended to `convert.css`. Session C folds both into `site.css`.
- Contact's mark sits beside the "Connect with DWD" heading rather than tucked
  into the portrait's corner. In the corner it landed on skin at some crops and
  went muddy, and a plate behind it would have been pure decoration.

**Flagged, not fixed (outside these items, wants Dixon's call).**

- Brand casing: CSS `text-transform: uppercase` prints `DWDPROSERIES`,
  `@DWDPROSERIES` and `@DWD_COLLECTIVE` in the chapter labels, the Season One
  eyebrow, and the Gallery Instagram cards. The markup is correct in every case;
  the uppercase is applied in CSS. Brand casing is `dwdPROSERIES`. Fixing it is a
  sitewide typographic change, so it is not smuggled into a conversion item. The
  Gallery instances are in scope for 2.3.
- The Collective H1 reads "DWD Collective" while the body copy on the same page
  says `dwdCOLLECTIVE`.
- ProSeries lazy images carry no `width`/`height`, which is the layout shift that
  broke anchor scrolling and makes tiling unreliable. A real fix is a pass over
  every `<img>` on that page.

**QA.** `scripts/qa/` now holds the Puppeteer harness the plan described, so no
future session has to rebuild it: `shoot.js` (all routes at 1280 and 390, fails
on console errors, failed requests, broken images, overflow, dead anchors,
stray off-domain links), `contrast.js` (measures text-over-photo contrast on
rendered pixels), `shot-element.js` (one component at one width). Session A
ended `ALL CLEAN` on every route at both widths. `sw.js` at `v28`.

**Test rows for Dixon to delete.** CORRECTED 2026-09-03 — there are four, not
two. Three sit in the interest queue:

- `audition_registrations`, "TEST Claude", `test-claude@dancewithdixon.com`,
  id `1feb5045-92cd-422b-b12f-32abef655b07`. Deliberate, to prove RLS accepts
  the payload.
- `audition_registrations`, "Walkthrough Check", `walkthrough@example.com`.
  Accidental.
- `audition_registrations`, "Payload Shape Check", `shape@example.com`.
  Accidental.
- `email_signups`, `test-claude@dancewithdixon.com`, source
  `episode-recaps-home`. Deliberate.

Both accidental rows came from one wrong assumption, worth recording because it
is not obvious: **Puppeteer's page-level request interception does not see
fetches made by a controlling service worker.** A stubbed INSERT that was meant
to be captured instead sailed past the stub into the live database, twice, while
the run reported success either way. `scripts/qa/live.js` now neuters service
worker registration before any page script runs, and hard-aborts rather than
submit if a worker is still in control.

### Session B — excitement and plumbing (2026-09-02)

Six commits, one per plan item, from `0611842` to the tip below. Nothing
deployed.

| Item | Commit | State |
|---|---|---|
| 2.1 hero loop | `31f243b` | done, with two substitutions. See below. |
| 2.2 Episode Guide | `771adb3` | done. Live from `public_site_episodes`, five real comps. Competition marks hooked up but no logo files ship. |
| 2.3 Gallery | `7dda45d` | done. Five episode groups (of the plan's seven; two have no photos). |
| 3.3 Parent FAQ | `7df918b` | done. Eight questions, JSON-LD generated from the markup. |
| 3.4 hygiene | `90776cb` | done. Campaign HQ deleted, era engine extracted to `js/eras.js`, legacy sidebar and keywords meta gone. |
| 3.1 real URLs | `6b36eeb` | done. Six route directories, generated shells, path routing, per-route OG cards. |

**2.1 needs Dixon's eye, and here is exactly why.** He chose "Daisy firebird"
from a list the plan itself called clips. `beautiful_daisy_firebird_jump` is a
PHOTO — the Summer Intensive catalogue files it under stills, and no video of
that jump exists. Everything else failed a rule: the CAA and Dynamic clips are
dancers who are not released Season One dancers, and the plan's own fallback is
Dixon teaching at Movez with masks in frame. What shipped is the SI jazz
showcase, five stars in the catalogue, Daisy featured, live audience. The crop
is also portrait rather than the landscape the plan specifies, because the home
hero photo is a tall column (0.65:1 at 1280), not a band, and a landscape loop
lost about 70% of itself to `object-fit`. `SS`, `DUR` and `CROP` at the top of
`scripts/encode-hero-loop.sh` are the whole interface for changing it.

**Three more accessibility bugs found and fixed in passing.** The Episode Guide
was ivory-on-Family-Pink at 2.23:1, its meta at 1.61:1 and its sky chips at
1.30:1 — the section was effectively unreadable and had been. The rows are drawn
for a forest ground in `season1.css` and `poster-pages.css` put them on pink;
they now get their forest back as cards. The section lead above them had the
same problem. The Gallery's Instagram tiles printed `@DWDPROSERIES` and
`@DWD_COLLECTIVE`.

**One near miss worth remembering.** The first version of the FAQ JSON-LD
generator wrote a `/* */` comment into the `application/ld+json` block to mark
its own output. A comment there would have silently voided the entire `@graph`
— Organization, LocalBusiness, EventSeries, all of it. The generator now splices
by brace-matching and refuses to write anything that does not `JSON.parse`.

**Deliberate deviations.**

- Gallery ships five episode groups, not seven. There are no audition stills and
  Week One exists only as a video poster; a group header over an empty grid is
  worse than no group.
- The seventeen cast portraits are not duplicated into the Gallery. They are the
  ProSeries cast wall and do a different job.
- No competition logos ship in `images/comps/`. Those are third-party marks and
  putting them on Dixon's site is his call. The hook is an explicit allowlist in
  `js/episodes.js` (`COMP_MARKS`) rather than an `onerror` fallback, which would
  cost a 404 per episode in the console.
- The campaign HQ was deleted rather than moved to `campaign.html`. It is a
  dashboard for a rollout that ended in May 2026.
- `#shop` has no route directory and stays hash-only, consistent with 1.3.

**Still flagged for Dixon (unchanged from Session A, plus one).** The sitewide
`text-transform: uppercase` still prints `DWDPROSERIES` in chapter labels and
the Season One eyebrow; the Gallery instances were fixed because 2.3 owned that
page. The Collective H1 still reads "DWD Collective" while the body copy says
`dwdCOLLECTIVE`. ProSeries images still carry no `width`/`height`, which is the
layout shift that made anchor scrolling hard in Session A.

**New tooling in the repo.** `scripts/build-routes.mjs` (route shells + sitemap,
with `--check`), `scripts/build-faq-jsonld.mjs` (`--check` too),
`scripts/encode-hero-loop.sh`, and `scripts/qa/routes.js`. All four are
documented where they live.

**QA.** Full sweep green at 1280 and 390 on every route, plus the routing suite:
direct shell loads, client-side nav, back and forward, hash-to-path upgrades,
element anchors from inside a shell, and zero document fetches during
client-side navigation. `sw.js` at `v34`.

### Session C — CSS consolidation (2026-09-03)

Item 3.2, in the five bisectable commits the plan asked for, from `7d00cf2` to
the tip below. Nothing deployed.

| Step | Commit | What |
|---|---|---|
| tooling | `d064fd2` | `snap.js` + `pixdiff.js`, verified bit-exact on unchanged code before being trusted as a gate. |
| 3.2a | *(see below)* | Manrope retired, 98 declarations to Outfit, one body face instead of two. |
| 3.2b | `89fd27f` | Cinzel was already confined to the two lockups; what was wasteful was fetching weight 700, which nothing uses. |
| 3.2c | `20c08d4` | 962 rules deleted. 458 KB raw / 98 KB gzip to 310 KB / 76 KB. |
| 3.2d | `b9e469a` | Twelve stylesheets merged into `css/site.css`. 317 KB / 67 KB, one request. |
| 3.2e | `2168083` | 187 of 815 `!important` removed as provably inert. |

**The result the plan asked for.** Start-to-finish pixel comparison across
Session C: the only pages that moved are the ones Manrope touched, by exactly
the amount step (a) moved them. Steps b through e contributed zero pixels
between them — home, privacy and the Collective are bit-identical from first
snapshot to last. Every step was additionally verified across all four Season
One states and `?launched=1`.

**Where I did not follow the plan, and why.**

- 3.2c does not use `page.coverage.startCSSCoverage()`. Coverage reports which
  bytes were exercised in one session, so every `:hover` rule, every unmatched
  media query and every state you fail to trigger comes back "unused"; acting on
  that deletes working code. `scripts/qa/prune-css.mjs` asks a question with no
  blind spots instead: does this selector require a class or id name that is
  written down nowhere else in the repo? If the string does not exist, nothing
  can add it, and no state can bring the rule to life.
- 3.2e therefore could not satisfy the plan's stated precondition ("where the
  coverage pass proves the override is the only rule left"), so it is proved
  empirically instead: strip all 815, see which of ~100 computed properties move
  across 26,272 elements, keep `!important` only on those.
- The standalone pages keep their stylesheets where they are rather than moving
  to `css/pages/`. That would mean editing three live archive pages for no
  benefit.
- Gzipped CSS is 67 KB, not under the 65 KB the plan hoped for. Saying so
  plainly: 98 KB down to 67 KB, one request instead of twelve.

**Three bugs I wrote and the gate caught.** Worth recording because each one
looked like it had worked:

1. The prune parser tracked prelude offsets with one shared cursor, so rules
   inside `@media` cut from a stale position and swallowed the rule above them.
2. It then read the comment above a rule as part of the selector. "not
   .gallery-item wrapper" above ".gallery-grid img" made a live rule look dead
   and grew the Gallery by 4,263px.
3. Stripping the `@import` from styles.css with `/^@import[^;]+;/` stopped at
   the first semicolon — that font URL is full of them — leaving stray CSS that
   swallowed the `:root` block and every custom property with it. Every page
   rendered near-black text.

None of these would have been caught by "it looks fine". The pixel differ found
all three, at 49%, 4,263px and 9% respectively.

**New tooling.** `scripts/qa/`: `snap.js`, `pixdiff.js`, `computed.js`,
`prune-css.mjs`, `prune-important.mjs`, `orphan-css.js`, `dead-css.js`, all
documented in `scripts/qa/README.md`.

### Post-launch QA — live site (2026-09-03, 1:35am)

Site launched on `main`. Swept the live domain with `shoot.js` (16 route/viewport
combos), `live.js` and `routes.js` locally, a page-weight/LCP probe, an HTTP status
pass on every URL, the mobile menu, and `pg_policies` on every anon-insert table.
Fixed and deployed in `3a6c249`:

| What | Fix |
|---|---|
| Canonical, `og:url`, sitemap and nav hrefs pointed at `/proseries` etc., which Pages 301s to `/proseries/` | Trailing slash everywhere: `ROUTE_PATH` in `js/main.js`, `build-routes.mjs`, hrefs in every `.html`, `routes.js` expectations |
| `js/episodes.js` fetched `data/episodes.json` relative to the document; a direct load of `/proseries/` resolved it to `/proseries/data/...` (404) and silently dropped every recap | Absolute `/data/episodes.json`; same for `/images/comps/` |
| `teacher-yahia-640.webp` carried a baked-in black rectangle | Regenerated from the clean cutout in `DWD/.../rotation-teachers/source/yahiateacher.png` |
| Returning visitors would keep the old JS | `sw.js` cache `v38` |
| `http://` served the site without redirecting | GitHub Pages `https_enforced` turned on (`gh api -X PUT .../pages`) |

Four QA test rows deleted from `audition_registrations` (3) and `email_signups` (1).
Clean: every route under 2.5 MB and LCP under 1 s; RLS insert-only for anon on all
form tables; zero console errors; 404 page, robots, sitemap, manifest all 200.

**Tooling notes.** `shoot.js --tiles` needs the routes argument first
(`shoot.js <out> <routes> --tiles`), and tiles beyond roughly 10,000 px repeat the
same section because `scroll-behavior: smooth` outruns the tiler. `shot-element.js`
is the reliable way to see a deep section. `#ps-tracks` and `#ps-apply` are zero-height
anchors; shoot `#proseries-tracks-full` and `#interest` instead.

**Still open on Dixon** (unchanged from Sessions A/B): brand casing under CSS
uppercase (`DWDPROSERIES`, `@DWD_COLLECTIVE`), the Collective H1 "DWD Collective",
lazy images without width/height on ProSeries, comp logos, the dwdC next-class date.

## 0. Ground truth the implementer must not re-derive

| Fact | Value |
|---|---|
| Repo | `~/Code/dwd-website`, vanilla HTML/CSS/JS, GitHub Pages serves `main`, CNAME dancewithdixon.com |
| Working branch | `rebrand/one-house` (tip `10dff30`, conflict-free with `origin/main`) |
| Single page | `index.html` (~2,330 lines), hash-routed via `js/main.js` `showPage()`; valid routes in `validPages` |
| Stylesheets, load order | styles → additions → editorial → rebrand → audition → poster-pages → tighten → arms → season1 → story → convert. **convert.css is last; new overrides go there** (or in a new file loaded after it). poster-pages.css uses `!important` heavily and sets `#page-proseries .content-section p` margins/fonts. |
| Date gates | `data-reveal-after` / `data-hide-after` engine in `js/campaign.js` (`applyProSeriesReveal`), Season One state machine on `<html data-s1-state>` (`premiere\|midseason\|finale\|wrapped`, preview `?s1state=`). Registry: `docs/ERAS.md`. **Rule: every new date-bound element ships with its end-gate and an ERAS.md row in the same commit.** |
| Supabase | project `ipulrvhiuvgbvralybxx`, anon key already in `js/main.js` (`window.__dwd_sb`). supabase-js loaded deferred from jsDelivr; app scripts are deferred too and MUST stay deferred together (document order guarantees the client exists). |
| Anon-writable tables | `website_contacts` (name, email, phone, reason, how_heard, message) · `email_signups` (email, source; unique email → error code 23505 = already subscribed) · `audition_registrations` (the express-interest form; RLS allows anon INSERT only when `payment_status='comped' and amount_cents=0 and source='interest'`) |
| Anon-readable views (mig 317, applied 2026-09-02) | `public_site_episodes` (id, name, brand_slug, location, start_date, end_date, event_kind, status, season_label — only posted/confirmed comps or drafts shared with parents) · `public_site_dwdc_events` (id, title, event_type, date, end_date, start_time, end_time, all_day, location_name, location_address, price_cents — upcoming, non-cancelled adult-program events). **Today the dwdc view returns zero rows: Dixon has no Collective class in the Director calendar yet.** |
| Express-interest app | `dwd-director.netlify.app/register` = `src/pages/public/AuditionRegistrationPage.tsx` in `~/Code/dwd`. Insert built by `src/services/auditionRegistration.ts` (`submitAuditionRegistration`). Payload shape below in §1.1. |
| Comp brand kit | `iCloudDrive/Desktop/DWD/_brand/comp-brands/<slug>.md` + `assets/` for: dreammaker, fusion, id-dance, jump, kar, nuvo, revel, showstopper, starquest, the-dance-awards, titans. `brand_slug` values seen in the DB: `titans-of-dance`, `jump`, `starquest`, `dreammaker`, `showstopper`. |
| Clips | Catalog starts at `iCloudDrive/Desktop/DWD/_tools/catalog/REEL-READY.md` (§ "Hero moments", 57 files). Per-clip truth: `clip_annotations.json`. Photo release: check `students.photo_release_granted` before any face ships (all 17 Season One dancers = true as of 08-19). |
| QA | The Claude Code browser pane CANNOT drive this site (JS scrollTo no-ops, blank captures). Use Puppeteer from `~/Code/DWDC-Instagram-Posts/node_modules/puppeteer` with `channel:'chrome'`. Script pattern: unregister SW + `caches.delete`, force `.reveal` visible, `loading=eager`, `position:absolute` on `.topnav/.chapter-rail/.mob-cta`, clip screenshots per 1400px tile at 1280 and 390. Reference script: the scratchpad `shoot.js` from the 09-02 session (recreate from this description; it is ~80 lines). |
| Brand walls | forest `#0c1f17`, Family Pink `#FF7AA2`, terracotta `#C8614B` (display-only on dark/ivory; body text `#d4775f` dark / `#a8503e` light; `--terra-soft #e08d76` is the only terracotta safe on both forest and elevated card), ivory `#FAF3E8`, seafoam `#6BAF8A`, soft pink `#FF8FAB`, sky `#7EC4F8` = Season One production accent only. Gold = Tamara Mark only, never on ivory. Family Pink on ivory fails contrast at every size. Fonts: Cormorant Garamond (display), Outfit (body), Bebas (large numerals only), Cinzel (SEASON ONE lockup only). No emoji. No em dashes in copy. Casing: `dwdPROSERIES`, `dwdCOLLECTIVE`. |
| Voice | Dixon's: warm, direct, choreographer-not-corporate. "Apply / earn your spot," never "sign up" for ProSeries. Deposits, never "all-inclusive." |
| Hardcoded chair counts | Fork facts (home), track tab chips, cast chips, pricing band, cast footer sentence = FIVE places. Prep 5/10, Elite 6/10, Pro 6/10 as of 09-02. §2.5 centralises this. |

---

## TIER 1 — conversion and trust

### 1.1 On-site Express Interest form (highest leverage)
**Why.** Every CTA today leaves for dwd-director.netlify.app at the moment of commitment.

**Build.**
- New section `#interest` on `#page-proseries`, placed where the "Now casting." block's CTA is (inside `#proseries-interest`, replacing the button row) AND reachable from every existing Express Interest CTA: change every `href="https://dwd-director.netlify.app/register?ref=..."` in `index.html` (hero, fork card, teaser, standing CTA, pricing band, page-end banner, mobile bar, nav CTA, early-access) to `#interest`. Keep the `data-track` attributes and append `data-ref="<old ref>"` so analytics keeps the surface. The hashchange handler already scrolls to element ids on other pages (it switches page first).
- Fields (labels above, one column, generous rhythm, per design-taste): Parent name · Email · Phone (optional) · Dancer first name · Dancer date of birth (`type=date`) · Experience (select: `none`, `recreational`, `competitive` — mirror `ChildEntry.experience_level` options in `AuditionRegistrationPage.tsx`; read that file for exact values) · How did you hear about us (select, mirror `HOW_HEARD_OPTIONS`) · "Anything you want Dixon to know" (textarea, optional). "+ Add another dancer" repeats the dancer trio (max 4). Honeypot input like the contact form. Consent line under the button: "Dixon replies personally, usually within a day. No fee to express interest." Privacy link.
- Submit inserts into `audition_registrations` with EXACTLY this shape (from `submitAuditionRegistration`):
  ```js
  { id: crypto.randomUUID(), parent_name, parent_email, parent_phone: phone||null,
    address:null, emergency_contact_name:null, emergency_contact_phone:null,
    emergency_contact_relationship:null, payment_method_preference:null,
    how_heard: how_heard||null,
    children: [{ name, date_of_birth, experience_level, preferred_track: assignTrack(dob)||'prep',
                 years_training:null, current_studios:'', medical_notes:'', allergies:'',
                 additional_notes:'', status:'registered' }],
    is_early_access:false, is_waitlisted:false, terms_agreed_at:null,
    source:'interest', family_note: note||null, status:'registered',
    payment_status:'comped', amount_cents:0 }
  ```
  `assignTrack(dob)`: age as of 2026-08-10 → `<8` prep, `8–11` elite, `12+` pro (copy the function from the React page verbatim). Any other `source`/`payment_status` combination is rejected by RLS.
- Success state replaces the form in place (no modal): "You're in the queue. Dixon will text or email you to set up a placement class." + the @dwdproseries follow link. Failure: inline error with the mailto fallback (pattern exists in `main.js` `showFormError`).
- Track the submit with `data-track="interest-form-submit"` through the existing `analytics.js` hook.
- Mobile sticky bar (`#mob-cta`) button → `#interest`.
- Keep `dwd-director.netlify.app/register` working; nothing in the app changes.

**Done when:** a submission from the site appears in the Director app's interest queue with `source='interest'`, `status='registered'`, child track assigned; zero CTAs on the site point off-domain except social links; 390px form has no zoom-on-focus (inputs ≥16px) and passes the Puppeteer pass.

### 1.2 Collective: a real next class
**Why.** An adult who wants to try cannot find a time.

**Build.**
- New block `#dwdc-next-class` at the top of `.collective-card` (above "Where We Dance"): eyebrow "Next class", Cormorant date line ("Sunday, September 14 · 2:00 pm"), venue line, price line ("$15 drop-in, pay at class"), ghost button "Save my spot" → `#contact` with `reason=adult` preselected (extend the contact form's toggle logic to read `?reason=` from the hash query, which `getPageFromHash` already strips).
- Data: `supabase.from('public_site_dwdc_events').select('*').limit(3)`. Render up to three upcoming; first is the hero card, the rest a compact list. Empty state (today): "Next class date is being set. Follow @dwd_collective or get on the list and Dixon will text you the date." Never render an empty box.
- Also feed the rail link "What's Next" and the `#dwdc-next` band: when the view has rows, the band's h3 becomes "Next up: {title}, {date}."
- **Dixon action (not code):** create the next dwdC class in the Director app calendar with `program=adult`, `event_type=open_class` or `class`. The site lights up automatically.

**Done when:** with one adult event in the DB the Collective page shows it in three places; with none, the empty state reads cleanly and nothing is blank.

### 1.3 Merch off the nav until it is real
- Remove "Merch" from the topnav `<nav>` and the footer Navigate list. Keep the `#shop` route alive (deep links still work) and add a small text link "Vote on the first merch drop →" inside the ProSeries page-end banner so the poll still gets traffic from the people it is for.
- If Dixon instead wants a real store: Fourthwall or Printful storefront, embedded as a link-out, is a separate decision. Do not build a cart.

### 1.4 Faces in every hero
Heroes that are currently logo-only: Teachers, Gallery, Merch, Contact, and the Collective hero's photo is scrimmed to mud.
- Teachers: the split hero keeps the terracotta band but the right side becomes Dixon in the room (`images/photos/opt/story-con-coach-*` or an SI teaching still; Dixon's face is his own release). Logo drops to a 72px mark next to the eyebrow.
- Gallery: hero photo = `story-si-firebird-1600.webp` (Daisy, released) with the forest scrim at 0.55, title over it. Logo removed.
- Contact: left column keeps the form; right column gets the b/w headshot behind the "Connect with DWD" card at 20% opacity, or simply a 3:4 crop of `bw-headshot`. Small mark stays.
- Collective hero: lower the gradient to `rgba(15,35,24,.55) → .78` so the A·Muse photo reads; move the big dwdC mark to 200px, bottom-right, 60% opacity, so the people are the hero. Re-check contrast of the ivory H1 over the lightest patch (must stay ≥4.5:1; add a text-shadow scrim if not).
- Rule from design-taste: text on images gets a treatment; one focal point per screen.

---

## TIER 2 — excitement and return visits

### 2.1 Home hero video loop
- Pick from REEL-READY "Hero moments": prefer a Season One / SI clip with a released dancer (Daisy firebird, John lift, Remi solo). Fallback: `ready-clips/teach-05_hero-arms-wide.mp4` (Dixon).
- Encode on the PC (never the Neo): `ffmpeg -i in.mp4 -t 7 -an -vf "scale=1280:-2,fps=24" -c:v libx264 -crf 28 -preset slow -movflags +faststart hero-loop.mp4` target ≤1.5 MB; plus a WebM VP9 at crf 36 for Chrome/Android. Poster = current `hero-1600.webp`.
- Markup: `<video autoplay muted loop playsinline preload="metadata" poster=...>` inside `.hero-photo`, `<picture>` stays as the poster/fallback and as the LCP for the preload link. Respect `prefers-reduced-motion: reduce` → do not autoplay (JS: `if (matchMedia('(prefers-reduced-motion: reduce)').matches) video.removeAttribute('autoplay')`). Below 600px keep the still (mobile data), unless the loop is <800 KB.
- Caption stays ("John Nuzzi · Solo Work · 2024" → update to the clip's dancer/year). Keep the `.git` size rule: repo is ~611 MB against a 1 GB soft limit; two files ≤3 MB total is fine, nothing more.

### 2.2 Living Episode Guide
- Replace the hardcoded `.s1-episode-list` with a render from `public_site_episodes` (fallback = the current static four rows if the fetch fails, so the section never blanks).
- Numbering: S1:E1 The Premiere (Aug 10, hardcoded, "Aired") · then one episode per view row in date order: `S1:E{n}` · title = comp name (strip "(Orlando I)" style suffixes only if Dixon asks; leave as-is) · meta = date range + location · state: `aired` if end_date < today ("Aired {Mon d}"), `next` if it is the first future one (sky chip "Up next"), else plain. Finale row stays hardcoded last (May 25, 2027). Brand mark: if `images/comps/{brand_slug}.svg` exists show it 20px left of the title; generate these once from the comp-brand kit assets (kit has 11 brands; only the DB slugs matter). Unknown slug → no mark, no broken image.
- After a comp airs, an optional recap: Dixon posts an IG link + one photo. Simplest version that survives contact with reality: a static JSON `data/episodes.json` in the repo keyed by comp id with `{ recap_url, photo, line }` that the renderer merges in. Opus builds the merge; Dixon edits the JSON (or a future Director-app field). Do NOT build an admin UI.
- ERAS.md: add a row that the fetch replaces static rows and what the static fallback contains.

### 2.3 Gallery becomes "Season One in photos"
- Restructure `#page-gallery`: hero (1.4) → "Season One" section first: the 24 `story-*` stills + cast signing shots already in `images/photos/opt/`, grouped by episode (Open House · Auditions · Summer Intensive · dwdCON · Signing Day · Kickoff · Week One), each group a `.gallery-grid` with the existing lightbox. → "The Collective" (A·Muse + Amusing Spaces, already present) → "Choreography" (the four YouTube embeds) → "From the archive" = the old CAA competition photos, collapsed under a `<details>` so they stop leading. Delete the "Professional" headshot block (five near-identical headshots of Dixon; one lives on Teachers).
- IG follow card stays at the top. Closing line becomes "Updated every episode."

### 2.4 One email capture with a promise
- Retire the `#page-early-access` route to a redirect → `#proseries` + `#interest` (add to `legacyHashRedirects`), delete its four era blocks from the DOM.
- New compact signup band on Home after the Episode-Guide-style teaser and on ProSeries after the Episode Guide: eyebrow "Episode recaps", line "One email per episode. Photos, results, what's next. Nothing else.", single email input + "Send me the recaps" button. Inserts `email_signups { email, source: 'episode-recaps-home' | 'episode-recaps-ps' }`. Success inline: "Done. First recap lands after the next episode." Duplicate (23505) = success.
- Delete the old "You're on the list" success modal path in `main.js` if nothing else uses it after this.

### 2.5 Parent voices + one source for chair counts
- `conv-quote` markup for Jill is staged in `#proseries-interest`; keep it commented until Dixon confirms in chat that Jill said yes. Build the component to hold three quotes (Cormorant italic, first name + "ProSeries parent"), style it once, ship with whatever is approved (zero is acceptable; the block must hide entirely when empty).
- Chair counts: create `js/season.js` (deferred, before main.js) exporting `window.DWD_SEASON = { chairs: { prep: {filled:5, max:10}, elite: {filled:6, max:10}, pro: {filled:6, max:10} } }` and have the five hardcoded places render from it on load (fork facts, track chips, cast chips, pricing band chips + "Thirteen chairs remain." total, cast footer sentence with number words). One edit updates all five. Add a comment at each render site pointing at the file.

---

## TIER 3 — professionalism under the hood

### 3.1 Real URLs for the sections
GitHub Pages is static, so:
- Build script `scripts/build-routes.mjs` (Node, no framework) that reads `index.html` and writes `proseries/index.html`, `collective/index.html`, `teachers/index.html`, `gallery/index.html`, `contact/index.html`, `privacy/index.html`, each a copy of the shell with: `<title>` and `<meta name=description>`, OG title/description/image swapped per route (table in the script; OG image per route = a real photo from that page, 1200×630 jpg generated once with ffmpeg/sharp into `images/og/`), `<link rel=canonical>` set to the path, and a `<script>` that sets `window.__dwd_route='proseries'` before main.js.
- `main.js`: on load, if `window.__dwd_route` is set and there is no hash, `showPage(route)` and `history.replaceState` so the URL stays clean; nav links become path links (`/proseries`) with a click handler that calls `showPage` + `pushState` instead of full navigation; `popstate` handled. Hash links (`#proseries`) keep working forever (redirect to path).
- `sitemap.xml` lists the six paths; `robots.txt` unchanged; `sw.js` precaches the six shells; 404.html keeps its redirect-to-home behaviour.
- All relative asset paths in `index.html` must become root-relative (`/css/...`, `/images/...`) or the sub-directory shells break. Grep for `src="images`, `href="css`, `url('images` and fix in one pass.
- Done when: `curl dancewithdixon.com/proseries` returns the ProSeries shell with its own title/OG; sharing the link in iMessage shows the Season One preview.

### 3.2 CSS consolidation + Manrope → Outfit
- Goal: one `css/site.css` (≈ the current union minus dead rules) plus `css/pages/*.css` for the three standalone pages (fullout/amuse/dwdcon keep their own files, untouched).
- Method, in this order, one commit each so a regression is bisectable: (a) drop Manrope from the Google Fonts URL and replace every `"Manrope"` in audition.css/poster-pages.css with `'Outfit'` (Outfit is metrically close; check the 213 elements at 1280 and 390 via the Puppeteer pass); (b) remove Cinzel except the `.s1-title`/`.s1ht-title` lockups; (c) run a coverage pass (Puppeteer `page.coverage.startCSSCoverage()` across all routes + both S1 states + `?launched=1`) and delete rules with zero coverage that also have no state-gated selector; (d) merge files in load order into `site.css`, keeping source order so the cascade is identical; (e) reduce `!important` only where the coverage pass proves the override is the only rule left.
- Never touch the `--oh-*` tokens used by dwdcon/fullout/amuse standalone pages (LIVE archive pages).
- Done when: the Puppeteer tiles before/after are pixel-equivalent on every route except the intended Manrope→Outfit glyph change, and the gzipped CSS is smaller than today's 65 KB.

### 3.3 Parent FAQ with structured data
- New `#ps-faq` section on ProSeries between "Why ProSeries" and "Teaching Philosophy" (add "FAQ" to the chapter rail in document order; the scrollspy depends on rail order = DOM order). `<details>` accordion, Cormorant question, Outfit answer, one open at a time not required.
- Questions and canonical answers (copy from existing site copy and MASTER.md; do not invent numbers): What is a placement class? (free, real class with the company, Dixon confirms track) · How are tracks decided? (age bands flex on readiness) · What does a season cost? (the three totals already published) · What are deposits? (the deposit paragraph, shortened) · How many competitions? (per track counts already on the cards) · When can a dancer join? (rolling placement all season) · Where and when are classes? (Exchange Dance, weeknights by track) · Is there a solo? (Pro offered, Elite chosen with Dixon).
- Add an `FAQPage` JSON-LD node to the `@graph` with the same Q/A text (keep it in sync by generating the JSON from the DOM at build, or hand-maintain and note it in ERAS.md).

### 3.4 Hygiene while in there
- `#page-campaign` (password-gated command center) and its `campaign.js` dashboard code: move to `campaign.html` standalone or delete; the reveal-gate engine and S1 state machine in `campaign.js` must stay (split into `js/eras.js`).
- `<aside class="sidebar">` + `.mobile-header` legacy markup: delete along with the `hamburger`/`sidebar` branches in `main.js` (topnav toggle is the only menu).
- `<meta name="keywords">` delete. `docs/ERAS.md` refresh. `sw.js` bump.

---

## Sequencing for the Opus session(s)

Session A (conversion): 1.1 → 2.5 (season.js first, then the form) → 1.2 → 1.3 → 1.4 → 2.4. Puppeteer pass, commit per item, push branch.
Session B (excitement + plumbing): 2.1 → 2.2 → 2.3 → 3.3 → 3.4 → 3.1. Puppeteer pass, push.
Session C (CSS): 3.2 alone, with before/after tiles.

Deploy is never part of these sessions. `main` merge = Dixon's word.

## Open on Dixon (the plan does not block on these)
1. Put the next dwdCOLLECTIVE class in the Director calendar (program adult) so 1.2 lights up. (Dixon 09-02: none scheduled yet, coming soon — the empty state in 1.2 is the launch state.)
2. Jill's yes on the quote; two more parent quotes.
3. ~~Merch~~ DECIDED 2026-09-02: ditch Merch for now (poll off nav; §1.3 default stands, no store).
4. ~~Register alias~~ DROPPED 2026-09-02 (Dixon): Netlify needs a primary custom domain for the app before any alias, and 1.1 puts the form on the site anyway. The CNAME briefly added at Wix was removed the same night. If the app ever gets a real address, it is `app.dancewithdixon.com`, its own session.
5. ~~Hero clip~~ DECIDED 2026-09-02: Daisy firebird for now.
