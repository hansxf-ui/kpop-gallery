// Tes pencarian warna/konsep & saran tag (fitur 4) — jalankan: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-search-'))
writeFileSync(join(dir, 'supabase.mjs'), "export const ytId = () => 'x'\n")
writeFileSync(join(dir, 'tagSuggest.mjs'), readFileSync(join(root, 'lib/tagSuggest.js'), 'utf8'))
writeFileSync(join(dir, 'gallery.mjs'), readFileSync(join(root, 'lib/gallery.js'), 'utf8').replace("from './supabase'", "from './supabase.mjs'").replace("from './tagSuggest'", "from './tagSuggest.mjs'"))
const S = await import(pathToFileURL(join(dir, 'tagSuggest.mjs')).href)
const G = await import(pathToFileURL(join(dir, 'gallery.mjs')).href)

test('saran tag dari judul, per kata utuh', () => {
  assert.deepEqual(S.suggestTags('ICONIC HEART MV Teaser'), ['mv'])
  assert.deepEqual(S.suggestTags('Panggung Music Bank 241025'), ['stage'])
  assert.deepEqual(S.suggestTags('Foto di Bandara Incheon'), ['airport'])
  assert.deepEqual(S.suggestTags('Behind the scenes syuting'), ['behind'])
  assert.deepEqual(S.suggestTags('Jiwoo & BTS di MAMA'), [], '"BTS" (grup) bukan behind the scenes')
  assert.deepEqual(S.suggestTags('Pemvideoan'), [], 'bukan kata utuh "mv"/"video"')
  assert.deepEqual(S.suggestTags('MV stage', ['mv']), ['stage'], 'tag yang sudah dipilih tidak disarankan lagi')
})

test('pencarian warna memakai sinonim ID/EN', () => {
  const it = { title: 'JUUN — set studio gelap ungu' }
  assert.ok(G.matchesQuery(it, 'ungu'))
  assert.ok(G.matchesQuery(it, 'Purple'))
  assert.ok(!G.matchesQuery({ title: 'Kemeja biru' }, 'ungu'))
  assert.ok(!G.matchesQuery({ title: 'Brownies' }, 'brown'), 'per kata utuh')
  assert.deepEqual(S.colorsInItems([{ title: 'baju merah' }, { title: 'latar putih' }]), ['merah', 'putih'])
})

test('pencarian konsep mencocokkan tag (ID & EN, dengan/tanpa #)', () => {
  const it = { title: 'Fancam', tags: ['stage'] }
  assert.ok(G.matchesQuery(it, 'panggung'))
  assert.ok(G.matchesQuery(it, '#stage'))
  assert.ok(!G.matchesQuery(it, 'bandara'))
})

test('teks alternatif: alt_text dulu, lalu judul, lalu nama idol', () => {
  assert.equal(G.altOf({ alt_text: '  Carmen tersenyum  ', title: 'Foto 1', idol: 'CARMEN' }), 'Carmen tersenyum')
  assert.equal(G.altOf({ alt_text: '   ', title: 'Foto 1', idol: 'CARMEN' }), 'Foto 1')
  assert.equal(G.altOf({ idol: 'CARMEN' }), 'CARMEN')
  assert.ok(G.matchesQuery({ alt_text: 'latar biru' }, 'blue'), 'warna juga dicari di teks alternatif')
})
