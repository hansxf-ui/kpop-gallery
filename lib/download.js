// Unduh Blob sebagai file. URL objek dicabut SETELAH jeda: Safari/iOS memulai unduhan secara
// asinkron, jadi mencabutnya langsung sesudah click() membuat unduhan gagal atau kosong.
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
