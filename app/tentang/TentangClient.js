'use client'
import Link from 'next/link'
import ThemeToggle from '../components/ThemeToggle'
import SiteNav from '../components/SiteNav'
import { RELEASES, labelRilis } from '../../lib/eras'
import { useT, useLang, useDocTitle } from '../../lib/i18n'
import FandomStats from '../components/FandomStats'
import CreditsSection from '../components/CreditsSection'

// Isi halaman Tentang. Teks Indonesia = kunci kamus lib/i18n-en-data.js.
// Posisi member memang istilah bahasa Inggris (Main Vocal, Leader, …) — tidak diterjemahkan.

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


const h2 = 'font-display text-3xl text-plum dark:text-milk mb-4'
const p = 'leading-relaxed text-plum/80 dark:text-milk/80 max-w-prose'

export default function TentangClient() {
  const t = useT()
  const { lang } = useLang()
  useDocTitle('Tentang')
  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 page-fade-in">
      <ThemeToggle />
      <header className="pt-16 pb-14 text-center">
        <SiteNav className="mb-8" />
        <p className="flex justify-center items-center" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-rose" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-gold -ml-3 mt-2.5" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </p>
        <h1 className="font-display text-5xl sm:text-6xl text-plum dark:text-milk mt-2">{t('Tentang')}</h1>
      </header>

      <section className="mb-14">
        <h2 className={h2}>Hearts2Hearts</h2>
        <p className={p}>
          {t('Hearts2Hearts (disingkat H2H) adalah girl group asal Korea Selatan bentukan SM Entertainment dengan delapan member.')}{' '}
          {t('Mereka debut pada 24 Februari 2025 lewat single album')} <i>The Chase</i>{t(', dan jadi girl group baru pertama SM sejak aespa pada 2020.')}
        </p>
        <p className={`${p} mt-3`}>
          {t('Nama grupnya berarti terhubung dengan penggemar di seluruh dunia lewat dunia musik yang misterius, penuh emosi dan pesan dari hati, lalu melangkah bersama menjadi "kita" yang lebih besar.')}{' '}
          {t('Angka "2" dan huruf "S" di sana juga mengingatkan pada emotikon hati.')}{' '}
          {t('Fandom mereka bernama S2U.')}
        </p>
      </section>

      <section className="mb-14">
        <h2 className={h2}>{t('Member')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {members.map(([n, r]) => (
            <div key={n} className="card px-3 pt-4 text-center" style={{ paddingBottom: 16 }}>
              <p className="font-display text-xl text-plum dark:text-milk">{n}</p>
              <p className="text-xs text-gold font-bold mt-1">{r}</p>
            </div>
          ))}
        </div>
        <p className={`${p} mt-5`}>
          {t('Carmen berasal dari Denpasar, Bali, dan tercatat sebagai idol Indonesia pertama yang debut di SM Entertainment.')}{' '}
          {t('Stella lahir di Vancouver, Kanada, dan berdarah Korea.')}
        </p>
      </section>

      <section className="mb-14">
        <h2 className={h2}>{t('Perjalanan rilisan')}</h2>
        <ol className="space-y-3">
          {RELEASES.map((r) => (
            <li key={r.nama} className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 border-b border-rose/30 dark:border-rose/15 pb-3">
              <span className="w-20 shrink-0 text-sm font-bold text-gold">{labelRilis(r, lang)}</span>
              <span className="font-bold text-plum dark:text-milk">{r.nama}</span>
              <span className="text-sm text-plum/60 dark:text-milk/60">{t(r.jenis)}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-plum/50 dark:text-milk/50 mt-3">{t('Data per September 2026. Bisa jadi sudah ada rilisan terbaru.')}</p>
        <p className="mt-3"><Link href="/linimasa" className="text-sm font-bold text-gold underline underline-offset-4">{t('Lihat koleksi galeri per era di Linimasa →')}</Link></p>
        <p className="text-xs text-plum/50 dark:text-milk/50 mt-1">{t('Tandai foto/video dengan nama era (mis. "Focus") lewat halaman admin, supaya bisa difilter per era di galeri.')}</p>
      </section>

      <section>
        <FandomStats className="mb-10" />
        <h2 className={h2}>{t('Tentang website ini')}</h2>
        <p className={p}>
          {t('Hearts2Hearts Gallery adalah tempat menyimpan koleksi foto dan video favorit, dibuat oleh seorang penggemar untuk dinikmati santai.')}{' '}
          {t('Kamu bisa membuka album tiap idol, mencari dan mengurutkan koleksi, menyimpan favorit, memutar slideshow, dan mengganti ke mode gelap.')}
        </p>
        <p className={`${p} mt-3`}>
          {t('Situs ini dibuat oleh penggemar dan tidak berafiliasi dengan SM Entertainment maupun Hearts2Hearts.')}{' '}
          {t('Hak cipta foto dan video tetap milik pemilik aslinya. Daftar sumbernya ada di')} <a href="#kredit" className="font-bold text-gold underline underline-offset-4">{t('Kredit foto')}</a>.
        </p>
      </section>

      {/* Dulu halaman /kredit — sekarang /kredit dialihkan ke /tentang (next.config.js). */}
      <CreditsSection className="mt-14" />

      <p className="mt-8 text-center text-xs text-plum/40 dark:text-milk/40">
        © 2026 Hearts2Hearts Gallery · {t('Dibuat dengan ♥ untuk S2U')}
      </p>
    </main>
  )
}
