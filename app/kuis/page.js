'use client'
import { useEffect, useMemo, useState } from 'react'
import { fetchAllItems, imgOpt } from '../../lib/supabase'
import { quizPool, makeRound, nameOf, getBest, saveBest, ROUND } from '../../lib/quiz'
import { shareOrCopy } from '../../lib/share'
import ThemeToggle from '../components/ThemeToggle'
import SiteNav from '../components/SiteNav'

// Kuis "Tebak member" (fitur 11).
export default function Kuis() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(false)
  const [round, setRound] = useState(null)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => { document.title = 'Tebak Member · Hearts2Hearts Gallery' }, [])
  function load() {
    setError(false); setItems(null)
    fetchAllItems().then(setItems).catch(() => { setItems([]); setError(true) })
  }
  useEffect(() => { load(); setBest(getBest()) }, [])
  const pool = useMemo(() => quizPool(items || []), [items])

  function mulai() {
    setRound(makeRound(pool)); setI(0); setPicked(null); setScore(0); setShareMsg('')
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
    if (next >= round.length) setBest(saveBest(score))
  }
  async function bagikan() {
    const msg = await shareOrCopy(`${window.location.origin}/kuis`, `Aku dapat ${score}/${round.length} di kuis Tebak Member Hearts2Hearts! Coba kamu 💗`)
    if (msg) setShareMsg(msg)
  }

  // Foto soal berikutnya dimuat lebih dulu supaya tidak menunggu setelah "Lanjut".
  useEffect(() => {
    const n = round && round[i + 1]
    if (n) { const img = new Image(); img.src = imgOpt(n.it.url, 700) }
  }, [round, i])

  const btn = 'rounded-full bg-plum px-6 py-2.5 text-sm font-bold text-milk dark:bg-gold dark:text-plum'
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <header className="pt-16 pb-8 text-center">
        <SiteNav className="mb-8" />
        <p className="text-gold text-2xl" aria-hidden>❓</p>
        <h1 className="font-display text-5xl text-plum dark:text-milk mt-2">Tebak Member</h1>
        <p className="mt-3 font-bold text-plum/70 dark:text-milk/70">Siapa member di foto ini? {ROUND} soal dari koleksi galeri.</p>
        {best > 0 && <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">Skor terbaikmu: {best}/{ROUND}</p>}
      </header>

      {items === null && <p className="text-center text-plum/60 dark:text-milk/60">Memuat foto…</p>}
      {error && (
        <div className="text-center">
          <p className="font-bold text-plum dark:text-milk">Gagal memuat koleksi.</p>
          <button onClick={load} className={`${btn} mt-4`}>Coba lagi</button>
        </div>
      )}
      {items && !error && pool.length < 4 && <p className="text-center text-plum/60 dark:text-milk/60">Belum cukup foto solo member untuk membuat kuis.</p>}

      {items && !error && pool.length >= 4 && !round && (
        <p className="text-center"><button onClick={mulai} className={btn}>Mulai kuis</button></p>
      )}

      {q && !selesai && (
        <section aria-live="polite">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gold">Soal {i + 1} / {round.length} · Skor {score}</p>
          <div className="card mx-auto mb-4 max-w-sm pb-2">
            <img key={q.it.id} src={imgOpt(q.it.url, 700)} alt="Foto member yang harus ditebak" decoding="async"
              className="mx-auto aspect-[3/4] w-full rounded-2xl object-cover object-top bg-[#DCEBF6] dark:bg-[#1B3049]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt) => {
              const benar = picked && opt === q.answer
              const salah = picked === opt && opt !== q.answer
              return (
                <button key={opt} onClick={() => jawab(opt)} disabled={!!picked}
                  className={`rounded-2xl border px-4 py-3 font-bold transition ${benar ? 'border-green-600 bg-green-100 text-green-800' : salah ? 'border-red-500 bg-red-100 text-red-700' : 'border-rose/50 bg-white/80 text-plum hover:bg-rose/15 dark:border-rose/25 dark:bg-white/10 dark:text-milk'}`}>
                  {nameOf(opt)} {benar ? '✓' : salah ? '✕' : ''}
                </button>
              )
            })}
          </div>
          {picked && (
            <div className="mt-4 text-center">
              <p className="font-bold text-plum dark:text-milk">
                {picked === q.answer ? 'Benar! 💗' : `Ups — ini ${nameOf(q.answer)}.`}
                {q.it.title && <span className="block text-xs font-normal text-plum/60 dark:text-milk/60">{q.it.title}</span>}
              </p>
              <button onClick={lanjut} className={`${btn} mt-3`} autoFocus>{i + 1 < round.length ? 'Lanjut →' : 'Lihat hasil'}</button>
            </div>
          )}
        </section>
      )}

      {selesai && (
        <section className="text-center" aria-live="polite">
          <p className="font-display text-6xl text-gold">{score}/{round.length}</p>
          <p className="mt-2 font-bold text-plum dark:text-milk">
            {score === round.length ? 'Sempurna! Kamu S2U sejati 💗' : score >= round.length * 0.7 ? 'Keren! Hampir semua benar.' : 'Ayo coba lagi — makin sering, makin hafal!'}
          </p>
          <p className="mt-1 text-xs text-plum/50 dark:text-milk/50">Skor terbaik: {best}/{ROUND}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button onClick={mulai} className={btn}>Main lagi</button>
            <button onClick={bagikan} className="rounded-full border border-rose/50 bg-white/80 px-6 py-2.5 text-sm font-bold dark:border-rose/25 dark:bg-white/10 dark:text-milk">🔗 Ajak teman</button>
          </div>
          {shareMsg && <p role="status" className="mt-2 text-xs font-bold text-gold">{shareMsg}</p>}
        </section>
      )}
    </main>
  )
}
