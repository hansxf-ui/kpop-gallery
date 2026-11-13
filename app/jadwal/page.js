'use client'
import { useT, useLocale, useDocTitle } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import SiteNav from '../components/SiteNav'
import { JADWAL, RIWAYAT_2026, TIPE_LABEL } from '../../lib/jadwal'
import { buildIcs, icsFilename } from '../../lib/ics'
import { downloadBlob } from '../../lib/download'
import { parseTanggal, hitungMundur, hariIni, sudahLewat } from '../../lib/schedule'
import { replaceQuery } from '../../lib/galeriUrl'
import MonthCalendar from '../components/MonthCalendar'
import Icon, { eventIcon } from '../components/Icon'

// Unduh file .ics (fitur 13) — dibuka HP/laptop langsung di aplikasi kalender.
function unduhIcs(events, filename, tr) {
  const ics = buildIcs(events, { siteUrl: window.location.origin, tr })
  downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), filename)
}

// Tanggal "terakhir dicek" footer — nilainya sama seperti sebelumnya (10 Nov 2026), hanya
// disimpan sekali dalam format ISO supaya bisa ditampilkan sesuai bahasa. Ubah di sini saat dicek ulang.
const TERAKHIR_DICEK = '2026-11-10'
const formatCek = (iso, loc) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' }) }

