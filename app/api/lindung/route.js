import { createClient } from '@supabase/supabase-js'
import { validatePayload, clientIp } from '../../../lib/spamGate'

// Fitur 9: perlindungan spam ringan untuk KIRIM LAPORAN dan BERI REAKSI.
// Alur: browser mendapat token Cloudflare Turnstile → POST ke sini → server memverifikasi token
// dengan TURNSTILE_SECRET_KEY → baru menulis ke Supabase.
//
// Semua kunci dari environment variable Vercel — tidak ada kunci di kode:
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY  (publik, dipakai widget di browser)
//   TURNSTILE_SECRET_KEY            (rahasia, hanya server)
//   SUPABASE_SERVICE_ROLE_KEY       (opsional, rahasia, hanya server — hanya untuk mode ketat, lihat
//                                    supabase/migrations/20261114_12_spam_gate_strict.sql)
// Kunci Turnstile belum dipasang → 501, dan browser memakai cara tulis yang lama (situs tetap jalan).
export const dynamic = 'force-dynamic'

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

async function verifyTurnstile(secret, token, ip, action) {
  const form = new URLSearchParams({ secret, response: token })
  if (ip) form.set('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form, signal: AbortSignal.timeout(8000) })
  const out = await res.json().catch(() => ({}))
  // action dicek supaya token dari widget "laporan" tidak bisa dipakai untuk "reaksi", dan sebaliknya.
  return out.success === true && (!out.action || out.action === action)
}

export async function POST(req) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return json({ fallback: true }, 501)

  let body
  try { body = await req.json() } catch { return json({ error: 'isi permintaan tidak valid' }, 400) }
  const action = body && body.action
  const v = validatePayload(action, body)
  if (!v.ok) return json({ error: v.error }, 400)

  let lolos = false
  try { lolos = await verifyTurnstile(secret, body.token, clientIp(req.headers), action) } catch { lolos = false }
  if (!lolos) return json({ error: 'verifikasi anti-spam gagal' }, 403)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  if (action === 'laporan') {
    const { item_id, reason, detail } = v.value
    // Hanya tiga kolom ini — status tetap bawaan 'baru'; CHECK & trigger batas laporan tetap berlaku.
    const { error } = await sb.from('reports').insert({ item_id, reason, detail })
    if (error) return json({ error: 'gagal', code: error.code }, error.code === 'P0001' ? 429 : 500)
    return json({ ok: true })
  }

  const { item_id, emoji, owner } = v.value
  const { data, error } = await sb.rpc('add_reaction', { p_item: item_id, p_emoji: emoji, p_token: owner })
  if (error) return json({ error: 'gagal', code: error.code }, 500)
  return json({ ok: true, id: data })
}
