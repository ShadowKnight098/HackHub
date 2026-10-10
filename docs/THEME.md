# Commons Theme — "Ivory & Burgundy" Design System

An elegant, editorial look: warm ivory paper, deep navy-charcoal ink, burgundy as the single strong accent, champagne-gold for fine details. No greens, no neon, no playful tilt. Quiet, refined, generous spacing.

## Fonts (Google Fonts)
- Headings and numbers: **Fraunces** (500, 700)
- Body and UI: **Hanken Grotesk** (400, 500, 600)
- Accent labels (italic, small captions, empty states, map labels): **Cormorant Garamond** italic (600, 700)

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Hanken+Grotesk:wght@400;500;600&family=Cormorant+Garamond:ital,wght@1,600;1,700&display=swap" rel="stylesheet">
```

## Color tokens

```css
:root {                       /* Light: Ivory */
  --bg: #f4f1ea;              /* page background (ivory) */
  --surface: #fdfcf9;         /* cards, panels, inputs */
  --ink: #1f2430;             /* primary text (navy-charcoal) */
  --muted: #6a6e7a;           /* secondary text */
  --line: #ddd7ca;            /* borders, dividers */
  --accent: #7b2d3b;          /* burgundy: buttons, selected states, links */
  --moss: #a8832f;            /* antique gold: secondary highlight */
  --sun: #c9a45c;             /* champagne: fine details, underlines */
  --sky: #2f4a6d;             /* navy: tertiary highlight */
  --n1: #f2e8cb;              /* note tint: champagne */
  --n2: #dfe4ec;              /* note tint: pale slate */
  --n3: #ecd9d9;              /* note tint: blush */
}

:root[data-theme="dark"] {    /* Dark: Charcoal */
  --bg: #14161c;
  --surface: #1c1f27;
  --ink: #efeae0;
  --muted: #9a9ba5;
  --line: #2e323d;
  --accent: #d98a9a;          /* dusty rose */
  --moss: #d4b06a;
  --sun: #e3c27d;
  --sky: #8fa8cf;
  --n1: #3d3623;
  --n2: #262c3a;
  --n3: #3b2a2f;
}
```

Visibility/status colors:
- `private`: `--accent`
- `team`: `--sky`
- `hackathon`: `--moss`
- `public`: `--muted`

## Style rules
- **Background:** `--bg` with a very faint dot grid: `radial-gradient(color-mix(in srgb, var(--ink) 9%, transparent) 1px, transparent 1.3px)`, size 22px.
- **Headings:** Fraunces 700, ~34px for page titles, tight line-height (1.1). A 2px, 48px-wide `--sun` rule sits under each page title (`title-rule`).
- **Body text:** Hanken Grotesk 15px / 1.5.
- **Cards and panels:** `--surface`, 1px `--line` border, 10px radius, soft shadow `0 12px 32px -22px rgba(20,24,40,.5)`.
- **Primary button:** `--accent` background, `--bg` text, 8px radius, slight letter-spacing (.02em). Hover: brighten ~8%.
- **Selected chip / active filter:** `--accent` background, `--bg` text.
- **Active nav item:** `--surface` background with a 2px inset `--sun` bar on the left.
- **Sticky notes:** straight (no rotation), 6px radius, 3px `--sun` top border, soft shadow; tinted with `--n1`, `--n2`, `--n3`.
- **Logo mark:** a 30px circle filled with `linear-gradient(135deg, var(--sun), var(--moss))`.
- **Italic labels:** Cormorant Garamond italic 700 with slight letter-spacing (.01em).
- **Focus ring:** 2px solid `--accent`, 1px offset.
- **Motion:** gentle 0.2–0.3s ease transitions only; respect `prefers-reduced-motion`.

## Do and don't
- Do keep burgundy as the only strong color. Gold stays small: underlines, borders, icons.
- Do keep contrast at WCAG AA or better in both modes.
- Don't add gradients on surfaces, bright colors, heavy shadows, or rotated elements.
