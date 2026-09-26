import './globals.css'
import Background from './components/Background'
import ConfettiHearts from './components/ConfettiHearts'
import TopBanner from './components/TopBanner'
export const metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  title: 'Hearts2Hearts Gallery',
  description: 'Koleksi foto & video idol Hearts2Hearts (H2H) — Jiwoo, Carmen, Yuha, Stella, Juun, A-na, Ian, dan Ye-on.',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF3F7' },
    { media: '(prefers-color-scheme: dark)', color: '#1B0F22' },
  ],
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
export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.theme==='dark'||(!('theme' in localStorage)&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
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
