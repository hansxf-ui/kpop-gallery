const KEY = 'h2h-favorites'

export function getFavorites() {
  if (typeof window === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch { return [] }
}

export function toggleFavorite(id) {
  const cur = getFavorites()
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  return next
}
