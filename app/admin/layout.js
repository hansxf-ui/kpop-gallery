// Halaman admin tidak perlu muncul di hasil mesin pencari.
export const metadata = {
  title: 'Admin · Hearts2Hearts Gallery',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }) {
  return children
}
