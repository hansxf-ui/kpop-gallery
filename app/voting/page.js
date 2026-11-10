'use client'
import { useT, useLocale, useDocTitle } from '../../lib/i18n'
import { useEffect, useState } from 'react'
import ThemeToggle from '../components/ThemeToggle'
import SiteNav from '../components/SiteNav'
import { VOTING, VOTING_CARMEN, PANDUAN_APLIKASI } from '../../lib/voting'

function hitungMundur(target, nowMs) {
  const selisih = new Date(target).getTime() - nowMs
  if (selisih <= 0) return null
  const hari = Math.floor(selisih / 86400000)
  const jam = Math.floor((selisih % 86400000) / 3600000)
  const menit = Math.floor((selisih % 3600000) / 60000)
  const detik = Math.floor((selisih % 60000) / 1000)
  return { hari, jam, menit, detik }
}

// Format tanggal ikut bahasa aktif (loc = 'id-ID' / 'en-GB').
// Tanggal "terakhir dicek" footer — nilainya sama seperti sebelumnya (16 Okt 2026), hanya
// disimpan sekali dalam format ISO supaya bisa ditampilkan sesuai bahasa. Ubah di sini saat dicek ulang.
const TERAKHIR_DICEK = '2026-10-16'
const formatCek = (iso, loc) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' }) }

function formatTanggal(tanggal, loc = 'id-ID') {
  if (!tanggal) return loc === 'en-GB' ? 'Date to be announced' : 'Tanggal menyusul'
  return new Date(tanggal).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
}

// buka | segera | tunggu | tutup
function statusVote(v, nowMs) {
  if (!v.mulai || !v.selesai) return 'tunggu'
  if (nowMs < new Date(v.mulai).getTime()) return 'segera'
  if (nowMs > new Date(v.selesai).getTime()) return 'tutup'
  return 'buka'
}

function UnitCountdown({ angka, label }) {
  return (
    <div className="flex flex-col items-center bg-plum/5 dark:bg-milk/10 rounded-xl px-3 py-2 min-w-[64px]">
      <span className="font-display text-2xl sm:text-3xl text-plum dark:text-milk tabular-nums">{angka}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-plum/50 dark:text-milk/50">{label}</span>
    </div>
  )
}

function KartuVoting({ v, now }) {
  const t = useT()
  const loc = useLocale()
  const st = statusVote(v, now ?? Date.now())
  const target = st === 'buka' ? v.selesai : st === 'segera' ? v.mulai : null
  const cd = target && now ? hitungMundur(target, now) : null

  const badge =
    st === 'buka' ? (
      <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-rose">
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        {t('Buka · tutup {tgl}', { tgl: formatTanggal(v.selesai, loc) })}
      </span>
    ) : st === 'segera' ? (
      <span className="text-xs font-extrabold uppercase tracking-widest text-gold">{t('Segera · {tgl}', { tgl: formatTanggal(v.mulai, loc) })}</span>
    ) : st === 'tutup' ? (
      <span className="text-xs font-extrabold uppercase tracking-widest text-plum/40 dark:text-milk/40">{t('Sudah tutup · {tgl}', { tgl: formatTanggal(v.selesai, loc) })}</span>
    ) : (
      <span className="text-xs font-extrabold uppercase tracking-widest text-plum/40 dark:text-milk/40">{t('Belum diumumkan')}</span>
    )

  return (
    <article className="relative overflow-hidden rounded-2xl border border-rose/40 dark:border-rose/20 bg-white/85 dark:bg-plum/60 p-5 sm:p-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose via-gold to-lilac" aria-hidden />
      <div>{badge}</div>
      <h2 className="font-display text-xl sm:text-2xl text-plum dark:text-milk mt-2">🏆 {t(v.event)}</h2>
      <p className="mt-1 text-sm font-bold text-plum/70 dark:text-milk/70">{t(v.kategori)}</p>
      <p className="text-xs text-plum/50 dark:text-milk/50 mt-0.5">📱 {v.platform}</p>
      {v.catatan && <p className="text-xs text-plum/60 dark:text-milk/60 mt-2 leading-relaxed">⚠️ {t(v.catatan)}</p>}
      {cd && (
        <div className="flex gap-2 mt-4">
          <UnitCountdown angka={cd.hari} label={t('hari')} />
          <UnitCountdown angka={cd.jam} label={t('jam')} />
          <UnitCountdown angka={cd.menit} label={t('mnt')} />
          <UnitCountdown angka={cd.detik} label={t('dtk')} />
        </div>
      )}
      {v.cara && (
        <ol className="mt-4 ml-5 list-decimal text-sm text-plum/70 dark:text-milk/70 space-y-1.5 leading-relaxed">
          {v.cara.map((c, i) => <li key={i}>{t(c)}</li>)}
        </ol>
      )}
      {v.link && (
        <p className="mt-4">
          <a href={v.link.url} target="_blank" rel="noopener noreferrer"
             className="inline-block bg-rose text-plum text-sm font-extrabold px-5 py-2.5 rounded-full">
            {t(v.link.label)} →
          </a>
        </p>
      )}
    </article>
  )
}

