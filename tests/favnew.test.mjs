// Tes lencana foto baru member favorit (fitur 12) — jalankan: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-favnew-'))
const cp = (n, reps = []) => { let s = readFileSync(join(root, 'lib', n + '.js'), 'utf8'); for (const [a, b] of reps) s = s.split(a).join(b); writeFileSync(join(dir, n + '.mjs'), s) }
writeFileSync(join(dir, 'supabase.mjs'), "export const sb = {}\nexport const ytId = () => 'x'\nexport const fetchItemsByIds = async () => []\n")
writeFileSync(join(dir, 'stub.mjs'), "export const getFavorites = () => []\nexport const readCachedRows = () => []\nexport const getBias = () => null\nexport const visitBaseline = () => null\n")
cp('tagSuggest')
cp('gallery', [["'./supabase'", "'./supabase.mjs'"], ["'./tagSuggest'", "'./tagSuggest.mjs'"]])
cp('favNew', [["'use client'", ''], ["'./supabase'", "'./supabase.mjs'"], ["'./gallery'", "'./gallery.mjs'"], ["'./favorites'", "'./stub.mjs'"], ["'./offline'", "'./stub.mjs'"], ["'./bias'", "'./stub.mjs'"], ["'./lastVisit'", "'./stub.mjs'"]])
const F = await import(pathToFileURL(join(dir, 'favNew.mjs')).href)

test('patokan = yang lebih baru antara kunjungan terakhir dan lencana dilihat', () => {
  const a = new Date('2026-11-01'), b = new Date('2026-11-05')
  assert.equal(F.sinceOf(a, b), b)
  assert.equal(F.sinceOf(b, a), b)
  assert.equal(F.sinceOf(null, a), a)
  assert.equal(F.sinceOf(null, null), null)
})

test('hitung hanya item baru yang memuat member favorit', () => {
  const since = new Date('2026-11-10T00:00:00Z')
  const rows = [
    { idol: 'CARMEN', created_at: '2026-11-11T00:00:00Z' },
    { idol: 'JUUN & CARMEN', created_at: '2026-11-12T00:00:00Z' },
    { idol: 'IAN', created_at: '2026-11-12T00:00:00Z' },
    { idol: 'CARMEN', created_at: '2026-11-09T00:00:00Z' },
  ]
  assert.deepEqual(F.countNew(rows, ['CARMEN'], since), { count: 2, members: ['CARMEN'] })
  assert.deepEqual(F.countNew(rows, [], since), { count: 0, members: [] })
  assert.deepEqual(F.countNew(rows, ['CARMEN'], null), { count: 0, members: [] })
})
