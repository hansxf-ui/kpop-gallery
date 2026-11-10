import { parseTanggal, dayKey } from './schedule'

// Fitur 13: kalender bulanan /jadwal. Data tetap dari lib/jadwal.js (tidak diduplikasi).

// Minggu-minggu sebuah bulan, mulai Senin. month = 0–11. Hari di luar bulan ditandai inMonth: false.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // Senin = 0
  const start = new Date(year, month, 1 - offset)
  const weeks = []
  for (let w = 0; w < 6; w++) {
    const days = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d)
      days.push({ date, key: dayKey(date), inMonth: date.getMonth() === month })
    }
    if (w >= 4 && !days.some((x) => x.inMonth)) break // baris kosong di akhir tidak ditampilkan
    weeks.push(days)
  }
  return weeks
}

// Gabungkan acara jadwal + riwayat rilisan jadi peta 'YYYY-MM-DD' → [acara]. Acara tanpa tanggal dilewati.
export function eventsByDay(jadwal, riwayat = []) {
  const all = [
    ...jadwal,
    ...riwayat.map((r) => ({ id: `riwayat-${r.judul}`, tipe: 'rilis', emoji: '🎵', judul: r.judul, tanggal: r.tanggal, catatan: r.catatan, riwayat: true })),
  ]
  const map = new Map()
  for (const e of all) {
    if (!e.tanggal) continue
    const k = dayKey(parseTanggal(e.tanggal))
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(e)
  }
  for (const list of map.values()) list.sort((a, b) => (a.tanggal > b.tanggal ? 1 : -1))
  return map
}

export const shiftMonth = ({ y, m }, d) => {
  const t = new Date(y, m + d, 1)
  return { y: t.getFullYear(), m: t.getMonth() }
}
