import HariIniClient from './HariIniClient'

// Metadata server tetap bahasa Indonesia (SEO); isi dihitung di klien sesuai tanggal pengunjung.
export const metadata = {
  title: 'Hari ini di H2H · Hearts2Hearts Gallery',
  description: 'Hitung mundur, acara hari ini, voting yang sedang buka, dan foto kenangan hari ini dari Hearts2Hearts Gallery.',
}

export default function HariIni() {
  return <HariIniClient />
}
