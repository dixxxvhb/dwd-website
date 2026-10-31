# Persona pass: the rest of the site (2026-10-31)

Dixon: "send the 5 new personas through the dwd website". Same day as
docs/audits/2026-10-31-persona-pass.md, which covers drop-in booking on
/schedule/ (its fixes are on `claude/persona-fixes`). This run covers what that
one did not: the ProSeries money panel and interest form, Contact and the
Collective's Join, Home, and the episode-recap sign-up. Persona 1 also booked a
drop-in end to end as a cross-check.

Against main e64dce1 served by `scripts/qa/persona-server.py` (375px phone
emulation, one persona at a time, every write faked before supabase-js loads,
Stripe replaced by a stand-in). Server log and `window.__qa` show 11 faked
writes (one a harness probe), 0 refused, nothing sent to Stripe or the database. Two read-only SQL
queries for table constraints.

Personas: 1 pickup-line parent · 2 careful payer · 3 slow phone (Fast 3G,
database reads held 1.8 s) · 4 literal reader · 5 breaker.

## Ranked by how many personas hit it

| # | Finding | Hit by | Kind |
|---|---------|--------|------|
| 1 | Ages disagree in three places, and the ProSeries form takes any age. Posted bands: Prep 5 to 9, Elite 8 to 12, Pro 12+. The form's line says 8 and 9 year olds "start in Elite" while the Prep card says 5 to 9 and Elite drop-ins say 10 and up. A 3 or 4 year old is told "starts in Prep", a 20 year old "starts in Pro" (program is 5 to 19), and a 1980 birthday (a parent typing their own) submits with no word at all. `assignTrack` / `updateTrackNote` in js/main.js. | 4, 5 | Bug + Dixon's call (wording) |
| 2 | ProSeries form: a missing field can stay hidden under the sticky bars. With Express Interest tapped from the middle of the screen (button 380 to 430px down an 812px phone), the browser counts the Experience field as on screen and does not scroll, so the field (y 44), its label and "Please choose the dancer's experience." (y 99) sit under the topnav (0 to 77) and the chapter rail (77 to 113). Nothing visible says what is wrong. `validateForm` only calls `focus()`. | 1 | Bug |
| 3 | Form messages vanish after 5 s (`showFormError` / `showFormSuccess`, js/main.js). A failed ProSeries submit (signal dropped) keeps the form filled but the error goes away, so a parent who glanced off cannot tell if it sent. Contact's success line "Got it. You're on the list..." also goes after 5 s and the form is reset to empty, which invites a second send. | 3 | UX |
| 4 | No length limits match the database. `website_contacts.message` and `audition_registrations.family_note` are capped at 4,000 characters, names at 120, phones at 60; the fields have no `maxlength`. Over the cap the insert fails, the parent gets "Something went wrong. Please try again." and every retry fails the same way. | 5 | Bug (minor) |
| 5 | Back loses the place on ProSeries. Half-filled form, tap the logo, then Back: the typed fields survive but `showPage` scrolls to the top (js/main.js:209), about 6,000px above the form. | 5 | UX |
| 6 | Field errors stay after they are fixed, until the next submit: drop-in "Check the waiver box to continue." after ticking it; ProSeries "Please choose the dancer's experience." after choosing. | 1 | Polish |
| 7 | Class times never say am or pm: "Tue 4:45", "Wed 4:15", "Tue 7:00" on Home, ProSeries and the schedule, and "Tuesday · Nov 3 · 4:45" in the checkout line. | 4 | Polish (copy) |
| 8 | Words a literal reader cannot decode: "Apply for a chair" (chair is never defined on Home), the program cards' bare "ENTER", "Wednesday WOD", and the placement step's "No prep, no pressure" next to a track called Prep. | 4 | Copy, Dixon's call |
| 9 | "Plan on about $3,000 / $4,650 / $5,400" is the bottom of each track. At the top of the posted routine ranges it is $3,500 (Prep, 5 routines), $4,900 (Elite, 6), $5,900 (Pro, 8). Every monthly and peak figure checks out. | 2 | Copy, Dixon's call (money) |
| 10 | The FAQ answer "What does a season cost?" never says final balances bill on top (the panel and the next FAQ do). FAQ text ships as FAQ JSON-LD, so search and AI answers can show it alone, where it reads close to all-inclusive. It still opens "Across the ten months of monthly billing" while the $50 is due at enrollment (known since the 10-30 walk). | 2 | Copy, Dixon's call (money) |
| 11 | "Full detail is in the ProSeries Handbook and Exhibit A of the Parent Agreement" links to neither, and nothing on the page says what happens if a family leaves mid-season. | 2 | Dixon's call (policy) |
| 12 | Junk phones get through on ProSeries and Contact too ("abc"), same as the drop-in form in the other record. | 5 | Polish |

Also seen: the Tuesday chips run Nov 3, 10, 17, Dec 1 with no word on why Nov 24
is missing (the Thanksgiving menu branch is where that belongs).

## What held up
- Persona 1 went Home to the checkout form in 3 taps, then 5 fields, the waiver
  and Pay to the Stripe hand-off; the cancel return says
  "Nothing was charged. Your classes are still in the cart."
- ProSeries money math: every tuition, admin, deposit and peak-month figure adds
  up across all three tracks; "Thirteen chairs remain" matches 5 + 4 + 4.
- All three forms show "Sending..." on a disabled button for the whole wait
  (2.4 s on the slow phone), and three fast taps send one row.
- Validation is plain and specific (bad email, future birth date, every missing
  field named); the honeypot is hidden from autofill and screen readers.
- A dropped connection on the ProSeries form keeps everything typed and re-arms
  the button.
- The slow phone sees real content at once: Home's drop-in panel, the tracks and
  the chair counts ship in the page and only get swapped for fresher data.
- Collective "Join" opens Contact with Collective already picked.
- Recap sign-up: validation, one row per triple tap, a repeat email is treated
  as success; "+ Add another dancer" stops at 4 and Remove works.
- `/#interest` and `/proseries/#interest` land on the form (slowly in a hidden
  pane, whose timers are throttled).

## Not covered
Real paint timings (a hidden pane reports none; Lighthouse on 10-30 measured
Home LCP 4.5 s on a throttled phone), a true first visit (fonts and supabase-js
came from cache), the real Stripe page (verified 10-30), what the database does
with duplicate interest or contact rows, and iOS Safari.

## Suggested fixes (not built)
- 2: after `focus({ preventScroll: true })`, scroll the first bad field's label
  to just under the sticky chrome (topnav plus the chapter rail on ProSeries).
- 3: keep errors until the field or form changes; keep Contact's success line
  (like the ProSeries form's `data-persist`) instead of resetting to a blank form.
- 4: `maxlength` 4000 on both textareas, 120 on names, 60 on phones.
- 5: remember the scroll position per route and restore it on popstate.
- 1: make the form's line follow the posted bands (8 and 9: "Prep or Elite"),
  and add a soft line outside 5 to 19 (under 5 or over 19: point to drop-ins or
  the Collective). The words are Dixon's.
