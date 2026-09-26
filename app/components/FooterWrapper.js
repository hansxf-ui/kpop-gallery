'use client'
import { usePathname } from 'next/navigation'
import Footer from './Footer'

// Footer tampil di semua halaman KECUALI /tentang,
// karena halaman Tentang sudah memuat deskripsi & disclaimer yang sama.
export default function FooterWrapper() {
  const pathname = usePathname()
  if (pathname === '/tentang') return null
  return <Footer />
}
