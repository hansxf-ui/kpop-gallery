import { getFavorites, setFavorites } from './favorites'
import { mergeFavorites, parseFavFile, isUuid } from './favoritesTransfer'
import { getCollections, createCollection } from './collections'

// Fitur 10: satu file cadangan berisi favorit + koleksi (untuk pindah HP).
//
// Format (versi 2) — kunci `favorit` sengaja sama dengan file favorit lama, jadi tombol impor favorit
// versi lama tetap bisa membaca file ini (koleksinya saja yang dilewati):
//   { app: 'hearts2hearts-gallery', jenis: 'cadangan', versi: 2, diekspor, favorit: [uuid…],
//     koleksi: [{ nama, ids: [uuid…] }] }
// Impor menerima: file v2 ini, file favorit lama (jenis 'favorit'), atau array id polos.

export function buildBackup(favs = getFavorites(), cols = getCollections()) {
  return JSON.stringify({
    app: 'hearts2hearts-gallery', jenis: 'cadangan', versi: 2, diekspor: new Date().toISOString(),
    favorit: favs,
    koleksi: cols.map((c) => ({ nama: c.name, ids: c.ids })),
  }, null, 2)
}

const cleanIds = (ids) => [...new Set((Array.isArray(ids) ? ids : []).filter(isUuid).map((s) => s.toLowerCase()))]

// → { favorit: [uuid], koleksi: [{ nama, ids }] } atau lempar Error berpesan Indonesia.
export function parseBackup(text) {
  let data
  try { data = JSON.parse(text) } catch { throw new Error('File bukan file cadangan yang valid.') }
  if (data && typeof data === 'object' && !Array.isArray(data) && data.jenis === 'cadangan') {
    const koleksi = (Array.isArray(data.koleksi) ? data.koleksi : [])
      .filter((c) => c && typeof c === 'object')
      .map((c) => ({ nama: String(c.nama || c.name || '').slice(0, 60), ids: cleanIds(c.ids) }))
    return { favorit: cleanIds(data.favorit), koleksi }
  }
  // File favorit lama / array polos → migrasi otomatis: hanya favorit, tanpa koleksi.
  try { return { favorit: parseFavFile(text), koleksi: [] } } catch { throw new Error('File bukan file cadangan yang valid.') }
}

// Gabungkan ke perangkat ini. Tidak ada yang terhapus. Koleksi dengan nama + isi yang sama persis
// dengan koleksi yang sudah ada dilewati (impor ulang file yang sama tidak membuat duplikat).
export function restoreBackup({ favorit, koleksi }) {
  const { list, added } = mergeFavorites(getFavorites(), favorit)
  if (added) setFavorites(list)
  const ada = getCollections().map((c) => `${c.name.toLowerCase()}|${[...c.ids].sort().join(',')}`)
  let kol = 0
  for (const c of koleksi) {
    const sig = `${(c.nama || '').toLowerCase()}|${[...c.ids].sort().join(',')}`
    if (ada.includes(sig)) continue
    const made = createCollection(c.nama || 'Koleksi', c.ids)
    ada.push(`${made.name.toLowerCase()}|${[...made.ids].sort().join(',')}`)
    kol++
  }
  return { favorit: added, koleksi: kol }
}
