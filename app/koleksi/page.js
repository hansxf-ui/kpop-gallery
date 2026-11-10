'use client'
import { useEffect, useState } from 'react'
import { fetchItemsByIds } from '../../lib/supabase'
import { getFavorites, toggleFavorite, FAVS_EVENT } from '../../lib/favorites'
import {
  getCollections, createCollection, renameCollection, deleteCollection, toggleInCollection,
  pruneCollection, encodeCollection, importCollection, COLL_EVENT,
} from '../../lib/collections'
import ThemeToggle from '../components/ThemeToggle'
import SiteNav from '../components/SiteNav'
import GalleryCard from '../components/GalleryCard'
import Lightbox from '../components/Lightbox'
import ConfirmModal from '../components/ConfirmModal'
import Skeleton from '../components/Skeleton'

const tombol = 'rounded-full bg-white/80 dark:bg-white/10 border border-rose/40 dark:border-rose/20 font-bold px-4 py-2 text-sm disabled:opacity-50'

// Koleksiku (fitur 8): daftar koleksi bernama + isi koleksi yang dipilih.
export default function Koleksi() {
  const [list, setList] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [items, setItems] = useState(null)
  const [favs, setFavs] = useState([])
  const [openIndex, setOpenIndex] = useState(null)
  const [newName, setNewName] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [renaming, setRenaming] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => { document.title = 'Koleksiku · Hearts2Hearts Gallery' }, [])
  useEffect(() => {
    const sync = () => setList(getCollections())
    const syncFav = () => setFavs(getFavorites())
    sync(); syncFav()
    const k = new URLSearchParams(window.location.search).get('k')
    if (k) setActiveId(k)
    window.addEventListener(COLL_EVENT, sync)
    window.addEventListener(FAVS_EVENT, syncFav)
    return () => { window.removeEventListener(COLL_EVENT, sync); window.removeEventListener(FAVS_EVENT, syncFav) }
  }, [])

  const active = list.find((c) => c.id === activeId) || null
  const activeIds = active ? active.ids.join(',') : ''

  // Muat isi koleksi aktif (urut sesuai urutan ditambahkan, terbaru di atas).
  useEffect(() => {
    if (!active) { setItems(null); return }
    if (active.ids.length === 0) { setItems([]); return }
    let alive = true
    setItems(null)
    fetchItemsByIds(active.ids).then((rows) => {
      if (!alive) return
      const pos = new Map(active.ids.map((id, i) => [id, i]))
      rows.sort((a, b) => pos.get(b.id) - pos.get(a.id))
      if (rows.length < active.ids.length) pruneCollection(active.id, rows.map((r) => r.id))
      setItems(rows)
    }).catch(() => { if (alive) { setItems([]); setMsg('Gagal memuat isi koleksi. Periksa koneksimu.') } })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, activeIds])

  function pilih(id) {
    setActiveId(id); setMsg(''); setRenaming('')
    const u = new URL(window.location.href)
    if (id) u.searchParams.set('k', id); else u.searchParams.delete('k')
    window.history.replaceState(window.history.state, '', u.pathname + u.search)
  }

  function buat(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const c = createCollection(newName)
    setNewName('')
    pilih(c.id)
  }

  async function salinKode() {
    const kode = encodeCollection(active)
    try { await navigator.clipboard.writeText(kode); setMsg('Kode koleksi disalin ✓ — kirim ke teman, lalu impor di halaman ini.') }
    catch { setCode(kode); setMsg('Tidak bisa menyalin otomatis — kode ditampilkan di kolom impor, salin manual.') }
  }

  function impor() {
    try {
      const c = importCollection(code)
      setCode('')
      pilih(c.id)
      setMsg(`Koleksi "${c.name}" ditambahkan (${c.ids.length} item) ✓`)
    } catch (e) { setMsg(e.message) }
  }

  function onFav(it, x, y) {
    const was = favs.includes(it.id)
    setFavs(toggleFavorite(it.id))
    if (!was) window.dispatchEvent(new CustomEvent('h2h:favorite', { detail: { x, y } }))
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="pt-16 pb-10 text-center">
        <SiteNav className="mb-8" />
        <p className="text-gold text-2xl" aria-hidden>📁</p>
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2">Koleksiku</h1>
        <p className="mt-3 font-bold text-plum/70 dark:text-milk/70">Kelompokkan foto favoritmu sendiri, mis. “Carmen era Focus”.</p>
        <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">Tersimpan di perangkat ini. Tambahkan foto lewat tombol 📁 Koleksi saat foto dibuka.</p>
      </header>

      <section className="mx-auto mb-8 max-w-2xl">
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Daftar koleksi">
          {list.map((c) => (
            <button key={c.id} onClick={() => pilih(c.id)} aria-pressed={c.id === activeId}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold ${c.id === activeId ? 'border-plum bg-plum text-milk dark:border-gold dark:bg-gold dark:text-plum' : 'border-rose/50 bg-white/70 dark:border-rose/20 dark:bg-white/10'}`}>
              {c.name} <span className="opacity-60">({c.ids.length})</span>
            </button>
          ))}
        </div>
        <form onSubmit={buat} className="mx-auto mt-4 flex max-w-sm gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} placeholder="Nama koleksi baru…" aria-label="Nama koleksi baru"
            className="min-w-0 flex-1 rounded-full border border-rose/50 bg-white px-4 py-2 text-sm dark:border-rose/25 dark:bg-white/10 dark:text-milk" />
          <button disabled={!newName.trim()} className="rounded-full bg-plum px-4 py-2 text-sm font-bold text-milk disabled:opacity-50 dark:bg-gold dark:text-plum">Buat</button>
        </form>
        <details className="mx-auto mt-4 max-w-sm text-sm">
          <summary className="cursor-pointer text-center font-bold text-plum/70 dark:text-milk/70">Impor koleksi dari kode teman</summary>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={3} placeholder="Tempel kode H2HK1-… di sini" aria-label="Kode koleksi"
            className="mt-2 w-full rounded-xl border border-rose/60 bg-white px-3 py-2 font-mono text-xs dark:border-rose/25 dark:bg-white/10 dark:text-milk" />
          <button onClick={impor} disabled={!code.trim()} className={`${tombol} mt-2`}>Impor kode</button>
        </details>
        {msg && <p role="status" className="mt-3 text-center text-sm font-bold text-plum dark:text-milk">{msg}</p>}
      </section>

      {active && (
        <section aria-label={`Koleksi ${active.name}`}>
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {renaming !== '' ? (
              <form onSubmit={(e) => { e.preventDefault(); renameCollection(active.id, renaming); setRenaming('') }} className="flex gap-2">
                <input autoFocus value={renaming} onChange={(e) => setRenaming(e.target.value)} maxLength={60} aria-label="Nama baru"
                  className="rounded-full border border-rose/50 bg-white px-4 py-2 text-sm dark:bg-white/10 dark:text-milk" />
                <button className={tombol}>Simpan</button>
                <button type="button" onClick={() => setRenaming('')} className={tombol}>Batal</button>
              </form>
            ) : (
              <>
                <h2 className="mr-2 font-display text-3xl text-plum dark:text-milk">{active.name}</h2>
                <button onClick={() => setRenaming(active.name)} className={tombol}>Ganti nama</button>
                <button onClick={salinKode} disabled={active.ids.length === 0} className={tombol}>🔗 Salin kode bagikan</button>
                <button onClick={() => setPendingDelete(active)} className={`${tombol} text-red-600 dark:text-red-300`}>Hapus</button>
              </>
            )}
          </div>
          {items === null && <Skeleton count={4} />}
          {items && items.length === 0 && <p className="text-center text-plum/60 dark:text-milk/60">Koleksi ini masih kosong.</p>}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {(items || []).map((it, i) => (
              <div key={it.id} className="relative">
                <GalleryCard it={it} isFav={favs.includes(it.id)} onOpen={() => setOpenIndex(i)} onFav={(x, y) => onFav(it, x, y)} />
                <button onClick={() => { toggleInCollection(active.id, it.id); setItems((cur) => cur.filter((x) => x.id !== it.id)) }}
                  aria-label={`Keluarkan ${it.title || it.idol} dari koleksi`}
                  className="absolute left-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-sm font-bold text-plum shadow-sm">✕</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {openIndex !== null && items && items[openIndex] && (
        <Lightbox items={items} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
      <ConfirmModal
        open={!!pendingDelete}
        title="Hapus koleksi ini?"
        message={pendingDelete ? `${pendingDelete.name} — foto di galeri tidak ikut terhapus.` : ''}
        confirmLabel="Ya, hapus"
        onConfirm={() => { deleteCollection(pendingDelete.id); setPendingDelete(null); pilih(null) }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  )
}
