'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { imgOpt } from '../../lib/supabase'
import { thumbOf, altOf, DISPLAY_NAME } from '../../lib/gallery'
import { fetchFandomStats } from '../../lib/fandomStats'
import { useT } from '../../lib/i18n'

// Statistik fandom kecil (fitur 8). Tersembunyi sepenuhnya kalau belum ada reaksi
// (atau gagal dimuat) — tidak pernah menampilkan "0 reaksi" yang menyesatkan.
export default function FandomStats({ className = 'mt-10' }) {
  const t = useT()
  const [s, setS] = useState(null)
  useEffect(() => {
    let alive = true
    fetchFandomStats().then((x) => { if (alive) setS(x) }).catch(() => {})
    return () => { alive = false }
  }, [])
  if (!s) return null
  const { topAll, memberWeek } = s
  return (
    <section className={className} aria-labelledby="statistik-fandom">
      <h2 id="statistik-fandom" className="mb-3 text-center text-[10px] font-bold tracking-[0.22em] text-plum/50 dark:text-milk/50">
        <span className="text-gold">●</span>&nbsp; {t('STATISTIK FANDOM')}
      </h2>
      {/* Kolom grid WAJIB minmax(0, …) + kotak min-w-0. Tanpa itu kolom grid ikut melebar seukuran isi
          terlebar (5 thumbnail = 466px), sehingga di HP halaman jadi 486px dan bisa digeser ke samping
          (tombol tema ikut terdorong keluar layar), dan baris thumbnail di bawah tidak pernah menggulir. */}
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {topAll.length > 0 && (
          <div className="min-w-0 rounded-2xl border border-rose/40 bg-white/80 p-4 dark:border-rose/20 dark:bg-white/5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">♥ {t('Paling disukai sepanjang masa')}</p>
            {/* Lebih dari muat (HP) → baris ini menggulir di dalam kotaknya sendiri. */}
            <ol className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
              {topAll.map(({ it, jumlah }, i) => (
                <li key={it.id} className="w-20 shrink-0 text-center">
                  <Link href={`/galeri?item=${it.id}`} aria-label={t('Peringkat {n}: {judul}, {j} reaksi', { n: i + 1, judul: altOf(it), j: jumlah })} className="relative block">
                    {it.type === 'video'
                      ? <span className="grid aspect-[3/4] w-20 place-items-center rounded-xl bg-[#1B3049] text-2xl text-white">▶</span>
                      : <img src={imgOpt(thumbOf(it), 200)} alt="" loading="lazy" width={80} height={107} className="aspect-[3/4] w-20 rounded-xl object-cover bg-[#DCEBF6] dark:bg-[#1B3049]" />}
                    <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-plum text-[10px] font-bold text-milk">{i + 1}</span>
                  </Link>
                  <span className="mt-1 block text-[11px] font-bold text-plum/70 dark:text-milk/70">{t('{j} reaksi', { j: jumlah })}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {memberWeek && (
          <div className="min-w-0 rounded-2xl border border-rose/40 bg-white/80 p-4 text-center dark:border-rose/20 dark:bg-white/5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">🔥 {t('Member paling disukai minggu ini')}</p>
            <Link href={`/idol/${memberWeek.member}`} className="font-display text-3xl text-plum underline-offset-4 hover:underline dark:text-milk">
              {DISPLAY_NAME[memberWeek.member] || memberWeek.member}
            </Link>
            <p className="mt-1 text-xs font-bold text-plum/60 dark:text-milk/60">{t('{j} reaksi minggu ini', { j: memberWeek.jumlah })}</p>
          </div>
        )}
      </div>
    </section>
  )
}
