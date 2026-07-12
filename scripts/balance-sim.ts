/**
 * Headless combat-balance simulator. Replicates battle.ts's damage math over
 * the real ENEMIES / ABILITIES / leveling data, so we can see at a glance
 * whether fights are trivial, fair, or brutal — without driving the UI.
 *
 *   node --experimental-transform-types scripts/balance-sim.ts
 *
 * NOTE: mirrors the formulas in scenes/battle.ts + state.ts. If those change,
 * update here too (this is a design instrument, not a test of the code).
 */
import { ENEMIES } from '../src/game/data/enemies.ts'
import { ABILITIES } from '../src/game/data/abilities.ts'
import { xpForLevel } from '../src/game/state.ts'

type P = { lvl: number; maxHp: number; hp: number; maxRam: number; ram: number; atk: number }

function statsAtLevel(lvl: number): P {
  // newGame start + per-level gains (state.ts grantXp)
  let s: P = { lvl: 1, maxHp: 20, hp: 20, maxRam: 6, ram: 6, atk: 2 }
  for (let l = 1; l < lvl; l++) {
    s.maxHp += 4
    s.maxRam += 1
    s.atk += 1
  }
  s.hp = s.maxHp
  s.ram = s.maxRam
  return s
}

const avg = (a: number, b: number) => (a + b) / 2

/**
 * Simulates one fight with a simple policy: use the weakness ability when
 * affordable (or a fixed attack), else the free Sweep. Averages many runs.
 * Returns { winRate, avgTurns, avgHpFrac (min hp / maxHp across the fight) }.
 */
function simFight(enemyId: string, lvl: number, useAbilities: boolean, runs = 400) {
  const spec = ENEMIES[enemyId]
  let wins = 0
  let turnSum = 0
  let minFracSum = 0
  for (let r = 0; r < runs; r++) {
    const p = statsAtLevel(lvl)
    let ehp = spec.hp
    let eAtkBonus = 0
    let eGuard = false
    let atkStack = 0
    let playerGuard = false
    let moveCount = 0
    let minHp = p.hp
    let turns = 0
    const abilityIds = ['sweep', 'flush', 'increment', 'guard', 'switchcase', 'looplash', 'subroutine'].filter(
      (id) => ABILITIES[id],
    )
    while (p.hp > 0 && ehp > 0 && turns < 200) {
      // ---- player turn: greedy best action
      p.ram = Math.min(p.maxRam, p.ram + 1)
      const weakAb = useAbilities && spec.weakTo ? ABILITIES[spec.weakTo] : null
      let chosen = ABILITIES.sweep
      if (weakAb && weakAb.cost <= p.ram) chosen = weakAb
      else if (useAbilities) {
        // otherwise strongest affordable attack
        const attacks = abilityIds
          .map((id) => ABILITIES[id])
          .filter((a) => a.kind === 'attack' && a.cost <= p.ram)
          .sort((a, b) => avg(b.power![0], b.power![1]) * (b.hits ? avg(b.hits[0], b.hits[1]) : 1) -
            avg(a.power![0], a.power![1]) * (a.hits ? avg(a.hits[0], a.hits[1]) : 1))
        if (attacks[0]) chosen = attacks[0]
      }
      p.ram -= chosen.cost
      const hits = chosen.hits ? Math.round(avg(chosen.hits[0], chosen.hits[1])) : 1
      let total = 0
      for (let h = 0; h < hits; h++) {
        let dmg = Math.round(avg(chosen.power![0], chosen.power![1])) + p.atk + atkStack
        if (eGuard) {
          dmg = Math.ceil(dmg / 2)
          eGuard = false
        }
        total += dmg
      }
      if (spec.weakTo && spec.weakTo === chosen.id) total = Math.round(total * 1.5)
      ehp -= total
      turns++
      if (ehp <= 0) break
      // ---- enemy turn
      let move
      if (spec.script && spec.script.length) move = spec.moves[spec.script[moveCount % spec.script.length]] ?? spec.moves[0]
      else {
        const tot = spec.moves.reduce((s, m) => s + m.weight, 0)
        let roll = Math.random() * tot
        move = spec.moves[0]
        for (const m of spec.moves) {
          roll -= m.weight
          if (roll <= 0) { move = m; break }
        }
      }
      moveCount++
      if (move.dmg) {
        let dmg = Math.round(avg(move.dmg[0], move.dmg[1])) + eAtkBonus
        if (playerGuard) { dmg = Math.ceil(dmg / 2); playerGuard = false }
        p.hp -= dmg
      } else if (move.self === 'atk+') eAtkBonus++
      else if (move.self === 'guard') eGuard = true
      if (p.hp < minHp) minHp = p.hp
    }
    if (p.hp > 0) wins++
    turnSum += turns
    minFracSum += Math.max(0, minHp) / p.maxHp
  }
  return { winRate: wins / runs, avgTurns: turnSum / runs, avgMinFrac: minFracSum / runs }
}

// Expected level when the player reaches each enemy (rough progression guess).
const encounters: { id: string; lvl: number }[] = [
  { id: 'crumple', lvl: 1 }, { id: 'lintgolem', lvl: 2 }, { id: 'sludgecone', lvl: 3 },
  { id: 'shredling', lvl: 3 }, { id: 'junkfax', lvl: 4 }, { id: 'mislabel', lvl: 4 },
  { id: 'tallymore', lvl: 5 }, { id: 'rolo', lvl: 5 }, { id: 'offbyone', lvl: 6 },
  { id: 'copypasta', lvl: 6 }, { id: 'scopecreep', lvl: 7 }, { id: 'stackoverflow', lvl: 7 },
]

console.log('enemy'.padEnd(14), 'lv', 'HP'.padStart(3), '| SWEEP-ONLY win/turns/minHP% | OPTIMAL win/turns/minHP%')
for (const { id, lvl } of encounters) {
  const spec = ENEMIES[id]
  const s = simFight(id, lvl, false)
  const o = simFight(id, lvl, true)
  const boss = spec.boss ? '*' : ' '
  const fmt = (r: { winRate: number; avgTurns: number; avgMinFrac: number }) =>
    `${(r.winRate * 100).toFixed(0).padStart(3)}% ${r.avgTurns.toFixed(1).padStart(4)}t ${(r.avgMinFrac * 100).toFixed(0).padStart(3)}%`
  console.log(
    (boss + spec.name).padEnd(14),
    String(lvl).padStart(2),
    String(spec.hp).padStart(3),
    '|', fmt(s), '|', fmt(o),
  )
}
console.log('\n(minHP% = lowest the player fell to; <35% = tense, ~100% = trivial. * = boss)')
