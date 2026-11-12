'use client'
import { useRef, useState } from 'react'
import { sb } from '../../lib/supabase'
import { ZipWriter, readZip } from '../../lib/zip'
import { downloadBlob } from '../../lib/download'
import {
  BACKUP_FORMAT, BACKUP_VERSION, ITEMS_FILE, META_FILE, fileEntryOf,
  parseBackupRows, planRestore, restoreRow, missingColumnOf, contentTypeOf,
} from '../../lib/adminTools'
import { useT } from '../../lib/i18n'
import ConfirmModal from './ConfirmModal'

// Batas satu bagian ZIP. Seluruh bagian disusun di memori browser sebelum diunduh, jadi dijaga
// kecil supaya HP tidak kehabisan memori. Koleksi besar = beberapa file ZIP.
const PART_BYTES = 300 * 1024 * 1024
const MB = (n) => (n / 1024 / 1024).toFixed(0)
const dec = new TextDecoder()

// Cadangan lengkap: data SEMUA item (termasuk catatan pribadi) + file foto/video dari storage,
// dalam ZIP biasa yang bisa dibuka di komputer mana pun. Pulihkan: pilih ZIP (atau file .json dari
// "Ekspor backup (.json)") → item yang belum ada di database disisipkan lagi. Tidak ada yang ditimpa.
export default function AdminBackup({ items, onChanged }) {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [ready, setReady] = useState(null) // { name, size, resolve } — bagian ZIP menunggu diunduh
  const [plan, setPlan] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const input = useRef(null)

  // Tiap bagian diunduh lewat ketukan admin sendiri: browser (terutama iPhone) sering memblokir
  // unduhan beruntun yang dipicu kode, dan memori bagian itu langsung dilepas setelah diunduh.
  const offer = (name, blob) => new Promise((resolve) => setReady({ name, size: blob.size, resolve: () => { downloadBlob(blob, name); setReady(null); resolve() } }))

  async function backupAll() {
    setBusy(true)
    setMsg('')
    const date = new Date().toISOString().slice(0, 10)
    const itemsJson = JSON.stringify(items, null, 2)
    const withFile = items.filter((it) => it.path)
    const failed = []
    let part = 1
    let zip, inPart
    const start = () => { zip = new ZipWriter(); zip.add(ITEMS_FILE, itemsJson); inPart = [] }
    const finish = async (last) => {
      zip.add(META_FILE, JSON.stringify({
        format: BACKUP_FORMAT, version: BACKUP_VERSION, created_at: new Date().toISOString(),
        part, last, item_count: items.length, files: inPart, failed: last ? failed : [],
      }, null, 2))
      await offer(`galeri-h2h-cadangan-${date}-bagian-${part}.zip`, zip.blob())
    }
    start()
    for (let i = 0; i < withFile.length; i++) {
      const it = withFile[i]
      setMsg(t('Mengunduh file {ok}/{n}…', { ok: i + 1, n: withFile.length }))
      try {
        const { data, error } = await sb.storage.from('gallery').download(it.path)
        if (error) throw error
        const bytes = new Uint8Array(await data.arrayBuffer())
        const name = fileEntryOf(it.path)
        if (inPart.length > 0 && zip.sizeWith(name, bytes.length) + 64 * 1024 > PART_BYTES) {
          await finish(false)
          part++
          start()
        }
        zip.add(name, bytes, it.created_at ? new Date(it.created_at) : new Date())
        inPart.push(it.path)
      } catch {
        failed.push(it.path)
      }
    }
    await finish(true)
    setBusy(false)
    setMsg(failed.length
      ? t('Cadangan selesai ({p} bagian), tapi {n} file gagal diunduh — daftarnya ada di cadangan.json bagian terakhir.', { p: part, n: failed.length })
      : t('Cadangan selesai ✓ {p} bagian, {n} item.', { p: part, n: items.length }))
  }

  async function pick(fileList) {
    const files = Array.from(fileList || [])
    if (input.current) input.current.value = ''
    if (files.length === 0) return
    setPlan(null)
    setMsg(t('Membaca cadangan…'))
    try {
      let rows = null
      let fromZip = false
      const entries = new Map()
      for (const f of files) {
        if (/\.json$/i.test(f.name)) { if (!rows) rows = parseBackupRows(await f.text()); continue }
        const z = await readZip(f)
        fromZip = true
        for (const [name, e] of z) if (name.startsWith('files/')) entries.set(name.slice(6), e)
        if (!rows && z.has(ITEMS_FILE)) rows = parseBackupRows(dec.decode(await z.get(ITEMS_FILE).read()))
      }
      if (!rows) throw new Error(t('items.json tidak ditemukan di file yang dipilih.'))
      const p = planRestore(rows, new Set(items.map((it) => it.id)), (path) => entries.has(path), fromZip)
      setPlan({ ...p, entries, total: rows.length })
      setMsg('')
    } catch (e) {
      setMsg(t('File cadangan tidak bisa dibaca: {pesan}', { pesan: e.message || String(e) }))
    }
  }

  // Sisipkan satu baris. Kolom yang belum ada di database tujuan dibuang (dicatat), lalu diulang.
  async function insertRow(row, dropped) {
    let payload = row
    for (let i = 0; i < 20; i++) {
      const { error } = await sb.from('items').insert(payload)
      if (!error) return true
      const col = missingColumnOf(error)
      if (!col || !(col in payload)) throw error
      dropped.add(col)
      const { [col]: _, ...rest } = payload
      payload = rest
    }
    return false
  }

  async function restore() {
    setConfirm(false)
    setBusy(true)
    const dropped = new Set()
    let ok = 0, gagal = 0, lastErr = ''
    const todo = [...plan.upload.map((r) => ['upload', r]), ...plan.link.map((r) => ['link', r])]
    for (let i = 0; i < todo.length; i++) {
      const [kind, r] = todo[i]
      setMsg(t('Memulihkan {ok}/{n}…', { ok: i + 1, n: todo.length }))
      try {
        let url
        if (kind === 'upload') {
          const data = await plan.entries.get(r.path).read()
          const type = contentTypeOf(r.path)
          const { error } = await sb.storage.from('gallery').upload(r.path, new Blob([data], { type }), { contentType: type, upsert: false })
          // File sudah ada (mis. pemulihan diulang) → pakai file itu.
          if (error && String(error.statusCode) !== '409' && !/exist|duplicate/i.test(error.message || '')) throw error
          url = sb.storage.from('gallery').getPublicUrl(r.path).data.publicUrl
        }
        if (await insertRow(restoreRow(r, url), dropped)) ok++
        else gagal++
      } catch (e) {
        gagal++
        lastErr = e.message || String(e)
      }
    }
    setBusy(false)
    setPlan(null)
    const parts = [t('Pemulihan selesai: {ok} item dipulihkan', { ok })]
    if (gagal) parts.push(t('{n} gagal ({pesan})', { n: gagal, pesan: lastErr }))
    if (dropped.size) parts.push(t('kolom yang belum ada di database ini dilewati: {kolom}', { kolom: [...dropped].join(', ') }))
    setMsg(parts.join(' · '))
    onChanged()
  }

  const totalFiles = items.filter((it) => it.path).length
  return (
    <div className="mt-10 rounded-3xl bg-white/70 dark:bg-white/5 p-5 border border-rose/40 dark:border-rose/20">
      <h2 className="font-display text-2xl text-plum dark:text-milk mb-3">💾 {t('Cadangan lengkap')}</h2>
      <p className="text-xs text-plum/50 dark:text-milk/50 mb-3">
        {t('"Ekspor backup (.json)" hanya menyimpan data teks. Cadangan lengkap ikut menyimpan file foto & video dari storage dalam file ZIP (dipecah per ±300 MB). Simpan di luar Supabase, mis. Google Drive atau komputer.')}
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={backupAll} disabled={busy || items.length === 0} className="rounded-full bg-gold text-plum font-bold px-4 py-2 text-sm disabled:opacity-50">
          ⬇ {t('Unduh cadangan lengkap ({n} file)', { n: totalFiles })}
        </button>
        <button onClick={() => input.current?.click()} disabled={busy} className="rounded-full border border-rose/50 px-4 py-2 text-sm font-bold text-plum disabled:opacity-50 dark:text-milk">
          ⬆ {t('Pulihkan dari cadangan')}
        </button>
        <input ref={input} type="file" accept=".zip,.json,application/zip,application/json" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
      </div>
      <p className="mt-2 text-xs text-plum/50 dark:text-milk/50">
        {t('Pulihkan: pilih SEMUA bagian ZIP sekaligus (atau satu file .json). Item yang sudah ada dilewati, tidak ada yang ditimpa — aman diulang.')}
      </p>

      {ready && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-gold/60 bg-gold/10 p-3 text-sm font-bold dark:text-milk" role="status">
          <span className="flex-1">{t('{nama} siap ({mb} MB)', { nama: ready.name, mb: MB(ready.size) })}</span>
          <button onClick={ready.resolve} className="rounded-full bg-plum px-4 py-1.5 text-xs text-milk dark:bg-gold dark:text-plum">⬇ {t('Unduh bagian ini')}</button>
        </div>
      )}

      {plan && (
        <div className="mt-3 rounded-xl bg-white p-3 text-sm dark:bg-white/10 dark:text-milk">
          <p className="font-bold">{t('Isi cadangan: {n} item', { n: plan.total })}</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            <li>{t('{n} item akan dipulihkan beserta filenya', { n: plan.upload.length })}</li>
            <li>{t('{n} item akan dipulihkan tanpa unggah file (YouTube, atau file masih di storage)', { n: plan.link.length })}</li>
            <li>{t('{n} item sudah ada — dilewati', { n: plan.skip.length })}</li>
            {plan.missing.length > 0 && <li className="font-bold text-rose">{t('{n} item dilewati karena filenya ada di bagian ZIP lain — pilih semua bagian sekaligus', { n: plan.missing.length })}</li>}
          </ul>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setConfirm(true)} disabled={busy || plan.upload.length + plan.link.length === 0} className="rounded-full bg-plum px-4 py-1.5 text-xs font-bold text-milk disabled:opacity-50 dark:bg-gold dark:text-plum">
              {t('Pulihkan {n} item', { n: plan.upload.length + plan.link.length })}
            </button>
            <button onClick={() => setPlan(null)} disabled={busy} className="rounded-full border border-rose/40 px-4 py-1.5 text-xs font-bold">{t('Batal')}</button>
          </div>
        </div>
      )}
      {msg && <p className="mt-2 text-sm font-bold dark:text-milk" role="status">{msg}</p>}

      <ConfirmModal
        open={confirm}
        title={t('Pulihkan {n} item?', { n: plan ? plan.upload.length + plan.link.length : 0 })}
        message={t('Item yang sudah ada tidak diubah. Jangan tutup halaman ini sampai selesai.')}
        confirmLabel={t('Ya, pulihkan')}
        onConfirm={restore}
        onCancel={() => setConfirm(false)}
      />
    </div>
  )
}
