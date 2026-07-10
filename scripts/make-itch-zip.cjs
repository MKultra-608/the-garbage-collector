/**
 * Builds the itch.io HTML5 demo bundle: dist-demo/ (index.html + assets/) zipped
 * with FORWARD-SLASH entry paths at the archive root.
 *
 *   npm run build:itch   ->   itch-demo.zip
 *
 * Why a custom zipper: Windows PowerShell 5.1's Compress-Archive writes BACKSLASH
 * path separators into the zip. itch.io then stores "assets\index.js" as a single
 * literally-named file instead of an assets/ folder, so index.html's
 * <script src="./assets/index.js"> 404s and the game is a black screen. This
 * pure-Node store-only zipper always emits "assets/index.js", so the bundle works
 * on itch's CDN regardless of the host OS.
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'dist-demo')

console.log('building itch demo (GC_DEMO=1, floors capped at 1)...')
execSync('npx vite build --outDir dist-demo', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, GC_DEMO: '1' },
})

// Collect entries as { name (forward-slash, archive-relative), data }.
const entries = []
function walk(dir, prefix) {
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name)
    const rel = prefix ? prefix + '/' + name : name
    if (fs.statSync(full).isDirectory()) walk(full, rel)
    else entries.push({ name: rel, data: fs.readFileSync(full) })
  }
}
walk(outDir, '')
if (!entries.some((e) => e.name === 'index.html')) {
  throw new Error('dist-demo has no index.html at its root')
}

// --- Minimal store-only (no compression) zip writer, forward slashes only. ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const locals = []
const central = []
let offset = 0
for (const e of entries) {
  const nameBuf = Buffer.from(e.name, 'utf8') // pure-ASCII paths here
  const crc = crc32(e.data)
  const size = e.data.length

  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4) // version needed
  local.writeUInt16LE(0, 6) // flags
  local.writeUInt16LE(0, 8) // method: store
  local.writeUInt16LE(0, 10) // mod time
  local.writeUInt16LE(0x21, 12) // mod date (1980-01-01)
  local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(size, 18) // compressed size
  local.writeUInt32LE(size, 22) // uncompressed size
  local.writeUInt16LE(nameBuf.length, 26)
  local.writeUInt16LE(0, 28) // extra length
  locals.push(local, nameBuf, e.data)

  const cen = Buffer.alloc(46)
  cen.writeUInt32LE(0x02014b50, 0)
  cen.writeUInt16LE(20, 4) // version made by
  cen.writeUInt16LE(20, 6) // version needed
  cen.writeUInt16LE(0, 8) // flags
  cen.writeUInt16LE(0, 10) // method
  cen.writeUInt16LE(0, 12) // mod time
  cen.writeUInt16LE(0x21, 14) // mod date
  cen.writeUInt32LE(crc, 16)
  cen.writeUInt32LE(size, 20)
  cen.writeUInt32LE(size, 24)
  cen.writeUInt16LE(nameBuf.length, 28)
  cen.writeUInt16LE(0, 30) // extra
  cen.writeUInt16LE(0, 32) // comment
  cen.writeUInt16LE(0, 34) // disk number
  cen.writeUInt16LE(0, 36) // internal attrs
  cen.writeUInt32LE(0, 38) // external attrs
  cen.writeUInt32LE(offset, 42) // local header offset
  central.push(cen, nameBuf)

  offset += local.length + nameBuf.length + e.data.length
}

const centralBuf = Buffer.concat(central)
const localBuf = Buffer.concat(locals)
const eocd = Buffer.alloc(22)
eocd.writeUInt32LE(0x06054b50, 0)
eocd.writeUInt16LE(0, 4) // disk
eocd.writeUInt16LE(0, 6) // disk w/ central
eocd.writeUInt16LE(entries.length, 8)
eocd.writeUInt16LE(entries.length, 10)
eocd.writeUInt32LE(centralBuf.length, 12)
eocd.writeUInt32LE(localBuf.length, 16) // central dir offset
eocd.writeUInt16LE(0, 20) // comment length

const zip = Buffer.concat([localBuf, centralBuf, eocd])
const dest = path.join(root, 'itch-demo.zip')
fs.writeFileSync(dest, zip)

// Assert every stored path uses forward slashes (guards against regressions).
for (const e of entries) {
  if (e.name.includes('\\')) throw new Error(`backslash in entry: ${e.name}`)
}
console.log(
  `wrote ${path.relative(root, dest)} (${entries.length} entries, ${(zip.length / 1024).toFixed(1)} KB): ` +
    entries.map((e) => e.name).join(', ')
)
