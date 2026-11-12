'use client'
import { useMemo, useState } from 'react'
import { sb, imgOpt, isMissingColumn } from '../../lib/supabase'
import { dhashOfUrl, isHash, similarPairs } from '../../lib/dupes'
import { useT } from '../../lib/i18n'

const MIGRATION = 'supabase/migrations/20261115_14_photo_hash.sql'
const MAX_PAIRS = 40

// Kotak "Foto ganda" di admin: isi sidik foto lama, lalu cari pasangan foto yang mirip di koleksi.
// Tidak ada yang terhapus otomatis — tiap pasangan punya tombol Ubah/Hapus biasa.
export default function AdminDupes({ items, onChanged, onEdit, onDelete }) {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [showPairs, setShowPairs] = useState(false)

  const photos = useMemo(() => items.filter((it) => it.type === 'photo'), [items])
  // Dihitung ulang tiap daftar item berubah — foto yang baru dihapus langsung hilang dari daftar pasangan.
  const pairs = useMemo(() => (showPairs ? similarPairs(photos) : null), [showPairs, photos])
  const todo = photos.filter((it) => !isHash(it.phash))
  const columnMissing = items.length > 0 && !('phash' in items[0])

  async function backfill() {
    if (todo.length === 0) return setMsg(t('Semua foto sudah punya sidik ✓'))
    setBusy(true)
    let ok = 0, gagal = 0
    for (const it of todo) {
      try {
        const phash = await dhashOfUrl([imgOpt(it.url, 256), it.url])
        const { error } = await sb.from('items').update({ phash }).eq('id', it.id)
        if (error) {
          if (isMissingColumn(error)) { setBusy(false); return setMsg(t('Kolom phash belum ada — jalankan dulu {file}.', { file: MIGRATION })) }
          gagal++
        } else ok++
      } catch { gagal++ }
      setMsg(t('Menghitung… {ok}/{n}', { ok: ok + gagal, n: todo.length }))
    }
    setBusy(false)
    setMsg(gagal ? t('Selesai: {ok} foto dihitung, {gagal} gagal ✓', { ok, gagal }) : t('Selesai: {ok} foto dihitung ✓', { ok }))
    onChanged()
  }

  const side = (it) => (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <img src={imgOpt(it.url, 160)} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 text-xs">
        <p className="truncate font-bold">{it.idol} · {it.title || it.type}</p>
        <p className="text-plum/50 dark:text-milk/50">{String(it.created_at || '').slice(0, 10)}{it.width ? ` · ${it.width}×${it.height}` : ''}</p>
        <p className="mt-0.5 flex gap-3">
          <button onClick={() => onEdit(it)} className="font-bold text-gold">{t('Ubah')}</button>
          <button onClick={() => onDelete(it)} className="font-bold text-rose">{t('Hapus')}</button>
        </p>
      </div>
    </div>
  )

  return (
    <div className="mt-10 rounded-3xl bg-white/70 dark:bg-white/5 p-5 border border-rose/40 dark:border-rose/20">
      <h2 className="font-display text-2xl text-plum dark:text-milk mb-3">🔁 {t('Foto ganda')}</h2>
      <p className="text-xs text-plum/50 dark:text-milk/50 mb-3">
        {t('Setiap foto punya "sidik" yang tetap mirip walau fotonya diperkecil atau dikompres ulang. Upload baru dicek otomatis; tombol pertama menghitung sidik foto lama. Perlu migrasi')} <code>20261115_14_photo_hash.sql</code>.
      </p>
      {columnMissing ? (
        <p className="text-sm font-bold text-plum/70 dark:text-milk/70">{t('Kolom phash belum ada — jalankan dulu {file}.', { file: MIGRATION })}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button onClick={backfill} disabled={busy} className="rounded-full bg-gold text-plum font-bold px-4 py-2 text-sm disabled:opacity-50">
            {busy ? t('Menghitung…') : t('Hitung sidik foto lama ({n})', { n: todo.length })}
          </button>
          <button onClick={() => setShowPairs(true)} disabled={busy} className="rounded-full border border-rose/50 px-4 py-2 text-sm font-bold text-plum disabled:opacity-50 dark:text-milk">
            {t('Cari foto ganda di koleksi')}
          </button>
        </div>
      )}
      {msg && <p className="mt-2 text-sm font-bold dark:text-milk" role="status">{msg}</p>}
      {pairs && (
        <div className="mt-4">
          <p className="text-sm font-bold dark:text-milk" role="status">
            {pairs.length === 0 ? t('Tidak ada foto yang mirip ✓') : t('{n} pasangan foto mirip', { n: pairs.length })}
            {todo.length > 0 && <span className="font-normal"> · {t('{n} foto belum punya sidik dan belum ikut dicek.', { n: todo.length })}</span>}
          </p>
          <ul className="mt-2 space-y-2">
            {pairs.slice(0, MAX_PAIRS).map((p) => (
              <li key={`${p.a.id}-${p.b.id}`} className="rounded-xl bg-white p-2 dark:bg-white/10 dark:text-milk">
                <p className="mb-1 text-xs font-bold text-gold">{p.dist === 0 ? t('Hampir pasti sama') : t('Mirip (beda {n}/64)', { n: p.dist })}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {side(p.a)}
                  {side(p.b)}
                </div>
              </li>
            ))}
          </ul>
          {pairs.length > MAX_PAIRS && <p className="mt-2 text-xs text-plum/60 dark:text-milk/60">{t('Menampilkan {a} pasangan teratas. Sisanya muncul setelah yang ganda dihapus.', { a: MAX_PAIRS })}</p>}
        </div>
      )}
    </div>
  )
}
