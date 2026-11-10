// Tes kalender bulanan /jadwal (fitur 13) — jalankan: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-cal-'))
const cp = (n, reps = []) => { let s = readFileSync(join(root, 'lib', n + '.js'), 'utf8'); for (const [a, b] of reps) s = s.split(a).join(b); writeFileSync(join(dir, n + '.mjs'), s) }
cp('schedule'); cp('jadwal'); cp('calendar', [["'./schedule'", "'./schedule.mjs'"]])
const C = await import(pathToFileURL(join(dir, 'calendar.mjs')).href)
const J = await import(pathToFileURL(join(dir, 'jadwal.mjs')).href)

test('grid bulan mulai Senin, semua tanggal bulan itu ada tepat sekali', () => {
  const w = C.monthGrid(2026, 10) // November 2026 (1 Nov = Minggu)
  assert.ok(w.every((wk) => wk.length === 7))
  assert.equal(w[0][0].date.getDay(), 1, 'kolom pertama = Senin')
  assert.equal(w[0][6].key, '2026-11-01')
  const inMonth = w.flat().filter((d) => d.inMonth).map((d) => d.date.getDate())
  assert.deepEqual(inMonth, Array.from({ length: 30 }, (_, i) => i + 1))
  assert.equal(C.monthGrid(2026, 1).flat().filter((d) => d.inMonth).length, 28)
})

test('pindah bulan melewati pergantian tahun', () => {
  assert.deepEqual(C.shiftMonth({ y: 2026, m: 11 }, 1), { y: 2027, m: 0 })
  assert.deepEqual(C.shiftMonth({ y: 2026, m: 0 }, -1), { y: 2025, m: 11 })
})

test('acara dipetakan ke tanggal lokal dari data /jadwal yang sama; tanpa tanggal dilewati', () => {
  const map = C.eventsByDay(J.JADWAL, J.RIWAYAT_2026)
  const total = [...map.values()].reduce((n, l) => n + l.length, 0)
  assert.equal(total, J.JADWAL.filter((e) => e.tanggal).length + J.RIWAYAT_2026.filter((r) => r.tanggal).length)
  assert.ok(map.get('2026-10-05').some((e) => e.id === 'iconic-heart-kr'), '18:00 KST tetap tanggal 5 Okt di zona tes')
})
