import { PAL, type PalColor } from './palette.ts'

/**
 * Character & entity sprites are authored as text pixel-art: each string is
 * a row, each char is a palette color via the sprite's legend, '.' = clear.
 * Edit them like ASCII art. Rows shorter than the widest row are padded.
 *
 * HARD ART RULES (see docs/ART_BIBLE.md):
 *  - Every HUMAN wears a mask that hides ALL facial features. No eyes, no
 *    mouths, no noses — ever. A vent/filter is equipment, not a feature.
 *  - Every NON-HUMAN creature is headless. Garbage has no head to speak with.
 */
export interface PixelArt {
  name: string
  legend: Record<string, PalColor>
  rows: string[]
}

const cache = new Map<string, HTMLCanvasElement>()

export function compileArt(art: PixelArt, flip = false): HTMLCanvasElement {
  const key = art.name + (flip ? '|f' : '')
  const hit = cache.get(key)
  if (hit) return hit
  const w = Math.max(...art.rows.map((r) => r.length))
  const h = art.rows.length
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  for (let y = 0; y < h; y++) {
    const row = art.rows[y]
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch === '.') continue
      const col = art.legend[ch]
      if (!col) continue
      g.fillStyle = PAL[col]
      g.fillRect(flip ? w - 1 - x : x, y, 1, 1)
    }
  }
  cache.set(key, c)
  return c
}

export function drawArt(
  ctx: CanvasRenderingContext2D,
  art: PixelArt,
  x: number,
  y: number,
  flip = false,
  scale = 1,
): void {
  const img = compileArt(art, flip)
  ctx.drawImage(img, Math.round(x), Math.round(y), img.width * scale, img.height * scale)
}

// ---------------------------------------------------------------- janitor
// Wes, the night janitor. Blank white mask (no features), work cap, teal
// coveralls, canvas gloves. 16x16, two walk frames per axis.

const JANITOR_LEGEND: Record<string, PalColor> = {
  k: 'black', b: 'cap', m: 'mask', s: 'suit', h: 'suitHi', g: 'glove', u: 'gray2',
}

const janitorDown1: PixelArt = {
  name: 'janD1',
  legend: JANITOR_LEGEND,
  rows: [
    '................',
    '.....kkkkkk.....',
    '....kbbbbbbk....',
    '...kbbbbbbbbk...',
    '...kmmmmmmmmk...',
    '...kmmmmmmmmk...',
    '...kmmmmmmmmk...',
    '....kmmmmmmk....',
    '....kssssssk....',
    '...kshssssshk...',
    '..kgksssssskgk..',
    '..kk.kssssk.kk..',
    '....kss..ssk....',
    '....kss..ssk....',
    '....kuu..uuk....',
    '.....kk..kk.....',
  ],
}

const janitorDown2: PixelArt = {
  name: 'janD2',
  legend: JANITOR_LEGEND,
  rows: [
    '................',
    '.....kkkkkk.....',
    '....kbbbbbbk....',
    '...kbbbbbbbbk...',
    '...kmmmmmmmmk...',
    '...kmmmmmmmmk...',
    '...kmmmmmmmmk...',
    '....kmmmmmmk....',
    '....kssssssk....',
    '...kshssssshk...',
    '..kgksssssskgk..',
    '..kk.kssssk.kk..',
    '...kss....ssk...',
    '...kss....ssk...',
    '...kuu....uuk...',
    '....kk....kk....',
  ],
}

const janitorUp1: PixelArt = {
  name: 'janU1',
  legend: JANITOR_LEGEND,
  rows: [
    '................',
    '.....kkkkkk.....',
    '....kbbbbbbk....',
    '...kbbbbbbbbk...',
    '...kbbbbbbbbk...',
    '...kmmmmmmmmk...',
    '...kmmmmmmmmk...',
    '....kmmmmmmk....',
    '....kssssssk....',
    '...kssssssssk...',
    '..kgkssssssskgk.',
    '..kk.kssssk.kk..',
    '....kss..ssk....',
    '....kss..ssk....',
    '....kuu..uuk....',
    '.....kk..kk.....',
  ],
}

