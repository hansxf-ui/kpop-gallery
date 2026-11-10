import { sb } from './supabase'
import { namesOf } from './gallery'

// Jumlah item per member + total koleksi.
// Jalur utama: view `member_counts` (supabase/migrations/20261110_01_member_counts.sql) — ±9 baris.
// Cadangan: kalau view belum diterapkan di database, hitung dari kolom idol semua item
// seperti cara lama, supaya beranda tetap benar sebelum migrasi dijalankan.
export async function fetchMemberCounts() {
  const [view, total] = await Promise.all([
    sb.from('member_counts').select('member, jumlah'),
    sb.from('items').select('id', { count: 'exact', head: true }),
  ])
  if (!view.error && !total.error && Array.isArray(view.data)) {
    const counts = {}
    for (const r of view.data) counts[r.member] = r.jumlah
    return { counts, total: total.count ?? 0, source: 'view' }
  }
  return fetchMemberCountsLama()
}

async function fetchMemberCountsLama() {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('items').select('idol').order('id', { ascending: true }).range(from, from + 999)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return { counts: countNames(rows), total: rows.length, source: 'scan' }
}

// Dipakai jalur cadangan — aturan pecah nama sama persis dengan view SQL.
export function countNames(rows) {
  const c = {}
  for (const r of rows) for (const n of namesOf(r)) c[n] = (c[n] || 0) + 1
  return c
}
