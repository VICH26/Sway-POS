const SHIFT_KEY = 'sway_shift'

function getShift() {
  try { return JSON.parse(localStorage.getItem(SHIFT_KEY)) } catch { return null }
}

function saveShift(s) {
  localStorage.setItem(SHIFT_KEY, JSON.stringify(s))
}

function isShiftOpen() {
  const s = getShift()
  return s && s.status === 'open'
}

function updateShiftUI() {
  const open = isShiftOpen()
  const badge = document.getElementById('statusBadge')
  if (!badge) return
  badge.textContent = open ? 'BUKA' : 'TUTUP'
  badge.style.background = open ? 'var(--accent)' : 'var(--danger)'
  document.getElementById('bukaWarungBtn')?.classList.toggle('hidden', open)
  document.getElementById('kasKeluarBtn')?.classList.toggle('hidden', !open)
  document.getElementById('tutupWarungBtn')?.classList.toggle('hidden', !open)
}

async function openShift(modalAwal) {
  const now = new Date().toISOString()
  const id = await getNextId('cash_ledger')
  await put('cash_ledger', {
    id, shift_id: id, tipe: 'modal_awal', nominal: modalAwal,
    deskripsi: 'Modal awal / uang receh', created_at: now
  })
  saveShift({ status: 'open', shift_id: id, modal_awal: modalAwal, waktu_buka: now })
  updateShiftUI()
}

async function addKasKeluar(nominal, alasan) {
  const s = getShift()
  if (!s) return
  await put('cash_ledger', {
    id: await getNextId('cash_ledger'), shift_id: s.shift_id, tipe: 'kas_keluar', nominal,
    deskripsi: alasan, created_at: new Date().toISOString()
  })
}

async function closeShift() {
  const s = getShift()
  if (!s || s.status !== 'open') return
  const ledger = (await getAll('cash_ledger')).filter(l => l.shift_id === s.shift_id)
  const totalKasKeluar = ledger.filter(l => l.tipe === 'kas_keluar').reduce((a, l) => a + l.nominal, 0)
  const totalKonsumsi = ledger.filter(l => l.tipe === 'konsumsi').reduce((a, l) => a + l.nominal, 0)
  const orders = (await getAll('orders')).filter(o => o.status === 'paid' && o.created_at >= s.waktu_buka)
  const totalCash = orders.filter(o => o.metode_bayar === 'cash').reduce((a, o) => a + (o.total||0), 0)
  const totalQris = orders.filter(o => o.metode_bayar === 'qris').reduce((a, o) => a + (o.total||0), 0)
  const rekap = {
    modal_awal: s.modal_awal, total_cash: totalCash, total_qris: totalQris,
    total_kas_keluar: totalKasKeluar, total_konsumsi: totalKonsumsi,
    estimasi_fisik: s.modal_awal + totalCash - totalKasKeluar
  }
  await put('cash_ledger', {
    id: await getNextId('cash_ledger'), shift_id: s.shift_id, tipe: 'rekap', nominal: 0,
    deskripsi: JSON.stringify(rekap), created_at: new Date().toISOString()
  })
  saveShift({ ...s, status: 'closed', rekap, waktu_tutup: new Date().toISOString() })
  updateShiftUI()
  return rekap
}

document.getElementById('bukaWarungBtn').onclick = () => {
  document.getElementById('bukaWarungModal').classList.remove('hidden')
  document.getElementById('modalOverlay').classList.remove('hidden')
  document.getElementById('modalAwalInput').focus()
}

document.getElementById('bukaWarungBatal').onclick = () => {
  document.getElementById('bukaWarungModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
}

document.getElementById('bukaWarungKonfirm').onclick = async () => {
  const modalAwal = parsePrice(document.getElementById('modalAwalInput').value)
  await openShift(modalAwal)
  document.getElementById('bukaWarungModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
}

document.getElementById('kasKeluarBtn').onclick = () => {
  document.getElementById('kasKeluarModal').classList.remove('hidden')
  document.getElementById('modalOverlay').classList.remove('hidden')
  document.getElementById('kasKeluarNominal').focus()
}

document.getElementById('kasKeluarBatal').onclick = () => {
  document.getElementById('kasKeluarModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
}

document.getElementById('kasKeluarKonfirm').onclick = async () => {
  const nominal = parsePrice(document.getElementById('kasKeluarNominal').value)
  const alasan = document.getElementById('kasKeluarAlasan').value.trim() || 'Tidak ada alasan'
  if (!nominal) return showToast('Masukkan nominal!', 'error')
  await addKasKeluar(nominal, alasan)
  document.getElementById('kasKeluarModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
  document.getElementById('kasKeluarNominal').value = ''
  document.getElementById('kasKeluarAlasan').value = ''
}

document.getElementById('tutupWarungBtn').onclick = async () => {
  const s = getShift()
  if (!s || s.status !== 'open') return
  const ledger = (await getAll('cash_ledger')).filter(l => l.shift_id === s.shift_id)
  const kasKeluar = ledger.filter(l => l.tipe === 'kas_keluar').reduce((a, l) => a + l.nominal, 0)
  const konsumsi = ledger.filter(l => l.tipe === 'konsumsi').reduce((a, l) => a + l.nominal, 0)
  const orders = (await getAll('orders')).filter(o => o.status === 'paid' && o.created_at >= s.waktu_buka)
  const cash = orders.filter(o => o.metode_bayar === 'cash').reduce((a, o) => a + (o.total||0), 0)
  const qris = orders.filter(o => o.metode_bayar === 'qris').reduce((a, o) => a + (o.total||0), 0)
  const estimasi = s.modal_awal + cash - kasKeluar
  document.getElementById('rekapBody').innerHTML = `
    <div class="rekap-row"><span>Modal Awal</span><span>${formatRp(s.modal_awal)}</span></div>
    <div class="rekap-row"><span>Penjualan Tunai</span><span>${formatRp(cash)}</span></div>
    <div class="rekap-row"><span>Penjualan QRIS</span><span>${formatRp(qris)}</span></div>
    <div class="rekap-row"><span>Konsumsi Karyawan</span><span style="color:var(--employee)">${formatRp(konsumsi)}</span></div>
    <div class="rekap-row"><span>Total Kas Keluar</span><span style="color:var(--danger)">${formatRp(kasKeluar)}</span></div>
    <div class="rekap-row rekap-total"><span>Estimasi Uang Fisik</span><span>${formatRp(estimasi)}</span></div>
  `
  document.getElementById('rekapModal').classList.remove('hidden')
  document.getElementById('modalOverlay').classList.remove('hidden')
  document.getElementById('rekapKonfirm').onclick = async () => {
    const rekap = await closeShift()
    document.getElementById('rekapModal').classList.add('hidden')
    document.getElementById('modalOverlay').classList.add('hidden')
  }
}

document.getElementById('rekapBatal').onclick = () => {
  document.getElementById('rekapModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
}
