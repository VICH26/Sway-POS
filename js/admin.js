function getSettings() {
  return JSON.parse(localStorage.getItem('sway_settings') || '{}')
}

function saveSettings(settings) {
  localStorage.setItem('sway_settings', JSON.stringify(settings))
}

function getPin() {
  const s = getSettings()
  return s.pin || '1234'
}

document.getElementById('adminBtn').onclick = () => {
  document.getElementById('adminModal').classList.remove('hidden')
  document.getElementById('modalOverlay').classList.remove('hidden')
  document.getElementById('pinScreen').classList.remove('hidden')
  document.getElementById('adminPanel').classList.add('hidden')
  document.getElementById('pinInput').value = ''
  document.getElementById('pinError').classList.add('hidden')
  document.getElementById('pinInput').focus()
}

document.getElementById('pinBatal').onclick = () => {
  document.getElementById('adminModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
}

document.getElementById('pinSubmit').onclick = () => {
  if (document.getElementById('pinInput').value === getPin()) {
    document.getElementById('pinScreen').classList.add('hidden')
    document.getElementById('adminPanel').classList.remove('hidden')
    loadAdminPanel()
  } else {
    document.getElementById('pinError').classList.remove('hidden')
  }
}

document.getElementById('pinInput').onkeydown = e => {
  if (e.key === 'Enter') document.getElementById('pinSubmit').click()
}

document.getElementById('adminClose').onclick = () => {
  document.getElementById('adminModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
  renderMenuGrid(currentKategori)
}

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'))
    document.getElementById('admin' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)).classList.remove('hidden')
    if (tab.dataset.tab === 'menus') renderAdminMenus()
    if (tab.dataset.tab === 'addons') renderAdminAddons()
    if (tab.dataset.tab === 'laporan') renderAdminLaporan()
    if (tab.dataset.tab === 'dashboard') renderAdminDashboard()
    if (tab.dataset.tab === 'settings') renderAdminSettings()
  }
})

async function loadAdminPanel() {
  const orders = await getAll('orders')
  const paid = orders.filter(o => o.status === 'paid')
  const totalOmzet = paid.reduce((s, o) => s + (o.total || 0), 0)
  const cash = paid.filter(o => o.metode_bayar === 'cash').reduce((s, o) => s + (o.total || 0), 0)
  const qris = paid.filter(o => o.metode_bayar === 'qris').reduce((s, o) => s + (o.total || 0), 0)

  document.getElementById('adminStats').innerHTML = `
    <div class="stat-card"><div class="stat-value">${formatRp(totalOmzet)}</div><div class="stat-label">Total Omzet</div></div>
    <div class="stat-card"><div class="stat-value">${formatRp(cash)}</div><div class="stat-label">Tunai</div></div>
    <div class="stat-card"><div class="stat-value">${formatRp(qris)}</div><div class="stat-label">QRIS</div></div>
  `
  renderAdminMenus()
}

async function renderAdminMenus() {
  const menus = await getAll('menus')
  let html = '<button class="btn btn-primary btn-add-custom" id="addMenuBtn">+ Tambah Menu</button>'
  html += '<table class="admin-table"><tr><th>Menu</th><th>Kategori</th><th>Harga</th><th>Varian (Stok)</th><th>Aksi</th></tr>'
  menus.filter(m => m.is_active !== false).forEach(m => {
    const minStok = m.variants ? Math.min(...m.variants.map(v => v.stok || 0)) : 0
    const rowClass = minStok === 0 ? 'tr-stok-habis' : minStok <= 5 ? 'tr-stok-menipis' : ''
    const varianStr = m.variants && m.variants.length
      ? m.variants.map(v => `${v.nama} (${v.stok})`).join(', ')
      : '-'
    html += `<tr class="${rowClass}">
      <td>${m.nama}</td>
      <td>${m.kategori}</td>
      <td>${formatRp(m.harga_dasar)}</td>
      <td style="font-size:11px">${varianStr}</td>
      <td style="white-space:nowrap"><button class="btn-sm btn-edit" data-id="${m.id}">Edit</button> <button class="btn-sm btn-del" data-id="${m.id}">Hapus</button></td>
    </tr>`
  })
  html += '</table>'
  document.getElementById('adminMenus').innerHTML = html

  document.getElementById('addMenuBtn').onclick = () => showMenuForm()
  document.querySelectorAll('#adminMenus .btn-edit').forEach(b => b.onclick = () => showMenuForm(parseInt(b.dataset.id)))
  document.querySelectorAll('#adminMenus .btn-del').forEach(b => b.onclick = async () => {
    const menu = await get('menus', parseInt(b.dataset.id))
    if (menu && confirm(`Hapus ${menu.nama}?`)) {
      menu.is_active = false
      await put('menus', menu)
      renderAdminMenus()
      showToast('Menu dihapus', 'warning')
    }
  })
}

