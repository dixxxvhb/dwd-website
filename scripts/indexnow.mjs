#!/usr/bin/env node
/**
 * Tell Bing (and the other IndexNow engines) that the site changed. ChatGPT's
 * search leans on Bing's index, so this is how new classes and prices reach
 * AI answers sooner. No account needed: the key file at the site root proves
 * ownership.
 *
 *   node scripts/indexnow.mjs            # every URL in sitemap.xml + llms.txt
 *   node scripts/indexnow.mjs /schedule/ # just these paths
 *
 * Run it after a push that changes classes, prices or page copy, once GitHub
 * Pages has deployed. HTTP 200/202 = accepted. Added 2026-09-25.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'dancewithdixon.com';
const KEY = 'ab41909a2a903c005700777de58449ce';

const args = process.argv.slice(2);
let urls;
if (args.length) {
  urls = args.map((p) => 'https://' + HOST + (p.startsWith('/') ? p : '/' + p));
} else {
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  urls.push('https://' + HOST + '/llms.txt');
}

const res = await fetch('https://www.bing.com/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: HTTP ${res.status} for ${urls.length} URL(s)`);
if (res.status >= 300) process.exit(1);
