try { JSON.parse(localStorage.getItem('sway_settings') || '{}') } catch(e) { localStorage.removeItem('sway_settings') }
try { JSON.parse(localStorage.getItem('sway_cart') || '{}') } catch(e) { localStorage.removeItem('sway_cart') }
window.parsePrice = s => parseInt(String(s).replace(/\./g, '')) || 0

document.addEventListener('input', e => {
  if (!e.target.matches('.price-input')) return
  const s = e.target.selectionStart
  const r = e.target.value.replace(/\./g, '').replace(/\D/g, '')
  const f = r.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (f !== e.target.value) { e.target.value = f; e.target.setSelectionRange(s + (f.length - e.target.value.length), s + (f.length - e.target.value.length)) }
})

function initTheme() {
  const saved = localStorage.getItem('sway_theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (saved === 'light' || (!saved && !prefersDark))
    document.documentElement.classList.add('theme-light')
  updateThemeIcon()
}

function toggleTheme() {
  document.documentElement.classList.toggle('theme-light')
  localStorage.setItem('sway_theme', document.documentElement.classList.contains('theme-light') ? 'light' : 'dark')
  updateThemeIcon()
}

function updateThemeIcon() {
  const btn = document.getElementById('themeToggleBtn')
  if (!btn) return
  const isLight = document.documentElement.classList.contains('theme-light')
  btn.innerHTML = isLight ? '<i class="bi bi-sun-fill"></i> Tema Terang' : '<i class="bi bi-moon-fill"></i> Tema Gelap'
}

window.showToast = function(msg, type) {
  const c = document.getElementById('toastContainer')
  if (!c) return
  const el = document.createElement('div')
  el.className = 'toast' + (type ? ' toast-' + type : '')
  el.textContent = msg
  el.onclick = () => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 300) }
  c.appendChild(el)
  setTimeout(() => { if (el.isConnected) { el.classList.add('toast-out'); setTimeout(() => el.remove(), 300) } }, 3000)
}

function setMode(mode) {
  document.body.classList.toggle('mode-phone', mode === 'phone')
  document.body.classList.toggle('mode-tablet', mode === 'tablet')
  const icon = document.getElementById('modeToggleIcon')
  if (icon) icon.className = mode === 'phone' ? 'bi bi-phone-fill' : 'bi bi-tablet-landscape-fill'
  localStorage.setItem('sway_mode', mode)
}

let appStarted = false

document.addEventListener('DOMContentLoaded', async () => {
  initTheme()
  document.getElementById('modalOverlay').onclick = () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))
    document.getElementById('modalOverlay').classList.add('hidden')
  }

  const savedMode = localStorage.getItem('sway_mode')
  if (savedMode) {
    setMode(savedMode)
    if (!appStarted) { appStarted = true; initApp() }
  } else {
    document.getElementById('modeSelector').classList.remove('hidden')
  }

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = () => {
      setMode(btn.dataset.mode)
      document.getElementById('modeSelector').classList.add('hidden')
      if (!appStarted) { appStarted = true; initApp() }
    }
  })
  document.getElementById('themeToggleBtn').onclick = toggleTheme
  document.getElementById('modeToggleBtn').onclick = () => {
    document.getElementById('modeSelector').classList.remove('hidden')
  }

  var moreBtn = document.getElementById('moreBtn')
  if (moreBtn) {
    moreBtn.onclick = function(e) {
      var menu = document.getElementById('moreMenu')
      if (!menu) return
      var rect = this.getBoundingClientRect()
      menu.style.top = (rect.bottom + 4) + 'px'
      menu.style.left = Math.max(4, rect.right - 180) + 'px'
      menu.classList.toggle('open')
      e.stopPropagation()
    }
  }
  document.addEventListener('click', function(e) {
    var menu = document.getElementById('moreMenu')
    var btn = document.getElementById('moreBtn')
    if (menu && (!btn || !btn.contains(e.target))) {
      menu.classList.remove('open')
    }
  })
})

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))
    document.getElementById('modalOverlay').classList.add('hidden')
  }
  if (e.key === 'Enter') {
    const pm = document.getElementById('paymentModal')
    if (!pm.classList.contains('hidden')) { document.getElementById('paymentConfirm').click(); return }
    const am = document.getElementById('adminModal')
    if (!am.classList.contains('hidden') && !document.getElementById('pinScreen').classList.contains('hidden')) { document.getElementById('pinSubmit').click() }
  }
})

async function initApp() {
  document.getElementById('menuGrid').innerHTML = '<div class="loading-sk"><div></div><div></div><div></div><div></div><div></div><div></div></div>'
  await seed()
  await loadCart()
  updateShiftUI()
  await renderMenuGrid('Minuman')

  document.getElementById('menuSearch').oninput = function() { searchFilter = this.value.toLowerCase(); renderMenuGrid(currentKategori) }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      renderMenuGrid(tab.dataset.kategori)
    }
  })

  document.getElementById('openBillBtn').onclick = showOpenBills
  document.getElementById('openBillClose').onclick = () => {
    document.getElementById('openBillModal').classList.add('hidden')
    document.getElementById('modalOverlay').classList.add('hidden')
  }
}

