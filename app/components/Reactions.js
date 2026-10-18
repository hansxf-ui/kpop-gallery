'use client'
import { useEffect, useRef, useState } from 'react'
import { sb } from '../../lib/supabase'

// Gambar emoji asli Apple (gaya iOS), dimuat dari CDN supaya tampilnya
// sama di semua HP — termasuk Android.
// key tetap emoji aslinya supaya hitungan reaksi yang sudah tersimpan di database tidak hilang.
const APPLE_CDN = 'https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64'

const REACTIONS = [
  { key: '😍', code: '1f60d', label: 'Suka banget' },
  { key: '🔥', code: '1f525', label: 'Keren' },
  { key: '😭', code: '1f62d', label: 'Terharu' },
  { key: '👏', code: '1f44f', label: 'Tepuk tangan' },
]

function AppleEmoji({ code, char, label }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="text-[18px] leading-none">{char}</span>
  return (
    <img src={`${APPLE_CDN}/${code}.png`} alt={label} width="22" height="22"
      draggable={false} onError={() => setFailed(true)} />
  )
}

const storeKey = (itemId) => `h2h-reacted-${itemId}`

function loadMine(itemId) {
  try {
    const raw = JSON.parse(localStorage.getItem(storeKey(itemId)) || '[]')
    return raw.map((r) => (typeof r === 'string' ? { emoji: r, id: null } : r))
  } catch { return [] }
}

export default function Reactions({ itemId }) {
  const [counts, setCounts] = useState({})
  const [mine, setMine] = useState([]) // [{emoji, id}]
  const busyRef = useRef(false) // penjaga sinkron — state async bisa ditembus ketukan ganda

  async function refreshCounts() {
    const { data } = await sb.from('reactions').select('emoji').eq('item_id', itemId)
    const c = {}
    for (const r of data || []) c[r.emoji] = (c[r.emoji] || 0) + 1
    setCounts(c)
  }

  useEffect(() => {
    let alive = true
    sb.from('reactions').select('emoji').eq('item_id', itemId).then(({ data }) => {
      if (!alive) return
      const c = {}
      for (const r of data || []) c[r.emoji] = (c[r.emoji] || 0) + 1
      setCounts(c)
    })
    setMine(loadMine(itemId))
    return () => { alive = false }
  }, [itemId])

  const has = (key) => mine.some((m) => m.emoji === key)
  const persist = (next) => { try { localStorage.setItem(storeKey(itemId), JSON.stringify(next)) } catch {} }

  async function toggle(key) {
    if (busyRef.current) return
    busyRef.current = true
    try {
      const existing = mine.find((m) => m.emoji === key)
      if (existing) {
        // ketuk lagi = batalkan reaksi (optimistis, dengan rollback bila server gagal)
        const prevMine = mine
        const next = mine.filter((m) => m.emoji !== key)
        setCounts((c) => ({ ...c, [key]: Math.max(0, (c[key] || 1) - 1) }))
        setMine(next)
        persist(next)
        if (existing.id) {
          const { error } = await sb.from('reactions').delete().eq('id', existing.id)
          if (error) { // gagal di server → kembalikan tampilan seperti semula
            setCounts((c) => ({ ...c, [key]: (c[key] || 0) + 1 }))
            setMine(prevMine)
            persist(prevMine)
          }
        } else {
          // id tak tercatat lokal: JANGAN hapus baris siapa pun (bisa milik pengunjung lain).
          // Lepas catatan lokal saja, lalu samakan hitungan dengan kebenaran server.
          await refreshCounts()
        }
      } else {
        setCounts((c) => ({ ...c, [key]: (c[key] || 0) + 1 }))
        const { data, error } = await sb.from('reactions').insert({ item_id: itemId, emoji: key }).select('id')
        if (error) { // insert gagal → rollback hitungan optimistis, jangan catat lokal
          setCounts((c) => ({ ...c, [key]: Math.max(0, (c[key] || 1) - 1) }))
          return
        }
        const id = data?.[0]?.id ?? null
        const next = [...mine, { emoji: key, id }]
        setMine(next)
        persist(next)
      }
    } finally {
      busyRef.current = false
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {REACTIONS.map(({ key, code, label }) => {
        const active = has(key)
        return (
          <button key={key} onClick={() => toggle(key)} aria-label={label} title={label} aria-pressed={active}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold border transition ${active ? 'bg-gold/30 border-gold' : 'bg-white/90 border-transparent hover:bg-white'} text-plum`}>
            <AppleEmoji code={code} char={key} label={label} />
            {counts[key] ? <span className="text-xs">{counts[key]}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
