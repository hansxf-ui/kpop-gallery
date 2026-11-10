import { SPECIAL_DATES } from './specialDates'

// Profil singkat member — HANYA fakta yang sudah tercatat di repo:
// - posisi: kartu member di beranda (app/page.js) & halaman Tentang
// - ulang tahun (tanggal & bulan, tanpa tahun): lib/specialDates.js
// - asal: halaman Tentang (baru tercatat untuk Carmen dan Stella)
// Fakta yang belum ada di repo dibiarkan null dan tidak ditampilkan — jangan diisi tebakan.
export const PROFILES = {
  JIWOO: { name: 'Jiwoo', pos: 'Leader', origin: null },
  CARMEN: { name: 'Carmen', pos: 'Main Vocal', origin: 'Denpasar, Bali, Indonesia' },
  YUHA: { name: 'Yuha', pos: 'Main Vocal · Lead Dancer', origin: null },
  STELLA: { name: 'Stella', pos: 'Lead Vocal', origin: 'Lahir di Vancouver, Kanada' },
  JUUN: { name: 'Juun', pos: 'Main Dancer · Main Rapper', origin: null },
  'A-NA': { name: 'A-na', pos: 'Lead Rapper · Visual', origin: null },
  IAN: { name: 'Ian', pos: 'Main Dancer · Center', origin: null },
  'YE-ON': { name: 'Ye-on', pos: 'Lead Vocal · Maknae', origin: null },
}

// Catatan tambahan dari halaman Tentang (bukan tebakan).
export const PROFILE_NOTES = {
  CARMEN: 'Idol Indonesia pertama yang debut di SM Entertainment.',
}

// Profil grup untuk album "Hearts2Hearts" (dari halaman Tentang).
export const GROUP_PROFILE = {
  name: 'Hearts2Hearts',
  debut: '24 Februari 2025 (The Chase)',
  agency: 'SM Entertainment',
  fandom: 'S2U',
  members: 8,
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function birthdayOf(key, lang = 'id') {
  const p = PROFILES[key]
  const s = p && SPECIAL_DATES.find((d) => d.type === 'birthday' && d.name === p.name)
  if (!s) return null
  return lang === 'en' ? `${s.day} ${MONTHS_EN[s.month - 1]}` : `${s.day} ${BULAN[s.month - 1]}`
}

// "Era favorit" = era yang paling banyak fotonya di album ini (dari data galeri, bukan klaim).
export function topEra(items) {
  const c = {}
  for (const it of items) if (it.era) c[it.era] = (c[it.era] || 0) + 1
  const best = Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  return best ? { era: best[0], count: best[1] } : null
}
