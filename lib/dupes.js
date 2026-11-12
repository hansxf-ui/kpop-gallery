// Deteksi foto ganda di admin (sebelum upload) dan pencarian foto ganda di koleksi.
//
// Memakai "dHash" (difference hash) 64-bit: gambar diperkecil jadi 9×8 abu-abu, lalu tiap bit
// = apakah piksel lebih terang dari tetangga kanannya. Hasilnya hampir sama walau foto
// diperkecil, dikompres ulang, atau diunggah dari sumber lain — beda dengan hash file biasa
// yang langsung berubah kalau satu byte saja beda. Disimpan di kolom items.phash (migrasi 14)
// sebagai 16 karakter hex.
//
// "Mirip" = selisih bit (jarak Hamming) ≤ SIMILAR_MAX. Foto beruntun dari satu sesi bisa ikut
// terdeteksi mirip, jadi admin selalu diberi peringatan + pilihan, tidak pernah diblokir.

export const SIMILAR_MAX = 5
const HASH_RE = /^[0-9a-f]{16}$/

// gray: 72 nilai kecerahan (9 kolom × 8 baris, baris demi baris) → hex 16 karakter.
export function dhashFromGray(gray) {
  if (!gray || gray.length !== 72) throw new Error('butuh 9×8 piksel')
  let hex = ''
  for (let y = 0; y < 8; y++) {
    let byte = 0
    for (let x = 0; x < 8; x++) byte = (byte << 1) | (gray[y * 9 + x] > gray[y * 9 + x + 1] ? 1 : 0)
    hex += byte.toString(16).padStart(2, '0')
  }
  return hex
}

// RGBA (mis. dari canvas getImageData) berukuran w×h → 9×8 abu-abu dengan rata-rata kotak.
// Dipisah dari kanvas supaya hasil sama di semua browser (penghalusan drawImage berbeda-beda).
export function grayFromRgba(rgba, w, h) {
  const out = new Array(72).fill(0)
  const cnt = new Array(72).fill(0)
  for (let y = 0; y < h; y++) {
    const gy = Math.min(7, Math.floor((y * 8) / h))
    for (let x = 0; x < w; x++) {
      const gx = Math.min(8, Math.floor((x * 9) / w))
      const i = (y * w + x) * 4
      out[gy * 9 + gx] += 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]
      cnt[gy * 9 + gx]++
    }
  }
  return out.map((v, i) => (cnt[i] ? v / cnt[i] : 0))
}

const POP = new Uint8Array(256).map((_, i) => { let c = 0; for (let n = i; n; n >>= 1) c += n & 1; return c })

export const isHash = (h) => typeof h === 'string' && HASH_RE.test(h)

// Jarak Hamming dua hash hex (0 = identik, 64 = berlawanan). Hash tidak valid → Infinity.
export function hamming(a, b) {
  if (!isHash(a) || !isHash(b)) return Infinity
  let d = 0
  for (let i = 0; i < 16; i += 2) d += POP[parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16)]
  return d
}

// Item yang mirip dengan `hash`, terdekat dulu. items: baris dengan kolom phash.
export function findSimilar(hash, items, max = SIMILAR_MAX) {
  if (!isHash(hash)) return []
  const out = []
  for (const it of items) {
    const dist = hamming(hash, it.phash)
    if (dist <= max) out.push({ item: it, dist })
  }
  return out.sort((a, b) => a.dist - b.dist)
}

// Semua pasangan foto mirip di koleksi. Hash diubah ke dua bilangan 32-bit supaya ribuan foto
// tetap cepat (5.000 foto ≈ 12,5 juta perbandingan, di bawah satu detik).
export function similarPairs(items, max = SIMILAR_MAX) {
  const rows = items.filter((it) => isHash(it.phash)).map((it) => [it, parseInt(it.phash.slice(0, 8), 16) >>> 0, parseInt(it.phash.slice(8), 16) >>> 0])
  const pc = (n) => POP[n & 255] + POP[(n >>> 8) & 255] + POP[(n >>> 16) & 255] + POP[n >>> 24]
  const pairs = []
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const d = pc((rows[i][1] ^ rows[j][1]) >>> 0) + pc((rows[i][2] ^ rows[j][2]) >>> 0)
      if (d <= max) pairs.push({ a: rows[i][0], b: rows[j][0], dist: d })
    }
  }
  return pairs.sort((x, y) => x.dist - y.dist)
}

// Link YouTube yang sudah ada di galeri, dan duplikat di dalam daftar yang ditempel sendiri.
// ytIdOf diberikan dari luar (lib/supabase.js) supaya file ini tanpa impor dan mudah dites.
export function splitYoutubeDupes(links, items, ytIdOf) {
  const known = new Set(items.filter((it) => it.type === 'youtube').map((it) => ytIdOf(it.url)).filter(Boolean))
  const seen = new Set()
  const fresh = [], dupes = []
  for (const link of links) {
    const id = ytIdOf(link)
    if (!id) continue
    if (known.has(id) || seen.has(id)) dupes.push(link)
    else { seen.add(id); fresh.push(link) }
  }
  return { fresh, dupes }
}

// ---------- Browser ----------
// Hash dari File/Blob gambar. Diperkecil dulu ke 72×64 lewat kanvas, lalu dirata-rata ke 9×8.
export async function dhashOfBlob(blob) {
  const bmp = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 72
    canvas.height = 64
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bmp, 0, 0, 72, 64)
    return dhashFromGray(grayFromRgba(ctx.getImageData(0, 0, 72, 64).data, 72, 64))
  } finally {
    bmp.close()
  }
}

// Hash foto yang sudah ada di storage (untuk foto lama). Versi kecil dari endpoint render dulu,
// kalau gagal pakai file aslinya.
export async function dhashOfUrl(urls) {
  let lastErr
  for (const u of urls) {
    try {
      const res = await fetch(u, { mode: 'cors' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await dhashOfBlob(await res.blob())
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('gagal')
}