export default function VotingPage() {
  const t = useT()
  const loc = useLocale()
  // satu timer untuk semua kartu biar detiknya sinkron; null sebelum mount supaya
  // angka countdown tidak dirender server (cegah hydration mismatch).
  const [now, setNow] = useState(null)
  useDocTitle('Voting')
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const acuan = now ?? Date.now()

  const buka = VOTING.filter(v => statusVote(v, acuan) === 'buka')
    .sort((a, b) => new Date(a.selesai) - new Date(b.selesai))
  const segera = VOTING.filter(v => statusVote(v, acuan) === 'segera')
    .sort((a, b) => new Date(a.mulai) - new Date(b.mulai))
  const tunggu = VOTING.filter(v => statusVote(v, acuan) === 'tunggu')
  const tutup = VOTING.filter(v => statusVote(v, acuan) === 'tutup')
    .sort((a, b) => new Date(b.selesai) - new Date(a.selesai))

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="pt-16 pb-12 text-center">
        <SiteNav className="mb-8" />
        <p className="flex justify-center items-center" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-rose" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-gold -ml-3 mt-2.5" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </p>
        <h1 className="font-display text-4xl sm:text-6xl text-plum dark:text-milk mt-2">{t('Voting Hearts2Hearts')}</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">{t('Dukung H2H & Carmen Anak Bangsa')}</p>
      </header>

      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">🔴 {t('Sedang berlangsung')}</p>
        {buka.length === 0 && <p className="text-sm text-plum/60 dark:text-milk/60">{t('Belum ada voting yang buka saat ini.')}</p>}
        {buka.map(v => <KartuVoting key={v.id} v={v} now={now} />)}
      </section>

      {segera.length > 0 && (
        <section className="space-y-4 mt-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">🟡 {t('Segera')}</p>
          {segera.map(v => <KartuVoting key={v.id} v={v} now={now} />)}
        </section>
      )}

      {tunggu.length > 0 && (
        <section className="space-y-4 mt-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">⚪ {t('Belum diumumkan')}</p>
          {tunggu.map(v => <KartuVoting key={v.id} v={v} now={now} />)}
        </section>
      )}

      {tutup.length > 0 && (
        <section className="space-y-4 mt-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">⚫ {t('Sudah tutup')}</p>
          {tutup.map(v => <KartuVoting key={v.id} v={v} now={now} />)}
        </section>
      )}

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">💗 {t('Voting Carmen')}</p>
        <div className="rounded-2xl border border-rose/40 dark:border-rose/20 bg-white/70 dark:bg-plum/40 p-5 sm:p-6">
          <p className="text-sm font-bold text-plum/70 dark:text-milk/70">{t(VOTING_CARMEN.status)}</p>
          <ul className="mt-3 space-y-2.5">
            {VOTING_CARMEN.daftar.map(d => (
              <li key={d.platform} className="text-sm text-plum/60 dark:text-milk/60 leading-relaxed">
                <span className="font-bold text-plum/80 dark:text-milk/80">📱 {d.platform}</span> — {t(d.info)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">📱 {t('Panduan aplikasi')}</p>
        <div className="rounded-2xl border border-rose/40 dark:border-rose/20 bg-white/70 dark:bg-plum/40 p-5 sm:p-6">
          <p className="text-xs text-plum/50 dark:text-milk/50 mb-3 leading-relaxed">
            {t('Voting acara musik mingguan — dipakai saat H2H comeback/promosi. Pola umum: download gratis → daftar akun → vote di periode yang berlaku.')}
          </p>
          <ul className="space-y-2.5">
            {PANDUAN_APLIKASI.map(p => (
              <li key={p.aplikasi} className="text-sm text-plum/60 dark:text-milk/60 leading-relaxed">
                <span className="font-bold text-plum/80 dark:text-milk/80">{p.aplikasi}</span>
                <span className="text-plum/40 dark:text-milk/40"> · {p.acara}</span>
                <br />{t(p.info)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-plum/40 dark:text-milk/40">
        {t('Data diverifikasi dari pengumuman resmi & media · terakhir dicek')} {formatCek(TERAKHIR_DICEK, loc)}
      </p>
    </main>
  )
}