const janitorUp2: PixelArt = {
  name: 'janU2',
  legend: JANITOR_LEGEND,
  rows: [
    '................',
    '.....kkkkkk.....',
    '....kbbbbbbk....',
    '...kbbbbbbbbk...',
    '...kbbbbbbbbk...',
    '...kmmmmmmmmk...',
    '...kmmmmmmmmk...',
    '....kmmmmmmk....',
    '....kssssssk....',
    '...kssssssssk...',
    '..kgkssssssskgk.',
    '..kk.kssssk.kk..',
    '...kss....ssk...',
    '...kss....ssk...',
    '...kuu....uuk...',
    '....kk....kk....',
  ],
}

// Side view faces LEFT; right-facing is drawn with flip=true.
const janitorSide1: PixelArt = {
  name: 'janS1',
  legend: JANITOR_LEGEND,
  rows: [
    '................',
    '.....kkkkkk.....',
    '....kbbbbbbk....',
    '..kkbbbbbbbbk...',
    '...kmmmmmmmk....',
    '...kmmmmmmmk....',
    '...kmmmmmmmk....',
    '....kmmmmmk.....',
    '....kssssssk....',
    '...ksssssssk....',
    '...kgsssssgk....',
    '....ksssssk.....',
    '....kssssk......',
    '.....ksssk......',
    '.....kuuuk......',
    '......kkk.......',
  ],
}

const janitorSide2: PixelArt = {
  name: 'janS2',
  legend: JANITOR_LEGEND,
  rows: [
    '................',
    '.....kkkkkk.....',
    '....kbbbbbbk....',
    '..kkbbbbbbbbk...',
    '...kmmmmmmmk....',
    '...kmmmmmmmk....',
    '...kmmmmmmmk....',
    '....kmmmmmk.....',
    '....kssssssk....',
    '...ksssssssk....',
    '...kgsssssgk....',
    '....ksssssk.....',
    '...kss..ssk.....',
    '..kss....ssk....',
    '..kuu....uuk....',
    '................',
  ],
}

export const JANITOR = {
  down: [janitorDown1, janitorDown2],
  up: [janitorUp1, janitorUp2],
  side: [janitorSide1, janitorSide2],
}

// ---------------------------------------------------------------- NPCs
// Custodian Pram — veteran janitor. Gray fatigues, full-face filter mask
// (the amber disc is a filter cartridge, not a face).

export const PRAM: PixelArt = {
  name: 'pram',
  legend: { k: 'black', c: 'gray2', m: 'mask', f: 'amber', s: 'gray3', h: 'gray4', g: 'glove', u: 'gray2' },
  rows: [
    '................',
    '.....kkkkkk.....',
    '....kcccccck....',
    '...kcccccccck...',
    '...kmmmmmmmmk...',
    '...kmmmffmmmk...',
    '...kmmmffmmmk...',
    '....kmmmmmmk....',
    '....kssssssk....',
    '...kshssssshk...',
    '..kgksssssskgk..',
    '..kk.kssssk.kk..',
    '....kss..ssk....',
    '....kss..ssk....',
    '....kuu..uuk....',
    '.....kk..kk.....',
  ],
}

// ------------------------------------------------------------ overworld trash
// A bulging bag with loose paper — bumping into one starts a battle.

export const TRASH_PILE: PixelArt = {
  name: 'trash',
  legend: { k: 'black', b: 'bag', g: 'gray2', p: 'paper', d: 'paperDim' },
  rows: [
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
  ],
}

// ------------------------------------------------------------- battle sprites
// 24x24, drawn large in battle. ALL are headless — animate refuse.

