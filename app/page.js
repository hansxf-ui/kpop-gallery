'use client'
import { useState } from 'react'
import Link from 'next/link'
import { imgOpt } from '../lib/supabase'

const SB = 'https://lpuvkrbdctankydvmzpy.supabase.co/storage/v1/object/public/gallery/'
// Foto pilihan dari koleksi galeri sendiri + jumlah item yang menyebut tiap member (audit DB 18 Okt 2026).
const MEMBERS = [
  { key: 'JIWOO', name: 'Jiwoo', pos: 'Leader', count: 128, file: '1790949259942-q7eqd-JIWOO___Foto_konsep__ICONIC_HEART__14__rilisan_jaket_album.png', obj: '32% 30%' },
  { key: 'CARMEN', name: 'Carmen', pos: 'Main Vocal', count: 140, file: '1790467840892-qgtmr-photo-17-carmen.jpg', obj: '50% 22%' },
  { key: 'YUHA', name: 'Yuha', pos: 'Main Vocal · Lead Dancer', count: 127, file: '1790445197510-g2sub-photo-13-yuha.jpg', obj: '50% 20%' },
  { key: 'STELLA', name: 'Stella', pos: 'Lead Vocal', count: 131, file: '1790952337890-t4x7d-Etoile_0618_2105995654464249880_1.jpg', obj: '50% 18%' },
  { key: 'JUUN', name: 'Juun', pos: 'Main Dancer · Main Rapper', count: 139, file: '1790468034206-elqqc-photo-25-juun.jpg', obj: '50% 16%' },
  { key: 'A-NA', name: 'A-na', pos: 'Lead Rapper · Visual', count: 125, file: '1790467918158-zvyo8-photo-20-ana.jpg', obj: '50% 20%' },
  { key: 'IAN', name: 'Ian', pos: 'Main Dancer · Center', count: 129, file: '1790949262559-on6pj-IAN___Foto_konsep__ICONIC_HEART__14__rilisan_jaket_album.png', obj: '26% 32%' },
  { key: 'YE-ON', name: 'Ye-on', pos: 'Lead Vocal · Maknae', count: 122, file: '1790445024076-psxb5-photo-08-yeon.jpg', obj: '50% 18%' },
]
const DUR = [5.2, 6.1, 5.6, 6.5, 5.9, 6.3, 5.4, 6.0]
const DEL = [-0.4, -1.4, -2.6, -0.8, -1.9, -3.1, -1.1, -2.2]

