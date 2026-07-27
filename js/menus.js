let currentKategori = 'Minuman'
let selectedMenu = null

function formatRp(n) { return 'Rp ' + (n || 0).toLocaleString('id-ID') }

let searchFilter = ''

async function renderMenuGrid(kategori) {
  currentKategori = kategori
  const grid = document.getElementById('menuGrid')
  grid.innerHTML = ''
  const menus = await getAll('menus')
  let shown = menus.filter(m => m.is_active !== false)
  if (searchFilter) {
    shown = shown.filter(m => m.nama.toLowerCase().includes(searchFilter))
  } else {
    shown = shown.filter(m => m.kategori === kategori)
  }

  if (!shown.length) {
    grid.innerHTML = '<div class="empty-state">Tidak ada menu</div>'
    return
  }

  shown.forEach(m => {
    const totalStok = !m.variants || m.variants.length === 0
      ? -1
      : m.variants.reduce((s, v) => s + (v.stok || 0), 0)
    const habis = totalStok === 0
    const menipis = !habis && totalStok > 0 && totalStok <= 5
    const div = document.createElement('div')
    div.className = 'menu-item' + (habis ? ' menu-habis' : '')
    div.innerHTML = `
      <div class="menu-nama">${m.nama}</div>
      <div class="menu-harga">${formatRp(m.harga_dasar)}</div>
      ${habis ? '<div class="menu-stok-habis">HABIS</div>' : menipis ? '<div class="menu-stok-warning">Sisa ' + totalStok + '</div>' : m.variants.length > 0 ? '<div class="menu-varian-count">' + m.variants.length + ' varian</div>' : ''}
    `
    if (!habis) div.onclick = () => openMenuModal(m)
    grid.appendChild(div)
  })
} 

function openMenuModal(menu) {
  selectedMenu = menu
  document.getElementById('menuModalTitle').textContent = menu.nama
  const body = document.getElementById('menuModalBody')
  let html = ''

  if (menu.variants && menu.variants.length > 0) {
    html += `<div class="opsi-group">
      <label>Pilih Varian</label>
      <div class="opsi-radio">`
    menu.variants.forEach((v, i) => {
      const habis = (v.stok || 0) === 0
      const hargaTampil = v.harga ? ` (${formatRp(v.harga)})` : ''
      html += `<label class="${habis ? 'disabled' : ''}">
        <input type="radio" name="varian" value="${v.nama}" ${i === 0 && !habis ? 'checked' : ''} ${habis ? 'disabled' : ''}>
        ${v.nama}${hargaTampil} ${habis ? '(Habis)' : `(stok: ${v.stok})`}
      </label>`
    })
    html += `</div></div>`
  }

  if (menu.tersedia && menu.tersedia.length > 0) {
    html += `<div class="opsi-group">
      <label>Suhu</label>
      <div class="opsi-radio">`
    menu.tersedia.forEach((t, i) => {
      html += `<label>
        <input type="radio" name="suhu" value="${t}" ${i === 0 ? 'checked' : ''}>
        ${t}
      </label>`
    })
    html += `</div></div>`
  }

  html += `<div class="opsi-group">
    <label>Tambahan</label>
    <div class="opsi-checkbox" id="addonCheckboxGroup"></div>
  </div>
  <div class="opsi-group qty-wrap">
    <label>Jumlah</label>
    <input type="number" id="menuQty" value="1" min="1">
  </div>
  <div class="opsi-group">
    <label>Catatan</label>
    <input type="text" id="menuCatatan" placeholder="Catatan untuk menu ini...">
  </div>`
  body.innerHTML = html

  getAll('add_ons').then(addons => {
    const container = document.getElementById('addonCheckboxGroup')
    addons.forEach(a => {
      const label = document.createElement('label')
      const cb = document.createElement('input')
      cb.type = 'checkbox'
      cb.value = JSON.stringify({id: a.id, nama: a.nama_addon, harga: a.harga_tambahan})
      label.append(cb, ' ' + a.nama_addon + (a.harga_tambahan > 0 ? ' (+' + formatRp(a.harga_tambahan) + ')' : ''))
      container.appendChild(label)
    })
  })

  document.getElementById('menuModalAdd').onclick = () => {
    addMenuToCart()
  }
  document.getElementById('menuModalCancel').onclick = closeMenuModal
  document.getElementById('menuModal').classList.remove('hidden')
  document.getElementById('modalOverlay').classList.remove('hidden')
}

window.closeMenuModal = () => {
  document.getElementById('menuModal').classList.add('hidden')
  document.getElementById('modalOverlay').classList.add('hidden')
}

function addMenuToCart() {
  if (!selectedMenu) return
  const varianRadio = document.querySelector('input[name="varian"]:checked')
  const varian = varianRadio ? varianRadio.value : null
  const suhuRadio = document.querySelector('input[name="suhu"]:checked')
  const suhu = suhuRadio ? suhuRadio.value : null
  const catatan = document.getElementById('menuCatatan').value
  const qty = Math.max(1, parseInt(document.getElementById('menuQty').value) || 1)
  const addonCheckboxes = document.querySelectorAll('#addonCheckboxGroup input:checked')
  const addons = Array.from(addonCheckboxes).map(cb => JSON.parse(cb.value))

  addToCart(selectedMenu, varian, suhu, addons, catatan, qty)
  closeMenuModal()
}
