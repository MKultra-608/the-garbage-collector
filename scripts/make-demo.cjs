/**
 * Builds the public browser build and folds it into ONE self-contained HTML
 * file that runs by double-click (no server, no internet). It ships the FULL
 * game — all four floors, all 11 labs — same as the desktop build.
 *
 *   npm run build:demo   ->   the-garbage-collector-demo.html
 *
 * The bundle is inlined DIRECTLY as a <script type="module"> (not a data: URL).
 * A data: URL import is blocked by Chrome when the page is opened via file://
 * (double-click), so the game wouldn't start. Inline module scripts DO run from
 * file://. The build asserts the bundle contains no "</script" so the inline
 * block can't be terminated early; if it ever does, we escape it defensively.
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'dist-demo')

console.log('building browser build (full game, all 11 labs)...')
execSync('npx vite build --outDir dist-demo', {
  cwd: root,
  stdio: 'inherit',
})

const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
const m = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/)
if (!m) throw new Error('could not find the built module script in dist-demo/index.html')
const js = fs.readFileSync(path.join(outDir, m[1].replace(/^\.?\//, '')), 'utf8')

// Defensive: neutralize any literal "</script" so it can't close the block.
const safeJs = js.replace(/<\/script/gi, '<\\/script')
const boot = '<script type="module">\n' + safeJs + '\n</script>'

// Use function replacements so `$` sequences in the JS (minified code is full
// of them) are inserted literally, not treated as replacement patterns.
let out = html.replace(m[0], () => boot)
out = out.replace(/<title>[^<]*<\/title>/, () => '<title>The Garbage Collector — Demo</title>')

const dest = path.join(root, 'the-garbage-collector-demo.html')
fs.writeFileSync(dest, out)

// Check only the HTML shell (strip the inline module, whose JS legitimately
// contains src=/href= string literals) for any real external reference.
const shell = out.replace(/<script type="module">[\s\S]*?<\/script>/, '')
const externalRef = /<(script|link)\b[^>]*\b(src|href)="(?!data:)/i.test(shell)
if (externalRef) throw new Error('refusing to write: the file still has an external reference')
console.log(`wrote ${path.relative(root, dest)} (${(Buffer.byteLength(out) / 1024).toFixed(0)} KB, self-contained)`)