async function renderAdminAddons() {
  const addons = await getAll('add_ons')
  let html = '<button class="btn btn-primary btn-add-custom" id="addAddonBtn">+ Tambah Add-on</button>'
  html += '<table class="admin-table"><tr><th>Add-on</th><th>Harga Tambahan</th><th>Aksi</th></tr>'
  addons.forEach(a => {
    html += `<tr>
      <td>${a.nama_addon}</td>
      <td>${formatRp(a.harga_tambahan)}</td>
      <td style="white-space:nowrap"><button class="btn-sm btn-edit" data-id="${a.id}">Edit</button> <button class="btn-sm btn-del" data-id="${a.id}">Hapus</button></td>
    </tr>`
  })
  html += '</table>'
  document.getElementById('adminAddons').innerHTML = html

  document.getElementById('addAddonBtn').onclick = () => showAddonForm()
  document.querySelectorAll('#adminAddons .btn-edit').forEach(b => b.onclick = () => showAddonForm(parseInt(b.dataset.id)))
  document.querySelectorAll('#adminAddons .btn-del').forEach(b => b.onclick = async () => {
    const addon = await get('add_ons', parseInt(b.dataset.id))
    if (addon && confirm(`Hapus ${addon.nama_addon}?`)) {
      await del('add_ons', addon.id)
      renderAdminAddons()
    }
  })
}

