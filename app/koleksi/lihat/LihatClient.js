'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchItemsByIds } from '../../../lib/supabase'
import { decodeCollection, importCollection } from '../../../lib/collections'
import { getFavorites, toggleFavorite, FAVS_EVENT } from '../../../lib/favorites'
import { useT, useDocTitle } from '../../../lib/i18n'
import SiteNav from '../../components/SiteNav'
import GalleryCard from '../../components/GalleryCard'
import Masonry from '../../components/Masonry'
import Lightbox from '../../components/Lightbox'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'

// Album bersama (fitur 7): isi koleksi dari kode bagikan, tampil read-only tanpa impor.
// Kode didekode di browser (format H2HK1- yang sama dengan kode bagikan) — tidak ada server baru.
export default function LihatClient() {
  const t = useT()
  const [col, setCol] = useState(undefined) // undefined = memuat; null = kode tidak valid
  const [err, setErr] = useState('')
  const [items, setItems] = useState(null)
  const [favs, setFavs] = useState([])
  const [openIndex, setOpenIndex] = useState(null)
  const [saved, setSaved] = useState(null)
  useDocTitle(col ? null : 'Album bersama')

  useEffect(() => {
    const kode = new URLSearchParams(window.location.search).get('kode') || ''
    try { setCol(decodeCollection(kode)) } catch (e) { setCol(null); setErr(e.message) }
    setFavs(getFavorites())
    const sync = () => setFavs(getFavorites())
    window.addEventListener(FAVS_EVENT, sync)
    return () => window.removeEventListener(FAVS_EVENT, sync)
  }, [])

  useEffect(() => {
    if (col) document.title = `${col.name} · Hearts2Hearts Gallery`
    if (!col) return
    if (col.ids.length === 0) { setItems([]); return }
    let alive = true
    fetchItemsByIds(col.ids).then((rows) => {
      if (!alive) return
      const pos = new Map(col.ids.map((id, i) => [id, i])) // urutan sesuai kode
      setItems(rows.sort((a, b) => pos.get(a.id) - pos.get(b.id)))
    }).catch(() => { if (alive) { setItems([]); setErr('Gagal memuat isi koleksi. Periksa koneksimu.') } })
    return () => { alive = false }
  }, [col])

  function simpan() {
    const kode = new URLSearchParams(window.location.search).get('kode') || ''
    try { const c = importCollection(kode); setSaved(c) } catch (e) { setErr(e.message) }
  }

  const hilang = col && items ? col.ids.length - items.length : 0
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 page-fade-in">
      <header className="pt-16 pb-10 text-center">
        <SiteNav className="mb-8" />
        <p className="flex justify-center text-gold" aria-hidden><Icon name="folderHeart" size={30} /></p>
        <p className="text-xs font-bold uppercase tracking-widest text-gold">{t('Album bersama')}</p>
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2 break-words">{col ? col.name : t('Album bersama')}</h1>
        {col && items && <p className="mt-3 font-bold text-plum/70 dark:text-milk/70">{t('{n} item tersimpan', { n: items.length })}</p>}
        {col && (
          <p className="mt-4">
            {saved
              ? <Link href={`/koleksi?k=${saved.id}`} className="text-sm font-bold text-gold underline underline-offset-4">{t('Tersimpan di Koleksiku sebagai “{nama}” →', { nama: saved.name })}</Link>
              : <button onClick={simpan} className="rounded-full bg-plum px-4 py-2 text-sm font-bold text-milk dark:bg-gold dark:text-plum"><Icon name="folderHeart" size={15} className="mr-1.5" />{t('Simpan ke Koleksiku')}</button>}
          </p>
        )}
        <p className="mt-2 text-xs text-plum/50 dark:text-milk/50">{t('Hanya untuk dilihat — album ini tidak berubah walau kamu menyimpannya.')}</p>
      </header>

      {col === null && (
        <div className="py-6 text-center">
          <p className="font-bold text-plum dark:text-milk">{t('Kode album tidak valid.')}</p>
          {err && <p className="mt-1 text-sm text-plum/60 dark:text-milk/60">{t(err)}</p>}
          <Link href="/koleksi" className="mt-4 inline-block rounded-full bg-plum px-5 py-2 text-sm font-bold text-milk dark:bg-gold dark:text-plum">{t('Koleksiku')}</Link>
        </div>
      )}
      {col && items === null && <Skeleton count={4} />}
      {col && err && <p role="status" className="mb-4 text-center text-sm font-bold text-plum dark:text-milk">{t(err)}</p>}
      {col && items && items.length === 0 && !err && <p className="text-center text-plum/60 dark:text-milk/60">{t('Koleksi ini masih kosong.')}</p>}
      {hilang > 0 && <p className="mb-4 text-center text-xs text-plum/50 dark:text-milk/50">{t('{n} item di kode ini sudah tidak ada di galeri.', { n: hilang })}</p>}

      <Masonry items={items || []} renderItem={(it, i) => (
        <GalleryCard key={it.id} it={it} isFav={favs.includes(it.id)} onOpen={() => setOpenIndex(i)}
          onFav={(x, y) => {
            const was = favs.includes(it.id)
            setFavs(toggleFavorite(it.id))
            if (!was) window.dispatchEvent(new CustomEvent('h2h:favorite', { detail: { x, y } }))
          }} />
      )} />

      {openIndex !== null && items && items[openIndex] && (
        <Lightbox items={items} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </main>
  )
}
