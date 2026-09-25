'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { sb, ytId } from '../../lib/supabase'
import { getFavorites, toggleFavorite } from '../../lib/favorites'
import ThemeToggle from '../components/ThemeToggle'
import Lightbox from '../components/Lightbox'
import Skeleton from '../components/Skeleton'

const thumb = (it) => (it.type === 'youtube' ? `https://img.youtube.com/vi/${ytId(it.url)}/hqdefault.jpg` : it.url)

export default function Favorit() {
  const [ids, setIds] = useState(null)
  const [items, setItems] = useState([])
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => { setIds(getFavorites()) }, [])

  useEffect(() => {
    if (ids === null) return
    if (ids.length === 0) { setItems([]); return }
    sb.from('items').select('*').in('id', ids).then(({ data }) => setItems(data || []))
  }, [ids])

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      <ThemeToggle />
      {ids === null && <Skeleton />}
      <header className="py-14 text-center">
        <Link href="/" className="text-sm font-bold text-plum/60 dark:text-milk/60 hover:text-plum dark:hover:text-milk">← Semua koleksi</Link>
        <p className="text-gold text-2xl mt-4" aria-hidden>♥ ♥ ♥</p>
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2">Favoritku</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">{items.length} item tersimpan</p>
      </header>

      {ids !== null && ids.length === 0 && (
        <p className="text-center text-plum/60 dark:text-milk/60">Belum ada favorit. Ketuk ikon hati di galeri untuk menyimpan.</p>
      )}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {items.map((it, i) => (
          <div key={it.id} className="card mb-4 w-full break-inside-avoid">
            <button onClick={() => setOpenIndex(i)} className="block w-full text-left">
              <div className="relative overflow-hidden rounded-2xl">
                {it.type === 'video'
                  ? <video src={it.url + '#t=0.1'} preload="metadata" muted playsInline className="w-full" />
                  : <img src={thumb(it)} alt={it.title || it.idol} loading="lazy" className="w-full" />}
                {it.type !== 'photo' && <span className="absolute inset-0 grid place-items-center text-4xl text-white drop-shadow-lg" aria-hidden>▶</span>}
                <span onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIds(toggleFavorite(it.id)); setItems((cur) => cur.filter((x) => x.id !== it.id)) }}
                  role="button" aria-label="Hapus dari favorit" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/85 grid place-items-center text-base">
                  ❤️
                </span>
              </div>
              <p className="font-bold text-sm truncate px-2 pt-2.5 dark:text-milk">{it.title || it.idol}</p>
            </button>
            <Link href={`/idol/${encodeURIComponent(it.idol)}`} className="block px-2 pb-2.5 text-xs text-gold font-bold hover:underline w-fit">
              {it.idol}{it.group_name ? ` · ${it.group_name}` : ''}
            </Link>
          </div>
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox items={items} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </main>
  )
}
