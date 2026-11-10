import { MEMBERS, DISPLAY_NAME, namesOf } from './gallery'
import { releaseOf } from './eras'

// Kuis "Tebak member" (fitur 11). Soal hanya dari FOTO SOLO (satu nama member di kolom idol),
// supaya jawabannya pasti satu orang.
export const ROUND = 10

// Kunci file foto: URL tanpa query/hash, dan endpoint render Supabase disamakan dengan URL objek.
// Dua item berbeda bisa menunjuk file yang sama (upload ganda) — keduanya dapat kunci yang sama.
export function fileKey(url) {
  const raw = String(url || '').trim()
  try {
    const u = new URL(raw)
    return (u.host.toLowerCase() + u.pathname.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/')).replace(/\/+$/, '')
  } catch {
    return raw.split(/[?#]/)[0]
  }
}

// Satu file hanya masuk pool sekali (item pertama yang dipertahankan). Dulu dedup hanya per item,
// jadi foto yang di-upload dua kali bisa muncul dua kali dalam satu ronde.
export function quizPool(items) {
  const seen = new Set()
  return items.filter((it) => {
    if (it.type !== 'photo' || namesOf(it).length !== 1 || !MEMBERS.includes(namesOf(it)[0])) return false
    const k = fileKey(it.url)
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function shuffle(arr, rnd) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Satu ronde: n soal dari foto berbeda, tiap soal 4 pilihan (1 benar + 3 member lain, diacak).
// Dedup per file diulang di sini supaya ronde tetap aman walau dipanggil dengan pool mentah.
// prefer/preferCount (fitur 5, mode fokus member): ambil sampai preferCount soal dari item yang
// cocok prefer(it) dulu, sisanya dari pool lain; urutan soal tetap diacak.
export function pickUnique(pool, n, rnd = Math.random, { prefer, preferCount = 0 } = {}) {
  const seen = new Set()
  const unik = shuffle(pool, rnd).filter((it) => {
    const k = fileKey(it.url)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  if (!prefer || preferCount <= 0) return unik.slice(0, n)
  const fav = unik.filter(prefer).slice(0, Math.min(preferCount, n))
  const rest = unik.filter((it) => !fav.includes(it)).slice(0, n - fav.length)
  return shuffle([...fav, ...rest], rnd)
}

export function makeRound(pool, n = ROUND, rnd = Math.random, opts = {}) {
  return pickUnique(pool, n, rnd, opts).map((it) => {
    const answer = namesOf(it)[0]
    const others = shuffle(MEMBERS.filter((m) => m !== answer), rnd).slice(0, 3)
    return { it, answer, options: shuffle([answer, ...others], rnd) }
  })
}

export const nameOf = (key) => DISPLAY_NAME[key] || key

// ---------- Fitur 11: mode lanjutan ----------
export const MODES = ['member', 'era', 'crop']

// Mode "Tebak era": foto apa pun (solo/unit/grup) yang era-nya cocok dengan daftar rilisan.
// Satu file hanya sekali, sama seperti mode biasa.
export function eraPool(items) {
  const seen = new Set()
  return items.filter((it) => {
    if (it.type !== 'photo' || !releaseOf(it.era)) return false
    const k = fileKey(it.url)
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })
}
export const eraOf = (it) => releaseOf(it.era)?.nama || null
export const erasIn = (pool) => [...new Set(pool.map(eraOf).filter(Boolean))]

// Butuh minimal 2 era berbeda; pilihan = jawaban + sampai 3 era lain yang ada di koleksi.
export function makeEraRound(pool, n = ROUND, rnd = Math.random, opts = {}) {
  const all = erasIn(pool)
  if (all.length < 2) return []
  return pickUnique(pool, n, rnd, opts).map((it) => {
    const answer = eraOf(it)
    const others = shuffle(all.filter((e) => e !== answer), rnd).slice(0, 3)
    return { it, answer, options: shuffle([answer, ...others], rnd) }
  })
}

// Mode "Foto potongan": soal sama dengan mode biasa, tapi foto diperbesar 2,6× pada titik acak
// (wajah/rambut/pakaian), lalu ditampilkan utuh setelah menjawab.
export function makeCropRound(pool, n = ROUND, rnd = Math.random, opts = {}) {
  return makeRound(pool, n, rnd, opts).map((q) => ({
    ...q, crop: { zoom: 2.6, x: Math.round(20 + rnd() * 60), y: Math.round(12 + rnd() * 50) },
  }))
}

// Skor terbaik per mode. Mode biasa tetap memakai kunci lama (skor lama tidak hilang).
const bestKey = (mode = 'member') => (mode === 'member' ? 'h2h-quiz-best' : `h2h-quiz-best-${mode}`)
export const getBest = (mode) => { try { return Number(localStorage.getItem(bestKey(mode))) || 0 } catch { return 0 } }
export function saveBest(score, mode) {
  const best = Math.max(getBest(mode), score)
  try { localStorage.setItem(bestKey(mode), String(best)) } catch {}
  return best
}
