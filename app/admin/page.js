'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { sb, ytId } from '../../lib/supabase'
import { compressImage } from '../../lib/compress'
import { rotateImageFile } from '../../lib/rotate'
import ThemeToggle from '../components/ThemeToggle'
import ConfirmModal from '../components/ConfirmModal'

const box = 'w-full rounded-xl border border-rose/60 dark:border-rose/25 bg-white dark:bg-white/10 dark:text-milk px-3 py-2.5'
const btn = 'rounded-full bg-plum text-milk font-bold px-5 py-2.5 disabled:opacity-50'
let qid = 0

export default function Admin() {
  const [user, setUser] = useState(undefined)
  const [items, setItems] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ idol: '', title: '', group: '', era: '', note: '', yt: '' })
  const [queue, setQueue] = useState([]) // {id, file, url, rotation, status}
  const [dragOver, setDragOver] = useState(false)
  const [editing, setEditing] = useState(null) // item id being edited
  const [editVal, setEditVal] = useState({})
  const [pendingDelete, setPendingDelete] = useState(null) // item yang menunggu konfirmasi hapus
  const [announcement, setAnnouncement] = useState('')
  const fileInput = useRef(null)

  const load = () => sb.from('items').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = sb.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))
    load()
    sb.from('settings').select('value').eq('key', 'announcement').maybeSingle().then(({ data }) => setAnnouncement(data?.value || ''))
    return () => data.subscription.unsubscribe()
  }, [])

  async function saveAnnouncement(text) {
    setAnnouncement(text)
    await sb.from('settings').upsert({ key: 'announcement', value: text })
  }

  async function login(e) {
    e.preventDefault()
    const d = new FormData(e.target)
    const { error } = await sb.auth.signInWithPassword({ email: d.get('email'), password: d.get('password') })
    setMsg(error ? 'Email atau password salah.' : '')
  }

  function addFiles(fileList) {
    const arr = Array.from(fileList).map((file) => ({ id: qid++, file, url: URL.createObjectURL(file), rotation: 0, status: 'siap' }))
    setQueue((q) => [...q, ...arr])
  }
  function rotateQueued(id) {
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, rotation: (it.rotation + 90) % 360 } : it)))
  }
  function removeQueued(id) {
    setQueue((q) => q.filter((it) => it.id !== id))
  }

  async function add(e) {
    e.preventDefault()
    const ytLinks = f.yt.split('\n').map((s) => s.trim()).filter(Boolean)
    const validYt = ytLinks.filter((l) => ytId(l))
    const idolName = f.idol.trim() || f.group.trim() || 'Hearts2Hearts'
    if (queue.length === 0 && validYt.length === 0) return setMsg('Pilih foto/video, atau tempel link YouTube yang valid.')
    setBusy(true)
    const baseRow = { idol: idolName, group_name: f.group.trim() || null, era: f.era.trim() || null, note: f.note.trim() || null }

    if (queue.length === 0) {
      let ok = 0
      for (const link of validYt) {
        setMsg(`Menyimpan… ${ok}/${validYt.length}`)
        const { error } = await sb.from('items').insert({ ...baseRow, title: f.title.trim(), type: 'youtube', url: link })
        if (!error) ok++
      }
      setBusy(false)
      if (ok === 0) return setMsg('Gagal menyimpan link YouTube.')
      setF({ ...f, title: '', yt: '' })
      setMsg(validYt.length > 1 ? `Selesai: ${ok}/${validYt.length} link tersimpan ✓` : 'Tersimpan ✓')
      load()
      return
    }

    let ok = 0
    for (const q of queue) {
      setQueue((cur) => cur.map((it) => (it.id === q.id ? { ...it, status: 'memproses' } : it)))
      try {
        let file = q.file
        if (q.rotation && file.type.startsWith('image/')) file = await rotateImageFile(file, q.rotation)
        if (file.type.startsWith('image/')) file = await compressImage(file)
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${file.name.replace(/[^\w.-]/g, '_')}`
        const up = await sb.storage.from('gallery').upload(path, file)
        if (up.error) throw up.error
        const url = sb.storage.from('gallery').getPublicUrl(path).data.publicUrl
        const { error } = await sb.from('items').insert({
          ...baseRow, title: (f.title || q.file.name.replace(/\.\w+$/, '')).trim(),
          path, type: file.type.startsWith('video') ? 'video' : 'photo', url,
        })
        if (error) throw error
        ok++
        setQueue((cur) => cur.map((it) => (it.id === q.id ? { ...it, status: 'selesai ✓' } : it)))
      } catch (err) {
        setQueue((cur) => cur.map((it) => (it.id === q.id ? { ...it, status: 'gagal' } : it)))
      }
      setMsg(`Mengunggah… ${ok}/${queue.length} selesai`)
    }
    setBusy(false)
    setMsg(`Selesai: ${ok}/${queue.length} item tersimpan ✓`)
    setF({ ...f, title: '' })
    setQueue([])
    if (fileInput.current) fileInput.current.value = ''
    load()
  }

  async function del(it) {
    if (it.path) await sb.storage.from('gallery').remove([it.path])
    await sb.from('items').delete().eq('id', it.id)
    setPendingDelete(null)
    load()
  }

  function startEdit(it) {
    setEditing(it.id)
    setEditVal({ idol: it.idol, title: it.title || '', group: it.group_name || '', era: it.era || '', note: it.note || '' })
  }
  async function saveEdit(id) {
    const { error } = await sb.from('items').update({
      idol: editVal.idol.trim() || editVal.group.trim() || 'Hearts2Hearts', title: editVal.title.trim() || null,
      group_name: editVal.group.trim() || null, era: editVal.era.trim() || null, note: editVal.note.trim() || null,
    }).eq('id', id)
    if (error) return setMsg('Gagal menyimpan perubahan: ' + error.message)
    setEditing(null); load()
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hearts2hearts-gallery-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = Object.entries(
    items.reduce((acc, it) => { acc[it.idol] = (acc[it.idol] || 0) + 1; return acc }, {})
  ).sort((a, b) => b[1] - a[1])
  const maxCount = stats[0]?.[1] || 1

  if (user === undefined) return null
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 page-fade-in">
      <ThemeToggle />
      <Link href="/" className="text-sm font-bold text-plum/60 dark:text-milk/60 hover:text-plum dark:hover:text-milk">← Kembali ke galeri</Link>
      <h1 className="font-display text-4xl mb-6 mt-3 text-plum dark:text-milk">Admin ✦</h1>
      {!user ? (
        <form onSubmit={login} className="space-y-3">
          <input name="email" type="email" placeholder="Email" required className={box} />
          <input name="password" type="password" placeholder="Password" required className={box} />
          <button className={btn}>Masuk</button>
        </form>
      ) : (
        <>
          <form onSubmit={add} className="space-y-3 rounded-3xl bg-white/70 dark:bg-white/5 p-5 border border-rose/40 dark:border-rose/20">
            <input placeholder="Nama idol (opsional, mis. Karina)" value={f.idol} onChange={(e) => setF({ ...f, idol: e.target.value })} className={box} />
            <input placeholder="Judul (opsional, dipakai untuk semua file di batch ini)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={box} />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Grup (opsional)" value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })} className={box} />
              <input placeholder="Era (opsional, mis. Focus)" value={f.era} onChange={(e) => setF({ ...f, era: e.target.value })} className={box} />
            </div>
            <input placeholder="Catatan pribadi (opsional, cuma kamu yang lihat)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className={box} />

            <label
              htmlFor="galeri-file-input"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
              className={`rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer text-sm font-bold transition ${dragOver ? 'border-gold bg-gold/10' : 'border-rose/50 dark:border-rose/25 text-plum/60 dark:text-milk/60'}`}>
              📸 Seret & lepas foto/video di sini, atau ketuk untuk memilih (boleh banyak sekaligus)
              <input id="galeri-file-input" ref={fileInput} type="file" accept="image/*,video/*" multiple onChange={(e) => addFiles(e.target.files)} className="hidden" />
            </label>

            {queue.length > 0 && (
              <ul className="space-y-2">
                {queue.map((q) => (
                  <li key={q.id} className="flex items-center gap-3 rounded-xl bg-white dark:bg-white/10 p-2">
                    {q.file.type.startsWith('image/')
                      ? <img src={q.url} style={{ transform: `rotate(${q.rotation}deg)` }} className="h-14 w-14 object-cover rounded-lg transition-transform" />
                      : <video src={q.url} className="h-14 w-14 object-cover rounded-lg" muted />}
                    <span className="flex-1 truncate text-xs dark:text-milk">{q.file.name}</span>
                    <span className="text-xs font-bold text-gold shrink-0">{q.status}</span>
                    {q.file.type.startsWith('image/') && (
                      <button type="button" onClick={() => rotateQueued(q.id)} className="text-sm shrink-0" aria-label="Putar 90°">↻</button>
                    )}
                    <button type="button" onClick={() => removeQueued(q.id)} className="text-sm text-rose font-bold shrink-0" aria-label="Hapus dari antrean">✕</button>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-center text-sm text-plum/60 dark:text-milk/60">atau, kalau tanpa file di atas — tempel link YouTube (boleh banyak, satu per baris)</p>
            <textarea placeholder={'https://youtu.be/...\nhttps://youtu.be/...'} value={f.yt}
              onChange={(e) => setF({ ...f, yt: e.target.value })} rows={3} className={box} />
            <button disabled={busy} className={btn}>
              {queue.length > 1 ? `Tambah ${queue.length} item ke galeri` : f.yt.trim().includes('\n') || (f.yt.match(/youtu/g) || []).length > 1 ? 'Tambah semua link YouTube' : 'Tambah ke galeri'}
            </button>
            <button type="button" onClick={() => sb.auth.signOut()} className="ml-3 text-sm underline dark:text-milk">Keluar</button>
          </form>
          {msg && <p className="mt-3 font-bold dark:text-milk" role="status">{msg}</p>}

          <div className="mt-10 rounded-3xl bg-white/70 dark:bg-white/5 p-5 border border-rose/40 dark:border-rose/20">
            <h2 className="font-display text-2xl text-plum dark:text-milk mb-3">📣 Pengumuman comeback</h2>
            <p className="text-xs text-plum/50 dark:text-milk/50 mb-2">Muncul sebagai banner di atas beranda. Kosongkan lalu simpan untuk mematikannya.</p>
            <div className="flex gap-2">
              <input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="mis. Comeback baru: Lemon Tang! 🍋" className={box} />
              <button onClick={() => saveAnnouncement(announcement)} className="rounded-full bg-gold text-plum font-bold px-4 shrink-0 text-sm">Simpan</button>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-2xl text-plum dark:text-milk mb-3">Statistik koleksi</h2>
              <ul className="space-y-1.5">
                {stats.map(([n, c]) => (
                  <li key={n} className="flex items-center gap-2 text-sm">
                    <span className="w-24 shrink-0 truncate font-bold dark:text-milk">{n}</span>
                    <span className="flex-1 h-4 rounded-full bg-rose/15 dark:bg-white/10 overflow-hidden">
                      <span className="block h-full bg-gold rounded-full" style={{ width: `${(c / maxCount) * 100}%` }} />
                    </span>
                    <span className="w-8 text-right text-plum/60 dark:text-milk/60">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between">
            <h2 className="font-display text-2xl text-plum dark:text-milk">Semua item ({items.length})</h2>
            <button onClick={exportData} className="text-sm font-bold text-gold underline underline-offset-4">⬇ Ekspor backup (.json)</button>
          </div>
          <ul className="mt-3 space-y-2">
            {items.map((it) => (
              <li key={it.id} className="rounded-xl bg-white/70 dark:bg-white/5 dark:text-milk px-4 py-2.5">
                {editing === it.id ? (
                  <div className="space-y-2">
                    <input value={editVal.idol} onChange={(e) => setEditVal({ ...editVal, idol: e.target.value })} placeholder="Idol (opsional)" className={box} />
                    <input value={editVal.title} onChange={(e) => setEditVal({ ...editVal, title: e.target.value })} placeholder="Judul" className={box} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={editVal.group} onChange={(e) => setEditVal({ ...editVal, group: e.target.value })} placeholder="Grup" className={box} />
                      <input value={editVal.era} onChange={(e) => setEditVal({ ...editVal, era: e.target.value })} placeholder="Era" className={box} />
                    </div>
                    <input value={editVal.note} onChange={(e) => setEditVal({ ...editVal, note: e.target.value })} placeholder="Catatan pribadi" className={box} />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(it.id)} className="rounded-full bg-plum text-milk font-bold px-4 py-1.5 text-sm">Simpan</button>
                      <button onClick={() => setEditing(null)} className="rounded-full bg-white dark:bg-white/10 border border-rose/40 px-4 py-1.5 text-sm font-bold">Batal</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="truncate block"><b>{it.idol}</b>{it.group_name ? ` (${it.group_name})` : ''}{it.era ? ` · ${it.era}` : ''} · {it.title || it.type}</span>
                      {it.note && <span className="block text-xs text-plum/50 dark:text-milk/50 truncate">📝 {it.note}</span>}
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button onClick={() => startEdit(it)} className="text-sm font-bold text-gold">Ubah</button>
                      <button onClick={() => setPendingDelete(it)} className="text-sm text-rose font-bold">Hapus</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {!user && msg && <p className="mt-3 font-bold dark:text-milk" role="status">{msg}</p>}
      <ConfirmModal
        open={!!pendingDelete}
        title="Hapus item ini?"
        message={pendingDelete ? `${pendingDelete.idol}${pendingDelete.title ? ` · ${pendingDelete.title}` : ''}` : ''}
        confirmLabel="Ya, hapus"
        onConfirm={() => del(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  )
}
