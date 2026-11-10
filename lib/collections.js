// Koleksi bernama milik pengunjung (fitur 8), mis. "Carmen era Focus". Disimpan di perangkat.
// Bisa dibagikan lewat kode "H2HK1-…" (nama + daftar id item, base64url) — seperti kode favorit.
// Impor kode SELALU membuat koleksi baru; koleksi yang sudah ada tidak tertimpa.

const KEY = 'h2h-collections'
export const COLL_EVENT = 'h2h:collections-changed'
const PREFIX = 'H2HK1-'
const MAX_NAME = 60
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const clean = (ids) => [...new Set((ids || []).filter((x) => typeof x === 'string' && UUID.test(x)).map((x) => x.toLowerCase()))]
const cleanName = (n) => String(n || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME)
const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(36).slice(2)}`)

export function getCollections() {
  if (typeof window === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v)
      ? v.filter((c) => c && typeof c.id === 'string').map((c) => ({ id: c.id, name: cleanName(c.name) || 'Tanpa nama', ids: clean(c.ids), created: c.created || null }))
      : []
  } catch { return [] }
}

function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(COLL_EVENT))
  return list
}

// Nama unik: kalau "Focus" sudah ada, jadi "Focus (2)".
function uniqueName(name, list) {
  const base = cleanName(name) || 'Koleksi baru'
  const taken = new Set(list.map((c) => c.name.toLowerCase()))
  if (!taken.has(base.toLowerCase())) return base
  for (let i = 2; ; i++) {
    const n = `${base.slice(0, MAX_NAME - 5)} (${i})`
    if (!taken.has(n.toLowerCase())) return n
  }
}

export function createCollection(name, ids = []) {
  const list = getCollections()
  const c = { id: newId(), name: uniqueName(name, list), ids: clean(ids), created: new Date().toISOString() }
  save([...list, c])
  return c
}

export function renameCollection(id, name) {
  const list = getCollections()
  const others = list.filter((c) => c.id !== id)
  return save(list.map((c) => (c.id === id ? { ...c, name: uniqueName(name, others) } : c)))
}

export const deleteCollection = (id) => save(getCollections().filter((c) => c.id !== id))

export function toggleInCollection(id, itemId) {
  return save(getCollections().map((c) => {
    if (c.id !== id) return c
    return { ...c, ids: c.ids.includes(itemId) ? c.ids.filter((x) => x !== itemId) : [...c.ids, itemId] }
  }))
}

// Buang id item yang sudah tidak ada di galeri (dihapus admin).
export function pruneCollection(id, existingIds) {
  const ada = new Set(existingIds)
  return save(getCollections().map((c) => (c.id === id ? { ...c, ids: c.ids.filter((x) => ada.has(x)) } : c)))
}

// ---------- Kode bagikan ----------
// Byte: [panjang nama UTF-8 (1 byte)] [nama] [16 byte per uuid …]
const b64url = (bin) => btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function encodeCollection(c) {
  let nameBytes = new TextEncoder().encode(cleanName(c.name))
  if (nameBytes.length > 180) nameBytes = nameBytes.slice(0, 180)
  let bin = String.fromCharCode(nameBytes.length)
  for (const b of nameBytes) bin += String.fromCharCode(b)
  for (const id of clean(c.ids)) {
    const hex = id.replace(/-/g, '')
    for (let i = 0; i < 32; i += 2) bin += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16))
  }
  return PREFIX + b64url(bin)
}

export function decodeCollection(code) {
  const s = String(code || '').replace(/\s+/g, '')
  if (!s.toUpperCase().startsWith(PREFIX)) throw new Error('Kode tidak dikenali — kode koleksi diawali "H2HK1-".')
  const body = s.slice(PREFIX.length).replace(/-/g, '+').replace(/_/g, '/')
  let bin
  try { bin = atob(body + '='.repeat((4 - (body.length % 4)) % 4)) } catch { throw new Error('Kode rusak — pastikan tersalin utuh.') }
  if (bin.length < 1) throw new Error('Kode rusak — pastikan tersalin utuh.')
  const n = bin.charCodeAt(0)
  if (bin.length < 1 + n || (bin.length - 1 - n) % 16 !== 0) throw new Error('Kode terpotong — pastikan tersalin utuh.')
  let name
  try {
    name = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin.slice(1, 1 + n), (ch) => ch.charCodeAt(0)))
  } catch { throw new Error('Kode rusak — pastikan tersalin utuh.') }
  const ids = []
  for (let i = 1 + n; i < bin.length; i += 16) {
    let hex = ''
    for (let j = i; j < i + 16; j++) hex += bin.charCodeAt(j).toString(16).padStart(2, '0')
    ids.push(`${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`)
  }
  return { name: cleanName(name) || 'Koleksi bersama', ids: clean(ids) }
}

export function importCollection(code) {
  const { name, ids } = decodeCollection(code)
  return createCollection(name, ids)
}
