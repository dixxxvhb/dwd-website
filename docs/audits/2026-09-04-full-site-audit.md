# dancewithdixon.com — full-site audit, 2026-09-04

Scope: functionality, content correctness, navigation/redundancy, responsive/a11y/perf, plus a design-taste pass. Four finders (opus) ran against the local tree at main 80a0b52 and the live site; Fable spot-verified the high items. FINDINGS ONLY — nothing was changed. 64 findings, 11 high. Raw JSON + screenshots + nav map are in the session scratchpad (`audit/`).

## What is solid (verified)
- All 7 main routes at 1280 and 390: no console errors, no failed requests, no broken images, no dead anchors, no horizontal overflow at 390/768/1280/1920.
- Every off-domain link returns 200; Instagram handles correct; the only mailto is dancewithdixon@gmail.com.
- All five forms post to Supabase REST; anon SELECT on every submission table returns zero rows (RLS holds).
- Service worker is network-first for HTML/CSS/JS with cache v40 purge — a deploy cannot strand a visitor on stale markup.
- Prices, chairs, dates, FAQ JSON-LD, Tamara Mark geometry, brand blocks (no iDance, no Van Hoozer, no Malik, no "sign up", no "no extra fees", no emoji, no sage) all clean.

## HIGH — fix these
1. **Dead legacy pages are still live and selling past events.** `dwdcon.html` and `fullout.html` load `js/campaign.js`, which was deleted in 90776cb and 404s in production, so their era-gate never runs. fullout still shows "Register & Pay / closes July 5" for the July intensive; dwdcon shows three "Get Your Badge" CTAs. Both are in sitemap.xml with zero inbound links, and their meta/OG descriptions still sell the events (that is what Google shows). fullout also calls the studio "Exchange Dance Academy" five times. Recommendation: delete both pages (or 301 them to /proseries/), drop from sitemap.
2. **Bio facts Dixon must rule on.** Teachers bio: "For nine years, I ran the competitive dance program" (it was 4 teaching + 5 directing, and the same paragraph says "five competition seasons"). Home Track Record stat: "9 / Years directing a youth competition program" contradicts ProSeries' own "five years as a competition director". Bio + home creds strip: "performed with professional dance companies in New York" / "NYC professional company" — not in the canonical bio. Locations: index.html:505-515, :545, :1911; teachers/index.html:539, :1905.
3. **ProSeries is 32,328px tall at 390px.** The Cast section alone runs 7,955→20,015px; prices land ~24 screens down and the interest form at 29,712px. A parent on a phone will not reach the money or the form. Recommendation: collapse Cast to a compact grid, move Tracks + prices above it, and put the interest form within two screens of the hero.
4. **No primary CTA in mobile chrome on four pages.** `.topnav .nav-cta { display:none }` at the phone breakpoint (css/site.css:3255, :3267) including inside the open menu, and `#mob-cta` only renders on Home and ProSeries. Collective, Teachers, Gallery, Contact have no Express Interest anywhere on a phone.
5. **Teachers page fails contrast.** "Get in Touch" primary button is ivory on `--oh-coral #d97757` at 2.73:1 (site worst). Hero eyebrow + 19px italic sub are ivory on #c25b46 at 3.77:1. Also on Home: track badge "Pro" ivory-on-terracotta 3.62:1, terracotta eyebrows on forest 4.30:1 at 10-11px. Terracotta is display-only on forest/ivory per the palette canon — body-size text on it needs the darker/lighter variants.
6. **311KB unminified render-blocking site.css on every route, ~6% used per page.** Plus all seven scripts and the 54KB Supabase bundle load on /privacy/, which uses none of them. Home cold load at 390px is 3.09MB (702KB hero webm with no phone variant; 1.64MB images). Teachers pulls a further 739KB of slideshow photos while idle.

