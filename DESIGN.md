---
version: "alpha"
name: Dance With Dixon
description: Parent brand for Dance With Dixon (DWD) — theatrical, modern, warm. Forest-green + terracotta + ivory on a Cormorant/Outfit/Bebas type stack. Est. 2025.
colors:
  # Raw brand palette
  forest: "#0c1f17"
  forest-light: "#1a3d2e"
  forest-mid: "#1e4432"
  terra-light: "#d4775f"
  terra: "#C8614B"
  terra-dark: "#a8503e"
  pink: "#f8d7c8"
  pink-light: "#fef0f0"
  ivory: "#FAF3E8"
  ivory-dim: "#e8ddd0"
  seafoam: "#6BAF8A"
  cream: "#f5f0e8"
  black: "#0a0a0a"
  white: "#ffffff"

  # Semantic roles (what agents should reference)
  primary: "{colors.forest}"
  secondary: "{colors.pink}"
  tertiary: "{colors.terra}"
  neutral: "{colors.ivory}"
  surface: "{colors.forest}"
  surface-elevated: "{colors.forest-light}"
  on-surface: "{colors.ivory}"
  on-surface-muted: "{colors.ivory-dim}"
  accent: "{colors.terra}"
  on-accent: "{colors.ivory}"
  error: "#c14545"
  on-error: "{colors.ivory}"

  # Tamara Mark memorial — never use for anything else
  tamara-gold: "#e2b955"
  tamara-rose-start: "#c9956c"
  tamara-rose-mid: "#e8c49a"
  tamara-rose-end: "#d4a574"

typography:
  headline-display:
    fontFamily: "Cormorant Garamond"
    fontWeight: "500"
    fontSize: 4rem
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: "Cormorant Garamond"
    fontWeight: "600"
    fontSize: 3rem
    lineHeight: 1.15
  headline-md:
    fontFamily: "Cormorant Garamond"
    fontWeight: "600"
    fontSize: 2.25rem
    lineHeight: 1.2
  headline-sm:
    fontFamily: "Outfit"
    fontWeight: "600"
    fontSize: 1.5rem
    lineHeight: 1.3
  body-lg:
    fontFamily: "Outfit"
    fontWeight: "400"
    fontSize: 1.125rem
    lineHeight: 1.6
  body-md:
    fontFamily: "Outfit"
    fontWeight: "400"
    fontSize: 1rem
    lineHeight: 1.6
  body-sm:
    fontFamily: "Outfit"
    fontWeight: "400"
    fontSize: 0.875rem
    lineHeight: 1.5
  label-lg:
    fontFamily: "Outfit"
    fontWeight: "500"
    fontSize: 1rem
    lineHeight: 1.4
    letterSpacing: "0.02em"
  label-md:
    fontFamily: "Outfit"
    fontWeight: "500"
    fontSize: 0.875rem
    lineHeight: 1.4
    letterSpacing: "0.02em"
  label-sm:
    fontFamily: "Outfit"
    fontWeight: "600"
    fontSize: 0.75rem
    lineHeight: 1.3
    letterSpacing: "0.08em"
  impact:
    fontFamily: "Bebas Neue"
    fontWeight: "400"
    fontSize: 2.5rem
    lineHeight: 1
    letterSpacing: "0.04em"

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  xxxl: 96px
  gutter: 24px
  margin: 32px

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
  full: 9999px

components:
  # Primary button + states
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: 14px
    typography: "{typography.label-lg}"
  button-primary-hover:
    backgroundColor: "{colors.terra-light}"
  button-primary-active:
    backgroundColor: "{colors.terra-dark}"
  button-primary-disabled:
    backgroundColor: "{colors.forest-mid}"
    textColor: "{colors.on-surface-muted}"

  # Secondary button + states
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 14px
    typography: "{typography.label-lg}"
  button-secondary-hover:
    backgroundColor: "{colors.forest-light}"

  # Input + states
  input:
    backgroundColor: "{colors.forest-mid}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.body-md}"
  input-focus:
    backgroundColor: "{colors.forest-light}"
  input-error:
    backgroundColor: "{colors.forest-mid}"
    textColor: "{colors.error}"

  # Card + hover
  card:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  card-hover:
    backgroundColor: "{colors.forest-mid}"

  # Badge
  badge:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 6px
    typography: "{typography.label-sm}"

  # Chip (filter / selection)
  chip:
    backgroundColor: "{colors.forest-light}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    padding: 8px
    typography: "{typography.label-md}"
  chip-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"

  # Tooltip
  tooltip:
    backgroundColor: "{colors.ivory}"
    textColor: "{colors.forest}"
    rounded: "{rounded.sm}"
    padding: 8px
    typography: "{typography.label-sm}"
---

## Overview

Dance With Dixon (DWD) is a choreographer-run dance brand — not a boardroom product. The visual system is **theatrical, modern, and warm**. Forest green grounds it, terracotta gives it heat, ivory makes it legible, pink adds softness. Cormorant Garamond carries the drama; Outfit keeps the UI clean; Bebas Neue is reserved for the big moments.

