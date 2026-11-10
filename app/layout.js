import './globals.css'
import Background from './components/Background'
import ConfettiHearts from './components/ConfettiHearts'
import TopBanner from './components/TopBanner'

const SITE_URL = 'https://kpop-gallery-coral.vercel.app'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

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
    <html lang="id">
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.theme==='dark'||(!('theme' in localStorage)&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* File font ada di fonts.gstatic.com — tanpa preconnect ini koneksinya baru dibuka setelah CSS font selesai. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Semua foto galeri dimuat dari storage Supabase — buka koneksinya lebih awal. */}
        {SUPABASE_URL && <link rel="preconnect" href={SUPABASE_URL} crossOrigin="" />}
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,600&family=Quicksand:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <TopBanner />
        <Background />
        <ConfettiHearts />
        {children}
      </body>
    </html>
  )
}
