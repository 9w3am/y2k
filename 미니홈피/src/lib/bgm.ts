/* ══════════════════════════════════════════════════════════
   아이로그 BGM
   그 시절 미니홈피에 깔려 있던 오르골·피아노 배경음을
   브라우저에서 직접 연주한다. 음원 파일은 쓰지 않는다.
   멜로디는 전부 손으로 적었다 — 무작위로 만들면 반드시 이상해진다.
   ══════════════════════════════════════════════════════════ */

type Note = [pitch: string, start: number, dur: number]

export interface Track {
  id: string
  title: string
  artist: string
  bpm: number
  /** 마디당 4박, 한 코드가 한 마디 */
  chords: string[][]
  melody: Note[]
  /** 한 바퀴 도는 길이(박) */
  length: number
  mood: 'box' | 'piano'
  /** 코드를 길게 깔지 않고 8분음표로 굴린다 — 밝고 청량한 곡에 쓴다 */
  arp?: boolean
}

/* ── 음이름 → 주파수 ─────────────────────────────────────── */
const STEP: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4,
  F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
}

export function freq(pitch: string): number {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(pitch)
  if (!m) return 440
  const semis = STEP[m[1]] + (Number(m[2]) + 1) * 12
  return 440 * Math.pow(2, (semis - 69) / 12)
}

/* ── 곡 ──────────────────────────────────────────────────── */

/**
 * 여름이 끝나기 전에 — C G Am F, 청량한 여름
 * 장조로 높게 올리고, 코드를 8분음표로 굴려서 자전거 타는 속도로 흘러가게 했다.
 */
const summer: Track = {
  id: 's1',
  title: '여름이 끝나기 전에',
  artist: '아이로그 BGM',
  bpm: 104,
  mood: 'box',
  length: 32,
  arp: true,
  chords: [
    ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'],
    ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'],
  ],
  melody: [
    ['G5', 0, 0.5], ['E5', 0.5, 0.5], ['G5', 1, 1], ['C6', 2, 1.5], ['B5', 3.5, 0.5],
    ['A5', 4, 1], ['G5', 5, 1], ['E5', 6, 2],
    ['F5', 8, 0.5], ['G5', 8.5, 0.5], ['A5', 9, 1], ['C6', 10, 2],
    ['B5', 12, 1], ['G5', 13, 1], ['A5', 14, 2],
    ['C6', 16, 0.5], ['B5', 16.5, 0.5], ['A5', 17, 1], ['G5', 18, 2],
    ['E5', 20, 1], ['G5', 21, 1], ['C6', 22, 2],
    ['A5', 24, 0.5], ['G5', 24.5, 0.5], ['F5', 25, 1], ['E5', 26, 2],
    ['D5', 28, 1], ['E5', 29, 1], ['C5', 30, 2],
  ],
}

