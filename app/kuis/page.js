'use client'
import { useT, useDocTitle } from '../../lib/i18n'
import { useEffect, useMemo, useState } from 'react'
import { fetchAllItems, imgOpt } from '../../lib/supabase'
import { quizPool, makeRound, nameOf, getBest, saveBest, ROUND, eraPool, makeEraRound, makeCropRound, erasIn } from '../../lib/quiz'
import { namesOf } from '../../lib/gallery'
import { useBias } from '../../lib/bias'
import BiasPicker from '../components/BiasPicker'
import { shareOrCopy } from '../../lib/share'
import SiteNav from '../components/SiteNav'
import Icon from '../components/Icon'

// Kuis "Tebak member" (fitur 11).
export default function Kuis() {
  const t = useT()
  const bias = useBias()
  const [items, setItems] = useState(null)
  const [error, setError] = useState(false)
  const [round, setRound] = useState(null)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [shareMsg, setShareMsg] = useState('')
  // Fitur 11: 'member' (kuis lama, tidak diubah) | 'era' (tebak era) | 'crop' (foto potongan)
  const [mode, setMode] = useState('member')

  useDocTitle('Tebak Member')
  function load() {
    setError(false); setItems(null)
    // Kuis hanya memakai foto — video & YouTube tidak perlu dimuat.
    fetchAllItems({ filter: (q) => q.eq('type', 'photo') }).then(setItems).catch(() => { setItems([]); setError(true) })
  }
  useEffect(() => { load() }, [])
  useEffect(() => { setBest(getBest(mode)); setRound(null) }, [mode])
  const memberPool = useMemo(() => quizPool(items || []), [items])
  const poolEra = useMemo(() => eraPool(items || []), [items])
  const pool = mode === 'era' ? poolEra : memberPool
  const cukup = mode === 'era' ? poolEra.length >= 4 && erasIn(poolEra).length >= 2 : memberPool.length >= 4

  function mulai() {
    // Fitur 5: dengan mode fokus, sampai 4 dari 10 soal memakai foto member itu.
    const opts = bias ? { prefer: (it) => namesOf(it).includes(bias), preferCount: mode === 'era' ? 6 : 4 } : {}
    const build = mode === 'era' ? makeEraRound : mode === 'crop' ? makeCropRound : makeRound
    setRound(build(pool, ROUND, Math.random, opts)); setI(0); setPicked(null); setScore(0); setShareMsg('')
  }
  const q = round && round[i]
  const selesai = round && i >= round.length

  function jawab(opt) {
    if (picked) return
    setPicked(opt)
    if (opt === q.answer) setScore((s) => s + 1)
  }
  function lanjut() {
    const next = i + 1
    setPicked(null)
    setI(next)
    if (next >= round.length) setBest(saveBest(score, mode))
  }
  async function bagikan() {
    const msg = await shareOrCopy(`${window.location.origin}/kuis`, t('Aku dapat {s}/{n} di kuis Tebak Member Hearts2Hearts! Coba kamu 💗', { s: score, n: round.length }))
    if (msg) setShareMsg(t(msg))
  }

  // Foto soal berikutnya dimuat lebih dulu supaya tidak menunggu setelah "Lanjut".
  useEffect(() => {
    const n = round && round[i + 1]
    if (n) { const img = new Image(); img.src = imgOpt(n.it.url, 700) }
  }, [round, i])

  const btn = 'rounded-full bg-plum px-6 py-2.5 text-sm font-bold text-milk dark:bg-gold dark:text-plum'
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 page-fade-in">
      <header className="pt-16 pb-8 text-center">
        <SiteNav className="mb-8" />
        <p className="flex justify-center text-gold" aria-hidden><Icon name="help" size={30} /></p>
        <h1 className="font-display text-5xl text-plum dark:text-milk mt-2">{t('Tebak Member')}</h1>
        <p className="mt-3 font-bold text-plum/70 dark:text-milk/70">{t('Siapa member di foto ini? {n} soal dari koleksi galeri.', { n: ROUND })}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5" role="group" aria-label={t('Mode kuis')}>
          {[['member', 'Tebak member'], ['era', 'Tebak era'], ['crop', 'Foto potongan']].map(([v, label]) => (
            <button key={v} onClick={() => setMode(v)} aria-pressed={mode === v}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${mode === v ? 'border-plum bg-plum text-milk dark:border-gold dark:bg-gold dark:text-plum' : 'border-rose/50 bg-white/70 dark:border-rose/20 dark:bg-white/10 dark:text-milk'}`}>
              {t(label)}
            </button>
          ))}
        </div>
        {mode !== 'member' && <p className="mt-2 text-xs text-plum/60 dark:text-milk/60">{mode === 'era' ? t('Foto ini dari era apa? Era dicocokkan dengan daftar rilisan.') : t('Fotonya diperbesar di satu bagian — siapa membernya?')}</p>}
        <p className="mt-3"><BiasPicker /></p>
        {best > 0 && <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">{t('Skor terbaikmu: {b}/{n}', { b: best, n: ROUND })}</p>}
      </header>

      {items === null && <p className="text-center text-plum/60 dark:text-milk/60">{t('Memuat foto…')}</p>}
      {error && (
        <div className="text-center">
          <p className="font-bold text-plum dark:text-milk">{t('Gagal memuat koleksi.')}</p>
          <button onClick={load} className={`${btn} mt-4`}>{t('Coba lagi')}</button>
        </div>
      )}
      {items && !error && !cukup && mode === 'era' && <p className="text-center text-plum/60 dark:text-milk/60">{t('Belum cukup foto yang ditandai era untuk mode ini.')}</p>}
      {items && !error && !cukup && mode !== 'era' && <p className="text-center text-plum/60 dark:text-milk/60">{t('Belum cukup foto solo member untuk membuat kuis.')}</p>}

      {items && !error && cukup && !round && (
        <p className="text-center"><button onClick={mulai} className={btn}>{t('Mulai kuis')}</button></p>
      )}

      {q && !selesai && (
        <section aria-live="polite">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gold">{t('Soal {i} / {n} · Skor {s}', { i: i + 1, n: round.length, s: score })}</p>
          <div className="card mx-auto mb-4 max-w-sm pb-2">
            <div className="overflow-hidden rounded-2xl">
              <img key={q.it.id} src={imgOpt(q.it.url, q.crop ? 1000 : 700)} alt={mode === 'era' ? t('Foto yang era-nya harus ditebak') : t('Foto member yang harus ditebak')} decoding="async"
                style={q.crop ? { transform: picked ? 'scale(1)' : `scale(${q.crop.zoom})`, transformOrigin: `${q.crop.x}% ${q.crop.y}%`, transition: 'transform .6s ease' } : undefined}
                className="mx-auto aspect-[3/4] w-full rounded-2xl object-cover object-top bg-[#DCEBF6] dark:bg-[#1B3049]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt) => {
              const benar = picked && opt === q.answer
              const salah = picked === opt && opt !== q.answer
              return (
                <button key={opt} onClick={() => jawab(opt)} disabled={!!picked}
                  className={`rounded-2xl border px-4 py-3 font-bold transition ${benar ? 'border-green-600 bg-green-100 text-green-800' : salah ? 'border-red-500 bg-red-100 text-red-700' : 'border-rose/50 bg-white/80 text-plum hover:bg-rose/15 dark:border-rose/25 dark:bg-white/10 dark:text-milk'}`}>
                  {mode === 'era' ? opt : nameOf(opt)} {benar ? '✓' : salah ? '✕' : ''}
                </button>
              )
            })}
          </div>
          {picked && (
            <div className="mt-4 text-center">
              <p className="font-bold text-plum dark:text-milk">
                {picked === q.answer ? t('Benar! 💗') : mode === 'era' ? t('Ups — ini era {era}.', { era: q.answer }) : t('Ups — ini {nama}.', { nama: nameOf(q.answer) })}
                {q.it.title && <span className="block text-xs font-normal text-plum/60 dark:text-milk/60">{q.it.title}</span>}
              </p>
              <button onClick={lanjut} className={`${btn} mt-3`} autoFocus>{i + 1 < round.length ? t('Lanjut →') : t('Lihat hasil')}</button>
            </div>
          )}
        </section>
      )}

      {selesai && (
        <section className="text-center" aria-live="polite">
          <p className="font-display text-6xl text-gold">{score}/{round.length}</p>
          <p className="mt-2 font-bold text-plum dark:text-milk">
            {score === round.length ? t('Sempurna! Kamu S2U sejati 💗') : score >= round.length * 0.7 ? t('Keren! Hampir semua benar.') : t('Ayo coba lagi — makin sering, makin hafal!')}
          </p>
          <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">{t('Skor terbaik: {b}/{n}', { b: best, n: ROUND })}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button onClick={mulai} className={btn}>{t('Main lagi')}</button>
            <button onClick={bagikan} className="rounded-full border border-rose/50 bg-white/80 px-6 py-2.5 text-sm font-bold dark:border-rose/25 dark:bg-white/10 dark:text-milk"><Icon name="share" size={14} className="mr-1.5" />{t('Ajak teman')}</button>
          </div>
          {shareMsg && <p role="status" className="mt-2 text-xs font-bold text-gold">{shareMsg}</p>}
        </section>
      )}
    </main>
  )
}
