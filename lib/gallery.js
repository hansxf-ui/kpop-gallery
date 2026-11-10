import { ytId } from './supabase'

// 8 member H2H — dipakai filter galeri, album idol, dan tautan nama di kartu.
export const MEMBERS = ['JIWOO', 'CARMEN', 'YUHA', 'STELLA', 'JUUN', 'A-NA', 'IAN', 'YE-ON']
// Kunci album yang sah di /idol/[name] (member + grup).
export const ALBUM_KEYS = [...MEMBERS, 'HEARTS2HEARTS']
// Nama tampilan untuk judul album (URL tetap memakai kunci UPPERCASE).
export const DISPLAY_NAME = {
  JIWOO: 'Jiwoo', CARMEN: 'Carmen', YUHA: 'Yuha', STELLA: 'Stella', JUUN: 'Juun',
  'A-NA': 'A-na', IAN: 'Ian', 'YE-ON': 'Ye-on', HEARTS2HEARTS: 'Hearts2Hearts',
}

// Pecah string idol item jadi nama member: "JUUN & CARMEN" / "CARMEN, YUHA" -> ['JUUN', 'CARMEN']
export const namesOf = (it) => (it.idol || '').toUpperCase().split(/[,&]/).map((s) => s.trim()).filter(Boolean)

// Nama di item yang punya album sendiri. Item unit "JUUN & CARMEN" -> ['JUUN', 'CARMEN'],
// jadi tautannya ke /idol/JUUN dan /idol/CARMEN (dulu ke /idol/JUUN%20%26%20CARMEN = "tidak ditemukan").
export const albumKeysOf = (it) => namesOf(it).filter((n) => ALBUM_KEYS.includes(n))

// Gambar kecil untuk grid/carousel: thumbnail YouTube atau URL foto/video aslinya.
export const thumbOf = (it) => (it.type === 'youtube' ? `https://img.youtube.com/vi/${ytId(it.url)}/mqdefault.jpg` : it.url)

// Cocokkan pencarian ke judul, nama idol, grup, dan era. Aman untuk kolom kosong (null).
export function matchesQuery(it, q) {
  const s = q.trim().toLowerCase()
  if (!s) return true
  return [it.title, it.idol, it.group_name, it.era].some((v) => (v || '').toLowerCase().includes(s))
}

// Urutan "Acak" yang stabil: tiap item dapat peringkat dari hash(seed + id).
// Urutan baru hanya saat pengunjung memilih "Acak" lagi — mengetik di pencarian atau
// mengganti filter tidak mengocok ulang, dan sebarannya merata (bukan sort(() => random - 0.5)).
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
export function shuffleStable(list, seed) {
  return list
    .map((it) => [hash(`${seed}:${it.id}`), it])
    .sort((a, b) => a[0] - b[0])
    .map(([, it]) => it)
}
export const newSeed = () => Math.floor(Math.random() * 1e9)
