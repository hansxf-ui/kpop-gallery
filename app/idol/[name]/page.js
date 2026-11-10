'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { sb, fetchAllItems } from '../../../lib/supabase'
import { getFavorites, toggleFavorite, FAVS_EVENT } from '../../../lib/favorites'
import { ALBUM_KEYS, DISPLAY_NAME, namesOf, matchesQuery, shuffleStable, newSeed } from '../../../lib/gallery'
import ThemeToggle from '../../components/ThemeToggle'
import SiteNav from '../../components/SiteNav'
import Lightbox from '../../components/Lightbox'
import GalleryCard from '../../components/GalleryCard'
import AutoLoadMore from '../../components/AutoLoadMore'
import ScrollTopButton from '../../components/ScrollTopButton'
import Skeleton from '../../components/Skeleton'

export default function IdolAlbum() {
  const { name } = useParams()
  const idol = decodeURIComponent(name)
  const [items, setItems] = useState(null)
  const [total, setTotal] = useState(null)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('terbaru')
  const [seed, setSeed] = useState(0)
  const [era, setEra] = useState('Semua')
  const [favs, setFavs] = useState([])
  const [openIndex, setOpenIndex] = useState(null)
  const [autoplay, setAutoplay] = useState(false)
  const [visibleCount, setVisibleCount] = useState(40)

  const key = idol.toUpperCase()
  const valid = ALBUM_KEYS.includes(key)
  // "JIWOO" / "jiwoo" di URL -> judul "Jiwoo"
  const nama = DISPLAY_NAME[key] || idol
  const [loadError, setLoadError] = useState(false)
  function loadItems() {
    setLoadError(false)
    setItems(null)
    // Database hanya mengirim item yang nama idolnya memuat member ini (dulu seluruh ±1.200 item
    // dimuat lalu disaring di HP). Saringan namesOf tetap dipakai untuk kecocokan nama yang persis.
    // key sudah tervalidasi ALBUM_KEYS (huruf, angka, '-'), jadi aman dipakai di pola ilike.
    fetchAllItems({ filter: (q) => q.ilike('idol', `%${key}%`) })
      .then((all) => setItems(all.filter((it) => namesOf(it).includes(key))))
      .catch(() => { setItems([]); setLoadError(true) })
  }
  useEffect(() => { document.title = `${nama} · Hearts2Hearts Gallery` }, [nama])
  useEffect(() => {
    if (valid) loadItems()
    else setItems([])
    sb.from('items').select('id', { count: 'exact', head: true }).then(({ count }) => setTotal(count ?? null))
    setFavs(getFavorites())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idol])
  useEffect(() => {
    const sync = () => setFavs(getFavorites())
    window.addEventListener(FAVS_EVENT, sync)
    return () => window.removeEventListener(FAVS_EVENT, sync)
  }, [])

  const eras = [...new Set((items || []).map((i) => i.era).filter(Boolean))]

  const shown = useMemo(() => {
    let list = items || []
    if (era !== 'Semua') list = list.filter((i) => i.era === era)
    if (q.trim()) list = list.filter((i) => matchesQuery(i, q))
    list = [...list]
    if (sort === 'terlama') list.reverse()
    if (sort === 'acak') list = shuffleStable(list, seed)
    return list
  }, [items, q, sort, seed, era])

  const fotoCount = shown.filter((i) => i.type === 'photo').length
  const videoCount = shown.length - fotoCount
  const pct = total && items ? Math.round((items.length / total) * 100) : null
  const visible = shown.slice(0, visibleCount)

  useEffect(() => { setVisibleCount(40) }, [q, sort, era])

  function onFav(it, x, y) {
    const wasFav = favs.includes(it.id)
    setFavs(toggleFavorite(it.id))
    if (!wasFav) window.dispatchEvent(new CustomEvent('h2h:favorite', { detail: { x, y } }))
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="pt-16 pb-12 text-center">
        <SiteNav className="mb-8" />
        <p className="text-gold text-2xl" aria-hidden>✦ ✧ ✦</p>
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2">{nama}</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">Album khusus {nama}</p>
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
        <div className="search-group w-full max-w-xs">
          <svg className="search-icon" aria-hidden="true" viewBox="0 0 24 24"><g><path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path></g></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul atau era…" type="search" className="search-input" />
        </div>
        <select value={sort} aria-label="Urutkan" onChange={(e) => { setSort(e.target.value); if (e.target.value === 'acak') setSeed(newSeed()) }}
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
      {!valid && items !== null && (
        <div className="py-10 text-center">
          <p className="font-display text-2xl text-plum dark:text-milk">Member tidak ditemukan</p>
          <p className="mt-2 text-sm text-plum/60 dark:text-milk/60">Tidak ada member bernama “{idol}” di Hearts2Hearts.</p>
          <Link href="/galeri" className="mt-4 inline-block rounded-full bg-plum px-5 py-2 text-sm font-bold text-milk dark:bg-gold dark:text-plum">Lihat semua koleksi</Link>
        </div>
      )}
      {valid && loadError && (
        <div className="py-10 text-center">
          <p className="font-bold text-plum dark:text-milk">Gagal memuat album.</p>
          <p className="mt-1 text-sm text-plum/60 dark:text-milk/60">Periksa koneksimu, lalu coba lagi.</p>
          <button onClick={loadItems} className="mt-4 rounded-full bg-plum px-5 py-2 text-sm font-bold text-milk dark:bg-gold dark:text-plum">Coba lagi</button>
        </div>
      )}
      {valid && !loadError && items && shown.length === 0 && <p className="text-center text-plum/60 dark:text-milk/60">Tidak ada yang cocok.</p>}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {visible.map((it) => (
          <GalleryCard key={it.id} it={it} isFav={favs.includes(it.id)} showIdol={false}
            onOpen={() => { setOpenIndex(shown.findIndex((x) => x.id === it.id)); setAutoplay(false) }}
            onFav={(x, y) => onFav(it, x, y)} />
        ))}
      </div>

      <AutoLoadMore hasMore={shown.length > visible.length} remaining={shown.length - visible.length}
        onMore={() => setVisibleCount((c) => Math.min(c + 40, shown.length))} />

      {openIndex !== null && (
        <Lightbox items={shown} index={openIndex} onIndexChange={setOpenIndex}
          onClose={() => { setOpenIndex(null); setAutoplay(false) }} autoplay={autoplay} />
      )}
      <ScrollTopButton />
    </main>
  )
}