async function showOpenBills() {
  const orders = await getAll('orders')
  const allItems = await getAll('order_items')
  const open = orders.filter(o => o.status === 'open').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const container = document.getElementById('openBillList')

  if (open.length === 0) {
    container.innerHTML = '<div class="empty-state">Tidak ada Open Bill</div>'
  } else {
    container.innerHTML = open.map(o => {
      const items = allItems.filter(i => i.order_id === o.id)
      const unpaid = items.filter(i => !i.paid)
      const waktu = new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      const itemRows = items.map(i => `
        <label class="ob-item-row${i.paid ? ' ob-item-paid' : ''}">
          <input type="checkbox" class="ob-item-cb" data-id="${i.id}" data-order="${o.id}"${i.paid ? ' checked disabled' : ''}>
          <span class="ob-item-name">${i.nama_menu}${i.varian_dipilih ? ' - ' + i.varian_dipilih : ''} x${i.qty}</span>
          <span class="ob-item-price">${formatRp(i.subtotal)}</span>
        </label>
      `).join('')
      return `<div class="ob-item" data-id="${o.id}">
        <div class="ob-header">
          <div>
            <div class="ob-nama">${o.nama_pelanggan}</div>
            <div class="ob-waktu">${waktu}</div>
          </div>
          <div class="ob-total unpaid-total" id="unpaidTotal-${o.id}">${formatRp(unpaid.reduce((s, i) => s + i.subtotal, 0))}</div>
        </div>
        <div class="ob-items">${itemRows}</div>
        <div class="ob-footer">
          <span class="ob-selected-total" id="selectedTotal-${o.id}">Rp 0</span>
          <button class="ob-bayar-btn" data-id="${o.id}">Bayar Dipilih</button>
        </div>
      </div>`
    }).join('')

    container.querySelectorAll('.ob-item-cb').forEach(cb => {
      cb.onchange = () => {
        const orderId = cb.dataset.order
        const sel = container.querySelectorAll(`.ob-item-cb[data-order="${orderId}"]:checked:not(:disabled)`)
        const total = Array.from(sel).reduce((s, c) => {
          const priceEl = c.closest('.ob-item-row').querySelector('.ob-item-price')
          return s + parsePrice(priceEl.textContent)
        }, 0)
        document.getElementById('selectedTotal-' + orderId).textContent = formatRp(total)
      }
    })

    container.querySelectorAll('.ob-bayar-btn').forEach(btn => {
      btn.onclick = async () => {
        const orderId = parseInt(btn.dataset.id)
        const cbs = container.querySelectorAll(`.ob-item-cb[data-order="${orderId}"]:checked:not(:disabled)`)
        if (cbs.length === 0) { showToast('Pilih item yang mau dibayar', 'warning'); return }
        const order = await get('orders', orderId)
        if (!order) return
        const allOrderItems = await getAll('order_items')
        const itemIds = Array.from(cbs).map(c => parseInt(c.dataset.id))
        const paidItems = allOrderItems.filter(i => i.order_id === orderId && itemIds.includes(i.id))
        const menus = await getAll('menus')
        document.getElementById('customerName').value = order.nama_pelanggan
        cart = paidItems.map(i => {
          const menu = menus.find(m => m.nama === i.nama_menu) || { nama: i.nama_menu, harga_dasar: i.subtotal, variants: [] }
          const qty = i.qty || 1
          let addonSnapshot = []; try { addonSnapshot = JSON.parse(i.addon_snapshot || '[]') } catch {}
          return { menu, varian: i.varian_dipilih, suhu: i.suhu, addons: addonSnapshot, catatan: i.catatan, subtotal: i.subtotal, detail: '', qty, harga_satuan: Math.round(i.subtotal / qty) }
        })
        for (const id of itemIds) await del('order_items', id)
        const remaining = allOrderItems.filter(i => i.order_id === orderId && !itemIds.includes(i.id))
        if (remaining.length === 0) {
          await del('orders', orderId)
        } else {
          order.total = remaining.reduce((s, i) => s + i.subtotal, 0)
          await put('orders', order)
        }
        renderCart()
        showToast('Item dipilih dimuat ke cart — sisa bill: ' + formatRp(remaining.reduce((s, i) => s + i.subtotal, 0)), 'info')
        document.getElementById('cartPanel').classList.add('cart-open')
        showOpenBills()
      }
    })
  }

  document.getElementById('openBillModal').classList.remove('hidden')
  document.getElementById('modalOverlay').classList.remove('hidden')
}
