// "Baru sejak kunjungan terakhir" (fitur 5) — disimpan di perangkat saja.
// - localStorage 'h2h-last-visit': waktu kunjungan sebelumnya.
// - sessionStorage 'h2h-visit-baseline': patokan untuk SESI ini, supaya label "Baru" tidak
//   langsung hilang saat pindah halaman atau memuat ulang dalam kunjungan yang sama.
// Kunjungan pertama kali: tidak ada patokan → tidak ada yang ditandai baru (semua akan "baru").
const LAST = 'h2h-last-visit'
const BASE = 'h2h-visit-baseline'

export function visitBaseline() {
  if (typeof window === 'undefined') return null
  try {
    const cur = sessionStorage.getItem(BASE)
    if (cur !== null) return cur === '' ? null : new Date(cur)
    const prev = localStorage.getItem(LAST)
    sessionStorage.setItem(BASE, prev || '')
    localStorage.setItem(LAST, new Date().toISOString())
    const d = prev ? new Date(prev) : null
    return d && !Number.isNaN(d.getTime()) ? d : null
  } catch {
    return null // penyimpanan diblokir (mode privat) → fitur ini diam saja
  }
}

export const isNewSince = (it, baseline) =>
  !!baseline && !!it.created_at && new Date(it.created_at) > baseline
