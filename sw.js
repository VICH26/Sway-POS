const CACHE = 'sway-pos-v2'
const URLS = ['/', 'index.html', 'css/style.css', 'js/db.js', 'js/menus.js', 'js/cart.js', 'js/payment.js', 'js/shift.js', 'js/admin.js', 'js/app.js', 'manifest.json', 'data/seed.json', 'icons/icon-192.png', 'icons/icon-512.png']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS)))
  self.skipWaiting()
})

self.addEventListener('activate', e => e.waitUntil(clients.claim()))

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  )
})
