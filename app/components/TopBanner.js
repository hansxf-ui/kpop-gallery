'use client'
import { useEffect, useState } from 'react'
import { sb } from '../../lib/supabase'
import { todaysSpecialDate } from '../../lib/specialDates'

export default function TopBanner() {
  const [announcement, setAnnouncement] = useState(null)
  const [dismissed, setDismissed] = useState(true) // true dulu supaya tidak kedip sebelum cek localStorage
  const special = todaysSpecialDate()
  const todayKey = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (special) {
      document.documentElement.classList.add('party')
      setDismissed(localStorage.getItem('h2h-dismiss-special') === todayKey)
      return () => document.documentElement.classList.remove('party')
    }
    sb.from('settings').select('value').eq('key', 'announcement').maybeSingle().then(({ data }) => {
      const val = data?.value?.trim() || null
      setAnnouncement(val)
      setDismissed(val ? localStorage.getItem('h2h-dismiss-announcement') === val : true)
    })
  }, [special, todayKey])

  function dismiss() {
    setDismissed(true)
    if (special) localStorage.setItem('h2h-dismiss-special', todayKey)
    else if (announcement) localStorage.setItem('h2h-dismiss-announcement', announcement)
  }

  if (dismissed) return null
  const text = special ? special.label : announcement
  if (!text) return null

  return (
    <div className="relative z-30 bg-gradient-to-r from-rose via-gold/70 to-lilac text-plum text-center text-sm font-bold px-10 py-2.5">
      <span>{special ? '🎉 ' : '📣 '}{text}</span>
      <button onClick={dismiss} aria-label="Tutup pengumuman" className="absolute right-3 top-1/2 -translate-y-1/2 font-bold">✕</button>
    </div>
  )
}
