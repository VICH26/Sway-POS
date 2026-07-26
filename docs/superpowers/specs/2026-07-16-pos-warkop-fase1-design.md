# POS Warkop — Fase 1: Transaksi Kasir + Admin Menu

## Tech Stack
- **Platform:** Web PWA (jalan di Chrome tablet landscape, bisa di-install ke home screen)
- **Storage:** IndexedDB via `idb` — offline 100%, gak pake backend
- **UI:** Vanilla JS + CSS Grid — gak pake framework SPA
- **Layout:** Landscape tablet

## Data Model (IndexedDB)

### menus
```
{
  id, nama, kategori, harga_dasar, is_active,
  tersedia: ["Hangat","Dingin"] | null,   // preparation radio
  variants: [{nama, stok}] | []           // flavor variants + stock
}
```

### add_ons
```
{id, nama_addon, harga_tambahan}
```

### orders
```
{id, nama_pelanggan, status: "open"|"paid", metode_bayar, total, created_at, updated_at}
```

### order_items
```
{id, order_id, nama_menu, varian_dipilih, suhu, addon_snapshot, catatan, subtotal}
```

## Layout & Alur

### Mode Kasir — Single Page
- **Header:** Logo, kategori tabs (Minuman/Makanan/Snack), tombol Open Bill, Admin
- **Kiri 65%:** Grid menu — hanya teks, tanpa gambar
- **Kanan 35%:** Keranjang — nama pelanggan, list item, total besar, tombol SIMPAN/BAYAR

### Flow Order
1. Klik kategori → render grid
2. Klik menu → popup:
   a. Pilih varian (radio) — disable kalo stok=0, label "Habis"
   b. Pilih suhu (radio) — muncul kalo item punya `tersedia`
   c. Checkbox add-on global
   d. Catatan text
3. Tambah ke keranjang
4. Isi nama pelanggan (opsional → jadi Open Bill)
5. SIMPAN (open bill) atau BAYAR SEKARANG
6. Bayar → pilih Cash/QRIS → hitung kembalian → simpan
7. Paid → stok varian berkurang

### Mode Admin — Halaman terpisah
- PIN protection (default: 1234)
- **Dashboard:** total omzet, penjualan cash, penjualan QRIS
- **Kelola Menu:** tambah/edit/hapus menu + varian + stok
- **Kelola Add-on:** tambah/edit/hapus add-on global
- **Daftar Open Bill:** lihat closed
- **Export Excel/CSV:** (Fase 2)

## Struktur File
```
index.html           ← entry + PWA manifest
manifest.json        ← install ke tablet
sw.js                ← cache static assets
css/
  style.css
  admin.css
js/
  db.js              ← IndexedDB wrapper
  menus.js           ← render grid menu
  cart.js            ← keranjang + open bill
  payment.js         ← cash/qris flow
  admin.js           ← admin panel
data/
  seed.json          ← data awal menu + add-on
```

## Fase 1 — Tidak Termasuk
- Manajemen shift (Buka/Tutup Warung, Kas Keluar)
- Export Excel/CSV
- Laporan riwayat transaksi