/** Crumple — a wad of paper that saved over itself too many times. */
export const CRUMPLE: PixelArt = {
  name: 'crumple',
  legend: { k: 'black', p: 'paper', d: 'paperDim', w: 'white', g: 'gray3' },
  rows: [
    '........................',
    '........................',
    '........kkkkkkk.........',
    '......kkpppppppkk.......',
    '.....kpppdppppppdk......',
    '....kppdppppdppppk......',
    '...kpppppwppppdpppk.....',
    '...kpdppppppppppppk.....',
    '..kpppppdppwpppppdpk....',
    '..kppwppppppppdppppk....',
    '..kpppppdpppppppwppk....',
    '.kkppdppppwpppppppkk....',
    'kgpkpppppppppdppppkpgk..',
    '.kk.kppdpppppppppk.kk...',
    '....kpppppwpppdppk......',
    '.....kpppppppppk........',
    '......kkpppppkk.........',
    '........kkkkk...........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
}

/** Lint Golem — a hulking headless torso of compacted dryer lint. */
export const LINT_GOLEM: PixelArt = {
  name: 'lintGolem',
  legend: { k: 'black', l: 'lint', i: 'lintHi', d: 'dark', g: 'gray2' },
  rows: [
    '........................',
    '........................',
    '....kkkk......kkkk......',
    '...klliik....kiillk.....',
    '..kllllik....killllk....',
    '..klllk..kkkk..klllk....',
    '..kllk.kkliilkk.kllk....',
    '..klik.kliliilk.kilk....',
    '..klk.klllillllk.klk....',
    '..klk.kllllilllk.klk....',
    '..kk.kilklllklllk.kk....',
    '.....klllilllillk.......',
    '.....kllllklllllk.......',
    '.....killlllilllk.......',
    '.....klllillllik........',
    '......kllklllk..........',
    '......klk..klk..........',
    '.....kllk..kllk.........',
    '.....kdlk..kldk.........',
    '......kk....kk..........',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
}

/** Sludge Cone — a wet-floor cone possessed by expired coffee ooze. */
export const SLUDGE_CONE: PixelArt = {
  name: 'sludgeCone',
  legend: { k: 'black', a: 'amber', w: 'white', o: 'ooze', z: 'oozeDim' },
  rows: [
    '........................',
    '........................',
    '..........kok...........',
    '..........kozk..........',
    '.........kaoak..........',
    '.........kaaak..........',
    '........kaaaaak.........',
    '........kaoaaak.........',
    '.......kaaaaaoak........',
    '.......kwwwwwwwk........',
    '......kwwaaaawwk........',
    '......kaaaaoaaak........',
    '.....kaaaoaaaaaak.......',
    '.....kaaaaaaaoaak.......',
    '....kaaoaaaaaaaaak......',
    '....kaaaaaaoaaaaak......',
    '...kwwwwwwwwwwwwwk......',
    '...kwwaaaaaaaaawwk......',
    '..kkkkkkkkkkkkkkkkk.....',
    '..kzoozkkkkkkkzoozk.....',
    '...kzzk.......kzzk......',
    '....kk.........kk.......',
    '........................',
    '........................',
  ],
}

// ---------------------------------------------------------- Floor 1 enemies
// Mailroom / paper theme. All headless (hard art rule).

/** Shredling — a writhing bundle of shredded paper strips. */
export const SHREDLING: PixelArt = {
  name: 'shredling',
  legend: { k: 'black', p: 'paper', d: 'paperDim', g: 'gray3', o: 'ooze' },
  rows: [
    '........................',
    '.....k.k..k.k...k.k.....',
    '....kpkdk.kpk..kdkpk....',
    '....kpkpk.kdk..kpkdk....',
    '...kdkpkdkpkdkpkdkpk....',
    '...kpppppppppppppppk....',
    '..kdppdpppdpppdpppdpk...',
    '..kppppppppppppppppgk...',
    '..kpppdpppppppdppppgk...',
    '..kppppppgpppppppppgk...',
    '..kdpppppppppppdpppgk...',
    '..kppppdpoopppppppppk...',
    '..kppppppooppppdppppk...',
    '..kdppppppppppppppdpk...',
    '..kppppdppppppgppppgk...',
    '...kpppppppppppppppk....',
    '...kdkpkdkpkdkpkdkpk....',
    '....kpk.kpk.kpk.kpk....',
    '....k.k.k.k.k.k.k.k....',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
}

/** Junk Fax — a possessed fax machine spooling curled thermal paper. */
export const JUNK_FAX: PixelArt = {
  name: 'junkFax',
  legend: { k: 'black', g: 'gray2', h: 'gray3', l: 'gray4', p: 'paper', w: 'white', a: 'amber', r: 'red', o: 'ooze' },
  rows: [
    '........................',
    '..........kppk..........',
    '.........kpwwpk.........',
    '........kpwppwpk........',
    '.......kpwpkkpwpk.......',
    '......kpwpk..kpwk.......',
    '.....kppk....kppk.......',
    '....kkkkkkkkkkkkkkkk....',
    '...klllllllllllllllk...',
    '...klhhhhhhhhhhhhhhlk...',
    '...klhgggggggggggghhlk..',
    '...klhgawgggggggarhhlk..',
    '...klhgggggggggggghhlk..',
    '...klhhhhhhhhhhhhhhlk...',
    '...kllllllllllllllllk..',
    '...klgkkgkkgkkgkkgklk..',
    '...klgggggggggggggglk..',
    '...kllllllllllllllllk..',
    '....kook........kook...',
    '.....kk..........kk....',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
}

/**
 * MISLABEL (boss) — a parcel wrapped in tape and plastered with contradictory
 * shipping labels. Headless. Its whole gimmick is claiming to be a type it
 * isn't; Scan strips the labels off.
 */
export const MISLABEL: PixelArt = {
  name: 'mislabel',
  legend: { k: 'black', b: 'desk', h: 'deskHi', t: 'paperDim', p: 'paper', w: 'white', a: 'amber', r: 'red', o: 'ooze', g: 'gray4' },
  rows: [
    '........................',
    '....kkkkkkkkkkkkkkkk....',
    '...khhhhhhhhhhhhhhhhk...',
    '..khbbbbbbbbbbbbbbbbhk..',
    '..kbbppppppbbbbaaaaabk..',
    '..kbbpwwwwpbbbbarrrabk..',
    '..kbbpwrrpbbtbbaraaabk..',
    '..kbbppppobbtbbaaaaabk..',
    '.gkbbbbbtttttttbbbbbkg..',
    '.gkbbbbbtttttttbbbbbkg..',
    '..kbbaaaaabbbbppppppbk..',
    '..kbbarrrabbbbpwwwppbk..',
    '..kbbaraaabbbbpwrrppbk..',
    '..kbbaaaaabbotbppppobk..',
    '..kbbbbbbbbbttbbbbbbbk..',
    '..kbbbbbbbbbttbbbbbbbk..',
    '..khbbbbbbbbbbbbbbbbhk..',
    '...khhhhhhhhhhhhhhhhk...',
    '....kkkkkkkkkkkkkkkk....',
    '.....koo......ook......',
    '......kk......kk.......',
    '........................',
    '........................',
    '........................',
  ],
}

// ------------------------------------------------------------- Floor 1 NPC
// Courier — a masked mail worker. Smooth mask with an amber scanner visor
// slit (equipment, not a face), cap, gray uniform, satchel strap.
export const COURIER: PixelArt = {
  name: 'courier',
  legend: { k: 'black', c: 'cap', m: 'mask', v: 'amber', u: 'gray3', h: 'gray4', s: 'suit', g: 'glove', b: 'desk' },
  rows: [
    '................',
    '.....kkkkkk.....',
    '....kcccccck....',
    '...kcccccccck...',
    '...kmmmmmmmmk...',
    '...kvvvvvvvvk...',
    '...kmmmmmmmmk...',
    '....kmmmmmmk....',
    '....kuuuuuuk....',
    '...kuhuuuuhuk...',
    '..kgkuuuuuukgk..',
    '..kk.kuuuuk.bk..',
    '....kuu..uuk.bk.',
    '....kuu..uuk.bk.',
    '....khh..hhk....',
    '.....kk..kk.....',
  ],
}

// ---------------------------------------------------------- Floor 2 enemies
// The Archives / loops theme. All headless (hard art rule).

/** Tallymore — a blob of receipt tape scrawled with endless tally marks. */
export const TALLYMORE: PixelArt = {
  name: 'tallymore',
  legend: { k: 'black', p: 'paper', d: 'paperDim', i: 'gray1', o: 'ooze' },
  rows: [
    '........................',
    '.........kkkkkk.........',
    '.......kkppppppkk.......',
    '......kppiipiipppk......',
    '.....kppipiipiippk......',
    '.....kpipiipiipipk......',
    '....kppipiipiipippk.....',
    '....kpipiipiipiipik.....',
    '....kdipiipiipiipik.....',
    '....kpipiipiipiipdk.....',
    '....kpipiipiipiipik.....',
    '....kppipiipiipippk.....',
    '.....kpipiipiipipk......',
    '.....kppipiipiippk......',
    '......kppiipiipppk......',
    '......kdppppppppdk......',
    '.......kkppppppkk.......',
    '........kdoodok.........',
    '.........kkookk.........',
    '...........kk..........',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
}

/** Rolo — a rotary card file spinning forever, never reaching a stop condition. */
export const ROLO: PixelArt = {
  name: 'rolo',
  legend: { k: 'black', g: 'gray2', h: 'gray3', l: 'gray4', p: 'paper', w: 'white', o: 'ooze' },
  rows: [
    '........................',
    '..........kwk...........',
    '.......kk.kpk.kk........',
    '......kwpkkpkkpwk.......',
    '.....kwppppppppppwk.....',
    '....kwppwppwppwppwpk....',
    '...kwppppppppppppppwk...',
    '...kpwpwpwpwpwpwpwpwk...',
    '...kwppppppppppppppwk...',
    '....khhhhhhhhhhhhhhk....',
    '...klhgggggggggggghlk...',
    '..klhgggggggggggggghhlk.',
    '..klhgggkkkkkkggggghlk..',
    '..klhggkllllllkgggghlk..',
    '..klhgggkkkkkkggggghlk..',
    '..klhgggggggggggggghlk..',
    '...klllllllllllllllk...',
    '....kggkllllllllkggk....',
    '....kook........kook....',
    '.....kk..........kk.....',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
}

/**
 * OFF-BY-ONE (boss) — a stack of numbered file drawers. The top drawer juts
 * out one notch too far (glowing red): the extra iteration. Headless.
 */
export const OFF_BY_ONE: PixelArt = {
  name: 'offByOne',
  legend: { k: 'black', b: 'desk', h: 'deskHi', a: 'amber', r: 'red', w: 'white', o: 'ooze', g: 'gray4' },
  rows: [
    '........................',
    '.......kkkkkkkkkkkrrrrk..',
    '......khhhhhhhhhhkrwwwrk.',
    '......kbbbbbbbbbbkraaark.',
    '......kbawwabbbbbkrrrrrk.',
    '......kbbbbbbbbbbkkkkkkk.',
    '......khhhhhhhhhhhhhk....',
    '......kbbbbbbbbbbbbbk....',
    '......kbawwwwabbbbbbk....',
    '......kbbbbbbbbbbbbbk....',
    '......khhhhhhhhhhhhhk....',
    '......kbbbbbbbbbbbbbk....',
    '......kbawwabbbawwabk....',
    '......kbbbbbbbbbbbbbk....',
    '......khhhhhhhhhhhhhk....',
    '......kbbbbbbbbbbbbbk....',
    '......kbawwwwwwwabbbk....',
    '......kbbbbbbbbbbbbbk....',
    '.....gkhhhhhhhhhhhhhkg...',
    '.....gkbbbbbbbbbbbbbkg...',
    '......kkooo....oookkk....',
    '.......kk........kk.....',
    '........................',
    '........................',
  ],
}

// ------------------------------------------------------------- Floor 2 NPC
// Clerk — a masked archivist. Ceramic mask with a green eyeshade visor
// (equipment, not a face), gray coat, ink-stained cuffs.
export const CLERK: PixelArt = {
  name: 'clerk',
  legend: { k: 'black', c: 'gray2', m: 'mask', v: 'crtDim', u: 'gray3', h: 'gray4', g: 'glove' },
  rows: [
    '................',
    '.....kkkkkk.....',
    '....kmmmmmmk....',
    '...kvvvvvvvvk...',
    '...kmmmmmmmmk...',
    '...kmmmmmmmmk...',
    '....kmmmmmmk....',
    '....kcccccck....',
    '...kccccccck...',
    '..kgkccccckgk..',
    '..kk.kcccck.kk..',
    '....kcc..cck....',
    '....kcc..cck....',
    '....kuu..uuk....',
    '.....kk..kk.....',
    '................',
  ],
}

/** Small trash-bag glyph used on the title screen. */
export const BAG_ICON: PixelArt = TRASH_PILE
