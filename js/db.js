const DB_NAME = 'PosWarkopDB'
const DB_VER = 2

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (e.oldVersion < 1) {
        db.createObjectStore('menus', { keyPath: 'id' })
        db.createObjectStore('add_ons', { keyPath: 'id' })
        db.createObjectStore('orders', { keyPath: 'id' })
        db.createObjectStore('order_items', { keyPath: 'id' })
      }
      if (e.oldVersion < 2) {
        db.createObjectStore('cash_ledger', { keyPath: 'id' })
      }
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = e => reject(e.target.error)
  })
}

async function getAll(store) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => { resolve(req.result); db.close() }
    req.onerror = () => { reject(req.error); db.close() }
  })
}

async function get(store, id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(id)
    req.onsuccess = () => { resolve(req.result); db.close() }
    req.onerror = () => { reject(req.error); db.close() }
  })
}

async function put(store, data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).put(data)
    req.onsuccess = () => { resolve(req.result); db.close() }
    req.onerror = () => { reject(req.error); db.close() }
  })
}

async function del(store, id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).delete(id)
    req.onsuccess = () => { resolve(); db.close() }
    req.onerror = () => { reject(req.error); db.close() }
  })
}

async function seed() {
  if (localStorage.getItem('seeded')) return
  try {
    const res = await fetch('data/seed.json?t=' + Date.now())
    const data = await res.json()
    for (const item of data.menus) await put('menus', item)
    for (const item of data.add_ons) await put('add_ons', item)
    localStorage.setItem('seeded', '1')
  } catch (e) { console.warn('seed failed', e) }
}

async function getNextId(store) {
  const all = await getAll(store)
  return all.length ? Math.max(...all.map(m => m.id)) + 1 : 1
}
