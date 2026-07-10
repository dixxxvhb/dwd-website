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
- `index.html` (2438 lines) — single-page site, all routes handled via hash navigation
- CSS: 10-sheet layered system ending with `css/season-one.css`
- `js/motion.js` — motion & reveal effects
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
- Brand colors defined as CSS variables (forest green #0c1f17, terracotta #C8614B, pink #f8d7c8, ivory #FAF3E8, seafoam #6BAF8A). Gold (#e2b955) is Tamara Mark memorial only.
- Animated WebM logo on hero (1050px desktop, 420px mobile) with `mix-blend-mode: screen` for iOS transparency
- Tamara Mark included
- No emojis ever
- Never ship *-transparent.webm logo videos (replacement in progress on feat/live-logo-embed).

## Dev Server
```
py -m http.server 8790 -d C:/Users/bowle/Code/dwd-website
```

## Deploy
Push to main = production deploy on GitHub Pages. Deploys are ask-first. Source of truth for era-gated content is `docs/ERAS.md`.
