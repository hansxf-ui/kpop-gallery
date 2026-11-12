// Tes alat admin: ZIP cadangan, rencana pemulihan, ubah massal, filter, deteksi foto ganda.
// Jalankan: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-admin-'))
const load = async (name) => {
  writeFileSync(join(dir, name + '.mjs'), readFileSync(join(root, 'lib', name + '.js'), 'utf8'))
  return import(pathToFileURL(join(dir, name + '.mjs')).href)
}
const Z = await load('zip')
const A = await load('adminTools')
const D = await load('dupes')

// ---------- ZIP ----------
test('crc32 sesuai nilai baku', () => {
  assert.equal(Z.crc32(new TextEncoder().encode('123456789')), 0xcbf43926)
  assert.equal(Z.crc32(new Uint8Array()), 0)
})

test('ZIP: tulis lalu baca kembali (nama UTF-8, isi biner)', async () => {
  const w = new Z.ZipWriter()
  const bin = new Uint8Array(5000).map((_, i) => (i * 7) & 255)
  w.add('items.json', '[{"id":"a"}]')
  w.add('files/1700-ab-Carmen_💗.jpg', bin)
  const files = await Z.readZip(w.blob())
  assert.deepEqual([...files.keys()], ['items.json', 'files/1700-ab-Carmen_💗.jpg'])
  assert.equal(new TextDecoder().decode(await files.get('items.json').read()), '[{"id":"a"}]')
  assert.deepEqual(await files.get('files/1700-ab-Carmen_💗.jpg').read(), bin)
  assert.equal(files.get('files/1700-ab-Carmen_💗.jpg').size, 5000)
})

test('ZIP: perkiraan ukuran sama dengan ukuran file jadi', () => {
  const w = new Z.ZipWriter()
  w.add('a.txt', 'abc')
  const expect = w.sizeWith('b.bin', 10)
  w.add('b.bin', new Uint8Array(10))
  assert.equal(w.blob().size, expect)
})

// Dibuat dengan zipfile Python (ZIP_DEFLATED) — meniru ZIP yang dibungkus ulang oleh komputer.
const DEFLATED = 'UEsDBBQAAAAIACiTa130xxJmHQAAAB0AAAAKAAAAaXRlbXMuanNvbouuVspMUbJSqlDSUSqpLEgFMivzS0tKk1KVamMBUEsDBBQAAAAIACiTa13dpZYFCgAAACcAAAALAAAAZmlsZXMvYS50eHTLSMzJV8ggSAAAUEsDBBQAAAAIACiTa10AAAAAAgAAAAAAAAAHAAAAZm9sZGVyLwMAUEsBAhQDFAAAAAgAKJNrXfTHEmYdAAAAHQAAAAoAAAAAAAAAAAAAAKSBAAAAAGl0ZW1zLmpzb25QSwECFAMUAAAACAAok2td3aWWBQoAAAAnAAAACwAAAAAAAAAAAAAApIFFAAAAZmlsZXMvYS50eHRQSwECFAMUAAAACAAok2tdAAAAAAIAAAAAAAAABwAAAAAAAAAAABAA/UF4AAAAZm9sZGVyL1BLBQYAAAAAAwADAKYAAACfAAAAAAA='

test('ZIP: membaca isi terkompresi (deflate), folder dilewati', async () => {
  const files = await Z.readZip(new Blob([Buffer.from(DEFLATED, 'base64')]))
  assert.deepEqual([...files.keys()], ['items.json', 'files/a.txt'])
  assert.equal(new TextDecoder().decode(await files.get('files/a.txt').read()), 'halo halo halo halo halo halo halo halo')
  assert.deepEqual(A.parseBackupRows(new TextDecoder().decode(await files.get('items.json').read())), [{ id: 'x', type: 'youtube' }])
})

test('ZIP: file bukan ZIP ditolak', async () => {
  await assert.rejects(Z.readZip(new Blob(['bukan zip sama sekali'])), /Bukan file ZIP/)
})

