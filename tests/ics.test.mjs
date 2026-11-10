// Tes file kalender .ics — jalankan: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'h2h-ics-'))
writeFileSync(join(dir, 'ics.mjs'), readFileSync(join(root, 'lib/ics.js'), 'utf8'))
const { buildIcs, buildVotingReminderIcs, firstDailyOccurrence } = await import(pathToFileURL(join(dir, 'ics.mjs')).href)
const unfold = (s) => s.replace(/\r\n /g, '')
const bytesOk = (s) => s.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)

test('jadwal: acara sehari penuh, jam KST → UTC, escape, baris ≤75 byte', () => {
  const ics = buildIcs([
    { id: 'a', judul: 'NOL Festival, Day 1; K-POP', tanggal: '2026-12-31', lokasi: 'KINTEX, Goyang', emoji: '🎤', catatan: 'a\nb' },
    { id: 'b', judul: 'ICONIC HEART', tanggal: '2026-10-05T18:00:00+09:00' },
    { id: 'c', judul: 'TBD', tanggal: null },
  ], { now: new Date(Date.UTC(2026, 10, 12, 1, 2, 3)) })
  const u = unfold(ics)
  assert.ok(bytesOk(ics))
  assert.match(u, /DTSTART;VALUE=DATE:20261231/)
  assert.match(u, /DTEND;VALUE=DATE:20270101/)
  assert.match(u, /DTSTART:20261005T090000Z/)
  assert.match(u, /NOL Festival\\, Day 1\\; K-POP/)
  assert.equal((u.match(/BEGIN:VEVENT/g) || []).length, 2)
})

const vote = { id: 'mma-2026', event: 'MMA 2026 — Fan Vote', kategori: 'TOP10', platform: 'Melon', mulai: '2026-10-30T10:00:00+09:00', selesai: '2026-11-13T23:59:00+09:00', cara: ['Buka', 'Vote'] }

test('pengingat harian: RRULE harian sampai tutup voting, alarm saat mulai', () => {
  const ics = buildVotingReminderIcs(vote, { now: new Date('2026-10-20T00:00:00Z') })
  const u = unfold(ics)
  assert.ok(bytesOk(ics))
  assert.match(u, /DTSTART:20261030T010000Z/) // 10:00 KST
  assert.match(u, /RRULE:FREQ=DAILY;UNTIL=20261113T145900Z/)
  assert.match(u, /TRIGGER:PT0M/)
  assert.match(u, /DURATION:PT15M/)
})

test('pengingat harian: voting sudah buka → mulai dari jam yang sama hari berikutnya', () => {
  const now = new Date('2026-11-05T03:00:00Z') // 12:00 KST, sudah lewat 10:00 KST
  assert.equal(firstDailyOccurrence(vote.mulai, now).toISOString(), '2026-11-06T01:00:00.000Z')
  assert.match(unfold(buildVotingReminderIcs(vote, { now })), /DTSTART:20261106T010000Z/)
})

test('pengingat harian: voting sudah tutup / tanpa tanggal → tidak ada file', () => {
  assert.equal(buildVotingReminderIcs(vote, { now: new Date('2026-12-01T00:00:00Z') }), null)
  assert.equal(buildVotingReminderIcs({ id: 'x', event: 'x' }), null)
})
