import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-rose/30 dark:border-rose/15">
      <div className="mx-auto max-w-6xl px-4 py-10 text-center">
        <p className="flex justify-center items-center" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" className="text-rose" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          <svg width="22" height="22" viewBox="0 0 24 24" className="text-gold -ml-2 mt-2" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
        </p>
        <p className="font-display text-2xl text-plum dark:text-milk mt-2">Hearts2Hearts Gallery</p>
        <nav className="mt-4 flex justify-center gap-6 text-sm font-bold text-plum/70 dark:text-milk/70">
          <Link href="/" className="hover:text-gold">Beranda</Link>
          <Link href="/favorit" className="hover:text-gold">Favoritku</Link>
          <Link href="/tentang" className="hover:text-gold">Tentang</Link>
        </nav>
        <p className="mt-5 text-xs leading-relaxed text-plum/50 dark:text-milk/50 max-w-xl mx-auto">
          Situs fan-made oleh penggemar, tidak berafiliasi dengan SM Entertainment maupun Hearts2Hearts.
          Hak cipta foto dan video tetap milik pemilik aslinya.
        </p>
        <p className="mt-3 text-xs text-plum/40 dark:text-milk/40">
          © 2026 Hearts2Hearts Gallery · Dibuat dengan ♥ untuk S2U
        </p>
      </div>
    </footer>
  )
}
