'use client'
import { useT } from '../../lib/i18n'
import { useEffect, useState } from 'react'

// Tombol "kembali ke atas" untuk grid panjang — muncul setelah menggulir cukup jauh.
export default function ScrollTopButton() {
  const t = useT()
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!show) return null
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
      aria-label={t('Kembali ke atas')}
      className="fixed bottom-5 right-5 z-30 grid h-11 w-11 place-items-center rounded-full bg-plum text-lg font-bold text-milk shadow-lg page-fade-in dark:bg-gold dark:text-plum">
      ↑
    </button>
  )
}
