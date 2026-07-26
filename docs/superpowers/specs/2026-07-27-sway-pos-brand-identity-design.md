# Sway POS — Brand Identity Design

**Date:** 2026-07-27
**Status:** Approved

---

## 1. Overview

Brand identity for Sway POS — an offline-first PWA point-of-sale for Indonesian coffee shops (warkop). Built with vanilla HTML/CSS/JS, IndexedDB, dark mode.

---

## 2. Brand Positioning

| | |
|---|---|
| **Product** | Sway POS — POS for warkop |
| **Naming** | Sway (inspired by Sway WM / Arch Linux) |
| **Target** | Warkop Indonesia — traditional to modern |
| **Vibe** | Warm, trustworthy, simple, modern-Indonesia |
| **Personality** | Hangat tapi profesional, tidak kaku |

### Tagline

*Belum ditentukan* — pilih saat implementasi:

- "POS untuk warkop Indonesia"
- "Mode warkop."
- "Dua mode. Satu POS."

---

## 3. Color Palette

Four-color system. Base + accent + neutral.

| Name | Hex | Usage |
|---|---|---|
| Dark Base | `#0f0f12` | Background (dark mode) |
| Amber | `#f59e0b` | Primary accent — buttons, highlights, active states |
| Cream | `#f5f0e8` | Background (light mode), text on dark |
| Charcoal | `#1a1a1a` | Text on light mode |

### Mode distribution

#### Dark Mode
- Background: `#0f0f12`
- Text: `#f5f0e8` (cream)
- Accent: `#f59e0b` (amber)
- UI surface: step above dark base

#### Light Mode
- Background: `#f5f0e8` (cream)
- Text: `#1a1a1a`
- Accent: `#f59e0b` (amber)
- UI surface: step below cream

---

## 4. Typography

| Mode | Font | Stack |
|---|---|---|
| Both | Inter (sans-serif) | `Inter, system-ui, sans-serif` |

Inter: warm, readable, modern — fits both warkop and modern café contexts.

---

## 5. Logo

### Mark
Monogram "S" with dual interpretation:
- Coffee shop vibe: flowing S curve reminiscent of coffee steam / cup silhouette
- Developer connection: the same S reads as a window-manager tiling frame

One mark, two readings. Simple geometric form, scalable to app icon (rounded square).

### Wordmark
**SWAY** — all caps, clean, generous letter-spacing. Inter or matching sans.

### App Icon
- Dark mode: logo mark + `#0f0f12` bg
- Light mode: logo mark + `#f5f0e8` bg
- OS adaptive: use both variants

---

## 6. Brand Applications

### App UI (CSS)
- CSS custom properties on `:root`
- Mode switching via class on `<html>`: `.theme-dark` / `.theme-light`
- All colors, surfaces, borders tokenized

### Touchpoints

| Touchpoint | Dark Mode | Light Mode |
|---|---|---|
| App header | Dark bg + amber accent | Cream bg + amber accent + dark text |
| Category pills | Amber active, dark bg inactive | Amber active, cream bg inactive |
| Buttons (+ / action) | Amber | Amber |
| Cart / sidebar | Dark surface | Cream surface |
| Payment screen | Amber CTA | Amber CTA |
| Receipt | Dark bg + amber | Cream bg + dark text |
| Splash / login | Dark + big logo | Cream + big logo |

---

## 7. Mode Switching

Already exists in codebase (mode selector from `a31e002`). Implementation:

1. Define all visual tokens as CSS custom properties on `:root` and `.theme-dark` / `.theme-light`
2. Toggle class to switch
3. Persist preference in localStorage

---

## 8. Future / Out of Scope

- Clone project for modern café (separate brand identity)
- Full brand guidelines deck (visual board via brandkit skill — separate task)
- Physical touchpoints (receipt paper, stamp card, signage)

---

## 9. Design Rationale

**Why amber?** Warm like coffee, visible on dark and light backgrounds, distinctive from generic blue/green POS apps.

**Why Inter?** Readable at small sizes (menu items), professional, open-source, works for Indonesian text.

**Why only two modes?** Covers all usage contexts — dim warkop (dark) and bright warkop / daytime (light). No need for a separate developer mode since Sway POS targets warkop operators, not developers.

**Why single logo mark?** One recognizable shape across all touchpoints. Simpler to implement, stronger brand recall.
