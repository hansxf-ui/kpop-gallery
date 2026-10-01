'use client'
import { useEffect, useState } from 'react'
import { sb } from '../../lib/supabase'

const EMOJIS = ['😍', '🔥', '😭', '👏']

export default function Reactions({ itemId }) {
  const [counts, setCounts] = useState({})
  const [mine, setMine] = useState([])

  useEffect(() => {
    let alive = true
    sb.from('reactions').select('emoji').eq('item_id', itemId).then(({ data }) => {
      if (!alive) return
      const c = {}
      for (const r of data || []) c[r.emoji] = (c[r.emoji] || 0) + 1
      setCounts(c)
    })
    try { setMine(JSON.parse(localStorage.getItem(`h2h-reacted-${itemId}`) || '[]')) } catch { setMine([]) }
    return () => { alive = false }
  }, [itemId])

  async function react(emoji) {
    if (mine.includes(emoji)) return
    setCounts((c) => ({ ...c, [emoji]: (c[emoji] || 0) + 1 }))
    const next = [...mine, emoji]
    setMine(next)
    try { localStorage.setItem(`h2h-reacted-${itemId}`, JSON.stringify(next)) } catch {}
    await sb.from('reactions').insert({ item_id: itemId, emoji })
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {EMOJIS.map((e) => (
        <button key={e} onClick={() => react(e)} disabled={mine.includes(e)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold border transition ${mine.includes(e) ? 'bg-gold/30 border-gold' : 'bg-white/90 border-transparent hover:bg-white'} text-plum disabled:opacity-80`}>
          {e} {counts[e] ? <span className="text-xs">{counts[e]}</span> : null}
        </button>
      ))}
    </div>
  )
}
