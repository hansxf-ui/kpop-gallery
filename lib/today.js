import { sb, selectPublic } from './supabase'
import { JADWAL } from './jadwal'
import { VOTING } from './voting'
import { hariIni, sudahLewat, statusVote, dayKey } from './schedule'

// "Hari ini di H2H" (fitur 1).

// Hash FNV-1a 32-bit — angka yang sama untuk teks yang sama di semua perangkat.
export function hash32(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

// Indeks deterministik dari tanggal: semua pengunjung di hari yang sama mendapat indeks yang sama.
export const pickIndex = (key, count, salt = 'kenangan') => (count > 0 ? hash32(`${salt}:${key}`) % count : -1)

// Tanggal "hari ini" untuk halaman. ?tanggal=YYYY-MM-DD hanya untuk mencoba tampilan hari lain
// (mis. hari ulang tahun) — tidak mengubah data apa pun.
export function todayFrom(search) {
  const p = new URLSearchParams(search || '')
  const t = p.get('tanggal')
  if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [y, m, d] = t.split('-').map(Number)
    const dt = new Date(y, m - 1, d, 12)
    if (dt.getMonth() === m - 1) return { now: dt, override: true }
  }
  return { now: new Date(), override: false }
}

export function eventsToday(now) {
  return JADWAL.filter((e) => hariIni(e.tanggal, now))
}

export function nextEvent(now) {
  return JADWAL.filter((e) => e.tanggal && !sudahLewat(e.tanggal, now) && !hariIni(e.tanggal, now))
    .sort((a, b) => (a.tanggal > b.tanggal ? 1 : -1))[0] || null
}

export function openVotes(now) {
  return VOTING.filter((v) => statusVote(v, now.getTime()) === 'buka')
    .sort((a, b) => new Date(a.selesai) - new Date(b.selesai))
}

// Foto kenangan hari ini: hitung jumlah foto, lalu ambil foto ke-(hash(tanggal) mod jumlah)
// dari urutan tetap (id). Dua request kecil, tidak memuat seluruh koleksi.
export async function memoryOfDay(now, { filter, salt } = {}) {
  const base = (q) => (filter ? filter(q.eq('type', 'photo')) : q.eq('type', 'photo'))
  const { count, error } = await base(sb.from('items').select('id', { count: 'exact', head: true }))
  if (error || !count) return null
  const i = pickIndex(dayKey(now), count, salt)
  const { data, error: e2 } = await selectPublic((cols) => base(sb.from('items').select(cols)).order('id', { ascending: true }).range(i, i))
  if (e2 || !data || !data[0]) return null
  return data[0]
}
