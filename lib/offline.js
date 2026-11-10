import { imgOpt, fetchItemsByIds, creditOf } from './supabase'
import { getFavorites } from './favorites'

// Fitur 6: data favorit untuk mode offline.
// - Baris item favorit disimpan ringkas di localStorage → /favorit tetap bisa menampilkan daftar saat offline.
// - Daftar URL foto dikirim ke service worker (public/sw.js) untuk disimpan di cache perangkat.

const ROWS_KEY = 'h2h-fav-items-cache'
const FIELDS = ['id', 'idol', 'title', 'type', 'url', 'group_name', 'era', 'created_at', 'width', 'height']

// Catatan pribadi admin tidak pernah disimpan — hanya kredit foto publik ("📷 …").
function slim(r) {
  const o = {}
  for (const k of FIELDS) if (r[k] !== undefined && r[k] !== null) o[k] = r[k]
  const credit = creditOf(r)
  if (credit) o.credit = credit
  return o
}

export function readCachedRows() {
  try {
    const v = JSON.parse(localStorage.getItem(ROWS_KEY) || '[]')
    return Array.isArray(v) ? v.filter((r) => r && typeof r.id === 'string') : []
  } catch { return [] }
}

function saveCachedRows(rows) {
  const fav = new Set(getFavorites())
  const seen = new Set()
  const list = []
  for (const r of rows) if (fav.has(r.id) && !seen.has(r.id)) { seen.add(r.id); list.push(slim(r)) }
  try { localStorage.setItem(ROWS_KEY, JSON.stringify(list)) } catch { /* penyimpanan penuh */ }
  return list
}

// URL yang disimpan untuk offline: versi 1000px (ukuran lightbox). Service worker memetakan
// semua varian lebar ke salinan ini. Hanya foto: video upload terlalu besar, dan YouTube
// memang butuh internet (thumbnail-nya juga tidak bisa disimpan hemat, lihat public/sw.js).
export function offlineUrlsFor(it) {
  return it.type === 'photo' ? [imgOpt(it.url, 1000)] : []
}

// freshRows: baris yang baru saja diambil dari database (halaman /favorit).
export async function syncOffline(freshRows) {
  if (typeof window === 'undefined') return
  const ids = getFavorites()
  let rows = readCachedRows()
  if (freshRows) {
    const baru = new Set(freshRows.map((r) => r.id))
    rows = [...freshRows, ...rows.filter((r) => !baru.has(r.id))]
  }
  const ada = new Set(rows.map((r) => r.id))
  const kurang = ids.filter((id) => !ada.has(id))
  if (kurang.length && navigator.onLine !== false) {
    try { rows = [...rows, ...(await fetchItemsByIds(kurang))] } catch { /* coba lagi di sinkron berikutnya */ }
  }
  const kept = saveCachedRows(rows)
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sw = reg && (reg.active || reg.waiting || reg.installing)
  if (sw) sw.postMessage({ type: 'h2h-sync-favorites', urls: kept.flatMap(offlineUrlsFor) })
}
