let currentPaymentTotal = 0
let currentPaymentMetode = 'cash'
let currentPaymentDiskon = 0
let currentPaymentSubtotal = 0

function recalcTotal() {
  const diskon = Math.min(parseInt(document.getElementById('discountInput').value) || 0, 100)
  currentPaymentDiskon = diskon
  const potongan = Math.round(currentPaymentSubtotal * diskon / 100)
  currentPaymentTotal = currentPaymentSubtotal - potongan
  document.getElementById('discountAmount').textContent = formatRp(potongan)
  document.getElementById('payAmount').textContent = formatRp(currentPaymentTotal)
  document.getElementById('cashInput').dispatchEvent(new Event('input'))
}

function showPayment() {
  currentPaymentSubtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  currentPaymentTotal = currentPaymentSubtotal
  currentPaymentDiskon = 0
  document.getElementById('payAmount').textContent = formatRp(currentPaymentTotal)
  document.getElementById('discountInput').value = 0
  document.getElementById('discountAmount').textContent = 'Rp 0'
  document.getElementById('cashInput').value = ''
  document.getElementById('kembalianValue').textContent = 'Rp 0'
  document.getElementById('cashInputArea').classList.remove('hidden')
  document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'))
  document.querySelector('.payment-btn[data-metode="cash"]').classList.add('active')
  currentPaymentMetode = 'cash'
  document.getElementById('paymentModal').classList.remove('hidden')
  document.getElementById('modalOverlay').classList.remove('hidden')
  document.getElementById('cashInput').focus()
}

document.getElementById('discountInput').oninput = recalcTotal

document.querySelectorAll('.payment-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentPaymentMetode = btn.dataset.metode
    if (currentPaymentMetode === 'qris') {
      document.getElementById('cashInputArea').classList.add('hidden')
    } else {
      document.getElementById('cashInputArea').classList.remove('hidden')
    }
  }
})

document.getElementById('cashInput').oninput = function() {
  const bayar = parsePrice(this.value)
  const kembalian = bayar - currentPaymentTotal
  document.getElementById('kembalianValue').textContent = formatRp(Math.max(0, kembalian))
}

document.querySelectorAll('.qc-btn').forEach(btn => {
  btn.onclick = () => {
    document.getElementById('cashInput').value = btn.dataset.nominal
    document.getElementById('cashInput').dispatchEvent(new Event('input'))
  }
})

document.getElementById('paymentCancel').onclick = () => {
  document.getElementById('paymentModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
}

document.getElementById('paymentConfirm').onclick = async () => {
  if (currentPaymentMetode === 'cash') {
    const bayar = parsePrice(document.getElementById('cashInput').value)
    if (bayar < currentPaymentTotal) {
      showToast('Uang tidak cukup!', 'error')
      return
    }
  }

  const nama = document.getElementById('customerName').value.trim() || 'Tanpa Nama'
  const id = await getNextId('orders')
  const order = {
    id, nama_pelanggan: nama, status: 'paid',
    metode_bayar: currentPaymentMetode,
    total: currentPaymentTotal,
    diskon_persen: currentPaymentDiskon || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
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
    if (item.varian && item.menu.variants) {
      const v = item.menu.variants.find(x => x.nama === item.varian)
      if (v && v.stok > 0) {
        const qty = item.qty || 1
        v.stok = Math.max(0, v.stok - qty)
        await put('menus', item.menu)
      }
    }
  }

  cart = []
  document.getElementById('customerName').value = ''
  renderCart()
  renderMenuGrid(currentKategori)
  document.getElementById('paymentModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
}
