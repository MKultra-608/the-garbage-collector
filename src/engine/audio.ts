/**
 * All audio is synthesized with WebAudio — there are no audio assets and,
 * by hard design rule, NO MUSIC. The soundscape is diegetic: fluorescent
 * hum, HVAC rumble, chunky mechanical SFX. Even the victory sting is a
 * noise sweep, not a melody. Keep it that way.
 *
 * Each floor has its own white-noise room tone (setFloorAmbience):
 *   0 sub-basement — boiler rumble that slowly breathes, 60 Hz pipe hum
 *   1 mailroom     — HVAC wash plus the rhythmic chug of the conveyor
 *   2 archives     — near-silence: dry paper hiss, the building far away
 *   3 cubicles     — a field of PC fans and a faint CRT whine
 */

export class AudioSys {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  enabled = true
  private ambSources: AudioScheduledSourceNode[] = []
  private ambNodes: AudioNode[] = []
  private ambFloor = -1
  private pendingAmbFloor = 0

  /** Must be called from a user gesture (first key press). */
  unlock(): void {
    if (this.ctx) return
    try {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
      this.ambFloor = this.pendingAmbFloor
      this.buildAmbience(this.ambFloor)
    } catch {
      this.ctx = null
    }
  }

  /**
   * Switches the looping room tone to the given floor's recipe. Safe to call
   * before unlock (the choice is remembered) and on every floor load (a
   * repeat call for the same floor is a no-op).
   */
  setFloorAmbience(floor: number): void {
    this.pendingAmbFloor = floor
    if (!this.ctx || floor === this.ambFloor) return
    this.ambFloor = floor
    this.stopAmbience()
    this.buildAmbience(floor)
  }

  private stopAmbience(): void {
    for (const s of this.ambSources) {
      try {
        s.stop()
      } catch {
        /* already stopped */
      }
    }
    for (const n of this.ambNodes) n.disconnect()
    this.ambSources = []
    this.ambNodes = []
  }

  /** A continuous quiet oscillator layer (hums, whines). */
  private ambOsc(type: OscillatorType, freq: number, vol: number): void {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = vol
    osc.connect(g).connect(this.master!)
    osc.start()
    this.ambSources.push(osc)
    this.ambNodes.push(osc, g)
  }

  /**
   * A looping filtered-noise layer. `lfo` breathes/pulses the layer's volume
   * (rate in Hz, depth 0..1) — a boiler breathing, a conveyor chugging.
   */
  private ambNoise(
    filter: BiquadFilterType,
    freq: number,
    q: number,
    vol: number,
    lfo?: { rate: number; depth: number },
  ): void {
    const ctx = this.ctx!
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const f = ctx.createBiquadFilter()
    f.type = filter
    f.frequency.value = freq
    f.Q.value = q
    const g = ctx.createGain()
    g.gain.value = vol
    noise.connect(f).connect(g).connect(this.master!)
    noise.start()
    this.ambSources.push(noise)
    this.ambNodes.push(noise, f, g)
    if (lfo) {
      const mod = ctx.createOscillator()
      mod.type = 'sine'
      mod.frequency.value = lfo.rate
      const modGain = ctx.createGain()
      modGain.gain.value = vol * lfo.depth
      mod.connect(modGain).connect(g.gain)
      mod.start()
      this.ambSources.push(mod)
      this.ambNodes.push(mod, modGain)
    }
  }

  /** The per-floor white-noise recipes. All diegetic, all quiet, no melody. */
  private buildAmbience(floor: number): void {
    switch (floor) {
      case 1: // mailroom: HVAC wash + the conveyor's endless chug
        this.ambOsc('triangle', 120, 0.01)
        this.ambNoise('lowpass', 420, 0.7, 0.026)
        this.ambNoise('lowpass', 240, 1.2, 0.012, { rate: 2.4, depth: 0.85 })
        break
      case 2: // archives: the quietest floor — dry hiss, building far away
        this.ambOsc('triangle', 120, 0.006)
        this.ambNoise('bandpass', 1400, 1.0, 0.012)
        this.ambNoise('lowpass', 100, 0.7, 0.012)
        break
      case 3: // cubicle maze: a field of PC fans + a faint CRT whine
        this.ambOsc('triangle', 120, 0.01)
        this.ambNoise('bandpass', 650, 0.9, 0.022, { rate: 0.4, depth: 0.25 })
        this.ambNoise('highpass', 3000, 0.7, 0.006)
        this.ambOsc('sine', 9500, 0.004)
        break
      default: // sub-basement: boiler rumble that breathes, pipes on the mains
        this.ambOsc('triangle', 60, 0.014)
        this.ambOsc('triangle', 120, 0.008)
        this.ambNoise('lowpass', 150, 0.8, 0.04, { rate: 0.15, depth: 0.45 })
        break
    }
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
