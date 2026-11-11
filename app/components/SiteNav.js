'use client'
import { useT, useLang } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getFavorites, FAVS_EVENT } from '../../lib/favorites'
import { fetchFavNew, markFavNewSeen, NEWFAV_EVENT } from '../../lib/favNew'
import { BIAS_EVENT } from '../../lib/bias'
import { DISPLAY_NAME } from '../../lib/gallery'

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
  ['/linimasa', '🕰️', 'Linimasa era'],
  ['/banding', '⇆', 'Bandingkan era'],
  ['/koleksi', '📁', 'Koleksiku'],
  ['/kuis', '❓', 'Tebak member'],
]

function aktif(path, href) {
  if (href === '/') return path === '/'
  if (href === '/galeri' && path.startsWith('/idol/')) return true // album idol = bagian galeri
  return path === href || path.startsWith(href + '/')
}

export default function SiteNav({ className = '' }) {
  const path = usePathname() || ''
  const t = useT()
  const { lang, setLang } = useLang()
  const [favCount, setFavCount] = useState(0)
  const [baru, setBaru] = useState({ count: 0, members: [] }) // fitur 12

  useEffect(() => {
    let alive = true
    const sync = () => fetchFavNew().then((v) => { if (alive) setBaru(v) }).catch(() => {})
    sync()
    window.addEventListener(NEWFAV_EVENT, sync)
    window.addEventListener(BIAS_EVENT, sync)
    return () => { alive = false; window.removeEventListener(NEWFAV_EVENT, sync); window.removeEventListener(BIAS_EVENT, sync) }
  }, [])

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
    <nav aria-label={t('Navigasi utama')} className={`flex flex-wrap justify-center gap-1.5 ${className}`}>
      {LINKS.map(([href, label]) => {
        const on = aktif(path, href)
        return (
          <Link key={href} href={href} aria-current={on ? 'page' : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition sm:text-sm ${on
              ? 'border-plum bg-plum text-milk dark:border-gold dark:bg-gold dark:text-plum'
              : 'border-rose/50 bg-white/70 text-plum hover:bg-rose/20 dark:border-rose/20 dark:bg-white/10 dark:text-milk dark:hover:bg-white/15'}`}>
            {t(label)}
            {href === '/favorit' && favCount > 0 && <span className="ml-1 tabular-nums opacity-70">({favCount})</span>}
          </Link>
        )
      })}
      {baru.count > 0 && (
        // Fitur 12: lencana foto baru dari member favorit. Hilang setelah diketuk (atau membuka galeri).
        <Link href={baru.members.length === 1 ? `/galeri?idol=${encodeURIComponent(baru.members[0])}` : '/galeri'} onClick={markFavNewSeen}
          aria-label={t('{n} foto baru dari member favoritmu', { n: baru.count })}
          className="rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-plum shadow sm:text-sm">
          ♥ {t('{n} baru', { n: baru.count })}{baru.members.length === 1 ? ` · ${DISPLAY_NAME[baru.members[0]] || baru.members[0]}` : ''}
        </Link>
      )}
      <span className="flex w-full flex-wrap justify-center gap-x-4 gap-y-1 pt-1">
        {EXTRA.map(([href, emoji, label]) => (
          <Link key={href} href={href} aria-current={aktif(path, href) ? 'page' : undefined}
            className={`text-xs font-bold underline-offset-4 hover:underline ${aktif(path, href) ? 'text-gold underline' : 'text-plum/60 dark:text-milk/60'}`}>
            <span aria-hidden>{emoji}</span> {t(label)}
          </Link>
        ))}
        {/* Fitur 12: pilihan bahasa. Indonesia bawaan; pilihan disimpan di perangkat. */}
        <span className="text-xs font-bold text-plum/60 dark:text-milk/60" role="group" aria-label={t('Bahasa')}>
          {[['id', 'ID'], ['en', 'EN']].map(([v, label], i) => (
            <span key={v}>
              {i > 0 && ' · '}
              <button type="button" onClick={() => setLang(v)} aria-pressed={lang === v} lang={v}
                aria-label={v === 'id' ? 'Bahasa Indonesia' : 'English'}
                className={lang === v ? 'text-gold underline underline-offset-4' : 'hover:underline'}>{label}</button>
            </span>
          ))}
        </span>
      </span>
    </nav>
  )
}