**Brand feel:** clean, modern, theatrical — not corporate, not cutesy. Dixon is an artist building a business.

**Est. 2025.** Use "Est. 2025" in brand copy and "© 2026" in copyright lines.

## Colors

A four-color palette grounded in forest and heated by terracotta.

- **Primary — Midnight Forest Green (#0c1f17):** the primary surface. Deep, quiet, confident. Most UI starts here; ivory sits on top.
- **Secondary — Blush Pink (#f8d7c8):** soft accent for taglines, accent cards, secondary text on dark. Never for primary CTAs.
- **Tertiary — Terracotta (#C8614B):** the accent that pulls the eye. Buttons, CTAs, active states, badges, hover emphasis. Terracotta replaced gold on April 15, 2026 — there is no gold in the UI anymore.
- **Neutral — Warm Ivory (#FAF3E8):** replaces pure white for all text and light backgrounds. Warmer, more cohesive.
- **Seafoam (#6BAF8A):** tertiary green used sparingly where forest is too dark to read. Elite track accent in dwdPS.

## Typography

Three families, each with a clear lane.

- **Cormorant Garamond** — display, headlines, hero copy. Anywhere the brand needs to feel like a marquee.
- **Outfit** — everything operational. Default body text, buttons, forms, UI.
- **Bebas Neue** — the `impact` token only. Big marketing moments: section breaks, stat displays, poster-style callouts. Never in paragraph copy.

Scales follow the spec conventions (`headline-*`, `body-*`, `label-*`). Headlines run in Cormorant through `headline-md`; `headline-sm` crosses over to Outfit for UI-adjacent titles.

## Layout

An **8px base scale** with a 4px half-step for micro-adjustments. Gutters default to 24px, page margins to 32px on desktop. The brand favors generous breathing room — cards use 24px internal padding, sections separate with 64px+ vertical space.

No strict column grid is enforced; use a fluid grid on mobile and a 1200px max-width on desktop.

## Elevation & Depth

Elevation comes from **tonal layering**, not heavy shadows. The forest palette has three stops (`forest`, `forest-light`, `forest-mid`) that act as elevation tiers — use `forest-light` for cards and elevated surfaces, `forest-mid` for hover or nested elevation. Drop shadows should be subtle (`rgba(12, 31, 23, 0.22)` at most), and only for content that genuinely needs lift.

## Shapes

**Softly-rounded, never sharp.** Interactive elements use 8px (`rounded.md`). Cards step up to 16px (`rounded.lg`). Badges and chips go fully pill-shaped (`rounded.full`). Avoid mixing sharp corners and rounded corners in the same view.

## Components

The `components` tokens in the front matter define button, input, card, badge, chip, and tooltip styles — including hover/active/disabled/focus/error variants as `<name>-<state>` keys.

Agents picking this up should prefer the semantic color tokens (`accent`, `surface`, `on-surface`) over raw palette names (`forest`, `terra`) so that theming remains consistent.

## Do's and Don'ts

**Do:**
- Do use terracotta as the single accent color — one primary action per screen, no competing CTAs.
- Do use ivory (`#FAF3E8`) for text on dark surfaces. Never pure white.
- Do respect the Tamara Mark — include it in every DWD project, hidden or signature mode. Assets at `~/Desktop/DWD/_brand/tamara-mark/`.
- Do use the short-form casing when abbreviating sub-brands: `dwdPROSERIES`/`dwdPS`, `dwdCOLLECTIVE`/`dwdC`.
- Do write in Dixon's voice: warm, direct, passionate. Artist building a business.

**Don't:**
- Don't use gold (`#e2b955`) or rose gold anywhere in the UI — those are reserved exclusively for the Tamara Mark memorial.
- Don't use emojis in designs or UI. Ever.
- Don't write corporate-speak or cutesy stock-marketing voice.
- Don't call the parent brand "DWDC" — the parent is **DWD**. DWDC is only the adult collective sub-brand.
- Don't mix rounded and sharp corners in the same view.
- Don't drop WCAG AA contrast on text (4.5:1 normal, 3:1 large).

## Tamara Mark — Memorial

Two interlocking circles in a rose gold gradient (`#c9956c → #e8c49a → #d4a574`), honoring Dixon's mother, Tamara S. Bowles (passed March 11, 2026). Appears in every DWD project — sometimes hidden, sometimes signature. Assets at `~/Desktop/DWD/_brand/tamara-mark/`.

## Logos

Animated transparent WebM is the default for web, video, and presentations. Static PNG is the fallback for favicons, print, and small nav icons.

- **Green logos** on light/pink/cream backgrounds.
- **Pink logos** on dark/green/black backgrounds.

Sources: `~/Desktop/DWD/_brand/Logos/` (static) · `~/Desktop/DWD/_brand/animated-logos/output/` (animated).
