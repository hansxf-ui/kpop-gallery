'use client'
import { useT } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCollections, createCollection, toggleInCollection, COLL_EVENT } from '../../lib/collections'

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
        📁 {t('Koleksi')}{inCount ? ` (${inCount})` : ''}
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-2xl bg-milk p-3 text-left text-sm text-plum shadow-xl dark:bg-plum dark:text-milk">
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
