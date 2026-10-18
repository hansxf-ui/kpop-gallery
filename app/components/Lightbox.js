'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ytId, imgOpt } from '../../lib/supabase'
import Reactions from './Reactions'

function Media({ it }) {
  if (it.type === 'photo') return <img src={it.url} alt={it.title || it.idol} draggable={false} className="max-h-[max(140px,calc(100dvh-320px))] sm:max-h-[calc(100dvh-280px)] rounded-2xl mx-auto" />
  if (it.type === 'video') return <video src={it.url} controls autoPlay playsInline className="max-h-[max(140px,calc(100dvh-320px))] sm:max-h-[calc(100dvh-280px)] rounded-2xl mx-auto" />
  return <iframe src={`https://www.youtube.com/embed/${ytId(it.url)}?autoplay=1`} allow="autoplay; fullscreen" allowFullScreen className="w-[90vw] max-w-3xl max-h-[calc(100dvh-300px)] aspect-video rounded-2xl mx-auto" />
}

// Media tetangga di rel geser: versi ringan TANPA autoplay — video cuma bingkai pertama,
// YouTube cuma thumbnail — biar gesernya enteng dan tidak ada dua suara bunyi barengan.
// Foto & video diberi BINGKAI TETAP (panel lembut bg-white/5) supaya slotnya selalu punya
// badan yang kelihatan walau medianya belum selesai dimuat — tidak ada ruang kosong pas geser.
function MediaTetangga({ it }) {
  const frame = "relative block aspect-[3/4] w-[72vw] max-w-[330px] overflow-hidden rounded-2xl bg-white/5 mx-auto pointer-events-none"
  if (it.type === 'photo') return (
    <span className={frame}>
      <img src={imgOpt(it.url, 700)} alt={it.title || it.idol} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
    </span>
  )
  if (it.type === 'video') return (
    <span className={frame}>
      <video src={it.url + '#t=0.1'} preload="metadata" muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      <span className="absolute inset-0 grid place-items-center text-5xl text-white drop-shadow-lg" aria-hidden>▶</span>
    </span>
  )
  return (
    <span className="relative block w-[90vw] max-w-3xl mx-auto rounded-2xl bg-white/5 pointer-events-none">
      <img src={`https://img.youtube.com/vi/${ytId(it.url)}/maxresdefault.jpg`} alt={it.title || it.idol} draggable={false} className="w-full max-h-[calc(100dvh-300px)] aspect-video object-cover rounded-2xl" />
      <span className="absolute inset-0 grid place-items-center text-5xl text-white drop-shadow-lg" aria-hidden>▶</span>
    </span>
  )
}

