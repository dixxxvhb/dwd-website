# Thanksgiving menu on /schedule/ (Nov 23 to 27, 2026)

Branch `claude/thanksgiving-menu`. Not on main yet: main deploys to dancewithdixon.com.

## What it is
The Instagram post (the Thanksgiving Tasting Menu, `DWD/dwdPROSERIES/season-1/campaigns/thanksgiving-week-nov-2026/`) as a printed menu card at the top of /schedule/, with two seatings per morning. Lineup is tentative (Dixon, 2026-10-30):

- I. Tue Nov 24: Contemporary, guest chef Ms. Tori. 10 to 11:30 ages 9 and under; 11:30 to 1 ages 10 and up.
- II. Wed Nov 25: Contemporary Fusion, guest chef Megan Montgomery. Same split.
- Intermission, Thu: The Turkey (no buttons)
- III. Fri Nov 27: Leftovers with Dixon. 10 to 11:30 intermediate/advanced ballet + conditioning, ages 10 and up; 11:30 to 1 musical theatre, open to everyone.

Mornings run 10am to 1pm at Exchange Dance (Chelsea OK'd three hours, 2026-10-28). Monday's company rehearsal is internal and never shows here.

## How booking works
Nothing new on the payment side. Each seating is its own Director class. On each date, the classes in `public_site_schedule` that start before 1pm are sorted by start time and fill the course's seatings in order (first seating, second seating). "Reserve a seat" puts that class in the same drop-in cart, and it checks out through the same `drop-in-checkout` Stripe flow as the chips. Price, spots and Full all come from the Director class, so the server stays the authority on money. Those rows are kept out of the weekly class list so nothing shows up twice.

Button states per seating: no class or not open for drop-in = "Reservations open soon" (disabled); open = price + "Reserve a seat"; in the cart = "In your order"; `spots_left` 0 = "Fully booked"; after the class starts = "Served". Open with no fee set reads "Price TBA". After Nov 27 (New York time) the whole block hides.

## Before this can go live (Dixon)
1. In the Director, create the six one-off classes: Tue 11/24 and Wed 11/25 at 10:00 to 11:30 (ages 9 and under) and 11:30 to 13:00 (ages 10 and up); Fri 11/27 10:00 to 11:30 (ballet + conditioning, 10 and up) and 11:30 to 13:00 (musical theatre, all). Each open for drop-in with its price and seat cap.
2. The evening classes that week need cancelling in the Director, and Monday's rehearsal added. Those are calendar changes families see; inside 21 days (from Nov 2) they wait for Dixon's yes.
3. Decide whether ProSeries families pay for these or get them included. That's a pricing call, not code.
4. If the lineup changes, edit the course text in index.html (the `tg-course` block) and run build-routes.

## QA
- `?tg=demo` on localhost fills the six seatings with open, unpriced rows (Wednesday's second seating shows Fully booked). Those class_ids don't exist on the server, so they can't reach Stripe.
- Stubbed Playwright run 2026-10-30: two priced Nov 24 classes sent out of order landed in the right seatings ($35 first, $40 second); Reserve put the first in the cart (1 class, $35); the other days read "Reservations open soon"; the weekly list didn't repeat them; no horizontal overflow at 390px or 1280px.
