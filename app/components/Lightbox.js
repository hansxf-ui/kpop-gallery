'use client'
import { useEffect, useRef, useState } from 'react'
import { ytId } from '../../lib/supabase'
import Reactions from './Reactions'

function Media({ it }) {
  if (it.type === 'photo') return <img src={it.url} alt={it.title || it.idol} className="max-h-[70vh] rounded-2xl mx-auto" />
  if (it.type === 'video') return <video src={it.url} controls autoPlay playsInline className="max-h-[70vh] rounded-2xl mx-auto" />
  return <iframe src={`https://www.youtube.com/embed/${ytId(it.url)}?autoplay=1`} allow="autoplay; fullscreen" allowFullScreen className="w-[90vw] max-w-3xl aspect-video rounded-2xl mx-auto" />
}

export default function Lightbox({ items, index, onIndexChange, onClose, autoplay = false }) {
  const [playing, setPlaying] = useState(autoplay)
  const [making, setMaking] = useState(false)
  const timer = useRef(null)
  const it = items[index]

  async function makeWallpaper() {
    setMaking(true)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = it.url })
      const W = 1080, H = 1920
      const canvas = document.createElement('canvas')
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d')
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#3B2140'); g.addColorStop(1, '#1B0F22')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      const scale = Math.max(W / img.width, H / img.height)
      const w = img.width * scale, h = img.height * scale
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'wallpaper-h2h.jpg'; a.click()
      URL.revokeObjectURL(url)
    } catch { /* gambar dari sumber luar mungkin memblokir unduhan langsung */ }
    setMaking(false)
  }

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
            <button onClick={() => onIndexChange((index - 1 + items.length) % items.length)} className="px-3 py-1.5 rounded-full bg-white/90 text-plum font-bold text-sm">← Sebelumnya</button>
          )}
          {items.length > 1 && (
            <button onClick={() => setPlaying((p) => !p)} className="px-3 py-1.5 rounded-full bg-white/90 text-plum font-bold text-sm">{playing ? '⏸ Jeda' : '▶ Putar semua'}</button>
          )}
          {items.length > 1 && (
            <button onClick={() => onIndexChange((index + 1) % items.length)} className="px-3 py-1.5 rounded-full bg-white/90 text-plum font-bold text-sm">Berikutnya →</button>
          )}
          {it.type !== 'youtube' ? (
            <a href={it.url} download className="px-3 py-1.5 rounded-full bg-gold text-plum font-bold text-sm">⬇ Unduh</a>
          ) : (
            <a href={it.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full bg-gold text-plum font-bold text-sm">Buka di YouTube</a>
          )}
          {it.type === 'photo' && (
            <button onClick={makeWallpaper} disabled={making} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lilac text-plum font-bold text-sm disabled:opacity-50">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="9" r="1.5" />
                <path d="M21 15l-5-5-9 9" />
              </svg>
              {making ? 'Membuat…' : 'Wallpaper HP'}
            </button>
          )}
        </div>
        <Reactions key={it.id} itemId={it.id} />
        <button onClick={onClose} aria-label="Tutup" className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white text-plum font-bold shadow">✕</button>
      </div>
    </div>
  )
}