export default function Lightbox({ items, index, onIndexChange, onClose, autoplay = false }) {
  const [playing, setPlaying] = useState(autoplay)
  const [making, setMaking] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [anim, setAnim] = useState(false)
  const [controlsOn, setControlsOn] = useState(false)
  const timer = useRef(null)
  const commitTimer = useRef(null)
  const viewRef = useRef(null)
  const startX = useRef(null)
  const activePointer = useRef(null) // pointerId pemilik geseran aktif — jari lain tidak boleh menimpa
  const lastDragEnd = useRef(0) // cap waktu akhir geseran; klik backdrop tepat sesudahnya diabaikan
  const startT = useRef(0)
  const dragXRef = useRef(0)
  const busy = useRef(false)
  const commitRef = useRef(null)
  const live = useRef({})
  const it = items[index]
  live.current = { it, index, controlsOn, onIndexChange, items }
  const multi = items.length > 1

  // Jendela 3 slot di sekitar item aktif: [sebelum, aktif, sesudah] — navigasi melingkar seperti sebelumnya.
  const slots = multi
    ? [
        { it: items[(index - 1 + items.length) % items.length], active: false },
        { it, active: true },
        { it: items[(index + 1) % items.length], active: false },
      ]
    : [{ it, active: true }]

  function setDrag(x, a) {
    dragXRef.current = x
    setDragX(x)
    setAnim(a)
  }

  function lebar() {
    return viewRef.current?.clientWidth || 0
  }

  // Pindah item dengan animasi geser penuh, lalu rel ditata ulang ke tengah.
  function lompat(dir) {
    if (commitRef.current) { commitRef.current(dir); return }
    onIndexChange((index + dir + items.length) % items.length)
  }

  function maju(dir) {
    if (!busy.current) lompat(dir)
  }

  // --- Mesin geser: listener nempel di window, BUKAN pointer capture di rel ---
  // Pointer capture di rel me-retarget klik ke rel, bikin tombol di dalamnya (Tutup, ⇄ Geser) tidak bisa diklik.
  useEffect(() => {
    function w() { return viewRef.current?.clientWidth || 0 }
    function commit(dir) {
      const cur = live.current
      const width = w()
      if (!width) { cur.onIndexChange((cur.index + dir + cur.items.length) % cur.items.length); return }
      busy.current = true
      setDrag(-dir * width, true)
      clearTimeout(commitTimer.current)
      commitTimer.current = setTimeout(() => {
        const c = live.current
        c.onIndexChange((c.index + dir + c.items.length) % c.items.length)
        setDrag(0, false)
        busy.current = false
      }, 310)
    }
    commitRef.current = commit
    function move(e) {
      if (startX.current === null || busy.current) return
      if (e.pointerId !== undefined && e.pointerId !== activePointer.current) return
      const width = w()
      if (!width) return
      const dx = e.clientX - startX.current
      setDrag(Math.max(-width, Math.min(width, dx)), false)
    }
    function up(e) {
      if (startX.current === null) return
      if (e && e.pointerId !== undefined && e.pointerId !== activePointer.current) return
      const dx = dragXRef.current
      const dt = Date.now() - startT.current
      startX.current = null
      activePointer.current = null
      if (Math.abs(dx) > 8) lastDragEnd.current = Date.now()
      if (Math.abs(dx) > 60) { commit(dx < 0 ? 1 : -1); return }
      setDrag(0, true)
      // Ketukan pelan di video YouTube = serahkan permukaan ke kontrol pemutarnya
      const cur = live.current
      if (Math.abs(dx) < 8 && dt < 400 && cur.it && cur.it.type === 'youtube' && !cur.controlsOn) setControlsOn(true)
    }
    function cancel(e) {
      if (startX.current === null) return
      if (e && e.pointerId !== undefined && e.pointerId !== activePointer.current) return
      startX.current = null
      activePointer.current = null
      setDrag(0, true)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
    }
  }, [])

  function onPD(e) {
    if (busy.current || !multi) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (activePointer.current !== null) return // geseran sudah dimiliki satu jari
    // Seretan tidak pernah dimulai dari tombol/tautan — klik mereka harus murni.
    if (e.target && e.target.closest && e.target.closest('button, a')) return
    // Jangan sambar seek bar / kontrol video lokal: tekanan di 48px terbawah elemen
    // <video> adalah wilayah kontrolnya — serahkan ke pemutar, jangan mulai geseran.
    const vid = e.target && e.target.closest && e.target.closest('video')
    if (vid) {
      const r = vid.getBoundingClientRect()
      if (e.clientY > r.bottom - 48) return
    }
    activePointer.current = e.pointerId
    startX.current = e.clientX
    startT.current = Date.now()
  }

  // Ganti item = mode geser lagi (lapisan penangkap geseran di video YouTube dipasang ulang)
  useEffect(() => { setControlsOn(false) }, [index])

  useEffect(() => () => clearTimeout(commitTimer.current), [])

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
    timer.current = setTimeout(() => maju(1), 4000)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index, items])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') maju(1)
      if (e.key === 'ArrowLeft') maju(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items, onClose])

  if (!it) return null
  // Portal ke <body>: wajib di luar <main class="page-fade-in"> — animasi fade-nya memakai transform,
  // dan elemen ber-transform jadi patokan posisi `fixed` (bukan viewport), bikin lightbox nyasar ke tengah halaman.
  return createPortal(
    <div onClick={() => { if (Date.now() - lastDragEnd.current < 350) return; onClose() }} className="fixed inset-0 z-50 grid h-dvh place-items-center overflow-y-auto bg-plum/85 backdrop-blur-sm p-4">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full flex flex-col items-center gap-3">
        <div ref={viewRef} className="w-full overflow-hidden">
          <div
            className={`flex w-full select-none ${multi ? 'cursor-grab touch-pan-y active:cursor-grabbing' : ''}`}
            style={multi ? { transform: `translateX(calc(-100% + ${dragX}px))`, transition: anim ? 'transform 300ms ease' : 'none' } : undefined}
            onPointerDown={onPD}>
            {slots.map((s, i) => (
              <div key={`${s.it.id}-${s.active ? 'aktif' : 'tepi' + i}`} className="w-full shrink-0 flex items-start justify-center">
                {s.it.type === 'photo' ? (
                  <div className="relative">
                    {s.active ? <Media it={s.it} /> : <MediaTetangga it={s.it} />}
                    {s.active && (
                      <button onClick={onClose} aria-label="Tutup" className="absolute right-2.5 top-2.5 z-10 rounded-full bg-plum/70 px-3 py-1.5 text-xs font-bold text-milk shadow-lg backdrop-blur-sm">Tutup</button>
                    )}
                  </div>
                ) : (
                  <div className="relative flex flex-col">
                    {s.active && (
                      <button onClick={onClose} aria-label="Tutup" className="relative z-20 mb-2 self-end rounded-full bg-plum/70 px-3 py-1.5 text-xs font-bold text-milk shadow-lg backdrop-blur-sm">Tutup</button>
                    )}
                    {s.active ? <Media it={s.it} /> : <MediaTetangga it={s.it} />}
                    {s.active && s.it.type === 'youtube' && !controlsOn && (
                      <div className="absolute inset-0 z-10" aria-hidden="true" />
                    )}
                    {s.active && s.it.type === 'youtube' && controlsOn && (
                      <button onClick={() => setControlsOn(false)} className="absolute left-2.5 top-2.5 z-20 rounded-full bg-plum/70 px-3 py-1.5 text-xs font-bold text-milk shadow-lg backdrop-blur-sm">⇄ Geser</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
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
