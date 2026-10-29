# Thanksgiving menu on /schedule/ (Nov 23 to 27, 2026)

Branch `claude/thanksgiving-menu`. Not on main yet: main deploys to dancewithdixon.com.

## What it is
The Instagram post (the Thanksgiving Tasting Menu, `DWD/dwdPROSERIES/season-1/campaigns/thanksgiving-week-nov-2026/`) as a printed menu card at the top of /schedule/, with a seat per morning:

- I. Tue Nov 24: Guest Masterclass, guest chef TBA
- II. Wed Nov 25: Guest Masterclass, guest chef TBA
- Intermission, Thu: The Turkey (no button)
- III. Fri Nov 27: Leftovers with Dixon

All three run 10am to 1pm at Exchange Dance (Chelsea OK'd three hours, 2026-10-28). Monday's company rehearsal is internal and never shows here.

## How booking works
Nothing new on the payment side. Each course finds the class on its date in `public_site_schedule` that starts before noon. "Reserve a seat" puts it in the same drop-in cart, and it checks out through the same `drop-in-checkout` Stripe flow as the chips. Price, spots and Full all come from the Director class, so the server stays the authority on money. Those rows are kept out of the weekly class list so nothing shows up twice.

Button states: no class or not open for drop-in = "Reservations open soon" (disabled); open = price + "Reserve a seat"; in the cart = "In your order"; `spots_left` 0 = "Fully booked"; after the class starts = "Served". Open with no fee set reads "Price TBA". After Nov 27 (New York time) the whole block hides.

## Before this can go live (Dixon)
1. In the Director, create the three one-off classes for Tue 11/24, Wed 11/25 and Fri 11/27, 10:00 to 13:00, open for drop-in, each with its price and seat cap. Ages/level go in the class's age band so checkout shows them.
2. Guest names: set `TG_GUESTS` at the top of `js/schedule.js`.
3. The evening classes that week need cancelling in the Director. That is a calendar change families see; inside 21 days (from Nov 2) it waits for Dixon's yes.
4. Decide whether ProSeries families pay for Tue/Wed or get them included. That's a pricing call, not code.

## QA
- `?tg=demo` on localhost fills the three mornings with open, unpriced rows (Wed shows Fully booked) to see the states without Director classes. Those class_ids don't exist on the server, so they can't reach Stripe.
- Stubbed Playwright run 2026-10-28: a priced Nov 24 row read $45, Reserve put it in the cart (1 class, $45), Nov 25/27 read "Reservations open soon", the weekly list didn't repeat it, no horizontal overflow at 390px or 1280px.
