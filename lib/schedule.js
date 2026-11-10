// Logika tanggal jadwal & voting bersama — dipakai /jadwal, /voting, /hari-ini, dan kalender bulanan.
// (Dulu disalin di masing-masing halaman.) Data tetap di lib/jadwal.js & lib/voting.js.

// Tanggal-saja ('2026-10-19') di-parse sebagai tanggal kalender LOKAL murni — bukan
// UTC tengah malam — supaya harinya tidak bergeser sehari gara-gara zona waktu pengunjung.
export function parseTanggal(t) {
  if (!t) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [y, m, d] = t.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(t)
}

export const isDateOnly = (t) => /^\d{4}-\d{2}-\d{2}$/.test(t || '')

export function hitungMundur(target, nowMs) {
  const selisih = parseTanggal(target).getTime() - nowMs
  if (selisih <= 0) return null
  const hari = Math.floor(selisih / 86400000)
  const jam = Math.floor((selisih % 86400000) / 3600000)
  const menit = Math.floor((selisih % 3600000) / 60000)
  const detik = Math.floor((selisih % 60000) / 1000)
  return { hari, jam, menit, detik }
}

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function hariIni(tanggal, now = new Date()) {
  if (!tanggal) return false
  return sameDay(parseTanggal(tanggal), now)
}

export function sudahLewat(tanggal, now = new Date()) {
  if (!tanggal) return false
  return dayStart(parseTanggal(tanggal)) < dayStart(now)
}

// Kunci tanggal LOKAL 'YYYY-MM-DD' (bukan UTC).
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// buka | segera | tunggu | tutup
export function statusVote(v, nowMs) {
  if (!v.mulai || !v.selesai) return 'tunggu'
  if (nowMs < new Date(v.mulai).getTime()) return 'segera'
  if (nowMs > new Date(v.selesai).getTime()) return 'tutup'
  return 'buka'
}
