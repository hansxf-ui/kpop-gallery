import LihatClient from './LihatClient'

// Isi album dibaca di browser dari ?kode= — metadata server umum (bahasa Indonesia).
export const metadata = {
  title: 'Album bersama · Hearts2Hearts Gallery',
  description: 'Koleksi foto Hearts2Hearts yang dibagikan penggemar lewat Hearts2Hearts Gallery.',
}

export default function Lihat() {
  return <LihatClient />
}
