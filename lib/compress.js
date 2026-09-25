// Kompres foto di HP sebelum diupload: perbesar dimensi diturunkan kalau memang
// terlalu besar (kamera HP sering 3000-4000px), tapi kualitas JPEG dijaga tinggi
// (92%) supaya hasil tetap tajam — hanya ukuran filenya yang mengecil.
const MAX_DIMENSION = 2400
const QUALITY = 0.92

export async function compressImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))

  // Kalau gambar sudah cukup kecil, jangan diapa-apakan — hindari kompres ulang yang sia-sia
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
  if (!blob || blob.size >= file.size) return file

  const name = file.name.replace(/\.\w+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg' })
}
