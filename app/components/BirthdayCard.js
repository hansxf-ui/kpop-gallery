'use client'
import { useEffect, useState } from 'react'
import { imgOpt } from '../../lib/supabase'
import { DISPLAY_NAME, altOf } from '../../lib/gallery'
import { todaysSpecialDate } from '../../lib/specialDates'
import { memoryOfDay } from '../../lib/today'
import { makeBirthdayStoryBlob } from '../../lib/cardMaker'
import { downloadBlob } from '../../lib/download'
import { useT, useLocale } from '../../lib/i18n'

// Kartu ulang tahun (fitur 6): hanya tampil di hari ulang tahun member menurut lib/specialDates.js
// (tanggal & bulan saja — tahun lahir tidak tercatat, jadi umur tidak disebut).
// Foto: foto solo member itu, dipilih deterministik dari tanggal (sama untuk semua pengunjung).
export default function BirthdayCard({ now }) {
  const t = useT()
  const loc = useLocale()
  const special = todaysSpecialDate(now)
  const key = special && special.type === 'birthday'
    ? Object.keys(DISPLAY_NAME).find((k) => DISPLAY_NAME[k] === special.name) : null
  const [photo, setPhoto] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!key) return
    let alive = true
    // ilike tanpa % = sama persis (tanpa peduli huruf besar/kecil) → hanya foto solo.
    memoryOfDay(now, { filter: (q) => q.ilike('idol', key), salt: 'ultah' })
      .then((p) => { if (alive) setPhoto(p) }).catch(() => { if (alive) setPhoto(null) })
    return () => { alive = false }
  }, [key, now])

  if (!key) return null
  const nama = special.name
  const title = t('Selamat ulang tahun, {nama}! 🎂', { nama })
  const date = new Date(now.getFullYear(), special.month - 1, special.day).toLocaleDateString(loc, { day: 'numeric', month: 'long' })

  async function buat() {
    setBusy(true); setMsg('')
    try {
      const blob = await makeBirthdayStoryBlob(photo.url, { name: nama, title, date, footer: 'Hearts2Hearts Gallery · S2U 💗' })
      const filename = `ultah-${key.toLowerCase()}-${now.getFullYear()}.png`
      const file = typeof File !== 'undefined' ? new File([blob], filename, { type: 'image/png' }) : null
      // HP: lembar bagikan bawaan (X, IG Story, WhatsApp…). Lainnya: unduh file.
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title, text: `${title} #Happy${nama.replace(/[^A-Za-z]/g, '')}Day` }) }
        catch (e) { if (e && e.name !== 'AbortError') downloadBlob(blob, filename) }
      } else downloadBlob(blob, filename)
    } catch {
      setMsg(t('Kartu gagal dibuat untuk foto ini.'))
    }
    setBusy(false)
  }

  return (
    <section aria-labelledby="kartu-ultah" className="rounded-3xl border border-gold/60 bg-gradient-to-br from-gold/15 via-white/80 to-rose/15 p-5 text-center dark:from-gold/10 dark:via-white/5 dark:to-rose/10">
      <h2 id="kartu-ultah" className="font-display text-3xl text-plum dark:text-milk">{title}</h2>
      <p className="mt-1 text-sm font-bold text-gold">{date}</p>
      {photo === undefined && <div className="skeleton mx-auto mt-4 aspect-[55/85] w-44 rounded-2xl" />}
      {photo === null && <p className="mt-3 text-sm text-plum/60 dark:text-milk/60">{t('Belum ada foto solo {nama} untuk kartu ini.', { nama })}</p>}
      {photo && (
        <>
          <img src={imgOpt(photo.url, 500)} alt={altOf(photo)} className="mx-auto mt-4 aspect-[55/85] w-44 rounded-2xl border-4 border-white object-cover object-top shadow-lg" />
          <button onClick={buat} disabled={busy} className="mt-4 rounded-full bg-plum px-5 py-2.5 text-sm font-bold text-milk disabled:opacity-50 dark:bg-gold dark:text-plum">
            🎂 {busy ? t('Membuat…') : t('Buat & bagikan kartu ulang tahun')}
          </button>
          <p className="mt-2 text-xs text-plum/55 dark:text-milk/55">{t('Ukuran Story (9:16) — siap untuk X, IG Story, atau WhatsApp.')}</p>
        </>
      )}
      {msg && <p role="status" className="mt-2 text-xs font-bold text-red-600 dark:text-red-300">{msg}</p>}
    </section>
  )
}
