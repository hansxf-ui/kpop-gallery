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
