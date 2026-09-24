'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { sb, ytId } from '../lib/supabase'
import { getFavorites, toggleFavorite } from '../lib/favorites'
import ThemeToggle from './components/ThemeToggle'
import Lightbox from './components/Lightbox'

const thumb = (it) => (it.type === 'youtube' ? `https://img.youtube.com/vi/${ytId(it.url)}/hqdefault.jpg` : it.url)

export default function Home() {
  const [items, setItems] = useState(null)
  const [idol, setIdol] = useState('Semua')
  const [group, setGroup] = useState('Semua')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('terbaru')
  const [favs, setFavs] = useState([])
  const [openIndex, setOpenIndex] = useState(null)
  const [autoplay, setAutoplay] = useState(false)

  useEffect(() => {
    sb.from('items').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
    setFavs(getFavorites())
  }, [])

  const idols = ['Semua', ...new Set((items || []).map((i) => i.idol))]
  const groups = [...new Set((items || []).map((i) => i.group_name).filter(Boolean))]

  const shown = useMemo(() => {
    let list = (items || []).filter((i) => idol === 'Semua' || i.idol === idol)
    if (group !== 'Semua') list = list.filter((i) => i.group_name === group)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((i) => (i.title || '').toLowerCase().includes(s) || i.idol.toLowerCase().includes(s))
    }
    list = [...list]
    if (sort === 'terlama') list.reverse()
    if (sort === 'acak') list.sort(() => Math.random() - 0.5)
    return list
  }, [items, idol, group, q, sort])

  const fotoCount = shown.filter((i) => i.type === 'photo').length
  const videoCount = shown.length - fotoCount

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      <ThemeToggle />
      <header className="py-14 text-center">
        <p className="text-gold text-2xl" aria-hidden>✦ ✧ ✦</p>
        <h1 className="font-display text-5xl sm:text-7xl text-plum dark:text-milk mt-2">Hearts2Hearts Gallery</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">Koleksi foto & video idol favoritku</p>
        <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">{fotoCount} foto · {videoCount} video</p>
        <p className="mt-4">
          <Link href="/favorit" className="text-sm font-bold text-gold underline underline-offset-4">♥ Lihat favoritku ({favs.length})</Link>
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul atau nama idol…"
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

      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {idols.map((n) => (
          <button key={n} onClick={() => setIdol(n)}
            className={`px-4 py-1.5 rounded-full font-bold text-sm border transition ${idol === n ? 'bg-plum text-milk border-plum' : 'bg-white/70 dark:bg-white/10 border-rose/50 dark:border-rose/20 hover:bg-rose/20'}`}>
            {n}
          </button>
        ))}
      </div>

      {groups.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {['Semua', ...groups].map((n) => (
            <button key={n} onClick={() => setGroup(n)}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${group === n ? 'bg-gold text-plum border-gold' : 'bg-white/60 dark:bg-white/10 border-rose/40 dark:border-rose/20'}`}>
              {n}
            </button>
          ))}
        </div>
      )}

      {idol !== 'Semua' && (
        <p className="text-center -mt-6 mb-8">
          <Link href={`/idol/${encodeURIComponent(idol)}`} className="text-sm font-bold text-gold underline underline-offset-4">
            Buka album {idol} sendiri →
          </Link>
        </p>
      )}

      {items === null && <p className="text-center text-plum/60 dark:text-milk/60">Memuat koleksi…</p>}
      {items && shown.length === 0 && <p className="text-center text-plum/60 dark:text-milk/60">Tidak ada yang cocok.</p>}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {shown.map((it, i) => (
          <div key={it.id} className="card mb-4 w-full break-inside-avoid">
            <button onClick={() => { setOpenIndex(i); setAutoplay(false) }} className="block w-full text-left">
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
              <p className="font-bold text-sm truncate px-2 pt-2.5 dark:text-milk">{it.title || it.idol}</p>
            </button>
            <Link href={`/idol/${encodeURIComponent(it.idol)}`} className="block px-2 pb-2.5 text-xs text-gold font-bold hover:underline w-fit">
              {it.idol}{it.group_name ? ` · ${it.group_name}` : ''}
            </Link>
          </div>
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox items={shown} index={openIndex} onIndexChange={setOpenIndex}
          onClose={() => { setOpenIndex(null); setAutoplay(false) }} autoplay={autoplay} />
      )}
    </main>
  )
}
