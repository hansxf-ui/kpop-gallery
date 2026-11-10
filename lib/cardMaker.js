// Pembuat gambar di browser: wallpaper HP dan photocard (fitur 7). Keduanya memakai
// pemuat gambar dan potong "cover" yang sama.

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // storage Supabase mengirim header CORS — kanvas tidak "tercemar"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Gambar img menutupi kotak (x, y, w, h) tanpa gepeng. fy = titik fokus vertikal (0 atas … 1 bawah).
export function drawCover(ctx, img, x, y, w, h, fy = 0.5) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale, sh = h / scale
  const sx = (img.width - sw) / 2
  const sy = Math.min(Math.max(0, (img.height - sh) * fy), img.height - sh)
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

const toBlob = (canvas, type, q) => new Promise((resolve, reject) =>
  canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('kosong'))), type, q))

export async function makeWallpaperBlob(src) {
  const img = await loadImage(src)
  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#173A56'); g.addColorStop(1, '#0D1D31')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  drawCover(ctx, img, 0, 0, W, H)
  return toBlob(canvas, 'image/jpeg', 0.95)
}

// Hati (ornamen hati ganda situs): titik (x, y) = tengah atas, s = lebar.
function heart(ctx, x, y, s, color) {
  ctx.save()
  ctx.translate(x - s / 2, y)
  ctx.scale(s / 24, s / 24)
  ctx.fillStyle = color
  ctx.fill(new Path2D('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'))
  ctx.restore()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Font situs dari next/font (nama keluarga diacak saat build) — dibaca dari variabel CSS.
function siteFont(varName, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
    return v ? `${v}, ${fallback}` : fallback
  } catch { return fallback }
}

// Photocard ala PC K-pop: rasio 55 × 85 mm, bingkai putih membulat, nama member + hati ganda.
// Digambar di kotak (x, y) selebar W (tinggi = W × 1700/1100); semua ukuran diskalakan dari W.
function drawPhotocard(ctx, img, { x = 0, y = 0, W = 1100, name, sub }) {
  const k = W / 1100
  const H = 1700 * k, R = 70 * k, PAD = 46 * k, FOOT = 230 * k
  ctx.save()
  ctx.translate(x, y)
  roundRect(ctx, 0, 0, W, H, R)
  ctx.save(); ctx.clip()
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(1, '#F5FAFE')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // Foto
  roundRect(ctx, PAD, PAD, W - PAD * 2, H - PAD - FOOT, R - PAD / 2)
  ctx.save(); ctx.clip()
  drawCover(ctx, img, PAD, PAD, W - PAD * 2, H - PAD - FOOT, 0.25)
  ctx.restore()

  // Garis tipis pink seperti outline kartu galeri
  ctx.strokeStyle = 'rgba(234,147,187,.55)'; ctx.lineWidth = 4 * k
  roundRect(ctx, 14 * k, 14 * k, W - 28 * k, H - 28 * k, R - 12 * k); ctx.stroke()

  // Nama + baris kecil
  const display = siteFont('--font-display', '"Playfair Display", Georgia, serif')
  const body = siteFont('--font-body', 'Quicksand, system-ui, sans-serif')
  const footY = H - FOOT
  ctx.fillStyle = '#173A56'
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  let size = 96 * k
  ctx.font = `600 ${size}px ${display}`
  while (ctx.measureText(name).width > W - PAD * 2 - 170 * k && size > 40 * k) { size -= 4 * k; ctx.font = `600 ${size}px ${display}` }
  ctx.fillText(name, PAD + 8 * k, footY + 120 * k)
  ctx.font = `700 ${34 * k}px ${body}`
  ctx.fillStyle = 'rgba(23,58,86,.55)'
  ctx.fillText(sub ? `HEARTS2HEARTS · ${sub.toUpperCase()}` : 'HEARTS2HEARTS', PAD + 10 * k, footY + 178 * k)

  // Hati ganda di kanan bawah (pink + biru langit, seperti logo situs)
  heart(ctx, W - PAD - 92 * k, footY + 52 * k, 96 * k, '#7FC4E8')
  heart(ctx, W - PAD - 52 * k, footY + 86 * k, 96 * k, '#EA93BB')
  ctx.restore()
  ctx.restore()
}

// Hasil PNG (sudut transparan). `name` = nama tampil member, `sub` = baris kecil (mis. era).
export async function makePhotocardBlob(src, { name, sub }) {
  const [img] = await Promise.all([loadImage(src), document.fonts ? document.fonts.ready : null])
  const canvas = document.createElement('canvas')
  canvas.width = 1100; canvas.height = 1700
  drawPhotocard(canvas.getContext('2d'), img, { name, sub })
  return toBlob(canvas, 'image/png')
}

// Fitur 6: kartu ulang tahun ukuran Story (1080 × 1920, 9:16) — photocard di tengah, ucapan di atas,
// tanggal di bawah. `title` & `date` sudah diterjemahkan oleh pemanggil.
export async function makeBirthdayStoryBlob(src, { name, title, date, footer }) {
  const [img] = await Promise.all([loadImage(src), document.fonts ? document.fonts.ready : null])
  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#F6DCE9'); bg.addColorStop(0.5, '#F5FAFE'); bg.addColorStop(1, '#D6ECFA')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  // Hati-hati kecil sebagai hiasan (posisi tetap, tidak acak — hasil sama tiap dibuat)
  const dots = [[90, 160, 60, '#EA93BB'], [960, 240, 70, '#7FC4E8'], [140, 1700, 80, '#7FC4E8'], [940, 1760, 60, '#EA93BB'], [990, 980, 44, '#EA93BB'], [70, 1020, 44, '#7FC4E8']]
  ctx.globalAlpha = 0.55
  for (const [x, y, s, c] of dots) heart(ctx, x, y, s, c)
  ctx.globalAlpha = 1

  const display = siteFont('--font-display', '"Playfair Display", Georgia, serif')
  const body = siteFont('--font-body', 'Quicksand, system-ui, sans-serif')
  ctx.textAlign = 'center'
  ctx.fillStyle = '#173A56'
  let size = 84
  ctx.font = `600 ${size}px ${display}`
  while (ctx.measureText(title).width > W - 120 && size > 44) { size -= 4; ctx.font = `600 ${size}px ${display}` }
  ctx.fillText(title, W / 2, 230)
  ctx.font = `700 40px ${body}`
  ctx.fillStyle = '#EA93BB'
  ctx.fillText(date, W / 2, 300)

  const cardW = 820
  drawPhotocard(ctx, img, { x: (W - cardW) / 2, y: 380, W: cardW, name, sub: 'Happy Birthday' })

  ctx.textAlign = 'center'
  ctx.font = `700 30px ${body}`
  ctx.fillStyle = 'rgba(23,58,86,.6)'
  if (footer) ctx.fillText(footer, W / 2, H - 70)
  return toBlob(canvas, 'image/png')
}
