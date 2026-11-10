'use client'
import { sb, fetchItemsByIds } from './supabase'
import { MEMBERS, namesOf } from './gallery'
import { getFavorites } from './favorites'
import { readCachedRows } from './offline'
import { getBias } from './bias'
import { visitBaseline } from './lastVisit'

// Fitur 12: "foto baru dari member favoritmu" — lencana di navigasi.
// Member favorit = member di foto-foto favoritmu + member fokus (fitur 5). Semuanya di perangkat.
// "Baru" = sama dengan label Baru (sejak kunjungan terakhir), dan lencana hilang setelah dilihat.
const SEEN = 'h2h-newfav-seen'
const CACHE = 'h2h-newfav-cache' // sessionStorage: hasil hitung 5 menit, supaya tidak query tiap pindah halaman
export const NEWFAV_EVENT = 'h2h:newfav-changed'

export async function favoriteMembers() {
  const ids = getFavorites()
  const rows = readCachedRows().filter((r) => ids.includes(r.id))
  const kurang = ids.filter((id) => !rows.some((r) => r.id === id)).slice(0, 100)
  if (kurang.length) { try { rows.push(...(await fetchItemsByIds(kurang))) } catch {} }
  const set = new Set()
  for (const r of rows) for (const n of namesOf(r)) if (MEMBERS.includes(n)) set.add(n)
  const bias = getBias()
  if (bias) set.add(bias)
  return [...set]
}

const readSeen = () => { try { const v = localStorage.getItem(SEEN); const d = v && new Date(v); return d && !Number.isNaN(d.getTime()) ? d : null } catch { return null } }

export function markFavNewSeen() {
  try { localStorage.setItem(SEEN, new Date().toISOString()); sessionStorage.removeItem(CACHE) } catch {}
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(NEWFAV_EVENT))
}

// Patokan = yang lebih baru dari kunjungan terakhir & terakhir kali lencana dilihat.
export function sinceOf(baseline, seen) {
  if (!baseline && !seen) return null
  if (!baseline) return seen
  if (!seen) return baseline
  return baseline > seen ? baseline : seen
}

export function countNew(rows, members, since) {
  if (!since || members.length === 0) return { count: 0, members: [] }
  const hit = new Set()
  let count = 0
  for (const r of rows) {
    if (!r.created_at || new Date(r.created_at) <= since) continue
    const ns = namesOf(r).filter((n) => members.includes(n))
    if (ns.length) { count++; ns.forEach((n) => hit.add(n)) }
  }
  return { count, members: [...hit] }
}

// → { count, members } (members = member yang punya foto baru, untuk tujuan tautan lencana).
export async function fetchFavNew() {
  const since = sinceOf(visitBaseline(), readSeen())
  if (!since) return { count: 0, members: [] }
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE) || 'null')
    if (c && c.since === since.toISOString() && Date.now() - c.at < 5 * 60 * 1000) return c.value
  } catch {}
  const members = await favoriteMembers()
  if (members.length === 0) return { count: 0, members: [] }
  const { data, error } = await sb.from('items').select('id, idol, created_at')
    .gt('created_at', since.toISOString()).order('created_at', { ascending: false }).limit(300)
  if (error) return { count: 0, members: [] }
  const value = countNew(data || [], members, since)
  try { sessionStorage.setItem(CACHE, JSON.stringify({ since: since.toISOString(), at: Date.now(), value })) } catch {}
  return value
}
