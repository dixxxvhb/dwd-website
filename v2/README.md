# /v2 — "THE PIECE" (approved working upgrade)

**Status: approved direction, 2026-07-11.** Dixon signed off on this as the working
upgrade for dancewithdixon.com. Work continues in later sessions. Do not delete.

## What this is
A clean-slate redesign concept for the whole site, built as ONE self-contained file
(`index.html`) with zero dependence on the legacy CSS stack. Design language:
**the choreography document** — marley floor + stage grid, spike tape as the accent
system, live formation dots that re-block per page, counts as structure, director
margin notes, Tamara's mark as the upstage-center position on a formation chart.

Voice rule that got us here: **the visuals carry the metaphor, Dixon's own site copy
carries the words.** No em dashes, no winky theme-copy. Headlines are his existing
lines (This isn't a studio / Earn your spot / More than a drop-in class / That was
full out / Every class Every piece / There is still room).

## Structure
Hash-routed pages mirroring the live site: #home #proseries #collective #teachers
#gallery #merch #contact. Router + formation layer + menu overlay all in the single
file. `img/` holds resized derivatives (max ~1400px) — never hotlink
`../images/photos/*` originals (some are 8K px).

## Preview
python -m http.server 18790 -d C:/Users/bowle/Code/dwd-website-s1
→ http://localhost:18790/v2/  (browser caches hard; bust with ?v=N)

## Flesh-out pass (2026-07-12)
Full-site expansion: live Aug 10 countdown on home (flips to "Season One is
underway" after), all ProSeries CTAs wired straight to the real express-interest
form (dwd-director.netlify.app/register), "How placement works" 3-step section on
ProSeries + Contact, tuition fine print under casting cards, Collective "How the
company works" section, new FAQ page (legacy copy verbatim), gallery lightbox,
global mark-no renumbering 01-13.

## Known gaps / next steps
- Faculty photos: REAL photos in place (2026-07-12) from dwdPROSERIES/rotation-teachers/source.
  Tori's is a 3x-upscaled crop of a casual field photo; a proper headshot of her is still wanted.
- Director headshot is the old pre-beard one (same as live site). No current bald+beard solo shot exists anywhere on this PC; a new photo must be taken.
- Merch page is a typographic stub linking to the live merch page.
- Contact links out to the real express-interest form; no forms wired here.
- A real port = replace the live index.html wholesale + rewire forms, analytics,
  service worker, and era gates (docs/ERAS.md). Do NOT try to merge this into the
  legacy 10-sheet CSS system.
- Relationship to branch `season-one-v2` (paused incremental overhaul, pre-ship):
  Dixon decides later whether that still ships first or THE PIECE supersedes it.
