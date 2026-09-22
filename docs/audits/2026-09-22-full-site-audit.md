# dancewithdixon.com: full-site audit, 2026-09-22

Three parallel audits against main 8dd7931 (live and local byte-identical): performance/SEO/accessibility (Lighthouse + Puppeteer, throttled phone and desktop), visual/UX/motion (rendered at 390 and 1280, judged against design-taste.md), functional QA + content truth (every route, routing, schedule cart, forms intercepted, copy vs canon). Fixes were built on branch `audit-0922` (worktree `~/Code/dwd-website-audit`) and verified with `scripts/qa/shoot.js` (ALL CLEAN), `build-routes --check`, and a session QA script (direct loads, Home to Schedule pager, checkout, analytics, privacy hand-off, Pacific time zone), locally and against the live domain.

## LIVE (pushed to main, 2026-09-22)

**6766805, functional**
- The October week pager existed only in the generated `schedule/index.html` (705630c edited build output). Anyone reaching Schedule from Home, the nav or the sticky bar got dead chips and could not reach October. Ported to `index.html`; the next rebuild no longer reverts it.
- Every route shell ships its own section active (build-routes). Before: ~0.9s of Home painted on every URL on a phone, Home for anything without JS, Home's hero downloaded on every route.
- /proseries/ opened ~370px down (chapter rail `scrollIntoView` scrolled the window). Route changes scroll to top instantly; the first Tab reaches the skip link.
- Analytics: pushState navigation never fired `hashchange`, so no in-site page view was ever recorded; in-page anchors (#ps-faq) logged as pages; clicks logged against the destination page. Now `showPage` fires `dwd:route`. **Funnel numbers from before 09-22 undercount everything past the landing page; re-baseline from 09-22.** Headless/automated browsers are skipped; ~207 audit rows were deleted from `site_analytics` (17:45 to 18:40 UTC, widths 390/1280/412/1350, plus one probe row).
- Leaving the privacy shell (no supabase-js) is a full load, so the schedule/forms keep a client.
- schedule.js: week math off the NY date (Sunday-night 400 for Pacific visitors), stale responses ignored, started classes pruned from the cart, "Opens Oct 1" only when it opens before that class, bulk threshold from the feed, checkout scrolls to the form and validates each field, bad/expired Stripe returns fall back to the schedule.
- now.js: DROP IN panel skips started and full classes, uses the real class day, "1 spot left".
- sw.js v44: same-origin GETs only, precache the shell (not 8 route copies, ~390KB), navigations cached by bare path (no Stripe order tokens in storage), no index.html standing in for a script, photos stale-while-revalidate in a capped cache.

**5cc4df1, performance + hygiene**
- YouTube: five iframes in hidden sections pulled ~1MB (player JS, doubleclick pings, cookies) onto every route including /privacy/, which says the site uses no cookies. Now a thumbnail button; tap loads youtube-nocookie.
- supabase-js pinned to 2.117.0 + SRI (was floating `@2`); preconnect to the project host.
- Hero logo SVGs embedded the full Outfit font to draw 3 to 10 letters: 166KB to 21KB each, pixel-identical. **The generator (`~/Code/dwd-logo-v2/scripts/render-statics-v3.mjs`) still embeds the full font; subset there before the next re-render or this regresses.**
- `data-lcp="<route>"` hero images are eager + high priority in their own shell, lazy elsewhere (Teachers LCP was a lazy image, 6.8s on a phone).
- prefers-reduced-motion now wins (`!important`).
- Em dashes out of visible copy; home og:description no longer calls the parent brand "a dance collective"; DOB max is today; 404 drops the unused 309KB stylesheet and links This week's classes; offline.html noindex; `_config.yml` keeps docs/, scripts/ and design notes off the public site (they were served at 200).

## ON BRANCH `audit-0922`, waiting for Dixon's look (b6aa8e9)
Before/after sheet was sent in the session. Merge = fast-forward main to the branch.
- ProSeries: the orphaned `#page-proseries *, .amuse-feature *` selectors (left glued to a `padding: 0` rule by the 09-03 stylesheet merge) zeroed every element's padding. Removed; snap/pixdiff + side-by-side review of every section at 390 and 1280 (page +179 to 292px, nothing broken).
- ProSeries interest form: submit and "+ Add another dancer" were pink on the pink band (invisible). Forest now. Labels full forest; "(optional)" muted by weight (was 2.4:1).
- Pricing bullets: the em-dash override printed over the words; back to the base dot.
- Home: hero buttons no longer fade in last (were fully visible at ~1.6s); headline entrance ~0.8s; Ken Burns and the Season One gloss loops removed; "Spots Remain" band deleted (fourth chair message on Home, off-palette wash).
- Sticky phone bar steps aside while any same-action link is on screen.
- Nav solid forest (the glass went grey-green over ivory, brown over orange photos).
- Contrast fixes (schedule kicker, jump line, closed rows, drop-in footnote, home cite, Collective h2, contact help).
- Gallery phone grid two columns (was one 294px column, 11,700px page); faculty headshots square instead of stretched 342x640.
- `text-wrap: balance` on headlines; `#sched-list` clears the nav; footer nav gains Schedule; waiver page loses its "Generated from drop-in-waiver.md" toolbar text (that page is generated in the dwd repo: fix the template there too).

## DIXON'S RULINGS (2026-09-22, same session)
- **1 → advertise all drop-ins.** The DROP IN panel (Home, ProSeries, Schedule) now lists every weekly drop-in slot from the feed (time, class, track + ages, price; "from Oct 6" under the time when a slot starts more than a week out), numeral = the lowest price with "to $25 a class"; sticky bar "5 drop-in classes every week · Drop in · from $20"; ProSeries footnote no longer names one age band. On branch `audit-0922`.
- **2 → drop-in times match the Director feed.** Elite/Pro weekly blocks corrected: Tue 7:00 Contemporary (was "Rotation"), Pro Tue 6:00 Advanced Technique & Tricks (was "Rotation"), Wed Jazz 4:15 to 5:45 (was 4:00 to 5:30), Wed 5:45 Acro (was Competition Choreography 5:30); day hours recomputed; Pro description updated. On branch.
- **3 → all photo releases are on file.** Item 5 closed; nothing to remove.
- **4 → the gold sparkle in the v3 logo references Tamara.** Sanctioned; not a gold-rule violation.

## NEEDS DIXON'S RULING (original list; 1, 2, 5 and 4-gold answered above)
1. **October drop-in panel:** from Sep 30 the live feed makes Ballet ($25/$90, ages 10+) the next open class, so the panel and sticky bar switch to it, while the ProSeries footnote still says "$20, ages 5 to 9". Sell the next open class, or always Prep Technique & Flexibility?
2. **Track schedules vs the Director app:** Prep says two days (Mon/Thu) but the Prep drop-in runs Tuesday 4:45; Elite/Pro Wednesday Jazz is 4:00 to 5:30 on the site vs 4:15 to 5:45 in the feed. Elite "4 to 6 routines" vs "5 routine minimum"; Pro "5 to 8" vs "6 minimum". Elite track says ages 8 to 12, some Elite+Pro feed classes say 10 and up.
3. **Teachers bio:** claims not in the canonical bio (Fly Dance Tour Director, ADCC Studio of Excellence, judging/masterclasses, titles at Groove/Inferno/Tremaine/StarQuest); canon items missing (Weber State, UVU adjunct, Dynamic Dance).
4. **Gold:** the v3 logo carries a gold sparkle on every page; the brand rule says gold is the Tamara Mark only. Sanctioned?
5. **Photos (check `students.photo_release_granted`):** pool photos of kids in swimsuits on /gallery/ and the ProSeries story (auditor recommends removing); CAA-era kids' faces in the Teachers collage; kids' names on dwdCON badges; 17 first names in the cast grid; hero entries A (John), B/M (Summer Intensive showcase, several dancers in frame), C/D/E (John, CAA-era Groove), F-I (Collective adults, verbal clearance), J (Daisy), K (check for students in frame).
6. Hero entries F (muddy silhouettes), J (heads cropped at phone size, previously kept) and K (soft low-angle frame) read weak on a phone.
7. @dixonbowles is nowhere on the site. Intentional?
8. The drop-in waiver says "No other fees" and "enrollment, which is by audition" while the site says "By application" (dwd repo source).
9. "dwdCON returns this season" on ProSeries: keep the promise?
10. The black-and-white Dixon headshot on /contact/ and /teachers/ reads much younger than every other photo.

## NOT DONE (next sessions, ranked)
Design (worth doing, layout-changing):
- ProSeries on one background (forest page, ivory only for money, pink as accent, sky-blue Season One inside the hero only). Already the agreed direction in STATUS; about a day of CSS.
- Schedule as a drop-in finder: open drop-ins by default, "show the full ProSeries week" toggle, every closed row labelled; checkout as a bottom sheet.
- Collective as one joining screen (what, who, $15, next class, Join) with past shows behind one toggle (10,700px on a phone, mostly June).
- Desktop home hero: one full-width photo with wordmark + CTA over a scrim; today three logo marks compete and the photo gets 29% of the width.
- One faculty photo set (4:5, 1200px sources, real photos for Tori and John).

Technical:
- Split ProSeries-only CSS (71KB, 35%) into its own non-blocking file; minify JS; self-host fonts with metric fallbacks (the only CLS is the font swap); consider Cinzel 800, which is requested on every page.
- Replace supabase-js (218KB, 13.5% used) with a ~30-line fetch helper; schedule.js fetches the feed on every route, and Home calls it twice.
- Video posters in hidden sections download on every route (143KB on Home); Collective hero is a 1600w CSS background on phones (5.5s LCP); several WebP encodes are heavy (re-encode ~q72); hero loops list WebM first though MP4 is smaller.
- FAQPage JSON-LD on all 8 URLs (visible only on /proseries/); EventSeries/founder URLs still hash links; LocalBusiness geo is the generic Orlando centroid; short generic titles ("Gallery | DWD").
- Footer `<h4>` breaks heading order; `article role="tabpanel"`; eras.js runs a 1s timer forever for removed markup; tap targets under 24px (s1ht-link, week jump, recaps input on ProSeries, contact info links); checkout checkbox 16px.
- QA scripts drifted: `live.js` expects 7 episodes / Titans next / 12 chair sites; `routes.js`/`shoot.js` don't cover /schedule/ or in-site navigation to it (that gap is why the pager bug shipped).

Scroll performance was fine throughout (p95 17.1ms at 4x CPU slowdown, CLS under 0.04): none of the motion problems were performance problems.
