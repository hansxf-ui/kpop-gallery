// Tes statistik fandom (fitur 8) — jalankan: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-stats-'))
const cp = (n, reps) => { let s = readFileSync(join(root, 'lib', n + '.js'), 'utf8'); for (const [a, b] of reps) s = s.split(a).join(b); writeFileSync(join(dir, n + '.mjs'), s) }
writeFileSync(join(dir, 'supabase.mjs'), "export const sb = {}\nexport const ytId = () => 'x'\nexport const fetchItemsByIds = async () => []\n")
cp('tagSuggest', [])
cp('gallery', [["'./supabase'", "'./supabase.mjs'"], ["'./tagSuggest'", "'./tagSuggest.mjs'"]])
cp('topReacted', [["'./supabase'", "'./supabase.mjs'"]])
cp('fandomStats', [["'./supabase'", "'./supabase.mjs'"], ["'./gallery'", "'./gallery.mjs'"], ["'./topReacted'", "'./topReacted.mjs'"]])
const F = await import(pathToFileURL(join(dir, 'fandomStats.mjs')).href)

test('member minggu ini: hanya 8 member, tanpa angka 0, seri → urutan member', () => {
  assert.equal(F.bestMember([]), null)
  assert.equal(F.bestMember([{ member: 'HEARTS2HEARTS', jumlah: 50 }, { member: 'IAN', jumlah: 0 }]), null)
  assert.equal(F.bestMember([{ member: 'IAN', jumlah: 3 }, { member: 'CARMEN', jumlah: 3 }]).member, 'CARMEN')
  assert.equal(F.bestMember([{ member: 'IAN', jumlah: 4 }, { member: 'CARMEN', jumlah: 3 }]).member, 'IAN')
})
