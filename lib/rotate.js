// Putar file gambar 90/180/270 derajat di kanvas sebelum diupload, tanpa mengubah kualitas.
export async function rotateImageFile(file, degrees) {
  if (!degrees) return file
  const bitmap = await createImageBitmap(file)
  const swap = degrees === 90 || degrees === 270
  const canvas = document.createElement('canvas')
  canvas.width = swap ? bitmap.height : bitmap.width
  canvas.height = swap ? bitmap.width : bitmap.height
  const ctx = canvas.getContext('2d')
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.95))
  return new File([blob], file.name, { type: blob.type })
}
