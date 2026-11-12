import { SITE_URL } from '../lib/site'
import { ALBUM_KEYS } from '../lib/gallery'

// /sitemap.xml — daftar halaman publik untuk mesin pencari. Tidak memuat /admin, halaman pribadi
// pengunjung (/favorit, /koleksi — isinya tersimpan di perangkat masing-masing), dan
// /koleksi/lihat (butuh ?kode=), serta /hari-ini & /kredit yang sudah dialihkan (next.config.js).
const PAGES = [
  ['/', 'daily', 1],
  ['/galeri', 'daily', 0.9],
  ['/jadwal', 'daily', 0.8],
  ['/voting', 'daily', 0.8],
  ['/linimasa', 'weekly', 0.6],
  ['/banding', 'weekly', 0.5],
  ['/kuis', 'monthly', 0.4],
  ['/tentang', 'monthly', 0.5],
]

export default function sitemap() {
  const now = new Date()
  return [
    ...PAGES.map(([path, changeFrequency, priority]) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority })),
    // Album per member + grup (/idol/CARMEN, /idol/HEARTS2HEARTS, …)
    ...ALBUM_KEYS.map((k) => ({ url: `${SITE_URL}/idol/${encodeURIComponent(k)}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 })),
  ]
}
