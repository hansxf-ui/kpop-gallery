'use client'
import { useEffect, useState } from 'react'
import { sb } from '../../lib/supabase'

function LoveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#FFC93C" />
      <g fill="#E63946">
        <path transform="translate(7.4,7.6)" d="M0 0.9C-.5-.1-2-.3-2.6.6-3.1 1.4-2.6 2.4-1.6 3.1L0 4.3l1.6-1.2c1-.7 1.5-1.7 1-2.5C2-.3.5-.1 0 .9z" />
        <path transform="translate(16.6,7.6)" d="M0 0.9C-.5-.1-2-.3-2.6.6-3.1 1.4-2.6 2.4-1.6 3.1L0 4.3l1.6-1.2c1-.7 1.5-1.7 1-2.5C2-.3.5-.1 0 .9z" />
      </g>
      <path d="M8.3 14.6c1 1.2 2.2 1.8 3.7 1.8s2.7-.6 3.7-1.8" stroke="#8A5A00" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function FireIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22.6c4.9 0 8.2-3.4 8.2-7.8 0-3-1.7-5.4-3.1-7.2C15.8 6 14.3 4.4 13.9 1.9c-.1-.6-.9-.8-1.3-.3C11.2 3.3 10.3 5.1 9.9 6.8c-1-.6-2-1.4-2.4-2.7-.2-.6-1-.7-1.4-.2C4.4 6 3.3 9 3.3 12.4c0 5.6 3.7 10.2 8.7 10.2z" fill="#F97B2D" />
      <path d="M12 21.4c2.6 0 4.4-1.8 4.4-4.2 0-1.7-.9-3-1.7-4-.7-.9-1.5-1.7-1.7-3.1-.1-.5-.7-.6-1-.2-.7 1-1.2 1.9-1.4 2.8-.6-.3-1.1-.8-1.4-1.5-.1-.3-.6-.3-.8-.1-.9 1-1.5 2.4-1.5 4 0 3.4 2.1 6.3 5.1 6.3z" fill="#FFD23C" />
    </svg>
  )
}

function CryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#FFC93C" />
      <path d="M6.6 9.6c1-1 2.6-1 3.6 0" stroke="#8A5A00" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M13.8 9.6c1-1 2.6-1 3.6 0" stroke="#8A5A00" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <ellipse cx="12" cy="15.8" rx="2.4" ry="3" fill="#8A5A00" />
      <path d="M4.3 11.2C3.1 12.7 2.5 14.3 2.6 15.9c.1 1.2 1 2 2 1.9 1-.1 1.7-1.1 1.6-2.3-.1-1.5-1-2.9-1.9-4.3z" fill="#4AA8E0" />
      <path d="M19.7 11.2c1.2 1.5 1.8 3.1 1.7 4.7-.1 1.2-1 2-2 1.9-1-.1-1.7-1.1-1.6-2.3.1-1.5 1-2.9 1.9-4.3z" fill="#4AA8E0" />
    </svg>
  )
}

function ClapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <g stroke="#9FC3E0" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 1.6v2.6" />
        <path d="M7.4 3l1.4 2.2" />
        <path d="M16.6 3l-1.4 2.2" />
      </g>
      <rect x="3.2" y="15.8" width="4.2" height="4.4" rx="1.5" transform="rotate(28 5.3 18)" fill="#7FC4E8" />
      <rect x="16.6" y="15.8" width="4.2" height="4.4" rx="1.5" transform="rotate(-28 18.7 18)" fill="#5FA8D3" />
      <g transform="rotate(28 8 12)">
        <rect x="5.4" y="6.5" width="5.2" height="10" rx="2.6" fill="#FFD9A8" />
        <path d="M6.7 8.4V7M8 7.8V6.4M9.3 7.8V6.4" stroke="#E8A86A" strokeWidth="1.1" strokeLinecap="round" />
        <ellipse cx="11" cy="11.8" rx="1.2" ry="1.9" fill="#FFD9A8" />
      </g>
      <g transform="rotate(-28 16 12)">
        <rect x="13.4" y="6.5" width="5.2" height="10" rx="2.6" fill="#FFC98A" />
        <path d="M14.7 7.8V6.4M16 7.8V6.4M17.3 8.4V7" stroke="#DE9A5E" strokeWidth="1.1" strokeLinecap="round" />
        <ellipse cx="13" cy="11.8" rx="1.2" ry="1.9" fill="#FFC98A" />
      </g>
    </svg>
  )
}

// key tetap emoji aslinya supaya hitungan reaksi yang sudah tersimpan di database tidak hilang;
// yang tampil ke pengguna adalah ikon SVG di bawah ini.
const REACTIONS = [
  { key: '😍', label: 'Suka banget', Icon: LoveIcon },
  { key: '🔥', label: 'Keren', Icon: FireIcon },
  { key: '😭', label: 'Terharu', Icon: CryIcon },
  { key: '👏', label: 'Tepuk tangan', Icon: ClapIcon },
]

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

  async function react(key) {
    if (mine.includes(key)) return
    setCounts((c) => ({ ...c, [key]: (c[key] || 0) + 1 }))
    const next = [...mine, key]
    setMine(next)
    try { localStorage.setItem(`h2h-reacted-${itemId}`, JSON.stringify(next)) } catch {}
    await sb.from('reactions').insert({ item_id: itemId, emoji: key })
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {REACTIONS.map(({ key, label, Icon }) => (
        <button key={key} onClick={() => react(key)} disabled={mine.includes(key)} aria-label={label} title={label}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold border transition ${mine.includes(key) ? 'bg-gold/30 border-gold' : 'bg-white/90 border-transparent hover:bg-white'} text-plum disabled:opacity-80`}>
          <Icon /> {counts[key] ? <span className="text-xs">{counts[key]}</span> : null}
        </button>
      ))}
    </div>
  )
}
