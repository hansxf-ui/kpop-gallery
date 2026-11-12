'use client'
import { useT, useLocale } from '../lib/i18n'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { imgOpt } from '../lib/supabase'
import { fetchMemberCounts } from '../lib/counts'
import ThemeToggle from './components/ThemeToggle'
import SiteNav from './components/SiteNav'
import SpecialCountdown from './components/SpecialCountdown'
import FandomStats from './components/FandomStats'
import TodaySection from './components/TodaySection'
import { todayFrom } from '../lib/today'
import { WIRE_PATH, stringTop } from '../lib/lanyard'

const SB = 'https://lpuvkrbdctankydvmzpy.supabase.co/storage/v1/object/public/gallery/'
// Foto pilihan dari koleksi galeri sendiri + jumlah item yang menyebut tiap member (audit DB 18 Okt 2026).
// Foto seragam sekolah era 'FOCUS' — satu set seragam (abu + kemeja putih + dasi), pose tegak serius.
const MEMBERS = [
  { key: 'JIWOO', name: 'Jiwoo', pos: 'Leader', count: 128, file: '1790941317262-jawyk-JIWOO___Potret_individu_konsep_sekolah_buat__FOCUS_.jpg', obj: '50% 25%' },
  { key: 'CARMEN', name: 'Carmen', pos: 'Main Vocal', count: 140, file: '1790941299261-pxqrr-CARMEN___Potret_individu_konsep_sekolah_buat__FOCUS_.jpg', obj: '30% 25%' },
  { key: 'YUHA', name: 'Yuha', pos: 'Main Vocal · Lead Dancer', count: 127, file: '1790941364347-hhwiy-YUHA___Potret_individu_konsep_sekolah_buat__FOCUS_.jpg', obj: '60% 20%' },
  { key: 'STELLA', name: 'Stella', pos: 'Lead Vocal', count: 131, file: '1790941356664-izd35-STELLA___Potret_individu_pakai_seragam_sekolah_era__FOCUS_.jpg', obj: '50% 18%' },
  { key: 'JUUN', name: 'Juun', pos: 'Main Dancer · Main Rapper', count: 139, file: '1790941347448-bvlr6-JUUN___Potret_individu_pakai_seragam_sekolah_era__FOCUS_.jpg', obj: '50% 15%' },
  { key: 'A-NA', name: 'A-na', pos: 'Lead Rapper · Visual', count: 125, file: '1790941398384-r9iqj-A-NA___Potret_individu_pakai_seragam_sekolah_era__FOCUS_.jpg', obj: '50% 15%' },
  { key: 'IAN', name: 'Ian', pos: 'Main Dancer · Center', count: 129, file: '1790941406679-d1obh-IAN___Potret_individu_pakai_seragam_sekolah_era__FOCUS_.jpg', obj: '50% 15%' },
  { key: 'YE-ON', name: 'Ye-on', pos: 'Lead Vocal · Maknae', count: 122, file: '1790941446922-hvrvd-YE-ON___Potret_individu_konsep_sekolah_buat__FOCUS_.jpg', obj: '50% 18%' },
]
const DUR = [5.2, 6.1, 5.6, 6.5, 5.9, 6.3, 5.4, 6.0]
const DEL = [-0.4, -1.4, -2.6, -0.8, -1.9, -3.1, -1.1, -2.2]

