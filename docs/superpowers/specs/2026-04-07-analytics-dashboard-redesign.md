# Analytics Dashboard Redesign

**Date:** 2026-04-07
**Status:** Approved
**Goal:** Redesign the DWD analytics dashboard for mobile-first phone usage, with tabbed navigation and new data sections (signups, conversions, UTM campaigns, period comparison).

## Context

The current dashboard is a single scrolling page with 7 sections that are hard to read on mobile. Dixon checks it on his phone and primarily wants to answer two questions: "is anyone visiting?" and "are people signing up?" The ProSeries Instagram campaign starts Apr 8, making UTM/source tracking timely.

## Architecture

Same stack — no new dependencies. Three files change:

1. **`js/analytics-dashboard.js`** — full rewrite with tab system
2. **`css/additions.css`** — replace analytics CSS block with mobile-first styles
3. **Supabase RPC `get_analytics_summary`** — update to return new data fields

Files that do NOT change: `analytics.js` (tracker), `analytics.html`, auth gate.

## Tab Structure

### Tab 1: Overview
- **Period pills** (7d / 30d / 90d) — shared across all tabs, sticky position
- **2x2 stat grid:**
  - Visitors (count + % change vs prior period)
  - Page Views (count + % change)
  - Signups (count + delta)
  - Avg Time on Page (seconds)
- **Daily views bar chart** with date range labels (start/end dates)
- **Top pages** ranked list (page name + view count)

### Tab 2: Signups
- **3-column counts:** Email signups, Contact form submissions, Early Access registrations
  - Green accent (`#00D68F`) for signup-specific elements
- **Recent activity feed:** last 10 signups
  - Masked email (first char + `***` + domain)
  - Type badge (EMAIL green, EARLY ACCESS gold, CONTACT gray)
  - Relative time ("2h ago", "1d ago")
  - Source page where applicable
- **Conversion funnel:** three horizontal bars showing dropoff
  - Visited site → Viewed ProSeries → Signed up
  - Bar width proportional to count

### Tab 3: Sources
- **Stacked color bar** showing traffic source proportions
  - Instagram: `#e2b955` (gold)
  - Direct: `#00D68F` (green)
  - Google: `#FF8FAB` (pink)
  - Other: `rgba(255,255,255,0.15)`
- **Source breakdown list** with color dot + name + percentage
- **UTM campaign performance** — campaign name + visit count, only shown when UTM data exists
- **Device split bar** (mobile % vs desktop %)

## Supabase RPC Changes

Update `get_analytics_summary(days_back integer)` to return these additional fields:

### New fields:
- `email_signups` — count from `email_signups` table where `source != 'proseries-early-access'` and `created_at >= cutoff`
- `contact_submissions` — count from `website_contacts` table where `created_at >= cutoff`
- `early_access_signups` — count from `email_signups` table where `source = 'proseries-early-access'` and `created_at >= cutoff`
- `recent_signups` — last 10 rows from `email_signups` + `website_contacts`, union'd and sorted by date, with masked email, type, created_at, source
- `utm_campaigns` — from `site_analytics` where `event_type = 'session_start'` and `utm_campaign != ''`, grouped by campaign, count as visits
- `bounce_rate` — percentage of sessions with only 1 page_view event
- `conversion_funnel` — object with `{ total_visitors, proseries_viewers, total_signups }`
- `prior_period` — same core metrics (total_views, unique_visitors, signup counts) for the equivalent prior period (e.g., if days_back=7, compare to 7-14 days ago) for % change calculation

### Existing fields (keep as-is):
- `total_views`, `unique_visitors`, `active_now`, `page_views`, `avg_duration`, `top_clicks`, `traffic_sources`, `devices`, `daily_views`

## CSS Design System

Mobile-first, designed for ~360px viewport:

- **Cards:** `background: rgba(255,255,255,0.04)`, `border-radius: 10px`, `padding: 14px`
- **Stat numbers:** `font-size: 28px`, `font-weight: 700`, gold (`#e2b955`) for general metrics, green (`#00D68F`) for signups
- **Labels:** `font-size: 11px`, `text-transform: uppercase`, `color: rgba(255,255,255,0.4)`
- **Data text:** `font-size: 13px`, `color: #d4cfc0`
- **Tab bar:** sticky top, gold active state, segmented control style with `border-radius: 8px`
- **Period pills:** rounded pill buttons, gold active state, centered
- **Spacing:** consistent `10px` gap in grids, `14px` padding in cards
- **Change indicators:** green (`#00D68F`) for positive, red (`#ef4444`) for negative, gray for neutral

## Privacy

No changes to privacy model. Signup feed shows masked emails only (e.g., `j***@gmail.com`). All tracking remains cookie-free and anonymous.

## Out of Scope

- Push notifications / alerts
- Desktop-optimized layout (works on desktop but designed for phone)
- New tracker events (existing events capture everything needed)
- Historical data backfill
