// Pindahkan favorit antar perangkat — lewat KODE (bisa dikirim via chat) atau FILE .json.
// Favorit hanya berisi id item (uuid), tidak ada data pribadi.
//
// Format kode: "H2H1-" + base64url dari 16 byte per uuid (±22 karakter per favorit).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PREFIX = 'H2H1-'
export const isUuid = (v) => typeof v === 'string' && UUID.test(v)
const bersih = (ids) => [...new Set((ids || []).filter(isUuid).map((s) => s.toLowerCase()))]

export function encodeFavCode(ids) {
  const list = bersih(ids)
  let bin = ''
  for (const id of list) {
    const hex = id.replace(/-/g, '')
    for (let i = 0; i < 32; i += 2) bin += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16))
  }
  return PREFIX + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Mengembalikan array uuid, atau melempar Error berpesan Indonesia kalau kodenya rusak.
export function decodeFavCode(code) {
  const s = String(code || '').replace(/\s+/g, '')
  if (!s.toUpperCase().startsWith(PREFIX)) throw new Error('Kode tidak dikenali — kode favorit diawali "H2H1-".')
  const body = s.slice(PREFIX.length).replace(/-/g, '+').replace(/_/g, '/')
  if (!body) return []
  let bin
  try { bin = atob(body + '='.repeat((4 - (body.length % 4)) % 4)) } catch { throw new Error('Kode rusak — pastikan tersalin utuh.') }
  if (bin.length % 16 !== 0) throw new Error('Kode terpotong — pastikan tersalin utuh.')
  const out = []
  for (let i = 0; i < bin.length; i += 16) {
    let hex = ''
    for (let j = i; j < i + 16; j++) hex += bin.charCodeAt(j).toString(16).padStart(2, '0')
    out.push(`${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`)
  }
  return bersih(out)
}

export function favFileContent(ids) {
  return JSON.stringify({ app: 'hearts2hearts-gallery', jenis: 'favorit', versi: 1, diekspor: new Date().toISOString(), favorit: bersih(ids) }, null, 2)
}

// Terima file ekspor situs ini, atau array id polos.
export function parseFavFile(text) {
  let data
  try { data = JSON.parse(text) } catch { throw new Error('File bukan file favorit yang valid.') }
  const ids = Array.isArray(data) ? data : data && Array.isArray(data.favorit) ? data.favorit : null
  if (!ids) throw new Error('File bukan file favorit yang valid.')
  return bersih(ids)
}

// Gabung: favorit yang sudah ada tetap, yang baru ditambahkan di belakang (= "terbaru").
export function mergeFavorites(current, incoming) {
  const ada = new Set(current)
  const baru = bersih(incoming).filter((id) => !ada.has(id))
  return { list: [...current, ...baru], added: baru.length }
}
