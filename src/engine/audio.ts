/**
 * All audio is synthesized with WebAudio — there are no audio assets and,
 * by hard design rule, NO MUSIC. The soundscape is diegetic: fluorescent
 * hum, HVAC rumble, chunky mechanical SFX. Even the victory sting is a
 * noise sweep, not a melody. Keep it that way.
 */

export class AudioSys {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  enabled = true

  /** Must be called from a user gesture (first key press). */
  unlock(): void {
    if (this.ctx) return
    try {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
      this.startAmbience()
    } catch {
      this.ctx = null
    }
  }

  /** Fluorescent-light hum + soft HVAC noise bed. Runs forever, very quiet. */
  private startAmbience(): void {
    const ctx = this.ctx!
    // 120 Hz mains hum (fluorescent ballast)
    const hum = ctx.createOscillator()
    hum.type = 'triangle'
    hum.frequency.value = 120
    const humGain = ctx.createGain()
    humGain.gain.value = 0.012
    hum.connect(humGain).connect(this.master!)
    hum.start()
    // filtered noise = air handling
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 220
    const nGain = ctx.createGain()
    nGain.gain.value = 0.03
    noise.connect(lp).connect(nGain).connect(this.master!)
    noise.start()
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
    if (!this.ctx || !this.master || !this.enabled) return
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(g).connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private thud(dur: number, vol: number, filterFreq: number, slideTo?: number): void {
    if (!this.ctx || !this.master || !this.enabled) return
    const t = this.ctx.currentTime
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur))
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(filterFreq, t)
    if (slideTo !== undefined) f.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(f).connect(g).connect(this.master)
    src.start(t)
  }

  // ---- SFX vocabulary (keep names stable; scenes call these) ----
  blip(): void { this.tone(880, 0.03, 'square', 0.04) }            // dialogue typewriter
  key(): void { this.thud(0.03, 0.10, 3000, 900) }                 // code editor keystroke
  step(): void { this.thud(0.05, 0.06, 500, 180) }                 // footstep
  bump(): void { this.thud(0.08, 0.10, 250) }                      // walk into wall
  cursor(): void { this.tone(520, 0.04, 'square', 0.05) }          // menu move
  confirm(): void { this.tone(660, 0.07, 'square', 0.06, 990) }    // OK
  cancel(): void { this.tone(330, 0.07, 'square', 0.05, 220) }     // back
  hit(): void { this.thud(0.12, 0.22, 2200, 300) }                 // player deals damage
  hurt(): void { this.thud(0.18, 0.22, 700, 120) }                 // player takes damage
  error(): void { this.tone(140, 0.22, 'sawtooth', 0.08, 90) }     // compile error / denied
  win(): void { this.thud(0.5, 0.18, 400, 4500) }                  // victory: rising noise sweep (NOT a melody)
  unlockAbility(): void { this.thud(0.35, 0.2, 300, 6000); this.tone(1200, 0.15, 'square', 0.05, 1800) }
}
