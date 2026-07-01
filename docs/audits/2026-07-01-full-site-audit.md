# dancewithdixon.com — Full Site Audit · July 1, 2026

Functionality + design audit of the live site, its source, the DWD Director app hand-offs, and the Supabase backend behind the forms. Combined live user testing (Chrome, desktop 1424px + mobile 375px) with a 7-agent static sweep (forms/JS, stale content, links, design/brand, a11y/SEO/PWA, Director integration, backend).

**Verdict:** the site is in strong shape where it counts — every form works end to end, the June audition funnel retired itself cleanly via date-gating, links/assets are 100% clean, and the backend leaks no PII. The problems cluster in three themes: (1) money pages with no end date (`/register` is still taking $25 audition payments 25 days after the audition), (2) everything A·Muse was never date-gated and is now four days stale, and (3) the Summer Intensive funnel — the thing that matters this week — has avoidable friction (jargon track labels, no og:image for link shares, no urgency line on the homepage, no actual July 4 close).

Nothing was fixed during this audit. Test data (1 contact row, 2 merch votes) was submitted to verify the pipes and then deleted from Supabase by id.

---

## Verified working (tested live, not assumed)

- **Contact form**: empty submit → inline branded validation; real submit → POST 201 to `website_contacts`, "Message sent. Dixon will reply within 48 hours," form resets. Backend row confirmed in Supabase.
- **Merch poll**: empty vote blocked ("Pick at least one category"); real vote → 201; post-vote THANKS state renders.
- **Email signup**: correctly hidden post-June-12 (gated era ended); duplicate emails handled gracefully in code (23505 → treated as success).
- **Date-gating**: all 15 audition-era gated elements verified hidden at runtime on Jul 1; every gate uses full ISO timestamps with explicit -04:00 offset — no timezone bugs.
- **Director /summer-intensive**: loads fast, matches fullout.html on dates/prices ($200/$300, Jul 6–10, pulled live from `proseries_config`), required-field validation works, risk-waiver checkbox is enforced (photo consent correctly optional), double-submit guarded (`inFlightRef`), server recomputes totals from DB (never trusts client amount), refuses already-paid rows, webhook marks paid + writes income record. Clean at mobile width.
- **Links/assets**: 90+ images, all CSS/JS, both manifests, og:image, external links — zero 404s, zero case mismatches.
- **Backend**: all 5 form tables exist with exactly the columns the JS sends; anon can INSERT but cannot SELECT any PII table; the Jul 1 analytics email-leak fix verified live (masked emails only). No spam floods. Checkout hardening verified in deployed edge fn v21.
- **A11y/SEO fundamentals**: network-first service worker (no stale-index trap), skip link, thorough alt text, focus-trapped lightbox, aria-live form feedback, rich JSON-LD.
- **Brand**: Tamara Mark present and correctly drawn (footer, Teachers, fullout.html — two unfilled gold circles, right smaller + higher). Footer casing `dwdCOLLECTIVE · dwdPROSERIES` correct. Deposit framing language correct in the "How deposits work" section.

---

## 🔴 Blocker

### 1. `/register` still takes $25 audition payments for June 6
`dwd-director.netlify.app/register` renders a fully open "DWD ProSeries Audition Registration — Auditions June 2026" form with a live "Register & Pay $25" button. No date gate exists client- or server-side; the only gate is capacity (17 of 30 paid → open). Stripe checkout is titled "…Audition — Saturday, June 6, 2026" and the success page says "See you June 6."
- **Exposure**: the website's own links are correctly hidden, but the page is one Google result / old IG bio link / shared text away. The downloadable audition .ics embeds the URL in its description.
- **Where**: `src/pages/public/AuditionRegistrationPage.tsx:98`, `supabase/functions/create-checkout-session/index.ts:104-166` (deployed v21).
- **Fix options (Dixon decides)**: (a) close it — gate on `proseries_config.audition_start` in page + edge function, render "Auditions for Season One have wrapped" pointing at `/summer-intensive` or the unpaid `/audition-form` late-intake; or (b) intentionally keep it open as rolling placement (13 spots left) — then the copy/dates/checkout title must be rewritten, because right now it sells a past event.

