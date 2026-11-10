// Tes "Hari ini di H2H" & logika tanggal bersama — jalankan: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-today-'))
const copy = (name, rep = []) => {
  let s = readFileSync(join(root, 'lib', name + '.js'), 'utf8')
  for (const [a, b] of rep) s = s.split(a).join(b)
  writeFileSync(join(dir, name + '.mjs'), s)
}
writeFileSync(join(dir, 'supabase.mjs'), 'export const sb = {}\nexport const selectPublic = () => ({})\n')
copy('schedule'); copy('jadwal'); copy('voting')
copy('today', [["'./supabase'", "'./supabase.mjs'"], ["'./jadwal'", "'./jadwal.mjs'"], ["'./voting'", "'./voting.mjs'"], ["'./schedule'", "'./schedule.mjs'"]])
const S = await import(pathToFileURL(join(dir, 'schedule.mjs')).href)
const T = await import(pathToFileURL(join(dir, 'today.mjs')).href)

test('foto kenangan: indeks sama untuk tanggal sama, berbeda antar hari, dalam rentang', () => {
  assert.equal(T.pickIndex('2026-11-14', 977), T.pickIndex('2026-11-14', 977))
  const days = Array.from({ length: 30 }, (_, i) => T.pickIndex(`2026-12-${String(i + 1).padStart(2, '0')}`, 977))
  assert.ok(new Set(days).size > 20, 'sebaran harian terlalu sempit')
  assert.ok(days.every((i) => i >= 0 && i < 977))
  assert.equal(T.pickIndex('x', 0), -1)
})

test('?tanggal= hanya menerima tanggal valid', () => {
  assert.equal(T.todayFrom('?tanggal=2026-03-28').now.getDate(), 28)
  assert.equal(T.todayFrom('?tanggal=2026-02-31').override, false)
  assert.equal(T.todayFrom('?tanggal=besok').override, false)
})

test('tanggal lokal: hari ini / sudah lewat / status voting', () => {
  const now = new Date(2026, 10, 14, 23, 30)
  assert.ok(S.hariIni('2026-11-14', now))
  assert.ok(!S.sudahLewat('2026-11-14', now))
  assert.ok(S.sudahLewat('2026-11-13', now))
  assert.equal(S.dayKey(now), '2026-11-14')
  const v = { mulai: '2026-10-30T10:00:00+09:00', selesai: '2026-11-13T23:59:00+09:00' }
  assert.equal(S.statusVote(v, Date.parse('2026-11-01T00:00:00Z')), 'buka')
  assert.equal(S.statusVote(v, Date.parse('2026-11-14T00:00:00Z')), 'tutup')
  assert.equal(S.statusVote({}, 0), 'tunggu')
})

test('acara hari ini & acara berikutnya dari data jadwal', () => {
  const now = new Date(2026, 10, 20, 9)
  const ev = T.eventsToday(now)
  assert.ok(ev.every((e) => S.hariIni(e.tanggal, now)))
  const n = T.nextEvent(now)
  assert.ok(n && !S.sudahLewat(n.tanggal, now) && !S.hariIni(n.tanggal, now))
})
