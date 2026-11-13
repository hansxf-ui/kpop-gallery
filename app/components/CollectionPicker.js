'use client'
import { useT } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCollections, createCollection, toggleInCollection, COLL_EVENT } from '../../lib/collections'
import Icon from './Icon'

// Tombol "Koleksi" di lightbox (fitur 8): centang koleksi tempat foto ini disimpan,
// atau buat koleksi baru langsung berisi foto ini.
export default function CollectionPicker({ itemId }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [list, setList] = useState([])
  const [name, setName] = useState('')
  useEffect(() => {
    const sync = () => setList(getCollections())
    sync()
    window.addEventListener(COLL_EVENT, sync)
    return () => window.removeEventListener(COLL_EVENT, sync)
  }, [])
  const inCount = list.filter((c) => c.ids.includes(itemId)).length

  function buat(e) {
    e.preventDefault()
    if (!name.trim()) return
    createCollection(name, [itemId])
    setName('')
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="px-3 py-1.5 rounded-full bg-white/90 text-plum font-bold text-sm">
        <Icon name="folderHeart" size={14} className="mr-1.5" />{t('Koleksi')}{inCount ? ` (${inCount})` : ''}
      </button>
      {open && (
        // HP: panel di bawah layar selebar layar (dulu popup 256px di tengah tombol terpotong di tepi
        // kiri/kanan karena lightbox overflow-x-hidden). Layar lebar: popup di atas tombol seperti semula.
        <div role="dialog" aria-label={t('Koleksi')}
          // Escape menutup panel ini saja (dulu langsung menutup seluruh lightbox).
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }}
          className="fixed inset-x-3 bottom-3 z-[60] rounded-2xl bg-milk p-3 text-left text-sm text-plum shadow-xl dark:bg-plum dark:text-milk sm:absolute sm:inset-x-auto sm:bottom-full sm:left-1/2 sm:mb-2 sm:w-64 sm:-translate-x-1/2">
          <button type="button" onClick={() => setOpen(false)} aria-label={t('Tutup')} className="float-right -mt-1 px-1 font-bold opacity-60 hover:opacity-100">✕</button>
          {list.length === 0 && <p className="mb-2 text-xs opacity-70">{t('Belum ada koleksi. Buat yang pertama:')}</p>}
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {list.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-rose/15">
                  <input type="checkbox" checked={c.ids.includes(itemId)} onChange={() => toggleInCollection(c.id, itemId)} />
                  <span className="flex-1 truncate font-bold">{c.name}</span>
                  <span className="text-xs opacity-60">{c.ids.length}</span>
                </label>
              </li>
            ))}
          </ul>
          <form onSubmit={buat} className="mt-2 flex gap-1.5">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t('Nama koleksi baru…')} aria-label={t('Nama koleksi baru')}
              className="min-w-0 flex-1 rounded-full border border-rose/50 bg-white px-3 py-1 text-xs text-plum dark:bg-white/10 dark:text-milk" />
            <button disabled={!name.trim()} className="rounded-full bg-plum px-3 py-1 text-xs font-bold text-milk disabled:opacity-50 dark:bg-gold dark:text-plum">{t('Buat')}</button>
          </form>
          <Link href="/koleksi" className="mt-2 block text-center text-xs font-bold text-gold underline underline-offset-4">{t('Kelola koleksiku →')}</Link>
        </div>
      )}
    </div>
  )
}
