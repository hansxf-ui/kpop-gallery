import { sb, fetchItemsByIds } from './supabase'
import { namesOf, MEMBERS } from './gallery'
import { rankReactions } from './topReacted'

const EMOJI = ['😍', '🔥', '😭', '👏']

// Fitur 8: { topAll: [{ it, jumlah }], memberWeek: { member, jumlah } | null } — atau null kalau
// belum ada reaksi sama sekali (bagian statistik disembunyikan, tidak menampilkan angka 0).
// Jalur utama: view migrasi 11. Cadangan (view belum ada): hitung dari baris reaksi (maks. 5.000).
export async function fetchFandomStats() {
  let top = null, members = null
  const a = await sb.from('top_reacted_all').select('item_id, jumlah').limit(5)
  if (!a.error && Array.isArray(a.data)) top = a.data
  const b = await sb.from('member_reactions_week').select('member, jumlah')
  if (!b.error && Array.isArray(b.data)) members = b.data

  if (!top) top = rankReactions(await reactionRows(), 5)
  if (!members) members = await memberWeekFallback()

  const ids = top.filter((x) => x.jumlah > 0).map((x) => x.item_id)
  const rows = ids.length ? await fetchItemsByIds(ids) : []
  const byId = new Map(rows.map((r) => [r.id, r]))
  const topAll = top.map((x) => byId.get(x.item_id) && { it: byId.get(x.item_id), jumlah: x.jumlah }).filter(Boolean)
  const memberWeek = bestMember(members)
  if (topAll.length === 0 && !memberWeek) return null
  return { topAll, memberWeek }
}

// Member dengan reaksi terbanyak (hanya 8 member, bukan "Hearts2Hearts"); seri → urutan member.
export function bestMember(rows) {
  const list = (rows || []).filter((r) => MEMBERS.includes(r.member) && r.jumlah > 0)
  if (list.length === 0) return null
  return list.sort((x, y) => y.jumlah - x.jumlah || MEMBERS.indexOf(x.member) - MEMBERS.indexOf(y.member))[0]
}

async function reactionRows(sinceIso) {
  const out = []
  for (let from = 0; from < 5000; from += 1000) {
    let q = sb.from('reactions').select('item_id').in('emoji', EMOJI).lte('created_at', new Date().toISOString())
    if (sinceIso) q = q.gte('created_at', sinceIso)
    const { data, error } = await q.range(from, from + 999)
    if (error) throw error
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}

async function memberWeekFallback() {
  const rows = await reactionRows(new Date(Date.now() - 7 * 86400000).toISOString())
  const perItem = rankReactions(rows, 1000)
  if (perItem.length === 0) return []
  const items = await fetchItemsByIds(perItem.map((x) => x.item_id))
  const idol = new Map(items.map((it) => [it.id, it]))
  const c = {}
  for (const { item_id, jumlah } of perItem) {
    const it = idol.get(item_id)
    if (it) for (const n of namesOf(it)) c[n] = (c[n] || 0) + jumlah
  }
  return Object.entries(c).map(([member, jumlah]) => ({ member, jumlah }))
}
