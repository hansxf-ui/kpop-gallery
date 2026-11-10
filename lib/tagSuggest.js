// Fitur 4: pencarian per warna/konsep + saran tag otomatis untuk admin.

// ---------- Saran tag dari judul ----------
// Kata kunci → tag. Dicocokkan per kata utuh (tanpa peduli huruf besar/kecil), jadi "BTS" (nama grup
// yang memang muncul di data) TIDAK dianggap "behind the scenes". Ini hanya SARAN — admin tetap yang
// menekan simpan.
const RULES = [
  ['stage', ['stage', 'panggung', 'live', 'konser', 'concert', 'festival', 'performance', 'penampilan', 'encore',
    'music bank', 'inkigayo', 'm countdown', 'show champion', 'the show', 'music core', 'show! music core', 'fancam', 'focus cam', 'facecam']],
  ['mv', ['mv', 'm/v', 'music video', 'teaser', 'video musik']],
  ['fansign', ['fansign', 'fan sign', 'fansa', 'video call', 'videocall', 'fan call']],
  ['airport', ['airport', 'bandara', 'incheon', 'gimpo', 'departure', 'arrival', 'keberangkatan', 'kedatangan']],
  ['behind', ['behind', 'behind the scene', 'behind the scenes', 'di balik layar', 'making', 'making film', 'backstage', 'vlog', 'h2h log']],
]
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const COMPILED = RULES.map(([tag, words]) => [tag, new RegExp(`(^|[^\\p{L}\\p{N}])(${words.map(esc).join('|')})(?=$|[^\\p{L}\\p{N}])`, 'iu')])

export function suggestTags(text, current = []) {
  const s = String(text || '')
  if (!s.trim()) return []
  return COMPILED.filter(([tag, re]) => !current.includes(tag) && re.test(s)).map(([tag]) => tag)
}

// ---------- Pencarian warna ----------
// Warna yang dicari di judul/keterangan. Mengetik salah satu sinonim mencari semuanya.
export const COLORS = [
  ['merah', ['merah', 'red']],
  ['pink', ['pink', 'merah muda', 'magenta']],
  ['ungu', ['ungu', 'purple', 'violet', 'lilac', 'lavender']],
  ['biru', ['biru', 'blue', 'navy']],
  ['hijau', ['hijau', 'green', 'mint']],
  ['kuning', ['kuning', 'yellow', 'lemon']],
  ['oranye', ['oranye', 'orange', 'jingga']],
  ['cokelat', ['cokelat', 'coklat', 'brown']],
  ['hitam', ['hitam', 'black']],
  ['putih', ['putih', 'white']],
  ['abu-abu', ['abu-abu', 'abu', 'gray', 'grey']],
  ['emas', ['emas', 'gold', 'golden']],
  ['perak', ['perak', 'silver']],
]
const colorRe = new Map(COLORS.map(([k, ws]) => [k, new RegExp(`(^|[^\\p{L}])(${ws.map(esc).join('|')})(?=$|[^\\p{L}])`, 'iu')]))

// Sinonim warna untuk kata yang diketik ('purple' → semua kata ungu), atau null kalau bukan warna.
export function colorKeyOf(q) {
  const s = String(q || '').trim().toLowerCase()
  if (!s) return null
  const hit = COLORS.find(([, ws]) => ws.includes(s))
  return hit ? hit[0] : null
}
export const hasColor = (text, key) => !!key && colorRe.get(key).test(String(text || ''))

// Chip warna hanya untuk warna yang memang muncul di koleksi (tidak menampilkan pilihan kosong).
export function colorsInItems(items) {
  return COLORS.map(([k]) => k).filter((k) => items.some((it) => hasColor(`${it.title || ''} ${it.alt_text || ''}`, k)))
}
