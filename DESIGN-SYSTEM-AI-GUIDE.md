# DB UX Design System - AI Implementation Guide

This guide provides AI assistants with the essential context to correctly and efficiently implement the DB UX Design System.

## System Architecture Overview

The design system uses a layered CSS architecture with data attributes for theming, sizing, and styling. All styling is pure CSS — no JavaScript required.

### Core Principle: Zero-Config Defaults

Everything works without any data attributes on `<html>`. The system provides CSS fallbacks for all defaults:
- Color: `neutral`
- Material: `filled`
- WCAG: `aa`
- Size: `md`
- Spacing: `md`
- Mode: automatic via `prefers-color-scheme`

You only set data attributes when you want to **override** a default.

### Core Files
- `db-foundation.css` — Color, material, contrast, interaction, and emphasis system
- `db-size-complete.css` — Size, spacing, and relation system
- Both files work independently but complement each other

---

## COLOR SYSTEM

### Layer Architecture (Bottom to Top)

```
THEME → DATA-COLOR → DATA-MODE → DATA-MATERIAL → CONTRAST → FINAL TOKENS
```

### 1. THEME Layer
Real color values using `light-dark()` for automatic mode switching.
- Located in `:root`
- Each color has a 0–14 scale: `--theme-neutral-0` through `--theme-neutral-14`
- Plus origin, on-origin, transparent-full, and transparent-semi variants
- `light-dark()` inverts scales automatically — no separate dark mode values needed

### 2. DATA-COLOR Layer
Maps theme colors to semantic `--data-mode-*` variables.
- Selector: `[data-color="neutral"]`, `[data-color="brand"]`, etc.
- Creates `--data-mode-0` through `--data-mode-14`
- Creates `--inherited-mode-*` for inheritance to children
- Fallback: Without any `data-color` in the DOM, neutral is used automatically

### 3. DATA-MODE Layer
Optional override for light/dark mode per element subtree.
- `[data-mode="light"]` — forces light mode
- `[data-mode="dark"]` — forces dark mode
- Default: automatic via `color-scheme: light dark` and `prefers-color-scheme`

### 4. DATA-MATERIAL Layer
Defines surface materials with different visual treatments.
- `filled` — Standard filled background (default, no attribute needed)
- `filled-2` — Alternative filled variant
- `vibrant` — High contrast emphasis
- `inverted` — Inverted colors
- `origin` — Brand origin colors
- `transparent` — Fully transparent
- `semi-transparent` — Semi-transparent overlay

Material inherits from parent via `--inherited-material-*` variables. Elements without `data-material` automatically use the parent's material values.

### 5. CONTRAST Layer
- `data-container-contrast` — Controls border contrast (`min` | `max`)
- `data-content-contrast` — Controls text/visual contrast (`min` | `max`)
- Defaults: container=`min`, content=`max`
- Works with and without `data-material` set
- Does NOT inherit — must be set explicitly on each element

### 6. FINAL TOKENS
Runtime CSS variables consumed by components:
- `--db-background` / `--db-background-hovered` / `--db-background-pressed`
- `--db-text` / `--db-text-hovered` / `--db-text-pressed`
- `--db-border`
- `--db-visual` / `--db-visual-hovered` / `--db-visual-pressed`

---

## COLOR SYSTEM USAGE

### Minimal Setup (Zero Config)

```html
<!-- Everything works with no attributes at all -->
<html lang="de">
  <body>
    <div class="adaptive">
      <!-- Uses: neutral color, filled material, AA contrast, auto mode -->
    </div>
  </body>
</html>
```

### Overriding Defaults

```html
<!-- Only set what you want to change -->
<html data-wcag="aaa">
  <!-- AAA globally, everything else stays default -->
  
  <div data-color="brand">
    <!-- Brand color for this subtree -->
  </div>
  
  <div data-material="vibrant">
    <!-- Vibrant material, inherits neutral color -->
  </div>
</html>
```

### Available Colors
`neutral`, `brand`, `action`, `blue`, `burgundy`, `cyan`, `green`, `light-green`, `orange`, `pink`, `red`, `turquoise`, `violet`, `yellow`

### Inheritance Rules

**Inherits from parent (set once, children get it):**
- ✅ `data-color`
- ✅ `data-wcag`
- ✅ `data-mode`
- ✅ `data-material` (via `--inherited-material-*` variables)

**Does NOT inherit (set explicitly per element):**
- ❌ `data-container-contrast`
- ❌ `data-content-contrast`
- ❌ `data-interactive`
- ❌ `data-emphasis`

### Mode Control

