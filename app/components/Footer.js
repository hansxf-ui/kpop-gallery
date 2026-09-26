import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-rose/30 dark:border-rose/15">
      <div className="mx-auto max-w-6xl px-4 py-10 text-center">
        <p className="text-gold text-xl" aria-hidden>✦ ✧ ✦</p>
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
