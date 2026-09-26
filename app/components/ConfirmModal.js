'use client'
import { useEffect } from 'react'

export default function ConfirmModal({ open, title, message, confirmLabel = 'Ya, hapus', onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-plum/50 dark:bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-xs rounded-3xl bg-milk dark:bg-plum border border-rose/60 dark:border-rose/25 p-6 text-center shadow-xl page-fade-in">
        <p className="flex justify-center items-center mb-3" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" className="text-rose" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg width="26" height="26" viewBox="0 0 24 24" className="text-gold -ml-3 mt-2" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </p>
        <p className="font-display text-xl text-plum dark:text-milk mb-1">{title}</p>
        {message && <p className="text-sm text-plum/70 dark:text-milk/70 mb-5">{message}</p>}
        <div className="flex gap-2 justify-center">
          <button autoFocus onClick={onCancel}
            className="rounded-full bg-white dark:bg-white/10 border border-rose/50 dark:border-rose/20 px-5 py-2 text-sm font-bold text-plum dark:text-milk">
            Batal
          </button>
          <button onClick={onConfirm}
            className="rounded-full bg-red-500 text-white px-5 py-2 text-sm font-bold hover:bg-red-600 transition">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
