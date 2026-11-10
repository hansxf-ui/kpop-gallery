// Bagikan link: pakai lembar bagikan bawaan HP kalau ada, kalau tidak salin ke clipboard.
// Mengembalikan pesan singkat untuk ditampilkan ke pengunjung (null = dibatalkan).
export async function shareOrCopy(url, title) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ url, title })
      return null
    } catch (e) {
      if (e && e.name === 'AbortError') return null // pengunjung menutup lembar bagikan
      // gagal karena alasan lain -> coba salin
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'Link disalin ✓'
  } catch {
    // Clipboard API diblokir (mis. bukan HTTPS / izin ditolak): cara lama lewat textarea.
    try {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok ? 'Link disalin ✓' : 'Gagal menyalin link'
    } catch {
      return 'Gagal menyalin link'
    }
  }
}
