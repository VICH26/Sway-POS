# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Sway POS
**Generated:** 2026-07-27
**Category:** POS / Point of Sale (Warkop Indonesia)

---

## Global Rules

### Color Palette

Four-color system. All tokens defined as CSS custom properties, switched via `.theme-dark` / `.theme-light`.

#### Dark Mode (`.theme-dark`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#0f0f12` | App background |
| `--color-surface` | `#1a1a1e` | Cards, UI surfaces (step above bg) |
| `--color-text` | `#f5f0e8` | Primary text (cream) |
| `--color-text-secondary` | `#a8a29e` | Secondary text |
| `--color-accent` | `#f59e0b` | Amber — buttons, highlights, active states |
| `--color-accent-hover` | `#d97706` | Darker amber for hover |
| `--color-border` | `#2a2a2e` | Dividers, borders |

#### Light Mode (`.theme-light`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#f5f0e8` | App background (cream) |
| `--color-surface` | `#e8e3db` | Cards, UI surfaces (step below cream) |
| `--color-text` | `#1a1a1a` | Primary text (charcoal) |
| `--color-text-secondary` | `#6b7280` | Secondary text |
| `--color-accent` | `#f59e0b` | Amber — buttons, highlights, active states |
| `--color-accent-hover` | `#d97706` | Darker amber for hover |
| `--color-border` | `#d4d0c9` | Dividers, borders |

### Typography

| Property | Value |
|----------|-------|
| Font | Inter |
| Stack | `Inter, system-ui, sans-serif` |
| Google Fonts | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap` |

**Why Inter:** Readable at small sizes (menu items), professional, open-source, works for Indonesian text.

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline spacing |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |
| `--space-2xl` | `48px` | Section margins |
| `--space-3xl` | `64px` | Hero padding |

### Shadow Depths

| Level | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.4)` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.5)` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |

---

## Component Specs

### Buttons

```css
.btn-primary {
  background: var(--color-accent);
  color: #0f0f12;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
  transition: opacity 200ms ease, transform 200ms ease;
  cursor: pointer;
}
.btn-primary:hover { opacity: 0.9; }
.btn-primary:active { opacity: 0.8; }

.btn-secondary {
  background: transparent;
  color: var(--color-accent);
  border: 2px solid var(--color-accent);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
  transition: all 200ms ease;
  cursor: pointer;
}
.btn-secondary:hover {
  background: var(--color-accent);
  color: #0f0f12;
}
```

### Category Pills

```css
.pill {
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
  border: none;
}
.pill-active {
  background: var(--color-accent);
  color: #0f0f12;
}
.pill-inactive {
  background: var(--color-surface);
  color: var(--color-text-secondary);
}
```

### Cards

```css
.card {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  color: var(--color-text);
  font-family: Inter, system-ui, sans-serif;
  transition: border-color 200ms ease;
}
.input:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
}
```

---

## Style Guidelines

**Style:** Warm Minimal — functional, trustworthy, modern-Indonesia.

**Keywords:** Warm, clean, utilitarian, coffee-shop, amber accent, dark-mode first, readable, trustworthy.

**Best For:** Point-of-sale, warkop Indonesia, F&B operations, offline-first PWA.

**Key Effects:** Flat surfaces, clear hierarchy, high contrast, amber as sole accent, generous touch targets.

---

## Brand

| Element | Detail |
|---------|--------|
| Product | Sway POS — POS for warkop |
| Naming | Sway (inspired by Sway WM / Arch Linux) |
| Target | Warkop Indonesia — traditional to modern |
| Vibe | Warm, trustworthy, simple, modern-Indonesia |
| Personality | Hangat tapi profesional, tidak kaku |
| Logo | Monogram "S" (coffee steam ↔ tiling WM), wordmark "SWAY" all-caps |

---

## Anti-Patterns (Do NOT Use)

- ❌ **Emojis as icons** — Use SVG icons (Phosphor `@phosphor-icons/react` primary, Heroicons secondary)
- ❌ **Generic blue/green accent colors** — Amber is the only accent
- ❌ **Missing cursor:pointer** — All clickable elements
- ❌ **Low contrast text** — Maintain 4.5:1 minimum
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Content behind safe areas** — Respect notch, status bar, gesture area
- ❌ **Layout-shifting hovers** — Use opacity/color, not scale/width transforms that shift content
- ❌ **Invisible focus states** — Visible focus ring for keyboard navigation

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (use SVG)
- [ ] All icons from consistent set (Phosphor)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Dark mode tested independently from light mode
- [ ] Text contrast >=4.5:1 in both modes
- [ ] Touch targets >=44x44pt
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Safe areas respected (notch, status bar, gesture area)
- [ ] Responsive: 375px, 768px, 1024px
