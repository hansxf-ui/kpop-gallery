'use client'
import { MEMBERS, DISPLAY_NAME } from '../../lib/gallery'
import { setBias, useBias } from '../../lib/bias'
import { useT } from '../../lib/i18n'

// Pilih / matikan mode fokus member (fitur 5). Disimpan di perangkat.
export default function BiasPicker({ className = '' }) {
  const t = useT()
  const bias = useBias()
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold text-plum/70 dark:text-milk/70 ${className}`}>
      <label htmlFor="bias-pilih">💗 {t('Fokus member:')}</label>
      <select id="bias-pilih" value={bias || ''} onChange={(e) => setBias(e.target.value || null)}
        className="rounded-full border border-rose/50 bg-white/80 px-2 py-1 text-xs font-bold text-plum dark:border-rose/25 dark:bg-white/10 dark:text-milk">
        <option value="">{t('Tidak ada')}</option>
        {MEMBERS.map((m) => <option key={m} value={m}>{DISPLAY_NAME[m]}</option>)}
      </select>
      {bias && <button type="button" onClick={() => setBias(null)} aria-label={t('Matikan mode fokus')} className="px-1 opacity-60 hover:opacity-100">✕</button>}
    </span>
  )
}
