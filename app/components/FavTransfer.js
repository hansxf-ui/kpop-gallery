'use client'
import { useT } from '../../lib/i18n'
import { useRef, useState } from 'react'
import { getFavorites, setFavorites } from '../../lib/favorites'
import { downloadBlob } from '../../lib/download'
import { encodeFavCode, decodeFavCode, favFileContent, parseFavFile, mergeFavorites } from '../../lib/favoritesTransfer'
import Icon from './Icon'

// Ekspor/impor favorit (fitur 5). Impor MENGGABUNGKAN — favorit yang sudah ada tidak hilang.
export default function FavTransfer({ onImported }) {
  const t = useT()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const fileRef = useRef(null)
  const count = getFavorites().length

  async function salinKode() {
    const kode = encodeFavCode(getFavorites())
    try { await navigator.clipboard.writeText(kode); setMsg(t('Kode disalin ✓ — tempel di HP lain.')) }
    catch { setCode(kode); setMsg(t('Tidak bisa menyalin otomatis — kode ditampilkan di kolom, salin manual.')) }
  }

  function unduhFile() {
    const blob = new Blob([favFileContent(getFavorites())], { type: 'application/json' })
    downloadBlob(blob, `favorit-h2h-${new Date().toISOString().slice(0, 10)}.json`)
  }

  function terapkan(ids) {
    const { list, added } = mergeFavorites(getFavorites(), ids)
    setFavorites(list)
    setMsg(added ? t('{n} favorit baru ditambahkan ✓', { n: added }) : t('Semua favorit di kode/file ini sudah ada.'))
    if (added) onImported?.()
  }

  function imporKode() {
    try { terapkan(decodeFavCode(code)); setCode('') } catch (e) { setMsg(t(e.message)) }
  }

  async function imporFile(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try { terapkan(parseFavFile(await f.text())) } catch (err) { setMsg(t(err.message)) }
  }

  const tombol = 'rounded-full bg-white/80 dark:bg-white/10 border border-rose/40 dark:border-rose/20 font-bold px-4 py-2 text-sm disabled:opacity-50'
  return (
    <details className="mx-auto mb-10 max-w-md rounded-3xl border border-rose/40 bg-white/70 p-4 text-left dark:border-rose/20 dark:bg-white/5">
      <summary className="cursor-pointer text-center text-sm font-bold text-plum dark:text-milk"><Icon name="phone" size={15} className="mr-1.5" />{t('Pindahkan favorit ke HP lain')}</summary>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">{t('Ekspor')}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={salinKode} disabled={count === 0} className={tombol}>{t('Salin kode')}</button>
            <button onClick={unduhFile} disabled={count === 0} className={tombol}>{t('Unduh file (.json)')}</button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">{t('Impor')}</p>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={3} placeholder={t('Tempel kode H2H1-… di sini')}
            className="w-full rounded-xl border border-rose/60 bg-white px-3 py-2 font-mono text-xs dark:border-rose/25 dark:bg-white/10 dark:text-milk" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={imporKode} disabled={!code.trim()} className={tombol}>{t('Impor kode')}</button>
            <button onClick={() => fileRef.current?.click()} className={tombol}>{t('Pilih file…')}</button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={imporFile} className="hidden" />
          </div>
          <p className="mt-2 text-xs text-plum/50 dark:text-milk/50">{t('Impor menambahkan ke favorit yang sudah ada — tidak ada yang terhapus.')}</p>
        </div>
        {msg && <p role="status" className="font-bold text-plum dark:text-milk">{msg}</p>}
      </div>
    </details>
  )
}
