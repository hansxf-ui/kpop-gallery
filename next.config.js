/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    // next/image di situs ini memakai loader Supabase (lib/imageLoader.js) — gambar diperkecil oleh
    // endpoint render Supabase, BUKAN Vercel Image Optimization (kuota paket Hobby terbatas).
    // Daftar lebar dibatasi: Supabase menolak transformasi di atas 2500px.
    deviceSizes: [400, 640, 828, 1080, 1200, 1600],
    imageSizes: [96, 200, 300],
    // Hanya berlaku kalau suatu saat ada <Image> tanpa loader khusus.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/**' }],
  },
  // Halaman yang digabung — link lama yang sudah tersebar tetap jalan. Query ikut terbawa
  // (mis. /hari-ini?tanggal=2026-12-25 → /?tanggal=2026-12-25, mode coba tanggal di beranda).
  async redirects() {
    return [
      { source: '/hari-ini', destination: '/', permanent: true }, // isinya jadi seksi "Hari ini" di beranda
      { source: '/kredit', destination: '/tentang', permanent: true }, // isinya jadi seksi "Kredit Foto" di Tentang
    ]
  },
  async headers() {
    return [
      {
        // Header keamanan dasar untuk semua halaman. Tidak memakai Content-Security-Policy dulu:
        // situs memuat YouTube, Supabase, dan CDN emoji, jadi CSP perlu diuji di browser sebelum dipasang.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Halaman (termasuk /admin) tidak bisa disematkan di iframe situs lain (clickjacking).
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
      {
        // Service worker (fitur 6) tidak boleh di-cache browser/CDN — versi baru harus langsung terbaca.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
}
