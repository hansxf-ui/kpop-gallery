import './globals.css'
import { Playfair_Display, Quicksand } from 'next/font/google'
import Background from './components/Background'
import ConfettiHearts from './components/ConfettiHearts'
import TopBanner from './components/TopBanner'
import ServiceWorker from './components/ServiceWorker'

const SITE_URL = 'https://kpop-gallery-coral.vercel.app'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

// Font di-host sendiri lewat next/font (bawaan Next, diunduh saat build): tidak ada lagi CSS
// font dari fonts.googleapis.com yang memblokir tampilan pertama, dan ukuran fallback
// disesuaikan otomatis supaya teks tidak melompat saat font selesai dimuat.
const fontDisplay = Playfair_Display({ subsets: ['latin'], weight: ['600'], style: ['normal', 'italic'], display: 'swap', variable: '--font-display' })
const fontBody = Quicksand({ subsets: ['latin'], weight: ['500', '700'], display: 'swap', variable: '--font-body' })

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Hearts2Hearts Gallery',
  description: 'Koleksi foto & video idol Hearts2Hearts (H2H) — Jiwoo, Carmen, Yuha, Stella, Juun, A-na, Ian, dan Ye-on.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Hearts2Hearts Gallery',
    description: 'Koleksi foto & video idol Hearts2Hearts (H2H) favoritku.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hearts2Hearts Gallery',
    description: 'Koleksi foto & video idol Hearts2Hearts (H2H) favoritku.',
    images: ['/og-image.png'],
  },
}
// Next 14: themeColor tidak lagi diterima di `metadata` (muncul peringatan build) — pindah ke `viewport`.
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5FAFE' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1D31' },
  ],
}

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: skrip tema di <head> menambah kelas "dark" sebelum React aktif.
    <html lang="id" className={`${fontDisplay.variable} ${fontBody.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.theme==='dark'||(!('theme' in localStorage)&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}" }} />
        {/* Semua foto galeri dimuat dari storage Supabase — buka koneksinya lebih awal. */}
        {SUPABASE_URL && <link rel="preconnect" href={SUPABASE_URL} crossOrigin="" />}
      </head>
      <body>
        <TopBanner />
        <Background />
        <ConfettiHearts />
        <ServiceWorker />
        {children}
      </body>
    </html>
  )
}
