/* Service worker Hearts2Hearts Gallery — fitur 6: foto favorit bisa dilihat offline.
 *
 * Prinsip "tidak mengganggu update situs":
 *  - Halaman (HTML) SELALU diambil dari jaringan dulu. Salinan cache hanya dipakai saat offline,
 *    jadi deploy baru langsung terlihat begitu online.
 *  - /_next/static/* (nama file berisi hash, tidak pernah berubah isinya) boleh cache-first.
 *    Deploy baru = nama file baru, jadi tidak pernah menyajikan kode lama untuk HTML baru.
 *  - Foto favorit: jaringan dulu, cache hanya saat offline.
 *  - skipWaiting + clients.claim: versi sw.js baru langsung aktif. sw.js sendiri dikirim dengan
 *    Cache-Control no-cache (next.config.js) dan didaftarkan dengan updateViaCache: 'none'.
 *  - Naikkan VERSION untuk membuang semua cache lama sekaligus.
 */
const VERSION = 'v1'
const PAGES = `h2h-pages-${VERSION}`
const STATIC = `h2h-static-${VERSION}`
const MEDIA = `h2h-fav-media-${VERSION}`
const KEEP = [PAGES, STATIC, MEDIA]
const MAX_STATIC = 200
// Halaman publik yang boleh disimpan untuk offline (admin TIDAK).
const PAGE_OK = (p) => ['/', '/galeri', '/favorit', '/jadwal', '/voting', '/tentang'].includes(p) || p.startsWith('/idol/')

const OFFLINE_HTML = `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · Hearts2Hearts Gallery</title>
<body style="font-family:Quicksand,system-ui,sans-serif;background:#F5FAFE;color:#173A56;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">
<div><p style="font-size:30px;margin:0;color:#EA93BB">♥<span style="color:#7FC4E8">♥</span></p>
<h1 id="j" style="font-family:'Playfair Display',serif">Kamu sedang offline</h1>
<p id="p">Halaman ini belum tersimpan di perangkat. Buka <a href="/favorit" style="color:#EA93BB;font-weight:700">Favoritku</a> untuk melihat foto favorit yang sudah tersimpan.</p></div>
<script>try{if(localStorage.getItem('h2h-lang')==='en'){document.documentElement.lang='en';document.title='Offline · Hearts2Hearts Gallery';document.getElementById('j').textContent='You’re offline';document.getElementById('p').innerHTML='This page isn’t saved on this device yet. Open <a href="/favorit" style="color:#EA93BB;font-weight:700">My Favorites</a> to see the favorite photos already saved.'}}catch(e){}</script></body></html>`

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith('h2h-') && !KEEP.includes(name)) await caches.delete(name)
    await self.clients.claim()
  })())
})

// ---------- Kunci media ----------
// Satu foto punya banyak varian URL (?width=400/800/1000, /object/ vs /render/image/).
// Semua dipetakan ke satu kunci tanpa query, jadi varian apa pun yang diminta saat offline
// dilayani dari satu salinan tersimpan.
function mediaKey(raw) {
  let u
  try { u = new URL(raw) } catch { return null }
  if (u.protocol !== 'https:') return null
  if (u.hostname.endsWith('.supabase.co') && u.pathname.startsWith('/storage/v1/')) {
    return u.origin + u.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  }
  // Thumbnail YouTube sengaja tidak disimpan: tanpa header CORS jadi respons "opaque",
  // yang di Chrome dihitung beberapa MB kuota per file.
  return null
}

// ---------- Fetch ----------
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/_next/static/')) return event.respondWith(staticFirst(req))
    // Navigasi klien Next (permintaan RSC) tidak disentuh — kalau offline, Next jatuh ke navigasi penuh.
    if (req.mode === 'navigate' && !req.headers.get('RSC')) return event.respondWith(page(req, url))
    return
  }
  // Hanya gambar dari storage Supabase. API database (/rest/v1) tidak disentuh.
  if (mediaKey(req.url) && req.destination === 'image') event.respondWith(media(req))
})

async function staticFirst(req) {
  const cache = await caches.open(STATIC)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) { await cache.put(req, res.clone()); trim(cache) }
  return res
}

async function trim(cache) {
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - MAX_STATIC; i++) await cache.delete(keys[i]) // urutan = paling lama dulu
}

async function page(req, url) {
  try {
    const res = await fetch(req)
    // Respons hasil redirect tidak disimpan: menyajikannya lagi untuk navigasi membuat browser
    // menolak halaman ("redirected response was used for a request whose redirect mode is not follow").
    if (res.ok && res.type === 'basic' && !res.redirected && PAGE_OK(url.pathname) && (res.headers.get('content-type') || '').includes('text/html')) {
      const cache = await caches.open(PAGES)
      await cache.put(url.origin + url.pathname, res.clone()) // tanpa query: /galeri?item=… disimpan sebagai /galeri
    }
    return res
  } catch {
    const cache = await caches.open(PAGES)
    return (await cache.match(url.origin + url.pathname))
      || (await cache.match(url.origin + '/favorit'))
      || new Response(OFFLINE_HTML, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
}

async function media(req) {
  const cache = await caches.open(MEDIA)
  const hit = await cache.match(mediaKey(req.url))
  if (!hit) return fetch(req) // bukan favorit -> perilaku biasa
  try { return await fetch(req) } catch { return hit }
}

// ---------- Sinkron foto favorit (pesan dari halaman, lib/offline.js) ----------
self.addEventListener('message', (event) => {
  const src = event.source && event.source.url
  if (!src || new URL(src).origin !== self.location.origin) return
  if (event.data && event.data.type === 'h2h-sync-favorites') event.waitUntil(syncMedia(event.data.urls))
})

async function syncMedia(urls) {
  const cache = await caches.open(MEDIA)
  const want = new Map()
  for (const u of Array.isArray(urls) ? urls.slice(0, 2000) : []) {
    const k = typeof u === 'string' && mediaKey(u)
    if (k) want.set(k, u)
  }
  // Foto yang sudah tidak difavoritkan dibuang dari perangkat.
  for (const r of await cache.keys()) if (!want.has(r.url)) await cache.delete(r)
  for (const [key, u] of want) {
    if (await cache.match(key)) continue
    try {
      const res = await fetch(u, { mode: 'cors', credentials: 'omit' })
      if (res.ok) await cache.put(key, res)
    } catch { /* offline / gagal — dicoba lagi saat sinkron berikutnya */ }
  }
  if (want.size) await simpanHalaman('/favorit')
}

let lastPageSave = 0

// Simpan HTML /favorit + file /_next/static yang dirujuknya, supaya Favoritku bisa dibuka offline
// walau pengunjung memfavoritkan dari halaman lain dan belum pernah membuka /favorit.
async function simpanHalaman(path) {
  // Paling sering sekali per 10 menit — sinkron berjalan tiap halaman dibuka.
  if (Date.now() - lastPageSave < 10 * 60 * 1000) return
  lastPageSave = Date.now()
  try {
    const res = await fetch(path, { credentials: 'same-origin' })
    if (!res.ok || res.redirected) return
    const html = await res.clone().text()
    await (await caches.open(PAGES)).put(self.location.origin + path, res)
    const st = await caches.open(STATIC)
    const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || [])]
    for (const a of assets) {
      if (await st.match(a)) continue
      try { const r = await fetch(a); if (r.ok) await st.put(a, r) } catch {}
    }
    trim(st)
  } catch { /* offline — coba lagi saat sinkron berikutnya */ }
}