// ---------- Pemulihan ----------
test('parseBackupRows: format ekspor lama (array) dan objek { items }', () => {
  const rows = [{ id: 'a', type: 'photo', path: 'p.jpg' }, { id: 'b', type: 'youtube' }]
  assert.deepEqual(A.parseBackupRows(JSON.stringify(rows)), rows)
  assert.deepEqual(A.parseBackupRows(JSON.stringify({ items: rows })), rows)
  assert.deepEqual(A.parseBackupRows('[]'), [])
  assert.throws(() => A.parseBackupRows('{"favorit":[]}'), /bukan daftar/)
  assert.throws(() => A.parseBackupRows('[{"x":1}]'), /tidak ada item/)
  assert.throws(() => A.parseBackupRows('{'), /bukan JSON/)
})

test('planRestore: item yang sudah ada tidak disentuh, file ada → unggah ulang', () => {
  const rows = [
    { id: 'ada', type: 'photo', path: 'a.jpg' },
    { id: 'baru', type: 'photo', path: 'b.jpg' },
    { id: 'tanpa-file', type: 'photo', path: 'c.jpg' },
    { id: 'yt', type: 'youtube', url: 'https://youtu.be/abcdefghijk' },
    { id: 'baru', type: 'photo', path: 'b.jpg' }, // ganda di file cadangan
  ]
  const has = (path) => path === 'b.jpg' || path === 'a.jpg'
  const p = A.planRestore(rows, new Set(['ada']), has, true)
  assert.deepEqual(p.skip.map((r) => r.id), ['ada', 'baru'])
  assert.deepEqual(p.upload.map((r) => r.id), ['baru'])
  assert.deepEqual(p.link.map((r) => r.id), ['yt'])
  assert.deepEqual(p.missing.map((r) => r.id), ['tanpa-file']) // file di bagian ZIP lain → jangan sisipkan link mati
  // Dari .json saja (proyek yang sama, file storage masih ada): semua baris baru disisipkan apa adanya.
  const j = A.planRestore(rows, new Set(['ada']), () => false, false)
  assert.deepEqual(j.link.map((r) => r.id), ['baru', 'tanpa-file', 'yt'])
  assert.deepEqual(j.missing, [])
})

test('restoreRow: kolom generated dibuang, URL diganti', () => {
  const r = { id: 'a', type: 'photo', url: 'lama', credit: '📷 x', note: '📷 x' }
  assert.deepEqual(A.restoreRow(r, 'baru'), { id: 'a', type: 'photo', url: 'baru', note: '📷 x' })
  assert.equal(A.restoreRow(r).url, 'lama')
  assert.equal(r.credit, '📷 x') // baris asli tidak diubah
})

test('missingColumnOf membaca nama kolom dari error PostgREST/Postgres', () => {
  assert.equal(A.missingColumnOf({ code: 'PGRST204', message: "Could not find the 'phash' column of 'items' in the schema cache" }), 'phash')
  assert.equal(A.missingColumnOf({ code: '42703', message: 'column "tags" of relation "items" does not exist' }), 'tags')
  assert.equal(A.missingColumnOf({ message: 'lain' }), null)
  assert.equal(A.missingColumnOf(null), null)
})

test('contentTypeOf', () => {
  assert.equal(A.contentTypeOf('x/Foto.JPG'), 'image/jpeg')
  assert.equal(A.contentTypeOf('v.mp4'), 'video/mp4')
  assert.equal(A.contentTypeOf('tanpa-ekstensi'), 'application/octet-stream')
})

// ---------- Ubah massal ----------
test('groupTagUpdates: satu query per hasil tag, item yang tidak berubah dilewati', () => {
  const items = [
    { id: '1', tags: ['mv'] },
    { id: '2', tags: [] },
    { id: '3', tags: null },
    { id: '4', tags: ['panggung'] },
  ]
  assert.deepEqual(A.groupTagUpdates(items, 'mv', true), [
    { tags: ['mv'], ids: ['2', '3'] },
    { tags: ['panggung', 'mv'], ids: ['4'] },
  ])
  assert.deepEqual(A.groupTagUpdates(items, 'mv', false), [{ tags: [], ids: ['1'] }])
  assert.deepEqual(A.groupTagUpdates(items, 'fansign', false), [])
})