async function showMenuForm(editId) {
  const menu = editId ? await get('menus', editId) : { nama: '', kategori: 'Minuman', harga_dasar: 0, tersedia: null, variants: [] }
  const tersediaArr = menu.tersedia || []
  const tersediaHangat = tersediaArr.includes('Hangat') ? 'checked' : ''
  const tersediaDingin = tersediaArr.includes('Dingin') ? 'checked' : ''
  const varianRows = (menu.variants || []).map((v, i) => `
    <tr>
      <td><input type="text" class="v-nama" value="${v.nama}" placeholder="Nama varian"></td>
      <td><input type="number" class="v-stok" value="${v.stok || 0}" min="0" style="width:60px"></td>
      <td><input type="text" class="v-harga price-input" value="${v.harga ? v.harga.toLocaleString('id-ID') : ''}" placeholder="Harga" style="width:80px" inputmode="numeric"></td>
      <td><button class="btn-sm btn-del remove-varian"><i class="bi bi-x"></i></button></td>
    </tr>
  `).join('')

  const formHtml = `
    <div class="admin-form-grid">
      <div><label>Nama Menu</label><input type="text" id="f-nama" value="${menu.nama}"></div>
      <div class="form-row">
        <div><label>Kategori</label>
          <select id="f-kategori">
            <option ${menu.kategori==='Minuman'?'selected':''}>Minuman</option>
            <option ${menu.kategori==='Makanan'?'selected':''}>Makanan</option>
            <option ${menu.kategori==='Snack'?'selected':''}>Snack</option>
          </select>
        </div>
        <div><label>Harga Dasar</label><input type="text" id="f-harga" class="price-input" inputmode="numeric" value="${menu.harga_dasar.toLocaleString('id-ID')}"></div>
      </div>
      <div><label>Tersedia</label>
        <div style="display:flex;gap:10px;margin-top:4px">
          <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="f-hangat" ${tersediaHangat}> Hangat</label>
          <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="f-dingin" ${tersediaDingin}> Dingin</label>
        </div>
      </div>
      <div>
        <label>Varian & Stok</label>
        <table class="varian-table">
          <thead><tr><th>Varian</th><th>Stok</th><th>Harga</th><th></th></tr></thead>
          <tbody id="varianBody">${varianRows || '<tr><td colspan="4" style="color:var(--text-muted);text-align:center;padding:12px">Belum ada varian</td></tr>'}</tbody>
        </table>
        <button class="btn-sm btn-add-custom" id="addVarianBtn" style="margin-top:6px">+ Tambah Varian</button>
      </div>
    </div>
  `

  const modal = document.getElementById('menuModal')
  document.getElementById('menuModalTitle').textContent = editId ? 'Edit Menu' : 'Tambah Menu'
  document.getElementById('menuModalBody').innerHTML = formHtml
  document.getElementById('menuModalAdd').textContent = 'Simpan'
  document.getElementById('menuModalCancel').textContent = 'Batal'
  document.getElementById('menuModalCancel').onclick = () => {
    modal.classList.add('hidden')
    document.getElementById('adminModal').classList.remove('hidden')
  }
  document.getElementById('adminModal').classList.add('hidden')
  modal.classList.remove('hidden')
  document.getElementById('modalOverlay').classList.remove('hidden')

  document.getElementById('addVarianBtn').onclick = () => {
    const tbody = document.getElementById('varianBody')
    const row = document.createElement('tr')
    row.innerHTML = `<td><input type="text" class="v-nama" placeholder="Nama varian"></td>
      <td><input type="number" class="v-stok" value="0" min="0" style="width:70px"></td>
      <td><input type="text" class="v-harga price-input" placeholder="Harga" style="width:80px" inputmode="numeric"></td>
      <td><button class="btn-sm btn-del remove-varian"><i class="bi bi-x"></i></button></td>`
    row.querySelector('.remove-varian').onclick = () => row.remove()
    if (tbody.querySelector('td[colspan]')) tbody.innerHTML = ''
    tbody.appendChild(row)
  }

  document.querySelectorAll('.remove-varian').forEach(btn => {
    btn.onclick = function() { this.closest('tr').remove() }
  })

  const originalClick = document.getElementById('menuModalAdd').onclick
  document.getElementById('menuModalAdd').onclick = async () => {
    const nama = document.getElementById('f-nama').value.trim()
    if (!nama) return showToast('Nama menu harus diisi', 'error')
    const kategori = document.getElementById('f-kategori').value
    const harga = parsePrice(document.getElementById('f-harga').value)
    const tersedia = []
    if (document.getElementById('f-hangat').checked) tersedia.push('Hangat')
    if (document.getElementById('f-dingin').checked) tersedia.push('Dingin')

    const varianRows = document.querySelectorAll('#varianBody tr')
    const variants = []
    varianRows.forEach(row => {
      const vNama = row.querySelector('.v-nama')
      const vStok = row.querySelector('.v-stok')
      const vHarga = row.querySelector('.v-harga')
      if (vNama && vNama.value.trim()) {
        const v = { nama: vNama.value.trim(), stok: parseInt(vStok?.value) || 0 }
        const h = parsePrice(vHarga?.value)
        if (h) v.harga = h
        variants.push(v)
      }
    })

    const data = {
      id: editId || await getNextId('menus'),
      nama, kategori, harga_dasar: harga,
      tersedia: tersedia.length ? tersedia : null,
      variants,
      is_active: true
    }
    await put('menus', data)
    modal.classList.add('hidden')
    document.getElementById('adminModal').classList.remove('hidden')
    renderAdminMenus()
  }
}

