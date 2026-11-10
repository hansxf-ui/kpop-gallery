'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { fetchAllItems, imgOpt } from '../../lib/supabase'
import { MEMBERS, DISPLAY_NAME, namesOf, altOf } from '../../lib/gallery'
import { RELEASES, groupByEra, formatRilis } from '../../lib/eras'
import { replaceQuery } from '../../lib/galeriUrl'
import { useT, useLang, useDocTitle } from '../../lib/i18n'
import ThemeToggle from '../components/ThemeToggle'
import SiteNav from '../components/SiteNav'
import Lightbox from '../components/Lightbox'

const pilihan = 'rounded-full border border-rose/50 bg-white/80 px-3 py-2 text-sm font-bold text-plum dark:border-rose/25 dark:bg-white/10 dark:text-milk'

// Satu sisi perbandingan: foto utama + deret foto lain dari era itu.
function Sisi({ label, nama, era, release, photos, onOpen }) {
  const t = useT()
  const { lang } = useLang()
  const [i, setI] = useState(0)
  useEffect(() => { setI(0) }, [era, nama])
  const it = photos[i]
  return (
    <section aria-label={`${label}: ${era}`} className="min-w-0 rounded-3xl border border-rose/40 bg-white/80 p-3 dark:border-rose/20 dark:bg-white/5">
      <p className="text-xs font-bold uppercase tracking-widest text-gold">{label}</p>
      <h2 className="font-display text-2xl text-plum dark:text-milk">{era}</h2>
      <p className="mb-2 text-xs text-plum/55 dark:text-milk/55">{release ? formatRilis(release, lang) : t('Tanggal belum tercatat')}</p>
      {!it && (
        <p className="grid aspect-[3/4] place-items-center rounded-2xl bg-rose/10 p-4 text-center text-sm font-bold text-plum/70 dark:bg-white/5 dark:text-milk/70">
          {t('Belum ada foto {nama} di era {era}.', { nama, era })}
        </p>
      )}
      {it && (
        <>
          <button onClick={() => onOpen(photos, i)} className="block w-full" aria-label={t('Buka {judul}', { judul: altOf(it) })}>
            <img src={imgOpt(it.url, 700)} alt={altOf(it)} decoding="async"
              className="aspect-[3/4] w-full rounded-2xl object-cover object-top bg-[#DCEBF6] dark:bg-[#1B3049]" />
          </button>
          <p className="mt-1 truncate text-xs font-bold text-plum/70 dark:text-milk/70">{it.title || it.idol}</p>
          {photos.length > 1 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              {photos.slice(0, 12).map((p, j) => (
                <button key={p.id} onClick={() => setI(j)} aria-pressed={i === j} aria-label={altOf(p)}
                  className={`shrink-0 rounded-lg ${i === j ? 'ring-2 ring-gold' : 'opacity-70 hover:opacity-100'}`}>
                  <img src={imgOpt(p.url, 160)} alt="" loading="lazy" width={44} height={58} className="h-[58px] w-11 rounded-lg object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

// Perbandingan sebelum–sesudah per era (fitur 3): satu member, dua era, berdampingan.
export default function BandingClient() {
  const t = useT()
  useDocTitle('Bandingkan era')
  const [member, setMember] = useState(MEMBERS[0])
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [items, setItems] = useState(null)
  const [error, setError] = useState(false)
  const [ready, setReady] = useState(false)
  const [lb, setLb] = useState(null)

  // Pilihan dari URL (?member=CARMEN&a=The Chase&b=Lemon Tang) — bisa dibagikan.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const m = (p.get('member') || '').toUpperCase()
    if (MEMBERS.includes(m)) setMember(m)
    setA(p.get('a') || ''); setB(p.get('b') || '')
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    let alive = true
    setItems(null); setError(false)
    // Hanya foto yang menyebut member ini; unit ("JUUN & CARMEN") ikut, tapi foto solo diutamakan.
    fetchAllItems({ filter: (q) => q.eq('type', 'photo').ilike('idol', `%${member}%`) })
      .then((all) => { if (alive) setItems(all.filter((it) => namesOf(it).includes(member))) })
      .catch(() => { if (alive) { setItems([]); setError(true) } })
    return () => { alive = false }
  }, [member, ready])

  const groups = useMemo(() => groupByEra(items || []).groups, [items])
  // Semua era rilisan resmi + era lain yang memang ada di data member ini.
  const eraOptions = useMemo(() => {
    const names = RELEASES.map((r) => r.nama)
    for (const g of groups) if (!names.includes(g.era)) names.push(g.era)
    return names
  }, [groups])

  // Bawaan: era pertama & terakhir yang punya foto member ini.
  useEffect(() => {
    if (!items || groups.length === 0) return
    const ada = (e) => eraOptions.includes(e)
    if (!a || !ada(a)) setA(groups[0].era)
    if (!b || !ada(b)) setB(groups[groups.length - 1].era)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, groups])

  useEffect(() => {
    if (ready) replaceQuery({ member, a: a || null, b: b || null })
  }, [ready, member, a, b])

  const nama = DISPLAY_NAME[member] || member
  const sideOf = (era) => {
    const g = groups.find((x) => x.era === era)
    const photos = g ? [...g.items].sort((x, y) => namesOf(x).length - namesOf(y).length) : [] // solo dulu
    return { photos, release: g?.release || RELEASES.find((r) => r.nama === era) || null }
  }
  const A = sideOf(a), B = sideOf(b)

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="pt-16 pb-8 text-center">
        <SiteNav className="mb-8" />
        <p className="text-gold text-2xl" aria-hidden>⇆</p>
        <h1 className="font-display text-5xl text-plum dark:text-milk mt-2">{t('Bandingkan era')}</h1>
        <p className="mt-3 font-bold text-plum/70 dark:text-milk/70">{t('Lihat satu member di dua era berdampingan.')}</p>
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        <select value={member} onChange={(e) => setMember(e.target.value)} aria-label={t('Member')} className={pilihan}>
          {MEMBERS.map((m) => <option key={m} value={m}>{DISPLAY_NAME[m]}</option>)}
        </select>
        <select value={a} onChange={(e) => setA(e.target.value)} aria-label={t('Era pertama')} className={pilihan}>
          {eraOptions.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <span aria-hidden className="font-bold text-plum/50 dark:text-milk/50">vs</span>
        <select value={b} onChange={(e) => setB(e.target.value)} aria-label={t('Era kedua')} className={pilihan}>
          {eraOptions.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <button onClick={() => { const x = a; setA(b); setB(x) }} className={pilihan} aria-label={t('Tukar era')}>⇄</button>
      </div>

      {items === null && <div className="grid grid-cols-2 gap-3"><div className="skeleton aspect-[3/4] rounded-3xl" /><div className="skeleton aspect-[3/4] rounded-3xl" /></div>}
      {error && <p className="text-center font-bold text-plum dark:text-milk">{t('Gagal memuat koleksi.')}</p>}
      {items && !error && groups.length === 0 && (
        <p className="text-center text-plum/60 dark:text-milk/60">{t('Belum ada foto {nama} yang ditandai era.', { nama })}</p>
      )}
      {items && !error && groups.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Sisi label={t('Sebelum')} nama={nama} era={a} release={A.release} photos={A.photos} onOpen={(list, i) => setLb({ list, i })} />
          <Sisi label={t('Sesudah')} nama={nama} era={b} release={B.release} photos={B.photos} onOpen={(list, i) => setLb({ list, i })} />
        </div>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href={`/idol/${member}`} className="font-bold text-gold underline underline-offset-4">{t('Buka album {nama} sendiri →', { nama })}</Link>
      </p>

      {lb && <Lightbox items={lb.list} index={lb.i} onIndexChange={(i) => setLb({ ...lb, i })} onClose={() => setLb(null)} />}
    </main>
  )
}
