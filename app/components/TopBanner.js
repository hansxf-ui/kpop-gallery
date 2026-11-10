'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sb } from '../../lib/supabase'
import { todaysSpecialDate } from '../../lib/specialDates'
import { useT, useLang } from '../../lib/i18n'

const lsGet = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const lsSet = (k, v) => { try { localStorage.setItem(k, v) } catch {} }

export default function TopBanner() {
  const t = useT()
  const { lang } = useLang()
  const [announcement, setAnnouncement] = useState(null)
  // Versi Inggris pengumuman (opsional, diisi admin; baris settings 'announcement_en').
  // Kosong = pengunjung EN tetap melihat teks Indonesia.
  const [announcementEn, setAnnouncementEn] = useState(null)
  const [dismissed, setDismissed] = useState(true) // true dulu supaya tidak kedip sebelum cek localStorage
  const special = todaysSpecialDate()
  // Kunci tanggal LOKAL (bukan UTC) — banner yang ditutup pagi WITA tidak muncul lagi siangnya.
  const d = new Date()
  const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  useEffect(() => {
    if (special) {
      document.documentElement.classList.add('party')
      setDismissed(lsGet('h2h-dismiss-special') === todayKey)
      return () => document.documentElement.classList.remove('party')
    }
    sb.from('settings').select('key, value').in('key', ['announcement', 'announcement_en']).then(({ data }) => {
      const get = (k) => (data || []).find((r) => r.key === k)?.value?.trim() || null
      const val = get('announcement')
      setAnnouncement(val)
      setAnnouncementEn(val ? get('announcement_en') : null) // tanpa teks Indonesia, banner mati
      // Tutup banner dicatat per teks Indonesia, jadi berlaku untuk kedua bahasa.
      setDismissed(val ? lsGet('h2h-dismiss-announcement') === val : true)
    })
  }, [special, todayKey])

  function dismiss() {
    setDismissed(true)
    if (special) lsSet('h2h-dismiss-special', todayKey)
    else if (announcement) lsSet('h2h-dismiss-announcement', announcement)
  }

  if (dismissed) return null
  const text = special ? t(special.label) : lang === 'en' && announcementEn ? announcementEn : announcement
  if (!text) return null

  return (
    <div className="relative z-30 bg-gradient-to-r from-rose via-gold/70 to-lilac text-plum text-center text-sm font-bold pl-10 pr-20 py-2.5">
      <span>{special ? '🎉 ' : '📣 '}{text}</span>
      {special && special.type === 'birthday' && (
        <Link href="/hari-ini" className="ml-2 underline underline-offset-4">{t('Buat kartu ulang tahun →')}</Link>
      )}
      <button onClick={dismiss} aria-label={t('Tutup pengumuman')} className="absolute left-3 top-1/2 -translate-y-1/2 font-bold">✕</button>
    </div>
  )
}