async function showAddonForm(editId) {
  const addon = editId ? await get('add_ons', editId) : { nama_addon: '', harga_tambahan: 0 }
  const modal = document.getElementById('menuModal')
  document.getElementById('menuModalTitle').textContent = editId ? 'Edit Add-on' : 'Tambah Add-on'
  document.getElementById('menuModalBody').innerHTML = `
    <div class="admin-form-grid">
      <div><label>Nama Add-on</label>
        <input type="text" id="f-addon-nama" value="${addon.nama_addon}"></div>
      <div><label>Harga Tambahan (Rp)</label>
        <input type="text" id="f-addon-harga" class="price-input" inputmode="numeric" value="${addon.harga_tambahan.toLocaleString('id-ID')}"></div>
    </div>`
  document.getElementById('menuModalAdd').textContent = 'Simpan'
  document.getElementById('menuModalCancel').textContent = 'Batal'
  document.getElementById('menuModalCancel').onclick = () => {
    modal.classList.add('hidden')
    document.getElementById('adminModal').classList.remove('hidden')
  }
  document.getElementById('adminModal').classList.add('hidden')
  modal.classList.remove('hidden')
  document.getElementById('modalOverlay').classList.remove('hidden')

  document.getElementById('menuModalAdd').onclick = async () => {
    const nama = document.getElementById('f-addon-nama').value.trim()
    if (!nama) return showToast('Nama add-on harus diisi', 'error')
    const harga = parsePrice(document.getElementById('f-addon-harga').value)
    const data = { id: editId || await getNextId('add_ons'), nama_addon: nama, harga_tambahan: harga }
    await put('add_ons', data)
    modal.classList.add('hidden')
    document.getElementById('adminModal').classList.remove('hidden')
    renderAdminAddons()
  }
}

async function renderAdminLaporan() {
  const today = new Date().toISOString().slice(0, 10)
  document.getElementById('adminLaporan').innerHTML = `
    <div class="laporan-filter">
      <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
        <label style="font-size:13px;color:var(--text-secondary)">Dari
          <input type="date" id="laporanDari" value="${today}" class="form-input" style="display:block;margin-top:4px">
        </label>
        <label style="font-size:13px;color:var(--text-secondary)">Sampai
          <input type="date" id="laporanSampai" value="${today}" class="form-input" style="display:block;margin-top:4px">
        </label>
        <label style="font-size:13px;color:var(--text-secondary)">Metode
          <select id="laporanMetode" class="form-input" style="display:block;margin-top:4px">
            <option value="">Semua</option>
            <option value="cash">Tunai</option>
            <option value="qris">QRIS</option>
          </select>
        </label>
        <button class="btn btn-primary" id="laporanFilterBtn" style="height:fit-content">Tampilkan</button>
        <button class="btn btn-success" id="laporanExportBtn" style="height:fit-content"><i class="bi bi-download"></i> Export CSV</button>
      </div>
    </div>
    <div id="laporanTabel" style="margin-top:12px"></div>
    <hr style="border-color:var(--border);margin:20px 0">
    <h3 style="margin-bottom:12px">Kas Keluar</h3>
    <div id="laporanKasKeluar" style="margin-bottom:12px"></div>
    <hr style="border-color:var(--border);margin:20px 0">
    <h3 style="margin-bottom:12px">Konsumsi Karyawan</h3>
    <div id="laporanKonsumsi"></div>
    <hr style="border-color:var(--border);margin:20px 0">
    <h3 style="margin-bottom:12px">Riwayat Shift</h3>
    <div id="laporanShiftTabel"></div>
  `
  document.getElementById('laporanFilterBtn').onclick = () => { renderLaporanTabel(); renderLaporanKasKeluar(); renderLaporanKonsumsi() }
  document.getElementById('laporanExportBtn').onclick = exportLaporanCSV
  renderLaporanTabel()
  renderLaporanKasKeluar()
  renderLaporanKonsumsi()
  renderLaporanShift()
}

