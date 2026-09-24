'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { sb, ytId } from '../../../lib/supabase'
import { getFavorites, toggleFavorite } from '../../../lib/favorites'
import ThemeToggle from '../../components/ThemeToggle'
import Lightbox from '../../components/Lightbox'

const thumb = (it) => (it.type === 'youtube' ? `https://img.youtube.com/vi/${ytId(it.url)}/hqdefault.jpg` : it.url)

export default function IdolAlbum() {
  const { name } = useParams()
  const idol = decodeURIComponent(name)
  const [items, setItems] = useState(null)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('terbaru')
  const [favs, setFavs] = useState([])
  const [openIndex, setOpenIndex] = useState(null)
  const [autoplay, setAutoplay] = useState(false)

  useEffect(() => {
    sb.from('items').select('*').eq('idol', idol).order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
    setFavs(getFavorites())
  }, [idol])

  const shown = useMemo(() => {
    let list = items || []
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((i) => (i.title || '').toLowerCase().includes(s))
    }
    list = [...list]
    if (sort === 'terlama') list.reverse()
    if (sort === 'acak') list.sort(() => Math.random() - 0.5)
    return list
  }, [items, q, sort])

  const fotoCount = shown.filter((i) => i.type === 'photo').length
  const videoCount = shown.length - fotoCount

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      <ThemeToggle />
      <header className="py-14 text-center">
        <Link href="/" className="text-sm font-bold text-plum/60 dark:text-milk/60 hover:text-plum dark:hover:text-milk">← Semua idol</Link>
        <p className="text-gold text-2xl mt-4" aria-hidden>✦ ✧ ✦</p>
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2">{idol}</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">Album khusus {idol}</p>
        <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">{fotoCount} foto · {videoCount} video</p>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul…"
          className="w-full max-w-xs rounded-full border border-rose/50 dark:border-rose/25 bg-white/80 dark:bg-white/10 px-4 py-2 text-sm" />
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="rounded-full border border-rose/50 dark:border-rose/25 bg-white/80 dark:bg-white/10 px-3 py-2 text-sm font-bold">
          <option value="terbaru">Terbaru</option>
          <option value="terlama">Terlama</option>
          <option value="acak">Acak</option>
        </select>
        {shown.length > 1 && (
          <button onClick={() => { setOpenIndex(0); setAutoplay(true) }} className="rounded-full bg-plum text-milk font-bold px-4 py-2 text-sm">▶ Putar semua</button>
        )}
      </div>

      {items === null && <p className="text-center text-plum/60 dark:text-milk/60">Memuat album…</p>}
      {items && shown.length === 0 && <p className="text-center text-plum/60 dark:text-milk/60">Tidak ada yang cocok.</p>}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {shown.map((it, i) => (
          <button key={it.id} onClick={() => { setOpenIndex(i); setAutoplay(false) }} className="card mb-4 block w-full text-left break-inside-avoid">
            <div className="relative overflow-hidden rounded-2xl">
              {it.type === 'video'
                ? <video src={it.url + '#t=0.1'} preload="metadata" muted playsInline className="w-full" />
                : <img src={thumb(it)} alt={it.title || it.idol} loading="lazy" className="w-full" />}
              {it.type !== 'photo' && <span className="absolute inset-0 grid place-items-center text-4xl text-white drop-shadow-lg" aria-hidden>▶</span>}
              <span onClick={(e) => { e.stopPropagation(); e.preventDefault(); setFavs(toggleFavorite(it.id)) }}
                role="button" aria-label="Favoritkan" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/85 grid place-items-center text-base">
                {favs.includes(it.id) ? '❤️' : '🤍'}
              </span>
            </div>
            <p className="font-bold text-sm truncate px-2 py-2.5 dark:text-milk">{it.title || it.idol}</p>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox items={shown} index={openIndex} onIndexChange={setOpenIndex}
          onClose={() => { setOpenIndex(null); setAutoplay(false) }} autoplay={autoplay} />
      )}
    </main>
  )
}
