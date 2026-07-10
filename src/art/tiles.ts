import { PAL } from './palette.ts'

export const TILE = 16

/**
 * Map tiles are geometric, so they are drawn with code rather than string
 * art. Each tile id is a single char used directly in map grid strings
 * (see src/game/data/maps.ts). To add a tile: add a case here, pick chars
 * not already used, and set `solid` correctly.
 */
export interface TileSpec {
  canvas: HTMLCanvasElement
  solid: boolean
}

function make(draw: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = TILE
  c.height = TILE
  const g = c.getContext('2d')!
  draw(g)
  return c
}

function px(g: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  g.fillStyle = color
  g.fillRect(x, y, w, h)
}

const floorTile = make((g) => {
  px(g, PAL.gray1, 0, 0, 16, 16)
  px(g, PAL.dark, 0, 0, 16, 1) // seam
  px(g, PAL.dark, 0, 0, 1, 16)
  px(g, PAL.gray2, 4, 11, 1, 1) // speckle
  px(g, PAL.gray2, 11, 5, 1, 1)
  px(g, PAL.dark, 8, 13, 1, 1)
})

const carpetTile = make((g) => {
  px(g, PAL.carpet, 0, 0, 16, 16)
  for (let y = 0; y < 16; y += 2) {
    for (let x = (y / 2) % 2; x < 16; x += 4) px(g, PAL.carpetHi, x, y, 1, 1)
  }
})

const wallTile = make((g) => {
  px(g, PAL.wall, 0, 0, 16, 16)
  px(g, PAL.wallHi, 0, 0, 16, 3) // lit top edge
  px(g, PAL.gray1, 0, 15, 16, 1) // floor shadow
  px(g, PAL.gray2, 0, 3, 16, 1)
  px(g, PAL.gray2, 5, 4, 1, 11) // panel seams
  px(g, PAL.gray2, 11, 4, 1, 11)
})

const deskTile = make((g) => {
  px(g, PAL.gray1, 0, 0, 16, 16) // floor behind
  px(g, PAL.dark, 0, 0, 16, 1)
  px(g, PAL.black, 1, 2, 14, 12)
  px(g, PAL.deskHi, 2, 3, 12, 4) // desktop
  px(g, PAL.desk, 2, 7, 12, 6) // body
  px(g, PAL.dark, 4, 8, 3, 2) // drawer
  px(g, PAL.dark, 9, 8, 3, 2)
})

const terminalTile = make((g) => {
  px(g, PAL.gray1, 0, 0, 16, 16)
  px(g, PAL.dark, 0, 0, 16, 1)
  px(g, PAL.black, 2, 1, 12, 13)
  px(g, PAL.gray2, 3, 2, 10, 9) // monitor shell
  px(g, PAL.black, 4, 3, 8, 6) // screen
  px(g, PAL.crt, 5, 4, 4, 1) // code lines
  px(g, PAL.crtDim, 5, 6, 6, 1)
  px(g, PAL.crt, 5, 8, 2, 1)
  px(g, PAL.gray3, 5, 11, 6, 2) // keyboard ledge
})

const elevatorTile = make((g) => {
  px(g, PAL.wall, 0, 0, 16, 16)
  px(g, PAL.wallHi, 0, 0, 16, 2)
  px(g, PAL.gray4, 2, 3, 12, 12) // metal doors
  px(g, PAL.gray2, 2, 3, 12, 1)
  px(g, PAL.black, 7, 4, 2, 11) // door seam
  px(g, PAL.amber, 7, 2, 2, 1) // call light
})

const plantTile = make((g) => {
  px(g, PAL.gray1, 0, 0, 16, 16)
  px(g, PAL.dark, 0, 0, 16, 1)
  px(g, PAL.carpetHi, 4, 2, 8, 6) // leaves (a plant is not a creature; no head required)
  px(g, PAL.carpet, 5, 3, 3, 3)
  px(g, PAL.carpetHi, 6, 1, 4, 3)
  px(g, PAL.desk, 5, 8, 6, 5) // pot
  px(g, PAL.deskHi, 5, 8, 6, 1)
  px(g, PAL.black, 5, 13, 6, 1)
})

const coolerTile = make((g) => {
  px(g, PAL.gray1, 0, 0, 16, 16)
  px(g, PAL.dark, 0, 0, 16, 1)
  px(g, PAL.cyan, 5, 2, 6, 4) // bottle
  px(g, PAL.white, 6, 3, 1, 2)
  px(g, PAL.gray4, 4, 6, 8, 8) // body
  px(g, PAL.gray3, 4, 6, 8, 1)
  px(g, PAL.dark, 6, 9, 4, 2) // tap recess
})

const shelfTile = make((g) => {
  px(g, PAL.gray1, 0, 0, 16, 16)
  px(g, PAL.desk, 1, 1, 14, 13) // shelving unit
  px(g, PAL.deskHi, 1, 1, 14, 1)
  px(g, PAL.dark, 2, 4, 12, 1) // shelves
  px(g, PAL.dark, 2, 9, 12, 1)
  px(g, PAL.amber, 3, 2, 2, 2) // supplies
  px(g, PAL.cyan, 7, 2, 3, 2)
  px(g, PAL.gray4, 4, 6, 3, 3)
  px(g, PAL.paper, 9, 6, 4, 3)
  px(g, PAL.ooze, 3, 11, 2, 3)
  px(g, PAL.gray3, 8, 11, 4, 3)
})

