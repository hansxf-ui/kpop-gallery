// Tanggal debut & ulang tahun member (bulan, tanggal) untuk tema "hari spesial" otomatis.
// Sumber: profil resmi/media K-pop, per September 2026 — cek ulang kalau ada member baru/keluar.
export const SPECIAL_DATES = [
  { type: 'debut', month: 2, day: 24, label: 'Selamat ulang tahun debut, Hearts2Hearts! 🎉' },
  { type: 'birthday', month: 3, day: 28, name: 'Carmen', label: 'Selamat ulang tahun, Carmen! 🎂' },
  { type: 'birthday', month: 4, day: 12, name: 'Yuha', label: 'Selamat ulang tahun, Yuha! 🎂' },
  { type: 'birthday', month: 4, day: 19, name: 'Ye-on', label: 'Selamat ulang tahun, Ye-on! 🎂' },
  { type: 'birthday', month: 6, day: 18, name: 'Stella', label: 'Selamat ulang tahun, Stella! 🎂' },
  { type: 'birthday', month: 9, day: 7, name: 'Jiwoo', label: 'Selamat ulang tahun, Jiwoo! 🎂' },
  { type: 'birthday', month: 10, day: 9, name: 'Ian', label: 'Selamat ulang tahun, Ian! 🎂' },
  { type: 'birthday', month: 12, day: 3, name: 'Juun', label: 'Selamat ulang tahun, Juun! 🎂' },
  { type: 'birthday', month: 12, day: 20, name: 'A-na', label: 'Selamat ulang tahun, A-na! 🎂' },
]

export function todaysSpecialDate(now = new Date()) {
  const m = now.getMonth() + 1, d = now.getDate()
  return SPECIAL_DATES.find((s) => s.month === m && s.day === d) || null
}

// Tahun debut (24 Feb 2025, dari halaman Tentang) — dipakai untuk menghitung anniversary ke-berapa.
// Tahun lahir member TIDAK tercatat di repo, jadi umur tidak ditampilkan.
export const DEBUT_YEAR = 2025

// Kejadian berikutnya tiap tanggal spesial (hari ini dihitung 0 hari), urut dari yang terdekat.
// Dihitung per tanggal kalender lokal, bukan per jam, supaya "hari ini" sesuai zona waktu pengunjung.
export function nextOccurrences(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return SPECIAL_DATES.map((s) => {
    let d = new Date(today.getFullYear(), s.month - 1, s.day)
    if (d < today) d = new Date(today.getFullYear() + 1, s.month - 1, s.day)
    const days = Math.round((d - today) / 86400000)
    const anniversary = s.type === 'debut' ? d.getFullYear() - DEBUT_YEAR : null
    return { ...s, date: d, days, anniversary }
  }).sort((a, b) => a.days - b.days)
}
