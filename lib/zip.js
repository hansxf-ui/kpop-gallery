// Penulis & pembaca ZIP kecil tanpa paket tambahan — dipakai cadangan lengkap di admin.
//
// Menulis: metode "store" (tanpa kompresi). Foto JPEG/video sudah terkompres, jadi kompresi ZIP
// hampir tidak menghemat apa-apa dan hanya memperlambat HP.
// Membaca: "store" dan "deflate" (pakai DecompressionStream bawaan browser), jadi ZIP yang
// dibuka lalu dibungkus ulang oleh Windows/macOS tetap bisa dipulihkan.
// Tanpa ZIP64: satu file ZIP harus di bawah 4 GB dan 65.535 isi. Cadangan dipecah per bagian
// jauh di bawah batas itu (lihat PART_BYTES di AdminBackup).

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

export function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const enc = new TextEncoder()
const dec = new TextDecoder()

function dosTime(d) {
  const year = Math.max(1980, d.getFullYear())
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  }
}

export const MAX_ZIP_BYTES = 0xfffffffe
export const MAX_ZIP_ENTRIES = 0xfffe

export class ZipWriter {
  constructor() {
    this.parts = []
    this.central = []
    this.offset = 0
    this.cenSize = 0
    this.count = 0
  }

  // Perkiraan ukuran ZIP kalau `n` byte dengan nama `name` ditambahkan.
  sizeWith(name, n) {
    const nl = enc.encode(name).length
    return this.offset + 30 + nl + n + this.cenSize + 46 + nl + 22
  }

  add(name, data, when = new Date()) {
    const bytes = typeof data === 'string' ? enc.encode(data) : data
    const nameBytes = enc.encode(name)
    if (this.count >= MAX_ZIP_ENTRIES || this.sizeWith(name, bytes.length) > MAX_ZIP_BYTES) throw new Error('ZIP terlalu besar')
    const crc = crc32(bytes)
    const { time, date } = dosTime(when)

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true) // versi minimal
    local.setUint16(6, 0x0800, true) // nama berkode UTF-8
    local.setUint16(8, 0, true) // store
    local.setUint16(10, time, true)
    local.setUint16(12, date, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, bytes.length, true)
    local.setUint32(22, bytes.length, true)
    local.setUint16(26, nameBytes.length, true)
    local.setUint16(28, 0, true)

    const cen = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(cen.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, time, true)
    cv.setUint16(14, date, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, bytes.length, true)
    cv.setUint32(24, bytes.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint32(42, this.offset, true)
    cen.set(nameBytes, 46)

    this.parts.push(new Uint8Array(local.buffer), nameBytes, bytes)
    this.central.push(cen)
    this.cenSize += cen.length
    this.offset += 30 + nameBytes.length + bytes.length
    this.count++
  }

  blob() {
    const cenSize = this.cenSize
    const end = new DataView(new ArrayBuffer(22))
    end.setUint32(0, 0x06054b50, true)
    end.setUint16(8, this.count, true)
    end.setUint16(10, this.count, true)
    end.setUint32(12, cenSize, true)
    end.setUint32(16, this.offset, true)
    return new Blob([...this.parts, ...this.central, new Uint8Array(end.buffer)], { type: 'application/zip' })
  }
}

const u8 = async (blob) => new Uint8Array(await blob.arrayBuffer())

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') throw new Error('Browser ini tidak bisa membuka ZIP terkompresi')
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// Baca daftar isi ZIP tanpa memuat seluruh file ke memori (hanya bagian yang diminta).
// Hasil: Map nama → { size, read(): Promise<Uint8Array> }.
export async function readZip(blob) {
  const tailLen = Math.min(blob.size, 22 + 0xffff)
  const tail = await u8(blob.slice(blob.size - tailLen))
  let e = -1
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 0x05 && tail[i + 3] === 0x06) { e = i; break }
  }
  if (e < 0) throw new Error('Bukan file ZIP')
  const ev = new DataView(tail.buffer, tail.byteOffset + e)
  const count = ev.getUint16(10, true)
  const cenSize = ev.getUint32(12, true)
  const cenOff = ev.getUint32(16, true)
  if (cenOff === 0xffffffff || count === 0xffff) throw new Error('ZIP64 tidak didukung')

  const cen = await u8(blob.slice(cenOff, cenOff + cenSize))
  const cv = new DataView(cen.buffer, cen.byteOffset, cen.byteLength)
  const out = new Map()
  let p = 0
  for (let n = 0; n < count; n++) {
    if (cv.getUint32(p, true) !== 0x02014b50) throw new Error('ZIP rusak')
    const flags = cv.getUint16(p + 8, true)
    const method = cv.getUint16(p + 10, true)
    const crc = cv.getUint32(p + 16, true)
    const csize = cv.getUint32(p + 20, true)
    const size = cv.getUint32(p + 24, true)
    const nl = cv.getUint16(p + 28, true)
    const xl = cv.getUint16(p + 30, true)
    const cl = cv.getUint16(p + 32, true)
    const local = cv.getUint32(p + 42, true)
    const name = dec.decode(cen.subarray(p + 46, p + 46 + nl))
    p += 46 + nl + xl + cl
    if (name.endsWith('/')) continue // folder
    if (flags & 1) throw new Error('ZIP berpassword tidak didukung')
    out.set(name, {
      size,
      async read() {
        const lh = new DataView((await u8(blob.slice(local, local + 30))).buffer)
        if (lh.getUint32(0, true) !== 0x04034b50) throw new Error('ZIP rusak')
        const start = local + 30 + lh.getUint16(26, true) + lh.getUint16(28, true)
        const raw = await u8(blob.slice(start, start + csize))
        let data
        if (method === 0) data = raw
        else if (method === 8) data = await inflateRaw(raw)
        else throw new Error(`Metode kompresi ZIP ${method} tidak didukung`)
        if (crc32(data) !== crc) throw new Error(`Isi rusak: ${name}`)
        return data
      },
    })
  }
  return out
}
