import { createClient } from '@supabase/supabase-js'
export const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export const ytId = (u) => ((u || '').match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/) || [])[1]

// Kolom yang boleh dibaca pengunjung (migrasi 04). `note` (catatan pribadi admin) dan `path`
// sengaja tidak dimuat di halaman publik — kredit foto publik ada di kolom `credit`.
export const PUBLIC_COLUMNS = 'id, idol, title, type, url, group_name, era, created_at, width, height, credit'

// Kolom belum ada (migrasi 02/04 belum dijalankan): Postgres 42703 / PostgREST PGRST204.
export const isMissingColumn = (error) =>
  !!error && (error.code === '42703' || error.code === 'PGRST204' || /column .* does not exist/i.test(error.message || ''))

// Jalankan query dengan daftar kolom publik; kalau kolomnya belum ada di database,
// ulangi dengan `*` (perilaku sebelum migrasi) supaya galeri tetap tampil.
export async function selectPublic(build) {
  const res = await build(PUBLIC_COLUMNS)
  if (res.error && isMissingColumn(res.error)) return build('*')
  return res
}

// Supabase/PostgREST membatasi maksimal 1000 baris per request — ambil semua item per halaman (range)
// supaya galeri tetap lengkap setelah total item melewati 1000.
// `filter` (opsional) mempersempit query di database, mis. album satu member.
// `columns` '*' hanya untuk admin yang login.
export async function fetchAllItems({ filter, columns } = {}) {
  const PAGE = 1000
  let all = []
  for (let from = 0; ; from += PAGE) {
    const page = (cols) => {
      let q = sb.from('items').select(cols)
      if (filter) q = filter(q)
      return q.order('created_at', { ascending: false }).order('id', { ascending: true }).range(from, from + PAGE - 1)
    }
    const { data, error } = columns ? await page(columns) : await selectPublic(page)
    if (error) throw error
    all = all.concat(data || [])
    if (!data || data.length < PAGE) break
  }
  return all
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
