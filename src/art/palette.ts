/**
 * The entire game uses this fixed palette — a drab, fluorescent-lit office
 * with CRT-green accents for anything "code" and ooze-purple for garbage
 * magic. When adding art, pick from here. Add a color only if a whole new
 * material genuinely needs one, and document it.
 */
export const PAL = {
  // ink & neutrals
  black: '#0d0d10',
  dark: '#1a1c22',
  gray1: '#2e3138',
  gray2: '#4a4e57',
  gray3: '#6e737d',
  gray4: '#9aa0a8',
  white: '#e8eaed',
  // office materials
  carpet: '#3d4436',
  carpetHi: '#464e3e',
  wall: '#5c6157',
  wallHi: '#8b9086',
  desk: '#6b563f',
  deskHi: '#8a7355',
  // CRT / code
  crt: '#39ff9c',
  crtDim: '#1d7a52',
  cyan: '#4dd8e8',
  // signals
  amber: '#ffb347',
  red: '#e8574a',
  // garbage
  ooze: '#8a5fbf',
  oozeDim: '#5b3f80',
  bag: '#23262c',
  paper: '#d9d4c3',
  paperDim: '#a8a494',
  lint: '#7d7466',
  lintHi: '#a39887',
  // the janitor
  suit: '#39605e',
  suitHi: '#4f807d',
  mask: '#dcdfe2',
  glove: '#c7b791',
  cap: '#2e4a66',
} as const

export type PalColor = keyof typeof PAL
