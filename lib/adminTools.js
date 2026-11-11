// Fungsi murni untuk alat admin: cadangan lengkap (pulihkan) dan ubah massal.
// Tanpa impor supaya mudah dites (tests/admintools.test.mjs). Panggilan Supabase ada di komponen.

export const BACKUP_FORMAT = 'h2h-gallery-backup'
export const BACKUP_VERSION = 1
export const ITEMS_FILE = 'items.json'
export const META_FILE = 'cadangan.json'
export const fileEntryOf = (path) => `files/${path}`

const TYPES = ['photo', 'video', 'youtube']
// Kolom GENERATED (migrasi 04) — dihitung database, tidak boleh diisi saat insert.
const GENERATED = ['credit']

// Isi items.json di ZIP cadangan, atau file "Ekspor backup (.json)" lama (array baris yang sama).
export function parseBackupRows(text) {
  let data
  try { data = JSON.parse(text) } catch { throw new Error('bukan JSON') }
  if (data && !Array.isArray(data) && Array.isArray(data.items)) data = data.items
  if (!Array.isArray(data)) throw new Error('bukan daftar item')
  const rows = data.filter((r) => r && typeof r === 'object' && typeof r.id === 'string' && r.id && TYPES.includes(r.type))
  if (rows.length === 0 && data.length > 0) throw new Error('tidak ada item yang dikenali')
  return rows
}

// Rencana pemulihan — tidak menimpa apa pun:
//   skip    : id sudah ada di database (dilewati)
//   upload  : file ada di ZIP cadangan → diunggah ulang lalu barisnya disisipkan dengan URL baru
//   link    : tanpa file untuk diunggah (YouTube, atau pemulihan dari .json saja) → baris disisipkan apa adanya
//   missing : memulihkan dari ZIP, tapi file item ini ada di bagian ZIP lain yang belum dipilih →
//             dilewati dulu (bukan disisipkan dengan link mati); pulihkan lagi dengan bagian itu.
export function planRestore(rows, existingIds, hasFile, fromZip) {
  const plan = { skip: [], upload: [], link: [], missing: [] }
  const seen = new Set()
  for (const r of rows) {
    if (existingIds.has(r.id) || seen.has(r.id)) { plan.skip.push(r); continue }
    seen.add(r.id)
    if (r.path && hasFile(r.path)) plan.upload.push(r)
    else if (r.path && fromZip) plan.missing.push(r)
    else plan.link.push(r)
  }
  return plan
}

// Baris siap disisipkan: kolom generated dibuang, URL diganti bila file diunggah ulang.
export function restoreRow(row, newUrl) {
  const out = { ...row }
  for (const k of GENERATED) delete out[k]
  if (newUrl) out.url = newUrl
  return out
}

// Nama kolom dari error PostgREST "Could not find the 'phash' column of 'items' in the schema cache"
// (kolom ada di cadangan tapi belum ada di database tujuan) → kolom itu dilewati.
export function missingColumnOf(error) {
  if (!error) return null
  const m = (error.message || '').match(/Could not find the '([^']+)' column/) || (error.message || '').match(/column "?([\w]+)"? of relation "?items"? does not exist/)
  return m ? m[1] : null
}

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', heic: 'image/heic', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', m4v: 'video/x-m4v' }
export const contentTypeOf = (path) => MIME[(String(path).split('.').pop() || '').toLowerCase()] || 'application/octet-stream'

// ---------- Ubah massal ----------
// Tag baru untuk satu item: tambah (add=true) atau buang `tag`. Urutan tag lama dipertahankan.
export function changeTag(tags, tag, add) {
  const cur = Array.isArray(tags) ? tags : []
  if (add) return cur.includes(tag) ? cur : [...cur, tag]
  return cur.filter((x) => x !== tag)
}

// Kelompokkan item per hasil tag yang sama → satu query update per kelompok, bukan per item.
// Item yang tag-nya tidak berubah tidak ikut.
export function groupTagUpdates(items, tag, add) {
  const groups = new Map()
  for (const it of items) {
    const before = Array.isArray(it.tags) ? it.tags : []
    const after = changeTag(before, tag, add)
    if (after.length === before.length && after.every((x, i) => x === before[i])) continue
    const key = JSON.stringify(after)
    if (!groups.has(key)) groups.set(key, { tags: after, ids: [] })
    groups.get(key).ids.push(it.id)
  }
  return [...groups.values()]
}

export const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

// Filter daftar admin. f: { q, idol, type, era, tag } — '' berarti semua; era/tag '-' = kosong.
// namesOf memecah "JUUN & CARMEN" jadi nama member (lib/gallery.js).
export function filterAdminItems(items, f, namesOf) {
  const q = (f.q || '').trim().toLowerCase()
  return items.filter((it) => {
    if (f.type && it.type !== f.type) return false
    if (f.idol && !namesOf(it).includes(f.idol)) return false
    if (f.era === '-' ? (it.era || '').trim() !== '' : f.era && it.era !== f.era) return false
    const tags = Array.isArray(it.tags) ? it.tags : []
    if (f.tag === '-' ? tags.length > 0 : f.tag && !tags.includes(f.tag)) return false
    if (!q) return true
    return [it.idol, it.title, it.era, it.group_name, it.note, it.alt_text, ...tags].some((v) => v && String(v).toLowerCase().includes(q))
  })
}