function Kartu({ m, i, count }) {
  const t = useT()
  const [flip, setFlip] = useState(false)
  const kickRef = useRef(null)
  // Kartu maksimal 240px lebar → 480px cukup untuk layar 2x (dulu 800px, ±2,5× lebih berat).
  const url = imgOpt(SB + m.file, 480)
  // Tendangan ayun dijalankan via Web Animations API di pembungkus yang STABIL —
  // versi lama memakai key={kick} yang me-remount seluruh subtree tiap klik,
  // sehingga .lc-flip lahir langsung di posisi akhir dan transisi baliknya mati total.
  const toggle = () => {
    setFlip((f) => !f)
    const el = kickRef.current
    if (el) {
      el.getAnimations().forEach((a) => a.cancel())
      el.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(4.5deg)', offset: 0.25 },
          { transform: 'rotate(-3deg)', offset: 0.55 },
          { transform: 'rotate(1.2deg)', offset: 0.8 },
          { transform: 'rotate(0deg)' },
        ],
        { duration: 900, easing: 'ease-out' }
      )
    }
  }
  return (
    // --k2 / --k4: titik tali bertemu kawat untuk baris 2 kolom (HP & tablet) dan 4 kolom (≥1024px).
    <div className="lc-hang" style={{ '--k2': stringTop(i % 2, 2), '--k4': stringTop(i % 4, 4) }}>
      <span className="lc-string" aria-hidden />
      <span className="lc-clip" aria-hidden />
      <div className="lc-sway" style={{ animationDuration: `${DUR[i]}s`, animationDelay: `${DEL[i]}s` }}>
        <div ref={kickRef} className="lc-kickwrap">
          <div
            className={`lc-flip${flip ? ' lc-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={t('Balik kartu {nama}', { nama: m.name })}
            onClick={toggle}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
          >
            {/* DEPAN */}
            <div className="lc-face bg-white shadow-[0_10px_22px_rgba(23,58,86,0.14)] dark:bg-[#14304a]">
              <div className="lc-meta flex justify-between px-4 pb-2 pt-3 font-bold tracking-[0.2em] text-plum/45 dark:text-milk/45">
                <span>MEMBER / H2H</span><span>#{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="mx-3 overflow-hidden rounded-xl" style={{ aspectRatio: '1 / 0.94' }}>
                <img src={url} alt={t('Foto {nama}', { nama: m.name })} decoding="async" className="h-full w-full object-cover" style={{ objectPosition: m.obj }} draggable={false} />
              </div>
              <div className="px-4 pt-3">
                <h3 className="lc-fname font-display leading-tight text-plum dark:text-milk">{m.name}</h3>
                <p className="lc-fpos text-plum/55 dark:text-milk/55">{m.pos}</p>
              </div>
              <div className="mt-auto flex items-center justify-between px-4 pb-3.5">
                <span className="lc-meta font-bold tracking-[0.2em] text-plum/45 dark:text-milk/45">{t('LIHAT PROFIL')}</span>
                <span className="lc-dot grid place-items-center rounded-full bg-plum text-milk dark:bg-gold dark:text-plum">+</span>
              </div>
            </div>
            {/* BELAKANG — holografik */}
            <div className="lc-face lc-back lc-holo text-[#26232e]">
              <div className="lc-btop relative flex items-center">
                <img src={url} alt="" decoding="async" className="lc-bthumb rounded-full border-2 border-white/80 object-cover" style={{ objectPosition: m.obj }} draggable={false} />
                <div>
                  <h4 className="lc-bname font-display leading-tight">{m.name}</h4>
                  <p className="lc-bpos text-[#5c5770]">{m.pos}</p>
                </div>
              </div>
              <div className="lc-brows relative">
                <div className="lc-brow flex items-baseline justify-between gap-2 border-t border-[#26232e]/15">
                  <span className="lc-blab tracking-[0.08em] text-[#5c5770]">{t('POSISI')}</span><b className="whitespace-nowrap text-right font-semibold">{m.pos}</b>
                </div>
                <div className="lc-brow flex items-baseline justify-between gap-2 border-t border-[#26232e]/15">
                  <span className="lc-blab tracking-[0.08em] text-[#5c5770]">{t('ITEM DI GALERI')}</span><b className="whitespace-nowrap font-semibold">{t('{n} item', { n: count ?? m.count })}</b>
                </div>
              </div>
              <Link
                href={`/idol/${m.key}`}
                onClick={(e) => e.stopPropagation()}
                className="lc-blink relative block rounded-full bg-[#26232e] text-center font-bold text-white"
              >
                {t('Buka galeri {nama} →', { nama: m.name })}
              </Link>
              <div className="lc-btop relative mt-auto flex items-end justify-between">
                <small className="lc-bsmall font-bold leading-[1.7] tracking-[0.18em] text-[#5c5770]">{t('PINDAI BUAT BUKA')}<br />{t('GALERI {nama}', { nama: m.name.toUpperCase() })}</small>
                <img src={`/qr/${m.key.toLowerCase()}.png`} alt={t('QR galeri {nama}', { nama: m.name })} loading="lazy" decoding="async" className="lc-bqr rounded-lg bg-white shadow" draggable={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Kawat satu baris kartu. Ketebalan garis tetap walau SVG direntang (vector-effect).
function Wire({ className }) {
  return (
    <svg className={`lc-wire ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={WIRE_PATH} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" className="text-plum/25 dark:text-milk/25" />
    </svg>
  )
}

