# DWD Website — dancewithdixon.com

## Stack
- Vanilla HTML/CSS/JS (no framework)
- CSS: Custom design system with CSS variables, BEM-like classes
- Fonts: Cormorant Garamond (display) + Outfit (body)
- Supabase: anonymous analytics + form submissions (exposed as `window.__dwd_sb`)
- PWA: manifest.json + service worker (sw.js)
- Deploy: git push → GitHub Pages (CNAME: dancewithdixon.com)

## GitHub
- Repo: dixxxvhb/dwd-website
- Branch: main → auto-deploys to GitHub Pages

## Key Files
- `index.html` (67KB, ~1105 lines) — single-page site, all routes handled via hash navigation
- `styles.css` (~2000 lines) — primary stylesheet, CSS variables at top
- `additions.css` (~1633 lines) — supplementary styles (additions, not overrides)
- `main.js` — page navigation, lightbox, scroll reveals, form handling
- `analytics.js` — lightweight cookie-free tracking via Supabase
- `analytics-dashboard.js` — tabbed dashboard (30d/custom period), access code protected
- `campaign.js` — campaign conversion funnel tracking
- `analytics.html` — separate analytics page (access code: `dwdps2026`)
- `DWD-Website-Content.md` — content reference doc

## Pages (hash-routed in index.html)
Home, About, ProSeries, DWDC (Adult Company), Merch, Contact, Gallery, FAQ, Early Access (`/#early-access`)

## SEO
- Google Search Console verified
- sitemap.xml, robots.txt
- Structured data (JSON-LD): Organization + LocalBusiness
- OG tags + Twitter Cards on all pages

## Supabase Integration
- `email_signups` table — early access + contact form submissions
- Source field distinguishes: `proseries-early-access`, `contact-form`, etc.
- Analytics tracking: page views, events (no cookies, no PII)

## Brand Rules
- Brand colors defined as CSS variables (forest green, gold #e2b955, pink)
- Animated WebM logo on hero (1050px desktop, 420px mobile) with `mix-blend-mode: screen` for iOS transparency
- Tamara Mark included
- No emojis ever

## Dev Server
```bash
cd ~/Desktop/DWD/Website && python3 -m http.server 8790
```

## Deploy
```bash
cd ~/Desktop/DWD/Website && git add -A && git commit -m "message" && git push
```
GitHub Pages auto-deploys from main branch.
