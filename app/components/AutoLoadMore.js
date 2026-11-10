'use client'
import { useT } from '../../lib/i18n'
import { useEffect, useRef } from 'react'

// Scroll tak terbatas: saat penanda ini mendekati bawah layar (900px sebelum terlihat),
// batch berikutnya dimuat otomatis. Tombol "Muat lebih banyak" tetap ada sebagai cadangan
// (browser tanpa IntersectionObserver, atau pengunjung yang lebih suka menekan tombol).
export default function AutoLoadMore({ hasMore, remaining, onMore }) {
  const t = useT()
  const ref = useRef(null)
  const onMoreRef = useRef(onMore)
  onMoreRef.current = onMore

  useEffect(() => {
    if (!hasMore || typeof IntersectionObserver === 'undefined') return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) onMoreRef.current() },
      { rootMargin: '0px 0px 900px 0px' },
    )
    io.observe(el)
    // Observer dibuat ulang tiap kali jumlah sisa berubah: kalau penanda masih terlihat
    // sesudah batch dimuat (layar tinggi), observer baru langsung memicu batch berikutnya.
    return () => io.disconnect()
  }, [hasMore, remaining])

  if (!hasMore) return null
  return (
    <div ref={ref} className="mt-6 text-center">
      <button onClick={() => onMoreRef.current()} className="rounded-full bg-white/80 dark:bg-white/10 border border-rose/40 dark:border-rose/20 font-bold px-5 py-2 text-sm">
        {t('Muat lebih banyak ({n} lagi)', { n: remaining })}
      </button>
    </div>
  )
}
