'use client'
import { useEffect, useState } from 'react'
import { sb } from '../../lib/supabase'
import { getFavorites, setFavorites, toggleFavorite, FAVS_EVENT } from '../../lib/favorites'
import ThemeToggle from '../components/ThemeToggle'
import SiteNav from '../components/SiteNav'
import Lightbox from '../components/Lightbox'
import GalleryCard from '../components/GalleryCard'
import ScrollTopButton from '../components/ScrollTopButton'
import Skeleton from '../components/Skeleton'
import FavTransfer from '../components/FavTransfer'

export default function Favorit() {
  const [items, setItems] = useState(null) // null = sedang memuat
  const [favs, setFavs] = useState([])
  const [loadError, setLoadError] = useState(false)
  const [openIndex, setOpenIndex] = useState(null)
  const [autoplay, setAutoplay] = useState(false)

  function load() {
    const ids = getFavorites()
    setFavs(ids)
    setLoadError(false)
    if (ids.length === 0) { setItems([]); return }
    setItems(null)
    sb.from('items').select('*').in('id', ids).then(({ data, error }) => {
      if (error) { setItems([]); setLoadError(true); return }
      const rows = data || []
      // Urutkan sesuai kapan difavoritkan (terbaru di atas) — hasil .in() dari database tidak berurutan.
      const urutan = new Map(ids.map((id, i) => [id, i]))
      rows.sort((a, b) => urutan.get(b.id) - urutan.get(a.id))
      // Item yang sudah dihapus admin tidak ikut dihitung lagi di jumlah favorit.
      if (rows.length < ids.length) {
        const ada = new Set(rows.map((r) => r.id))
        setFavs(setFavorites(getFavorites().filter((id) => ada.has(id))))
      }
      setItems(rows)
    })
  }

  useEffect(() => { document.title = 'Favoritku · Hearts2Hearts Gallery' }, [])
  useEffect(() => { load() }, [])
  // Hati bisa diubah dari lightbox — ikon di grid ikut berubah, tapi kartunya tidak langsung
  // hilang (supaya urutan lightbox yang sedang terbuka tidak bergeser).
  useEffect(() => {
    const sync = () => setFavs(getFavorites())
    window.addEventListener(FAVS_EVENT, sync)
    return () => window.removeEventListener(FAVS_EVENT, sync)
  }, [])

  function onFav(it) {
    const wasFav = favs.includes(it.id)
    setFavs(toggleFavorite(it.id))
    if (wasFav) setItems((cur) => cur.filter((x) => x.id !== it.id))
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="pt-16 pb-12 text-center">
        <SiteNav className="mb-8" />
        <p className="text-gold text-2xl" aria-hidden>♥ ♥ ♥</p>
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2">Favoritku</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">{items === null ? 'Memuat…' : `${items.length} item tersimpan`}</p>
        <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">Favorit tersimpan di perangkat ini saja.</p>
        {items && items.length > 1 && (
          <p className="mt-4">
            <button onClick={() => { setOpenIndex(0); setAutoplay(true) }} className="rounded-full bg-plum text-milk font-bold px-4 py-2 text-sm">▶ Putar semua</button>
          </p>
        )}
      </header>

      {items !== null && <FavTransfer onImported={load} />}
      {items === null && <Skeleton />}
      {items && !loadError && items.length === 0 && (
        <p className="text-center text-plum/60 dark:text-milk/60">Belum ada favorit. Ketuk ikon hati di galeri untuk menyimpan.</p>
      )}
      {loadError && (
        <div className="py-6 text-center">
          <p className="font-bold text-plum dark:text-milk">Gagal memuat favorit.</p>
          <p className="mt-1 text-sm text-plum/60 dark:text-milk/60">Periksa koneksimu, lalu coba lagi.</p>
          <button onClick={load} className="mt-4 rounded-full bg-plum px-5 py-2 text-sm font-bold text-milk dark:bg-gold dark:text-plum">Coba lagi</button>
        </div>
      )}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {(items || []).map((it, i) => (
          <GalleryCard key={it.id} it={it} isFav={favs.includes(it.id)}
            onOpen={() => { setOpenIndex(i); setAutoplay(false) }}
            onFav={() => onFav(it)} />
        ))}
      </div>

      {openIndex !== null && items && items[openIndex] && (
        <Lightbox items={items} index={openIndex} onIndexChange={setOpenIndex}
          onClose={() => { setOpenIndex(null); setAutoplay(false) }} autoplay={autoplay} />
      )}
      <ScrollTopButton />
    </main>
  )
}
