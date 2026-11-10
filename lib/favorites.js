const KEY = 'h2h-favorites'
// Event setiap kali daftar favorit berubah — nav (jumlah favorit), grid, dan lightbox
// mendengarkannya supaya ikon hati selalu sinkron di mana pun favorit diubah.
export const FAVS_EVENT = 'h2h:favs-changed'

export function getFavorites() {
  if (typeof window === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch { return [] }
}

export function setFavorites(ids) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch {}
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(FAVS_EVENT))
  return ids
}

export function toggleFavorite(id) {
  const cur = getFavorites()
  return setFavorites(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])
}