async function renderLaporanTabel() {
  const dari = document.getElementById('laporanDari').value
  const sampai = document.getElementById('laporanSampai').value + 'T23:59:59'
  const metode = document.getElementById('laporanMetode').value
  let orders = (await getAll('orders')).filter(o => o.status === 'paid')
  if (dari) orders = orders.filter(o => o.created_at >= dari)
  if (sampai) orders = orders.filter(o => o.created_at <= sampai)
  if (metode) orders = orders.filter(o => o.metode_bayar === metode)
  orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  if (!orders.length) {
    document.getElementById('laporanTabel').innerHTML = '<div class="empty-state">Tidak ada transaksi</div>'
    return
  }
  let html = '<table class="admin-table"><tr><th>#</th><th>Waktu</th><th>Pelanggan</th><th>Metode</th><th>Total</th></tr>'
  orders.forEach((o, i) => {
    const waktu = new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
    html += `<tr><td>${i+1}</td><td style="font-size:12px">${waktu}</td><td>${o.nama_pelanggan}</td><td>${o.metode_bayar === 'cash' ? 'Tunai' : 'QRIS'}</td><td style="color:var(--accent);font-weight:700">${formatRp(o.total)}</td></tr>`
  })
  html += '</table>'
  document.getElementById('laporanTabel').innerHTML = html
}

async function renderLaporanShift() {
  const ledger = (await getAll('cash_ledger')).filter(l => l.tipe === 'rekap').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  if (!ledger.length) {
    document.getElementById('laporanShiftTabel').innerHTML = '<div class="empty-state">Belum ada rekap shift</div>'
    return
  }
  let html = '<table class="admin-table"><tr><th>#</th><th>Tanggal</th><th>Modal</th><th>Tunai</th><th>QRIS</th><th>Kas Keluar</th><th>Konsumsi</th><th>Estimasi Fisik</th></tr>'
  ledger.forEach((l, i) => {
    const r = JSON.parse(l.deskripsi || '{}')
    const tgl = new Date(l.created_at).toLocaleDateString('id-ID', { dateStyle: 'short' })
    html += `<tr><td>${i+1}</td><td style="font-size:12px">${tgl}</td><td>${formatRp(r.modal_awal)}</td><td>${formatRp(r.total_cash)}</td><td>${formatRp(r.total_qris)}</td><td>${formatRp(r.total_kas_keluar)}</td><td style="color:var(--employee)">${formatRp(r.total_konsumsi || 0)}</td><td style="color:var(--accent);font-weight:700">${formatRp(r.estimasi_fisik)}</td></tr>`
  })
  html += '</table>'
  document.getElementById('laporanShiftTabel').innerHTML = html
}

