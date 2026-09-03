#!/usr/bin/env node
/**
 * Generate real URLs for the site's sections.
 *
 * The site is one hash-routed index.html. That works, but it means every
 * section shares one <title>, one description and one Open Graph card, so
 * pasting the ProSeries link into a text message showed the home page's
 * preview, and search engines only ever saw one page.
 *
 * This writes a directory per section, each holding a copy of the same shell
 * with its own metadata and a `window.__dwd_route` hint. GitHub Pages serves
 * <dir>/index.html at /<dir>, js/main.js reads the path on load and shows the
 * right section, and the old #hash links keep working forever.
 *
 * Run after changing index.html:
 *   node scripts/build-routes.mjs
 *
 * Verify without writing (exits 1 if the built shells are stale):
 *   node scripts/build-routes.mjs --check
 *
 * Everything in index.html must reference assets ROOT-relatively (/css/...,
 * /images/...). A shell served from /proseries/ resolves "css/styles.css"
 * against /proseries/, and the page loses its stylesheet. This script checks
 * for that and refuses to build.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const SITE = 'https://dancewithdixon.com';

/**
 * dir   — the URL segment and the folder name
 * route — the id js/main.js knows this section by (page-<route>)
 *
 * `dir` and `route` differ for the Collective on purpose: the section is
 * #adult-company for historical reasons, and /collective is what it is called
 * everywhere a human can see.
 */
const ROUTES = [
  {
    dir: 'proseries',
    route: 'proseries',
    title: 'ProSeries: Season One | DWD',
    description:
      'dwdPROSERIES is elite youth competitive dance training in Orlando, ages 5 to 19, in three ' +
      'tracks: Prep, Elite and Pro. Season One runs August 2026 to May 2027. Placement is rolling ' +
      'all season.',
    ogTitle: 'dwdPROSERIES · Season One',
    ogDescription:
      'Elite youth training in Orlando. Three tracks, rolling placement, and a season built like a ' +
      'series. Chairs remain in all three tracks.',
    image: '/images/og/proseries.jpg',
    imageAlt: 'A ProSeries dancer mid-leap at the Summer Intensive showcase.',
  },
  {
    dir: 'collective',
    route: 'adult-company',
    title: 'The Collective | DWD',
    description:
      "dwdCOLLECTIVE is Dance With Dixon's adult modern and contemporary company, 18 and up, at " +
      'Exchange Dance in Orlando. No audition and no experience required.',
    ogTitle: 'dwdCOLLECTIVE · Adults 18+',
    ogDescription:
      'Real training, real choreography, real stage time, for adults of every level. No audition. ' +
      'Just show up ready to move.',
    image: '/images/og/collective.jpg',
    imageAlt: 'dwdCOLLECTIVE on stage in A·Muse in Space at Orlando Ballet.',
  },
  {
    dir: 'teachers',
    route: 'teachers',
    title: 'Teachers | DWD',
    description:
      'Every ProSeries class is designed by director Dixon Bowles, with specialist teachers ' +
      'rotating in for tap, acro, hip hop, musical theatre, and strength and stretch.',
    ogTitle: 'Teachers · Dance With Dixon',
    ogDescription:
      'Every class designed by a working director, supported by a rotation of working artists.',
    image: '/images/og/teachers.jpg',
    imageAlt: 'Dixon Bowles coaching dancers on the floor at dwdCON.',
  },
  {
    dir: 'gallery',
    route: 'gallery',
    title: 'Gallery | DWD',
    description:
      'Season One in photos: the open house, the Summer Intensive, dwdCON, signing day and the ' +
      'kickoff, plus the Collective on stage and choreography by Dixon Bowles.',
    ogTitle: 'Season One in photos',
    ogDescription: 'Open house to signing day in one summer, then the season started.',
    image: '/images/og/gallery.jpg',
    imageAlt: 'The seventeen Season One dancers together on signing day.',
  },
  {
    dir: 'contact',
    route: 'contact',
    title: 'Contact | DWD',
    description:
      'Reach Dixon Bowles about ProSeries placement, adult Collective classes, choreography, ' +
      'workshops, guest teaching or competition judging. Exchange Dance Studio, Orlando.',
    ogTitle: 'Get in touch · Dance With Dixon',
    ogDescription:
      'Join a class, express interest in ProSeries, book choreography, or just say hey. Dixon ' +
      'replies personally.',
    image: '/images/og/contact.jpg',
    imageAlt: 'Dixon Bowles.',
  },
  {
    dir: 'privacy',
    route: 'privacy',
    title: 'Privacy Policy | DWD',
    description: 'How Dance With Dixon LLC handles the information you share through this site.',
    ogTitle: 'Privacy Policy · Dance With Dixon',
    ogDescription: 'What we collect, why, and what we never do with it.',
    image: '/images/og/home.jpg',
    imageAlt: 'DWD dancer on stage.',
  },
];

const src = readFileSync('index.html', 'utf8');

/* ── Guard: root-relative assets ──────────────────────────────────────────
   A shell at /proseries/ resolves "css/styles.css" against its own directory.
   One relative path here means an unstyled page at every route but home. */
const relative = [
  ...src.matchAll(/\b(?:src|href|poster)="((?:images|css|js|video|data)\/[^"]*)"/g),
  ...src.matchAll(/\bsrcset="((?:images|css|js|video|data)\/[^"]*)"/g),
];
if (relative.length) {
  console.error('Refusing to build: index.html still has directory-relative asset paths.');
  console.error('These break on every route except home. Make them root-relative (/images/...).');
  relative.slice(0, 10).forEach((m) => console.error('  ' + m[1]));
  process.exit(1);
}

