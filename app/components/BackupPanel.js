'use client'
import { useRef, useState } from 'react'
import { buildBackup, parseBackup, restoreBackup } from '../../lib/backup'
import { downloadBlob } from '../../lib/download'
import { useT } from '../../lib/i18n'

// Fitur 10: cadangan favorit + koleksi dalam satu file. Dipakai di /favorit dan /koleksi.
export default function BackupPanel({ onRestored }) {
  const t = useT()
  const [msg, setMsg] = useState('')
  const fileRef = useRef(null)

  function ekspor() {
    downloadBlob(new Blob([buildBackup()], { type: 'application/json' }), `cadangan-h2h-${new Date().toISOString().slice(0, 10)}.json`)
    setMsg(t('File cadangan diunduh ✓ — buka file ini di HP baru lewat tombol Pulihkan.'))
  }

  async function impor(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const r = restoreBackup(parseBackup(await f.text()))
      setMsg(r.favorit || r.koleksi ? t('Dipulihkan ✓ — {f} favorit baru, {k} koleksi baru.', { f: r.favorit, k: r.koleksi }) : t('Semua isi file ini sudah ada di perangkat ini.'))
      if (r.favorit || r.koleksi) onRestored?.()
    } catch (err) { setMsg(t(err.message)) }
  }

  const tombol = 'rounded-full bg-white/80 dark:bg-white/10 border border-rose/40 dark:border-rose/20 font-bold px-4 py-2 text-sm'
  return (
    <div className="mx-auto mb-10 max-w-md rounded-3xl border border-gold/50 bg-white/70 p-4 text-center text-sm dark:border-gold/30 dark:bg-white/5">
      <p className="font-bold text-plum dark:text-milk">💾 {t('Cadangan lengkap: favorit + koleksi')}</p>
      <p className="mt-1 text-xs text-plum/55 dark:text-milk/55">{t('Satu file untuk pindah HP. Pulihkan menambahkan ke yang sudah ada — tidak ada yang terhapus.')}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button onClick={ekspor} className={tombol}>{t('Unduh cadangan')}</button>
        <button onClick={() => fileRef.current?.click()} className={tombol}>{t('Pulihkan dari file…')}</button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={impor} className="hidden" />
      </div>
      {msg && <p role="status" className="mt-2 font-bold text-plum dark:text-milk">{msg}</p>}
    </div>
  )
}
