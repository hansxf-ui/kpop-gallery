'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useT } from '../lib/i18n'
import SiteNav from './components/SiteNav'

// Halaman cadangan kalau satu halaman error saat tampil (bug di kode, data rusak, dst.).
// Tanpa file ini Next.js menampilkan layar putih "Application error". Navigasi tetap ada, jadi
// pengunjung bisa pindah halaman atau mencoba lagi tanpa memuat ulang seluruh situs.
// Gagal memuat data dari Supabase TIDAK sampai ke sini — tiap halaman sudah punya pesannya sendiri.
export default function ErrorPage({ error, reset }) {
  const t = useT()
  useEffect(() => { console.error(error) }, [error])
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 page-fade-in">
      <SiteNav className="pt-16" />
      <div className="pt-16 pb-24 text-center" role="alert">
        <p className="text-gold text-2xl" aria-hidden>✦ ✧ ✦</p>
        <h1 className="font-display text-4xl text-plum dark:text-milk mt-3">{t('Ups, halaman ini error')}</h1>
        <p className="mt-3 font-bold text-plum/70 dark:text-milk/70">{t('Ada yang tidak beres saat menampilkan halaman ini.')}</p>
        <p className="mt-1 text-sm text-plum/50 dark:text-milk/50">{t('Coba lagi, atau buka halaman lain dulu.')}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => reset()} className="rounded-full bg-plum px-5 py-2.5 text-sm font-bold text-milk dark:bg-gold dark:text-plum">{t('Coba lagi')}</button>
          <Link href="/" className="rounded-full border border-rose/50 px-5 py-2.5 text-sm font-bold text-plum dark:text-milk">{t('Beranda')}</Link>
        </div>
      </div>
    </main>
  )
}
