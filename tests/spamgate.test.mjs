// Tes validasi /api/lindung (fitur 9) — jalankan: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-gate-'))
writeFileSync(join(dir, 'spamGate.mjs'), readFileSync(join(root, 'lib/spamGate.js'), 'utf8'))
const { validatePayload, clientIp } = await import(pathToFileURL(join(dir, 'spamGate.mjs')).href)
const ID = '0f8fad5b-d9cb-469f-a165-70867728950e'

test('laporan: hanya alasan yang dikenal, keterangan dipotong 300', () => {
  assert.equal(validatePayload('laporan', { token: 'x'.repeat(20), item_id: ID, reason: 'salah_member', detail: 'a'.repeat(400) }).value.detail.length, 300)
  assert.equal(validatePayload('laporan', { token: 'x'.repeat(20), item_id: ID, reason: 'hapus_semua' }).ok, false)
  assert.equal(validatePayload('laporan', { token: 'x'.repeat(20), item_id: 'drop table', reason: 'lainnya' }).ok, false)
  assert.equal(validatePayload('laporan', { item_id: ID, reason: 'lainnya' }).ok, false, 'tanpa token Turnstile ditolak')
})

test('reaksi: hanya 4 emoji, token reaksi 32–128 karakter, aksi lain ditolak', () => {
  assert.equal(validatePayload('reaksi', { token: 'x'.repeat(20), item_id: ID, emoji: '😍', owner: 'a'.repeat(32) }).ok, true)
  assert.equal(validatePayload('reaksi', { token: 'x'.repeat(20), item_id: ID, emoji: '💩', owner: 'a'.repeat(32) }).ok, false)
  assert.equal(validatePayload('reaksi', { token: 'x'.repeat(20), item_id: ID, emoji: '😍', owner: 'pendek' }).ok, false)
  assert.equal(validatePayload('hapus', { token: 'x'.repeat(20), item_id: ID }).ok, false)
})

test('IP pengunjung dari header proxy', () => {
  assert.equal(clientIp(new Map([['x-forwarded-for', '1.2.3.4, 5.6.7.8']])), '1.2.3.4')
})

test('tidak ada kunci rahasia di kode (hanya lewat process.env)', () => {
  for (const f of ['app/api/lindung/route.js', 'lib/turnstile.js']) {
    const s = readFileSync(join(root, f), 'utf8')
    assert.doesNotMatch(s, /0x4AAA[0-9A-Za-z_-]{10,}|1x0000000000000000000000000000000AA/, f)
    assert.doesNotMatch(s, /secret\s*[:=]\s*['"][^'"]{8,}['"]/, f)
  }
})
