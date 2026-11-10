import { sb, ytId, imgOpt } from '../../lib/supabase'
import { parseGaleriQuery } from '../../lib/galeriUrl'
import GaleriClient from './GaleriClient'

const BASE_TITLE = 'Galeri · Hearts2Hearts Gallery'

// Ambil satu item untuk preview link. Dibatasi 2,5 detik supaya halaman tidak ikut lambat
// kalau database sedang lambat — kalau gagal, preview jatuh ke preview umum situs.
async function ambilItem(id) {
  try {
    const { data } = await sb
      .from('items')
      .select('id, title, idol, type, url, era')
      .eq('id', id)
      .abortSignal(AbortSignal.timeout(2500))
      .maybeSingle()
    return data || null
  } catch {
    return null
  }
}

function gambarOg(it) {
  const alt = it.title || it.idol || 'Hearts2Hearts'
  if (it.type === 'photo') return { url: imgOpt(it.url, 1200, 75), alt }
  if (it.type === 'youtube') {
    const id = ytId(it.url)
    if (id) return { url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360, alt }
  }
  return null // video upload tidak punya gambar diam — pakai og-image bawaan situs
}

// Preview Open Graph per item: link /galeri?item=<id> yang dibagikan ke WhatsApp/X/dll
// menampilkan foto + judul item itu, bukan preview umum situs.
export async function generateMetadata({ searchParams }) {
  const { item } = parseGaleriQuery(new URLSearchParams(searchParams || {}))
  if (!item) return { title: BASE_TITLE }
  const it = await ambilItem(item)
  if (!it) return { title: BASE_TITLE }

  const title = `${it.title || it.idol || 'Hearts2Hearts'} · Hearts2Hearts Gallery`
  const description = `${it.type === 'photo' ? 'Foto' : 'Video'} ${it.idol || 'Hearts2Hearts'}${it.era ? ` · era ${it.era}` : ''} di Hearts2Hearts Gallery.`
  const img = gambarOg(it)
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', url: `/galeri?item=${it.id}`, images: [img || '/og-image.png'] },
    twitter: { card: 'summary_large_image', title, description, images: [img ? img.url : '/og-image.png'] },
  }
}

export default function GaleriPage() {
  return <GaleriClient />
}
