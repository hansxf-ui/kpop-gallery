'use client'
import { useState } from 'react'
import Link from 'next/link'
import { imgOpt } from '../../lib/supabase'
import { thumbOf, albumKeysOf } from '../../lib/gallery'

// Kartu grid bersama untuk /galeri, /idol/[name], dan /favorit.
// - Tombol hati = <button> sendiri (dulu <span role="button"> di dalam <button>: tidak bisa
//   difokus keyboard dan HTML-nya tidak sah).
// - Selama gambar belum dimuat, bingkai punya tinggi cadangan. Tanpa itu semua <img> lazy
//   bertinggi 0 dan menumpuk di layar, jadi browser memuat seluruh 40 gambar sekaligus.
// - srcSet 400/800px: HP 2 kolom cukup unduh versi 400px.
const SIZES = '(min-width: 1024px) 270px, (min-width: 768px) 33vw, 50vw'

export default function GalleryCard({ it, isFav, onOpen, onFav, showIdol = true, favLabel }) {
  const [loaded, setLoaded] = useState(false)
  const src = thumbOf(it)
  const small = imgOpt(src, 400)
  const big = imgOpt(src, 800)
  const srcSet = big !== src ? `${small} 400w, ${big} 800w` : undefined
  const keys = albumKeysOf(it)
  const label = it.title || it.idol || 'Item galeri'
  const placeholder = loaded ? '' : it.type === 'youtube' ? 'aspect-video' : 'aspect-[3/4]'

  function fav(e) {
    e.stopPropagation()
    e.preventDefault()
    // Klik keyboard (Enter/Spasi) tidak punya koordinat — pakai titik tengah tombol untuk confetti.
    const r = e.currentTarget.getBoundingClientRect()
    const fromKey = e.detail === 0
    onFav(fromKey ? r.left + r.width / 2 : e.clientX, fromKey ? r.top + r.height / 2 : e.clientY)
  }

  return (
    <div className="card relative mb-4 w-full break-inside-avoid">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className={`relative overflow-hidden rounded-2xl bg-[#DCEBF6] dark:bg-[#1B3049] ${placeholder}`}>
          {it.type === 'video'
            ? <video src={it.url + '#t=0.1'} preload="metadata" muted playsInline onLoadedData={() => setLoaded(true)} onError={() => setLoaded(true)} className="w-full" />
            : <img
                ref={(el) => { if (el && el.complete && el.naturalWidth && !loaded) setLoaded(true) }}
                src={big} srcSet={srcSet} sizes={srcSet ? SIZES : undefined}
                alt={label} loading="lazy" decoding="async"
                onLoad={() => setLoaded(true)} onError={() => setLoaded(true)}
                className={`w-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} />}
          {it.type !== 'photo' && <span className="absolute inset-0 grid place-items-center text-4xl text-white drop-shadow-lg" aria-hidden>▶</span>}
        </div>
        <p className={`truncate px-2 text-sm font-bold dark:text-milk ${showIdol ? 'pt-2.5' : 'py-2.5'}`}>{label}</p>
      </button>
      <button type="button" onClick={fav} aria-pressed={isFav}
        aria-label={favLabel || (isFav ? 'Hapus dari favorit' : 'Favoritkan')}
        className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-base shadow-sm transition hover:scale-110">
        {isFav ? '❤️' : '🤍'}
      </button>
      {showIdol && (
        <p className="w-fit px-2 pb-2.5 text-xs font-bold text-gold">
          {keys.length > 0
            ? keys.map((k, i) => (
                <span key={k}>
                  {i > 0 && ' & '}
                  <Link href={`/idol/${encodeURIComponent(k)}`} className="hover:underline">{k === 'HEARTS2HEARTS' ? 'Hearts2Hearts' : k}</Link>
                </span>
              ))
            : it.idol}
          {it.group_name ? ` · ${it.group_name}` : ''}
        </p>
      )}
    </div>
  )
}
