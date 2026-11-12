// Susunan grid foto bergaya "masonry" (kolom dengan tinggi berbeda-beda) — dipakai
// app/components/Masonry.js di galeri, album idol, favorit, dan koleksi.
//
// Dulu memakai kolom CSS (`columns-2 md:columns-3 lg:columns-4`). Dua masalahnya:
//   1. Urutan dibaca ke BAWAH dulu: di 4 kolom, foto terbaru 1–10 menumpuk di kolom kiri,
//      baris paling atas berisi foto 1, 11, 21, 31.
//   2. Setiap scroll tak terbatas memuat 40 foto lagi, browser membagi ulang SEMUA foto ke
//      kolom-kolom — foto yang sedang dilihat pindah kolom/bergeser.
// Sekarang: tiap item ditaruh berurutan di kolom yang saat itu paling pendek (seri → kolom paling
// kiri). Urutan jadi terbaca kiri ke kanan, dan karena posisi item ke-n hanya bergantung pada
// item 0..n-1, menambah item di belakang TIDAK menggeser item yang sudah tampil.

// Tinggi keterangan di bawah gambar (judul + nama idol + jarak antar kartu), dalam satuan lebar
// kolom. Perkiraan; sama untuk semua item, jadi hanya berpengaruh kecil pada pembagian kolom.
export const CAPTION_RATIO = 0.4

// Tinggi gambar ÷ lebar, sesuai bingkai yang benar-benar dipakai GalleryCard:
// foto berdimensi (migrasi 02) = rasio asli; YouTube = thumbnail 16:9; lainnya = bingkai 3:4.
export function heightRatio(it) {
  const w = Number(it && it.width), h = Number(it && it.height)
  if (it && it.type === 'photo' && w > 0 && h > 0) return h / w
  if (it && it.type === 'youtube') return 9 / 16
  return 4 / 3
}

// → array berisi `cols` array indeks item per kolom, urut dari atas.
export function placeInColumns(ratios, cols, caption = CAPTION_RATIO) {
  const n = Math.max(1, Math.floor(cols) || 1)
  const out = Array.from({ length: n }, () => [])
  const heights = new Array(n).fill(0)
  ratios.forEach((r, i) => {
    let c = 0
    for (let k = 1; k < n; k++) if (heights[k] < heights[c] - 1e-9) c = k
    out[c].push(i)
    heights[c] += (Number.isFinite(r) && r > 0 ? r : 4 / 3) + caption
  })
  return out
}

// Jumlah kolom per lebar layar — sama dengan breakpoint Tailwind yang dulu dipakai (md 768, lg 1024).
export const columnsFor = (width) => (width >= 1024 ? 4 : width >= 768 ? 3 : 2)
