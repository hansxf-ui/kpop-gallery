import Link from 'next/link'
import ThemeToggle from './components/ThemeToggle'

export const metadata = { title: 'Tidak Ditemukan · Hearts2Hearts Gallery' }

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <div className="py-24 text-center">
        <p className="text-gold text-2xl" aria-hidden>✦ ✧ ✦</p>
        <h1 className="font-display text-6xl text-plum dark:text-milk mt-3">404</h1>
        <p className="mt-3 font-bold text-plum/70 dark:text-milk/70">Halaman ini tidak ditemukan.</p>
        <p className="mt-1 text-sm text-plum/50 dark:text-milk/50">Mungkin alamatnya salah ketik, atau halamannya sudah pindah.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/galeri" className="rounded-full bg-plum px-5 py-2.5 text-sm font-bold text-milk dark:bg-gold dark:text-plum">Ke Galeri</Link>
          <Link href="/" className="rounded-full border border-rose/50 px-5 py-2.5 text-sm font-bold text-plum dark:text-milk">Beranda</Link>
        </div>
      </div>
    </main>
  )
}
