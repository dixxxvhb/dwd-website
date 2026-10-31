# Persona pass: drop-in booking on /schedule/ (2026-10-31)

First run of the qa-tester skill's Persona Pass. Live site, 375px phone emulation, one persona at a time, analytics off (`dwd_analytics_auth`), `window.fetch` wrapped so the `drop-in-checkout` call and every Supabase write were faked. Nothing fixed yet; this is the record.

Flow: schedule card, date chip, sticky Check out bar, form, Pay, Stripe hand-off (faked).

Personas: 1 pickup-line parent (one thumb, skims) · 2 careful payer · 3 slow phone · 4 literal reader · 5 breaker.

## Ranked by how many personas hit it

| # | Finding | Hit by | Kind |
|---|---------|--------|------|
| 1 | When the database is busy, Pay sits on "One second..." for ~18 s, then shows the raw Postgres text **"canceling statement due to statement timeout"**. `plainRpcError` in dwd `supabase/functions/drop-in-checkout/index.ts` passes any message through, and schedule.js prints `r.json.error` as is. Seen for real at 4:05pm ET (7 statement timeouts in 15 s while a PC dev server on localhost:8888 and two live-app sessions were busy). No order was created. | everyone, whenever the DB is slow | Bug |
| 2 | One order can book the same dancer into two classes at the same hour (Tue 4:45 Technique & Flexibility, ages 5 to 9, AND Tue 4:45 Ballet, 10 and up) and pays for both. Neither schedule.js nor `drop_in_order_create` (mig 517) checks time overlap or age band. The age warning is built on `claude/thanksgiving-menu` (not merged); the same-time clash is handled nowhere. | 1, 2, 5 | Bug |
| 3 | Opening checkout pushes no history entry, so phone Back (or iOS swipe back) from the form leaves /schedule/ entirely; from Instagram's browser that is back to Instagram. Cart survives (localStorage), typed fields are lost. | 1, 4, 5 | UX |
| 4 | Empty form + Pay: every field turns red and focus jumps to Dancer's name, but the words ("Add the dancer's name.") sit under the Pay button, off-screen. The error has no aria-live. | 1, 3, 4 | UX |
| 5 | The address (schedule "What to know" and the thank-you "Before class") is plain text, not a tap-for-directions link. | 1, 4 | Polish |
| 6 | Junk gets through to the server: phone "abc", payer name "x". A future birth date is only refused by the server after the round trip. | 5 | Bug (minor) |
| 7 | Each card says "Elite + Pro" / "Prep", which reads like a level requirement; only the intro says any dancer the right age is welcome. Copy: Dixon's call. | 4 | UX |
| 8 | The thank-you lines end with the room as a bare word ("... Technique & Flexibility · Garage"). A first-timer has never seen "Garage" before this screen. | 4 | UX |
| 9 | Two tabs: the open checkout keeps its old total. A cart cut to 1 class in another tab still showed "Pay $60" and sent 1 line (Stripe shows the true amount). No `storage` listener. | 5 | Polish |
| 10 | "No refunds after the class has run" leaves open whether cancelling before class gets money back or only a move. Policy: Dixon's call. | 2 | Question |
| 11 | "Request your spot instead" (Step Up) opens dwd-director.netlify.app, a domain a careful payer has not seen. | 2 | Polish |
| 12 | The class list needs the free DB to answer (two `public_site_schedule` calls, ~0.65 s today, 2 to 18 s under load per the speed audit). The page already ships the five classes in its JSON-LD; it could paint them at once and fill dates and spots when the read lands. | 3 | Idea |

## Fixed (branch claude/persona-fixes, same day)
1. dwd `drop-in-checkout` passes only its own P0001 sentences; anything else answers "We couldn't hold your spot just now. Nothing was charged. Try again in a minute." (dwd main, edge fn not deployed). schedule.js applies the same rule to whatever comes back, and the button turns "Still working..." after 6 s.
2. `cartClash` refuses a second class that overlaps one already in the cart on that date (note under the class, or in the week grid), and Pay re-checks the whole cart (old carts, other tabs). Not added server-side: that is a change to `drop_in_order_create`, which the migration gate refuses without Dixon's yes.
3. openCheckout pushes one history entry; Back, the Back link, removing the last line and a closed class all leave through it.
4. Field messages sit under their field (role alert, aria-describedby) and clear the moment the field is fixed; waiver and cart messages stay under Pay. Every form field carries scroll-margin-top 160px, which also fixes the ProSeries interest form (reported by the parallel website persona run: its first bad field landed under the topnav and chapter rail).
5. Both addresses link to Google Maps.
6. Phone needs 10 digits; birth date must give an age 3 to 25 (the server's own bounds); email gets its own message.
7. Drop-in cards say "With the Elite + Pro team" (Prep, Pro the same). Wording for Dixon to OK at review.
8. Thank-you says "Garage room".
9. A `storage` listener repaints the open checkout (or closes it if the other tab emptied the cart).
11. "Request your spot in the DWD family app".
Not done: 10 (refund policy, Dixon's call) and 12 (an idea, not a defect).
Verified on a local copy behind the persona server's injected fake: clash note, a non-overlapping class still adds, Back stays on /schedule/, each field error in view and cleared on fix, busy-server text and "Still working...", a P0001 sentence still passes, two-tab total, clash at Pay, thank-you with room + maps link, interest-form error at y 215 below the bars at 113 (before: field at 0, error at 55, under them). 0 writes left the browser.

## What held up
- About 6 taps from the schedule to Stripe. Chip turns pink with a check, sticky bar shows count and total.
- Prices add up: 4 Technique dates $50 ("You save $10"), 5 dates $62.50, 2 + 2 mixed $60.
- Pay can't double-submit (three taps, one request). Validation names the first gap in order.
- 375px: no sideways scroll, chips and More dates 44px tall, text contrast 10:1 and up, error text 5.4:1.
- Cart survives a reload; the waiver opens in a new tab; network failures say "Nothing was charged."

## Slip during the run
A full page load drops the fetch wrapper. One Pay tap (slow-phone check) went out real: 4 test lines, test names, qa-test@example.com. It failed at the database (finding 1); checked after: 0 orders, 0 analytics rows in the hour. Rule added to the qa-tester skill and memory dwd-dev-fake-writes: install the fake and assert it in the same call that taps Pay.
