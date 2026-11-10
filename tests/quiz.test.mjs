// Tes logika kuis "Tebak member" — jalankan: npm test  (atau: node --test tests/*.test.mjs)
// Memakai node:test bawaan Node (tanpa paket tambahan).
//
// File di lib/ memakai sintaks ESM di berkas .js tanpa "type": "module", jadi Node membacanya
// sebagai CommonJS. Tes ini menyalin modul yang dibutuhkan ke folder sementara sebagai .mjs,
// mengganti modul Supabase dengan versi tiruan, lalu mengimpornya.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-quiz-'))
writeFileSync(join(dir, 'supabase.mjs'), "export const ytId = () => 'x'\nexport const imgOpt = (u) => u\n")
writeFileSync(join(dir, 'tagSuggest.mjs'), readFileSync(join(root, 'lib/tagSuggest.js'), 'utf8'))
writeFileSync(join(dir, 'gallery.mjs'), readFileSync(join(root, 'lib/gallery.js'), 'utf8').replace("from './supabase'", "from './supabase.mjs'").replace("from './tagSuggest'", "from './tagSuggest.mjs'"))
writeFileSync(join(dir, 'quiz.mjs'), readFileSync(join(root, 'lib/quiz.js'), 'utf8').replace("from './gallery'", "from './gallery.mjs'"))
const { quizPool, makeRound, fileKey, pickUnique } = await import(pathToFileURL(join(dir, 'quiz.mjs')).href)

const B = 'https://x.supabase.co/storage/v1/object/public/gallery/'
const MEMBERS = ['JIWOO', 'CARMEN', 'YUHA', 'STELLA', 'JUUN', 'A-NA', 'IAN', 'YE-ON']
const solo = MEMBERS.flatMap((m) => [0, 1].map((k) => ({ id: `${m}${k}`, idol: m, type: 'photo', url: `${B}${m}-${k}.jpg` })))

test('pool hanya berisi foto solo member', () => {
  const pool = quizPool([
    ...solo,
    { id: 'u', idol: 'JUUN & CARMEN', type: 'photo', url: B + 'u.jpg' },
    { id: 'g', idol: 'Hearts2Hearts', type: 'photo', url: B + 'g.jpg' },
    { id: 'v', idol: 'IAN', type: 'video', url: B + 'v.mp4' },
  ])
  assert.equal(pool.length, 16)
})

test('ronde: 10 soal, 4 pilihan unik termasuk jawaban', () => {
  const r = makeRound(quizPool(solo))
  assert.equal(r.length, 10)
  assert.equal(new Set(r.map((q) => q.it.id)).size, 10)
  for (const q of r) {
    assert.equal(q.options.length, 4)
    assert.equal(new Set(q.options).size, 4)
    assert.ok(q.options.includes(q.answer))
    assert.equal(q.answer, q.it.idol)
  }
})

// Bug yang ditemukan di situs live: dua item berbeda memakai file yang sama (upload ganda),
// lalu foto yang sama muncul di soal 5 dan soal 9.
const dupItems = [
  { id: 'a1', idol: 'JUUN', type: 'photo', url: B + 'iconic-3.jpg' },
  { id: 'a2', idol: 'JUUN', type: 'photo', url: B + 'iconic-3.jpg' },
  { id: 'a3', idol: 'JUUN', type: 'photo', url: B + 'iconic-3.jpg?t=1' },
  { id: 'a4', idol: 'JUUN', type: 'photo', url: B.replace('/object/public/', '/render/image/public/') + 'iconic-3.jpg?width=800' },
  ...MEMBERS.map((m, i) => ({ id: 'b' + i, idol: m, type: 'photo', url: `${B}b${i}.jpg` })),
]

test('pool: item dengan URL file sama hanya masuk sekali', () => {
  const pool = quizPool(dupItems)
  assert.equal(pool.filter((it) => it.url.includes('iconic-3')).length, 1)
  assert.equal(pool[0].id, 'a1')
  assert.equal(pool.length, 9)
})

test('ronde tidak pernah berisi file yang sama dua kali (300 ronde, pool mentah)', () => {
  for (let t = 0; t < 300; t++) {
    const keys = makeRound(dupItems).map((q) => fileKey(q.it.url))
    assert.equal(new Set(keys).size, keys.length, `file berulang di ronde #${t}`)
  }
})

test('jumlah soal dibatasi jumlah file unik', () => {
  assert.equal(makeRound(quizPool(dupItems)).length, 9)
})

test('mode fokus: sampai 4 soal dari member fokus, tanpa file berulang', () => {
  const pool = quizPool([...solo, ...MEMBERS.map((m, i) => ({ id: 'x' + i, idol: 'CARMEN', type: 'photo', url: `${B}c${i}.jpg` }))])
  for (let t = 0; t < 100; t++) {
    const r = makeRound(pool, 10, Math.random, { prefer: (it) => it.idol === 'CARMEN', preferCount: 4 })
    assert.equal(r.length, 10)
    assert.ok(r.filter((q) => q.answer === 'CARMEN').length >= 4)
    assert.equal(new Set(r.map((q) => fileKey(q.it.url))).size, 10)
  }
  assert.equal(pickUnique(dupItems, 10, Math.random, { prefer: (it) => it.idol === 'JUUN', preferCount: 4 }).filter((it) => it.url.includes('iconic-3')).length <= 1, true)
})