```html
<!-- Automatic mode (default, no attribute needed) -->
<html><!-- Uses prefers-color-scheme --></html>

<!-- Force dark mode for a subtree -->
<div data-mode="dark">
  <!-- This and all children use dark mode -->
</div>
```

### Contrast Control

```html
<!-- Default behavior: container=MIN, content=MAX (no attributes needed) -->
<div class="adaptive">Standard contrast</div>

<!-- Override container contrast (stronger border) -->
<div class="adaptive" data-container-contrast="max">Stronger border</div>

<!-- Override content contrast (lighter text) -->
<div class="adaptive" data-content-contrast="min">Lower text contrast</div>

<!-- Works with or without data-material -->
<div class="adaptive" data-material="vibrant" data-content-contrast="min">Also works</div>
```

### Interactive States

```html
<button class="adaptive" data-material="vibrant" data-interactive>
  Hover over me
</button>
```

`data-interactive` adds `cursor: pointer` and enables hover/pressed state transitions.

### Emphasis

```html
<!-- Default (regular), no attribute needed -->
<p>Normal text</p>

<!-- Weak emphasis: reduced text opacity -->
<p data-emphasis="weak">De-emphasized text (75% text opacity via color-mix)</p>

<!-- Strong emphasis: bold text -->
<p data-emphasis="strong">Important text (font-weight: bold)</p>
```

Values: `weak` | `regular` (default) | `strong`

---

## SIZE SYSTEM

### Layer Architecture

```
NUMBERS → DATA-SIZE → DATA-RELATION → INHERITANCE → FINAL TOKENS
```

### 1. NUMBERS Layer
Base size values in pixels, defined in `:root`.
- Range: `--size-0: 0px` to `--size-2048: 2048px`

### 2. DATA-SIZE Layer
Five component size variants: `xs`, `sm`, `md`, `lg`, `xl`

Each size defines:
- `--size-container` — Component height
- `--size-icon` — Icon dimensions
- `--size-text` / `--size-text-min` — Font size
- `--size-line-height` / `--size-line-height-min` — Line height
- `--size-gap` — Spacing between elements
- `--size-padding` / `--size-padding-min` — Internal padding
- `--size-border-radius` / `--size-border-radius-full` — Corner radius

Default: `md` (no attribute needed)

### 3. DATA-RELATION Layer
Relative size modifiers that shift the size value.

- `smaller-3` — Shift down 3 steps
- `smaller-2` — Shift down 2 steps
- `smaller` — Shift down 1 step
- `main` — No change (default)
- `bigger` — Shift up 1 step
- `bigger-2` — Shift up 2 steps

Example: `data-size="md"` + `data-relation="smaller"` = visually `sm`

### 4. Size Inheritance
Elements without `data-size` inherit from parent via `--inherited-size-*` variables.

### Size Scale Reference

```
xs:  20px container, 14px icon, 10.66px text
sm:  24px container, 18px icon, 13.33px text
md:  32px container, 20px icon, 16px text
lg:  40px container, 24px icon, 18.66px text
xl:  48px container, 28px icon, 21.33px text
```

---

## SPACING SYSTEM

Separate from the size system. Controls layout spacing (padding and gap) for containers.

### DATA-SPACING Layer

| Spacing | Padding | Gap (0.5× padding) |
|---------|---------|---------------------|
| `xs`    | 12px    | 6px                 |
| `sm`    | 16px    | 8px                 |
| `md`    | 24px    | 12px (default)      |
| `lg`    | 32px    | 16px                |
| `xl`    | 48px    | 24px                |

Gap is always half of padding.

### Usage

```html
<!-- Default spacing (md), no attribute needed -->
<div class="card adaptive">padding: 24px, gap: 12px</div>

<!-- Compact layout -->
<div class="card adaptive" data-spacing="xs">padding: 12px, gap: 6px</div>

<!-- Spacious layout -->
<div class="card adaptive" data-spacing="lg">padding: 32px, gap: 16px</div>
```

### Size vs Spacing

- `data-size` → Component properties (button height, icon size, font size)
- `data-spacing` → Layout spacing (container padding, gaps between children)

They are independent and can be combined freely.

---

## THE `.adaptive` UTILITY CLASS

Convenience class that applies all common adaptive properties:

```css
.adaptive {
  padding: var(--size-padding);
  border-radius: var(--size-border-radius);
  font-size: var(--size-text);
  background: var(--db-background);
  color: var(--db-text);
  border: var(--size-1) solid var(--db-border);
  line-height: var(--size-line-height);
}
```

Not required — you can also reference the CSS variables directly in your own classes.

---

## COMPONENT CSS PATTERNS

