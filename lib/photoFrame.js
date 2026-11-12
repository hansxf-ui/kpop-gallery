// Ukuran bingkai foto di lightbox (app/components/Lightbox.js).
//
// Kotak maksimum = bingkai lama: lebar min(76vw, 380px), tinggi 4/3 × lebar itu. Bingkai foto
// mengikuti rasio fotonya dan sebesar mungkin di dalam kotak itu:
//   - lebih tinggi dari 3:4 (mis. 2:3) → setinggi kotak, lebih sempit;
//   - 3:4 → persis kotak;
//   - lebih lebar (mis. landscape 3:2) → selebar kotak, lebih pendek.
// aspect-ratio = rasio foto, jadi foto mengisi bingkai dari tepi ke tepi tanpa di-crop.

export const PHOTO_BOX_W = 'min(76vw, 380px)'
export const PHOTO_BOX_H = `calc(${PHOTO_BOX_W} * 4 / 3)`
const BOX_RATIO = 4 / 3 // tinggi ÷ lebar kotak maksimum

// Rasio foto yang benar-benar termuat, per URL (dibagi bersama foto tetangga & aktif, jadi bingkai
// tidak berganti ukuran saat slot tetangga menjadi slot aktif).
const loaded = new Map()
export const loadedRatio = (url) => loaded.get(url) || null
// Foto hasil render Supabase bisa beda pembulatan 1–2px dari width/height database → celah ±1px.
// Setiap selisih > 0,1% dicatat dan dipakai.
export function noteLoaded(url, w, h, known) {
  if (!(w > 0 && h > 0)) return null
  const r = h / w
  if (known && Math.abs(r - known) / known <= 0.001) return null
  loaded.set(url, r)
  return r
}

// tinggi ÷ lebar dari kolom width/height (migrasi 02), atau null kalau belum tercatat.
export function ratioOf(it) {
  const w = Number(it && it.width), h = Number(it && it.height)
  return w > 0 && h > 0 ? h / w : null
}

// Lebar bingkai sebagai pecahan lebar kotak maksimum (1 = selebar kotak).
export const widthFraction = (r) => (r > 0 ? Math.min(1, BOX_RATIO / r) : 1)

// Gaya CSS bingkai. r = tinggi ÷ lebar foto; null → bingkai 3:4 lama (foto tetap utuh, contain).
export function frameStyle(r) {
  const ratio = r > 0 ? r : BOX_RATIO
  const f = widthFraction(ratio)
  return {
    width: f === 1 ? PHOTO_BOX_W : `calc(${PHOTO_BOX_W} * ${+f.toFixed(6)})`,
    aspectRatio: `1 / ${+ratio.toFixed(6)}`,
  }
}
