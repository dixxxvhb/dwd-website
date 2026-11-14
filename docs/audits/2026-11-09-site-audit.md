# Site audit, 2026-11-09

Live walk of dancewithdixon.com (8 routes, 1280 and 390). The mechanical sweep
(`scripts/qa/shoot.js` against live) was clean before and after every change.

## Shipped today (all verified live)

- **Page titles** (385344f): inner pages no longer end in "| DWD". Titles live in
  three places that must agree: `js/main.js`, `scripts/build-routes.mjs`,
  `scripts/qa/routes.js`.
- **Skip link on /schedule/** (385344f): "Skip to the weekly drop-in classes" inside
  the Thanksgiving card, target `#sched-weekly`. Leaves with the card after Nov 27.
- **/waiver/** (385344f): forwards to `/waiver/drop-in/` (was a 404).
- **Home Thanksgiving strip** (752308e, Dixon: "Yes, ship it"): `.tgh` card under the
  hero. Names no class, teacher or time (staged reveal). `js/now.js` removes it at
  `data-tgh-until` (2026-11-27 13:00 New York). After that date the markup, the
  `.tgh-*` CSS and `expireTgStrip()` can be deleted. Brief:
  `docs/plans/2026-11-09-home-thanksgiving-strip.md`. Built by builder-opus.
- **59 unused camera originals unpublished** (7d29d0a, Dixon: "Yes, unpublish them"):
  listed under `exclude:` in `_config.yml`. 252 MB; the publish went from 333 MB to
  69 MB. The files stay in the repo. Proof nothing uses them: a full sweep against a
  server that 404s them was clean.

## Checked, no change needed

- **Fonts:** all ten Cormorant weight/style pairs and every Outfit weight are in use
  (computed-style census across all routes at both widths).
- **Image attributes:** the images without `loading` are the logo and hero (correct);
  the rest were a comment and the lightbox placeholder.

## Open, Dixon's calls

1. **Cast list is stale.** One Elite dancer is marked withdrawn in STATUS but is still
   in the hardcoded roster in `index.html`; counts in `js/season.js` were last
   verified 2026-09-02 and were not checked against the database. Her cast photo
   (`images/photos/opt/cast-*-960.webp`) is still published.
2. **Collective page is a dead end:** "Next class: date coming soon" since September.
3. **Gallery:** nearly all step-and-repeat photos; the Kickoff section shows minors
   poolside in swimwear on a public page.
4. **Contact email** is the gmail address although the domain address exists.
5. **No social proof** anywhere (quotes, reviews, map).
6. **Share images:** Schedule borrows the ProSeries card, Privacy borrows Home's.
7. **Booking D** redesign of /schedule/ still parked on `claude/booking-d`.
8. **Desktop Home polish:** small drop-in video with default controls; hero photo
   small in a large empty area. **ProSeries** "What a full season adds up to" is a
   wall of text.
9. **Still public and apparently unused:** five `video/hero-*` files, three
   `images/teachers/*.png`, three `images/photos/dixon-mom/*`, and about 130 small
   files (16 MB). Do NOT judge these by file-name matching alone: the phone hero
   video (`video/hero-m.webm`) is requested under a name no source file spells out.
10. **Contrast:** the menu card's small terra-cotta labels (`.tg-sub`, `.tg-ww-lbl`,
    `.tg-when`, `.tg-early`, `.tg-note`) measure about 3.7:1 on its paper.
11. **Weight:** every route shell ships the whole site (245 KB HTML, 57 KB gz);
    `.git` is 647 MB.

Not walked this pass: checkout flow, accessibility (focus order, headings), the
menu-open state, 404 and offline pages.

## GitHub Pages deploy stall

Five of seven deploys today hung at `syncing_files` and hit the action's fixed
10-minute timeout. GitHub-side (other repos reported the same Nov 6 to 10 while the
status page said operational). Shrinking the publish did not fix it.

- **Works:** `gh api -X POST repos/{owner}/{repo}/pages/deployments/<full sha>/cancel`,
  then `git commit --allow-empty` and push.
- **Does not work:** `gh run rerun --failed` (leaves a run stuck "queued" that cannot
  be cancelled; two such zombies exist from today), or requesting a build of the
  same SHA.
