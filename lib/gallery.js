import { ytId } from './supabase'
import { colorKeyOf, hasColor } from './tagSuggest'

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

// Bakuan bentuk idol saat admin menyimpan: bila semua nama di dalamnya member H2H (solo/unit, pisah
// koma/&), tulis UPPERCASE disambung ' & ' — mencegah varian Title Case yang lolos dari query album.
// Nilai lain (mis. 'Hearts2Hearts') dikembalikan apa adanya.
export function canonIdol(v) {
  const raw = (v || '').trim()
  if (!raw) return raw
  const parts = raw.split(/[,&]/).map((s) => s.trim().toUpperCase()).filter(Boolean)
  if (parts.length && parts.every((p) => MEMBERS.includes(p))) return parts.join(' & ')
  return raw
}

// Gambar kecil untuk grid/carousel: thumbnail YouTube atau URL foto/video aslinya.
export const thumbOf = (it) => (it.type === 'youtube' ? `https://img.youtube.com/vi/${ytId(it.url)}/mqdefault.jpg` : it.url)

// Cocokkan pencarian ke judul, nama idol, grup, dan era. Aman untuk kolom kosong (null).
export function matchesQuery(it, q) {
  const s = q.trim().toLowerCase().replace(/^#/, '')
  if (!s) return true
  // Fitur 4 — warna: "ungu"/"purple" mencari semua sinonim warna itu di judul & teks alternatif.
  const warna = colorKeyOf(s)
  if (warna) return hasColor(`${it.title || ''} ${it.alt_text || ''}`, warna)
  // credit ikut dicari supaya tautan "Lihat fotonya" di halaman Kredit bekerja.
  if ([it.title, it.idol, it.group_name, it.era, it.credit, it.alt_text].some((v) => (v || '').toLowerCase().includes(s))) return true
  // Fitur 4 — konsep: "stage", "panggung", "#mv", "bandara" mencocokkan tag item.
  return s.length >= 2 && tagsOf(it).some((k) => (TAG_ALIASES[k] || []).some((a) => a.includes(s)))
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

// Tag konsep/acara (fitur 4, migrasi 06). Nilai di database = kunci; label tampil bahasa Indonesia.
export const TAGS = [
  ['stage', 'Panggung'],
  ['mv', 'MV'],
  ['fansign', 'Fansign'],
  ['airport', 'Bandara'],
  ['behind', 'Di balik layar'],
]
export const TAG_KEYS = TAGS.map(([k]) => k)
// Kata pencarian per tag (ID + EN) — supaya mengetik "panggung" atau "stage" sama-sama menemukan tag stage.
export const TAG_ALIASES = {
  stage: ['stage', 'panggung'],
  mv: ['mv', 'music video'],
  fansign: ['fansign', 'fan sign'],
  airport: ['airport', 'bandara'],
  behind: ['behind the scenes', 'di balik layar', 'behind'],
}
export const tagLabel = (k) => (TAGS.find(([x]) => x === k) || [k, k])[1]
export const tagsOf = (it) => (Array.isArray(it.tags) ? it.tags.filter((t) => TAG_KEYS.includes(t)) : [])

// Teks alternatif gambar (fitur 14): alt_text dari admin kalau diisi, kalau kosong judul, lalu nama idol.
export const altOf = (it) => (it && ((it.alt_text && it.alt_text.trim()) || it.title || it.idol)) || 'Foto Hearts2Hearts'