// Format tanggal ikut bahasa aktif (loc = 'id-ID' / 'en-GB').
function formatTanggal(tanggal, loc = 'id-ID') {
  if (!tanggal) return loc === 'en-GB' ? 'Date to be announced' : 'Tanggal menyusul'
  return parseTanggal(tanggal).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function UnitCountdown({ angka, label }) {
  return (
    <div className="flex flex-col items-center bg-plum/5 dark:bg-milk/10 rounded-xl px-3 py-2 min-w-[64px]">
      <span className="font-display text-2xl sm:text-3xl text-plum dark:text-milk tabular-nums">{angka}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-plum/50 dark:text-milk/50">{label}</span>
    </div>
  )
}

function KartuEvent({ event, now }) {
  const t = useT()
  const loc = useLocale()
  const isHariIni = hariIni(event.tanggal)
  const isLewat = sudahLewat(event.tanggal)
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(event.tanggal || '')
  // Countdown tampil untuk semua event yang jamnya belum tiba — termasuk event HARI INI
  // yang baru mulai nanti malam (dulu countdown-nya hilang sepanjang hari-H).
  const cd = now && event.tanggal && !isLewat && !(dateOnly && isHariIni) ? hitungMundur(event.tanggal, now) : null

  return (
    <article className="relative overflow-hidden rounded-2xl border border-rose/40 dark:border-rose/20 bg-white/85 dark:bg-plum/60 p-5 sm:p-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose via-gold to-lilac" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gold">{t(TIPE_LABEL[event.tipe] || event.tipe)}</p>
        <h2 className="font-display text-xl sm:text-2xl text-plum dark:text-milk mt-1"><Icon name={eventIcon(event.tipe)} size={22} className="mr-2 text-gold" />{t(event.judul)}</h2>
          <p className="mt-1 text-sm font-bold text-plum/70 dark:text-milk/70">{formatTanggal(event.tanggal, loc)}</p>
          {event.lokasi && <p className="text-xs text-plum/50 dark:text-milk/50 mt-0.5"><Icon name="mapPin" size={12} className="mr-1" />{t(event.lokasi)}</p>}
          {event.catatan && <p className="text-xs text-plum/60 dark:text-milk/60 mt-2 leading-relaxed">{t(event.catatan)}</p>}
      </div>
      <div className="mt-4">
        {isHariIni && (
          <p className="inline-flex items-center gap-2 font-bold text-red-600 dark:text-rose text-lg">
            <span className="relative flex h-3 w-3" aria-hidden>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            {t('HARI INI')}
          </p>
        )}
        {cd ? (
          <div className={`flex gap-2 ${isHariIni ? 'mt-3' : ''}`}>
            <UnitCountdown angka={cd.hari} label={t('hari')} />
            <UnitCountdown angka={cd.jam} label={t('jam')} />
            <UnitCountdown angka={cd.menit} label={t('mnt')} />
            <UnitCountdown angka={cd.detik} label={t('dtk')} />
          </div>
        ) : !event.tanggal ? (
          <p className="text-sm font-bold text-gold">⏳ {t('Segera diumumkan')}</p>
        ) : null}
        {event.tanggal && !isLewat && (
          <button onClick={() => unduhIcs([event], icsFilename(event), t)}
            className="mt-4 rounded-full border border-rose/50 bg-white/80 px-4 py-1.5 text-xs font-bold text-plum dark:border-rose/25 dark:bg-white/10 dark:text-milk">
            <Icon name="calendarPlus" size={14} className="mr-1.5" />{t('Tambah ke kalender')}
          </button>
        )}
      </div>
    </article>
  )
}

export default function JadwalPage() {
  const t = useT()
  const loc = useLocale()
  // Satu ticker untuk semua kartu (dulu tiap kartu interval sendiri-sendiri).
  // null sebelum mount: angka countdown tidak dirender server → tidak ada hydration mismatch.
  const [now, setNow] = useState(null)
  useDocTitle('Jadwal')
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  // Fitur 13: tampilan Daftar (bawaan) atau Kalender bulanan — ?tampilan=kalender bisa dibagikan.
  const [tampilan, setTampilan] = useState('daftar')
  const [hariBuka, setHariBuka] = useState(null) // tanggal patokan kalender, diisi setelah mount
  useEffect(() => {
    setHariBuka(new Date())
    if (new URLSearchParams(window.location.search).get('tampilan') === 'kalender') setTampilan('kalender')
  }, [])
  function pilihTampilan(v) { setTampilan(v); replaceQuery({ tampilan: v === 'kalender' ? v : null }) }
  const upcoming = JADWAL.filter(e => !sudahLewat(e.tanggal))
    .sort((a, b) => (a.tanggal || '9999') > (b.tanggal || '9999') ? 1 : -1)
  const lewat = JADWAL.filter(e => sudahLewat(e.tanggal))
    .sort((a, b) => a.tanggal > b.tanggal ? 1 : -1)

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 page-fade-in">
      <header className="pt-16 pb-12 text-center">
        <SiteNav className="mb-8" />
        <p className="flex justify-center items-center" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-rose" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-gold -ml-3 mt-2.5" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </p>
        <h1 className="font-display text-4xl sm:text-6xl text-plum dark:text-milk mt-2">{t('Jadwal Hearts2Hearts')}</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">{t('Comeback, rilisan & acara — khusus H2H')}</p>
      </header>

      <div className="mb-6 flex justify-center gap-1.5" role="group" aria-label={t('Tampilan jadwal')}>
        {[['daftar', 'list', 'Daftar'], ['kalender', 'calendarDays', 'Kalender']].map(([v, e, label]) => (
          <button key={v} onClick={() => pilihTampilan(v)} aria-pressed={tampilan === v}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold ${tampilan === v ? 'border-plum bg-plum text-milk dark:border-gold dark:bg-gold dark:text-plum' : 'border-rose/50 bg-white/70 dark:border-rose/20 dark:bg-white/10 dark:text-milk'}`}>
            <Icon name={e} size={15} className="mr-1.5" />{t(label)}
          </button>
        ))}
      </div>

      {tampilan === 'kalender' && hariBuka && <MonthCalendar now={hariBuka} />}

      {tampilan === 'daftar' && (<>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">✦ {t('Akan datang')}</p>
          {upcoming.some((e) => e.tanggal) && (
            <button onClick={() => unduhIcs(upcoming.filter((e) => e.tanggal), 'jadwal-hearts2hearts.ics', t)}
              className="text-xs font-bold text-plum/70 underline underline-offset-4 dark:text-milk/70"><Icon name="calendarPlus" size={13} className="mr-1" />{t('Tambah semua ke kalender')}</button>
          )}
        </div>
        {upcoming.length === 0 && <p className="text-sm text-plum/60 dark:text-milk/60">{t('Belum ada jadwal baru yang dikonfirmasi.')}</p>}
        {upcoming.map(e => <KartuEvent key={e.id} event={e} now={now} />)}
      </section>

      {(lewat.length > 0 || RIWAYAT_2026.length > 0) && (
        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">✦ {t('Sudah lewat (2026)')}</p>
          <ul className="space-y-2">
            {lewat.map(e => (
              <li key={e.id} className="text-sm text-plum/60 dark:text-milk/60">
                <span className="font-bold text-plum/80 dark:text-milk/80">{t(e.judul)}</span>
                {' · '}{formatTanggal(e.tanggal, loc)}
              </li>
            ))}
            {RIWAYAT_2026.map(r => (
              <li key={r.judul} className="text-sm text-plum/60 dark:text-milk/60">
                <span className="font-bold text-plum/80 dark:text-milk/80">{t(r.judul)}</span>
                {' · '}{formatTanggal(r.tanggal, loc)} · {t(r.catatan)}
              </li>
            ))}
          </ul>
        </section>
      )}

      </>)}

      <p className="mt-10 text-center text-xs text-plum/40 dark:text-milk/40">
        {t('Data diverifikasi dari pengumuman resmi & media · terakhir dicek')} {formatCek(TERAKHIR_DICEK, loc)}
      </p>
    </main>
  )
}
