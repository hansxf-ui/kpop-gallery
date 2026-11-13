'use client'
import { useT, useLang } from '../../lib/i18n'
import { useEffect, useRef, useState } from 'react'
import { sb } from '../../lib/supabase'
import { protectedWrite } from '../../lib/turnstile'
import Emoji from './Emoji'

// Gambar emoji Twemoji (SVG, disimpan di situs sendiri — app/components/Emoji.js), supaya tampil sama di
// semua HP termasuk Android. Dulu memakai gambar emoji Apple dari CDN luar (lisensinya tidak jelas).
// key tetap emoji aslinya supaya hitungan reaksi yang sudah tersimpan di database tidak hilang.
const REACTIONS = [
  { key: '😍', label: 'Suka banget' },
  { key: '🔥', label: 'Keren' },
  { key: '😭', label: 'Terharu' },
  { key: '👏', label: 'Tepuk tangan' },
]

const storeKey = (itemId) => `h2h-reacted-${itemId}`

// Fitur 10: token rahasia per reaksi (128 bit acak), disimpan hanya di perangkat ini.
// Database menyimpan hash-nya saja (migrasi 09) — membatalkan reaksi butuh token yang cocok.
function newToken() {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}
// RPC belum ada (migrasi 09 belum dijalankan): PostgREST PGRST202 / Postgres 42883.
const noRpc = (error) => !!error && (error.code === 'PGRST202' || error.code === '42883' || /Could not find the function/i.test(error.message || ''))

function loadMine(itemId) {
  try {
    const raw = JSON.parse(localStorage.getItem(storeKey(itemId)) || '[]')
    return raw.map((r) => (typeof r === 'string' ? { emoji: r, id: null, token: null } : { token: null, ...r }))
  } catch { return [] }
}

export default function Reactions({ itemId }) {
  const t = useT()
  const { lang } = useLang()
  const [counts, setCounts] = useState({})
  const [mine, setMine] = useState([]) // [{emoji, id}]
  const [info, setInfo] = useState('')
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
          let removed = false
          if (existing.token) {
            // Jalur aman: hapus lewat RPC yang mencocokkan token milik perangkat ini.
            const { data, error } = await sb.rpc('remove_reaction', { p_id: existing.id, p_token: existing.token })
            removed = !error && data === true
          } else {
            // Reaksi lama (sebelum token): coba hapus langsung. .select() mengembalikan baris yang
            // benar-benar terhapus — tanpa hak hapus, Supabase tidak error tapi juga tidak menghapus.
            const { data, error } = await sb.from('reactions').delete().eq('id', existing.id).select('id')
            removed = !error && !!data && data.length > 0
          }
          if (!removed) { // gagal di server → kembalikan tampilan seperti semula
            setCounts((c) => ({ ...c, [key]: (c[key] || 0) + 1 }))
            setMine(prevMine)
            persist(prevMine)
            setInfo(existing.token ? t('Reaksi belum bisa dibatalkan. Coba lagi.') : t('Reaksi lama ini tidak bisa dibatalkan.'))
            setTimeout(() => setInfo(''), 2500)
          }
        } else {
          // id tak tercatat lokal: JANGAN hapus baris siapa pun (bisa milik pengunjung lain).
          // Lepas catatan lokal saja, lalu samakan hitungan dengan kebenaran server.
          await refreshCounts()
        }
      } else {
        setCounts((c) => ({ ...c, [key]: (c[key] || 0) + 1 }))
        const token = newToken()
        let id = null
        let data, error
        let saved = token
        // Fitur 9: dengan kunci Turnstile terpasang, reaksi lewat /api/lindung (diverifikasi anti-spam).
        let gate = { fallback: true }
        try { gate = await protectedWrite('reaksi', { item_id: itemId, emoji: key, owner: token }, lang) } catch (e) {
          error = e
          setInfo(t(e.message)); setTimeout(() => setInfo(''), 2500)
        }
        if (gate.ok) id = gate.data.id ?? null
        else if (gate.fallback && !error) ({ data, error } = await sb.rpc('add_reaction', { p_item: itemId, p_emoji: key, p_token: token }))
        if (!gate.ok && noRpc(error)) {
          // Migrasi 09 belum dijalankan → cara lama (tanpa token, tidak bisa dibatalkan dengan aman).
          ;({ data, error } = await sb.from('reactions').insert({ item_id: itemId, emoji: key }).select('id'))
          saved = null
          if (!error) id = data?.[0]?.id ?? null
        } else if (!gate.ok && !error) id = typeof data === 'number' || typeof data === 'string' ? data : null
        if (error) { // gagal → rollback hitungan optimistis, jangan catat lokal
          setCounts((c) => ({ ...c, [key]: Math.max(0, (c[key] || 1) - 1) }))
          return
        }
        const next = [...mine, { emoji: key, id, token: saved }]
        setMine(next)
        persist(next)
      }
    } finally {
      busyRef.current = false
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
    <div className="flex items-center justify-center gap-2" role="group" aria-label={t('Reaksi')}>
      {REACTIONS.map(({ key, label }) => {
        const active = has(key)
        return (
          <button key={key} onClick={() => toggle(key)} aria-label={t(label)} title={t(label)} aria-pressed={active}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold border transition ${active ? 'bg-gold/30 border-gold' : 'bg-white/90 border-transparent hover:bg-white'} text-plum`}>
            <Emoji char={key} size={22} />
            {counts[key] ? <span className="text-xs">{counts[key]}</span> : null}
          </button>
        )
      })}
    </div>
    {info && <p role="status" className="text-[11px] font-bold text-milk/60">{info}</p>}
    </div>
  )
}
