'use client'
import { useEffect, useState } from 'react'
import { sb, ytId } from '../lib/supabase'

const thumb = (it) => (it.type === 'youtube' ? `https://img.youtube.com/vi/${ytId(it.url)}/hqdefault.jpg` : it.url)

function Full({ it }) {
  if (it.type === 'photo') return <img src={it.url} alt={it.title || it.idol} className="max-h-[80vh] rounded-2xl" />
  if (it.type === 'video') return <video src={it.url} controls autoPlay playsInline className="max-h-[80vh] rounded-2xl" />
  return <iframe src={`https://www.youtube.com/embed/${ytId(it.url)}?autoplay=1`} allow="autoplay; fullscreen" allowFullScreen className="w-[90vw] max-w-3xl aspect-video rounded-2xl" />
}

export default function Home() {
  const [items, setItems] = useState(null)
  const [idol, setIdol] = useState('Semua')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    sb.from('items').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
  }, [])

  const idols = ['Semua', ...new Set((items || []).map((i) => i.idol))]
  const shown = (items || []).filter((i) => idol === 'Semua' || i.idol === idol)

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      <header className="py-14 text-center">
        <p className="text-gold text-2xl" aria-hidden>✦ ✧ ✦</p>
        <h1 className="font-display text-5xl sm:text-7xl text-plum mt-2">Stardust Gallery</h1>
        <p className="mt-3 text-plum/70 font-bold">Koleksi foto & video idol favoritku</p>
      </header>

      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {idols.map((n) => (
          <button key={n} onClick={() => setIdol(n)}
            className={`px-4 py-1.5 rounded-full font-bold text-sm border transition ${idol === n ? 'bg-plum text-milk border-plum' : 'bg-white/70 border-rose/50 hover:bg-rose/20'}`}>
            {n}
          </button>
        ))}
      </div>

      {items === null && <p className="text-center text-plum/60">Memuat koleksi…</p>}
      {items && shown.length === 0 && <p className="text-center text-plum/60">Belum ada koleksi. Tambahkan lewat halaman admin.</p>}

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {shown.map((it) => (
          <button key={it.id} onClick={() => setOpen(it)} className="card mb-4 block w-full text-left break-inside-avoid">
            <div className="relative overflow-hidden rounded-2xl">
              {it.type === 'video'
                ? <video src={it.url + '#t=0.1'} preload="metadata" muted playsInline className="w-full" />
                : <img src={thumb(it)} alt={it.title || it.idol} loading="lazy" className="w-full" />}
              {it.type !== 'photo' && <span className="absolute inset-0 grid place-items-center text-4xl text-white drop-shadow-lg" aria-hidden>▶</span>}
            </div>
            <div className="px-2 py-2.5">
              <p className="font-bold text-sm truncate">{it.title || it.idol}</p>
              <p className="text-xs text-gold font-bold">{it.idol}</p>
            </div>
          </button>
        ))}
      </div>

      {open && (
        <div onClick={() => setOpen(null)} className="fixed inset-0 z-50 grid place-items-center bg-plum/80 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <Full it={open} />
            <button onClick={() => setOpen(null)} aria-label="Tutup" className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white text-plum font-bold shadow">✕</button>
          </div>
        </div>
      )}
    </main>
  )
}
