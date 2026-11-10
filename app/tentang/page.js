import TentangClient from './TentangClient'

// Metadata server (judul awal & Open Graph) tetap bahasa Indonesia — dibaca crawler tanpa pilihan bahasa.
export const metadata = { title: 'Tentang · Hearts2Hearts Gallery' }

export default function Tentang() {
  return <TentangClient />
}
