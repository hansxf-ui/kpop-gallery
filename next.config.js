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
}
