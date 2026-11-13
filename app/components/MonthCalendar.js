'use client'
import { useMemo, useState } from 'react'
import { JADWAL, RIWAYAT_2026, TIPE_LABEL } from '../../lib/jadwal'
import { monthGrid, eventsByDay, shiftMonth } from '../../lib/calendar'
import { dayKey, parseTanggal, isDateOnly } from '../../lib/schedule'
import { useT, useLocale } from '../../lib/i18n'
import Icon, { eventIcon } from './Icon'

// Kalender bulanan (fitur 13). now: tanggal patokan dari halaman (diisi setelah mount).
export default function MonthCalendar({ now }) {
  const t = useT()
  const loc = useLocale()
  const [cur, setCur] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [sel, setSel] = useState(null)
  const byDay = useMemo(() => eventsByDay(JADWAL, RIWAYAT_2026), [])
  const weeks = useMemo(() => monthGrid(cur.y, cur.m), [cur])
  const today = dayKey(now)
  const judulBulan = new Date(cur.y, cur.m, 1).toLocaleDateString(loc, { month: 'long', year: 'numeric' })
  // Nama hari mulai Senin (5 Jan 2026 = Senin), sesuai bahasa.
  const hari = Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 5 + i).toLocaleDateString(loc, { weekday: 'short' }))
  const bulanIni = weeks.flat().filter((d) => d.inMonth && byDay.has(d.key))
  const tampil = sel ? (byDay.get(sel) || []).map((e) => [sel, e]) : bulanIni.flatMap((d) => byDay.get(d.key).map((e) => [d.key, e]))
  const go = (d) => { setCur((c) => shiftMonth(c, d)); setSel(null) }
  const fmt = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' }) }

  return (
    <section aria-label={t('Kalender bulanan')} className="rounded-3xl border border-rose/40 bg-white/85 p-3 dark:border-rose/20 dark:bg-plum/60 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button onClick={() => go(-1)} aria-label={t('Bulan sebelumnya')} className="grid h-9 w-9 place-items-center rounded-full border border-rose/50 font-bold dark:border-rose/25 dark:text-milk">‹</button>
        <h2 className="font-display text-2xl capitalize text-plum dark:text-milk" aria-live="polite">{judulBulan}</h2>
        <button onClick={() => go(1)} aria-label={t('Bulan berikutnya')} className="grid h-9 w-9 place-items-center rounded-full border border-rose/50 font-bold dark:border-rose/25 dark:text-milk">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-plum/50 dark:text-milk/50" aria-hidden>
        {hari.map((h) => <span key={h}>{h}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1" role="grid">
        {weeks.flat().map((d) => {
          const ev = byDay.get(d.key) || []
          const on = sel === d.key
          return (
            <button key={d.key} onClick={() => setSel(on ? null : d.key)} disabled={ev.length === 0} aria-pressed={on}
              aria-label={`${fmt(d.key)}${ev.length ? ` — ${ev.map((e) => t(e.judul)).join(', ')}` : ''}`}
              className={`flex min-h-[52px] flex-col items-center rounded-xl p-1 text-xs sm:min-h-[76px] sm:items-start ${d.inMonth ? '' : 'opacity-35'} ${ev.length ? 'bg-rose/15 font-bold hover:bg-rose/25 dark:bg-white/10' : ''} ${on ? 'ring-2 ring-gold' : ''} ${d.key === today ? 'outline outline-2 outline-plum/60 dark:outline-milk/60' : ''}`}>
              <span className={`tabular-nums ${d.key === today ? 'text-gold' : 'text-plum dark:text-milk'}`}>{d.date.getDate()}</span>
              {ev.length > 0 && (
                <>
                  <span className="flex items-center text-[10px] leading-none text-gold sm:hidden" aria-hidden><Icon name={eventIcon(ev[0].tipe)} size={14} />{ev.length > 1 ? '+' : ''}</span>
                  <span className="hidden w-full space-y-0.5 text-left sm:block">
                    {ev.slice(0, 2).map((e) => <span key={e.id} className="block truncate text-[10px] font-bold text-plum/80 dark:text-milk/80"><Icon name={eventIcon(e.tipe)} size={10} className="mr-0.5 text-gold" />{t(e.judul)}</span>)}
                    {ev.length > 2 && <span className="block text-[10px] text-plum/50 dark:text-milk/50">+{ev.length - 2}</span>}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">{sel ? fmt(sel) : t('Acara bulan ini')}</p>
        {tampil.length === 0 && <p className="text-sm text-plum/60 dark:text-milk/60">{t('Tidak ada acara tercatat di bulan ini.')}</p>}
        <ul className="space-y-2">
          {tampil.map(([k, e]) => (
            <li key={`${k}-${e.id}`} className="text-sm">
              <span className="font-bold text-plum dark:text-milk"><Icon name={eventIcon(e.tipe)} size={15} className="mr-1.5 text-gold" />{t(e.judul)}</span>
              <span className="block text-xs text-plum/60 dark:text-milk/60">
                {!sel && `${fmt(k)} · `}{t(TIPE_LABEL[e.tipe] || e.tipe)}
                {!isDateOnly(e.tanggal) && ` · ${parseTanggal(e.tanggal).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}`}
                {e.lokasi && <> · <Icon name="mapPin" size={12} className="mr-0.5" />{t(e.lokasi)}</>}
                {e.riwayat && e.catatan && ` · ${t(e.catatan)}`}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-plum/45 dark:text-milk/45">{t('Acara yang tanggalnya belum diumumkan hanya ada di tampilan Daftar.')}</p>
      </div>
    </section>
  )
}
