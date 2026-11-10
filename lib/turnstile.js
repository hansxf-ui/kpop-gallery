'use client'
// Fitur 9: Cloudflare Turnstile di browser (skrip resmi dimuat langsung, tanpa paket npm).
// Aktif hanya kalau NEXT_PUBLIC_TURNSTILE_SITE_KEY terpasang di Vercel. Tanpa kunci → semua fungsi
// di sini mengembalikan { fallback: true } dan laporan/reaksi memakai cara tulis yang lama.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
export const turnstileEnabled = !!SITE_KEY
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise = null
function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SCRIPT; s.async = true; s.defer = true
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')))
      s.onerror = () => { scriptPromise = null; reject(new Error('turnstile')) }
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

// Satu token sekali pakai per aksi. Widget "interaction-only": biasanya tidak terlihat sama sekali;
// kotak centang hanya muncul (pojok kanan bawah) kalau Cloudflare ragu.
export async function getTurnstileToken(action, lang = 'id') {
  const ts = await loadScript()
  return new Promise((resolve, reject) => {
    const box = document.createElement('div')
    box.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:70'
    document.body.appendChild(box)
    let id = null
    const done = (fn, v) => { clearTimeout(timer); try { if (id !== null) ts.remove(id) } catch {} box.remove(); fn(v) }
    const timer = setTimeout(() => done(reject, new Error('timeout')), 60000)
    id = ts.render(box, {
      sitekey: SITE_KEY, action, appearance: 'interaction-only', execution: 'render', language: lang === 'en' ? 'en' : 'id',
      callback: (token) => done(resolve, token),
      'error-callback': () => done(reject, new Error('turnstile')),
      'expired-callback': () => done(reject, new Error('expired')),
    })
  })
}

// Tulis lewat /api/lindung. Hasil: { ok, data } | { fallback: true } | lempar Error.
export async function protectedWrite(action, payload, lang) {
  if (!turnstileEnabled) return { fallback: true }
  let token
  try { token = await getTurnstileToken(action, lang) } catch { throw new Error('Verifikasi anti-spam gagal. Coba lagi.') }
  const res = await fetch('/api/lindung', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...payload }),
  })
  if (res.status === 501) return { fallback: true } // kunci rahasia belum dipasang di server
  const out = await res.json().catch(() => ({}))
  if (res.ok && out.ok) return { ok: true, data: out }
  const gagal = action === 'laporan' ? 'Laporan gagal dikirim. Coba lagi nanti.' : 'Reaksi gagal dikirim. Coba lagi.'
  const err = new Error(res.status === 403 ? 'Verifikasi anti-spam gagal. Coba lagi.' : gagal)
  err.status = res.status
  err.code = out.code
  throw err
}
