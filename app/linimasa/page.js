'use client'
import { useT, useLang, useDocTitle } from '../../lib/i18n'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { sb, fetchAllItems, imgOpt } from '../../lib/supabase'
import { thumbOf } from '../../lib/gallery'
import { groupByEra, formatRilis } from '../../lib/eras'
import ThemeToggle from '../components/ThemeToggle'
import SiteNav from '../components/SiteNav'
import Skeleton from '../components/Skeleton'

// Linimasa era (fitur 3): koleksi galeri dikelompokkan per era, urut sesuai tanggal rilis.
export default function Linimasa() {
  const t = useT()
  const { lang } = useLang()
  const [items, setItems] = useState(null)
  const [error, setError] = useState(false)
  const [total, setTotal] = useState(null) // jumlah seluruh item, untuk menghitung yang belum ber-era
  function load() {
    setError(false); setItems(null)
    // Hanya item yang punya era (sisanya cuma dihitung — lewat query count terpisah).
    fetchAllItems({ filter: (q) => q.not('era', 'is', null).neq('era', '') }).then(setItems).catch(() => { setItems([]); setError(true) })
  }
  useDocTitle('Linimasa Era')
  useEffect(() => {
    load()
    sb.from('items').select('id', { count: 'exact', head: true }).then(({ count }) => setTotal(count ?? null))
  }, [])
  const { groups, tanpaEra: eraKosong } = useMemo(() => groupByEra(items || []), [items])
  const tanpaEra = items && total !== null ? Math.max(0, total - items.length) + eraKosong : 0

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="pt-16 pb-12 text-center">
        <SiteNav className="mb-8" />
        <p className="text-gold text-2xl" aria-hidden>✦ ✧ ✦</p>
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2">{t('Linimasa Era')}</h1>
        <p className="mt-3 font-bold text-plum/70 dark:text-milk/70">{t('Perjalanan Hearts2Hearts lewat koleksi galeri, dari rilisan pertama sampai terbaru.')}</p>
      </header>

      {items === null && <Skeleton count={4} />}
      {error && (
        <div className="py-6 text-center">
          <p className="font-bold text-plum dark:text-milk">{t('Gagal memuat koleksi.')}</p>
          <button onClick={load} className="mt-4 rounded-full bg-plum px-5 py-2 text-sm font-bold text-milk dark:bg-gold dark:text-plum">{t('Coba lagi')}</button>
        </div>
      )}
      {items && !error && groups.length === 0 && (
        <p className="text-center text-plum/60 dark:text-milk/60">{t('Belum ada item yang ditandai era. Isi kolom era lewat halaman admin.')}</p>
      )}

      <ol className="relative ml-3 border-l-2 border-rose/40 dark:border-rose/20">
        {groups.map((g) => (
          <li key={g.era} className="relative mb-10 pl-6">
            <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-gold dark:border-[#0D1D31]" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-widest text-gold">{g.release ? formatRilis(g.release, lang) : t('Tanggal belum tercatat')}</p>
            <h2 className="font-display text-3xl text-plum dark:text-milk">{g.era}</h2>
            <p className="text-sm text-plum/60 dark:text-milk/60">
              {g.release ? `${t(g.release.jenis)} · ` : ''}{t('{n} item', { n: g.items.length })}
            </p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              {g.items.filter((it) => it.type !== 'video').slice(0, 8).map((it) => (
                <Link key={it.id} href={`/galeri?item=${it.id}`} className="shrink-0">
                  <img src={imgOpt(thumbOf(it), 300)} alt={it.title || it.idol} loading="lazy" decoding="async"
                    width={96} height={128} className="h-32 w-24 rounded-xl object-cover bg-[#DCEBF6] dark:bg-[#1B3049]" />
                </Link>
              ))}
            </div>
            <Link href={`/galeri?era=${encodeURIComponent(g.era)}`} className="mt-1 inline-block text-sm font-bold text-gold underline underline-offset-4">
              {t('Lihat semua')} ({g.items.length}) →
            </Link>
          </li>
        ))}
      </ol>
      {tanpaEra > 0 && <p className="text-center text-xs text-plum/50 dark:text-milk/50">{t('{n} item belum ditandai era.', { n: tanpaEra })}</p>}
    </main>
  )
}
