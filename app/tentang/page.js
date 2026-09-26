import Link from 'next/link'
import ThemeToggle from '../components/ThemeToggle'

export const metadata = { title: 'Tentang · Hearts2Hearts Gallery' }

const members = [
  ['Jiwoo', 'Leader'],
  ['Carmen', 'Main Vocal'],
  ['Yuha', 'Main Vocal, Lead Dance'],
  ['Stella', 'Lead Vocal'],
  ['Juun', 'Main Dance, Main Rap'],
  ['A-na', 'Lead Rap, Visual'],
  ['Ian', 'Main Dance, Center'],
  ['Ye-on', 'Lead Vocal, Maknae'],
]

const releases = [
  ['Feb 2025', 'The Chase', 'Single album debut'],
  ['Jun 2025', 'Style', 'Single digital'],
  ['Sep 2025', 'Pretty Please', 'Pre-release Focus'],
  ['Okt 2025', 'Focus', 'Mini album pertama'],
  ['Feb 2026', 'RUDE!', 'Single digital'],
  ['Jun 2026', 'Lemon Tang', 'Mini album kedua'],
  ['2026', 'ICONIC HEART', 'Single album'],
]

const h2 = 'font-display text-3xl text-plum dark:text-milk mb-4'
const p = 'leading-relaxed text-plum/80 dark:text-milk/80 max-w-prose'

export default function Tentang() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 page-fade-in">
      <ThemeToggle />
      <header className="py-14 text-center">
        <Link href="/" className="text-sm font-bold text-plum/60 dark:text-milk/60 hover:text-plum dark:hover:text-milk">← Kembali ke galeri</Link>
        <p className="text-gold text-2xl mt-4" aria-hidden>✦ ✧ ✦</p>
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2">Tentang</h1>
      </header>

      <section className="mb-14">
        <h2 className={h2}>Hearts2Hearts</h2>
        <p className={p}>
          Hearts2Hearts (disingkat H2H) adalah girl group asal Korea Selatan bentukan SM Entertainment dengan delapan member.
          Mereka debut pada 24 Februari 2025 lewat single album <i>The Chase</i>, dan jadi girl group baru pertama SM sejak aespa pada 2020.
        </p>
        <p className={`${p} mt-3`}>
          Nama grupnya berarti terhubung dengan penggemar di seluruh dunia lewat dunia musik yang misterius, penuh emosi dan pesan dari hati,
          lalu melangkah bersama menjadi "kita" yang lebih besar. Angka "2" dan huruf "S" di sana juga mengingatkan pada emotikon hati.
          Fandom mereka bernama S2U.
        </p>
      </section>

      <section className="mb-14">
        <h2 className={h2}>Member</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {members.map(([n, r]) => (
            <div key={n} className="card px-3 pt-4 text-center" style={{ paddingBottom: 16 }}>
              <p className="font-display text-xl text-plum dark:text-milk">{n}</p>
              <p className="text-xs text-gold font-bold mt-1">{r}</p>
            </div>
          ))}
        </div>
        <p className={`${p} mt-5`}>
          Carmen berasal dari Denpasar, Bali, dan tercatat sebagai idol Indonesia pertama yang debut di SM Entertainment.
          Stella lahir di Vancouver, Kanada, dan berdarah Korea.
        </p>
      </section>

      <section className="mb-14">
        <h2 className={h2}>Perjalanan rilisan</h2>
        <ol className="space-y-3">
          {releases.map(([d, t, k]) => (
            <li key={t} className="flex items-baseline gap-4 border-b border-rose/30 dark:border-rose/15 pb-3">
              <span className="w-20 shrink-0 text-sm font-bold text-gold">{d}</span>
              <span className="font-bold text-plum dark:text-milk">{t}</span>
              <span className="text-sm text-plum/60 dark:text-milk/60">{k}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-plum/50 dark:text-milk/50 mt-3">Data per September 2026. Bisa jadi sudah ada rilisan terbaru.</p>
        <p className="text-xs text-plum/50 dark:text-milk/50 mt-1">Tandai foto/video dengan nama era (mis. "Focus") lewat halaman admin, supaya bisa difilter per era di galeri.</p>
      </section>

      <section>
        <h2 className={h2}>Tentang website ini</h2>
        <p className={p}>
          Hearts2Hearts Gallery adalah tempat menyimpan koleksi foto dan video favorit, dibuat oleh seorang penggemar untuk dinikmati santai.
          Kamu bisa membuka album tiap idol, mencari dan mengurutkan koleksi, menyimpan favorit, memutar slideshow, dan mengganti ke mode gelap.
        </p>
        <p className={`${p} mt-3`}>
          Situs ini dibuat oleh penggemar dan tidak berafiliasi dengan SM Entertainment maupun Hearts2Hearts.
          Hak cipta foto dan video tetap milik pemilik aslinya.
        </p>
      </section>
    </main>
  )
}
