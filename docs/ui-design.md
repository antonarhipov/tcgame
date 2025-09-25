# UI Design Guidelines — KotlinConf-inspired theme (Dark-first)

Context
- Date: 2025-09-25
- Goal: Align this project’s UI look & feel with KotlinConf website styles. Follow colors closely and implement a robust dark theme.
- Sources analyzed (local offline copy):
  - kotlinconf/kotlinconf.com/index.html
  - kotlinconf/kotlinconf.com/static/header-logo-light-*.svg (brand gradient stops)
  - kotlinconf/kotlinconf.com/favicon-2026.svg (brand gradient stops)
  - Various embedded CSS tokens (RescUI/Ring UI-style vars) in HTML

Key Takeaways
- KotlinConf uses a dark-first aesthetic with pure-black page background and vivid, neon-like brand accents.
- Typography relies on JetBrains Sans for UI and headings; Inter is a common fallback.
- Visual language: clean surfaces, thin borders, subtle separation, bold gradient highlights, and large pill-shaped CTAs.

1) Color System (Dark theme)

Authoritative tokens observed in index.html (:root section) and SVGs:
- Primary purple
  - --rs-color-primary: #8F00E7
  - Transparent variants present (e.g., rgba(143, 0, 231, .8/.6/.4/.2/.1))
- Magenta
  - --kt-color-magenta: #C202D7
- Pink
  - --kt-color-pink: #E00189
  - Pink variants present: rgba(224, 1, 137, .8/.6/.4/.2)
- Orange (secondary accent)
  - --kt-color-orange: #FF5A13
  - Variants: rgba(255, 90, 19, .5/.3/.2)
- Gradient accents (from SVGs)
  - header-logo-light.svg: #FF021D → #C202D7
  - favicon-2026.svg: #FF021D → #E600FF

Neutrals and text hardness (derived from tokens)
- Page background: #000 (kt-page_theme-dark{background:#000})
- Text hardness levels used throughout (mapped for dark theme):
  - Text/foreground hard: #FFFFFF
  - Text/foreground average: rgba(255, 255, 255, 0.70)
  - Text/foreground pale: rgba(255, 255, 255, 0.50)
- Additional neutral seen in components (light theme ref):
  - var(--wt-color-dark, #27282C). Not a dark-surface token, but a useful neutral reference.

Recommended dark surfaces for our app (pragmatic, consistent with KotlinConf look)
- Background/base: #000000
- Surface-1 (cards, panels): #0B0B0E
- Surface-2 (elevated panels, menus): #121317
- Border/hairline: rgba(255, 255, 255, 0.12)
- Divider subtle: rgba(255, 255, 255, 0.08)
- Overlay scrim: rgba(0, 0, 0, 0.64)

2) Gradients and Highlight Usage
- Brand gradient A: linear-gradient(90deg, #FF021D 0%, #C202D7 46%, #8F00E7 100%)
- Brand gradient B: linear-gradient(90deg, #FF021D 0%, #E600FF 99%)
- Usage recommendations:
  - Hero headings keyline or underline
  - CTA button backgrounds (primary only); hover: increase brightness/contrast
  - Badges and highlights (thin borders or backgrounds at 10–20% alpha)
  - Never use gradients for long paragraphs or large content blocks

3) Typography
- Fonts
  - Primary UI/headings: JetBrains Sans, Inter, system-ui
  - Body: JetBrains Sans/Inter
  - Code (if needed): JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace
- Weights
  - Headings: 600 (semi-bold)
  - Body: 400 (regular); small annotations also 400
- Letter-spacing (observed patterns)
  - Hero/super-hero: slightly negative (e.g., -0.008em to -0.02em)
  - Body: near normal or slight positive (e.g., 0.0015em)
- Sizes (reference scale; tune per layout):
  - Super-hero: 92–142px (desktop) / 58px (mobile)
  - Hero: 72px / 42px
  - H2/H3: 40–58px / 28–36px
  - Body-1: 16px, line-height: 24px
  - Body-2/Meta: 13–14px, line-height: 20–22px

4) Spacing, Radii, and Motion
- Spacing scale (px): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96
- Radii
  - Small elements (chips, small cards): 8px
  - Large CTAs/buttons: 20px (observed var: --rs-button-border-radius: 20px)
  - Full pill: 9999px for tags/filters
- Borders and shadows
  - Prefer 1px hairline borders at low alpha over heavy shadows
  - Subtle drop shadows can use rgba(0, 0, 0, 0.32) at small blur for elevation
- Focus rings (keyboard)
  - 3–4px outer focus ring using a brand color glow
  - Suggested: box-shadow: 0 0 0 4px rgba(143, 0, 231, 0.35)

5) Components
- Header/Nav
  - Sticky; pure-black background; subtle 1px bottom border (rgba(255,255,255,0.08))
  - Active item: primary or gradient underline; inactive: average text hardness