test('chunk', () => {
  assert.deepEqual(A.chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  assert.deepEqual(A.chunk([], 2), [])
})

test('filterAdminItems: cari, member, jenis, era kosong, tanpa tag', () => {
  const namesOf = (it) => (it.idol || '').toUpperCase().split(/[,&]/).map((s) => s.trim()).filter(Boolean)
  const items = [
    { id: '1', idol: 'CARMEN', type: 'photo', era: 'Focus', tags: ['mv'], title: 'Teaser' },
    { id: '2', idol: 'JUUN & CARMEN', type: 'youtube', era: '', tags: [], note: 'fancam bagus' },
    { id: '3', idol: 'YUHA', type: 'photo', era: null, title: 'Bandara' },
  ]
  const ids = (f) => A.filterAdminItems(items, { q: '', idol: '', type: '', era: '', tag: '', ...f }, namesOf).map((x) => x.id)
  assert.deepEqual(ids({}), ['1', '2', '3'])
  assert.deepEqual(ids({ idol: 'CARMEN' }), ['1', '2'])
  assert.deepEqual(ids({ type: 'photo' }), ['1', '3'])
  assert.deepEqual(ids({ era: '-' }), ['2', '3'])
  assert.deepEqual(ids({ era: 'Focus' }), ['1'])
  assert.deepEqual(ids({ tag: '-' }), ['2', '3'])
  assert.deepEqual(ids({ tag: 'mv' }), ['1'])
  assert.deepEqual(ids({ q: 'FANCAM' }), ['2'])
  assert.deepEqual(ids({ q: 'mv' }), ['1']) // tag ikut dicari
})

// ---------- Foto ganda ----------
const gradient = (f) => Array.from({ length: 72 }, (_, i) => f(i % 9, Math.floor(i / 9)))

test('dHash: gambar sama → hash sama; versi lebih terang tetap identik', () => {
  const g = gradient((x, y) => (x * 37 + y * 11) % 200)
  const h = D.dhashFromGray(g)
  assert.match(h, /^[0-9a-f]{16}$/)
  assert.equal(D.dhashFromGray(g.map((v) => v + 30)), h)
  assert.equal(D.hamming(h, h), 0)
})

test('hamming & isHash', () => {
  assert.equal(D.hamming('0000000000000000', 'ffffffffffffffff'), 64)
  assert.equal(D.hamming('0000000000000000', '0000000000000003'), 2)
  assert.equal(D.hamming('0000000000000000', null), Infinity)
  assert.equal(D.isHash('ABCDEF0123456789'), false) // huruf besar tidak dipakai
})

test('grayFromRgba merata-rata kotak ke 9×8', () => {
  const w = 18, h = 16
  const rgba = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; rgba[i] = rgba[i + 1] = rgba[i + 2] = x < 9 ? 200 : 0; rgba[i + 3] = 255 }
  const g = D.grayFromRgba(rgba, w, h)
  assert.equal(g.length, 72)
  assert.ok(Math.abs(g[0] - 200) < 0.01)
  assert.ok(Math.abs(g[8]) < 0.01)
})

test('findSimilar & similarPairs: terdekat dulu, batas SIMILAR_MAX', () => {
  const items = [
    { id: 'a', phash: '0000000000000000' },
    { id: 'b', phash: '0000000000000001' }, // beda 1
    { id: 'c', phash: '000000000000001f' }, // beda 5 dari a
    { id: 'd', phash: 'ffffffffffffffff' },
    { id: 'e', phash: null },
  ]
  assert.deepEqual(D.findSimilar('0000000000000000', items).map((x) => [x.item.id, x.dist]), [['a', 0], ['b', 1], ['c', 5]])
  assert.deepEqual(D.findSimilar('bukan-hash', items), [])
  assert.deepEqual(D.similarPairs(items).map((p) => [p.a.id, p.b.id, p.dist]), [['a', 'b', 1], ['b', 'c', 4], ['a', 'c', 5]])
})

test('splitYoutubeDupes: link yang sudah ada & ganda di daftar sendiri', () => {
  const ytId = (u) => ((u || '').match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/) || [])[1]
  const items = [{ type: 'youtube', url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA' }, { type: 'photo', url: 'x' }]
  const r = D.splitYoutubeDupes(['https://youtu.be/AAAAAAAAAAA', 'https://youtu.be/BBBBBBBBBBB', 'https://youtube.com/shorts/BBBBBBBBBBB', 'bukan link'], items, ytId)
  assert.deepEqual(r.fresh, ['https://youtu.be/BBBBBBBBBBB'])
  assert.deepEqual(r.dupes, ['https://youtu.be/AAAAAAAAAAA', 'https://youtube.com/shorts/BBBBBBBBBBB'])
})
