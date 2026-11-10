'use client'
import Link from 'next/link'
import { useT, useDocTitle } from '../../lib/i18n'

// Isi halaman 404 — komponen klien supaya ikut bahasa aktif. Metadata (judul awal) tetap di server.
export default function NotFoundContent() {
  const t = useT()
  useDocTitle('Tidak Ditemukan')
  return (
    <div className="pt-16 pb-24 text-center">
      <p className="text-gold text-2xl" aria-hidden>✦ ✧ ✦</p>
      <h1 className="font-display text-6xl text-plum dark:text-milk mt-3">404</h1>
      <p className="mt-3 font-bold text-plum/70 dark:text-milk/70">{t('Halaman ini tidak ditemukan.')}</p>
      <p className="mt-1 text-sm text-plum/50 dark:text-milk/50">{t('Mungkin alamatnya salah ketik, atau halamannya sudah pindah.')}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/galeri" className="rounded-full bg-plum px-5 py-2.5 text-sm font-bold text-milk dark:bg-gold dark:text-plum">{t('Ke Galeri')}</Link>
        <Link href="/" className="rounded-full border border-rose/50 px-5 py-2.5 text-sm font-bold text-plum dark:text-milk">{t('Beranda')}</Link>
      </div>
    </div>
  )
}