## 🟡 Bugs

2. **Intensive registration never actually closes.** fullout.html promises "Online registration closes July 4" but the app has no date check — only the manual `summer_intensive_public_open` flag. Nothing flips it July 4. Same failure class as /register, 3 days out. Fix: date check beside the flag check (client + server), or a hard reminder to flip the flag EOD July 4. (`SummerIntensivePage.tsx:39`)
3. **A·Muse is stale in ~7 visible places.** `amuse-in-space.html` still accepts RSVPs into `amuse_registrations` for the June 27 show ("You're in. I'll be in touch") with zero gating (page doesn't load campaign.js); homepage "UP NEXT" card (index.html:672) promotes it; the #amuse section reads future-tense ("Up Next on Stage", "ticket details coming"); Collective card says "Next show · Jun 27"; rehearsal schedule lists May/June dates; intensive ticker + band sub-nav still cycle "A·Muse · Jun 27"; "Spring classes are happening now" in July. The sibling triptych card got `data-hide-after=2026-06-28` — these were simply missed.
4. **Supabase CDN is a single point of failure for every index.html form.** `main.js:350` calls `createClient` unguarded; if jsdelivr is blocked (ad blockers, corporate networks), the whole IIFE dies: forms silently native-GET-submit (data lost, page reloads) and hash deep-links break. amuse-form.js guards the init but still leaves the form native-submitting — losing the RSVP and putting name/email/phone into the URL query string.
5. **ProSeries pricing table still sells the June 6 audition.** "One-time fees: Audition registration — Saturday, June 6 · $25" is ungated and visible (index.html:1242-1246).
6. **Service worker freezes query-stringed assets.** `sw.js:37` endsWith checks miss `?v=` URLs, so `analytics-dashboard.js?v=3/?v=4` + versioned CSS fall into cache-first forever; index.html pins v=3 while analytics.html pins v=4 (divergent copies). Fix: check `new URL(url).pathname`.
7. **Bebas Neue never loads on index.html.** The brand impact font is referenced (.tr-num Track Record stats, UP NEXT eyebrow) but absent from the Google Fonts URL — renders in fallback sans. One-line fix (index.html:213).
8. **Homepage pull-quote Tamara Mark violates the memorial spec.** `css/rebrand.css:448-455` draws two identical 220px circles, level, flat gold — spec is different sizes, right one smaller and higher (the SVGs elsewhere are correct). Swap in the footer SVG or fix the pseudo-element geometry.
9. **Pro track routine count contradicts MASTER.md.** Site says "6 routines" with solo included (index.html:1176, 1213); MASTER says 5 + optional solo. Confirm which is current, then align.

## 🟠 UX

10. **Intensive form tier labels don't match what the website sold.** Website: "$200 half day (ages 5+) / $300 full day (ages 9+)". App form: "Prep ($200.00)" / "Elite/Pro ($300.00)" — jargon for a no-audition audience, AND it defaults to Prep, so a full-day family that never touches the dropdown underpays $100/dancer. Relabel options + remove the default.
11. **Mobile menu misses the #1 CTA.** No Summer Intensive link in the hamburger menu (desktop nav has it prominently); overlay is semi-transparent with page text bleeding through; body scroll isn't locked (menu drifts while page scrolls beneath).
12. **"Closes July 4" urgency appears only on fullout.html.** The homepage intensive band/ticker never mention the deadline — the single most conversion-relevant fact this week.
13. **fullout.html has no og:image / twitter:card and no analytics.** Link previews shared by parents via DM/text this week render imageless; the page has `data-track` attributes but loads no JS at all, so the campaign page produces zero click/view data.
14. **Contrast failures on primary CTAs.** Cream on coral = 2.73:1 (ProSeries/Teachers/Merch buttons); the live "Sign Up for the Intensive" blush button = 3.62:1. Both under WCAG AA for their small bold labels. fullout's coral/black button passes — use ink-on-coral.
15. **Reduced-motion users lose every logo.** The `prefers-reduced-motion` CSS hides autoplay videos and targets a sibling `img` that doesn't exist (fallback imgs are children of the video). Logos render as empty space.
16. **"ProSeries Interest Form" quick link → no form.** Points at #proseries where the interest section has been gated off since Jun 12. Rename or repoint at /fullout.
17. **No spam protection on the 3 main forms** (amuse has the only honeypot); merch poll accepts unlimited repeat votes (no localStorage flag). Low urgency at current traffic; tables show no abuse.
18. **sitemap.xml is stale and hash-only.** All lastmod 2026-04-07; 8 of 9 entries are #fragments crawlers collapse; `/fullout` — the active funnel — absent.
19. **Venue naming drift.** "Exchange Dance Academy" (fullout + homepage banner) vs "Exchange Dance Studio" (contact section) vs "Exchange Dance" (Director app). Pick one.
20. **Owner preview mode falsifies Dixon's own QA.** Ever having entered the campaign code (`dwdps2026`) sets localStorage auth that un-hides every date-gated element every 2s — Dixon's browser shows both eras at once. Decouple preview from campaign auth (honor only `?launched=1`).
21. **The next stale cliff is July 10.** No intensive-era element has an end date, and the ProSeries hero CTA keys off #proseries-intensive being visible — forever. Without edits the site will sell a finished intensive from Jul 11 on, exactly like A·Muse today. Add `data-hide-after=2026-07-11` + a Season One reveal state now, while the pattern is fresh.

## 🔵 Polish (short list — full detail in the workflow output)

- "Peak months, **all-in**" pricing label skirts the banned all-inclusive framing → "total monthly."
- "Artists, **Not Just** Competitors" heading is a banned writing-voice construction.
- Off-brand parallel design system (Anton + Manrope + `--oh-*` near-miss hexes) runs ProSeries/Merch/intensive surfaces; fullout's coral/black is a deliberate campaign look but undocumented. Decide: sanction in DESIGN.md (and snap hexes to tokens) or migrate fonts to Bebas/Outfit.
- Mixed sharp/rounded corners in one view (DESIGN.md prohibits); `--gold-light` undefined (dead hover); `dwdCollective` casing in hidden markup; JSON-LD still serves the past A·Muse TheaterEvent as scheduled; heading-hierarchy wobbles; campaign/analytics gate inputs unlabeled; triptych renders one lonely card in a two-card grid; merch THANKS card sits in the left third of an empty row; 404 silently redirects home with no message; maskable icon lacks safe zone; analytics.html disallowed in robots but not noindexed; ~500 lines of dead retired-era markup worth a cleanup pass; email/contact funnel dormant since April (3 contact submissions ever) — funnel-visibility signal.
- amuse-in-space.html is missing the Tamara Mark entirely (moot if the page gets retired).

## Decisions needed from Dixon

1. **/register**: close gracefully, or reframe as rolling placement? (Blocker either way.)
2. **July 4 close**: add a real date gate, or commit to manually flipping `summer_intensive_public_open` EOD July 4?
3. **The `--oh` poster design system**: sanction and document, or migrate to brand fonts/tokens?
4. **Pro track**: 6 routines with solo, or 5 + optional solo (MASTER.md)?
5. Backend (carry-over from Jul 1 security audit): leaked-password toggle; plaintext PIN tables.

## Notes

- Live SPA is one commit behind main (`de9e0c9` — the 07-13→07-06 fallback fix). Zero user impact (DB value is set); `dist/` is built and ready; deploys are ask-first.
- Full raw findings (64 static + live-testing notes): workflow output at
  `C:\Users\bowle\AppData\Local\Temp\claude\C--Users-bowle\a9264097-6a56-425a-a595-e60c0bbf9ee0\tasks\wld1rnpxc.output`
- Test data created during the audit was deleted from Supabase by id (verified).
