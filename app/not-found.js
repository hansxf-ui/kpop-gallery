import ThemeToggle from './components/ThemeToggle'
import SiteNav from './components/SiteNav'
import NotFoundContent from './components/NotFoundContent'

export const metadata = { title: 'Tidak Ditemukan · Hearts2Hearts Gallery' }

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 page-fade-in">
      <ThemeToggle />
      <SiteNav className="pt-16" />
      <NotFoundContent />
    </main>
  )
}
