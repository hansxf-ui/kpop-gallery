'use client'
import { useMemo, useState } from 'react'
import { sb, imgOpt } from '../../lib/supabase'
import { thumbOf, tagLabel, tagsOf } from '../../lib/gallery'
import { suggestTags } from '../../lib/tagSuggest'
import { useT } from '../../lib/i18n'

// Fitur 4: saran tag untuk foto lama yang belum ber-tag. Tiap baris disimpan hanya saat admin
// menekan "Terapkan" — tidak ada yang tersimpan otomatis.
export default function AdminTagSuggest({ items, onSaved }) {
  const t = useT()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(null)
  const [skip, setSkip] = useState([]) // id yang dilewati admin di sesi ini
  const list = useMemo(() => items
    .filter((it) => tagsOf(it).length === 0 && !skip.includes(it.id))
    .map((it) => ({ it, tags: suggestTags(`${it.title || ''} ${it.note || ''}`) }))
    .filter((x) => x.tags.length > 0), [items, skip])

  async function terapkan({ it, tags }) {
    setBusy(it.id); setMsg('')
    const { data, error } = await sb.from('items').update({ tags }).eq('id', it.id).select('id')
    setBusy(null)
    if (error) return setMsg(t('Gagal menyimpan perubahan: {pesan}', { pesan: error.message }))
    if (!data || data.length === 0) return setMsg(t('Perubahan tidak tersimpan — akun ini tidak punya izin, atau sesi sudah habis. Masuk ulang lalu coba lagi.'))
    onSaved()
  }

  if (list.length === 0) return null
  return (
    <div className="mt-10 rounded-3xl bg-white/70 dark:bg-white/5 p-5 border border-rose/40 dark:border-rose/20">
      <h2 className="font-display text-2xl text-plum dark:text-milk mb-1">🏷️ {t('Saran tag untuk foto lama ({n})', { n: list.length })}</h2>
      <p className="mb-3 text-xs text-plum/50 dark:text-milk/50">{t('Ditebak dari kata di judul (mis. "MV", "stage"). Periksa dulu, lalu tekan Terapkan — tidak ada yang tersimpan otomatis.')}</p>
      {msg && <p role="status" className="mb-2 text-sm font-bold text-red-600 dark:text-red-300">{msg}</p>}
      <ul className="max-h-96 space-y-2 overflow-y-auto">
        {list.slice(0, 50).map((x) => (
          <li key={x.it.id} className="flex items-center gap-3 rounded-xl bg-white p-2 dark:bg-white/10 dark:text-milk">
            {x.it.type !== 'video'
              ? <img src={imgOpt(thumbOf(x.it), 120)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-rose/20 text-xs">▶</span>}
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-bold">{x.it.title || x.it.idol}</p>
              <p className="text-xs font-bold text-gold">{x.tags.map((k) => `#${t(tagLabel(k))}`).join('  ')}</p>
            </div>
            <button onClick={() => terapkan(x)} disabled={busy === x.it.id} className="shrink-0 rounded-full bg-plum px-3 py-1 text-xs font-bold text-milk disabled:opacity-50 dark:bg-gold dark:text-plum">
              {busy === x.it.id ? t('Menyimpan…') : t('Terapkan')}
            </button>
            <button onClick={() => setSkip((s) => [...s, x.it.id])} className="shrink-0 text-xs font-bold text-plum/60 dark:text-milk/60">{t('Lewati')}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
