'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')) }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.theme = next ? 'dark' : 'light'
  }

  return (
    <button onClick={toggle} aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      className="fixed top-4 right-4 z-40 h-10 w-10 rounded-full bg-white/85 dark:bg-white/10 backdrop-blur border border-rose/40 dark:border-rose/20 grid place-items-center text-lg shadow">
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
