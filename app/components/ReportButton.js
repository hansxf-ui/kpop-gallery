'use client'
import { useEffect, useState } from 'react'
import { REPORT_REASONS, sendReport, alreadyReported } from '../../lib/reports'

// "🚩 Laporkan foto" di lightbox (fitur 9). Laporan masuk ke antrean admin.
export default function ReportButton({ itemId }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [state, setState] = useState('') // '' | 'kirim' | 'terkirim' | pesan error
  useEffect(() => { setOpen(false); setReason(''); setDetail(''); setState(alreadyReported(itemId) ? 'terkirim' : '') }, [itemId])

  async function kirim(e) {
    e.preventDefault()
    setState('kirim')
    try { await sendReport(itemId, reason, detail); setState('terkirim'); setOpen(false) }
    catch (err) { setState(err.message) }
  }

  if (state === 'terkirim') return <p className="text-[11px] font-bold text-milk/50">🚩 Laporan untuk foto ini sudah terkirim. Terima kasih!</p>
  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-[11px] font-bold text-milk/50 underline underline-offset-4 hover:text-milk">🚩 Laporkan foto ini</button>
  )
  return (
    <form onSubmit={kirim} className="w-full max-w-xs rounded-2xl bg-white/95 p-3 text-left text-sm text-plum">
      <fieldset>
        <legend className="mb-1 font-bold">Ada yang salah dengan foto ini?</legend>
        {REPORT_REASONS.map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 py-0.5">
            <input type="radio" name="alasan" value={k} checked={reason === k} onChange={() => setReason(k)} /> {label}
          </label>
        ))}
      </fieldset>
      <textarea value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={300} rows={2}
        placeholder="Keterangan (opsional), mis. “ini Yuha, bukan Ye-on”" aria-label="Keterangan laporan"
        className="mt-2 w-full rounded-xl border border-rose/60 px-2 py-1 text-xs" />
      <div className="mt-2 flex gap-2">
        <button disabled={!reason || state === 'kirim'} className="rounded-full bg-plum px-4 py-1.5 text-xs font-bold text-milk disabled:opacity-50">
          {state === 'kirim' ? 'Mengirim…' : 'Kirim laporan'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-rose/50 px-4 py-1.5 text-xs font-bold">Batal</button>
      </div>
      {state && state !== 'kirim' && <p role="status" className="mt-2 text-xs font-bold text-red-600">{state}</p>}
    </form>
  )
}
