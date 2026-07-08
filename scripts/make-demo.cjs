/**
 * Builds the public demo and folds it into ONE self-contained HTML file that
 * runs by double-click (no server, no internet). Floors are capped at Floor 1
 * via GC_DEMO=1 (see vite.config.ts / data/maps.ts).
 *
 *   npm run build:demo   ->   the-garbage-collector-demo.html
 *
 * The bundle is embedded as a base64 data-URI module so no part of it can be
 * mistaken by the HTML parser for a closing </script> tag.
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'dist-demo')

console.log('building demo (GC_DEMO=1, floors capped at 1)...')
execSync('npx vite build --outDir dist-demo', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, GC_DEMO: '1' },
})

const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
const m = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/)
if (!m) throw new Error('could not find the built module script in dist-demo/index.html')
const js = fs.readFileSync(path.join(outDir, m[1].replace(/^\.?\//, '')))

const b64 = js.toString('base64')
const boot =
  '<script type="module">\n' +
  `import("data:text/javascript;base64,${b64}")` +
  `.catch(function(e){document.body.innerHTML='<pre style=\\'color:#e8574a;padding:20px;font:12px monospace\\'>'+String(e&&e.stack||e)+'</pre>';});\n` +
  '</script>'

let out = html.replace(m[0], boot)
out = out.replace(/<title>[^<]*<\/title>/, '<title>The Garbage Collector — Demo</title>')

const dest = path.join(root, 'the-garbage-collector-demo.html')
fs.writeFileSync(dest, out)

const externalRef = /<(script|link)\b[^>]*\b(src|href)="(?!data:)/i.test(out)
if (externalRef) throw new Error('refusing to write: the file still has an external reference')
console.log(`wrote ${path.relative(root, dest)} (${(Buffer.byteLength(out) / 1024).toFixed(0)} KB, self-contained)`)
