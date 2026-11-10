'use client'
import { useT, useDocTitle } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import { fetchItemsByIds } from '../../lib/supabase'
import { getFavorites, setFavorites, toggleFavorite, FAVS_EVENT } from '../../lib/favorites'
import ThemeToggle from '../components/ThemeToggle'
import SiteNav from '../components/SiteNav'
import Lightbox from '../components/Lightbox'
import GalleryCard from '../components/GalleryCard'
import ScrollTopButton from '../components/ScrollTopButton'
import Skeleton from '../components/Skeleton'
import FavTransfer from '../components/FavTransfer'
import BackupPanel from '../components/BackupPanel'
import { readCachedRows, syncOffline } from '../../lib/offline'

export default function Favorit() {
  const t = useT()
  const [items, setItems] = useState(null) // null = sedang memuat
  const [favs, setFavs] = useState([])
  const [loadError, setLoadError] = useState(false)
  const [offline, setOffline] = useState(false) // menampilkan salinan tersimpan, bukan data terbaru
  const [openIndex, setOpenIndex] = useState(null)
  const [autoplay, setAutoplay] = useState(false)

  function load() {
    const ids = getFavorites()
    setFavs(ids)
    setLoadError(false)
    setOffline(false)
    if (ids.length === 0) { setItems([]); return }
    setItems(null)
    // Urutkan sesuai kapan difavoritkan (terbaru di atas) — hasil .in() dari database tidak berurutan.
    const urutan = new Map(ids.map((id, i) => [id, i]))
    const urut = (rows) => rows.sort((a, b) => urutan.get(b.id) - urutan.get(a.id))
    fetchItemsByIds(ids).then((data) => ({ data }), (error) => ({ error })).then(({ data, error }) => {
      if (error) {
        // Offline / database tidak terjangkau: pakai salinan tersimpan (fitur 6) kalau ada.
        const simpanan = readCachedRows().filter((r) => urutan.has(r.id))
        if (simpanan.length) { setItems(urut(simpanan)); setOffline(true); return }
        setItems([]); setLoadError(true); return
      }
      const rows = urut(data || [])
      // Item yang sudah dihapus admin tidak ikut dihitung lagi di jumlah favorit.
      if (rows.length < ids.length) {
        const ada = new Set(rows.map((r) => r.id))
        setFavs(setFavorites(getFavorites().filter((id) => ada.has(id))))
      }
      setItems(rows)
      syncOffline(rows).catch(() => {})
    })
  }

  useDocTitle('Favoritku')
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
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2">{t('Favoritku')}</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">{items === null ? t('Memuat…') : t('{n} item tersimpan', { n: items.length })}</p>
        <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">{t('Favorit tersimpan di perangkat ini saja.')}</p>
        {items && items.length > 1 && (
          <p className="mt-4">
            <button onClick={() => { setOpenIndex(0); setAutoplay(true) }} className="rounded-full bg-plum text-milk font-bold px-4 py-2 text-sm">▶ {t('Putar semua')}</button>
          </p>
        )}
      </header>

      {offline && (
        <p role="status" className="mx-auto mb-6 w-fit rounded-full bg-lilac/40 px-4 py-2 text-center text-sm font-bold text-plum dark:bg-lilac/15 dark:text-milk">
          📴 {t('Mode offline — menampilkan salinan favorit yang tersimpan di perangkat ini.')}
        </p>
      )}
      {items !== null && <FavTransfer onImported={load} />}
      {items !== null && <BackupPanel onRestored={load} />}
      {items === null && <Skeleton />}
      {items && !loadError && items.length === 0 && (
        <p className="text-center text-plum/60 dark:text-milk/60">{t('Belum ada favorit. Ketuk ikon hati di galeri untuk menyimpan.')}</p>
      )}
      {loadError && (
        <div className="py-6 text-center">
          <p className="font-bold text-plum dark:text-milk">{t('Gagal memuat favorit.')}</p>
          <p className="mt-1 text-sm text-plum/60 dark:text-milk/60">{t('Periksa koneksimu, lalu coba lagi.')}</p>
          <button onClick={load} className="mt-4 rounded-full bg-plum px-5 py-2 text-sm font-bold text-milk dark:bg-gold dark:text-plum">{t('Coba lagi')}</button>
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