```css
.button {
  height: var(--size-container);
  font-size: var(--size-text);
  padding: 0 var(--size-padding);
  gap: var(--size-gap);
  border-radius: var(--size-border-radius);
  background: var(--db-background);
  color: var(--db-text);
  border: var(--size-1) solid var(--db-border);
}

.icon {
  width: var(--size-icon);
  height: var(--size-icon);
  fill: var(--db-visual);
}

.card {
  padding: var(--spacing-padding);
  gap: var(--spacing-gap);
  border-radius: var(--size-border-radius);
  background: var(--db-background);
  color: var(--db-text);
  border: var(--size-1) solid var(--db-border);
}
```

### Common HTML Patterns

```html
<!-- Card with local color override -->
<div class="adaptive" data-color="blue">Blue card</div>

<!-- Section with forced dark mode -->
<section data-mode="dark">
  <div class="adaptive" data-material="vibrant" data-color="brand">
    Inherits dark mode, uses brand color
  </div>
</section>

<!-- Button with interaction -->
<button class="adaptive" data-material="vibrant" data-interactive>Click me</button>

<!-- Nested inheritance -->
<div data-color="brand" data-size="lg">
  <div class="adaptive">Inherits brand color, lg size, filled material</div>
  <div class="adaptive" data-material="vibrant">Overrides material</div>
</div>

<!-- Card with relative sizing for hierarchy -->
<div class="adaptive" data-size="lg">
  <h2>Title</h2>
  <p data-relation="smaller">Text is visually MD (lg - 1 step)</p>
</div>

<!-- De-emphasized helper text -->
<div class="adaptive">
  <p>Main content</p>
  <p data-emphasis="weak">Secondary info</p>
  <p data-emphasis="strong">Important notice</p>
</div>
```

---

## CRITICAL RULES FOR AI IMPLEMENTATION

### DO ✅

1. **Let defaults work** — Don't set `data-color="neutral"`, `data-material="filled"`, `data-size="md"`, or `data-spacing="md"`
2. **Use `rem` not `px`** — All sizing should use rem (16px = 1rem base)
3. **Use `gap` and `padding` only** — No margins anywhere
4. **Use data attributes for theming** — Never inline styles for colors/sizes
5. **Use inheritance** — Set attributes on parent containers, let children inherit
6. **Set `data-interactive` on clickable elements** — Buttons, links, clickable cards
7. **Use size relations for hierarchy** — Parent `lg`, child with `data-relation="smaller"`
8. **Nested elements need smaller size** — Inner adaptive elements should use `data-relation="smaller"` so border-radius fits the parent's padding
9. **Reference final tokens in CSS** — `var(--db-background)`, `var(--size-container)`, `var(--spacing-padding)`
10. **WCAG is a global decision** — Set `data-wcag` on `<html>` if needed, not per element

### DON'T ❌

1. **Don't set defaults explicitly** — No `data-material="filled"`, no `data-color="neutral"`, no `data-size="md"`
2. **Don't use `!important`** — The system is designed to work without it
3. **Don't use margins** — Use `gap` and `padding` only
4. **Don't use `px`** — Use `rem` (or the size system tokens)
5. **Don't use inline styles** — Use data attributes and CSS classes
6. **Don't set `data-mode` globally** — Let `prefers-color-scheme` handle it
7. **Don't use `var()` fallbacks** — Fallbacks are in `:root`, not in `var()` calls
8. **Don't expect contrast to inherit** — `data-container-contrast` and `data-content-contrast` must be set explicitly
9. **Don't create artificial specificity** — Keep selectors simple
10. **Don't use JavaScript for theming** — Everything is CSS-based

---

## DEBUGGING TIPS

### Color not working?
- Check if a parent has `data-color` set — it inherits
- Without any `data-color` in the DOM, neutral is used automatically

### Material not working?
- Material inherits from parent via CSS variables
- Without any `data-material` in the DOM, filled is used automatically

### Contrast not working?
- Contrast does NOT inherit — set it explicitly on the element
- Works with and without `data-material`
- Default: container=MIN, content=MAX

### Size not working?
- Default is `md` without any attribute
- Check if CSS uses `var(--size-*)` tokens
- Ensure `db-size-complete.css` is loaded

---

## BROWSER SUPPORT

- Modern browsers with CSS custom properties support
- `light-dark()` function (Chrome 123+, Firefox 120+, Safari 17.5+)
- All theming is CSS-only, no JavaScript overhead

---

## EXAMPLES

See `test.html` for working examples of all features including playground, materials, colors, contrast, modes, sizes, relations, spacing, and emphasis.
