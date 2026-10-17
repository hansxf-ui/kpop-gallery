'use client'
import { useRef, useState } from 'react'
import { ytId, imgOpt } from '../../lib/supabase'

const thumb = (it) => (it.type === 'youtube' ? `https://img.youtube.com/vi/${ytId(it.url)}/mqdefault.jpg` : it.url)

// Carousel sorotan beranda — adaptasi demo Carousel shadcn/ui kiriman Ryan (18 Okt 2026)
// ke stack situs ini (galeri tidak memakai shadcn/embla): rel geser scroll-snap + panah prev/next,
// kartu persegi seperti demo, isi = item sorotan beneran (bukan angka contoh).
export default function FeaturedCarousel({ items, onOpen }) {
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)

  function go(dir) {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }

  function onScroll() {
    const el = trackRef.current
    if (!el) return
    const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollLeft / el.clientWidth)))
    if (i !== active) setActive(i)
  }

  if (!items || items.length === 0) return null

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div ref={trackRef} onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}>
        {items.map((it, i) => (
          <div key={it.id} className="w-full shrink-0 snap-center px-1">
            <button onClick={() => onOpen(i)} className="featured-card block w-full overflow-hidden text-left">
              <span className="relative block overflow-hidden rounded-2xl bg-[#DCEBF6] dark:bg-[#1B3049]">
                {it.type === 'video'
                  ? <video src={it.url + '#t=0.1'} preload="metadata" muted playsInline className="w-full aspect-square object-cover object-[center_22%]" />
                  : it.type === 'youtube'
                    ? <img src={`https://img.youtube.com/vi/${ytId(it.url)}/maxresdefault.jpg`}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = thumb(it) }}
                        alt={it.title || it.idol} className="w-full aspect-square object-cover object-[center_22%]" />
                    : <img src={imgOpt(thumb(it), 1200)} alt={it.title || it.idol} className="w-full aspect-square object-cover object-[center_22%]" />}
                {it.type !== 'photo' && <span className="absolute inset-0 grid place-items-center text-5xl text-white drop-shadow-lg" aria-hidden>▶</span>}
              </span>
              <span className="block px-3 py-3 font-bold dark:text-milk">{it.title || it.idol} <span className="text-gold text-sm">· {it.idol}</span></span>
            </button>
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Sorotan sebelumnya"
            className="absolute left-3 top-[36%] z-10 grid h-9 w-9 place-items-center rounded-full border border-rose/40 bg-white/85 text-lg font-bold text-plum shadow backdrop-blur dark:border-rose/20 dark:bg-white/10 dark:text-milk">‹</button>
          <button onClick={() => go(1)} aria-label="Sorotan berikutnya"
            className="absolute right-3 top-[36%] z-10 grid h-9 w-9 place-items-center rounded-full border border-rose/40 bg-white/85 text-lg font-bold text-plum shadow backdrop-blur dark:border-rose/20 dark:bg-white/10 dark:text-milk">›</button>
          <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
            {items.map((it, i) => (
              <span key={it.id} className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-gold' : 'w-1.5 bg-plum/25 dark:bg-milk/25'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
