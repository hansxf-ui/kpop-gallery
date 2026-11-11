import { SITE_URL } from '../lib/site'

// /robots.txt — izinkan semua halaman publik, kecuali halaman admin dan endpoint API.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
