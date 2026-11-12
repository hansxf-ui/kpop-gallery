import { creditOf } from './supabase'

// Kredit foto (fitur 14, seksi di halaman Tentang): kelompokkan item per sumber dari kolom `credit` ("📷 …").
//
// Penggolongan "Sumber resmi" HANYA berdasarkan kata kunci di teks kredit (daftar di bawah).
// Sumber yang tidak cocok masuk "Fansite & sumber lain" — bukan klaim bahwa itu pasti fansite.
const OFFICIAL = [/\bsm\s*entertainment\b/i, /\bsmtown\b/i, /\bofficial\b/i, /\bresmi\b/i, /@hearts2hearts\b/i, /\bhearts2hearts\.jp\b/i]

export const cleanCredit = (s) => String(s || '').replace(/^\s*📷\s*/u, '').replace(/\s+/g, ' ').trim()
export const isOfficial = (name) => OFFICIAL.some((re) => re.test(name))

// Tautan hanya kalau teks kredit memang memuat URL https lengkap. Handle "@nama" tanpa URL
// tidak dijadikan tautan (platformnya tidak diketahui — jangan ditebak).
export function creditLink(name) {
  const m = name.match(/https:\/\/[^\s<>"')]+/i)
  if (!m) return null
  try { return new URL(m[0]).toString() } catch { return null }
}

export function groupCredits(items) {
  const map = new Map()
  for (const it of items) {
    const name = cleanCredit(creditOf(it))
    if (!name) continue
    const key = name.toLowerCase()
    if (!map.has(key)) map.set(key, { name, items: [], official: isOfficial(name), link: creditLink(name) })
    map.get(key).items.push(it)
  }
  const list = [...map.values()].sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name))
  return { official: list.filter((g) => g.official), others: list.filter((g) => !g.official) }
}
