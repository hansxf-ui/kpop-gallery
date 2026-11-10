'use client'
import { useEffect, useState } from 'react'
import { MEMBERS } from './gallery'

// Mode "fokus satu member" / bias (fitur 5). Disimpan di perangkat saja (localStorage) —
// tidak pernah dikirim ke server dan tidak mengubah data apa pun.
const KEY = 'h2h-bias'
export const BIAS_EVENT = 'h2h:bias-changed'

export function getBias() {
  if (typeof window === 'undefined') return null
  try { const v = localStorage.getItem(KEY); return MEMBERS.includes(v) ? v : null } catch { return null }
}

export function setBias(v) {
  const val = MEMBERS.includes(v) ? v : null
  try { if (val) localStorage.setItem(KEY, val); else localStorage.removeItem(KEY) } catch {}
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BIAS_EVENT))
  return val
}

// null sebelum mount (render server = tanpa bias → tidak ada hydration mismatch).
export function useBias() {
  const [bias, setB] = useState(null)
  useEffect(() => {
    const sync = () => setB(getBias())
    sync()
    window.addEventListener(BIAS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener(BIAS_EVENT, sync); window.removeEventListener('storage', sync) }
  }, [])
  return bias
}

// Urutan stabil: item yang memuat bias di depan, urutan asli dipertahankan di tiap kelompok.
export function biasFirst(list, bias, namesOf) {
  if (!bias) return list
  const a = [], b = []
  for (const it of list) (namesOf(it).includes(bias) ? a : b).push(it)
  return [...a, ...b]
}
