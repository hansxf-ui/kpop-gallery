// Parameter URL /galeri. Dipakai di sisi klien (baca/tulis URL) dan server (metadata Open Graph).
// ?item=<uuid> = buka item itu langsung di lightbox.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isItemId = (v) => typeof v === 'string' && UUID.test(v)

// Baca parameter dari string query ("?item=...") atau URLSearchParams.
export function parseGaleriQuery(search) {
  const p = typeof search === 'string' ? new URLSearchParams(search) : search
  const item = p.get('item')
  return { item: isItemId(item) ? item.toLowerCase() : null }
}

// Link bagikan untuk satu item — selalu ke /galeri, dari halaman mana pun lightbox dibuka.
export function itemShareUrl(origin, id) {
  return `${origin}/galeri?item=${encodeURIComponent(id)}`
}

// Ubah sebagian parameter URL tanpa navigasi Next (tidak memuat ulang data / metadata server).
// Nilai null/'' = hapus parameter itu. Parameter lain di URL dibiarkan.
export function replaceQuery(patch) {
  if (typeof window === 'undefined') return
  const p = new URLSearchParams(window.location.search)
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === '') p.delete(k)
    else p.set(k, v)
  }
  const qs = p.toString()
  const next = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
  const now = window.location.pathname + window.location.search + window.location.hash
  if (next !== now) window.history.replaceState(window.history.state, '', next)
}

// ---------- Fitur 7: filter galeri di URL ----------
// /galeri?idol=CARMEN&era=Focus&jenis=foto&q=seragam&urut=acak&acak=123
// Nilai bawaan (Semua / semua / terbaru / kosong) tidak ditulis ke URL.
export const FILTER_DEFAULTS = { idol: 'Semua', group: 'Semua', era: 'Semua', mediaType: 'semua', q: '', sort: 'terbaru', seed: 0 }
const JENIS = ['foto', 'video']
const URUT = ['terlama', 'acak']

// idolOptions: daftar chip idol yang sah (MEMBERS + 'Hearts2Hearts'), dicocokkan tanpa peduli huruf besar/kecil.
export function parseGaleriFilters(search, idolOptions) {
  const p = typeof search === 'string' ? new URLSearchParams(search) : search
  const f = { ...FILTER_DEFAULTS }
  const idol = (p.get('idol') || '').trim()
  const cocok = idol && idolOptions.find((n) => n.toUpperCase() === idol.toUpperCase())
  if (cocok) f.idol = cocok
  const teks = (k) => (p.get(k) || '').trim().slice(0, 100)
  if (teks('grup')) f.group = teks('grup')
  if (teks('era')) f.era = teks('era')
  if (JENIS.includes(p.get('jenis'))) f.mediaType = p.get('jenis')
  if (teks('q')) f.q = teks('q')
  if (URUT.includes(p.get('urut'))) f.sort = p.get('urut')
  if (f.sort === 'acak') {
    const s = Number.parseInt(p.get('acak') || '', 10)
    f.seed = Number.isFinite(s) && s >= 0 ? s : 0
  }
  return f
}

// Patch untuk replaceQuery(): null = hapus parameter.
export function filterQueryPatch(f) {
  return {
    idol: f.idol !== 'Semua' ? f.idol : null,
    grup: f.group !== 'Semua' ? f.group : null,
    era: f.era !== 'Semua' ? f.era : null,
    jenis: f.mediaType !== 'semua' ? f.mediaType : null,
    q: f.q.trim() || null,
    urut: f.sort !== 'terbaru' ? f.sort : null,
    acak: f.sort === 'acak' ? String(f.seed) : null,
  }
}
