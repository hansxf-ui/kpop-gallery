'use client'
import { useEffect, useMemo, useState } from 'react'
import { sb, imgOpt, isMissingColumn } from '../../lib/supabase'
import { ALBUM_KEYS, DISPLAY_NAME, TAGS, namesOf, thumbOf, tagLabel, canonIdol } from '../../lib/gallery'
import { filterAdminItems, groupTagUpdates, chunk } from '../../lib/adminTools'
import { useT } from '../../lib/i18n'
import ConfirmModal from './ConfirmModal'

const PAGE = 50
const EMPTY = { q: '', idol: '', type: '', era: '', tag: '' }
const box = 'w-full rounded-xl border border-rose/60 dark:border-rose/25 bg-white dark:bg-white/10 dark:text-milk px-3 py-2'
const sel = 'rounded-xl border border-rose/60 dark:border-rose/25 bg-white dark:bg-plum dark:text-milk px-2 py-2 text-sm'
const small = 'shrink-0 rounded-full bg-plum px-3 py-1.5 text-xs font-bold text-milk disabled:opacity-50 dark:bg-gold dark:text-plum'

// Daftar "Semua item" di admin: cari & filter, thumbnail, halaman per 50, dan ubah massal
// (era / grup / idol / tag / hapus) untuk item yang dicentang.
// Form ubah per item tetap milik app/admin/page.js — dirender lewat renderEditor(it).
export default function AdminItemList({ items, editing, renderEditor, onEdit, onDelete, onChanged, headerExtra }) {
  const t = useT()
  const [f, setF] = useState(EMPTY)
  const [shown, setShown] = useState(PAGE)
  const [picked, setPicked] = useState(() => new Set())
  const [bulk, setBulk] = useState({ era: '', group: '', idol: '', tag: TAGS[0][0] })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  const eras = useMemo(() => [...new Set(items.map((it) => (it.era || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [items])
  const filtered = useMemo(() => filterAdminItems(items, f, namesOf), [items, f])
  // Filter berubah → pilihan dikosongkan, supaya ubah massal tidak mengenai item yang sudah tidak terlihat.
  useEffect(() => { setPicked(new Set()); setShown(PAGE) }, [f])

  const visible = filtered.slice(0, shown)
  // Item yang sedang diubah (mis. dibuka dari antrean laporan) selalu tampil walau tersaring filter/halaman.
  const editItem = editing && !visible.some((it) => it.id === editing) ? items.find((it) => it.id === editing) : null
  const rows = editItem ? [editItem, ...visible] : visible
  const selected = filtered.filter((it) => picked.has(it.id))
  const allPicked = filtered.length > 0 && selected.length === filtered.length
  const filterOn = Object.values(f).some(Boolean)

  const toggle = (id) => setPicked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const pickAll = () => setPicked(allPicked ? new Set() : new Set(filtered.map((it) => it.id)))
  const noPermission = () => t('Perubahan tidak tersimpan — akun ini tidak punya izin, atau sesi sudah habis. Masuk ulang lalu coba lagi.')

  async function run(fn) {
    setBusy(true)
    setMsg(t('Menyimpan…'))
    try {
      setMsg(await fn())
    } catch (e) {
      setMsg(isMissingColumn(e) && /tags/.test(e.message || '')
        ? t('Kolom tags belum ada — jalankan dulu supabase/migrations/20261112_06_item_tags.sql.')
        : t('Gagal menyimpan perubahan: {pesan}', { pesan: e.message || String(e) }))
    }
    setBusy(false)
    onChanged()
  }

  // Satu query per 100 id. .select('id') = baris yang benar-benar berubah (0 tanpa error = ditolak RLS).
  async function updateIds(ids, payload) {
    let ok = 0
    for (const part of chunk(ids, 100)) {
      const { data, error } = await sb.from('items').update(payload).in('id', part).select('id')
      if (error) throw error
      ok += (data || []).length
    }
    return ok
  }

  const setField = (field, value) => run(async () => {
    const ids = selected.map((it) => it.id)
    const ok = await updateIds(ids, { [field]: value })
    if (ok === 0) return noPermission()
    return t('{ok}/{n} item diubah ✓', { ok, n: ids.length })
  })

  const setTag = (add) => run(async () => {
    const groups = groupTagUpdates(selected, bulk.tag, add)
    if (groups.length === 0) return t('Tidak ada yang perlu diubah.')
    let ok = 0, n = 0
    for (const g of groups) { n += g.ids.length; ok += await updateIds(g.ids, { tags: g.tags }) }
    if (ok === 0) return noPermission()
    return t('{ok}/{n} item diubah ✓', { ok, n })
  })

  // Sama dengan hapus satu item: baris database dulu, file storage hanya untuk baris yang benar-benar terhapus.
  const bulkDelete = () => {
    setConfirmDel(false)
    const ids = selected.map((it) => it.id)
    run(async () => {
      let gone = []
      for (const part of chunk(ids, 100)) {
        const { data, error } = await sb.from('items').delete().in('id', part).select('id, path')
        if (error) throw error
        gone = gone.concat(data || [])
      }
      if (gone.length === 0) return noPermission()
      let storageFail = 0
      for (const part of chunk(gone.map((r) => r.path).filter(Boolean), 100)) {
        const { error } = await sb.storage.from('gallery').remove(part)
        if (error) storageFail += part.length
      }
      setPicked(new Set())
      return storageFail
        ? t('{ok} item terhapus, tapi {n} file gagal dibersihkan dari storage.', { ok: gone.length, n: storageFail })
        : t('{ok}/{n} item terhapus ✓', { ok: gone.length, n: ids.length })
    })
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-plum dark:text-milk">{t('Semua item ({n})', { n: items.length })}</h2>
        {headerExtra}
      </div>

      <div className="mt-3 space-y-2 rounded-2xl bg-white/70 p-3 dark:bg-white/5">
        <input type="search" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label={t('Cari item')}
          placeholder={t('Cari judul, idol, era, catatan, tag…')} className={box} />
        <div className="flex flex-wrap gap-2">
          <select value={f.idol} onChange={(e) => setF({ ...f, idol: e.target.value })} aria-label={t('Filter member')} className={sel}>
            <option value="">{t('Semua member')}</option>
            {ALBUM_KEYS.map((k) => <option key={k} value={k}>{DISPLAY_NAME[k] || k}</option>)}
          </select>
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} aria-label={t('Filter jenis')} className={sel}>
            <option value="">{t('Semua jenis')}</option>
            <option value="photo">{t('Foto')}</option>
            <option value="video">{t('Video')}</option>
            <option value="youtube">YouTube</option>
          </select>
          <select value={f.era} onChange={(e) => setF({ ...f, era: e.target.value })} aria-label={t('Filter era')} className={sel}>
            <option value="">{t('Semua era')}</option>
            <option value="-">{t('(Tanpa era)')}</option>
            {eras.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} aria-label={t('Filter tag')} className={sel}>
            <option value="">{t('Semua tag')}</option>
            <option value="-">{t('(Tanpa tag)')}</option>
            {TAGS.map(([k, label]) => <option key={k} value={k}>#{t(label)}</option>)}
          </select>
          {filterOn && <button type="button" onClick={() => setF(EMPTY)} className="text-sm font-bold text-gold underline underline-offset-4">{t('Reset filter')}</button>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-plum/60 dark:text-milk/60">
          <span>{t('{a} dari {n} item cocok', { a: filtered.length, n: items.length })}</span>
          {filtered.length > 0 && (
            <label className="flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" checked={allPicked} onChange={pickAll} />
              {t('Pilih semua hasil ({n})', { n: filtered.length })}
            </label>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="sticky top-2 z-20 mt-3 space-y-2 rounded-2xl border border-gold/60 bg-milk/95 p-3 shadow-lg backdrop-blur dark:bg-plum/95 dark:text-milk">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold">{t('{n} item dipilih', { n: selected.length })}</p>
            <button type="button" onClick={() => setPicked(new Set())} className="text-xs font-bold underline">{t('Batalkan pilihan')}</button>
          </div>
          {[
            ['era', t('Era baru (kosong = hapus era)'), () => setField('era', bulk.era.trim() || null), t('Ganti era')],
            ['group', t('Grup baru (kosong = hapus grup)'), () => setField('group_name', bulk.group.trim() || null), t('Ganti grup')],
            ['idol', t('Idol baru, mis. CARMEN atau JUUN & CARMEN'), () => setField('idol', canonIdol(bulk.idol)), t('Ganti idol')],
          ].map(([k, ph, act, label]) => (
            <div key={k} className="flex gap-2">
              <input value={bulk[k]} onChange={(e) => setBulk({ ...bulk, [k]: e.target.value })} placeholder={ph} aria-label={ph} className={`${box} text-sm`} />
              <button type="button" onClick={act} disabled={busy || (k === 'idol' && !bulk.idol.trim())} className={small}>{label}</button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <select value={bulk.tag} onChange={(e) => setBulk({ ...bulk, tag: e.target.value })} aria-label={t('Tag')} className={sel}>
              {TAGS.map(([k, label]) => <option key={k} value={k}>#{t(label)}</option>)}
            </select>
            <button type="button" onClick={() => setTag(true)} disabled={busy} className={small}>+ {t('Tambah tag')}</button>
            <button type="button" onClick={() => setTag(false)} disabled={busy} className={small}>− {t('Buang tag')}</button>
            <button type="button" onClick={() => setConfirmDel(true)} disabled={busy} className="ml-auto shrink-0 rounded-full border border-rose px-3 py-1.5 text-xs font-bold text-rose disabled:opacity-50">
              {t('Hapus {n} item', { n: selected.length })}
            </button>
          </div>
        </div>
      )}
      {msg && <p className="mt-2 text-sm font-bold dark:text-milk" role="status">{msg}</p>}

      <ul className="mt-3 space-y-2">
        {rows.map((it) => (
          <li key={it.id} id={`item-${it.id}`} className={`rounded-xl px-3 py-2 dark:text-milk ${picked.has(it.id) ? 'bg-gold/15 ring-1 ring-gold/60' : 'bg-white/70 dark:bg-white/5'}`}>
            {editing === it.id ? renderEditor(it) : (
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={picked.has(it.id)} onChange={() => toggle(it.id)} disabled={!filtered.includes(it)}
                  aria-label={t('Pilih {judul}', { judul: it.title || it.idol || it.type })} className="shrink-0" />
                {it.type === 'video'
                  ? <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-rose/20 text-xs" aria-hidden>▶</span>
                  : <img src={imgOpt(thumbOf(it), 120)} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm"><b>{it.idol}</b>{it.group_name ? ` (${it.group_name})` : ''}{it.era ? ` · ${it.era}` : ''} · {it.title || it.type}</span>
                  <span className="block truncate text-xs text-plum/50 dark:text-milk/50">
                    {String(it.created_at || '').slice(0, 10)}
                    {Array.isArray(it.tags) && it.tags.length > 0 && ` · ${it.tags.map((k) => `#${t(tagLabel(k))}`).join(' ')}`}
                    {it.note && ` · 📝 ${it.note}`}
                  </span>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button onClick={() => onEdit(it)} className="text-sm font-bold text-gold">{t('Ubah')}</button>
                  <button onClick={() => onDelete(it)} className="text-sm font-bold text-rose">{t('Hapus')}</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p className="mt-4 text-center text-sm font-bold text-plum/60 dark:text-milk/60">{t('Tidak ada item yang cocok.')}</p>}
      {filtered.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mx-auto mt-4 block rounded-full border border-rose/50 px-5 py-2 text-sm font-bold text-plum dark:text-milk">
          {t('Tampilkan lebih banyak ({n} lagi)', { n: filtered.length - shown })}
        </button>
      )}

      <ConfirmModal
        open={confirmDel}
        title={t('Hapus {n} item?', { n: selected.length })}
        message={t('Foto/video dan reaksinya ikut terhapus. Tidak bisa dibatalkan — unduh cadangan dulu kalau ragu.')}
        confirmLabel={t('Ya, hapus')}
        onConfirm={bulkDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  )
}
