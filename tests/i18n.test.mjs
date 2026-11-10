// Tes kamus bahasa Inggris — jalankan: npm test
// - Setiap teks t('…') di app/ dan lib/ punya terjemahan di lib/i18n-en.js atau lib/i18n-en-data.js.
// - Isian {n}, {nama}, dst. tetap ada di terjemahan (termasuk nilai berbentuk fungsi).
// - Teks data (jadwal, voting, Tentang) yang dipanggil lewat variabel diperiksa terpisah di DYNAMIC.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-i18n-'))
const load = async (name) => {
  writeFileSync(join(dir, name + '.mjs'), readFileSync(join(root, 'lib', name + '.js'), 'utf8'))
  return import(pathToFileURL(join(dir, name + '.mjs')).href)
}
const { EN } = await load('i18n-en')
const { EN_DATA } = await load('i18n-en-data')
const ALL = { ...EN_DATA, ...EN }

function walk(d, out = []) {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.js$/.test(f)) out.push(p)
  }
  return out
}

// Teks yang diterjemahkan lewat variabel t(label), t(k), t(e.judul), dst. — bukan literal.
const DYNAMIC = [
  // navigasi
  'Beranda', 'Galeri', 'Favoritku', 'Jadwal', 'Voting', 'Tentang', 'Linimasa era', 'Koleksiku', 'Tebak member', 'Kredit foto',
  // urutan, jenis media, tag
  'Terbaru', 'Terlama', 'Acak', 'Semua', 'Foto', 'Video', 'Semua konsep', 'Panggung', 'MV', 'Fansign', 'Bandara', 'Di balik layar',
  // reaksi & laporan
  'Suka banget', 'Keren', 'Terharu', 'Tepuk tangan', 'Salah member', 'Gambar rusak / tidak muncul', 'Salah era', 'Lainnya',
  'Pilih alasan laporan.', 'Laporan gagal dikirim. Coba lagi nanti.',
  // profil
  'Debut', 'Agensi', 'Member', 'Fandom', 'Posisi', 'Ulang tahun', 'Asal', 'Era terbanyak di galeri', 'Koleksi di galeri',
  'Lahir di Vancouver, Kanada', 'Denpasar, Bali, Indonesia', 'Idol Indonesia pertama yang debut di SM Entertainment.', '24 Februari 2025 (The Chase)',
  // jenis rilisan, kredit
  'Single album debut', 'Single digital', 'Pre-release Focus', 'Mini album pertama', 'Mini album kedua', 'Single album',
  'Sumber resmi', 'Fansite & sumber lain',
  // pesan dari lib/
  'Link disalin ✓', 'Gagal menyalin link', 'Kode tidak dikenali — kode favorit diawali "H2H1-".', 'Kode rusak — pastikan tersalin utuh.',
  'Kode terpotong — pastikan tersalin utuh.', 'File bukan file favorit yang valid.', 'Kode tidak dikenali — kode koleksi diawali "H2HK1-".',
]

const literalKeys = () => {
  const keys = new Set()
  for (const p of [...walk(join(root, 'app')), ...walk(join(root, 'lib'))]) {
    const s = readFileSync(p, 'utf8')
    for (const m of s.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(m[1].replace(/\\'/g, "'"))
  }
  keys.delete('Teks Indonesia {n}') // contoh di komentar lib/i18n.js
  return [...keys]
}

test('semua teks t(\'…\') di kode punya terjemahan', () => {
  const missing = [...literalKeys(), ...DYNAMIC].filter((k) => !(k in ALL))
  assert.deepEqual(missing, [])
})

const holes = (s) => [...new Set(s.match(/\{\w+\}/g) || [])].sort()

test('isian {…} dipertahankan di setiap terjemahan', () => {
  for (const [k, v] of Object.entries(ALL)) {
    const need = holes(k)
    if (typeof v === 'string') { assert.deepEqual(holes(v), need, k); continue }
    // fungsi: panggil dengan nilai contoh, hasil harus memuat semua nilai dan tanpa {…} sisa
    for (const n of [1, 2, 11]) {
      const vars = Object.fromEntries(need.map((h, i) => [h.slice(1, -1), h === '{nama}' || h === '{judul}' || h === '{tgl}' ? `X${i}` : n]))
      const out = v(vars)
      assert.equal(typeof out, 'string', k)
      assert.deepEqual(holes(out), [], `${k} → ${out}`)
      for (const val of Object.values(vars)) assert.ok(out.includes(String(val)), `${k} → ${out} (hilang ${val})`)
    }
  }
})

test('bentuk tunggal/jamak', () => {
  assert.equal(EN['{j} reaksi']({ j: 1 }), '1 reaction')
  assert.equal(EN['{j} reaksi']({ j: 3 }), '3 reactions')
  assert.equal(EN['{n} hari lagi']({ n: 1 }), 'in 1 day')
  assert.equal(EN['Anniversary debut ke-{n}']({ n: 2 }), '2nd debut anniversary')
  assert.equal(EN['Anniversary debut ke-{n}']({ n: 11 }), '11th debut anniversary')
})
