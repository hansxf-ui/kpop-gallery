import { sb } from './supabase'

// "Paling disukai minggu ini" (fitur 6): [{ item_id, jumlah }] urut terbanyak.
// Jalur utama: view top_reacted_week (migrasi 07). Cadangan bila view belum ada: hitung dari
// baris reaksi 7 hari terakhir (maks. 5.000 baris supaya tetap ringan).
export async function fetchTopReacted(limit = 12) {
  const v = await sb.from('top_reacted_week').select('item_id, jumlah').limit(limit)
  if (!v.error && Array.isArray(v.data)) return v.data
  const since = new Date(Date.now() - 7 * 86400000).toISOString()
  const rows = []
  for (let from = 0; from < 5000; from += 1000) {
    // Syarat sama dengan view (migrasi 10): hanya 4 emoji situs, tanpa tanggal masa depan.
    const { data, error } = await sb.from('reactions').select('item_id')
      .in('emoji', ['😍', '🔥', '😭', '👏']).gte('created_at', since).lte('created_at', new Date().toISOString())
      .range(from, from + 999)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return rankReactions(rows, limit)
}

export function rankReactions(rows, limit = 12) {
  const c = new Map()
  for (const r of rows) if (r.item_id) c.set(r.item_id, (c.get(r.item_id) || 0) + 1)
  return [...c.entries()]
    .map(([item_id, jumlah]) => ({ item_id, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah || String(a.item_id).localeCompare(String(b.item_id)))
    .slice(0, limit)
}
