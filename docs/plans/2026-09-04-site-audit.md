# dancewithdixon.com full-site audit — finder briefs
Date: 2026-09-04 · Repo: C:/Users/bowle/Code/dwd-website (branch main = LIVE on GitHub Pages) · Author: Fable
Scratch dir (write ALL output here): C:/Users/bowle/AppData/Local/Temp/claude/C--Users-bowle/6348c57c-dc52-4d10-bf9a-f040f1516631/scratchpad/audit

## 0. Shared rules for every finder
- THIS IS AN AUDIT. FINDINGS ONLY. Do not edit, create, or delete any file inside the repo. Never commit, push, or deploy.
- Do your own recon: read the repo (index.html, proseries/, collective/, teachers/, gallery/, contact/, privacy/, 404.html, offline.html, the loose root pages amuse-in-space.html, amuse-story-ig.html, dwdcon.html, fullout.html, merch-poll-ig.html, css/, js/, data/, sitemap.xml, robots.txt, manifest.json, sw.js) and scripts/qa/README.md.
- Rendering: the Claude browser pane does NOT work on this site. Use the repo's Puppeteer harness (scripts/qa/*.js — read README.md first; Puppeteer resolves from ~/Code/DWDC-Instagram-Posts/node_modules/puppeteer). Local static server: `python -m http.server 8790 -d C:/Users/bowle/Code/dwd-website` — check whether port 8790 already answers before starting one (another agent may have started it); never kill it. Live site = https://dancewithdixon.com (curl is fine for HTTP checks).
- Report only concrete, reproducible findings with a location (file:line or URL + selector) and a one-line "how to reproduce / what I saw". No style nits, no speculation. Severity: high = broken, wrong, or misleading for a visitor; medium = friction or inconsistency a visitor would notice; low = polish.
- Write findings to `<scratch>/findings-<dimension>.json` as {"findings":[{"title","detail","location","severity","repro"}]} AND end your reply with the fixed report format below.
- Put screenshots in `<scratch>/shots-<dimension>/` where relevant (named by route and width).

Report format (fixed):
```
STATUS: done | partial | blocked
WHAT I RAN: <commands, one per line>
FINDINGS: <count by severity>
TOP 5: <one line each, severity first>
VERIFIED vs BELIEVED: <one line each>
OPEN / BLOCKED: <anything you could not do, and why>
```

## A. functionality (dimension key: functionality)
Everything a visitor can click or submit works, locally and live.
- Run `node scripts/qa/shoot.js <scratch>/shots-functionality --tiles` for every route (read README for routes.js). Record console errors, failed requests, broken images, dead anchors, horizontal overflow.
- Curl every route in sitemap.xml on the LIVE site (200 + correct canonical), plus 404 behaviour, robots.txt, manifest.json, sw.js. Compare sitemap to actual pages: pages missing from sitemap, sitemap entries that 404.
- Forms: find every form/CTA (express-interest funnel, contact, collective interest, newsletter). GitHub Pages cannot handle POST — determine where each form actually submits (Formspree? a Netlify function on another domain? mailto?) and test whether the endpoint answers (HEAD/OPTIONS or a documented test path; do NOT submit real data that emails Dixon — if the only test is a real submission, report "untested" and say why).
- External links: list every off-domain href, check each returns 200 (follow redirects), flag Instagram handles that are wrong (@dwdproseries, @dwd_collective, @dixonbowles are correct; @dancewithdixon is NOT an Instagram handle), mailto/tel formatting.
- Service worker: read sw.js — cache strategy, versioning, whether a deploy can leave visitors on a stale page or a stale CSS/HTML mismatch; whether offline.html is reachable.
- JS: every script in js/ — does anything throw, depend on a missing element on some pages, or run on pages that do not need it.

