'use client'
import { useRef, useState } from 'react'
import { ytId, imgOpt } from '../../lib/supabase'
import { thumbOf as thumb, altOf } from '../../lib/gallery'
import { useT } from '../../lib/i18n'

// Carousel sorotan beranda — adaptasi demo Carousel shadcn/ui kiriman pemilik (18 Okt 2026)
// ke stack situs ini (galeri tidak memakai shadcn/embla): rel geser scroll-snap + panah prev/next,
// kartu persegi seperti demo, isi = item sorotan beneran (bukan angka contoh).
export default function FeaturedCarousel({ items, onOpen }) {
  const t = useT()
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
                        alt={altOf(it)} loading={i === 0 ? 'eager' : 'lazy'} className="w-full aspect-square object-cover object-[center_22%]" />
                    : <img src={imgOpt(thumb(it), 1200)} alt={altOf(it)} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" className="w-full aspect-square object-cover object-[center_22%]" />}
                {it.type !== 'photo' && <span className="absolute inset-0 grid place-items-center text-5xl text-white drop-shadow-lg" aria-hidden>▶</span>}
              </span>
              <span className="block px-3 py-3 font-bold dark:text-milk">{it.title || it.idol} <span className="text-gold text-sm">· {it.idol}</span></span>
            </button>
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <>
          {/* Lapisan seukuran FOTO slide yang tampil: inset = px-1 rel (4px) + border (1px) + padding
              .featured-card (10px), tinggi = lebar (foto persegi). Panah dipusatkan pada foto, 10px dari
              tepinya — dulu top-[36%] dari seluruh kartu (termasuk judul) dan left-3 dari tepi luar, jadi
              panah menindih tepi foto & bingkai kartu dan tidak sejajar tengah foto. */}
          <div className="pointer-events-none absolute left-[15px] right-[15px] top-[11px] aspect-square">
            {[[-1, 'Pilihan sebelumnya', 'left-2.5', 'M15 18l-6-6 6-6', active === 0], [1, 'Pilihan berikutnya', 'right-2.5', 'M9 18l6-6-6-6', active === items.length - 1]].map(([dir, label, side, d, ujung]) => (
              <button key={dir} onClick={() => go(dir)} aria-label={t(label)} disabled={ujung} tabIndex={ujung ? -1 : 0}
                className={`pointer-events-auto absolute ${side} top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white shadow-[0_2px_10px_rgba(0,0,0,.25)] ring-1 ring-white/50 backdrop-blur-sm transition hover:bg-black/50 focus-visible:bg-black/50 ${ujung ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
              </button>
            ))}
          </div>
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
