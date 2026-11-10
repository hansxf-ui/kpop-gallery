'use client'
import { useT } from '../../lib/i18n'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const t = useT()
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')) }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.theme = next ? 'dark' : 'light'
  }

  // Switch Uiverse (juanpabl0svn), dipasang atas kiriman pemilik 18 Okt 2026:
  // tercentang = siang (matahari + awan, tema terang), tak tercentang = malam (bulan + bintang, tema gelap).
  return (
    <label htmlFor="switch" className="switch fixed top-4 right-4 z-40">
      <input id="switch" type="checkbox" checked={!dark} onChange={toggle}
        aria-label={dark ? t('Ganti ke mode terang') : t('Ganti ke mode gelap')} />
      <span className="slider"></span>
      <span className="decoration"></span>
    </label>
  )
}
