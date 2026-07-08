/**
 * Builds the renderer (the game) for the desktop app. Uses the demo cap
 * (GC_DEMO=1 → Floors 0-1) and emits to dist/, which electron/main.cjs loads
 * with loadFile(). base:'./' (vite.config.ts) keeps asset paths relative so it
 * works from the packaged file:// location.
 */
const { execSync } = require('child_process')
const path = require('path')

const root = path.resolve(__dirname, '..')
console.log('building renderer (GC_DEMO=1, Floors 0-1) -> dist/ ...')
execSync('npx vite build', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, GC_DEMO: '1' },
})
console.log('renderer built.')
