'use client'
import { useEffect, useRef, useState } from 'react'
import { ytId } from '../../lib/supabase'

function Media({ it }) {
  if (it.type === 'photo') return <img src={it.url} alt={it.title || it.idol} className="max-h-[70vh] rounded-2xl mx-auto" />
  if (it.type === 'video') return <video src={it.url} controls autoPlay playsInline className="max-h-[70vh] rounded-2xl mx-auto" />
  return <iframe src={`https://www.youtube.com/embed/${ytId(it.url)}?autoplay=1`} allow="autoplay; fullscreen" allowFullScreen className="w-[90vw] max-w-3xl aspect-video rounded-2xl mx-auto" />
}

export default function Lightbox({ items, index, onIndexChange, onClose, autoplay = false }) {
  const [playing, setPlaying] = useState(autoplay)
  const timer = useRef(null)
  const it = items[index]

  useEffect(() => {
    if (!playing || items.length < 2) return
    timer.current = setTimeout(() => onIndexChange((index + 1) % items.length), 4000)
    return () => clearTimeout(timer.current)
  }, [playing, index, items, onIndexChange])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % items.length)
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, items, onIndexChange, onClose])

  if (!it) return null
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-plum/85 backdrop-blur-sm p-4">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full flex flex-col items-center gap-3">
        <Media it={it} />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {items.length > 1 && (
            <button onClick={() => onIndexChange((index - 1 + items.length) % items.length)} className="px-3 py-1.5 rounded-full bg-white/90 font-bold text-sm">← Sebelumnya</button>
          )}
          {items.length > 1 && (
            <button onClick={() => setPlaying((p) => !p)} className="px-3 py-1.5 rounded-full bg-white/90 font-bold text-sm">{playing ? '⏸ Jeda' : '▶ Putar semua'}</button>
          )}
          {items.length > 1 && (
            <button onClick={() => onIndexChange((index + 1) % items.length)} className="px-3 py-1.5 rounded-full bg-white/90 font-bold text-sm">Berikutnya →</button>
          )}
          {it.type !== 'youtube' ? (
            <a href={it.url} download className="px-3 py-1.5 rounded-full bg-gold text-plum font-bold text-sm">⬇ Unduh</a>
          ) : (
            <a href={it.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full bg-gold text-plum font-bold text-sm">Buka di YouTube</a>
          )}
        </div>
        <button onClick={onClose} aria-label="Tutup" className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white text-plum font-bold shadow">✕</button>
      </div>
    </div>
  )
}
