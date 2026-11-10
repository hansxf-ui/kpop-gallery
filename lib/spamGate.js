// Fitur 9: validasi isi permintaan /api/lindung (dipakai server, dan dites terpisah).
// Sengaja tanpa 'use client' & tanpa impor Supabase — modul murni.

export const ACTIONS = ['laporan', 'reaksi']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMOJI = ['😍', '🔥', '😭', '👏']
const REASONS = ['salah_member', 'gambar_rusak', 'salah_era', 'lainnya']

// Mengembalikan { ok: true, value } atau { ok: false, error }.
export function validatePayload(action, body) {
  if (!ACTIONS.includes(action)) return { ok: false, error: 'aksi tidak dikenal' }
  const b = body && typeof body === 'object' ? body : {}
  if (typeof b.token !== 'string' || b.token.length < 10 || b.token.length > 4096) return { ok: false, error: 'token anti-spam tidak ada' }
  if (typeof b.item_id !== 'string' || !UUID.test(b.item_id)) return { ok: false, error: 'item tidak valid' }
  if (action === 'laporan') {
    if (!REASONS.includes(b.reason)) return { ok: false, error: 'alasan tidak valid' }
    const detail = typeof b.detail === 'string' ? b.detail.trim().slice(0, 300) : ''
    return { ok: true, value: { item_id: b.item_id.toLowerCase(), reason: b.reason, detail: detail || null } }
  }
  if (!EMOJI.includes(b.emoji)) return { ok: false, error: 'emoji tidak valid' }
  if (typeof b.owner !== 'string' || b.owner.length < 32 || b.owner.length > 128) return { ok: false, error: 'token reaksi tidak valid' }
  return { ok: true, value: { item_id: b.item_id.toLowerCase(), emoji: b.emoji, owner: b.owner } }
}

// Pilih IP pengunjung untuk Cloudflare (opsional) dari header proxy Vercel.
export function clientIp(headers) {
  const get = (k) => (typeof headers.get === 'function' ? headers.get(k) : headers[k]) || ''
  return get('cf-connecting-ip') || get('x-real-ip') || get('x-forwarded-for').split(',')[0].trim() || undefined
}