## MEDIUM — friction a visitor notices
- **404 is a silent redirect to home** (404.html:14-25) — a mistyped URL just lands on the home page with no message. Give it a real not-found page.
- **JS off = every route renders the Home section** under the wrong title/canonical (js/main.js:34-60). Low traffic, but crawlers and link previews can hit it.
- **Collective → Contact deep link is broken.** `#contact?reason=adult` (index.html:673) never pre-selects "Adult Company" because the path router drops the query (js/main.js:651 vs :1195). And the reason toggle itself produces no visible change in the form (both reasons render byte-identical HTML), so the toggle is a click that does nothing.
- **Redundant clicks and repeats:** Express Interest appears 4x on Home and 5x on ProSeries (on the 390 home shot the pink button and the sticky pink bar sit in the same viewport). Collective links to Contact three times under three labels (:673, :730, :753). Director credentials are told three times (Home :530-550, ProSeries :1607, Teachers :1911). The recaps email form is duplicated word for word on Home and ProSeries (:483-493, :1723-1735). The firebird photo is used four times, twice on Gallery.
- **Dead ends:** Gallery's only bottom links leave the site to Instagram; Teachers' single CTA is "Get in Touch", not the ProSeries funnel. Neither page hands the visitor to the next step.
- **Gallery lightbox bugs:** next/prev walks out of the gallery into other pages' photos (77 `[data-lightbox]` nodes vs 41 gallery images, js/main.js:362, 403-407); the gallery hero image is the one image without `data-lightbox` (:2001); the lightbox image is served full size with no srcset.
- **Teachers auto-carousel:** 12 slides, no controls, no pause, no reduced-motion check (js/main.js:1137-1159) — an ambient animation with no job, and it is what triggers the 739KB idle fetch.
- **Anchors land under the sticky chrome on /proseries/** (scroll-margin-top 90px vs actual chrome height, css/site.css:6921, :8714).
- **Sub-44px tap targets** on the three primary mobile form buttons (Send me the recaps, Send message, + Add a dancer).
- **Mobile menu does not lock body scroll**; page scrolls behind the open menu.
- **Orphaned public pages:** amuse-in-space.html (linked, canonicalised, missing from sitemap; publishes a personal 208 Idaho phone number at :66), amuse-story-ig.html and merch-poll-ig.html (Instagram assets, publicly served, "Now Voting", broken in a browser, blush #f8d7c8 still in amuse-story-ig). The hidden #page-shop merch poll has no store behind it. Remove or `noindex` all four; move IG assets out of the site root.
- **A·Muse cast line says "ages 16+"** (index.html:800) while the Collective is 18+ everywhere else — already on Dixon's open list from the rebrand.
- **Brand drift, needs a ruling:** the site-wide nav CTA and ProSeries hero CTA are sky blue `--s1-sky #7EC4F8` (css/site.css:7421). It is a deliberate Season One token, but it is off the family palette and it is now the most-clicked colour on every page including Teachers and Privacy. Either scope it to the ProSeries hero or make it Family Pink like the home CTA.
- **Casing:** "DWD ProSeries" / "DWD Collective" alongside dwdPROSERIES / dwdCOLLECTIVE (index.html:96, 99, 656, 1914, 2417). Home meta description calls the parent brand "a dance collective", colliding with the arm name (index.html:12, manifest.json:5).
- Heading order skips a level on /contact/ and /privacy/. Footer privacy link uses a hash while every other nav link uses a path (:2437, :1854).

## LOW
- robots.txt disallows /analytics.html, which no longer exists. Home canonical lacks the trailing slash the sitemap uses. js/amuse-form.js ships but nothing loads it. fullout.html loads no analytics. Phone placeholders use the 555 exchange. Stale "Season One begins August 10, 2026." still in ProSeries markup (:932, JS-gated). PWA manifest + offline caching on a brochure site (harmless, but it is a feature with no job). Code comment at index.html:290-294 describes the opposite of what the CSS does.

## Design-taste pass (Fable, from the rendered tiles)
- **Home at 390 has two heroes**: a captioned photo hero, then a full text hero. The eye has nowhere to land first. Pick one: photo with the wordmark over a scrim, or text over the loop.
- **Same-viewport duplicate CTA** on Home mobile (pink button + sticky pink bar). The sticky bar should only appear once the inline button has scrolled off.
- **Teachers hero is the loudest surface on the site** (full terracotta panel, ivory type) and it is the page with the contrast failures. Terracotta as a wash is fine; as a full-bleed block it competes with the photo beside it. Two heroes = zero heroes.
- **ProSeries reads as a different brand.** Navy gradient, sky-blue type, sky CTA. The Season One identity is good theatre, but it should live in the hero only; the rest of the page (and the global nav CTA) should return to forest/pink/terracotta.
- Everything else at desktop width is clean and on-register: the type stack, the spacing scale, the nav, the footer mark all read as the same house.

## Recommended order
1. Kill dwdcon + fullout (+ the three orphan root pages), fix the sitemap and robots — one commit, zero design risk.
2. Dixon rules on the three bio claims; fix the numbers.
3. ProSeries mobile length + mobile CTA on every page + Teachers contrast — one build, one deploy.
4. Redundancy pass: one Express Interest per screen, one credentials block, one recaps form, Collective → Contact once, gallery lightbox scoped, carousel gets controls or goes.
5. Perf: purge/minify site.css, scope scripts per route, phone-sized hero loop.

## Resolution — 2026-09-05, commit 800095d (live)
Every high and medium item above is fixed and deployed, plus the lows except the PWA/service-worker one (kept, harmless). Deviations from the report's recommendations: ProSeries at 390 is 14,526px (not ≤12,000) — prices sit one screen down and the form at ~5,100px, story collapsed behind a phone-only disclosure; Collective keeps ghost buttons per the hushed-volume rule; served CSS is 192KB raw / 31KB gzipped (a 120KB raw target needs a refactor, not a prune). Briefs: docs/plans/2026-09-04-audit-fixes.md. Blunt reset `#page-proseries * { padding:0 }` noted, untouched.
