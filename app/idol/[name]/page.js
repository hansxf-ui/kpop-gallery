'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { sb, ytId } from '../../../lib/supabase'
import { getFavorites, toggleFavorite } from '../../../lib/favorites'
import ThemeToggle from '../../components/ThemeToggle'
import Lightbox from '../../components/Lightbox'
import Skeleton from '../../components/Skeleton'

const thumb = (it) => (it.type === 'youtube' ? `https://img.youtube.com/vi/${ytId(it.url)}/hqdefault.jpg` : it.url)

export default function IdolAlbum() {
  const { name } = useParams()
  const idol = decodeURIComponent(name)
  const [items, setItems] = useState(null)
  const [total, setTotal] = useState(null)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('terbaru')
  const [era, setEra] = useState('Semua')
  const [favs, setFavs] = useState([])
  const [openIndex, setOpenIndex] = useState(null)
  const [autoplay, setAutoplay] = useState(false)
  const [visibleCount, setVisibleCount] = useState(40)

  useEffect(() => {
    sb.from('items').select('*').eq('idol', idol).order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
    sb.from('items').select('id', { count: 'exact', head: true }).then(({ count }) => setTotal(count ?? null))
    setFavs(getFavorites())
  }, [idol])

  const eras = [...new Set((items || []).map((i) => i.era).filter(Boolean))]

  const shown = useMemo(() => {
    let list = items || []
    if (era !== 'Semua') list = list.filter((i) => i.era === era)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((i) => (i.title || '').toLowerCase().includes(s))
    }
    list = [...list]
    if (sort === 'terlama') list.reverse()
    if (sort === 'acak') list.sort(() => Math.random() - 0.5)
    return list
  }, [items, q, sort, era])

  const fotoCount = shown.filter((i) => i.type === 'photo').length
  const videoCount = shown.length - fotoCount
  const pct = total && items ? Math.round((items.length / total) * 100) : null
  const visible = shown.slice(0, visibleCount)

  useEffect(() => { setVisibleCount(40) }, [q, sort, era])

  function onFav(it, e) {
    e.stopPropagation(); e.preventDefault()
    const wasFav = favs.includes(it.id)
    setFavs(toggleFavorite(it.id))
    if (!wasFav) window.dispatchEvent(new CustomEvent('h2h:favorite', { detail: { x: e.clientX, y: e.clientY } }))
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="py-14 text-center">
        <Link href="/" className="text-sm font-bold text-plum/60 dark:text-milk/60 hover:text-plum dark:hover:text-milk">← Semua idol</Link>
        <p className="text-gold text-2xl mt-4" aria-hidden>✦ ✧ ✦</p>
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2">{idol}</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">Album khusus {idol}</p>
        <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">{fotoCount} foto · {videoCount} video</p>
        {pct !== null && (
          <div className="mx-auto mt-3 max-w-xs">
            <div className="h-1.5 rounded-full bg-rose/20 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[11px] text-plum/50 dark:text-milk/50 mt-1">{pct}% dari seluruh koleksi galeri</p>
          </div>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
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

      {eras.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {['Semua', ...eras].map((n) => (
            <button key={n} onClick={() => setEra(n)}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${era === n ? 'bg-lilac text-plum border-lilac' : 'bg-white/60 dark:bg-white/10 border-rose/40 dark:border-rose/20'}`}>
              {n}
            </button>
          ))}
        </div>
      )}

      {items === null && <Skeleton />}
      {items && shown.length === 0 && <p className="text-center text-plum/60 dark:text-milk/60">Tidak ada yang cocok.</p>}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {visible.map((it) => (
          <button key={it.id} onClick={() => { setOpenIndex(shown.findIndex((x) => x.id === it.id)); setAutoplay(false) }} className="card mb-4 block w-full text-left break-inside-avoid">
            <div className="relative overflow-hidden rounded-2xl">
              {it.type === 'video'
                ? <video src={it.url + '#t=0.1'} preload="metadata" muted playsInline className="w-full" />
                : <img src={thumb(it)} alt={it.title || it.idol} loading="lazy" className="w-full" />}
              {it.type !== 'photo' && <span className="absolute inset-0 grid place-items-center text-4xl text-white drop-shadow-lg" aria-hidden>▶</span>}
              <span onClick={(e) => onFav(it, e)} role="button" aria-label="Favoritkan"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/85 grid place-items-center text-base">
                {favs.includes(it.id) ? '❤️' : '🤍'}
              </span>
            </div>
            <p className="font-bold text-sm truncate px-2 py-2.5 dark:text-milk">{it.title || it.idol}</p>
          </button>
        ))}
      </div>

      {shown.length > visible.length && (
        <p className="text-center mt-6">
          <button onClick={() => setVisibleCount((c) => c + 40)} className="rounded-full bg-white/80 dark:bg-white/10 border border-rose/40 dark:border-rose/20 font-bold px-5 py-2 text-sm">
            Muat lebih banyak ({shown.length - visible.length} lagi)
          </button>
        </p>
      )}

      {openIndex !== null && (
        <Lightbox items={shown} index={openIndex} onIndexChange={setOpenIndex}
          onClose={() => { setOpenIndex(null); setAutoplay(false) }} autoplay={autoplay} />
      )}
    </main>
  )
}
