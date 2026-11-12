// "Pilihan minggu ini" di galeri: 5 item menyebar dari seluruh koleksi, titik mulai bergeser tiap
// minggu (logika lama, dipindah dari GaleriClient supaya bisa dites dan dipakai dua cara):
//   - pickWeekly(items): dari daftar lengkap (urut terbaru dulu), seperti sebelumnya;
//   - weeklyIndices(total): posisi yang sama, untuk mengambil kelima item langsung dari database
//     (lib/supabase.js fetchItemsAtOffsets) tanpa menunggu seluruh koleksi termuat.

export function weekNumber(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t - yStart) / 86400000 + 1) / 7)
}

export function weeklyIndices(total, now = new Date()) {
  if (!(total > 0)) return []
  const n = Math.min(5, total)
  const step = Math.max(1, Math.floor(total / n))
  const start = weekNumber(now) % total
  return Array.from({ length: n }, (_, i) => (start + i * step) % total)
}

export const pickWeekly = (items, now = new Date()) => weeklyIndices(items.length, now).map((i) => items[i])
