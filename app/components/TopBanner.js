'use client'
import { useEffect, useState } from 'react'
import { sb } from '../../lib/supabase'
import { todaysSpecialDate } from '../../lib/specialDates'

const lsGet = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const lsSet = (k, v) => { try { localStorage.setItem(k, v) } catch {} }

export default function TopBanner() {
  const [announcement, setAnnouncement] = useState(null)
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
    sb.from('settings').select('value').eq('key', 'announcement').maybeSingle().then(({ data }) => {
      const val = data?.value?.trim() || null
      setAnnouncement(val)
      setDismissed(val ? lsGet('h2h-dismiss-announcement') === val : true)
    })
  }, [special, todayKey])

  function dismiss() {
    setDismissed(true)
    if (special) lsSet('h2h-dismiss-special', todayKey)
    else if (announcement) lsSet('h2h-dismiss-announcement', announcement)
  }

  if (dismissed) return null
  const text = special ? special.label : announcement
  if (!text) return null

  return (
    <div className="relative z-30 bg-gradient-to-r from-rose via-gold/70 to-lilac text-plum text-center text-sm font-bold px-10 py-2.5">
      <span>{special ? '🎉 ' : '📣 '}{text}</span>
      <button onClick={dismiss} aria-label="Tutup pengumuman" className="absolute left-3 top-1/2 -translate-y-1/2 font-bold">✕</button>
    </div>
  )
}
