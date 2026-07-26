window.parsePrice = s => parseInt(String(s).replace(/\./g, '')) || 0

document.addEventListener('input', e => {
  if (!e.target.matches('.price-input')) return
  const s = e.target.selectionStart
  const r = e.target.value.replace(/\./g, '').replace(/\D/g, '')
  const f = r.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (f !== e.target.value) { e.target.value = f; e.target.setSelectionRange(s + (f.length - e.target.value.length), s + (f.length - e.target.value.length)) }
})

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

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('modalOverlay').onclick = () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))
    document.getElementById('modalOverlay').classList.add('hidden')
  }

  const savedMode = localStorage.getItem('sway_mode')
  if (savedMode) {
    setMode(savedMode)
  } else {
    document.getElementById('modeSelector').classList.remove('hidden')
  }

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = () => {
      setMode(btn.dataset.mode)
      document.getElementById('modeSelector').classList.add('hidden')
      initApp()
    }
  })
  document.getElementById('modeToggleBtn').onclick = () => {
    document.getElementById('modeSelector').classList.remove('hidden')
  }

  if (savedMode) initApp()
})

async function initApp() {
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
  document.getElementById('fsBtn').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
  document.addEventListener('fullscreenchange', () => { document.getElementById('fsBtn').innerHTML = document.fullscreenElement ? '<i class="bi bi-x"></i>' : '<i class="bi bi-arrows-fullscreen"></i>' })
  document.getElementById('openBillClose').onclick = () => {
    document.getElementById('openBillModal').classList.add('hidden')
    document.getElementById('modalOverlay').classList.add('hidden')
  }
}

async function showOpenBills() {
  const orders = await getAll('orders')
  const open = orders.filter(o => o.status === 'open').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const container = document.getElementById('openBillList')

  if (open.length === 0) {
    container.innerHTML = '<div class="empty-state">Tidak ada Open Bill</div>'
  } else {
    container.innerHTML = open.map(o => {
      const waktu = new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      return `<div class="ob-item">
        <div>
          <div class="ob-nama">${o.nama_pelanggan}</div>
          <div class="ob-total">${formatRp(o.total)}</div>
          <div class="ob-waktu">${waktu}</div>
        </div>
        <button class="ob-bayar-btn" data-id="${o.id}">Bayar</button>
      </div>`
    }).join('')

    container.querySelectorAll('.ob-bayar-btn').forEach(btn => {
      btn.onclick = async () => {
        const orderId = parseInt(btn.dataset.id)
        const order = await get('orders', orderId)
        if (!order) return
        document.getElementById('openBillModal').classList.add('hidden')
        document.getElementById('modalOverlay').classList.add('hidden')
        document.getElementById('customerName').value = order.nama_pelanggan
        const items = (await getAll('order_items')).filter(i => i.order_id === orderId)
        await del('orders', orderId)
        for (const item of items) await del('order_items', item.id)
        const menus = await getAll('menus')
        cart = items.map(i => {
          const menu = menus.find(m => m.nama === i.nama_menu) || { nama: i.nama_menu, harga_dasar: i.subtotal, variants: [] }
          const qty = i.qty || 1
          return { menu, varian: i.varian_dipilih, suhu: i.suhu, addons: JSON.parse(i.addon_snapshot || '[]'), catatan: i.catatan, subtotal: i.subtotal, detail: '', qty, harga_satuan: Math.round(i.subtotal / qty) }
        })
        renderCart()
        showPayment()
      }
    })
  }

  document.getElementById('openBillModal').classList.remove('hidden')
  document.getElementById('modalOverlay').classList.remove('hidden')
}
