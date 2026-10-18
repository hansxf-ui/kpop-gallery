'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ytId } from '../../lib/supabase'
import Reactions from './Reactions'

function Media({ it }) {
  if (it.type === 'photo') return <img src={it.url} alt={it.title || it.idol} draggable={false} className="max-h-[max(140px,calc(100dvh-320px))] sm:max-h-[calc(100dvh-280px)] rounded-2xl mx-auto" />
  if (it.type === 'video') return <video src={it.url} controls autoPlay playsInline className="max-h-[max(140px,calc(100dvh-320px))] sm:max-h-[calc(100dvh-280px)] rounded-2xl mx-auto" />
  return <iframe src={`https://www.youtube.com/embed/${ytId(it.url)}?autoplay=1`} allow="autoplay; fullscreen" allowFullScreen className="w-[90vw] max-w-3xl max-h-[calc(100dvh-300px)] aspect-video rounded-2xl mx-auto" />
}

// Media tetangga di rel geser: versi ringan TANPA autoplay — video cuma bingkai pertama,
// YouTube cuma thumbnail — biar gesernya enteng dan tidak ada dua suara bunyi barengan.
function MediaTetangga({ it }) {
  if (it.type === 'photo') return <img src={it.url} alt={it.title || it.idol} draggable={false} className="max-h-[max(140px,calc(100dvh-320px))] sm:max-h-[calc(100dvh-280px)] rounded-2xl mx-auto" />
  if (it.type === 'video') return (
    <span className="relative block">
      <video src={it.url + '#t=0.1'} preload="metadata" muted playsInline className="max-h-[max(140px,calc(100dvh-320px))] sm:max-h-[calc(100dvh-280px)] rounded-2xl mx-auto" />
      <span className="absolute inset-0 grid place-items-center text-5xl text-white drop-shadow-lg" aria-hidden>▶</span>
    </span>
  )
  return (
    <span className="relative block w-[90vw] max-w-3xl mx-auto">
      <img src={`https://img.youtube.com/vi/${ytId(it.url)}/maxresdefault.jpg`} alt={it.title || it.idol} draggable={false} className="w-full max-h-[calc(100dvh-300px)] aspect-video object-cover rounded-2xl" />
      <span className="absolute inset-0 grid place-items-center text-5xl text-white drop-shadow-lg" aria-hidden>▶</span>
    </span>
  )
}

export default function Lightbox({ items, index, onIndexChange, onClose, autoplay = false }) {
  const [playing, setPlaying] = useState(autoplay)
  const [making, setMaking] = useState(false)
  const timer = useRef(null)
  const trackRef = useRef(null)
  const settleTimer = useRef(null)
  const it = items[index]
  const multi = items.length > 1

  // Jendela 3 slot di sekitar item aktif: [sebelum, aktif, sesudah] — navigasi melingkar seperti sebelumnya.
  const slots = multi
    ? [
        { it: items[(index - 1 + items.length) % items.length], active: false },
        { it, active: true },
        { it: items[(index + 1) % items.length], active: false },
      ]
    : [{ it, active: true }]

  // Setiap item aktif berganti (dari geseran, keyboard, autoplay, atau klik luar),
  // rel langsung ditata ulang ke slot tengah SEBELUM layar menggambar ulang — tidak ada kedipan.
  useLayoutEffect(() => {
    const el = trackRef.current
    if (el && multi) el.scrollTo({ left: el.clientWidth, behavior: 'auto' })
  }, [index, multi])

  // Geseran berhenti di slot tepi = pindah item; berhenti di tengah = tidak jadi pindah.
  function onTrackScroll() {
    const el = trackRef.current
    if (!el || !multi) return
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const w = el.clientWidth
      if (!w) return
      const slot = Math.round(el.scrollLeft / w)
      if (slot === 1) return
      onIndexChange((index + (slot === 2 ? 1 : -1) + items.length) % items.length)
    }, 120)
  }

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
      g.addColorStop(0, '#173A56'); g.addColorStop(1, '#0D1D31')
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
  // Portal ke <body>: wajib di luar <main class="page-fade-in"> — animasi fade-nya memakai transform,
  // dan elemen ber-transform jadi patokan posisi `fixed` (bukan viewport), bikin lightbox nyasar ke tengah halaman.
  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-50 grid h-dvh place-items-center overflow-y-auto bg-plum/85 backdrop-blur-sm p-4">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full flex flex-col items-center gap-3">
        <div ref={trackRef} onScroll={onTrackScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory select-none [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}>
          {slots.map((s, i) => (
            <div key={`${s.it.id}-${s.active ? 'aktif' : 'tepi' + i}`} className="w-full shrink-0 snap-center flex items-start justify-center">
              {s.it.type === 'photo' ? (
                <div className="relative">
                  {s.active ? <Media it={s.it} /> : <MediaTetangga it={s.it} />}
                  {s.active && (
                    <button onClick={onClose} aria-label="Tutup" className="absolute right-2.5 top-2.5 z-10 rounded-full bg-plum/70 px-3 py-1.5 text-xs font-bold text-milk shadow-lg backdrop-blur-sm">Tutup</button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  {s.active && (
                    <button onClick={onClose} aria-label="Tutup" className="mb-2 self-end rounded-full bg-plum/70 px-3 py-1.5 text-xs font-bold text-milk shadow-lg backdrop-blur-sm">Tutup</button>
                  )}
                  {s.active ? <Media it={s.it} /> : <MediaTetangga it={s.it} />}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center px-4">
          <p className="font-bold text-milk">{it.title || it.idol}</p>
          <p className="text-xs text-gold font-bold mt-0.5">{it.idol}{it.group_name ? ` · ${it.group_name}` : ''}</p>
          {it.note && it.note.trim().startsWith('📷') && (
            <p className="text-[11px] text-milk/60 mt-1">{it.note.trim()}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {items.length > 1 && (
            <button onClick={() => setPlaying((p) => !p)} className="px-3 py-1.5 rounded-full bg-white/90 text-plum font-bold text-sm">{playing ? '⏸ Jeda' : '▶ Putar semua'}</button>
          )}
          {it.type !== 'youtube' ? (
            <a href={`${it.url}?download=${encodeURIComponent(it.url.split('/').pop() || 'hearts2hearts')}`} className="px-3 py-1.5 rounded-full bg-gold text-plum font-bold text-sm">⬇ Unduh</a>
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
      </div>
    </div>,
    document.body
  )
}
