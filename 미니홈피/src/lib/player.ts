import { bgm } from './bgm'
import { loadAudio } from './audioStore'

/* ══════════════════════════════════════════════════════════
   BGM 재생기 — 세 갈래를 하나로 묶는다
   · 내장곡  : 브라우저가 직접 연주하는 오르골/피아노
   · 내 파일 : 올려둔 음악 파일 (IndexedDB 에 보관)
   · 유튜브  : 링크만 붙이면 숨은 플레이어로
   ══════════════════════════════════════════════════════════ */

export type Source =
  | { kind: 'builtin'; trackId: string }
  | { kind: 'file' }
  | { kind: 'youtube'; videoId: string }

/* ── 내 파일 ─────────────────────────────────────────────── */
let audioEl: HTMLAudioElement | null = null
let audioUrl = ''

async function ensureAudio(): Promise<HTMLAudioElement | null> {
  if (audioEl) return audioEl
  const blob = await loadAudio()
  if (!blob) return null
  audioUrl = URL.createObjectURL(blob)
  audioEl = new Audio(audioUrl)
  audioEl.loop = true
  return audioEl
}

/** 파일을 새로 올렸을 때 이전 것을 버린다 */
export function resetAudio() {
  audioEl?.pause()
  if (audioUrl) URL.revokeObjectURL(audioUrl)
  audioEl = null
  audioUrl = ''
}

/* ── 유튜브 ──────────────────────────────────────────────── */
interface YtPlayer {
  playVideo(): void
  pauseVideo(): void
  setVolume(v: number): void
  loadVideoById(id: string): void
  getCurrentTime(): number
  getDuration(): number
  seekTo(sec: number, allow: boolean): void
  getPlayerState(): number
}

let yt: YtPlayer | null = null
let ytReady: Promise<void> | null = null
let ytVideo = ''

function loadYtApi(): Promise<void> {
  if (ytReady) return ytReady
  ytReady = new Promise((resolve) => {
    const w = window as unknown as { YT?: { Player: unknown }; onYouTubeIframeAPIReady?: () => void }
    if (w.YT?.Player) return resolve()
    w.onYouTubeIframeAPIReady = () => resolve()
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
  })
  return ytReady
}

async function ensureYt(videoId: string): Promise<YtPlayer | null> {
  await loadYtApi()
  const w = window as unknown as {
    YT: { Player: new (el: HTMLElement, opt: unknown) => YtPlayer }
  }
  if (!w.YT?.Player) return null

  if (!yt) {
    let host = document.getElementById('ilog-yt')
    if (!host) {
      host = document.createElement('div')
      host.id = 'ilog-yt'
      // 소리만 쓰므로 화면에서 치워둔다 (display:none 이면 재생이 막히는 브라우저가 있다)
      host.style.cssText =
        'position:fixed;width:1px;height:1px;left:-9999px;top:0;opacity:0;pointer-events:none'
      document.body.appendChild(host)
    }
    await new Promise<void>((resolve) => {
      yt = new w.YT.Player(host as HTMLElement, {
        videoId,
        playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: videoId },
        events: { onReady: () => resolve() },
      })
    })
    ytVideo = videoId
  } else if (ytVideo !== videoId) {
    yt.loadVideoById(videoId)
    ytVideo = videoId
  }
  return yt
}

/* ── 바깥에서 쓰는 것 ────────────────────────────────────── */
let current: Source | null = null
let vol = 0.6

export const player = {
  /** 재생을 시작한다. 브라우저가 막으면 false */
  async play(src: Source): Promise<boolean> {
    // 갈래가 바뀌면 이전 갈래는 확실히 멈춘다
    if (current && current.kind !== src.kind) this.pauseAll()
    current = src

    if (src.kind === 'builtin') return bgm.play(src.trackId)

    if (src.kind === 'file') {
      const el = await ensureAudio()
      if (!el) return false
      el.volume = vol
      try {
        await el.play()
        return true
      } catch {
        return false
      }
    }

    const p = await ensureYt(src.videoId)
    if (!p) return false
    p.setVolume(Math.round(vol * 100))
    p.playVideo()
    // 실제로 재생 중인지 잠깐 뒤에 확인한다 (1 = playing, 3 = buffering)
    await new Promise((r) => setTimeout(r, 400))
    const st = p.getPlayerState()
    return st === 1 || st === 3
  },

  pauseAll() {
    bgm.pause()
    audioEl?.pause()
    yt?.pauseVideo()
  },

  pause() {
    this.pauseAll()
  },

  setVolume(v: number) {
    vol = v
    bgm.setVolume(v)
    if (audioEl) audioEl.volume = v
    yt?.setVolume(Math.round(v * 100))
  },

  /** 한 곡 안에서 어디쯤인지 (0~1) */
  get progress(): number {
    if (!current) return 0
    if (current.kind === 'builtin') return bgm.progress
    if (current.kind === 'file') {
      const el = audioEl
      if (!el || !el.duration) return 0
      return el.currentTime / el.duration
    }
    if (!yt) return 0
    const d = yt.getDuration()
    return d ? yt.getCurrentTime() / d : 0
  },

  seek(frac: number) {
    if (!current) return
    if (current.kind === 'builtin') return bgm.seek(frac)
    if (current.kind === 'file') {
      const el = audioEl
      if (el?.duration) el.currentTime = frac * el.duration
      return
    }
    const d = yt?.getDuration() ?? 0
    if (yt && d) yt.seekTo(frac * d, true)
  },
}
