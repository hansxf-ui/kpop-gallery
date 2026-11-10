'use client'
import { useT, useLang } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import { nextOccurrences } from '../../lib/specialDates'

// Hitung mundur ulang tahun member & anniversary debut (fitur 1).
// Dirender setelah mount saja: tanggal "hari ini" bergantung zona waktu pengunjung,
// jadi tidak boleh dihitung di server (hindari hydration mismatch).
export default function SpecialCountdown({ count = 3 }) {
  const t = useT()
  const [list, setList] = useState(null)
  useEffect(() => {
    const update = () => setList(nextOccurrences().slice(0, count))
    update()
    const t = setInterval(update, 60 * 60 * 1000) // ganti hari saat halaman lama terbuka
    return () => clearInterval(t)
  }, [count])
  // Ruang cadangan seukuran hasil akhir (judul + 3 kartu): bertumpuk di HP, berjajar di layar lebar.
  // Dulu tingginya 118px di semua layar, jadi di HP konten di bawahnya melompat ±300px.
  if (!list) return <div className="mt-10 h-[470px] sm:h-[150px]" aria-hidden />

  const { lang } = useLang()
  const fmt = (d) => d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'long' })
  return (
    <section className="mt-10" aria-labelledby="hitung-mundur">
      <h2 id="hitung-mundur" className="mb-3 text-center text-[10px] font-bold tracking-[0.22em] text-plum/50 dark:text-milk/50">
        <span className="text-gold">●</span>&nbsp; {t('HARI SPESIAL BERIKUTNYA')}
      </h2>
      <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
        {list.map((s) => {
          const judul = s.type === 'debut' ? t('Anniversary debut ke-{n}', { n: s.anniversary }) : t('Ulang tahun {nama}', { nama: s.name })
          return (
            <li key={`${s.month}-${s.day}`} className="rounded-2xl border border-rose/40 bg-white/80 px-4 py-3 text-center dark:border-rose/20 dark:bg-white/5">
              <p className="text-lg" aria-hidden>{s.type === 'debut' ? '🎉' : '🎂'}</p>
              <p className="font-bold text-plum dark:text-milk">{judul}</p>
              <p className="text-xs text-plum/55 dark:text-milk/55">{fmt(s.date)}</p>
              <p className="mt-1 font-display text-2xl text-gold tabular-nums">
                {s.days === 0 ? t('Hari ini!') : s.days === 1 ? t('Besok') : t('{n} hari lagi', { n: s.days })}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