- Buttons
  - Primary: gradient background (Brand gradient A), white text, 20px radius, 16px/24px text metrics
  - Secondary: transparent background, 1px border (rgba(255,255,255,0.12)), text color: hard; hover: bg rgba(255,255,255,0.06)
  - Tertiary: text-only with underline on hover; keep contrast accessible
- Cards/Panels
  - Surface-1 background, 8px radius, 1px border subtle
  - Title: hardness hard; meta: average; controls: right-aligned
- Tags/Chips
  - Pill radius, thin border using brand at 30–40% alpha (e.g., rgba(143,0,231,0.4))
  - Filled variant: 10–20% alpha of brand color for background; text hard or brand-contrast
- Inputs
  - Background: Surface-2; border: rgba(255,255,255,0.12)
  - Focus: brand glow ring; placeholder: pale text
- Meter/Indicators (project-specific)
  - Use accent color mapping per tier; animate with subtle opacity/scale; ensure AA contrast on overlays

6) Accessibility
- Minimum contrast targets (WCAG AA)
  - Body text: 4.5:1 against Surface-1/2 backgrounds
  - Large headings (≥24px bold): 3:1 against black background
- Never encode information using color alone; combine with text or icons
- Focus states must be visible at 3:1 contrast vs surrounding content

7) Implementation Guide (Tailwind v4 + CSS variables)

CSS variables (globals.css or app.css)
:root {
  /* Brand */
  --color-primary: #8F00E7;
  --color-magenta: #C202D7;
  --color-pink: #E00189;
  --color-orange: #FF5A13;
  --gradient-a: linear-gradient(90deg, #FF021D 0%, #C202D7 46%, #8F00E7 100%);
  --gradient-b: linear-gradient(90deg, #FF021D 0%, #E600FF 99%);

  /* Light theme (optional) */
  --text-hard: #19191C;
  --text-average: rgba(25, 25, 28, 0.70);
  --text-pale: rgba(25, 25, 28, 0.50);
  --bg: #FFFFFF;
  --surface-1: #FFFFFF;
  --surface-2: #F7F7F8;
  --border: #D9D9DA;
}

.dark {
  /* Dark theme */
  --text-hard: #FFFFFF;
  --text-average: rgba(255, 255, 255, 0.70);
  --text-pale: rgba(255, 255, 255, 0.50);
  --bg: #000000;
  --surface-1: #0B0B0E;
  --surface-2: #121317;
  --border: rgba(255, 255, 255, 0.12);
  --divider: rgba(255, 255, 255, 0.08);
}

Tailwind (tailwind.config) — theme extension sketch
- colors
  - primary: var(--color-primary)
  - magenta: var(--color-magenta)
  - pink: var(--color-pink)
  - orange: var(--color-orange)
  - fg: { hard: var(--text-hard), average: var(--text-average), pale: var(--text-pale) }
  - bg: var(--bg), surface: { 1: var(--surface-1), 2: var(--surface-2) }, border: var(--border)
- borderRadius: { md: '8px', xl: '20px', full: '9999px' }
- boxShadow focus utility: 0 0 0 4px rgba(143,0,231,.35)

Usage examples
- Page shell (dark-first)
  - <body class="dark bg-[var(--bg)] text-[var(--text-average)]"> ...
- Card
  - class="bg-[var(--surface-1)] border border-[var(--border)] rounded-md text-[var(--text-average)]"
- Button primary
  - class="rounded-[20px] text-white px-6 py-2 font-semibold"
  - style="background: var(--gradient-a)"
- Subtle divider
  - class="border-t" style="border-color: var(--divider)"

8) Do/Don’t
- Do use gradient accents sparingly for emphasis (CTA, hero, badges)
- Do keep backgrounds black and surfaces near-black with thin borders
- Do maintain clear hierarchy via hardness levels (hard → average → pale)
- Don’t flood pages with large gradient fills behind text blocks
- Don’t reduce contrast below AA; prefer average text for secondary info instead of lowering opacity too much

9) Verification Pointers (from repo)
- Colors/tokens visible in:
  - kotlinconf/kotlinconf.com/index.html → :root has --rs-color-primary, --kt-color-*
  - kotlinconf/kotlinconf.com/static/header-logo-light-*.svg → gradient #FF021D → #C202D7
  - kotlinconf/kotlinconf.com/favicon-2026.svg → gradient #FF021D → #E600FF
- Dark background seen in: .kt-page_theme-dark{background:#000}

10) Implementation Checklist
- [ ] Add CSS variables above to globals and wire Tailwind theme tokens
- [ ] Wrap app with class="dark" (or use prefers-color-scheme) and verify dark colors
- [ ] Migrate components to use fg hardness levels and surfaces
- [ ] Replace primary CTA backgrounds with gradient A
- [ ] Validate AA contrast using axe (Playwright) and manual checks
- [ ] Document deviations (if any) in docs/ui-design.md and track in docs/tasks.md

Notes
- If we later need light theme, keep variables as defined in :root and toggle .dark as needed.
- Prefer small, incremental PRs: update a few components at a time and mention task numbers in commits.
