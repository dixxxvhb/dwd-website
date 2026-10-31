# Thanksgiving menu on /schedule/ (Nov 23 to 27, 2026)

Branch `claude/thanksgiving-menu`. Not on main yet: main deploys to dancewithdixon.com, and Dixon has said "not yet" to going live (2026-10-31).

## What it is
The Instagram post (the Thanksgiving Week Masterclass Menu, Direction A, `DWD/dwdPROSERIES/season-1/campaigns/thanksgiving-week-nov-2026/source/menu-a.html`) as a printed menu card at the top of /schedule/, with a Reserve button per seating. Plain copy (day, class, teacher, times, ages), the dwdPS crest at the top, no puns (Dixon, 2026-10-30). Final lineup (Dixon, 2026-10-31), every morning 10am to 1pm at Exchange Dance:

- Tue Nov 24, two seatings: Jazz with Tori Ugalde, 10:00 to 12:00, all ages; then Musical Theatre with Dixon Bowles, 12:00 to 1:00, all ages.
- Wed Nov 25, two seatings: Contemporary Fusion with Megan Montgomery, 10:00 to 11:30 ages 9 and under; 11:30 to 1:00 ages 10 and up.
- Thu Nov 26: Closed for Thanksgiving (no buttons).
- Fri Nov 27, three seatings: Jazz Funk with Gabriella Vultaggio, 10:00 to 11:00 ages 9 and under; 11:00 to 12:00 ages 10 and up; then Stretch & Strengthen with Dixon Bowles, 12:00 to 1:00, all ages.

Adults are welcome in the 10 and up and all ages classes (Dixon, 2026-10-31; not on the card yet).

Chelsea OK'd three hours at Exchange Dance (2026-10-28). Monday's company rehearsal is internal and never shows here.

Layout: a morning with one class (Wednesday) shows its name and teacher once, its seatings side by side. A morning with two classes (Tuesday, Friday) shows them as a pair, side by side from 700px with a hairline between, stacked on a phone. Each seating has its own price and button.

## How booking works
Nothing new on the payment side. Each seating is its own Director class. On each date, the classes in `public_site_schedule` that start before 1pm are sorted by start time and fill that morning's seatings in order (`data-tg-seat` 0, 1, 2 in index.html; Friday has three). "Reserve a seat" puts that class in the same drop-in cart, and it checks out through the same `drop-in-checkout` Stripe flow as the chips. Price, spots and Full all come from the Director class, so the server stays the authority on money. Those rows are kept out of the weekly class list so nothing shows up twice. If a morning ever gets a different number of classes than the card has seatings, the extra class has no button and a missing one leaves its seating on "Reservations open soon", so the card and the Director must change together.

Button states per seating: no class or not open for drop-in = "Reservations open soon" (disabled); open = price + "Reserve a seat"; in the cart = "In your order"; `spots_left` 0 = "Fully booked"; after the class starts = "Served". Open with no fee set reads "Price TBA". After Nov 27 (New York time) the whole block hides. One order holds six classes at most (the cart's limit), so a family booking all seven seatings checks out twice.

## Before this can go live (Dixon)
1. DONE (2026-10-31): the seven bookable Director classes exist, created as one-date `dance_classes` (program proseries, Warehouse room). `public_site_schedule` returns exactly these seven that week, sorted Tue 10:00 and 12:00, Wed 10:00 and 11:30, Fri 10:00, 11:00 and 12:00, with public names like "Jazz with Tori Ugalde", age labels, and fees $20 or $15 (multi-buy $17.50 or $12.50, the same as the regular drop-ins). They are CLOSED for booking (`drop_in_allowed` false) until Dixon says open, so every seat reads "Reservations open soon" until then.
2. Prices (Dixon, 2026-10-31): Tue jazz $20, Tue musical theatre $15, both Wed seatings $20, both Fri jazz funk seatings $15, Fri stretch & strengthen $15. They live on the Director classes, not in this repo.
3. No doubling on family schedules: the families' app doesn't show these classes, so the Director's three MASTERCLASS calendar events (Nov 24, 25 and 27, event_type masterclass, no class_id, set on 10-31 to 10:00 to 13:00 with titles and seating descriptions) stay the family view.
4. Open the seven classes for drop-in (Dixon's call) and merge this branch the same morning, with the menu post. Main has no menu yet: open rows on main would show as plain drop-ins (now.js lists every open row), and `scripts/check-classes-jsonld.mjs`, which reads only open rows, would flag them as weekly classes missing from the JSON-LD, so exclude these one-date classes there (or add Course nodes) in the same change.
5. DONE (checked 2026-10-30): Dixon cancelled that week's evening classes in the Director; `public_site_schedule` had no rows Nov 23 to 29, so the card's "Evening classes are off" line is true. Monday's rehearsal is internal and stays off the site.
6. DONE (Dixon, 2026-10-31): everyone pays, ProSeries families included. They book through the same cart as anyone else.
7. If the lineup changes, edit the course text in index.html (the `tg-course` blocks; keep `data-tg-seat` numbered in time order per morning), update `TG_DEMO` in js/schedule.js to match, and run build-routes.

## QA
- `?tg=demo` on localhost fills the seven seatings with open rows at the tentative prices (Wednesday's second seating shows Fully booked). The rows are fed in latest first so the start-time sort is exercised. Those class_ids (`tg-demo-*`) don't exist on the server, so they can't reach Stripe.
- Stubbed Playwright run 2026-10-31 (every Supabase call answered locally, the service worker blocked, nothing sent to Stripe or written): with seven priced classes sent shuffled ($11 to $17 by time order), each landed in its own seating in time order on the right day; Reserve on Friday's third seating put the 12:00 class in the cart (1 class, $17) and turned to "In your order"; an afternoon class on Nov 24 stayed in the weekly list while the menu classes did not; with no menu classes in the feed every seating read "Reservations open soon"; no horizontal overflow at 390, 600, 768 or 1280px.
