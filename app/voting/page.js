'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '../components/ThemeToggle'
import { VOTING, VOTING_CARMEN, PANDUAN_APLIKASI } from '../../lib/voting'

function hitungMundur(target) {
  const selisih = new Date(target).getTime() - Date.now()
  if (selisih <= 0) return null
  const hari = Math.floor(selisih / 86400000)
  const jam = Math.floor((selisih % 86400000) / 3600000)
  const menit = Math.floor((selisih % 3600000) / 60000)
  const detik = Math.floor((selisih % 60000) / 1000)
  return { hari, jam, menit, detik }
}

function formatTanggal(tanggal) {
  if (!tanggal) return 'Tanggal menyusul'
  return new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// buka | segera | tunggu | tutup
function statusVote(v) {
  if (!v.mulai || !v.selesai) return 'tunggu'
  const now = Date.now()
  if (now < new Date(v.mulai).getTime()) return 'segera'
  if (now > new Date(v.selesai).getTime()) return 'tutup'
  return 'buka'
}

// target hitung mundur: yg buka -> jam tutup, yg segera -> jam buka, yg tunggu -> paling bawah
function targetVote(v) {
  const st = statusVote(v)
  if (st === 'buka') return new Date(v.selesai).getTime()
  if (st === 'segera') return new Date(v.mulai).getTime()
  return Infinity
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
  const st = statusVote(v)
  const target = st === 'buka' ? v.selesai : st === 'segera' ? v.mulai : null
  const cd = target ? hitungMundur(target) : null

  const badge =
    st === 'buka' ? (
      <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose">
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        Buka · tutup {formatTanggal(v.selesai)}
      </span>
    ) : st === 'segera' ? (
      <span className="text-xs font-extrabold uppercase tracking-widest text-gold">Segera · {formatTanggal(v.mulai)}</span>
    ) : (
      <span className="text-xs font-extrabold uppercase tracking-widest text-plum/40 dark:text-milk/40">Belum diumumkan</span>
    )

  return (
    <article className="relative overflow-hidden rounded-2xl border border-rose/40 dark:border-rose/20 bg-white/70 dark:bg-plum/40 backdrop-blur p-5 sm:p-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose via-gold to-lilac" aria-hidden />
      <div>{badge}</div>
      <h2 className="font-display text-xl sm:text-2xl text-plum dark:text-milk mt-2">🏆 {v.event}</h2>
      <p className="mt-1 text-sm font-bold text-plum/70 dark:text-milk/70">{v.kategori}</p>
      <p className="text-xs text-plum/50 dark:text-milk/50 mt-0.5">📱 {v.platform}</p>
      {v.catatan && <p className="text-xs text-plum/60 dark:text-milk/60 mt-2 leading-relaxed">⚠️ {v.catatan}</p>}
      {cd && (
        <div className="flex gap-2 mt-4">
          <UnitCountdown angka={cd.hari} label="hari" />
          <UnitCountdown angka={cd.jam} label="jam" />
          <UnitCountdown angka={cd.menit} label="mnt" />
          <UnitCountdown angka={cd.detik} label="dtk" />
        </div>
      )}
      {v.cara && (
        <ol className="mt-4 ml-5 list-decimal text-sm text-plum/70 dark:text-milk/70 space-y-1.5 leading-relaxed">
          {v.cara.map((c, i) => <li key={i}>{c}</li>)}
        </ol>
      )}
      {v.link && (
        <p className="mt-4">
          <a href={v.link.url} target="_blank" rel="noopener noreferrer"
             className="inline-block bg-rose text-white text-sm font-extrabold px-5 py-2.5 rounded-full">
            {v.link.label} →
          </a>
        </p>
      )}
    </article>
  )
}

export default function VotingPage() {
  // satu timer untuk semua kartu biar detiknya sinkron
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // satu list urut target terdekat: yg tutup disembunyikan, yg belum ada tanggal di bawah
  const semua = VOTING.filter(v => statusVote(v) !== 'tutup')
    .sort((a, b) => targetVote(a) - targetVote(b))

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="py-12 text-center">
        <p className="flex justify-center items-center" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-rose" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-gold -ml-3 mt-2.5" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </p>
        <h1 className="font-display text-4xl sm:text-6xl text-plum dark:text-milk mt-2">Voting Hearts2Hearts</h1>
        <p className="mt-3 text-plum/70 dark:text-milk/70 font-bold">Dukung H2H &amp; Carmen Anak Bangsa</p>
        <p className="mt-4 flex justify-center gap-5 text-sm font-bold text-gold">
          <Link href="/" className="underline underline-offset-4">← Galeri</Link>
          <Link href="/jadwal" className="underline underline-offset-4">Jadwal →</Link>
        </p>
      </header>

      <section className="space-y-4">
        {semua.length === 0 && <p className="text-sm text-plum/60 dark:text-milk/60">Belum ada info voting saat ini.</p>}
        {semua.map(v => <KartuVoting key={v.id} v={v} now={now} />)}
      </section>

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">💗 Voting Carmen</p>
        <div className="rounded-2xl border border-rose/40 dark:border-rose/20 bg-white/70 dark:bg-plum/40 p-5 sm:p-6">
          <p className="text-sm font-bold text-plum/70 dark:text-milk/70">{VOTING_CARMEN.status}</p>
          <ul className="mt-3 space-y-2.5">
            {VOTING_CARMEN.daftar.map(d => (
              <li key={d.platform} className="text-sm text-plum/60 dark:text-milk/60 leading-relaxed">
                <span className="font-bold text-plum/80 dark:text-milk/80">📱 {d.platform}</span> — {d.info}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gold mb-3">📱 Panduan aplikasi</p>
        <div className="rounded-2xl border border-rose/40 dark:border-rose/20 bg-white/70 dark:bg-plum/40 p-5 sm:p-6">
          <p className="text-xs text-plum/50 dark:text-milk/50 mb-3 leading-relaxed">
            Voting acara musik mingguan — dipakai saat H2H comeback/promosi. Pola umum: download gratis → daftar akun → vote di periode yang berlaku.
          </p>
          <ul className="space-y-2.5">
            {PANDUAN_APLIKASI.map(p => (
              <li key={p.aplikasi} className="text-sm text-plum/60 dark:text-milk/60 leading-relaxed">
                <span className="font-bold text-plum/80 dark:text-milk/80">{p.aplikasi}</span>
                <span className="text-plum/40 dark:text-milk/40"> · {p.acara}</span>
                <br />{p.info}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-plum/40 dark:text-milk/40">
        Data diverifikasi dari pengumuman resmi &amp; media · terakhir dicek 2 Okt 2026
      </p>
    </main>
  )
}