/** 새벽 세시의 창문 — Am Em F G, 느리고 조용한 피아노 */
const dawn: Track = {
  id: 's2',
  title: '새벽 세시의 창문',
  artist: '아이로그 BGM',
  bpm: 62,
  mood: 'piano',
  length: 32,
  chords: [
    ['A3', 'C4', 'E4'], ['E3', 'G3', 'B3'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'],
    ['A3', 'C4', 'E4'], ['E3', 'G3', 'B3'], ['F3', 'A3', 'C4'], ['E3', 'G3', 'B3'],
  ],
  melody: [
    ['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1],
    ['B4', 4, 2], ['G4', 6, 2],
    ['A4', 8, 1], ['C5', 9, 1], ['F5', 10, 2],
    ['E5', 12, 3], ['D5', 15, 1],
    ['C5', 16, 2], ['E5', 18, 1], ['A4', 19, 1],
    ['B4', 20, 2], ['G4', 22, 2],
    ['A4', 24, 1], ['C5', 25, 1], ['E5', 26, 2],
    ['D5', 28, 2], ['B4', 30, 2],
  ],
}

/** 교실 창가 — C G Am F, 밝고 조금 빠르게 */
const classroom: Track = {
  id: 's3',
  title: '교실 창가',
  artist: '아이로그 BGM',
  bpm: 92,
  mood: 'box',
  length: 32,
  chords: [
    ['C3', 'E3', 'G3'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'],
    ['C3', 'E3', 'G3'], ['G3', 'B3', 'D4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'],
  ],
  melody: [
    ['G4', 0, 0.5], ['C5', 0.5, 0.5], ['E5', 1, 1], ['D5', 2, 1], ['C5', 3, 1],
    ['B4', 4, 1], ['D5', 5, 1], ['G5', 6, 2],
    ['E5', 8, 1], ['C5', 9, 1], ['A4', 10, 2],
    ['C5', 12, 0.5], ['F5', 12.5, 0.5], ['E5', 13, 1], ['C5', 14, 2],
    ['G4', 16, 0.5], ['C5', 16.5, 0.5], ['E5', 17, 1], ['G5', 18, 2],
    ['F5', 20, 1], ['D5', 21, 1], ['B4', 22, 2],
    ['A4', 24, 1], ['C5', 25, 1], ['F5', 26, 2],
    ['E5', 28, 1], ['D5', 29, 1], ['C5', 30, 2],
  ],
}

/** 잉크 한 방울 — C Am F G, 자장가처럼 */
const ink: Track = {
  id: 's4',
  title: '잉크 한 방울',
  artist: '아이로그 BGM',
  bpm: 70,
  mood: 'box',
  length: 32,
  chords: [
    ['C3', 'E3', 'G3'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'],
    ['C3', 'E3', 'G3'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C3', 'E3', 'G3'],
  ],
  melody: [
    ['C5', 0, 1], ['E5', 1, 1], ['G5', 2, 2],
    ['E5', 4, 1], ['C5', 5, 1], ['A4', 6, 2],
    ['F4', 8, 1], ['A4', 9, 1], ['C5', 10, 2],
    ['D5', 12, 1], ['B4', 13, 1], ['G4', 14, 2],
    ['E5', 16, 1], ['G5', 17, 1], ['E5', 18, 2],
    ['C5', 20, 1], ['E5', 21, 1], ['A4', 22, 2],
    ['F4', 24, 2], ['A4', 26, 2],
    ['G4', 28, 1], ['E4', 29, 1], ['C4', 30, 2],
  ],
}

export const TRACKS: Track[] = [summer, dawn, classroom, ink]
export const trackById = (id: string) => TRACKS.find((t) => t.id === id) ?? TRACKS[0]

/* ── 연주기 ──────────────────────────────────────────────── */

class Bgm {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private wet: GainNode | null = null
  private timer: number | null = null
  private nextBeat = 0
  private nextTime = 0
  private track: Track = TRACKS[0]
  private vol = 0.5
  /** 지금 울리고 있는 소리들. 멈출 때 전부 끊어야 한다. */
  private voices = new Set<OscillatorNode>()

  /** 예약한 오실레이터를 기억해 둔다 */
  private hold(o: OscillatorNode) {
    this.voices.add(o)
    o.onended = () => this.voices.delete(o)
  }

  /** 울리던 소리를 즉시 끊는다 */
  private silence() {
    const now = this.ctx?.currentTime ?? 0
    for (const o of this.voices) {
      try {
        o.stop(now)
      } catch {
        /* 이미 끝난 소리 */
      }
    }
    this.voices.clear()
  }

  /** 한 바퀴 안에서 지금 어디쯤인지 (0~1) */
  get progress() {
    if (!this.ctx || this.timer == null) return 0
    const len = this.track.length
    return (((this.nextBeat % len) + len) % len) / len
  }

  /** 한 바퀴 안의 특정 지점으로 옮긴다 */
  seek(frac: number) {
    if (!this.ctx) return
    const len = this.track.length
    const beat = Math.max(0, Math.min(len - 0.5, Math.round(frac * len * 2) / 2))
    this.silence()
    this.nextBeat = beat
    this.nextTime = this.ctx.currentTime + 0.05
  }

  /** 소리가 실제로 나고 있는지 (브라우저가 막고 있으면 false) */
  get running() {
    return this.ctx?.state === 'running' && this.timer != null
  }

  private build() {
    if (this.ctx) return
    const Ctx = window.AudioContext ?? (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.value = this.vol * 0.8
    master.connect(ctx.destination)

    // 공간감 — 짧은 되울림
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.26
    const fb = ctx.createGain()
    fb.gain.value = 0.28
    const damp = ctx.createBiquadFilter()
    damp.type = 'lowpass'
    damp.frequency.value = 2400
    const wet = ctx.createGain()
    wet.gain.value = 0.34
    wet.connect(delay)
    delay.connect(damp)
    damp.connect(fb)
    fb.connect(delay)
    damp.connect(master)

    this.ctx = ctx
    this.master = master
    this.wet = wet
  }

  /** 오르골 — 사인 두 겹에 빠른 감쇠 */
  private pluck(t: number, f: number, dur: number, gain: number) {
    const ctx = this.ctx!
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.3, dur))
    g.connect(this.master!)
    g.connect(this.wet!)

    for (const [mult, level, type] of [
      [1, 1, 'sine'],
      [2, 0.34, 'sine'],
      [3.01, 0.12, 'triangle'],
    ] as const) {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = f * mult
      const og = ctx.createGain()
      og.gain.value = level
      o.connect(og)
      og.connect(g)
      this.hold(o)
      o.start(t)
      o.stop(t + Math.max(0.35, dur) + 0.05)
    }
  }

  /** 피아노에 가까운 톤 — 톱니를 필터로 깎는다 */
  private key(t: number, f: number, dur: number, gain: number) {
    const ctx = this.ctx!
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.5, dur * 1.1))
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(3200, t)
    lp.frequency.exponentialRampToValueAtTime(900, t + Math.max(0.5, dur))
    lp.connect(g)
    g.connect(this.master!)
    g.connect(this.wet!)

    for (const detune of [-4, 4]) {
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = f
      o.detune.value = detune
      o.connect(lp)
      this.hold(o)
      o.start(t)
      o.stop(t + Math.max(0.55, dur * 1.1) + 0.05)
    }
  }

  /** 코드 받침 — 아주 작게 깔린다 */
  private pad(t: number, freqs: number[], dur: number) {
    const ctx = this.ctx!
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.055, t + dur * 0.35)
    g.gain.linearRampToValueAtTime(0.0001, t + dur)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1100
    lp.connect(g)
    g.connect(this.master!)

    for (const f of freqs) {
      for (const detune of [-6, 6]) {
        const o = ctx.createOscillator()
        o.type = 'triangle'
        o.frequency.value = f
        o.detune.value = detune
        o.connect(lp)
        this.hold(o)
      o.start(t)
        o.stop(t + dur + 0.05)
      }
    }
  }

  private bass(t: number, f: number, dur: number) {
    const ctx = this.ctx!
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.12, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9)
    g.connect(this.master!)
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    o.connect(g)
    o.start(t)
    o.stop(t + dur)
  }

  /**
   * 앞으로 0.4초치를 미리 예약해 둔다.
   * 8분음표까지 짚어야 하므로 0.5박씩 걷는다 — 1박씩 걸으면 1.5박에 놓인 음이 통째로 사라진다.
   */
  private schedule = () => {
    const ctx = this.ctx
    if (!ctx) return
    const spb = 60 / this.track.bpm
    const step = 0.5
    const horizon = ctx.currentTime + 0.4
    const arpShape = [0, 1, 2, 1, 2, 1, 2, 1]

    while (this.nextTime < horizon) {
      const beat = this.nextBeat % this.track.length
      const t = this.nextTime
      const barIndex = Math.floor(beat / 4) % this.track.chords.length
      const chord = this.track.chords[barIndex]

      // 마디 머리 — 받침과 베이스
      if (beat % 4 === 0) {
        if (!this.track.arp) this.pad(t, chord.map(freq), spb * 4)
        this.bass(t, freq(chord[0]) / 2, spb * 2)
        this.bass(t + spb * 2, freq(chord[0]) / 2, spb * 1.6)
      }

      // 아르페지오 — 8분음표로 코드를 굴린다
      if (this.track.arp) {
        const slot = Math.round((beat % 4) / step)
        const tone = chord[arpShape[slot % arpShape.length] % chord.length]
        this.pluck(t, freq(tone) * 2, spb * 0.55, 0.055)
      }

      // 멜로디
      for (const [pitch, start, dur] of this.track.melody) {
        if (Math.abs(start - beat) > 1e-6) continue
        const f = freq(pitch)
        const d = dur * spb
        if (this.track.mood === 'box') this.pluck(t, f, d, 0.2)
        else this.key(t, f, d, 0.17)
      }

      this.nextBeat += step
      this.nextTime += spb * step
    }
  }

  async play(trackId: string) {
    this.build()
    const ctx = this.ctx!
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        return false
      }
    }
    const next = trackById(trackId)
    const restart = next.id !== this.track.id || this.timer == null
    if (restart) {
      // 곡을 바꾸거나 다시 트는 경우, 울리던 소리를 끊고 처음부터
      this.silence()
      this.track = next
      this.nextBeat = 0
      this.nextTime = ctx.currentTime + 0.08
    }
    if (this.timer == null) this.timer = window.setInterval(this.schedule, 90)
    return ctx.state === 'running'
  }

  /**
   * 멈출 때는 예약만 끊는 것으로 부족하다.
   * 이미 예약된 소리가 남아 울리거나, 다시 켤 때 한꺼번에 쏟아진다.
   * 울리던 소리를 전부 끊고 나서 재운다.
   */
  pause() {
    if (this.timer != null) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.silence()
    this.nextBeat = 0
    void this.ctx?.suspend()
  }

  setVolume(v: number) {
    this.vol = v
    if (this.master && this.ctx)
      this.master.gain.setTargetAtTime(v * 0.8, this.ctx.currentTime, 0.05)
  }
}

export const bgm = new Bgm()

// 개발 중 소리를 직접 재어 보기 위한 손잡이. 빌드에는 들어가지 않는다.
if (import.meta.env.DEV) (globalThis as unknown as { __bgm: Bgm }).__bgm = bgm
