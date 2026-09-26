'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { sb, ytId } from '../lib/supabase'
import { getFavorites, toggleFavorite } from '../lib/favorites'
import ThemeToggle from './components/ThemeToggle'
import Lightbox from './components/Lightbox'
import Skeleton from './components/Skeleton'

const thumb = (it) => (it.type === 'youtube' ? `https://img.youtube.com/vi/${ytId(it.url)}/mqdefault.jpg` : it.url)

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function FilmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2.18" />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
    </svg>
  )
}

const sorts = [['terbaru', 'Terbaru'], ['terlama', 'Terlama'], ['acak', 'Acak']]

function weekNumber(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t - yStart) / 86400000 + 1) / 7)
}

export default function Home() {
  const [items, setItems] = useState(null)
  const [idol, setIdol] = useState('Semua')
  const [group, setGroup] = useState('Semua')
  const [era, setEra] = useState('Semua')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('terbaru')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef(null)
  const [mediaType, setMediaType] = useState('semua') // 'semua' | 'foto' | 'video'
  const [favs, setFavs] = useState([])
  const [openIndex, setOpenIndex] = useState(null)
  const [autoplay, setAutoplay] = useState(false)
  const [spot, setSpot] = useState(null) // { items:[it], index:0 } untuk sorotan/on-this-day
  const [visibleCount, setVisibleCount] = useState(40)

  useEffect(() => {
    sb.from('items').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
    setFavs(getFavorites())
  }, [])

  const idols = ['Semua', ...new Set((items || []).map((i) => i.idol))]
  const groups = [...new Set((items || []).map((i) => i.group_name).filter(Boolean))]
  const eras = [...new Set((items || []).map((i) => i.era).filter(Boolean))]

  const idolCover = useMemo(() => {
    const map = {}
    for (const it of items || []) if (!map[it.idol] && it.type !== 'youtube') map[it.idol] = thumb(it)
    return map
  }, [items])

  const featured = useMemo(() => {
    if (!items || items.length === 0) return null
    const idx = weekNumber(new Date()) % items.length
    return items[idx]
  }, [items])

  const onThisDay = useMemo(() => {
    if (!items) return []
    const now = new Date()
    return items.filter((it) => {
      const d = new Date(it.created_at)
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() !== now.getFullYear()
    })
  }, [items])

  const shown = useMemo(() => {
    let list = (items || []).filter((i) => idol === 'Semua' || i.idol === idol)
    if (mediaType !== 'semua') list = list.filter((i) => (mediaType === 'foto' ? i.type === 'photo' : i.type !== 'photo'))
    if (group !== 'Semua') list = list.filter((i) => i.group_name === group)
    if (era !== 'Semua') list = list.filter((i) => i.era === era)
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter((i) => (i.title || '').toLowerCase().includes(s) || i.idol.toLowerCase().includes(s))
    }
    list = [...list]
    if (sort === 'terlama') list.reverse()
    if (sort === 'acak') list.sort(() => Math.random() - 0.5)
    return list
  }, [items, idol, group, era, q, sort, mediaType])

  const fotoCount = shown.filter((i) => i.type === 'photo').length
  const videoCount = shown.length - fotoCount
  const visible = shown.slice(0, visibleCount)

  useEffect(() => { setVisibleCount(40) }, [idol, group, era, q, sort, mediaType])

  useEffect(() => {
    if (!sortOpen) return
    const close = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setSortOpen(false) }
    document.addEventListener('mousedown', close)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('keydown', onKey) }
  }, [sortOpen])

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
        <p className="flex justify-center items-center" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-rose" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-gold -ml-3 mt-2.5" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </p>
        <h1 className="font-display text-5xl sm:text-7xl text-plum dark:text-milk mt-2">Hearts2Hearts Gallery</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">Koleksi foto & video idol favoritku</p>
        <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">{fotoCount} foto · {videoCount} video</p>
        <p className="mt-4 flex justify-center gap-5 text-sm font-bold text-gold">
          <Link href="/favorit" className="underline underline-offset-4">♥ Favoritku ({favs.length})</Link>
          <Link href="/tentang" className="underline underline-offset-4">✦ Tentang</Link>
        </p>
      </header>

      {featured && (
        <section className="mb-10">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gold mb-3">✦ Sorotan Minggu Ini</p>
          <button onClick={() => setSpot({ items: [featured], index: 0 })} className="featured-card block w-full max-w-xl mx-auto overflow-hidden">
            <div className="relative overflow-hidden rounded-2xl">
              {featured.type === 'video'
                ? <video src={featured.url + '#t=0.1'} preload="metadata" muted playsInline className="w-full max-h-80 object-cover" />
                : featured.type === 'youtube'
                  ? <img src={`https://img.youtube.com/vi/${ytId(featured.url)}/maxresdefault.jpg`}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = thumb(featured) }}
                      alt={featured.title || featured.idol} className="w-full aspect-video object-cover" />
                  : <img src={thumb(featured)} alt={featured.title || featured.idol} className="w-full max-h-80 object-cover" />}
              {featured.type !== 'photo' && <span className="absolute inset-0 grid place-items-center text-5xl text-white drop-shadow-lg" aria-hidden>▶</span>}
            </div>
            <p className="px-3 py-3 font-bold dark:text-milk">{featured.title || featured.idol} <span className="text-gold text-sm">· {featured.idol}</span></p>
          </button>
        </section>
      )}

      {onThisDay.length > 0 && (
        <section className="mb-10 text-center">
          <button onClick={() => setSpot({ items: onThisDay, index: 0 })}
            className="inline-block rounded-full bg-lilac/40 dark:bg-lilac/15 border border-lilac/60 dark:border-lilac/25 px-4 py-2 text-sm font-bold text-plum dark:text-milk">
            🗓️ {onThisDay.length} kenangan dari hari ini di tahun sebelumnya — lihat lagi
          </button>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <div className="relative w-full max-w-xs">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul atau nama idol…"
            className="w-full rounded-full border border-rose/50 dark:border-rose/25 bg-white/80 dark:bg-white/10 px-4 py-2 pr-9 text-sm" />
          {q && (
            <button onClick={() => setQ('')} aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-plum/50 dark:text-milk/50 hover:text-plum dark:hover:text-milk">✕</button>
          )}
        </div>
        <div ref={sortRef} className="relative">
          <button onClick={() => setSortOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={sortOpen}
            className="rounded-full border border-rose/50 dark:border-rose/25 bg-white/80 dark:bg-white/10 px-3 py-2 text-sm font-bold inline-flex items-center gap-1.5">
            {sorts.find((s) => s[0] === sort)[1]}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition ${sortOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {sortOpen && (
            <ul role="listbox" aria-label="Urutkan"
              className="absolute z-30 mt-2 left-0 w-36 overflow-hidden rounded-2xl border border-rose/50 dark:border-rose/25 bg-milk dark:bg-plum shadow-xl page-fade-in">
              {sorts.map(([v, label]) => (
                <li key={v}>
                  <button role="option" aria-selected={sort === v}
                    onClick={() => { setSort(v); setSortOpen(false) }}
                    className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center justify-between ${sort === v ? 'text-plum dark:text-milk bg-rose/25 dark:bg-white/10' : 'text-plum/70 dark:text-milk/70 hover:bg-rose/10 dark:hover:bg-white/5'}`}>
                    {label}
                    {sort === v && <span className="text-gold">✓</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {shown.length > 1 && (
          <button onClick={() => { setOpenIndex(0); setAutoplay(true) }} className="rounded-full bg-plum text-milk font-bold px-4 py-2 text-sm">▶ Putar semua</button>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {[['semua', 'Semua', null], ['foto', 'Foto', CameraIcon], ['video', 'Video', FilmIcon]].map(([v, label, Icon]) => (
          <button key={v} onClick={() => setMediaType(v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${mediaType === v ? 'bg-rose text-plum border-rose' : 'bg-white/60 dark:bg-white/10 border-rose/40 dark:border-rose/20'}`}>
            {Icon && <Icon />}{label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {idols.map((n) => (
          <button key={n} onClick={() => setIdol(n)}
            className={`flex items-center gap-1.5 pl-1.5 pr-4 py-1.5 rounded-full font-bold text-sm border transition ${idol === n ? 'bg-plum text-milk border-plum' : 'bg-white/70 dark:bg-white/10 border-rose/50 dark:border-rose/20 hover:bg-rose/20'}`}>
            {n !== 'Semua' && idolCover[n] ? (
              <img src={idolCover[n]} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : n === 'Semua' ? <span className="h-6 w-6 rounded-full bg-gold/30 grid place-items-center text-xs">✦</span> : null}
            {n}
          </button>
        ))}
      </div>

      {groups.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {['Semua', ...groups].map((n) => (
            <button key={n} onClick={() => setGroup(n)}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${group === n ? 'bg-gold text-plum border-gold' : 'bg-white/60 dark:bg-white/10 border-rose/40 dark:border-rose/20'}`}>
              {n}
            </button>
          ))}
        </div>
      )}

      {eras.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {['Semua', ...eras].map((n) => (
            <button key={n} onClick={() => setEra(n)}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${era === n ? 'bg-lilac text-plum border-lilac' : 'bg-white/60 dark:bg-white/10 border-rose/40 dark:border-rose/20'}`}>
              {n}
            </button>
          ))}
        </div>
      )}

      {idol !== 'Semua' && (
        <p className="text-center mt-2 mb-8">
          <Link href={`/idol/${encodeURIComponent(idol)}`} className="text-sm font-bold text-gold underline underline-offset-4">
            Buka album {idol} sendiri →
          </Link>
        </p>
      )}

      {items === null && <Skeleton />}
      {items && shown.length === 0 && <p className="text-center text-plum/60 dark:text-milk/60">Tidak ada yang cocok.</p>}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {visible.map((it) => (
          <div key={it.id} className="card mb-4 w-full break-inside-avoid">
            <button onClick={() => { setOpenIndex(shown.findIndex((x) => x.id === it.id)); setAutoplay(false) }} className="block w-full text-left">
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
              <p className="font-bold text-sm truncate px-2 pt-2.5 dark:text-milk">{it.title || it.idol}</p>
            </button>
            <Link href={`/idol/${encodeURIComponent(it.idol)}`} className="block px-2 pb-2.5 text-xs text-gold font-bold hover:underline w-fit">
              {it.idol}{it.group_name ? ` · ${it.group_name}` : ''}
            </Link>
          </div>
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
      {spot && (
        <Lightbox items={spot.items} index={spot.index} onIndexChange={(i) => setSpot({ ...spot, index: i })} onClose={() => setSpot(null)} />
      )}
    </main>
  )
}
