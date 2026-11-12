import { createClient } from '@supabase/supabase-js'
export const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export const ytId = (u) => ((u || '').match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/) || [])[1]

// Kolom yang boleh dibaca pengunjung (migrasi 04). `note` (catatan pribadi admin) dan `path`
// sengaja tidak dimuat di halaman publik — kredit foto publik ada di kolom `credit`.
export const BASE_PUBLIC_COLUMNS = 'id, idol, title, type, url, group_name, era, created_at, width, height, credit'
// + kolom dari migrasi fitur baru (06: tags, 13: alt_text).
export const PUBLIC_COLUMNS = `${BASE_PUBLIC_COLUMNS}, tags, alt_text`
const COLUMN_TIERS = [PUBLIC_COLUMNS, `${BASE_PUBLIC_COLUMNS}, tags`, BASE_PUBLIC_COLUMNS, '*']

// Kolom belum ada (migrasi belum dijalankan): Postgres 42703 / PostgREST PGRST204.
export const isMissingColumn = (error) =>
  !!error && (error.code === '42703' || error.code === 'PGRST204' || /column .* does not exist/i.test(error.message || ''))

// Jalankan query dengan daftar kolom publik. Kalau ada kolom yang belum dibuat di database, turun
// bertahap: tanpa alt_text (migrasi 13 belum jalan) → tanpa tags (06) → `*` (04 belum jalan).
// Tingkat yang berhasil diingat, supaya query berikutnya tidak mengulang permintaan yang gagal.
// `*` tidak boleh langsung dipakai: setelah migrasi 04, anon ditolak membaca `*`.
let tier = 0
export async function selectPublic(build) {
  let res = await build(COLUMN_TIERS[tier])
  while (res.error && isMissingColumn(res.error) && tier < COLUMN_TIERS.length - 1) {
    tier++
    res = await build(COLUMN_TIERS[tier])
  }
  return res
}

// Supabase/PostgREST membatasi maksimal 1000 baris per request — ambil semua item per halaman (range)
// supaya galeri tetap lengkap setelah total item melewati 1000.
// `filter` (opsional) mempersempit query di database, mis. album satu member.
// `columns` '*' hanya untuk admin yang login.
// Tampil progresif (galeri): `firstPage` = ukuran halaman pertama yang lebih kecil (mis. 120 item
// terbaru), `onPage(barisSejauhIni)` dipanggil setiap ada halaman yang belum terakhir — halaman bisa
// tampil sebelum seluruh koleksi termuat. Baris ganda (item baru masuk di antara dua request,
// sehingga offset bergeser) dibuang.
const ORDER = (q) => q.order('created_at', { ascending: false }).order('id', { ascending: true })
export async function fetchAllItems({ filter, columns, firstPage, onPage } = {}) {
  const PAGE = 1000
  const all = []
  const seen = new Set()
  for (let from = 0; ; ) {
    const size = from === 0 && firstPage ? firstPage : PAGE
    const page = (cols) => {
      let q = sb.from('items').select(cols)
      if (filter) q = filter(q)
      return ORDER(q).range(from, from + size - 1)
    }
    const { data, error } = columns ? await page(columns) : await selectPublic(page)
    if (error) throw error
    for (const r of data || []) if (!seen.has(r.id)) { seen.add(r.id); all.push(r) }
    if (!data || data.length < size) break
    from += size
    if (onPage) onPage(all.slice())
  }
  return all
}

// Jumlah seluruh item (tanpa memuat barisnya).
export async function fetchItemCount() {
  const { count, error } = await sb.from('items').select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

// Item di posisi tertentu dalam urutan galeri (terbaru dulu) — satu request kecil per posisi,
// paralel. Posisi di luar jumlah item → null.
export async function fetchItemsAtOffsets(offsets) {
  return Promise.all(offsets.map(async (o) => {
    const { data, error } = await selectPublic((cols) => ORDER(sb.from('items').select(cols)).range(o, o))
    if (error) throw error
    return (data && data[0]) || null
  }))
}

// Ambil item berdasarkan daftar id, dipecah per 100 id. Satu query `.in()` dengan ratusan uuid
// membuat URL request terlalu panjang dan ditolak server (favorit banyak = Favoritku gagal dimuat).
export async function fetchItemsByIds(ids) {
  const out = []
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100)
    const { data, error } = await selectPublic((cols) => sb.from('items').select(cols).in('id', chunk))
    if (error) throw error
    out.push(...(data || []))
  }
  return out
}

// Kredit foto publik ("📷 …"): kolom `credit` setelah migrasi 04, atau dari `note` sebelum itu.
export const creditOf = (it) => {
  if (it.credit) return it.credit
  const n = (it.note || '').trim()
  return n.startsWith('📷') ? n : null
}

// Versi ringan gambar storage buat thumbnail/banner: pakai endpoint render Supabase (resize on-the-fly).
// URL non-storage (mis. hotlink luar) dikembalikan apa adanya. Foto asli tetap dipakai di lightbox.
export const imgOpt = (url, w = 800, q = 85) =>
  typeof url === 'string' && url.includes('/storage/v1/object/public/') && !/\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)
    ? url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${w}&quality=${q}&resize=contain`
    : url
