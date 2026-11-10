import { MEMBERS, DISPLAY_NAME, namesOf } from './gallery'

// Kuis "Tebak member" (fitur 11). Soal hanya dari FOTO SOLO (satu nama member di kolom idol),
// supaya jawabannya pasti satu orang.
export const ROUND = 10

export const quizPool = (items) =>
  items.filter((it) => it.type === 'photo' && namesOf(it).length === 1 && MEMBERS.includes(namesOf(it)[0]))

function shuffle(arr, rnd) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Satu ronde: n soal dari foto berbeda, tiap soal 4 pilihan (1 benar + 3 member lain, diacak).
export function makeRound(pool, n = ROUND, rnd = Math.random) {
  return shuffle(pool, rnd).slice(0, n).map((it) => {
    const answer = namesOf(it)[0]
    const others = shuffle(MEMBERS.filter((m) => m !== answer), rnd).slice(0, 3)
    return { it, answer, options: shuffle([answer, ...others], rnd) }
  })
}

export const nameOf = (key) => DISPLAY_NAME[key] || key

const BEST = 'h2h-quiz-best'
export const getBest = () => { try { return Number(localStorage.getItem(BEST)) || 0 } catch { return 0 } }
export function saveBest(score) {
  const best = Math.max(getBest(), score)
  try { localStorage.setItem(BEST, String(best)) } catch {}
  return best
}