const signTile = make((g) => {
  px(g, PAL.wall, 0, 0, 16, 16)
  px(g, PAL.wallHi, 0, 0, 16, 3)
  px(g, PAL.gray1, 0, 15, 16, 1)
  px(g, PAL.black, 2, 4, 12, 9)
  px(g, PAL.amber, 3, 5, 10, 7) // notice plate
  px(g, PAL.black, 4, 6, 8, 1)
  px(g, PAL.black, 4, 8, 6, 1)
  px(g, PAL.black, 4, 10, 8, 1)
})

// Mail pigeonholes — a wall of sorting cubbies. Floor 1 (mailroom) identity.
const pigeonholeTile = make((g) => {
  px(g, PAL.desk, 0, 0, 16, 16)
  px(g, PAL.deskHi, 0, 0, 16, 1)
  px(g, PAL.black, 0, 0, 1, 16)
  for (let cy = 1; cy < 16; cy += 5) {
    px(g, PAL.black, 0, cy, 16, 1) // shelf lines
    for (let cx = 1; cx < 16; cx += 5) {
      px(g, PAL.black, cx, cy, 1, 4) // cubby dividers
      px(g, PAL.dark, cx + 1, cy + 1, 3, 3) // cubby hollow
      if ((cx + cy) % 3 === 0) px(g, PAL.paper, cx + 1, cy + 1, 3, 2) // stray envelope
    }
  }
})

// Conveyor belt — walkable, decorative chevrons. Runs through the mailroom.
const conveyorTile = make((g) => {
  px(g, PAL.gray1, 0, 0, 16, 16)
  px(g, PAL.dark, 0, 0, 16, 1)
  px(g, PAL.dark, 0, 15, 16, 1)
  px(g, PAL.gray2, 0, 2, 16, 12) // belt
  px(g, PAL.gray3, 0, 2, 16, 1)
  for (let cx = 0; cx < 16; cx += 6) {
    // direction chevrons
    px(g, PAL.gray1, cx + 2, 5, 2, 2)
    px(g, PAL.gray1, cx + 4, 7, 2, 2)
    px(g, PAL.gray1, cx + 2, 9, 2, 2)
  }
})

// Filing cabinet — tall metal drawers. Floor 2 (archives) identity.
const cabinetTile = make((g) => {
  px(g, PAL.gray1, 0, 0, 16, 16)
  px(g, PAL.dark, 0, 0, 16, 1)
  px(g, PAL.gray4, 2, 1, 12, 14) // cabinet body
  px(g, PAL.gray3, 2, 1, 12, 1) // top highlight
  px(g, PAL.black, 2, 1, 1, 14) // left edge
  for (let dy = 2; dy < 15; dy += 4) {
    px(g, PAL.dark, 3, dy + 2, 10, 1) // drawer seam
    px(g, PAL.gray2, 6, dy, 4, 1) // drawer handle
    px(g, PAL.paper, 4, dy + 1, 2, 1) // little label
  }
})

// Archive box — a cardboard bankers box with a lid and a label.
const archiveBoxTile = make((g) => {
  px(g, PAL.gray1, 0, 0, 16, 16)
  px(g, PAL.dark, 0, 0, 16, 1)
  px(g, PAL.desk, 2, 4, 12, 11) // box body
  px(g, PAL.deskHi, 2, 3, 12, 2) // lid
  px(g, PAL.dark, 2, 4, 12, 1) // lid shadow
  px(g, PAL.paper, 5, 8, 6, 4) // label
  px(g, PAL.paperDim, 6, 9, 4, 1)
  px(g, PAL.paperDim, 6, 11, 4, 1)
  px(g, PAL.black, 2, 14, 12, 1)
})

// Cubicle partition — fabric-padded half wall. Floor 3 (cubicle maze) identity.
const partitionTile = make((g) => {
  px(g, PAL.gray1, 0, 0, 16, 16)
  px(g, PAL.dark, 0, 0, 16, 1)
  px(g, PAL.carpet, 1, 2, 14, 12) // fabric panel
  px(g, PAL.carpetHi, 1, 2, 14, 1) // top rail highlight
  px(g, PAL.gray3, 0, 1, 16, 1) // metal cap rail
  px(g, PAL.black, 1, 2, 1, 12) // frame edges
  px(g, PAL.black, 14, 2, 1, 12)
  px(g, PAL.gray2, 2, 6, 12, 1) // fabric seams
  px(g, PAL.gray2, 2, 10, 12, 1)
  px(g, PAL.paper, 3, 3, 4, 2) // pinned memo
  px(g, PAL.black, 12, 14, 3, 1) // floor shadow
})

const voidTile = make((g) => {
  px(g, PAL.black, 0, 0, 16, 16)
})

export const TILES: Record<string, TileSpec> = {
  '.': { canvas: floorTile, solid: false },
  ',': { canvas: carpetTile, solid: false },
  C: { canvas: conveyorTile, solid: false },
  '#': { canvas: wallTile, solid: true },
  D: { canvas: deskTile, solid: true },
  M: { canvas: terminalTile, solid: true },
  E: { canvas: elevatorTile, solid: true },
  P: { canvas: plantTile, solid: true },
  W: { canvas: coolerTile, solid: true },
  S: { canvas: shelfTile, solid: true },
  H: { canvas: pigeonholeTile, solid: true },
  F: { canvas: cabinetTile, solid: true },
  A: { canvas: archiveBoxTile, solid: true },
  U: { canvas: partitionTile, solid: true },
  G: { canvas: signTile, solid: true },
  V: { canvas: voidTile, solid: true },
}
