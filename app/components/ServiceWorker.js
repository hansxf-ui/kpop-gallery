'use client'
import { useEffect } from 'react'
import { FAVS_EVENT } from '../../lib/favorites'
import { syncOffline } from '../../lib/offline'

// Daftarkan service worker (fitur 6) dan sinkronkan foto favorit ke cache offline
// setiap kali favorit berubah. Hanya di production — saat `next dev` tidak didaftarkan
// supaya cache tidak membingungkan saat mengembangkan.
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    let t
    const sync = () => syncOffline().catch(() => {})
    const onFav = () => { clearTimeout(t); t = setTimeout(sync, 800) }
    navigator.serviceWorker
      // updateViaCache 'none': browser selalu cek sw.js terbaru, tidak memakai salinan HTTP cache.
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(() => navigator.serviceWorker.ready)
      .then(sync)
      .catch(() => { /* browser menolak SW (mis. mode privat) — situs tetap jalan biasa */ })
    window.addEventListener(FAVS_EVENT, onFav)
    window.addEventListener('online', sync)
    return () => {
      clearTimeout(t)
      window.removeEventListener(FAVS_EVENT, onFav)
      window.removeEventListener('online', sync)
    }
  }, [])
  return null
}