async function renderLaporanKasKeluar() {
  const dari = document.getElementById('laporanDari').value
  const sampai = document.getElementById('laporanSampai').value + 'T23:59:59'
  let entries = (await getAll('cash_ledger')).filter(l => l.tipe === 'kas_keluar')
  if (dari) entries = entries.filter(e => e.created_at >= dari)
  if (sampai) entries = entries.filter(e => e.created_at <= sampai)
  entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const container = document.getElementById('laporanKasKeluar')
  if (!entries.length) {
    container.innerHTML = '<div class="empty-state">Tidak ada kas keluar</div>'
    return
  }
  let html = '<table class="admin-table"><tr><th>#</th><th>Waktu</th><th>Nominal</th><th>Alasan</th></tr>'
  entries.forEach((e, i) => {
    const waktu = new Date(e.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
    html += `<tr><td>${i+1}</td><td style="font-size:12px">${waktu}</td><td style="color:var(--danger)">${formatRp(e.nominal)}</td><td>${e.deskripsi}</td></tr>`
  })
  html += '</table>'
  container.innerHTML = html
}

async function renderLaporanKonsumsi() {
  const dari = document.getElementById('laporanDari').value
  const sampai = document.getElementById('laporanSampai').value + 'T23:59:59'
  let entries = (await getAll('cash_ledger')).filter(l => l.tipe === 'konsumsi')
  if (dari) entries = entries.filter(e => e.created_at >= dari)
  if (sampai) entries = entries.filter(e => e.created_at <= sampai)
  entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const container = document.getElementById('laporanKonsumsi')
  if (!entries.length) {
    container.innerHTML = '<div class="empty-state">Tidak ada konsumsi karyawan</div>'
    return
  }
  let html = '<table class="admin-table"><tr><th>#</th><th>Waktu</th><th>Nominal</th><th>Keterangan</th></tr>'
  entries.forEach((e, i) => {
    const waktu = new Date(e.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
    html += `<tr><td>${i+1}</td><td style="font-size:12px">${waktu}</td><td style="color:var(--employee)">${formatRp(e.nominal)}</td><td>${e.deskripsi}</td></tr>`
  })
  html += '</table>'
  container.innerHTML = html
}

async function exportLaporanCSV() {
  const dari = document.getElementById('laporanDari').value
  const sampai = document.getElementById('laporanSampai').value + 'T23:59:59'
  const metode = document.getElementById('laporanMetode').value
  let orders = (await getAll('orders')).filter(o => o.status === 'paid')
  if (dari) orders = orders.filter(o => o.created_at >= dari)
  if (sampai) orders = orders.filter(o => o.created_at <= sampai)
  if (metode) orders = orders.filter(o => o.metode_bayar === metode)
  orders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  if (!orders.length) return showToast('Tidak ada data untuk diexport', 'warning')
  const rows = orders.map((o, i) => ({
    No: i + 1,
    Waktu: new Date(o.created_at).toLocaleString('id-ID'),
    Pelanggan: o.nama_pelanggan,
    Metode: o.metode_bayar === 'cash' ? 'Tunai' : 'QRIS',
    Total: o.total
  }))
  downloadCSV(rows, 'transaksi-warkop.csv')
}

async function renderAdminDashboard() {
  const orders = (await getAll('orders')).filter(o => o.status === 'paid')
  const today = new Date().toISOString().slice(0, 10)
  const hariIni = orders.filter(o => o.created_at.startsWith(today))
  const omzetHariIni = hariIni.reduce((s, o) => s + (o.total || 0), 0)
  const cashHariIni = hariIni.filter(o => o.metode_bayar === 'cash').reduce((s, o) => s + (o.total || 0), 0)
  const qrisHariIni = hariIni.filter(o => o.metode_bayar === 'qris').reduce((s, o) => s + (o.total || 0), 0)
  const kasKeluarHariIni = (await getAll('cash_ledger'))
    .filter(l => l.tipe === 'kas_keluar' && l.created_at.startsWith(today))
    .reduce((s, l) => s + l.nominal, 0)

  let html = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
    <div class="stat-card"><div class="stat-value" style="color:var(--accent)">${formatRp(omzetHariIni)}</div><div class="stat-label">Omzet Hari Ini</div></div>
    <div class="stat-card"><div class="stat-value">${hariIni.length}</div><div class="stat-label">Transaksi</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--danger)">${formatRp(kasKeluarHariIni)}</div><div class="stat-label">Kas Keluar</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--warning)">${formatRp(omzetHariIni - kasKeluarHariIni)}</div><div class="stat-label">Bersih</div></div>
  </div>`

  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
    const total = orders.filter(o => o.created_at.startsWith(key)).reduce((s, o) => s + (o.total || 0), 0)
    days.push({ key, label, total })
  }
  const maxTotal = Math.max(...days.map(d => d.total), 1)

  html += '<canvas id="dashCanvas" height="200" style="width:100%;background:var(--bg-surface2);border-radius:var(--radius-sm);margin-top:8px"></canvas>'
  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:8px;text-align:center;font-size:11px;color:var(--text-secondary)">'
  days.forEach(d => { html += `<div>${d.label}</div>` })
  html += '</div>'
  document.getElementById('adminDashboard').innerHTML = html

  const canvas = document.getElementById('dashCanvas')
  const ctx = canvas.getContext('2d')
  const w = canvas.parentElement.clientWidth || 600
  const h = 200
  canvas.width = w * 2
  canvas.height = h * 2
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  ctx.scale(2, 2)

  const pad = { top: 20, bottom: 24, left: 40, right: 16 }
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom
  const barW = Math.max(8, chartW / days.length * 0.5)

  ctx.clearRect(0, 0, w, h)

  days.forEach((d, i) => {
    const x = pad.left + (chartW / days.length) * i + (chartW / days.length - barW) / 2
    const barH = d.total > 0 ? (d.total / maxTotal) * chartH : 2
    const y = pad.top + chartH - barH
    ctx.fillStyle = d.total > 0 ? '#00d4aa' : '#252545'
    ctx.fillRect(x, y, barW, barH)
    ctx.fillStyle = '#9090a8'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(formatRp(d.total), x + barW / 2, y - 4)
  })
}

function renderAdminSettings() {
  const s = getSettings()
  document.getElementById('adminSettings').innerHTML = `
    <div class="admin-form-grid" style="max-width:400px">
      <div>
        <label>PIN Admin</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="text" id="setPinDisplay" value="${'•'.repeat((s.pin||'1234').length)}" disabled>
          <button class="btn-sm btn-edit" id="gantiPinBtn">Ganti</button>
        </div>
        <div id="pinChangeForm" class="hidden" style="margin-top:8px;display:grid;gap:8px">
          <input type="password" id="setPinLama" placeholder="PIN lama">
          <input type="password" id="setPinBaru" placeholder="PIN baru (4 digit)" maxlength="4">
          <button class="btn-sm btn-add-custom" id="simpanPinBtn">Simpan PIN</button>
          <span id="pinChangeError" style="color:var(--danger);font-size:13px" class="hidden"></span>
        </div>
      </div>
      <div>
        <label>Nama Toko</label>
        <input type="text" id="setNamaToko" value="${s.nama_toko || ''}" placeholder="SWAY Warkop">
      </div>
      <div>
        <label>Pajak / PPN (%)</label>
        <input type="number" id="setPajak" value="${s.pajak_persen || 0}" min="0" max="100">
      </div>
      <button class="btn btn-primary" id="simpanSettingsBtn">Simpan Pengaturan</button>
      <span id="settingsSuccess" style="color:var(--accent);font-size:14px;font-weight:500" class="hidden">Pengaturan disimpan</span>
    </div>
  `

  document.getElementById('gantiPinBtn').onclick = () => {
    document.getElementById('pinChangeForm').classList.remove('hidden')
    document.getElementById('setPinLama').focus()
  }

  document.getElementById('simpanPinBtn').onclick = () => {
    const lama = document.getElementById('setPinLama').value
    const baru = document.getElementById('setPinBaru').value
    const err = document.getElementById('pinChangeError')
    err.classList.add('hidden')
    if (lama !== getPin()) { err.textContent = 'PIN lama salah'; err.classList.remove('hidden'); return }
    if (baru.length !== 4 || !/^\d{4}$/.test(baru)) { err.textContent = 'PIN baru harus 4 angka'; err.classList.remove('hidden'); return }
    if (baru === lama) { err.textContent = 'PIN baru sama dengan lama'; err.classList.remove('hidden'); return }
    const s2 = getSettings()
    s2.pin = baru
    saveSettings(s2)
    document.getElementById('setPinDisplay').value = '••••'
    document.getElementById('pinChangeForm').classList.add('hidden')
    document.getElementById('setPinLama').value = ''
    document.getElementById('setPinBaru').value = ''
    document.getElementById('settingsSuccess').classList.remove('hidden')
    setTimeout(() => document.getElementById('settingsSuccess').classList.add('hidden'), 2000)
  }

  document.getElementById('simpanSettingsBtn').onclick = () => {
    const s2 = getSettings()
    s2.nama_toko = document.getElementById('setNamaToko').value.trim()
    s2.pajak_persen = parseInt(document.getElementById('setPajak').value) || 0
    saveSettings(s2)
    document.getElementById('settingsSuccess').classList.remove('hidden')
    setTimeout(() => document.getElementById('settingsSuccess').classList.add('hidden'), 2000)
  }
}

function downloadCSV(rows, filename) {
  const header = Object.keys(rows[0]).join(',')
  const csvRows = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = '\uFEFF' + header + '\n' + csvRows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(a.href)
}
