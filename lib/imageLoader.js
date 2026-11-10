import { imgOpt } from './supabase'

// Loader next/image: minta versi berukuran `width` dari endpoint render Supabase.
export const supabaseLoader = ({ src, width, quality }) => imgOpt(src, width, quality || 85)

// Foto storage Supabase yang dimensinya sudah tercatat (kolom width/height, migrasi 02)
// bisa dirender lewat next/image tanpa lompatan layout.
export const hasDimensions = (it) =>
  it.type === 'photo' && Number(it.width) > 0 && Number(it.height) > 0 && imgOpt(it.url) !== it.url

// Ukur dimensi gambar di browser (dipakai admin).
export function measureImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => (img.naturalWidth && img.naturalHeight ? resolve({ width: img.naturalWidth, height: img.naturalHeight }) : reject(new Error('kosong')))
    img.onerror = reject
    img.src = src
  })
}

export async function measureFile(file) {
  const bmp = await createImageBitmap(file)
  const out = { width: bmp.width, height: bmp.height }
  bmp.close()
  return out
}

// Kolom belum ada (migrasi 02 belum dijalankan): PostgREST mengembalikan PGRST204
// atau Postgres 42703. Admin lalu menyimpan tanpa dimensi supaya upload tidak gagal.
export const isMissingColumnError = (error) =>
  !!error && (error.code === 'PGRST204' || error.code === '42703' || (/width|height/.test(error.message || '') && /column/i.test(error.message || '')))
