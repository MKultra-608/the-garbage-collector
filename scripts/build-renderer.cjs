/**
 * Builds the renderer (the game) for the desktop app and emits to dist/,
 * which electron/main.cjs loads with loadFile(). base:'./' (vite.config.ts)
 * keeps asset paths relative so it works from the packaged file:// location.
 *
 * The DOWNLOADABLE build ships the full game — all four floors, the complete
 * C-fundamentals curriculum (Labs 1-11). Only the itch.io browser demo is
 * capped (GC_DEMO=1 → Floors 0-1; see make-demo.cjs / make-itch-zip.cjs).
 */
const { execSync } = require('child_process')
const path = require('path')

const root = path.resolve(__dirname, '..')
console.log('building renderer (full game, Floors 0-3) -> dist/ ...')
execSync('npx vite build', {
  cwd: root,
  stdio: 'inherit',
})
console.log('renderer built.')
