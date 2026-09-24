'use client'
import { useEffect, useState } from 'react'
import { sb, ytId } from '../../lib/supabase'

const box = 'w-full rounded-xl border border-rose/60 bg-white px-3 py-2.5'
const btn = 'rounded-full bg-plum text-milk font-bold px-5 py-2.5 disabled:opacity-50'

export default function Admin() {
  const [user, setUser] = useState(undefined)
  const [items, setItems] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ idol: '', title: '', group: '', yt: '', file: null })

  const load = () => sb.from('items').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = sb.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))
    load()
    return () => data.subscription.unsubscribe()
  }, [])

  async function login(e) {
    e.preventDefault()
    const d = new FormData(e.target)
    const { error } = await sb.auth.signInWithPassword({ email: d.get('email'), password: d.get('password') })
    setMsg(error ? 'Email atau password salah.' : '')
  }

  async function add(e) {
    e.preventDefault()
    const form = e.target
    if (!f.idol.trim()) return setMsg('Isi nama idol dulu.')
    if (!f.file && !ytId(f.yt)) return setMsg('Pilih file, atau tempel link YouTube yang valid.')
    setBusy(true); setMsg('Menyimpan…')
    let row = { idol: f.idol.trim(), title: f.title.trim(), group_name: f.group.trim() || null }
    if (f.file) {
      const path = `${Date.now()}-${f.file.name.replace(/[^\w.-]/g, '_')}`
      const up = await sb.storage.from('gallery').upload(path, f.file)
      if (up.error) { setBusy(false); return setMsg('Upload gagal: ' + up.error.message) }
      row = { ...row, path, type: f.file.type.startsWith('video') ? 'video' : 'photo', url: sb.storage.from('gallery').getPublicUrl(path).data.publicUrl }
    } else row = { ...row, type: 'youtube', url: f.yt.trim() }
    const { error } = await sb.from('items').insert(row)
    setBusy(false)
    if (error) return setMsg('Gagal: ' + error.message)
    setF({ ...f, title: '', group: '', yt: '', file: null }); form.querySelector('input[type=file]').value = ''; setMsg('Tersimpan ✓'); load()
  }

  async function del(it) {
    if (!confirm('Hapus item ini?')) return
    if (it.path) await sb.storage.from('gallery').remove([it.path])
    await sb.from('items').delete().eq('id', it.id)
    load()
  }

  if (user === undefined) return null
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-4xl mb-6">Admin ✦</h1>
      {!user ? (
        <form onSubmit={login} className="space-y-3">
          <input name="email" type="email" placeholder="Email" required className={box} />
          <input name="password" type="password" placeholder="Password" required className={box} />
          <button className={btn}>Masuk</button>
        </form>
      ) : (
        <>
          <form onSubmit={add} className="space-y-3 rounded-3xl bg-white/70 p-5 border border-rose/40">
            <input placeholder="Nama idol (mis. Karina)" value={f.idol} onChange={(e) => setF({ ...f, idol: e.target.value })} className={box} />
            <input placeholder="Judul (opsional)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={box} />
            <input placeholder="Grup (opsional, mis. aespa)" value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })} className={box} />
            <input type="file" accept="image/*,video/*" onChange={(e) => setF({ ...f, file: e.target.files[0] })} className={box} />
            <p className="text-center text-sm text-plum/60">atau</p>
            <input placeholder="Link YouTube" value={f.yt} onChange={(e) => setF({ ...f, yt: e.target.value })} className={box} />
            <button disabled={busy} className={btn}>Tambah ke galeri</button>
            <button type="button" onClick={() => sb.auth.signOut()} className="ml-3 text-sm underline">Keluar</button>
          </form>
          {msg && <p className="mt-3 font-bold" role="status">{msg}</p>}
          <ul className="mt-8 space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-2.5">
                <span className="truncate"><b>{it.idol}</b>{it.group_name ? ` (${it.group_name})` : ''} · {it.title || it.type}</span>
                <button onClick={() => del(it)} className="text-sm text-rose font-bold">Hapus</button>
              </li>
            ))}
          </ul>
        </>
      )}
      {!user && msg && <p className="mt-3 font-bold" role="status">{msg}</p>}
    </main>
  )
}
