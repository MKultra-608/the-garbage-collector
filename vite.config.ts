import { defineConfig } from 'vite'

// GC_DEMO=1 builds the public demo: only floors up to __DEMO_MAX_FLOOR__ are
// elevator-reachable (Floors 0-1). Floor 2+ content stays in the bundle but
// is gated out of FLOORS, so the demo ends after the mailroom.
const demo = process.env.GC_DEMO === '1'

export default defineConfig({
  base: './',
  server: { port: 5178, strictPort: true },
  define: {
    __DEMO__: JSON.stringify(demo),
    __DEMO_MAX_FLOOR__: JSON.stringify(demo ? 1 : 999),
  },
})
