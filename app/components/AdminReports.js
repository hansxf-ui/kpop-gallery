'use client'
import { useT, useLocale } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import { sb, imgOpt } from '../../lib/supabase'
import { thumbOf } from '../../lib/gallery'
import { reasonLabel, isMissingTable } from '../../lib/reports'

// Antrean laporan foto di /admin (fitur 9). Hanya admin yang bisa membaca (RLS migrasi 08).
export default function AdminReports({ items, onEdit }) {
  const t = useT()
  const loc = useLocale()
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState('')
  const [lihatSelesai, setLihatSelesai] = useState(false)

  async function load() {
    setMsg('')
    let q = sb.from('reports').select('id, item_id, reason, detail, status, created_at').order('created_at', { ascending: false }).limit(200)
    if (!lihatSelesai) q = q.eq('status', 'baru')
    const { data, error } = await q
    if (error) { setRows([]); setMsg(isMissingTable(error) ? t('Tabel laporan belum ada — jalankan migrasi 20261112_08_reports.sql.') : t('Gagal memuat laporan: {pesan}', { pesan: error.message })); return }
    setRows(data || [])
  }
  useEffect(() => { load() }, [lihatSelesai]) // eslint-disable-line react-hooks/exhaustive-deps

  async function tandai(r, status) {
    const { data, error } = await sb.from('reports').update({ status }).eq('id', r.id).select('id')
    if (error) return setMsg(t('Gagal mengubah laporan: {pesan}', { pesan: error.message }))
    if (!data || data.length === 0) return setMsg(t('Perubahan tidak tersimpan — akun ini tidak punya izin, atau sesi sudah habis. Masuk ulang lalu coba lagi.'))
    load()
  }
  async function hapus(r) {
    const { data, error } = await sb.from('reports').delete().eq('id', r.id).select('id')
    if (error) return setMsg(t('Gagal menghapus laporan: {pesan}', { pesan: error.message }))
    if (!data || data.length === 0) return setMsg(t('Perubahan tidak tersimpan — akun ini tidak punya izin, atau sesi sudah habis. Masuk ulang lalu coba lagi.'))
    load()
  }

  const byId = new Map(items.map((it) => [it.id, it]))
  const fmt = (d) => new Date(d).toLocaleString(loc, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="mt-10 rounded-3xl bg-white/70 dark:bg-white/5 p-5 border border-rose/40 dark:border-rose/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl text-plum dark:text-milk">🚩 {t('Laporan foto')} {rows && !lihatSelesai ? `(${rows.length})` : ''}</h2>
        <label className="flex items-center gap-2 text-xs font-bold text-plum/60 dark:text-milk/60">
          <input type="checkbox" checked={lihatSelesai} onChange={(e) => setLihatSelesai(e.target.checked)} /> {t('Tampilkan yang sudah selesai')}
        </label>
      </div>
      {msg && <p className="mb-2 text-sm font-bold text-red-600 dark:text-red-300" role="status">{msg}</p>}
      {rows === null && <p className="text-sm text-plum/60 dark:text-milk/60">{t('Memuat…')}</p>}
      {rows && rows.length === 0 && !msg && <p className="text-sm text-plum/60 dark:text-milk/60">{t('Tidak ada laporan baru ✓')}</p>}
      <ul className="space-y-2">
        {(rows || []).map((r) => {
          const it = byId.get(r.item_id)
          return (
            <li key={r.id} className={`flex items-start gap-3 rounded-xl bg-white p-2 dark:bg-white/10 dark:text-milk ${r.status === 'selesai' ? 'opacity-60' : ''}`}>
              {it && it.type !== 'video'
                ? <img src={imgOpt(thumbOf(it), 120)} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-rose/20 text-xs">{it ? '▶' : '—'}</span>}
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-bold">{t(reasonLabel(r.reason))} <span className="text-xs font-normal opacity-60">· {fmt(r.created_at)}</span></p>
                <p className="truncate text-xs opacity-70">{it ? `${it.idol} · ${it.title || it.type}`  : t('Item sudah tidak ada')}</p>
                {r.detail && <p className="mt-0.5 text-xs">“{r.detail}”</p>}
                <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold">
                  {it && <button onClick={() => onEdit(it)} className="text-gold">{t('Ubah item')}</button>}
                  {it && <a href={`/galeri?item=${it.id}`} target="_blank" rel="noreferrer" className="text-gold">{t('Lihat')}</a>}
                  {r.status === 'baru'
                    ? <button onClick={() => tandai(r, 'selesai')} className="text-plum dark:text-milk">{t('Tandai selesai ✓')}</button>
                    : <button onClick={() => tandai(r, 'baru')} className="text-plum dark:text-milk">{t('Buka lagi')}</button>}
                  <button onClick={() => hapus(r)} className="text-rose">{t('Hapus laporan')}</button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
