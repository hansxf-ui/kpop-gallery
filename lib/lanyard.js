// Kawat & tali kartu member di beranda (app/page.js).
//
// Satu kawat per BARIS kartu, digambar sebagai kurva kuadrat di SVG viewBox 0..100 × 0..100 dengan
// preserveAspectRatio="none" setinggi var(--H) (tinggi ruang tali). Karena titik kendali x-nya di
// tengah (50), posisi x berbanding lurus dengan t, jadi tinggi kawat di posisi kartu bisa dihitung
// persis: kartu di kolom j dari n kolom berpusat di t = (j + 0,5) / n.
// Tali tiap kartu dimulai tepat di titik itu (top = H × k) dan berakhir di atas kartu (H).
//
// Dulu semua tali dimulai dari ketinggian yang sama sementara kawatnya melengkung: tali di desktop
// menembus 15–30px ke atas kawat, di HP berhenti 13–17px sebelum kawat.

export const WIRE_Y0 = 5 // ujung kawat di pinggir baris (% dari H)
export const WIRE_CTRL = 95 // titik kendali kurva (% dari H) → titik terendah di tengah = 50% H
export const WIRE_PATH = `M0,${WIRE_Y0} Q50,${WIRE_CTRL} 100,${WIRE_Y0}`

// Tinggi kawat (pecahan dari H, 0 = atas) di posisi t (0 = kiri baris, 1 = kanan).
export function wireAt(t) {
  const u = 1 - t
  return (WIRE_Y0 * (u * u + t * t) + WIRE_CTRL * 2 * t * u) / 100
}

// Pecahan H tempat tali kartu kolom j (dari n kolom berlebar sama) bertemu kawat.
export const stringTop = (j, n) => wireAt((j + 0.5) / n)
