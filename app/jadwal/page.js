'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '../components/ThemeToggle'
import { JADWAL, RIWAYAT_2026, TIPE_LABEL } from '../../lib/jadwal'

function hitungMundur(target) {
  const selisih = new Date(target).getTime() - Date.now()
  if (selisih <= 0) return null
  const hari = Math.floor(selisih / 86400000)
  const jam = Math.floor((selisih % 86400000) / 3600000)
  const menit = Math.floor((selisih % 3600000) / 60000)
  const detik = Math.floor((selisih % 60000) / 1000)
  return { hari, jam, menit, detik }
}

function hariIni(tanggal) {
  if (!tanggal) return false
  const d = new Date(tanggal)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function sudahLewat(tanggal) {
  if (!tanggal) return false
  const d = new Date(tanggal)
  const now = new Date()
  // tanggal saja (tanpa jam) dianggap lewat kalau bukan hari ini dan < hari ini
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const nDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return dDay < nDay
}

function formatTanggal(tanggal) {
  if (!tanggal) return 'Tanggal menyusul'
  return new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function UnitCountdown({ angka, label }) {
  return (
    <div className="flex flex-col items-center bg-plum/5 dark:bg-milk/10 rounded-xl px-3 py-2 min-w-[64px]">
      <span className="font-display text-2xl sm:text-3xl text-plum dark:text-milk tabular-nums">{angka}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-plum/50 dark:text-milk/50">{label}</span>
    </div>
  )
}

function KartuEvent({ event }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  void now

  const isHariIni = hariIni(event.tanggal)
  const isLewat = sudahLewat(event.tanggal)
  const cd = event.tanggal && !isHariIni && !isLewat ? hitungMundur(event.tanggal) : null

  return (
    <article className="relative overflow-hidden rounded-2xl border border-rose/40 dark:border-rose/20 bg-white/70 dark:bg-plum/40 backdrop-blur p-5 sm:p-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose via-gold to-lilac" aria-hidden />
      <div className="flex items-start gap-4">
        <span className="text-4xl" aria-hidden>{event.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold">{TIPE_LABEL[event.tipe] || event.tipe}</p>
          <h2 className="font-display text-xl sm:text-2xl text-plum dark:text-milk mt-1">{event.judul}</h2>
          <p className="mt-1 text-sm font-bold text-plum/70 dark:text-milk/70">{formatTanggal(event.tanggal)}</p>
          {event.lokasi && <p className="text-xs text-plum/50 dark:text-milk/50 mt-0.5">📍 {event.lokasi}</p>}
          {event.catatan && <p className="text-xs text-plum/60 dark:text-milk/60 mt-2 leading-relaxed">{event.catatan}</p>}
        </div>
      </div>
      <div className="mt-4">
        {isHariIni ? (
          <p className="inline-flex items-center gap-2 font-bold text-rose-600 dark:text-rose text-lg">
            <span className="relative flex h-3 w-3" aria-hidden>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            HARI INI
          </p>
        ) : cd ? (
          <div className="flex gap-2">
            <UnitCountdown angka={cd.hari} label="hari" />
            <UnitCountdown angka={cd.jam} label="jam" />
            <UnitCountdown angka={cd.menit} label="mnt" />
            <UnitCountdown angka={cd.detik} label="dtk" />
          </div>
        ) : !event.tanggal ? (
          <p className="text-sm font-bold text-gold">⏳ Segera diumumkan</p>
        ) : null}
      </div>
    </article>
  )
}

export default function JadwalPage() {
  const upcoming = JADWAL.filter(e => !sudahLewat(e.tanggal))
  const lewat = JADWAL.filter(e => sudahLewat(e.tanggal))

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="py-12 text-center">
        <p className="flex justify-center items-center" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-rose" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-gold -ml-3 mt-2.5" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </p>
        <h1 className="font-display text-4xl sm:text-6xl text-plum dark:text-milk mt-2">Jadwal Hearts2Hearts</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">Comeback, rilisan & acara — khusus H2H</p>
        <p className="mt-4">
          <Link href="/" className="text-sm font-bold text-gold underline underline-offset-4">← Kembali ke galeri</Link>
        </p>
      </header>

      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">✦ Akan datang</p>
        {upcoming.length === 0 && <p className="text-sm text-plum/60 dark:text-milk/60">Belum ada jadwal baru yang dikonfirmasi.</p>}
        {upcoming.map(e => <KartuEvent key={e.id} event={e} />)}
      </section>

      {(lewat.length > 0 || RIWAYAT_2026.length > 0) && (
        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">✦ Sudah lewat (2026)</p>
          <ul className="space-y-2">
            {lewat.map(e => (
              <li key={e.id} className="text-sm text-plum/60 dark:text-milk/60">
                <span className="font-bold text-plum/80 dark:text-milk/80">{e.judul}</span>
                {' · '}{formatTanggal(e.tanggal)}
              </li>
            ))}
            {RIWAYAT_2026.map(r => (
              <li key={r.judul} className="text-sm text-plum/60 dark:text-milk/60">
                <span className="font-bold text-plum/80 dark:text-milk/80">{r.judul}</span>
                {' · '}{formatTanggal(r.tanggal)} · {r.catatan}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-center text-xs text-plum/40 dark:text-milk/40">
        Data diverifikasi dari pengumuman resmi & media · terakhir dicek 2 Okt 2026
      </p>
    </main>
  )
}