/* ── Guard: titles must agree with js/main.js ────────────────────────────
   showPage() sets document.title on client-side navigation while the shell
   sets it on first paint. If the two disagree, the title changes when you
   click away and back, which is the sort of thing nobody notices for months. */
const mainJs = readFileSync('js/main.js', 'utf8');
const titlesBlock = mainJs.match(/var titles = \{([\s\S]*?)\n {4}\};/);
if (!titlesBlock) {
  console.error('Refusing to build: could not find the titles map in js/main.js.');
  process.exit(1);
}
const jsTitles = Object.fromEntries(
  [...titlesBlock[1].matchAll(/'([a-z-]+)':\s*'((?:[^'\\]|\\.)*)'/g)]
    .map((m) => [m[1], m[2].replace(/\\'/g, "'")])
);
let drift = false;
for (const r of ROUTES) {
  if (jsTitles[r.route] !== r.title) {
    console.error(
      `Title drift for "${r.route}": js/main.js has ${JSON.stringify(jsTitles[r.route])}, ` +
      `this script has ${JSON.stringify(r.title)}.`
    );
    drift = true;
  }
}
if (drift) {
  console.error('Refusing to build. Make them match, then re-run.');
  process.exit(1);
}

/* ── Build one shell ─────────────────────────────────────────────────── */

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildShell(r) {
  let out = src;
  const url = `${SITE}/${r.dir}/`;

  const replacements = [
    [/<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`],
    [/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(r.description)}">`],
    [/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`],
    [/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(r.ogTitle)}">`],
    [/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(r.ogDescription)}">`],
    [/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`],
    [/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${SITE}${r.image}">`],
    [/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${esc(r.imageAlt)}">`],
    [/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(r.ogTitle)}">`],
    [/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(r.ogDescription)}">`],
    [/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${SITE}${r.image}">`],
    [/<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${esc(r.imageAlt)}">`],
  ];

  for (const [re, to] of replacements) {
    if (!re.test(out)) {
      console.error(`Refusing to build ${r.dir}: index.html no longer matches ${re}`);
      process.exit(1);
    }
    out = out.replace(re, to);
  }

  // The home hero is not the LCP anywhere else, so stop preloading it.
  out = out.replace(
    /  <!-- LCP hero preload[\s\S]*?fetchpriority="high">\n/,
    '  <!-- The home hero LCP preload is dropped on this route: its hero is not\n' +
    '       what paints here. See scripts/build-routes.mjs. -->\n'
  );

  // Tell main.js which section this shell is, before the deferred scripts run.
  out = out.replace(
    '  <!-- season.js first:',
    `  <!-- Generated shell: scripts/build-routes.mjs. Do not edit by hand,\n` +
    `       edit index.html and re-run. -->\n` +
    `  <script>window.__dwd_route = ${JSON.stringify(r.route)};</script>\n` +
    '  <!-- season.js first:'
  );

  return out;
}

/* ── Sitemap ─────────────────────────────────────────────────────────── */

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    { loc: `${SITE}/`, priority: '1.0', changefreq: 'weekly' },
    ...ROUTES.map((r) => ({
      loc: `${SITE}/${r.dir}/`,
      priority: r.dir === 'proseries' ? '0.9' : r.dir === 'privacy' ? '0.3' : '0.7',
      changefreq: r.dir === 'privacy' ? 'yearly' : 'weekly',
    })),
    // The two standalone event pages. Both events are over and both pages are
    // archives now (see docs/ERAS.md for their gates), but they are real URLs
    // that have been shared and linked, so they stay in the sitemap at a
    // priority that says "archive".
    { loc: `${SITE}/fullout`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${SITE}/dwdcon`, priority: '0.3', changefreq: 'yearly' },
  ];
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries
      .map(
        (e) =>
          '  <url>\n' +
          `    <loc>${e.loc}</loc>\n` +
          `    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>${e.changefreq}</changefreq>\n` +
          `    <priority>${e.priority}</priority>\n` +
          '  </url>\n'
      )
      .join('') +
    '</urlset>\n'
  );
}

/* ── Write ───────────────────────────────────────────────────────────── */

const check = process.argv.includes('--check');
let stale = [];

for (const r of ROUTES) {
  const shell = buildShell(r);
  const path = `${r.dir}/index.html`;
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (current === shell) continue;
  if (check) {
    stale.push(path);
    continue;
  }
  mkdirSync(r.dir, { recursive: true });
  writeFileSync(path, shell);
  console.log(`wrote ${path}`);
}

const sitemap = buildSitemap();
const currentSitemap = existsSync('sitemap.xml') ? readFileSync('sitemap.xml', 'utf8') : null;
// Only the <lastmod> changes day to day; do not churn the file for that alone.
const stripDates = (s) => (s || '').replace(/<lastmod>[^<]*<\/lastmod>/g, '');
if (stripDates(currentSitemap) !== stripDates(sitemap)) {
  if (check) stale.push('sitemap.xml');
  else {
    writeFileSync('sitemap.xml', sitemap);
    console.log('wrote sitemap.xml');
  }
}

if (check) {
  if (stale.length) {
    console.error('STALE: ' + stale.join(', '));
    console.error('Run: node scripts/build-routes.mjs');
    process.exit(1);
  }
  console.log(`All ${ROUTES.length} route shells and sitemap.xml are in sync.`);
} else {
  console.log(`\n${ROUTES.length} routes: ` + ROUTES.map((r) => '/' + r.dir).join(', '));
}
