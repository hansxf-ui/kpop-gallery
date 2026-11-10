'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { imgOpt } from '../../lib/supabase'
import { altOf } from '../../lib/gallery'
import { useT, useLocale, useDocTitle } from '../../lib/i18n'
import { todayFrom, eventsToday, nextEvent, openVotes, memoryOfDay } from '../../lib/today'
import { parseTanggal, isDateOnly } from '../../lib/schedule'
import { TIPE_LABEL } from '../../lib/jadwal'
import ThemeToggle from '../components/ThemeToggle'
import SiteNav from '../components/SiteNav'
import SpecialCountdown from '../components/SpecialCountdown'
import Lightbox from '../components/Lightbox'
import BirthdayCard from '../components/BirthdayCard'

const kotak = 'rounded-3xl border border-rose/40 bg-white/80 p-5 dark:border-rose/20 dark:bg-white/5'
const judulBagian = 'mb-3 text-xs font-bold uppercase tracking-widest text-gold'

// "Hari ini di H2H" (fitur 1): hitung mundur, acara hari ini, voting yang buka, foto kenangan.
// Semua dihitung di klien setelah mount (tanggal = zona waktu pengunjung, hindari hydration mismatch).
export default function HariIniClient() {
  const t = useT()
  const loc = useLocale()
  useDocTitle('Hari ini di H2H')
  const [ctx, setCtx] = useState(null) // { now, override }
  const [memory, setMemory] = useState(undefined) // undefined = memuat, null = tidak ada
  const [open, setOpen] = useState(false)

  useEffect(() => { setCtx(todayFrom(window.location.search)) }, [])
  useEffect(() => {
    if (!ctx) return
    let alive = true
    memoryOfDay(ctx.now).then((m) => { if (alive) setMemory(m) }).catch(() => { if (alive) setMemory(null) })
    return () => { alive = false }
  }, [ctx])

  const now = ctx?.now
  const tgl = now ? now.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const events = now ? eventsToday(now) : []
  const next = now && events.length === 0 ? nextEvent(now) : null
  const votes = now ? openVotes(now) : []
  const fmtTgl = (s) => parseTanggal(s).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' })
  const fmtTutup = (s) => new Date(s).toLocaleString(loc, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="pt-16 pb-8 text-center">
        <SiteNav className="mb-8" />
        <p className="text-gold text-2xl" aria-hidden>☀️</p>
        <h1 className="font-display text-5xl text-plum dark:text-milk mt-2">{t('Hari ini di H2H')}</h1>
        <p className="mt-3 font-bold text-plum/70 dark:text-milk/70">{tgl || t('Memuat…')}</p>
        {ctx?.override && <p className="mt-1 text-xs font-bold text-gold">{t('Mode coba tanggal — buka /hari-ini tanpa ?tanggal untuk kembali ke hari ini.')}</p>}
      </header>

      {now && (
        <div className="space-y-6">
          <BirthdayCard now={now} />
          <SpecialCountdown now={now} className="" />

          <section className={kotak} aria-labelledby="acara-hari-ini">
            <h2 id="acara-hari-ini" className={judulBagian}>📅 {t('Acara hari ini')}</h2>
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
            <h2 id="voting-buka" className={judulBagian}>🗳️ {t('Voting yang sedang buka')}</h2>
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
            <h2 id="kenangan" className={judulBagian}>💗 {t('Foto kenangan hari ini')}</h2>
            <p className="mb-3 text-xs text-plum/55 dark:text-milk/55">{t('Dipilih dari tanggal hari ini — semua pengunjung melihat foto yang sama, besok berganti.')}</p>
            {memory === undefined && <div className="skeleton mx-auto aspect-[3/4] w-full max-w-xs rounded-2xl" />}
            {memory === null && <p className="text-sm text-plum/60 dark:text-milk/60">{t('Foto kenangan belum bisa dimuat.')}</p>}
            {memory && (
              <button onClick={() => setOpen(true)} className="card mx-auto block w-full max-w-xs pb-2 text-left">
                <img src={imgOpt(memory.url, 700)} alt={altOf(memory)} decoding="async"
                  className="aspect-[3/4] w-full rounded-2xl object-cover object-top bg-[#DCEBF6] dark:bg-[#1B3049]" />
                <p className="truncate px-2 pt-2 text-sm font-bold dark:text-milk">{memory.title || memory.idol}</p>
                <p className="px-2 text-xs font-bold text-gold">{memory.idol}</p>
              </button>
            )}
          </section>
        </div>
      )}

      {open && memory && <Lightbox items={[memory]} index={0} onIndexChange={() => {}} onClose={() => setOpen(false)} />}
    </main>
  )
}
