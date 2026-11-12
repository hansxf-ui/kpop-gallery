// Tes susunan grid masonry & "Pilihan minggu ini" — jalankan: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-masonry-'))
const load = async (name) => {
  writeFileSync(join(dir, name + '.mjs'), readFileSync(join(root, 'lib', name + '.js'), 'utf8'))
  return import(pathToFileURL(join(dir, name + '.mjs')).href)
}
const M = await load('masonry')
const W = await load('weekly')

test('item setinggi sama → urutan kiri ke kanan per baris', () => {
  assert.deepEqual(M.placeInColumns([1, 1, 1, 1, 1, 1, 1, 1], 4), [[0, 4], [1, 5], [2, 6], [3, 7]])
  assert.deepEqual(M.placeInColumns([1, 1, 1, 1, 1], 2), [[0, 2, 4], [1, 3]])
})

test('item berikutnya masuk kolom yang paling pendek', () => {
  // item 0 tinggi sekali → item berikutnya ditaruh di kolom kanan sampai tingginya menyusul (3)
  assert.deepEqual(M.placeInColumns([3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1], 2, 0), [[0, 7], [1, 2, 3, 4, 5, 6]])
})

test('menambah item di belakang tidak memindahkan item yang sudah ada', () => {
  const ratios = Array.from({ length: 200 }, (_, i) => [0.75, 1.33, 1.5, 0.5625, 1][(i * 7) % 5])
  for (const cols of [2, 3, 4]) {
    const colOf = (layout) => { const m = new Map(); layout.forEach((ids, c) => ids.forEach((i, row) => m.set(i, [c, row]))); return m }
    const before = colOf(M.placeInColumns(ratios.slice(0, 40), cols))
    const after = colOf(M.placeInColumns(ratios.slice(0, 80), cols))
    for (const [i, pos] of before) assert.deepEqual(after.get(i), pos, `cols=${cols} item ${i}`)
  }
})

test('kolom tidak valid & daftar kosong', () => {
  assert.deepEqual(M.placeInColumns([], 3), [[], [], []])
  assert.deepEqual(M.placeInColumns([1, 1], 0), [[0, 1]])
  assert.deepEqual(M.placeInColumns([NaN, -1, 1], 3), [[0], [1], [2]])
})

test('heightRatio mengikuti bingkai GalleryCard', () => {
  assert.equal(M.heightRatio({ type: 'photo', width: 1000, height: 1500 }), 1.5)
  assert.equal(M.heightRatio({ type: 'photo' }), 4 / 3)
  assert.equal(M.heightRatio({ type: 'youtube' }), 9 / 16)
  assert.equal(M.heightRatio({ type: 'video', width: 100, height: 100 }), 4 / 3)
})

test('columnsFor = breakpoint lama (md 768, lg 1024)', () => {
  assert.deepEqual([375, 767, 768, 1023, 1024, 1920].map(M.columnsFor), [2, 2, 3, 3, 4, 4])
})

// Rumus lama dari GaleriClient (sebelum dipindah ke lib/weekly.js) — hasil harus sama persis.
function oldPick(items, now) {
  const n = Math.min(5, items.length)
  const step = Math.max(1, Math.floor(items.length / n))
  const start = W.weekNumber(now) % items.length
  const out = []
  for (let i = 0; i < n; i++) out.push(items[(start + i * step) % items.length])
  return out
}

test('pickWeekly sama dengan rumus lama; weeklyIndices = posisi yang sama', () => {
  for (const total of [1, 3, 5, 7, 120, 1159, 4000]) {
    const items = Array.from({ length: total }, (_, i) => ({ id: `i${i}` }))
    for (const now of [new Date(2026, 0, 1), new Date(2026, 10, 12), new Date(2027, 5, 30)]) {
      assert.deepEqual(W.pickWeekly(items, now), oldPick(items, now), `total=${total}`)
      assert.deepEqual(W.weeklyIndices(total, now).map((i) => items[i]), oldPick(items, now))
    }
  }
  assert.deepEqual(W.weeklyIndices(0), [])
  assert.deepEqual(W.pickWeekly([]), [])
})
