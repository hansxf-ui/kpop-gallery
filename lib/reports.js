import { sb } from './supabase'
import { protectedWrite } from './turnstile'

// Laporan foto (fitur 9, migrasi 08).
export const REPORT_REASONS = [
  ['salah_member', 'Salah member'],
  ['gambar_rusak', 'Gambar rusak / tidak muncul'],
  ['salah_era', 'Salah era'],
  ['lainnya', 'Lainnya'],
]
export const reasonLabel = (k) => (REPORT_REASONS.find(([x]) => x === k) || [k, k])[1]

// Penanda di perangkat supaya satu item tidak dilaporkan berulang-ulang dari HP yang sama.
const SENT = 'h2h-reported'
const sentList = () => { try { const v = JSON.parse(localStorage.getItem(SENT) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
export const alreadyReported = (itemId) => sentList().includes(itemId)

export async function sendReport(itemId, reason, detail, lang = 'id') {
  if (!REPORT_REASONS.some(([k]) => k === reason)) throw new Error('Pilih alasan laporan.')
  const d = String(detail || '').trim().slice(0, 300) || null
  // Fitur 9: dengan kunci Turnstile terpasang, laporan lewat /api/lindung (diverifikasi anti-spam).
  // Tanpa kunci → fallback ke tulis langsung seperti sebelumnya.
  let gate
  try { gate = await protectedWrite('laporan', { item_id: itemId, reason, detail: d }, lang) } catch (e) {
    if (e.code === 'P0001') throw new Error('Foto ini sudah dilaporkan beberapa kali dan sedang ditinjau. Terima kasih!')
    throw e
  }
  if (gate.ok) { markSent(itemId); return }
  // Tanpa .select(): pengunjung memang tidak boleh membaca tabel laporan.
  const { error } = await sb.from('reports').insert({ item_id: itemId, reason, detail: d })
  if (error) {
    // Trigger migrasi 10: item ini sudah punya banyak laporan terbuka.
    if (error.code === 'P0001') throw new Error('Foto ini sudah dilaporkan beberapa kali dan sedang ditinjau. Terima kasih!')
    throw new Error('Laporan gagal dikirim. Coba lagi nanti.')
  }
  markSent(itemId)
}

function markSent(itemId) {
  try { localStorage.setItem(SENT, JSON.stringify([...sentList(), itemId].slice(-500))) } catch {}
}

// Tabel belum dibuat (migrasi 08 belum dijalankan).
export const isMissingTable = (error) =>
  !!error && (error.code === '42P01' || error.code === 'PGRST205' || /relation .* does not exist|Could not find the table/i.test(error.message || ''))
