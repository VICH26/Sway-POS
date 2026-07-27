let currentPaymentTotal = 0
let currentPaymentMetode = 'cash'
let currentPaymentDiskon = 0
let currentPaymentSubtotal = 0

function recalcTotal() {
  const diskon = Math.min(parseInt(document.getElementById('discountInput').value) || 0, 100)
  currentPaymentDiskon = diskon
  const potongan = Math.round(currentPaymentSubtotal * diskon / 100)
  const afterDiskon = currentPaymentSubtotal - potongan
  const pajakPersen = (getSettings().pajak_persen || 0)
  const ppn = Math.round(afterDiskon * pajakPersen / 100)
  currentPaymentTotal = afterDiskon + ppn
  document.getElementById('discountAmount').textContent = formatRp(potongan)
  document.getElementById('taxPercent').textContent = pajakPersen
  document.getElementById('taxAmount').textContent = formatRp(ppn)
  document.getElementById('taxRow').classList.toggle('hidden', pajakPersen === 0)
  document.getElementById('payAmount').textContent = formatRp(currentPaymentTotal)
  document.getElementById('cashInput').dispatchEvent(new Event('input'))
}

function showPayment() {
  currentPaymentSubtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const pajakPersen = (getSettings().pajak_persen || 0)
  const ppn = Math.round(currentPaymentSubtotal * pajakPersen / 100)
  currentPaymentTotal = currentPaymentSubtotal + ppn
  currentPaymentDiskon = 0
  document.getElementById('payAmount').textContent = formatRp(currentPaymentTotal)
  document.getElementById('discountInput').value = 0
  document.getElementById('discountAmount').textContent = 'Rp 0'
  document.getElementById('taxPercent').textContent = pajakPersen
  document.getElementById('taxAmount').textContent = formatRp(ppn)
  document.getElementById('taxRow').classList.toggle('hidden', pajakPersen === 0)
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
  const pajakPersen = (getSettings().pajak_persen || 0)
  const order = {
    id, nama_pelanggan: nama, status: 'paid',
    metode_bayar: currentPaymentMetode,
    total: currentPaymentTotal,
    diskon_persen: currentPaymentDiskon || 0,
    pajak_persen: pajakPersen,
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

  const kembalian = currentPaymentMetode === 'cash' ? Math.max(0, parsePrice(document.getElementById('cashInput').value) - currentPaymentTotal) : 0
  const s = getShift()
  if (kembalian > 0 && s && s.status === 'open') {
    await put('cash_ledger', {
      id: await getNextId('cash_ledger'), shift_id: s.shift_id,
      tipe: 'kembalian', nominal: kembalian,
      deskripsi: 'Kembalian - ' + (document.getElementById('customerName').value.trim() || 'Tn.'),
      created_at: new Date().toISOString()
    })
  }
  cart = []
  document.getElementById('customerName').value = ''
  renderCart()
  renderMenuGrid(currentKategori)
  document.getElementById('paymentModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
  const msg = 'Pembayaran ' + formatRp(currentPaymentTotal) + ' berhasil' + (kembalian > 0 ? ' (Kembalian: ' + formatRp(kembalian) + ')' : '')
  showToast(msg, 'success')
}
