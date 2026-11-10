'use client'
import { useT } from '../../lib/i18n'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ytId, imgOpt, creditOf } from '../../lib/supabase'
import { getFavorites, toggleFavorite, FAVS_EVENT } from '../../lib/favorites'
import { itemShareUrl } from '../../lib/galeriUrl'
import { shareOrCopy } from '../../lib/share'
import { downloadBlob } from '../../lib/download'
import { makeWallpaperBlob, makePhotocardBlob } from '../../lib/cardMaker'
import { albumKeysOf, DISPLAY_NAME } from '../../lib/gallery'
import { tagsOf, tagLabel } from '../../lib/gallery'
import Reactions from './Reactions'
import CollectionPicker from './CollectionPicker'
import ReportButton from './ReportButton'

// Foto aktif memakai BINGKAI YANG SAMA PERSIS dengan foto tetangga (lebar + rasio 3/4) —
// versi lama: aktif = ukuran alami (max-h saja) sementara tetangga = bingkai tetap 3/4,
// jadi pas geser/commit ukuran badan foto berubah-ubah (kelihatan "mencong" & kedip kosong).
// object-contain: foto tampil utuh tanpa crop di dalam bingkai yang stabil.
// URL aktif juga lewat imgOpt(1000) — versi lama memuat file asli ukuran penuh (lambat,
// kedip kosong di HP) sementara tetangga cuma 700px.
function Media({ it, videoRef, onEnded, ytTitle }) {
  if (it.type === 'photo') return (
    <span className="relative block aspect-[3/4] w-[76vw] max-w-[380px] overflow-hidden rounded-2xl bg-white/5 mx-auto">
      <img src={imgOpt(it.url, 1000)} alt={it.title || it.idol} draggable={false} className="absolute inset-0 h-full w-full object-contain" />
    </span>
  )
  if (it.type === 'video') return <video ref={videoRef} onEnded={onEnded} src={it.url} controls autoPlay playsInline className="max-h-[max(140px,calc(100dvh-320px))] sm:max-h-[calc(100dvh-280px)] rounded-2xl mx-auto" />
  return <iframe title={ytTitle} src={`https://www.youtube.com/embed/${ytId(it.url)}?autoplay=1`} allow="autoplay; fullscreen" allowFullScreen className="w-full max-h-[calc(100dvh-300px)] aspect-video rounded-2xl mx-auto" />
}

// Media tetangga di rel geser: versi ringan TANPA autoplay — video cuma bingkai pertama,
// YouTube cuma thumbnail — biar gesernya enteng dan tidak ada dua suara bunyi barengan.
// Foto & video diberi BINGKAI TETAP (panel lembut bg-white/5) supaya slotnya selalu punya
// badan yang kelihatan walau medianya belum selesai dimuat — tidak ada ruang kosong pas geser.
function MediaTetangga({ it }) {
  const frame = "relative block aspect-[3/4] w-[76vw] max-w-[380px] overflow-hidden rounded-2xl bg-white/5 mx-auto pointer-events-none"
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
    <span className="relative block w-full mx-auto rounded-2xl bg-white/5 pointer-events-none">
      {/* maxresdefault tidak tersedia untuk semua video — jatuh ke hqdefault (selalu ada) supaya slot tidak kosong. */}
      <img src={`https://img.youtube.com/vi/${ytId(it.url)}/maxresdefault.jpg`}
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://img.youtube.com/vi/${ytId(it.url)}/hqdefault.jpg` }}
        alt={it.title || it.idol} draggable={false} className="w-full max-h-[calc(100dvh-300px)] aspect-video object-cover rounded-2xl" />
      <span className="absolute inset-0 grid place-items-center text-5xl text-white drop-shadow-lg" aria-hidden>▶</span>
    </span>
  )
}

