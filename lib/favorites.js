const KEY = 'h2h-favorites'

export function getFavorites() {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function toggleFavorite(id) {
  const cur = getFavorites()
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
