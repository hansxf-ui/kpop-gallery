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
