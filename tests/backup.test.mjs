// Tes cadangan favorit + koleksi (fitur 10) — jalankan: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const store = new Map()
globalThis.window = { dispatchEvent() {} }
globalThis.Event = class {}
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-backup-'))
const cp = (n, reps = []) => { let s = readFileSync(join(root, 'lib', n + '.js'), 'utf8'); for (const [a, b] of reps) s = s.split(a).join(b); writeFileSync(join(dir, n + '.mjs'), s) }
cp('favorites'); cp('favoritesTransfer'); cp('collections')
cp('backup', [["'./favorites'", "'./favorites.mjs'"], ["'./favoritesTransfer'", "'./favoritesTransfer.mjs'"], ["'./collections'", "'./collections.mjs'"]])
const B = await import(pathToFileURL(join(dir, 'backup.mjs')).href)
const FT = await import(pathToFileURL(join(dir, 'favoritesTransfer.mjs')).href)
const C = await import(pathToFileURL(join(dir, 'collections.mjs')).href)
const A = '0f8fad5b-d9cb-469f-a165-70867728950e', Z = '7c9e6679-7425-40de-944b-e07fc1f90ae7'

test('file cadangan baru tetap terbaca oleh impor favorit lama', () => {
  const file = B.buildBackup([A, Z], [{ name: 'Carmen era Focus', ids: [A] }])
  assert.deepEqual(FT.parseFavFile(file), [A, Z])
})

test('impor file favorit lama → migrasi otomatis (favorit saja)', () => {
  const p = B.parseBackup(FT.favFileContent([A]))
  assert.deepEqual(p, { favorit: [A], koleksi: [] })
  assert.deepEqual(B.parseBackup(JSON.stringify([Z])).favorit, [Z])
  assert.throws(() => B.parseBackup('{"x":1}'))
})

test('pulihkan: menggabungkan, impor ulang tidak membuat duplikat', () => {
  store.clear()
  const file = B.buildBackup([A, Z], [{ name: 'Carmen era Focus', ids: [A, Z] }, { name: 'Kosong', ids: [] }])
  store.clear()
  let r = B.restoreBackup(B.parseBackup(file))
  assert.deepEqual(r, { favorit: 2, koleksi: 2 })
  r = B.restoreBackup(B.parseBackup(file))
  assert.deepEqual(r, { favorit: 0, koleksi: 0 })
  assert.equal(C.getCollections().length, 2)
})
