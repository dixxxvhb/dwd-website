# dancewithdixon.com: site review with analytics, 2026-09-24

Martha (Claude Code, Opus 5.5). Dixon asked for a look over every page and form, for function, beauty, branding and wayfinding, with the analytics deciding what works. Three passes: 90 days of `site_analytics` + the lead tables, a live functional QA of every route and form with all writes intercepted (report: session scratchpad `qa-functional.md`), and a visual/brand read of every page at 390 and 1280 against design-taste.md.

## What the analytics say
- **The Sept 16 to 21 Instagram ad** (utm_medium=paid, campaign 52581481047091): 1,023 sessions, all phones, all to `/schedule`. 1.0 pages per visit, 1% tapped anything, median 3.1s, **0 drop-in bookings** (`drop_in_orders` holds one test row). ~630 landed Friday to Sunday.
- **By source, 90 days** (median time on site · % that tapped something): Google 62s · 23%; Instagram organic 55s · 22%; ChatGPT 44s · 34% (35 visits, real and growing); Facebook 15s · 9%; direct/texted 6.5s · 6%; the paid ad 3.1s · 1%. People who come looking read; cold traffic bounces.
- **Organic traffic** is 50 to 100 sessions a week. From Home, next pages are ProSeries (57), Teachers (33), Contact and Collective (15 each). Teachers has the longest dwell (19.5s median) after ProSeries (16.8s).
- **Leads:** the contact form works and writes to `website_contacts` (a Collective inquiry landed 2026-09-24 19:35 ET). The last three contact messages are all adults asking to join the Collective, while the Collective page says the next class date is being set. No `audition_registrations` since 08-10 and no `email_signups` since April, but QA proved both forms would write today: the silence is demand, not breakage (and before tonight the site could not tell).

## Why the ad failed (live QA + render)
1. Thursday night to Sunday, `/schedule/` opened on an empty "This week": "No classes this week."
2. "Pick your dates" scrolled the week switch and the October jump under the fixed nav: a dead end on a phone (P0 in QA).
3. Header in member language ("PROSERIES / This week at ProSeries ... Rows with a price are open for drop-ins") under an ad that said "No audition. Just drop in."
4. The five class rows in the drop-in panel were not tappable; the first Add button was 1.6 to 2.2 screens down; the next week had 16 to 17 rows and one bookable.
5. Separately (other session, fixed in the DB 09-24): the booking function refused dates more than 21 days out.
6. Slow 4G + 4x CPU: blank for ~2s (first paint 1.8 to 2.3s), five video posters from other pages download on every route (143KB, 29% of the page).

## LIVE (main, pushed 2026-09-24)
- **d00901f + 3f4306b** Schedule first load walks to the first week with a bookable drop-in and says so; "Pick your dates" lands on the week switch below the nav. Verified live.
- **a532031** Analytics: `scroll` (25/50/75/100 per page view), `form` (`<form>:start` / `:invalid` / `:ok` / `:err` for contact, signups, ProSeries interest), `perf` (`tracker` = ms until analytics.js ran, `lcp`). `window.__dwd_track(name)` for other scripts. The Director's traffic RPCs filter by event_type, so its counts are untouched.
- **3f4306b** Interest form: first dancer DOB max + future dates refused; error lines ("the dancer's first name", no more "your your name", "choose" for selects); v4 uuid fallback (the old fallback failed the insert).

## ON BRANCH, waits for Dixon's look: `dropin-finder` (b823e16, worktree `~/Code/dwd-website-finder`)
Plan: `docs/plans/2026-09-24-drop-in-finder.md`. `/schedule/` becomes the drop-in page: forest ground, "No audition. Just drop in.", the five classes each with their next dates as tap chips (Full / 2 left / added states), two taps to the checkout form, `?class=<slug>` deep links (Home and ProSeries panel rows link to them), the full ProSeries week behind one toggle, nav CTA "Drop in", new title/description. Also: bulk-discount note elements restored (missing since a hand-edited shell was overwritten), schedule.js runs only on the schedule route (it called the RPC on every route), midnight-to-1am "already started" bug fixed, checkout tracking (`dropin-checkout:invalid/err/ok`, chip and toggle data-track). Screenshots: session scratchpad `finder/`. Merge = fast-forward-ish merge of `dropin-finder` into main, then `build-routes --check`, `build-css --check`, `scripts/qa/shoot.js`, live check.

## NEEDS WORK (ranked by what the numbers say)
1. **Collective has demand and no date.** 3 of the last 3 contact messages; page is 9,000px of June history with centred body copy and "next class date is being set". Needs a date from Dixon, then the one-screen joining layout (audit 09-22 NOT DONE list).
2. **Teachers is the second stop from Home** and has the longest dwell: Tori (who teaches the T&F drop-in) and John are initials placeholders ("TU", "JN"); bio claims ruling still open.
3. **ProSeries runs five grounds** (navy Season One, forest, ivory, hot pink, terracotta) and four type treatments; price comes before "what it is". Agreed direction "one background" still undone.
4. **Home**: "THIS WEEK" labels evergreen content; chair counts said three ways; ~250px dead forest bands around the Season One band, the Tokyo Sunrise video and the quote.
5. **Contact**: underline-only fields barely visible; "MESSAGE" label jammed under the reason pills; the two Instagram handles in different sizes.
6. **Speed for cold traffic**: video posters in hidden sections load on every route; supabase-js 218KB for a few inserts (09-22 NOT DONE list).
7. **Small**: legacy `/#proseries` shows Home for ~0.5s; the phone footer's "|" separator wraps to its own line; checkout waiver checkbox 13px (fixed on the branch).

## DIXON'S CALLS
1. Look at the drop-in page screenshots and say merge (the campaign runs to Oct 8; first October classes Tue Oct 6).
2. Collective: the next class date (or a standing night) so the page and the 3 waiting adults have something to say yes to.
3. Photos of Tori and John for Teachers, or drop the placeholder tiles.
4. Still open from 09-22: Teachers bio claims, @dixonbowles absent from the site, waiver wording, "dwdCON returns this season", the young-looking headshot.
5. Next ad: point it at `/schedule/?class=<slug>` for the class it shows (live once `dropin-finder` merges).
