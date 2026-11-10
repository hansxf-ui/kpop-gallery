'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getFavorites, FAVS_EVENT } from '../../lib/favorites'

// Satu-satunya navigasi situs — dipakai di semua halaman supaya isi dan gayanya sama
// (dulu tiap halaman punya baris link sendiri dengan isi berbeda-beda).
const LINKS = [
  ['/', 'Beranda'],
  ['/galeri', 'Galeri'],
  ['/favorit', 'Favoritku'],
  ['/jadwal', 'Jadwal'],
  ['/voting', 'Voting'],
  ['/tentang', 'Tentang'],
]

// Halaman tambahan — baris tautan kecil di bawah navigasi utama supaya baris utama tidak penuh di HP.
const EXTRA = [
  ['/linimasa', '🕰️ Linimasa era'],
  ['/koleksi', '📁 Koleksiku'],
]

function aktif(path, href) {
  if (href === '/') return path === '/'
  if (href === '/galeri' && path.startsWith('/idol/')) return true // album idol = bagian galeri
  return path === href || path.startsWith(href + '/')
}

export default function SiteNav({ className = '' }) {
  const path = usePathname() || ''
  const [favCount, setFavCount] = useState(0)

  useEffect(() => {
    const sync = () => setFavCount(getFavorites().length)
    sync()
    window.addEventListener(FAVS_EVENT, sync)
    window.addEventListener('storage', sync) // favorit diubah di tab lain
    return () => {
      window.removeEventListener(FAVS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return (
    <nav aria-label="Navigasi utama" className={`flex flex-wrap justify-center gap-1.5 ${className}`}>
      {LINKS.map(([href, label]) => {
        const on = aktif(path, href)
        return (
          <Link key={href} href={href} aria-current={on ? 'page' : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition sm:text-sm ${on
              ? 'border-plum bg-plum text-milk dark:border-gold dark:bg-gold dark:text-plum'
              : 'border-rose/50 bg-white/70 text-plum hover:bg-rose/20 dark:border-rose/20 dark:bg-white/10 dark:text-milk dark:hover:bg-white/15'}`}>
            {label}
            {href === '/favorit' && favCount > 0 && <span className="ml-1 tabular-nums opacity-70">({favCount})</span>}
          </Link>
        )
      })}
      <span className="flex w-full flex-wrap justify-center gap-x-4 gap-y-1 pt-1">
        {EXTRA.map(([href, label]) => (
          <Link key={href} href={href} aria-current={aktif(path, href) ? 'page' : undefined}
            className={`text-xs font-bold underline-offset-4 hover:underline ${aktif(path, href) ? 'text-gold underline' : 'text-plum/60 dark:text-milk/60'}`}>
            {label}
          </Link>
        ))}
      </span>
    </nav>
  )
}
