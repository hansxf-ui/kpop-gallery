// Daftar rilisan/era Hearts2Hearts — dipakai halaman Tentang dan Linimasa era.
// Sumber: daftar "Perjalanan rilisan" di halaman Tentang (data per September 2026) dan
// RIWAYAT_2026 di lib/jadwal.js. `tanggal` hanya diisi kalau tanggal lengkapnya tercatat di repo;
// kalau tidak, cukup label bulan/tahun dari halaman Tentang.
export const RELEASES = [
  { nama: 'The Chase', label: 'Feb 2025', tanggal: '2025-02-24', urut: '2025-02', jenis: 'Single album debut' },
  { nama: 'Style', label: 'Jun 2025', tanggal: null, urut: '2025-06', jenis: 'Single digital' },
  { nama: 'Pretty Please', label: 'Sep 2025', tanggal: null, urut: '2025-09', jenis: 'Pre-release Focus' },
  { nama: 'Focus', label: 'Okt 2025', tanggal: null, urut: '2025-10', jenis: 'Mini album pertama' },
  { nama: 'RUDE!', label: 'Feb 2026', tanggal: '2026-02-20', urut: '2026-02', jenis: 'Single digital' },
  { nama: 'Lemon Tang', label: 'Jun 2026', tanggal: '2026-06-22', urut: '2026-06', jenis: 'Mini album kedua' },
  { nama: 'ICONIC HEART', label: 'Okt 2026', tanggal: '2026-10-05', urut: '2026-10', jenis: 'Single album' },
]

const norm = (s) => (s || '').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
// Nama era di item (diisi admin, bebas) → rilisan yang sama, mis. "focus" / "FOCUS era" tidak, "Focus" ya.
export const releaseOf = (era) => RELEASES.find((r) => norm(r.nama) === norm(era)) || null

export function formatRilis(r, lang = 'id') {
  const loc = lang === 'en' ? 'en-GB' : 'id-ID'
  if (!r.tanggal) {
    const [y, m] = r.urut.split('-').map(Number)
    // Label bulan-tahun dari halaman Tentang; kalau label hanya tahun, tampilkan tahunnya saja.
    return /^\d{4}$/.test(r.label) ? r.label : new Date(y, m - 1, 1).toLocaleDateString(loc, { month: 'short', year: 'numeric' })
  }
  const [y, m, d] = r.tanggal.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })
}

// Kelompokkan item galeri per era, urut sesuai linimasa rilisan.
// Era yang tidak ada di daftar rilisan ditaruh setelahnya (urut abjad); item tanpa era dihitung saja.
export function groupByEra(items) {
  const map = new Map()
  let tanpaEra = 0
  for (const it of items) {
    if (!it.era || !it.era.trim()) { tanpaEra++; continue }
    const r = releaseOf(it.era)
    const key = r ? r.nama : it.era.trim()
    if (!map.has(key)) map.set(key, { era: key, release: r, items: [] })
    map.get(key).items.push(it)
  }
  const groups = [...map.values()].sort((a, b) => {
    if (a.release && b.release) return a.release.urut.localeCompare(b.release.urut)
    if (a.release) return -1
    if (b.release) return 1
    return a.era.localeCompare(b.era)
  })
  return { groups, tanpaEra }
}

// Dua nama era dianggap sama tanpa peduli huruf besar/kecil, spasi, dan tanda baca.
export const sameEra = (a, b) => !!a && !!b && norm(a) === norm(b)

// Label bulan-tahun untuk daftar "Perjalanan rilisan" (halaman Tentang), ikut bahasa aktif.
export function labelRilis(r, lang = 'id') {
  if (lang !== 'en' || /^\d{4}$/.test(r.label)) return r.label
  const [y, m] = r.urut.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}
