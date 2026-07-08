/**
 * Generates electron/icon.ico (256x256) with no image libraries — draws the
 * game's own trash-pile sprite, upscaled, inside a CRT-green terminal frame.
 * PNG is hand-encoded (zlib) and wrapped in a PNG-in-ICO container.
 */
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

// ---- PNG encode ----
function crc32(buf) {
  let c = ~0 >>> 0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return (~c) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(h * (1 + w * 4))
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0
    rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}
function pngToIco(png) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // count
  const entry = Buffer.alloc(16)
  entry[0] = 0 // width 0 => 256
  entry[1] = 0 // height 0 => 256
  entry.writeUInt16LE(1, 4) // planes
  entry.writeUInt16LE(32, 6) // bpp
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(22, 12) // offset (6 + 16)
  return Buffer.concat([header, entry, png])
}

// ---- draw ----
const W = 256
const img = Buffer.alloc(W * W * 4)
const px = (x, y, c) => {
  if (x < 0 || y < 0 || x >= W || y >= W) return
  const o = (y * W + x) * 4
  img[o] = c[0]
  img[o + 1] = c[1]
  img[o + 2] = c[2]
  img[o + 3] = c.length > 3 ? c[3] : 255
}
const rect = (x, y, w, h, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c)
}

const OUTER = [13, 13, 16] // #0d0d10
const PANEL = [21, 23, 29] // #15171d
const CRT = [57, 255, 156] // #39ff9c
const COL = {
  k: [154, 160, 168], // outline (gray4)
  b: [46, 49, 56], // bag body (gray1)
  g: [74, 78, 87], // bag shade (gray2)
  p: [217, 212, 195], // paper
  d: [168, 164, 148], // paperDim
}

rect(0, 0, W, W, OUTER)
rect(8, 8, W - 16, W - 16, CRT) // frame
rect(12, 12, W - 24, W - 24, PANEL) // inner panel

// The game's trash-pile sprite (src/art/sprites.ts, TRASH_PILE).
const SPR = [
  '................',
  '................',
  '......kkk.......',
  '.....kgggk......',
  '....kbbbbbk.....',
  '...kbbbbbbbk....',
  '..kbbgbbbbbbk...',
  '..kbbbbbbgbbk...',
  '.kbbbbpbbbbbbk..',
  '.kbgbbbbbbbgbk..',
  '.kbbbbbbdbbbbk..',
  '.kpbbgbbbbbbdk..',
  '.kbbbbbbbbbbbk..',
  '..kkbbbbbbbkk...',
  '..d.kkkkkkk.p...',
  '................',
]
const S = 12
const off = Math.round((W - 16 * S) / 2)
for (let y = 0; y < 16; y++) {
  for (let x = 0; x < 16; x++) {
    const ch = SPR[y][x]
    if (ch === '.' || !COL[ch]) continue
    rect(off + x * S, off + y * S, S, S, COL[ch])
  }
}

const png = encodePNG(W, W, img)
const ico = pngToIco(png)
const dest = path.resolve(__dirname, '..', 'electron', 'icon.ico')
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.writeFileSync(dest, ico)
fs.writeFileSync(path.resolve(__dirname, '..', 'electron', 'icon.png'), png)

// sanity
const okPng = png.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
const okIco = ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) === 1
console.log(`icon.ico ${(ico.length / 1024).toFixed(1)} KB  png-ok=${okPng} ico-ok=${okIco}`)
if (!okPng || !okIco) process.exit(1)
