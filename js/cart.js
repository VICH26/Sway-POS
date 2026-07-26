let cart = []

function saveCart() {
  try {
    localStorage.setItem('sway_cart', JSON.stringify({
      name: document.getElementById('customerName').value,
      items: cart.map(i => ({
        menuId: i.menu.id, varian: i.varian, suhu: i.suhu,
        addons: i.addons, catatan: i.catatan, qty: i.qty
      }))
    }))
  } catch {}
}

async function loadCart() {
  try {
    const saved = localStorage.getItem('sway_cart')
    if (!saved) return
    const data = JSON.parse(saved)
    if (!data.items?.length) return
    const menus = await getAll('menus')
    cart = data.items.map(item => {
      const menu = menus.find(m => m.id === item.menuId)
      if (!menu) return null
      const addons = item.addons || []
      let harga_satuan = menu.harga_dasar
      if (item.varian && menu.variants) {
        const v = menu.variants.find(x => x.nama === item.varian)
        if (v && v.harga != null) harga_satuan = v.harga
      }
      harga_satuan += addons.reduce((s, a) => s + (a.harga || 0), 0)
      return { menu, varian: item.varian, suhu: item.suhu, addons, catatan: item.catatan || '', qty: item.qty, harga_satuan, subtotal: harga_satuan * item.qty, detail: '' }
    }).filter(Boolean)
    document.getElementById('customerName').value = data.name || ''
    renderCart()
  } catch { cart = [] }
}

function addToCart(menu, varian, suhu, addons, catatan, qty) {
  qty = Math.max(1, parseInt(qty) || 1)
  let harga_satuan = menu.harga_dasar
  if (varian && menu.variants) {
    const v = menu.variants.find(x => x.nama === varian)
    if (v && v.harga != null) harga_satuan = v.harga
  }
  const addonStr = addons.map(a => a.nama).join(', ')
  let detail = ''
  if (varian) { detail += varian }
  if (suhu) detail += (detail ? ' - ' : '') + suhu
  if (addonStr) detail += (detail ? ' + ' : '') + addonStr
  addons.forEach(a => harga_satuan += a.harga)
  const subtotal = harga_satuan * qty
  if (catatan) detail += (detail ? ` (${catatan})` : catatan)

  cart.push({ menu, varian, suhu, addons, catatan, qty, harga_satuan, subtotal, detail: detail || '-' })
  renderCart()
}

function renderCart() {
  const container = document.getElementById('cartItems')
  const total = cart.reduce((s, i) => s + i.subtotal, 0)
  document.getElementById('cartTotal').textContent = formatRp(total)
  const count = cart.reduce((s, i) => s + i.qty, 0)
  const badge = document.getElementById('cartBadge')
  if (badge) { badge.textContent = count > 99 ? '99+' : count; badge.style.display = count > 0 ? '' : 'none' }
  const mcb = document.getElementById('mobileCartBtn')
  if (mcb) mcb.classList.toggle('hidden-cart', count === 0)

  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada item</div>'
    saveCart()
    return
  }

  container.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <div class="ci-left">
        <div class="ci-nama">${item.menu.nama}${item.varian ? ' - ' + item.varian : ''}</div>
        <div class="ci-detail">${item.suhu || ''}${item.addons.length ? ' + ' + item.addons.map(a => a.nama).join(', ') : ''}${item.catatan ? ' (' + item.catatan + ')' : ''}</div>
      </div>
      <div class="ci-harga">${formatRp(item.subtotal)}</div>
      <div class="ci-qty">
        <button class="ci-qty-btn ci-qty-minus" data-index="${i}">−</button>
        <span class="ci-qty-val">${item.qty}</span>
        <button class="ci-qty-btn ci-qty-plus" data-index="${i}">+</button>
      </div>
      <button class="ci-hapus" data-index="${i}"><i class="bi bi-x"></i></button>
    </div>
  `).join('')

  container.querySelectorAll('.ci-qty-minus').forEach(btn => {
    btn.onclick = () => {
      const i = parseInt(btn.dataset.index)
      const item = cart[i]
      if (item.qty <= 1) {
        cart.splice(i, 1); renderCart(); showToast('Item dihapus', 'warning')
        return
      }
      item.qty--
      item.subtotal = item.harga_satuan * item.qty
      renderCart()
    }
  })
  container.querySelectorAll('.ci-qty-plus').forEach(btn => {
    btn.onclick = () => {
      const i = parseInt(btn.dataset.index)
      const item = cart[i]
      item.qty++
      item.subtotal = item.harga_satuan * item.qty
      renderCart()
    }
  })
  container.querySelectorAll('.ci-hapus').forEach(btn => {
    btn.onclick = () => {
      cart.splice(parseInt(btn.dataset.index), 1); showToast('Item dihapus', 'warning')
      renderCart()
    }
  })
  saveCart()
}

document.getElementById('employeeMealBtn').onclick = async () => {
  if (cart.length === 0) return
  if (!confirm('Konfirmasi Makan Karyawan?')) return

  let total = 0
  let names = []
  for (const item of cart) {
    total += item.subtotal
    names.push(`${item.menu.nama}${item.varian ? ' - ' + item.varian : ''} x${item.qty}`)
    if (item.varian && item.menu.variants) {
      const v = item.menu.variants.find(x => x.nama === item.varian)
      if (v && v.stok > 0) {
        v.stok = Math.max(0, v.stok - item.qty)
        await put('menus', item.menu)
      }
    }
  }

  const s = getShift()
  if (s) {
    await put('cash_ledger', {
      id: await getNextId('cash_ledger'), shift_id: s.shift_id, tipe: 'konsumsi',
      nominal: total, deskripsi: 'Makan Karyawan - ' + names.join(', '),
      created_at: new Date().toISOString()
    })
  }
  cart = []
  document.getElementById('customerName').value = ''
  renderCart()
  renderMenuGrid(currentKategori)
}

document.getElementById('saveBillBtn').onclick = async () => {
  if (cart.length === 0) return
  const nama = document.getElementById('customerName').value.trim() || 'Tanpa Nama'
  const total = cart.reduce((s, i) => s + i.subtotal, 0)
  const id = await getNextId('orders')
  const order = { id, nama_pelanggan: nama, status: 'open', metode_bayar: null, total, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  await put('orders', order)

  for (const item of cart) {
    const itemId = await getNextId('order_items')
    await put('order_items', {
      id: itemId, order_id: id,
      nama_menu: item.menu.nama,
      varian_dipilih: item.varian,
      suhu: item.suhu,
      addon_snapshot: JSON.stringify(item.addons),
      catatan: item.catatan,
      subtotal: item.subtotal,
      qty: item.qty || 1
    })
  }

  cart = []
  document.getElementById('customerName').value = ''
  renderCart()
}

document.getElementById('payBtn').onclick = async () => {
  if (cart.length === 0) return
  showPayment()
}

document.getElementById('mobileCartBtn').onclick = () => {
  document.getElementById('cartPanel').classList.toggle('cart-open')
}
