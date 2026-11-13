'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { sb, fetchAllItems, imgOpt } from '../../lib/supabase'
import { thumbOf, altOf } from '../../lib/gallery'
import { groupCredits } from '../../lib/credits'
import { useT } from '../../lib/i18n'
import Skeleton from './Skeleton'
import Icon from './Icon'

function Grup({ title, groups }) {
  const t = useT()
  if (groups.length === 0) return null
  return (
    <div className="mb-10">
      <h3 className="mb-4 font-display text-2xl text-plum dark:text-milk">{t(title)}</h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <li key={g.name} className="rounded-2xl border border-rose/40 bg-white/80 p-4 dark:border-rose/20 dark:bg-white/5">
            <p className="break-words font-bold text-plum dark:text-milk"><Icon name="camera" size={15} className="mr-1.5 text-gold" />{g.name}</p>
            <p className="text-xs text-plum/55 dark:text-milk/55">{t('{n} item di galeri', { n: g.items.length })}</p>
            <div className="mt-2 flex gap-1.5">
              {g.items.filter((it) => it.type === 'photo').slice(0, 4).map((it) => (
                <Link key={it.id} href={`/galeri?item=${it.id}`}>
                  <img src={imgOpt(thumbOf(it), 160)} alt={altOf(it)} loading="lazy" decoding="async" width={56} height={56}
                    className="h-14 w-14 rounded-lg object-cover bg-[#DCEBF6] dark:bg-[#1B3049]" />
                </Link>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 text-xs font-bold">
              <Link href={`/galeri?q=${encodeURIComponent(g.name)}`} className="text-gold underline underline-offset-4">{t('Lihat fotonya')}</Link>
              {g.link && <a href={g.link} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-gold underline underline-offset-4">{t('Kunjungi sumber ↗')}</a>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Seksi "Kredit Foto" di halaman Tentang (dulu halaman /kredit, sekarang dialihkan ke /tentang).
// Sumber dari kolom `credit` (catatan admin yang diawali "📷").
export default function CreditsSection({ className = '' }) {
  const t = useT()
  const [items, setItems] = useState(null)
  const [error, setError] = useState(false)
  const [total, setTotal] = useState(null)
  function load() {
    setError(false); setItems(null)
    // Hanya item yang punya kredit (jumlah item tanpa kredit dihitung lewat query count terpisah).
    fetchAllItems({ filter: (q) => q.not('credit', 'is', null) }).then(setItems).catch(() => { setItems([]); setError(true) })
  }
  useEffect(() => {
    load()
    sb.from('items').select('id', { count: 'exact', head: true }).then(({ count }) => setTotal(count ?? null))
  }, [])
  const { official, others } = useMemo(() => groupCredits(items || []), [items])
  const tanpa = items && total !== null ? Math.max(0, total - [...official, ...others].reduce((n, g) => n + g.items.length, 0)) : 0

  return (
    <section id="kredit" className={`scroll-mt-6 ${className}`} aria-labelledby="kredit-judul">
      <h2 id="kredit-judul" className="font-display text-3xl text-plum dark:text-milk mb-2"><Icon name="camera" size={26} className="mr-2 text-gold" />{t('Kredit Foto')}</h2>
      <p className="max-w-prose leading-relaxed text-plum/80 dark:text-milk/80">
        {t('Terima kasih untuk para fotografer, fansite, dan sumber resmi yang karyanya ada di galeri ini.')}
      </p>
      <p className="mt-1 mb-6 max-w-prose text-xs text-plum/50 dark:text-milk/50">
        {t('Hak cipta foto dan video tetap milik pemilik aslinya. Penggolongan “sumber resmi” berdasarkan nama di kredit.')}
      </p>

      {items === null && <Skeleton count={4} />}
      {error && (
        <div className="py-6 text-center">
          <p className="font-bold text-plum dark:text-milk">{t('Gagal memuat kredit.')}</p>
          <button onClick={load} className="mt-4 rounded-full bg-plum px-5 py-2 text-sm font-bold text-milk dark:bg-gold dark:text-plum">{t('Coba lagi')}</button>
        </div>
      )}
      {items && !error && official.length + others.length === 0 && (
        <p className="text-plum/60 dark:text-milk/60">{t('Belum ada kredit foto yang tercatat.')}</p>
      )}
      <Grup title="Sumber resmi" groups={official} />
      <Grup title="Fansite & sumber lain" groups={others} />
      {items && tanpa > 0 && <p className="text-xs text-plum/50 dark:text-milk/50">{t('{n} item belum punya keterangan sumber.', { n: tanpa })}</p>}
    </section>
  )
}
