# QA scripts

The Claude Code browser pane cannot drive this site: JS scrollTo no-ops and
captures come back blank. Everything here runs Puppeteer against a local static
server instead. Puppeteer is not a dependency of this repo; the scripts resolve
it from `~/Code/DWDC-Instagram-Posts/node_modules/puppeteer` and launch with
`channel: 'chrome'`.

Start the server first:

```bash
python -m http.server 8790 -d C:/Users/bowle/Code/dwd-website
```

Every script unregisters the service worker and clears caches before loading, or
you end up testing the last deploy instead of your working tree.

## shoot.js

Full sweep. Loads every route at 1280 and 390 and fails on console errors,
failed or 4xx requests, broken images, horizontal overflow, dead `#anchors`, and
unexpected off-domain links (social, maps, and the privacy page's Stripe/Plaid
links are allowed; anything else is a CTA that escaped the site).

```bash
node scripts/qa/shoot.js <outDir> [routes] [--tiles]
```

`--tiles` also writes 1400px-tall screenshots per route. It waits for every
image to resolve first: these pages carry lazy images with no width/height, so
an unsettled page grows while you tile it and the same section shows up twice.

## contrast.js

Measures text-over-photo contrast on rendered pixels rather than estimating it.
Hides the text, photographs the rectangle behind it, and compares the worst
pixel in that rectangle against the text colour.

```bash
node scripts/qa/contrast.js <route> <textSelector> <width>
```

## shot-element.js

One element, one file. For reviewing a single component at a given width.

```bash
node scripts/qa/shot-element.js <out.png> <route> <selector> <width>
```
