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
  getVideoData(): { title?: string; author?: string }
}

/**
 * 유튜브 플레이어는 만들자마자 쓸 수 없다. 틀(iframe)이 뜨고 onReady 가
 * 온 뒤에야 메서드가 붙는다. 그 전에 부르면 "is not a function" 으로 터지고,
 * 그게 리액트 정리 단계에서 나면 화면 전체가 하얗게 죽는다.
 * 그래서 준비가 끝난 뒤에만 yt 에 넣고, 부를 때도 한 번 더 확인한다.
 */
let yt: YtPlayer | null = null
let ytMaking: Promise<YtPlayer | null> | null = null
let ytReady: Promise<void> | null = null
let ytVideo = ''

/** 플레이어의 메서드를 안전하게 부른다. 아직 준비 전이면 아무 일도 없다. */
function ytCall<K extends keyof YtPlayer>(
  name: K,
  ...args: Parameters<Extract<YtPlayer[K], (...a: never[]) => unknown>>
): unknown {
  const p = yt as unknown as Record<string, unknown> | null
  const fn = p?.[name as string]
  if (typeof fn !== 'function') return undefined
  try {
    return (fn as (...a: unknown[]) => unknown).apply(p, args)
  } catch {
    return undefined
  }
}

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

  // 만드는 중에 또 부르면 틀이 두 개 생긴다. 만들던 약속을 같이 기다린다.
  if (!yt && ytMaking) await ytMaking

  if (!yt) {
    ytMaking = new Promise<YtPlayer | null>((resolve) => {
      let host = document.getElementById('ilog-yt')
      if (!host) {
        host = document.createElement('div')
        host.id = 'ilog-yt'
        // 소리만 쓰므로 화면에서 치워둔다 (display:none 이면 재생이 막히는 브라우저가 있다)
        host.style.cssText =
          'position:fixed;width:1px;height:1px;left:-9999px;top:0;opacity:0;pointer-events:none'
        document.body.appendChild(host)
      }
      // 틀이 영영 안 뜨는 경우(망 끊김 등)에도 여기서 멈춰 있지 않게
      const giveUp = setTimeout(() => resolve(null), 8000)
      const made = new w.YT.Player(host, {
        videoId,
        playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: videoId },
        events: {
          onReady: () => {
            clearTimeout(giveUp)
            // 준비가 끝난 지금에야 바깥에서 쓸 수 있게 넘긴다
            yt = made
            ytVideo = videoId
            tellTitle()
            resolve(made)
          },
        },
      })
    }).finally(() => {
      ytMaking = null
    })
    return ytMaking
  }

  if (ytVideo !== videoId) {
    ytCall('loadVideoById', videoId)
    ytVideo = videoId
    setTimeout(tellTitle, 800)
  }
  return yt
}

/* ── 바깥에서 쓰는 것 ────────────────────────────────────── */
let current: Source | null = null
let vol = 0.6

/**
 * 소리가 안 나는 이유. 화면에 다른 말을 띄우려고 구분해 둔다.
 *  blocked — 브라우저가 첫 소리를 막았다 (누르면 풀린다)
 *  missing — 틀 자체를 못 불러왔다 (누른다고 풀리지 않는다)
 */
export type Failure = 'blocked' | 'missing' | null
let failure: Failure = null
export const lastFailure = () => failure

/**
 * 유튜브가 알려준 영상 제목. 틀이 준비된 뒤에야 알 수 있어서,
 * 화면 쪽에서 여기에 귀를 대고 있다가 오면 받아 적는다.
 */
let ytTitleListeners: ((t: string) => void)[] = []
export function onYtTitle(fn: (t: string) => void) {
  ytTitleListeners.push(fn)
  return () => {
    ytTitleListeners = ytTitleListeners.filter((f) => f !== fn)
  }
}
function tellTitle() {
  const t = (ytCall('getVideoData') as { title?: string } | undefined)?.title
  if (t) ytTitleListeners.forEach((f) => f(t))
}

export const player = {
  /** 재생을 시작한다. 브라우저가 막으면 false */
  async play(src: Source): Promise<boolean> {
    // 갈래가 바뀌면 이전 갈래는 확실히 멈춘다
    if (current && current.kind !== src.kind) this.pauseAll()
    current = src
    failure = null

    if (src.kind === 'builtin') {
      const ok = await bgm.play(src.trackId)
      if (!ok) failure = 'blocked'
      return ok
    }

    if (src.kind === 'file') {
      const el = await ensureAudio()
      if (!el) {
        failure = 'missing'
        return false
      }
      el.volume = vol
      try {
        await el.play()
        return true
      } catch {
        failure = 'blocked'
        return false
      }
    }

    const p = await ensureYt(src.videoId)
    if (!p) {
      failure = 'missing'
      return false
    }
    ytCall('setVolume', Math.round(vol * 100))
    ytCall('playVideo')
    // 실제로 재생 중인지 잠깐 뒤에 확인한다 (1 = playing, 3 = buffering)
    await new Promise((r) => setTimeout(r, 400))
    const st = ytCall('getPlayerState')
    const ok = st === 1 || st === 3
    if (!ok) failure = 'blocked'
    // 제목은 재생이 시작돼야 채워지는 일이 많아 여기서 한 번 더 묻는다
    tellTitle()
    return ok
  },

  /**
   * 무조건 조용해져야 한다. 여기서 예외가 나면 리액트 정리 단계에서
   * 터지면서 화면이 통째로 하얘지므로, 한 갈래가 실패해도 나머지는 멈춘다.
   */
  pauseAll() {
    try {
      bgm.pause()
    } catch {
      /* 소리만 못 멈춘 것뿐 */
    }
    try {
      audioEl?.pause()
    } catch {
      /* 위와 같음 */
    }
    ytCall('pauseVideo')
  },

  pause() {
    this.pauseAll()
  },

  setVolume(v: number) {
    vol = v
    bgm.setVolume(v)
    if (audioEl) audioEl.volume = v
    ytCall('setVolume', Math.round(v * 100))
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
    const d = ytCall('getDuration') as number | undefined
    const t = ytCall('getCurrentTime') as number | undefined
    return d && t != null ? t / d : 0
  },

  seek(frac: number) {
    if (!current) return
    if (current.kind === 'builtin') return bgm.seek(frac)
    if (current.kind === 'file') {
      const el = audioEl
      if (el?.duration) el.currentTime = frac * el.duration
      return
    }
    const d = (ytCall('getDuration') as number | undefined) ?? 0
    if (d) ytCall('seekTo', frac * d, true)
  },
}
