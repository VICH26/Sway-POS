# SWAY POS

> POS system for warkop. Offline-first. Dark mode.

**SWAY** is a Progressive Web App point-of-sale built for Indonesian coffee shops (warkop). Runs fully offline — indexedDB + service worker. No server, no internet needed after first load.

## Features

- **Menu** — categorized items with variants (hot/cold) and add-ons
- **Cart** — multi-item, customer name, quantity, price formatting
- **Payment** — instant payment with change calculation
- **Shift** — Buka Warung / Tutup Warung with cash ledger
- **Open Bill** — save unpaid orders, recall later
- **Employee Meal** — separate consumption tracking
- **Cash Ledger** — Kas Masuk / Kas Keluar history
- **Admin** — manage menus, add-ons, variants
- **Display modes** — tablet landscape / phone portrait
- **PWA** — installable, works offline

## Tech

| Layer | |
|-------|---|
| UI | Vanilla HTML + CSS + JS |
| Storage | IndexedDB |
| Offline | Service Worker (cache-first) |
| APK | WebView wrapper for Play Store distribution |

## Screenshots

| Header + Menu | Cart | Payment |
|---|---|---|
| <img src="icons/icon-512.png" width="200"> | <img src="icons/icon-512.png" width="200"> | <img src="icons/icon-512.png" width="200"> |

## Install

### PWA
1. Open `https://vich26.github.io/Sway-POS` in Chrome
2. Tap "Add to Home Screen"
3. Opens like native app

### APK
Download latest APK from [Releases](https://github.com/VICH26/Sway-POS/releases)

### Dev
```bash
git clone https://github.com/VICH26/Sway-POS.git
# Serve with any HTTP server, e.g.:
python3 -m http.server 8080
# Open http://localhost:8080
```

## Usage

1. Tap **Buka Warung** to start shift
2. Select menu category, tap items to add to cart
3. Enter customer name (optional)
4. **Bayar Sekarang** — enter payment amount, get change
5. **Tutup Warung** — end shift, see recap

Admin panel: tap **Admin** (no auth yet).

## License

MIT