## B. content correctness (dimension key: content)
Every fact, name, price, date, and phrase on the site is right against these ground truths (they are authoritative; the site is not):
- Business: Dance With Dixon LLC, Orlando. Parent brand "DWD" (never "DWDC" as the parent). Arms: dwdCOLLECTIVE (adult modern company, ~15 dancers, rehearses at Exchange Dance Orlando or Next Level St. Cloud) and dwdPROSERIES (elite youth training, audition-gated: copy says "apply"/"earn your spot", NEVER "sign up"/"register for a class"). Tracks: Prep $195/mo, Elite $310/mo, Pro $360/mo, max 10 per track, $50 one-time registration. Costume + competition monthly fees are DEPOSITS toward a real total — copy must never say "no extra fees" or "all-inclusive".
- Season 1: Aug 10, 2026 – May 25, 2027. Auditions were June 6, 2026 (past); Summer Intensive July 6–10, 2026 (past). New enrollment = express-interest funnel. Anything presenting auditions/intensive as upcoming is wrong.
- HARD BLOCK: "iDance Orlando Festival" (April 25, 2026, cancelled) must not appear anywhere. A·Muse in Space (June 27, 2026, Orlando Ballet, Aric Barrow) is PAST — check tense on amuse-in-space.html and any link to it.
- Dixon: "Dixon Bowles" only — never "Van Hoozer-Bowles" on anything new. Bio facts: teaching since 16; Weber State 1 yr, Utah Valley University 2 yrs; Disney Jr Live tour; adjunct Jazz at UVU; Dynamic Dance Studio director 1 yr; 9 years at Celebration Arts Academy (4 teaching + 5 as Competition Director), departed April 2026 — PAST TENSE only. "100+ competition pieces" — never "30+" or "dozens". Do NOT reference Malik anywhere as a ProSeries teacher. Rotation teachers: Jackson (hip hop), Madi Sprague (tap), Tori Ugalde.
- Instagram handles: @dwdproseries, @dwd_collective, @dixonbowles. @dancewithdixon = YouTube + email only.
- Brand: colors forest #0c1f17, Family Pink #FF7AA2, terracotta #C8614B, ivory #FAF3E8; dwdPS adds seafoam #6BAF8A + soft pink #FF8FAB. Retired: blush #f8d7c8 and sage (any sage green) — flag if present in css/ or inline. Gold is the Tamara Mark memorial ONLY (two overlapping unfilled gold circles, right one slightly smaller and higher) — flag gold used as a general accent, and flag gold on ivory. NO emojis anywhere in UI/copy. Fonts: Cormorant Garamond, Outfit, Bebas Neue (Bebas = large numerals only). Casing: lowercase dwd + CAPS sub-brand (dwdPROSERIES, dwdCOLLECTIVE) when abbreviating.
- Also check: title, meta description, OG/Twitter tags, canonical per page (unique, accurate, not copy-pasted); FAQ JSON-LD (data/ + scripts/build-faq-jsonld.mjs) matches visible FAQ text and the facts above; copyright year; 404.html and offline.html copy; the loose root pages (dwdcon, fullout, merch-poll-ig, amuse-story-ig) — dated, orphaned, or still true; spelling and grammar; any TODO / lorem / placeholder / [bracket] text; any past date written as upcoming.

## C. navigation, IA, and redundancy (dimension key: ux)
Is the site professional, easy to get around, and free of repeated or useless features and clicks?
- Build the full route + nav map: header nav, footer nav, mobile nav, in-page anchors, every CTA button/link per page (text, destination). Output it as `<scratch>/nav-map.md`.
- Orphans: pages not linked from any nav/footer (list them); pages linked from nav that are thin or duplicate another page.
- Redundancy: the same CTA repeated on one page more than twice; sections that say the same thing on two pages (home vs proseries, home vs collective); duplicated about-Dixon blocks; footer content duplicating header; two links that go to the same place with different labels; features with no purpose for a visitor (a gallery with no lightbox or a lightbox with one image, a poll page, PWA install/offline on a marketing site, a toggle that changes nothing).
- Click depth: count clicks from the home page to (1) express interest in ProSeries, (2) contact Dixon, (3) learn ProSeries prices, (4) see the Collective, (5) see the teachers, (6) Instagram. Anything over 2 clicks is a finding.
- Dead ends: pages whose bottom has no next step; CTAs that scroll to a section instead of doing the thing; buttons that open a modal that just contains a link.
- Consistency: nav order/labels identical on every page; active state; logo goes home on every page; the same component styled differently on different pages (headers, buttons, cards).
- Mobile nav (390px, via Puppeteer): hamburger works, menu closes on navigate, no trapped scroll, tap targets at least 44px.
Use the Puppeteer harness for anything rendered (write screenshots to `<scratch>/shots-ux/`).

## D. responsive, accessibility, performance (dimension key: quality)
- Puppeteer at 390, 768, 1280, 1920 for every route: horizontal overflow, text clipping, overlapping elements, images stretched or letterboxed, hero text over photo unreadable (use scripts/qa/contrast.js on hero headlines and any text-over-image), sticky header covering anchor targets, layout jumps from lazy images.
- Accessibility: heading order per page, missing alt (or decorative images without alt=""), links with no accessible name (icon-only social links), colour contrast of body text on forest and on ivory (compute from css), focus visibility on keyboard tab, prefers-reduced-motion respected for the hero loop and any animation, autoplay video muted+playsinline, form labels bound to inputs, skip link, lang attr, buttons that are divs.
- Performance: total transfer per route from a cold load (Puppeteer request log), heaviest assets, the hero loop video size and whether it is fetched once, images served without srcset at 390px, render-blocking CSS/JS, fonts (preload? display swap?), anything loaded on every page but used on one page.
- Screenshots to `<scratch>/shots-quality/` named `<route>-<width>.png`.
