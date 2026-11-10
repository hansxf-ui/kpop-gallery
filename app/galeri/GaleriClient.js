'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { fetchAllItems, imgOpt } from '../../lib/supabase'
import { getFavorites, toggleFavorite, FAVS_EVENT } from '../../lib/favorites'
import { parseGaleriQuery, replaceQuery, parseGaleriFilters, filterQueryPatch } from '../../lib/galeriUrl'
import { shareOrCopy } from '../../lib/share'
import { MEMBERS, namesOf, thumbOf as thumb, matchesQuery, shuffleStable, newSeed } from '../../lib/gallery'
import ThemeToggle from '../components/ThemeToggle'
import SiteNav from '../components/SiteNav'
import Lightbox from '../components/Lightbox'
import FeaturedCarousel from '../components/FeaturedCarousel'
import GalleryCard from '../components/GalleryCard'
import AutoLoadMore from '../components/AutoLoadMore'
import ScrollTopButton from '../components/ScrollTopButton'
import Skeleton from '../components/Skeleton'

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

export default function GaleriClient() {
  const [items, setItems] = useState(null)
  const [idol, setIdol] = useState('Semua')
  const [group, setGroup] = useState('Semua')
  const [era, setEra] = useState('Semua')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('terbaru')
  const [seed, setSeed] = useState(0) // kunci urutan "Acak" — hanya berganti saat Acak dipilih
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef(null)
  const [mediaType, setMediaType] = useState('semua') // 'semua' | 'foto' | 'video'
  const [favs, setFavs] = useState([])
  const [openIndex, setOpenIndex] = useState(null)
  const [autoplay, setAutoplay] = useState(false)
  const [spot, setSpot] = useState(null) // { items:[it], index:0 } untuk sorotan/on-this-day
  const [visibleCount, setVisibleCount] = useState(40)

  const [loadError, setLoadError] = useState(false)
  const [notice, setNotice] = useState('')
  const deepLinkDone = useRef(false) // ?item= di URL sudah diproses (sekali per kunjungan)
  const [urlReady, setUrlReady] = useState(false) // filter dari URL sudah dibaca
  const [shareMsg, setShareMsg] = useState('')
  function loadItems() {
    setLoadError(false)
    setItems(null)
    fetchAllItems().then(setItems).catch(() => { setItems([]); setLoadError(true) })
  }
  useEffect(() => { document.title = 'Galeri · Hearts2Hearts Gallery' }, [])
  useEffect(() => {
    loadItems()
    setFavs(getFavorites())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Favorit bisa berubah dari lightbox — samakan ikon hati di grid.
  useEffect(() => {
    const sync = () => setFavs(getFavorites())
    window.addEventListener(FAVS_EVENT, sync)
    return () => window.removeEventListener(FAVS_EVENT, sync)
  }, [])

  const idols = ['Semua', ...MEMBERS, 'Hearts2Hearts']

  // Fitur 7: filter dibaca dari URL sekali saat halaman dibuka (di efek, bukan saat render,
  // supaya HTML server dan klien sama), lalu setiap perubahan filter ditulis balik ke URL.
  useEffect(() => {
    const f = parseGaleriFilters(window.location.search, idols.slice(1))
    setIdol(f.idol); setGroup(f.group); setEra(f.era); setMediaType(f.mediaType); setQ(f.q); setSort(f.sort); setSeed(f.seed)
    setUrlReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (!urlReady) return
    // Ketikan pencarian ditunda sebentar supaya riwayat/URL tidak ditulis tiap huruf.
    const t = setTimeout(() => replaceQuery(filterQueryPatch({ idol, group, era, mediaType, q, sort, seed })), 300)
    return () => clearTimeout(t)
  }, [urlReady, idol, group, era, mediaType, q, sort, seed])

  async function shareView() {
    replaceQuery(filterQueryPatch({ idol, group, era, mediaType, q, sort, seed }))
    const u = new URL(window.location.href)
    u.searchParams.delete('item')
    const msg = await shareOrCopy(u.toString(), 'Hearts2Hearts Gallery')
    if (msg) { setShareMsg(msg); setTimeout(() => setShareMsg(''), 2200) }
  }
  const groups = [...new Set((items || []).map((i) => i.group_name).filter(Boolean))]
  const eras = [...new Set((items || []).map((i) => i.era).filter(Boolean))]

  const idolCover = useMemo(() => {
    const map = {}
    const photos = (items || []).filter((it) => it.type !== 'youtube')
    // Pass 1: utamakan foto solo member / foto grup persis buat avatar chip
    for (const it of photos) {
      const names = namesOf(it)
      if (names.length === 1 && !map[names[0]]) map[names[0]] = imgOpt(thumb(it), 100)
      if (it.idol === 'Hearts2Hearts' && !map['Hearts2Hearts']) map['Hearts2Hearts'] = imgOpt(thumb(it), 100)
    }
    // Pass 2: fallback — foto unit apa pun yang memuat membernya
    for (const it of photos) for (const n of namesOf(it)) if (!map[n]) map[n] = imgOpt(thumb(it), 100)
    return map
  }, [items])

  // Sorotan minggu ini: 5 item dipilih menyebar dari seluruh koleksi, titik mulai bergeser tiap minggu
  const featuredList = useMemo(() => {
    if (!items || items.length === 0) return []
    const n = Math.min(5, items.length)
    const step = Math.max(1, Math.floor(items.length / n))
    const start = weekNumber(new Date()) % items.length
    const out = []
    for (let i = 0; i < n; i++) out.push(items[(start + i * step) % items.length])
    return out
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
    let list = (items || []).filter((i) => {
      if (idol === 'Semua') return true
      if (idol === 'Hearts2Hearts') return i.idol === 'Hearts2Hearts'
      return namesOf(i).includes(idol) // member: cocokkan solo maupun unit yang memuat dia
    })
    if (mediaType !== 'semua') list = list.filter((i) => (mediaType === 'foto' ? i.type === 'photo' : i.type !== 'photo'))
    if (group !== 'Semua') list = list.filter((i) => i.group_name === group)
    if (era !== 'Semua') list = list.filter((i) => i.era === era)
    if (q.trim()) list = list.filter((i) => matchesQuery(i, q))
    list = [...list]
    if (sort === 'terlama') list.reverse()
    if (sort === 'acak') list = shuffleStable(list, seed)
    return list
  }, [items, idol, group, era, q, sort, seed, mediaType])

  const filtered = idol !== 'Semua' || group !== 'Semua' || era !== 'Semua' || mediaType !== 'semua' || q.trim() !== ''
  function resetFilters() {
    setIdol('Semua'); setGroup('Semua'); setEra('Semua'); setMediaType('semua'); setQ('')
  }

  // Link langsung: /galeri?item=<id> membuka item itu di lightbox begitu koleksi selesai dimuat.
  // Kalau item tersaring/belum termuat di grid, dibuka sendirian (spot) supaya tetap tampil.
  useEffect(() => {
    if (!items || loadError || !urlReady || deepLinkDone.current) return
    deepLinkDone.current = true
    const { item } = parseGaleriQuery(window.location.search)
    if (!item) return
    const idx = shown.findIndex((x) => x.id === item)
    if (idx >= 0) { setOpenIndex(idx); setAutoplay(false); return }
    const it = items.find((x) => x.id === item)
    if (it) setSpot({ items: [it], index: 0 })
    else { setNotice('Item yang dibagikan sudah tidak ada di galeri.'); replaceQuery({ item: null }) }
  }, [items, loadError, urlReady, shown])

  // URL selalu menunjuk item yang sedang dibuka (bisa langsung disalin dari address bar);
  // ditutup = parameter item dihapus.
  const currentId = openIndex !== null ? shown[openIndex]?.id ?? null : spot ? spot.items[spot.index]?.id ?? null : null
  useEffect(() => {
    if (deepLinkDone.current) replaceQuery({ item: currentId })
  }, [currentId])

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
        <p className="flex justify-center items-center" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-rose" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-gold -ml-3 mt-2.5" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </p>
        <h1 className="font-display text-5xl sm:text-7xl text-plum dark:text-milk mt-2">Hearts2Hearts Gallery</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">Koleksi foto & video idol favoritku</p>
        <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">{fotoCount} foto · {videoCount} video</p>
      </header>

      {featuredList.length > 0 && (
        <section className="mb-10">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gold mb-3">✦ Sorotan Minggu Ini</p>
          <FeaturedCarousel items={featuredList} onOpen={(i) => setSpot({ items: featuredList, index: i })} />
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
        <div className="search-group w-full max-w-xs">
          <svg className="search-icon" aria-hidden="true" viewBox="0 0 24 24"><g><path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path></g></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul, idol, atau era…" type="search" className="search-input" />
          {q && (
            <button onClick={() => setQ('')} aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 font-bold text-plum/50 dark:text-milk/50 hover:text-plum dark:hover:text-milk">✕</button>
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
                    onClick={() => { setSort(v); if (v === 'acak') setSeed(newSeed()); setSortOpen(false) }}
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

      {filtered && (
        <p className="mb-4 text-center">
          <button onClick={shareView} className="text-xs font-bold text-plum/60 underline underline-offset-4 hover:text-plum dark:text-milk/60 dark:hover:text-milk">
            🔗 Bagikan tampilan ini
          </button>
          {shareMsg && <span role="status" className="ml-2 text-xs font-bold text-gold">{shareMsg}</span>}
        </p>
      )}

      {idol !== 'Semua' && (
        <p className="text-center mt-2 mb-8">
          <Link href={`/idol/${encodeURIComponent(idol)}`} className="text-sm font-bold text-gold underline underline-offset-4">
            Buka album {idol} sendiri →
          </Link>
        </p>
      )}

      {notice && (
        <p role="status" className="mx-auto mb-6 w-fit rounded-full bg-lilac/40 px-4 py-2 text-sm font-bold text-plum dark:bg-lilac/15 dark:text-milk">
          {notice} <button onClick={() => setNotice('')} aria-label="Tutup pesan" className="ml-2">✕</button>
        </p>
      )}
      {items === null && <Skeleton />}
      {loadError && (
        <div className="py-10 text-center">
          <p className="font-bold text-plum dark:text-milk">Gagal memuat koleksi.</p>
          <p className="mt-1 text-sm text-plum/60 dark:text-milk/60">Periksa koneksimu, lalu coba lagi. Sedang offline? Foto favorit tetap bisa dilihat di <Link href="/favorit" className="font-bold text-gold underline underline-offset-4">Favoritku</Link>.</p>
          <button onClick={loadItems} className="mt-4 rounded-full bg-plum px-5 py-2 text-sm font-bold text-milk dark:bg-gold dark:text-plum">Coba lagi</button>
        </div>
      )}
      {items && !loadError && shown.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-plum/60 dark:text-milk/60">Tidak ada yang cocok.</p>
          {filtered && (
            <button onClick={resetFilters} className="mt-3 rounded-full border border-rose/50 bg-white/80 px-4 py-1.5 text-sm font-bold dark:border-rose/25 dark:bg-white/10">
              Reset filter
            </button>
          )}
        </div>
      )}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {visible.map((it) => (
          <GalleryCard key={it.id} it={it} isFav={favs.includes(it.id)}
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
      {spot && (
        <Lightbox items={spot.items} index={spot.index} onIndexChange={(i) => setSpot({ ...spot, index: i })} onClose={() => setSpot(null)} />
      )}
      <ScrollTopButton />
    </main>
  )
}