export default function Lightbox({ items, index, onIndexChange, onClose, autoplay = false }) {
  const t = useT()
  const [playing, setPlaying] = useState(autoplay)
  const [making, setMaking] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [anim, setAnim] = useState(false)
  const [controlsOn, setControlsOn] = useState(false)
  const [favIds, setFavIds] = useState(() => getFavorites())
  const [shareMsg, setShareMsg] = useState('')
  const shareTimer = useRef(null)
  const timer = useRef(null)
  const commitTimer = useRef(null)
  const viewRef = useRef(null)
  const dialogRef = useRef(null)
  const videoRef = useRef(null)
  const startX = useRef(null)
  const activePointer = useRef(null) // pointerId pemilik geseran aktif — jari lain tidak boleh menimpa
  const lastDragEnd = useRef(0) // cap waktu akhir geseran; klik backdrop tepat sesudahnya diabaikan
  const startT = useRef(0)
  const dragXRef = useRef(0)
  const busy = useRef(false)
  const commitRef = useRef(null)
  const live = useRef({})
  const it = items[index]
  live.current = { it, index, controlsOn, onIndexChange, items, playing }
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

  // Kunci scroll halaman di belakang selama lightbox terbuka (di HP, geser vertikal dulu ikut
  // menggulir grid di belakangnya).
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Fokus keyboard: pindah ke lightbox saat dibuka, kembali ke kartu asal saat ditutup.
  // Dulu fokus tertinggal di grid di belakang, jadi Tab berjalan di elemen yang tertutup lightbox.
  useEffect(() => {
    const prev = document.activeElement
    dialogRef.current?.focus({ preventScroll: true })
    return () => { if (prev && typeof prev.focus === 'function' && document.contains(prev)) prev.focus({ preventScroll: true }) }
  }, [])
  // Tab / Shift+Tab berputar di dalam lightbox saja.
  function trapTab(e) {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const els = [...dialogRef.current.querySelectorAll('button:not([disabled]), a[href], iframe, video[controls], textarea, input')]
      .filter((el) => el.offsetParent !== null || el === document.activeElement)
    if (els.length === 0) return
    const first = els[0], last = els[els.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  // Favorit dari dalam lightbox — tetap sinkron dengan grid & nav lewat FAVS_EVENT.
  useEffect(() => {
    const sync = () => setFavIds(getFavorites())
    window.addEventListener(FAVS_EVENT, sync)
    return () => window.removeEventListener(FAVS_EVENT, sync)
  }, [])
  // Link langsung ke item ini (/galeri?item=<id>) — dibuka orang lain langsung di lightbox.
  async function share() {
    const msg = await shareOrCopy(itemShareUrl(window.location.origin, it.id), it.title || it.idol || 'Hearts2Hearts Gallery')
    if (!msg) return
    setShareMsg(t(msg))
    clearTimeout(shareTimer.current)
    shareTimer.current = setTimeout(() => setShareMsg(''), 2200)
  }
  useEffect(() => () => clearTimeout(shareTimer.current), [])

  function toggleFav(e) {
    const was = favIds.includes(it.id)
    setFavIds(toggleFavorite(it.id))
    if (!was) {
      const r = e.currentTarget.getBoundingClientRect()
      window.dispatchEvent(new CustomEvent('h2h:favorite', { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }))
    }
  }

  function flash(msg) {
    setShareMsg(msg)
    clearTimeout(shareTimer.current)
    shareTimer.current = setTimeout(() => setShareMsg(''), 2500)
  }

  async function makeWallpaper() {
    setMaking('wallpaper')
    try {
      downloadBlob(await makeWallpaperBlob(it.url), 'wallpaper-h2h.jpg')
    } catch {
      // Gambar dari sumber luar bisa memblokir pengolahan di browser.
      flash(t('Wallpaper gagal dibuat untuk foto ini.'))
    }
    setMaking(false)
  }

  // Photocard (fitur 7): foto + bingkai + nama member + hati ganda, diunduh sebagai PNG.
  async function makePhotocard() {
    setMaking('pc')
    try {
      const keys = albumKeysOf(it)
      const name = keys.length ? keys.map((k) => DISPLAY_NAME[k] || k).join(' & ') : (it.idol || 'Hearts2Hearts')
      const blob = await makePhotocardBlob(it.url, { name, sub: it.era || '' })
      downloadBlob(blob, `photocard-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`)
    } catch {
      flash(t('Photocard gagal dibuat untuk foto ini.'))
    }
    setMaking(false)
  }

  // Slideshow: foto & YouTube 4 detik. Video upload diputar sampai selesai (onEnded) — dulu
  // dipotong setelah 4 detik. Kalau video tidak berjalan (autoplay diblokir browser), lanjut
  // setelah 4 detik seperti sebelumnya supaya slideshow tidak macet.
  useEffect(() => {
    if (!playing || items.length < 2) return
    timer.current = setTimeout(() => {
      if (it && it.type === 'video' && videoRef.current && !videoRef.current.paused && !videoRef.current.ended) return
      maju(1)
    }, 4000)
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
    <div ref={dialogRef} tabIndex={-1} onKeyDown={trapTab}
      role="dialog" aria-modal="true" aria-label={it.title || it.idol || t('Tampilan penuh')}
      onClick={() => { if (Date.now() - lastDragEnd.current < 350) return; onClose() }} className="fixed inset-0 z-50 grid h-dvh grid-cols-[minmax(0,1fr)] place-items-center overflow-y-auto overflow-x-hidden bg-[#0b1a2c]/95 p-4 outline-none">
      {/* Kolom WAJIB min-w-0 + max-w: tanpa itu lebar kolom ditentukan max-content rel geser
          (3 slot × lebar bingkai ≈ 889px) — lightbox jadi lebih lebar dari layar HP dan bisa
          kegeser menyamping, foto diamnya pun di luar tengah. Terukur pakai Chromium 390px. */}
      <div onClick={(e) => e.stopPropagation()} className="relative mx-auto flex w-full min-w-0 max-w-[440px] flex-col items-center gap-3">
        <div ref={viewRef} className="w-full min-w-0 overflow-hidden">
          <div
            className={`flex w-full select-none ${multi ? 'cursor-grab touch-pan-y active:cursor-grabbing' : ''}`}
            style={multi ? { transform: `translateX(calc(-100% + ${dragX}px))`, transition: anim ? 'transform 300ms ease' : 'none' } : undefined}
            onPointerDown={onPD}>
            {slots.map((s, i) => (
              <div key={`${s.it.id}-${s.active ? 'aktif' : 'tepi' + i}`} className="w-full shrink-0 flex items-start justify-center">
                {s.it.type === 'photo' ? (
                  <div className="relative w-fit">
                    {s.active ? <Media it={s.it} /> : <MediaTetangga it={s.it} />}
                    {s.active && (
                      <button onClick={onClose} aria-label={t('Tutup')} className="absolute right-2.5 top-2.5 z-10 rounded-full bg-plum/70 px-3 py-1.5 text-xs font-bold text-milk shadow-lg backdrop-blur-sm">{t('Tutup')}</button>
                    )}
                  </div>
                ) : (
                  <div className="relative flex flex-col">
                    {s.active && (
                      <button onClick={onClose} aria-label={t('Tutup')} className="relative z-20 mb-2 self-end rounded-full bg-plum/70 px-3 py-1.5 text-xs font-bold text-milk shadow-lg backdrop-blur-sm">{t('Tutup')}</button>
                    )}
                    {s.active
                      ? <Media it={s.it} ytTitle={t('Video YouTube: {judul}', { judul: s.it.title || s.it.idol || 'Hearts2Hearts' })} videoRef={videoRef} onEnded={() => { if (live.current.playing) maju(1) }} />
                      : <MediaTetangga it={s.it} />}
                    {s.active && s.it.type === 'youtube' && !controlsOn && (
                      <div className="absolute inset-0 z-10" aria-hidden="true" />
                    )}
                    {s.active && s.it.type === 'youtube' && controlsOn && (
                      <button onClick={() => setControlsOn(false)} className="absolute left-2.5 top-2.5 z-20 rounded-full bg-plum/70 px-3 py-1.5 text-xs font-bold text-milk shadow-lg backdrop-blur-sm">⇄ {t('Geser')}</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full min-w-0 text-center px-4">
          <p className="font-bold text-milk break-words">{it.title || it.idol}</p>
          <p className="text-xs text-gold font-bold mt-0.5">{it.idol}{it.group_name ? ` · ${it.group_name}` : ''}</p>
          {creditOf(it) && <p className="text-[11px] text-milk/60 mt-1">{creditOf(it)}</p>}
          {tagsOf(it).length > 0 && <p className="mt-1 text-[11px] font-bold text-lilac">{tagsOf(it).map((k) => `#${tagLabel(k)}`).join('  ')}</p>}
          {multi && <p className="mt-1 text-[11px] font-bold tabular-nums text-milk/50">{index + 1} / {items.length}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {items.length > 1 && (
            <button onClick={() => setPlaying((p) => !p)} className="px-3 py-1.5 rounded-full bg-white/90 text-plum font-bold text-sm">{playing ? `⏸ ${t('Jeda')}` : `▶ ${t('Putar semua')}`}</button>
          )}
          <button onClick={toggleFav} aria-pressed={favIds.includes(it.id)}
            className="px-3 py-1.5 rounded-full bg-white/90 text-plum font-bold text-sm">
            {favIds.includes(it.id) ? `❤️ ${t('Favorit')}` : `🤍 ${t('Favoritkan')}`}
          </button>
          <CollectionPicker itemId={it.id} />
          <button onClick={share} className="px-3 py-1.5 rounded-full bg-white/90 text-plum font-bold text-sm">🔗 {t('Bagikan')}</button>
          {it.type !== 'youtube' ? (
            <a href={`${it.url}?download=${encodeURIComponent(it.url.split('/').pop() || 'hearts2hearts')}`} className="px-3 py-1.5 rounded-full bg-gold text-plum font-bold text-sm">⬇ {t('Unduh')}</a>
          ) : (
            <a href={it.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full bg-gold text-plum font-bold text-sm">{t('Buka di YouTube')}</a>
          )}
          {it.type === 'photo' && (
            <button onClick={makeWallpaper} disabled={!!making} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lilac text-plum font-bold text-sm disabled:opacity-50">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="9" r="1.5" />
                <path d="M21 15l-5-5-9 9" />
              </svg>
              {making === 'wallpaper' ? t('Membuat…') : t('Wallpaper HP')}
            </button>
          )}
          {it.type === 'photo' && (
            <button onClick={makePhotocard} disabled={!!making} className="px-3 py-1.5 rounded-full bg-lilac text-plum font-bold text-sm disabled:opacity-50">
              🎴 {making === 'pc' ? t('Membuat…') : t('Photocard')}
            </button>
          )}
        </div>
        {shareMsg && <p role="status" className="text-xs font-bold text-gold">{shareMsg}</p>}
        <Reactions key={it.id} itemId={it.id} />
        <ReportButton itemId={it.id} />
      </div>
    </div>,
    document.body
  )
}
