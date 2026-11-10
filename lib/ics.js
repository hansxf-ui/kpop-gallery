// File kalender .ics (RFC 5545) untuk acara /jadwal (fitur 13) — tanpa server, dibuat di browser.
// - Tanggal saja ('2026-10-17')            → acara sehari penuh, pengingat 1 hari sebelumnya.
// - Tanggal + jam ('2026-10-05T18:00+09:00') → jam mulai saja (jam selesai tidak tercatat di data,
//   jadi tidak dikarang), pengingat 1 jam sebelumnya.
// - Acara tanpa tanggal (null) tidak dibuat.

const pad = (n) => String(n).padStart(2, '0')
const ymd = (y, m, d) => `${y}${pad(m)}${pad(d)}`
const utcStamp = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`

// Escape teks sesuai RFC 5545 (backslash, titik koma, koma, baris baru).
export const escapeText = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

// Lipat baris > 75 byte (UTF-8) dengan CRLF + spasi, tanpa memotong karakter multibyte.
export function fold(line) {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const out = []
  let cur = '', len = 0, limit = 75
  for (const ch of line) {
    const n = enc.encode(ch).length
    if (len + n > limit) { out.push(cur); cur = ''; len = 0; limit = 74 }
    cur += ch; len += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

function eventLines(e, stamp, siteUrl) {
  if (!e.tanggal) return []
  const L = ['BEGIN:VEVENT', `UID:${e.id}@hearts2hearts-gallery`, `DTSTAMP:${stamp}`]
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(e.tanggal)
  if (dateOnly) {
    const [y, m, d] = e.tanggal.split('-').map(Number)
    const next = new Date(Date.UTC(y, m - 1, d + 1))
    L.push(`DTSTART;VALUE=DATE:${ymd(y, m, d)}`, `DTEND;VALUE=DATE:${ymd(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())}`)
  } else {
    const t = new Date(e.tanggal)
    if (Number.isNaN(t.getTime())) return []
    L.push(`DTSTART:${utcStamp(t)}`)
  }
  L.push(`SUMMARY:${escapeText(`${e.emoji ? e.emoji + ' ' : ''}Hearts2Hearts — ${e.judul}`)}`)
  if (e.lokasi) L.push(`LOCATION:${escapeText(e.lokasi)}`)
  const desc = [e.catatan, dateOnly ? null : 'Jam selesai belum diumumkan.', siteUrl ? `Jadwal lengkap: ${siteUrl}/jadwal` : null].filter(Boolean).join('\n')
  if (desc) L.push(`DESCRIPTION:${escapeText(desc)}`)
  L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(e.judul)}`, `TRIGGER:${dateOnly ? '-P1D' : '-PT1H'}`, 'END:VALARM', 'END:VEVENT')
  return L
}

export function buildIcs(events, { siteUrl = '', now = new Date() } = {}) {
  const stamp = utcStamp(now)
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hearts2Hearts Gallery//Jadwal//ID', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Jadwal Hearts2Hearts']
  for (const e of events) lines.push(...eventLines(e, stamp, siteUrl))
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

export const icsFilename = (e) => `h2h-${String(e.id || 'jadwal').replace(/[^a-z0-9-]+/gi, '-')}.ics`
