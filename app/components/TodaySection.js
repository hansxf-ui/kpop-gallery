'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { imgOpt } from '../../lib/supabase'
import { altOf } from '../../lib/gallery'
import { useT, useLocale } from '../../lib/i18n'
import { eventsToday, nextEvent, openVotes, memoryOfDay } from '../../lib/today'
import { parseTanggal, isDateOnly } from '../../lib/schedule'
import { TIPE_LABEL } from '../../lib/jadwal'
import BirthdayCard from './BirthdayCard'

// Lightbox hanya dimuat saat foto kenangan diketuk — beranda tidak ikut berat.
const Lightbox = dynamic(() => import('./Lightbox'), { ssr: false })

const kotak = 'rounded-3xl border border-rose/40 bg-white/80 p-5 dark:border-rose/20 dark:bg-white/5'
const judulBagian = 'mb-3 text-xs font-bold uppercase tracking-widest text-gold'

// Seksi "Hari ini" di beranda (dulu halaman /hari-ini, sekarang dialihkan ke /): kartu ulang tahun
// (hanya di hari ulang tahun member), acara hari ini, voting yang sedang buka, foto kenangan hari ini.
// Hitung mundur hari spesial TIDAK di sini — beranda sudah punya SpecialCountdown sendiri.
// now/override dari todayFrom() (lib/today.js) di beranda, setelah mount (zona waktu pengunjung).
export default function TodaySection({ now, override = false }) {
  const t = useT()
  const loc = useLocale()
  const [memory, setMemory] = useState(undefined) // undefined = memuat, null = tidak ada
  const [open, setOpen] = useState(false)
  const nowMs = now ? now.getTime() : null

  useEffect(() => {
    if (!nowMs) return
    let alive = true
    memoryOfDay(new Date(nowMs)).then((m) => { if (alive) setMemory(m) }).catch(() => { if (alive) setMemory(null) })
    return () => { alive = false }
  }, [nowMs])

  // Sebelum tanggal pengunjung diketahui: kerangka dengan susunan yang sama (judul + 3 kotak),
  // bukan kotak kosong setinggi tebakan — dulu tingginya meleset 200–500px dan konten di bawahnya melompat.
  if (!now) return (
    <section id="hari-ini" className="mx-auto mt-12 w-full max-w-5xl" aria-hidden>
      <div className="mb-4 text-center">
        <h2 className="font-display text-3xl text-plum dark:text-milk">☀ {t('Hari ini')}</h2>
        <p className="mt-1 text-sm">&nbsp;</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={kotak}>
            <div className="skeleton mb-4 h-3 w-1/2 rounded" />
            <div className="skeleton h-4 w-4/5 rounded" />
            <div className="skeleton mt-2 h-3 w-3/5 rounded" />
            <div className="skeleton mt-5 h-3 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </section>
  )

  const tgl = now.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const events = eventsToday(now)
  const next = events.length === 0 ? nextEvent(now) : null
  const votes = openVotes(now)
  const fmtTgl = (s) => parseTanggal(s).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' })
  const fmtTutup = (s) => new Date(s).toLocaleString(loc, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <section id="hari-ini" className="mx-auto mt-12 w-full max-w-5xl scroll-mt-6" aria-labelledby="hari-ini-judul">
      <div className="mb-4 text-center">
        <h2 id="hari-ini-judul" className="font-display text-3xl text-plum dark:text-milk">☀ {t('Hari ini')}</h2>
        <p className="mt-1 text-sm font-bold text-plum/60 dark:text-milk/60">{tgl}</p>
        {override && <p className="mt-1 text-xs font-bold text-gold">{t('Mode coba tanggal — buka beranda tanpa ?tanggal untuk kembali ke hari ini.')}</p>}
      </div>

      <BirthdayCard now={now} />

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <section className={kotak} aria-labelledby="acara-hari-ini">
          <h3 id="acara-hari-ini" className={judulBagian}>📅 {t('Acara hari ini')}</h3>
          {events.length === 0 && <p className="text-sm text-plum/60 dark:text-milk/60">{t('Tidak ada acara H2H yang tercatat hari ini.')}</p>}
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <p className="font-bold text-plum dark:text-milk">{e.emoji} {t(e.judul)}</p>
                <p className="text-xs text-plum/60 dark:text-milk/60">
                  {t(TIPE_LABEL[e.tipe] || e.tipe)}
                  {!isDateOnly(e.tanggal) && ` · ${parseTanggal(e.tanggal).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}`}
                  {e.lokasi && ` · 📍 ${t(e.lokasi)}`}
                </p>
              </li>
            ))}
          </ul>
          {next && (
            <p className="mt-3 text-sm text-plum/70 dark:text-milk/70">
              {t('Acara berikutnya:')} <b>{next.emoji} {t(next.judul)}</b> — {fmtTgl(next.tanggal)}
            </p>
          )}
          <Link href="/jadwal" className="mt-3 inline-block text-sm font-bold text-gold underline underline-offset-4">{t('Lihat semua jadwal →')}</Link>
        </section>

        <section className={kotak} aria-labelledby="voting-buka">
          <h3 id="voting-buka" className={judulBagian}>🗳 {t('Voting yang sedang buka')}</h3>
          {votes.length === 0 && <p className="text-sm text-plum/60 dark:text-milk/60">{t('Belum ada voting yang buka saat ini.')}</p>}
          <ul className="space-y-2">
            {votes.map((v) => (
              <li key={v.id}>
                <p className="font-bold text-plum dark:text-milk">🏆 {t(v.event)}</p>
                <p className="text-xs text-plum/60 dark:text-milk/60">{t(v.kategori)} · 📱 {v.platform} · {t('tutup {tgl}', { tgl: fmtTutup(v.selesai) })}</p>
              </li>
            ))}
          </ul>
          <Link href="/voting" className="mt-3 inline-block text-sm font-bold text-gold underline underline-offset-4">{t('Cara vote →')}</Link>
        </section>

        <section className={kotak} aria-labelledby="kenangan">
          <h3 id="kenangan" className={judulBagian}>💗 {t('Foto kenangan hari ini')}</h3>
          <p className="mb-3 text-xs text-plum/55 dark:text-milk/55">{t('Dipilih dari tanggal hari ini — semua pengunjung melihat foto yang sama, besok berganti.')}</p>
          {/* Foto kecil di samping judul — dulu foto 3:4 selebar kotak membuat kotak ini ±2× lebih tinggi dari dua kotak lain. */}
          {memory === undefined && (
            <div className="flex items-center gap-3">
              <div className="skeleton aspect-[3/4] w-24 shrink-0 rounded-xl" />
              <div className="flex-1"><div className="skeleton h-4 w-4/5 rounded" /><div className="skeleton mt-2 h-3 w-1/2 rounded" /></div>
            </div>
          )}
          {memory === null && <p className="text-sm text-plum/60 dark:text-milk/60">{t('Foto kenangan belum bisa dimuat.')}</p>}
          {memory && (
            <button onClick={() => setOpen(true)} className="group flex w-full items-center gap-3 text-left">
              <img src={imgOpt(memory.url, 300)} alt={altOf(memory)} loading="lazy" decoding="async" width={96} height={128}
                className="aspect-[3/4] w-24 shrink-0 rounded-xl object-cover object-top bg-[#DCEBF6] dark:bg-[#1B3049] transition group-hover:scale-[1.03]" />
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-bold text-plum dark:text-milk">{memory.title || memory.idol}</span>
                <span className="block text-xs font-bold text-gold">{memory.idol}</span>
                <span className="mt-2 block text-xs font-bold text-plum/60 underline underline-offset-4 dark:text-milk/60">{t('Buka foto')}</span>
              </span>
            </button>
          )}
        </section>
      </div>

      {open && memory && <Lightbox items={[memory]} index={0} onIndexChange={() => {}} onClose={() => setOpen(false)} />}
    </section>
  )
}