export default function Landing() {
  const t = useT()
  const loc = useLocale()
  // Jumlah item per member + total dihitung di database (view member_counts, lihat lib/counts.js)
  // — angka bawaan di MEMBERS hanya cadangan tampilan awal / saat gagal memuat.
  const [liveCounts, setLiveCounts] = useState(null)
  // null = memuat (dulu angka cadangan 1159 tampil lalu berganti), false = gagal → angka disembunyikan.
  const [liveTotal, setLiveTotal] = useState(null)
  useEffect(() => {
    let alive = true
    fetchMemberCounts()
      .then(({ counts, total }) => { if (alive) { setLiveCounts(counts); setLiveTotal(total) } })
      .catch(() => { if (alive) setLiveTotal(false) /* kartu tetap pakai angka cadangan */ })
    return () => { alive = false }
  }, [])
  // Tanggal "hari ini" untuk seksi Hari ini & hitung mundur: zona waktu pengunjung, jadi baru diketahui
  // setelah mount. ?tanggal=YYYY-MM-DD = mode coba tanggal (dulu di /hari-ini, kini dialihkan ke sini).
  const [today, setToday] = useState(null)
  useEffect(() => { setToday(todayFrom(window.location.search)) }, [])
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pb-10 pt-16 sm:px-8">
      <ThemeToggle />
      <SiteNav className="mb-8" />
      <style>{`
        /* Papan kartu: satu kawat per baris kartu. 2 kolom di HP & tablet, 4 kolom mulai 1024px.
           --H = tinggi ruang tali; panjang tiap tali dihitung dari lengkung kawat (lib/lanyard.js). */
        .lc-board{ --H:40px; }
        @media (min-width:640px){ .lc-board{ --H:52px; } }
        @media (min-width:1024px){ .lc-board{ --H:58px; } }
        .lc-row{ position:relative; display:flex; flex-direction:column; gap:1rem; }
        .lc-pair{ position:relative; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }
        .lc-cell{ display:flex; justify-content:center; padding:0 8px; }
        .lc-wire{ position:absolute; left:0; right:0; top:0; width:100%; height:var(--H); pointer-events:none; overflow:visible; }
        .lc-wire4{ display:none; }
        @media (min-width:1024px){
          .lc-row{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0; }
          .lc-pair{ display:contents; }
          .lc-wire2{ display:none; }
          .lc-wire4{ display:block; }
        }
        .lc-hang{ --k:var(--k2); position:relative; width:min(240px,100%); padding-top:var(--H); }
        @media (min-width:1024px){ .lc-hang{ --k:var(--k4); } }
        .lc-string{ position:absolute; left:50%; top:calc(var(--H) * var(--k)); width:1.5px; height:calc(var(--H) * (1 - var(--k))); transform:translateX(-50%); background:linear-gradient(#9db8cc,#c8d9e6); }
        html.dark .lc-string{ background:linear-gradient(#3d5a75,#5b7b99); }
        .lc-clip{ position:absolute; left:50%; top:calc(var(--H) - 12px); transform:translateX(-50%); width:16px; height:22px; border-radius:4px; z-index:3; background:linear-gradient(145deg,#ffffff,#c9d8e4); box-shadow:0 1px 3px rgba(23,58,86,.25), inset 0 0 0 1px rgba(23,58,86,.08); }
        .lc-clip::after{ content:""; position:absolute; left:50%; top:4px; transform:translateX(-50%); width:6px; height:6px; border-radius:50%; background:#fff; box-shadow:inset 0 0 0 1.5px #9db8cc; }
        /* Kartu berayun dari titik gantungnya di kawat (ujung atas tali). */
        .lc-sway{ transform-origin:50% calc(var(--H) * (var(--k) - 1)); animation-name:lcsway; animation-timing-function:ease-in-out; animation-iteration-count:infinite; will-change:transform; }
        @keyframes lcsway{ 0%,100%{ transform:rotate(1.15deg);} 50%{ transform:rotate(-1.15deg);} }
        .lc-kickwrap{ transform-origin:50% calc(var(--H) * (var(--k) - 1)); }
        .lc-flip{ position:relative; width:100%; aspect-ratio:240/338; transform-style:preserve-3d; transition:transform .85s cubic-bezier(.3,.7,.3,1); cursor:pointer; container-type:inline-size; }
        .lc-flip.lc-on{ transform:rotateY(180deg); }
        .lc-face{ position:absolute; inset:0; border-radius:18px; overflow:hidden; backface-visibility:hidden; -webkit-backface-visibility:hidden; display:flex; flex-direction:column; }
        .lc-back{ transform:rotateY(180deg); padding:7.5cqw 7.5cqw 6.7cqw; }
        /* Semua ukuran isi kartu pakai cqw (persen lebar kartu) — kartu menyusut = isi ikut
           menyusut proporsional, jadi di HP pun tidak ada isi yang kepotong. */
        .lc-meta{ font-size:3.55cqw; }
        .lc-fname{ font-size:9.2cqw; }
        .lc-fpos{ font-size:5cqw; }
        .lc-dot{ width:8.75cqw; height:8.75cqw; font-size:4.6cqw; }
        .lc-btop{ gap:4.2cqw; }
        .lc-bthumb{ width:18.3cqw; height:18.3cqw; }
        .lc-bname{ font-size:7.1cqw; }
        .lc-bpos{ font-size:4.4cqw; }
        .lc-brows{ margin-top:5.8cqw; }
        .lc-brow{ padding:2.9cqw 0; font-size:4.6cqw; }
        .lc-blab{ font-size:3.75cqw; }
        .lc-blink{ font-size:4.6cqw; padding:3.3cqw 0; margin-top:5cqw; }
        .lc-bsmall{ font-size:3.55cqw; }
        .lc-bqr{ width:26.7cqw; height:26.7cqw; padding:1.7cqw; }
        .lc-holo{ background:linear-gradient(125deg,#f6d9ec,#d9e4fb,#d5f3e3,#f7ecd2,#e6dbfa,#f6d9ec); background-size:320% 320%; }
        .lc-flip.lc-on .lc-holo{ animation:lcholo 9s ease infinite; }
        @keyframes lcholo{ 0%,100%{ background-position:0% 40%; } 50%{ background-position:100% 60%; } }
        @media (prefers-reduced-motion: reduce){
          .lc-sway{ animation:none; }
          .lc-flip{ transition:none; }
          .lc-flip.lc-on .lc-holo{ animation:none; }
        }
      `}</style>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-[10px] font-bold tracking-[0.22em] text-plum/50 dark:text-milk/50">
            <span className="text-gold">●</span>&nbsp; {t('GALERI FANS — HEARTS2HEARTS')}
          </p>
          <h1 className="font-display text-4xl leading-[1.05] text-plum dark:text-milk sm:text-[52px]">
            Meet the members<br />
            <span className="italic text-gold">behind the hearts.</span>
          </h1>
        </div>
        <p className="max-w-[260px] pt-2 text-xs leading-relaxed text-plum/55 dark:text-milk/55 sm:pt-6">
          {t('Delapan member Hearts2Hearts yang mengisi galeri ini — balik kartunya buat lihat profil singkat tiap member.')}
          <b className="mt-3 block text-[10px] tracking-[0.18em] text-plum dark:text-milk"><span className="text-gold">●</span>&nbsp; {liveTotal === false ? t('8 MEMBER') : t('8 MEMBER · {n} ITEM KOLEKSI', { n: liveTotal === null ? '…' : liveTotal.toLocaleString(loc) })}</b>
        </p>
      </header>

      <div className="lc-board mx-auto mt-4 w-full max-w-[1100px]">
        {[0, 4].map((start) => (
          <section key={start} className="lc-row mt-4">
            <Wire className="lc-wire4" />
            {[start, start + 2].map((p) => (
              <div key={p} className="lc-pair">
                <Wire className="lc-wire2" />
                {MEMBERS.slice(p, p + 2).map((m, j) => (
                  <div key={m.key} className="lc-cell">
                    <Kartu m={m} i={p + j} count={liveCounts?.[m.key]} />
                  </div>
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>

      <SpecialCountdown now={today?.override ? today.now : null} />
      <TodaySection now={today?.now} override={today?.override} />
      <FandomStats />

      <div className="mt-12 text-center">
        <Link
          href="/galeri"
          className="inline-block rounded-full bg-gold px-9 py-3.5 text-base font-bold text-plum shadow-[0_10px_26px_rgba(234,147,187,0.45)] transition hover:scale-[1.03]"
        >
          {t('Masuk ke Galeri →')}
        </Link>
      </div>

      <footer className="mt-auto flex flex-wrap justify-between gap-2 pt-12 text-[9px] font-bold tracking-[0.22em] text-plum/40 dark:text-milk/40">
        <span>THE MEMBERS MAKE THE HEARTS</span>
        <span>{t('KLIK / TAP KARTU BUAT LIHAT PROFIL')}</span>
      </footer>
    </div>
  )
}