function Kartu({ m, i }) {
  const [flip, setFlip] = useState(false)
  const [kick, setKick] = useState(0)
  const url = imgOpt(SB + m.file, 800)
  const toggle = () => { setFlip((f) => !f); setKick((k) => k + 1) }
  return (
    <div className="lc-hang">
      <span className="lc-string" aria-hidden />
      <span className="lc-clip" aria-hidden />
      <div className="lc-sway" style={{ animationDuration: `${DUR[i]}s`, animationDelay: `${DEL[i]}s` }}>
        <div key={kick} className={kick ? 'lc-kickwrap' : undefined}>
          <div
            className={`lc-flip${flip ? ' lc-on' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`Balik kartu ${m.name}`}
            onClick={toggle}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
          >
            {/* DEPAN */}
            <div className="lc-face bg-white shadow-[0_14px_34px_rgba(23,58,86,0.16)] dark:bg-[#14304a]">
              <div className="flex justify-between px-4 pb-2 pt-3 text-[8.5px] font-bold tracking-[0.2em] text-plum/45 dark:text-milk/45">
                <span>MEMBER / H2H</span><span>#{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="mx-3 overflow-hidden rounded-xl" style={{ aspectRatio: '1 / 0.94' }}>
                <img src={url} alt={`Foto ${m.name}`} className="h-full w-full object-cover" style={{ objectPosition: m.obj }} draggable={false} />
              </div>
              <div className="px-4 pt-3">
                <h3 className="font-display text-[22px] leading-tight text-plum dark:text-milk">{m.name}</h3>
                <p className="text-xs text-plum/55 dark:text-milk/55">{m.pos}</p>
              </div>
              <div className="mt-auto flex items-center justify-between px-4 pb-3.5">
                <span className="text-[8.5px] font-bold tracking-[0.2em] text-plum/45 dark:text-milk/45">LIHAT PROFIL</span>
                <span className="grid h-[21px] w-[21px] place-items-center rounded-full bg-plum text-[11px] text-milk dark:bg-gold dark:text-plum">+</span>
              </div>
            </div>
            {/* BELAKANG — holografik */}
            <div className="lc-face lc-back lc-holo text-[#26232e]">
              <div className="relative flex items-center gap-2.5">
                <img src={url} alt="" className="h-11 w-11 rounded-full border-2 border-white/80 object-cover" style={{ objectPosition: m.obj }} draggable={false} />
                <div>
                  <h4 className="font-display text-[17px] leading-tight">{m.name}</h4>
                  <p className="text-[10.5px] text-[#5c5770]">{m.pos}</p>
                </div>
              </div>
              <div className="relative mt-3.5">
                <div className="flex items-baseline justify-between gap-2 border-t border-[#26232e]/15 py-[7px] text-[11px]">
                  <span className="text-[9px] tracking-[0.08em] text-[#5c5770]">POSISI</span><b className="text-right font-semibold">{m.pos}</b>
                </div>
                <div className="flex items-baseline justify-between gap-2 border-t border-[#26232e]/15 py-[7px] text-[11px]">
                  <span className="text-[9px] tracking-[0.08em] text-[#5c5770]">ITEM DI GALERI</span><b className="font-semibold">{m.count} item</b>
                </div>
              </div>
              <Link
                href={`/idol/${m.key}`}
                onClick={(e) => e.stopPropagation()}
                className="relative mt-3 block rounded-full bg-[#26232e] py-2 text-center text-[11px] font-bold text-white"
              >
                Buka galeri {m.name} →
              </Link>
              <div className="relative mt-auto flex items-end justify-between">
                <small className="text-[8.5px] font-bold leading-[1.7] tracking-[0.18em] text-[#5c5770]">PINDAI BUAT BUKA<br />GALERI {m.name.toUpperCase()}</small>
                <img src={`/qr/${m.key.toLowerCase()}.png`} alt={`QR galeri ${m.name}`} className="h-16 w-16 rounded-lg bg-white p-1 shadow" draggable={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pb-10 pt-8 sm:px-8">
      <style>{`
        .lc-hang{ position:relative; width:min(240px,44vw); padding-top:58px; }
        .lc-string{ position:absolute; left:50%; top:0; width:1.5px; height:58px; transform:translateX(-50%); background:linear-gradient(#9db8cc,#c8d9e6); }
        html.dark .lc-string{ background:linear-gradient(#3d5a75,#5b7b99); }
        .lc-clip{ position:absolute; left:50%; top:46px; transform:translateX(-50%); width:16px; height:22px; border-radius:4px; z-index:3; background:linear-gradient(145deg,#ffffff,#c9d8e4); box-shadow:0 1px 3px rgba(23,58,86,.25), inset 0 0 0 1px rgba(23,58,86,.08); }
        .lc-clip::after{ content:""; position:absolute; left:50%; top:4px; transform:translateX(-50%); width:6px; height:6px; border-radius:50%; background:#fff; box-shadow:inset 0 0 0 1.5px #9db8cc; }
        .lc-sway{ transform-origin:50% -58px; animation-name:lcsway; animation-timing-function:ease-in-out; animation-iteration-count:infinite; will-change:transform; }
        @keyframes lcsway{ 0%,100%{ transform:rotate(1.15deg);} 50%{ transform:rotate(-1.15deg);} }
        .lc-kickwrap{ animation:lckick .9s ease-out; transform-origin:50% -58px; }
        @keyframes lckick{ 0%{ transform:rotate(0);} 25%{ transform:rotate(4.5deg);} 55%{ transform:rotate(-3deg);} 80%{ transform:rotate(1.2deg);} 100%{ transform:rotate(0);} }
        .lc-flip{ position:relative; width:100%; aspect-ratio:240/338; transform-style:preserve-3d; transition:transform .85s cubic-bezier(.3,.7,.3,1); cursor:pointer; }
        .lc-flip.lc-on{ transform:rotateY(180deg); }
        .lc-face{ position:absolute; inset:0; border-radius:18px; overflow:hidden; backface-visibility:hidden; -webkit-backface-visibility:hidden; display:flex; flex-direction:column; }
        .lc-back{ transform:rotateY(180deg); padding:18px 18px 16px; }
        .lc-holo{ background:linear-gradient(125deg,#f6d9ec,#d9e4fb,#d5f3e3,#f7ecd2,#e6dbfa,#f6d9ec); background-size:320% 320%; animation:lcholo 9s ease infinite; }
        @keyframes lcholo{ 0%,100%{ background-position:0% 40%; } 50%{ background-position:100% 60%; } }
        .lc-wire{ position:absolute; left:0; right:0; top:20px; width:100%; height:56px; pointer-events:none; }
        @media (max-width:700px){
          .lc-hang{ padding-top:40px; }
          .lc-string{ height:40px; }
          .lc-clip{ top:28px; }
          .lc-sway,.lc-kickwrap{ transform-origin:50% -40px; }
          .lc-wire{ display:none; }
        }
      `}</style>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-[10px] font-bold tracking-[0.22em] text-plum/50 dark:text-milk/50">
            <span className="text-gold">●</span>&nbsp; GALERI FANS — HEARTS2HEARTS
          </p>
          <h1 className="font-display text-4xl leading-[1.05] text-plum dark:text-milk sm:text-[52px]">
            Meet the members<br />
            <span className="italic text-gold">behind the hearts.</span>
          </h1>
        </div>
        <p className="max-w-[260px] pt-2 text-xs leading-relaxed text-plum/55 dark:text-milk/55 sm:pt-6">
          Delapan member Hearts2Hearts yang mengisi galeri ini — balik kartunya buat lihat profil singkat tiap member.
          <b className="mt-3 block text-[10px] tracking-[0.18em] text-plum dark:text-milk"><span className="text-gold">●</span>&nbsp; 8 MEMBER · 1.159 ITEM KOLEKSI</b>
        </p>
      </header>

      {[0, 4].map((start) => (
        <section key={start} className="relative mt-2">
          <svg className="lc-wire" viewBox="0 0 1200 56" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,4 Q600,60 1200,4" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-plum/25 dark:text-milk/25" />
          </svg>
          <div className="relative mx-auto flex max-w-[1100px] flex-wrap justify-center gap-x-5 pt-5 sm:justify-between">
            {MEMBERS.slice(start, start + 4).map((m, j) => (
              <Kartu key={m.key} m={m} i={start + j} />
            ))}
          </div>
        </section>
      ))}

      <div className="mt-12 text-center">
        <Link
          href="/galeri"
          className="inline-block rounded-full bg-gold px-9 py-3.5 text-base font-bold text-white shadow-[0_10px_26px_rgba(234,147,187,0.45)] transition hover:scale-[1.03]"
        >
          Masuk ke Galeri →
        </Link>
        <nav className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-bold text-plum/60 dark:text-milk/60">
          <Link href="/jadwal" className="hover:text-gold">📅 Jadwal</Link>
          <Link href="/voting" className="hover:text-gold">🗳️ Voting</Link>
          <Link href="/favorit" className="hover:text-gold">❤️ Favorit</Link>
          <Link href="/tentang" className="hover:text-gold">ℹ️ Tentang</Link>
        </nav>
      </div>

      <footer className="mt-auto flex flex-wrap justify-between gap-2 pt-12 text-[9px] font-bold tracking-[0.22em] text-plum/40 dark:text-milk/40">
        <span>THE MEMBERS MAKE THE HEARTS</span>
        <span>HOVER BUAT NGAYUN · KLIK / TAP BUAT BALIK KARTU</span>
      </footer>
    </div>
  )
}
