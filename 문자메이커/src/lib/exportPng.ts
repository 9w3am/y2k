import { toCanvas } from 'html-to-image'
import { say } from '../ui/dialog'
import { buildFontCss, paintScreenFx } from './exportFx'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * 바뀐 스타일이 그려질 때까지 기다린다.
 * 다른 탭을 보고 있으면 requestAnimationFrame 이 아예 안 불려 저장이 멈춘다 —
 * 짧은 타이머로도 풀리게 한다.
 */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    requestAnimationFrame(() => requestAnimationFrame(finish))
    setTimeout(finish, 120)
  })
}

function stamp(): string {
  const d = new Date()
  return (
    String(d.getFullYear()).slice(2) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '-' +
    pad(d.getHours()) +
    pad(d.getMinutes())
  )
}

const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
/** 아이폰·아이패드 (요즘 아이패드는 맥 흉내를 낸다) */
const isIOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
/** 카톡·인스타 같은 앱 안 브라우저 — 내려받기가 막혀 있다 */
const isInApp = /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER|DaumApps|everytimeApp/i.test(ua)
/** 사파리 엔진 — 아이폰은 브라우저 이름과 상관없이 전부 이것 */
const isWebKit = /AppleWebKit/.test(ua) && !/Chrome|Chromium|CriOS|Android/.test(ua)
const isTouch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

/**
 * 뽑을 수 있는 가장 큰 배율.
 * 브라우저 캔버스는 넓이 한도가 있다. 폰은 메모리가 작아 한도보다 한참 전에 죽으므로 더 낮게 잡는다.
 */
export function maxRatio(w: number, h: number, cap = 6): number {
  const LIMIT = isIOS || isTouch ? 7_000_000 : 16_000_000
  return Math.max(1, Math.min(cap, Math.floor(Math.sqrt(LIMIT / (w * h)))))
}

/** 화면 속 사진(배경 그림·img)이 다 풀려 있을 때까지 기다린다 — 덜 풀린 채 찍으면 사진이 빠진다 */
async function waitImages(node: HTMLElement): Promise<void> {
  const urls = new Set<string>()
  node.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const bg = getComputedStyle(el).backgroundImage
    for (const m of bg.matchAll(/url\("?(.*?)"?\)/g)) urls.add(m[1])
  })
  node.querySelectorAll('img').forEach((img) => img.src && urls.add(img.src))
  await Promise.all(
    [...urls].map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = img.onerror = () => resolve()
          img.src = src
          void img.decode?.().then(resolve, resolve)
        }),
    ),
  )
}

/** 둥근 모서리를 확실하게 잘라낸다 — 캡처 단계의 클리핑만 믿으면 모서리에 반투명 찌꺼기가 남는다 */
function clipCorners(src: HTMLCanvasElement, radius: number): HTMLCanvasElement {
  if (radius <= 0) return src
  const c = document.createElement('canvas')
  c.width = src.width
  c.height = src.height
  const ctx = c.getContext('2d')!
  const r = Math.min(radius, c.width / 2, c.height / 2)
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(c.width - r, 0)
  ctx.quadraticCurveTo(c.width, 0, c.width, r)
  ctx.lineTo(c.width, c.height - r)
  ctx.quadraticCurveTo(c.width, c.height, c.width - r, c.height)
  ctx.lineTo(r, c.height)
  ctx.quadraticCurveTo(0, c.height, 0, c.height - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(src, 0, 0)
  return c
}

const toBlob = (c: HTMLCanvasElement) =>
  new Promise<Blob | null>((resolve) => c.toBlob((b) => resolve(b), 'image/png'))

/** 내려받기가 막힌 곳(아이폰 일부·앱 안 브라우저)에서는 그림을 띄워 길게 눌러 저장하게 한다 */
function showForLongPress(url: string, name: string) {
  const wrap = document.createElement('div')
  wrap.className = 'png-sheet'
  wrap.innerHTML = `<div class="png-sheet-box"><p>사진을 길게 눌러 저장하세요</p><img alt="${name}"><button class="btn btn-primary">닫기</button></div>`
  wrap.querySelector('img')!.src = url
  const close = () => {
    wrap.remove()
    URL.revokeObjectURL(url)
  }
  wrap.querySelector('button')!.onclick = close
  wrap.onclick = (e) => e.target === wrap && close()
  document.body.appendChild(wrap)
}

async function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  if (isInApp) return showForLongPress(url, name)
  // 아이폰은 파일 공유 창으로 넘기는 편이 사진 앱에 바로 들어가 편하다
  if (isIOS && navigator.canShare?.({ files: [new File([blob], name, { type: 'image/png' })] })) {
    try {
      await navigator.share({ files: [new File([blob], name, { type: 'image/png' })] })
      URL.revokeObjectURL(url)
      return
    } catch (e) {
      // 사용자가 공유 창을 닫은 것 — 그림을 띄워 둔다
      if ((e as Error).name === 'AbortError') return URL.revokeObjectURL(url)
      return showForLongPress(url, name)
    }
  }
  const a = document.createElement('a')
  a.download = name
  a.href = url
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * 캔버스를 PNG로 뽑는다 — 화면에 보이는 그대로.
 * 편집 흔적(점선, 커서, 플레이스홀더)은 data-exporting 플래그로 CSS에서 전부 꺼진다.
 */
export async function exportPng(
  node: HTMLElement,
  themeId: string,
  ratio = maxRatio(node.offsetWidth, node.offsetHeight),
  /** 화면 모서리 둥글기(CSS 픽셀). 0 이면 각진 화면 */
  radius = 0,
): Promise<void> {
  const root = document.documentElement
  root.dataset.exporting = '1'

  // 캐럿이 남아 있으면 캡처에 잡힌다
  const active = document.activeElement as HTMLElement | null
  active?.blur?.()
  window.getSelection()?.removeAllRanges()

  const w = node.offsetWidth
  const h = node.offsetHeight
  let fontEmbedCSS = ''
  const opts = (pixelRatio: number) => ({
    pixelRatio,
    fontEmbedCSS,
    // 화면 효과 층은 빼고 찍고, 캔버스에 직접 칠한다 (사파리가 겹침을 네모로 망친다)
    filter: (n: HTMLElement) => !n.classList?.contains('screenfx'),
    // ?숫자 를 붙이면 blob: 주소가 깨진다
    cacheBust: false,
    width: w,
    height: h,
    style: { transform: 'none', transformOrigin: 'top left', margin: '0' },
  })

  let lastErr: unknown = null
  try {
    if (document.fonts?.ready) await document.fonts.ready
    await nextPaint()
    await waitImages(node)
    fontEmbedCSS = await buildFontCss(node)
    // 미리 작게 그려 둔다 — 사파리는 처음 몇 번은 사진·글꼴을 빼먹고 그린다
    for (let i = 0; i < (isWebKit ? 2 : 1); i++) await toCanvas(node, opts(isWebKit ? ratio : 1)).catch(() => null)

    // 한도에 걸려 실패하면 배율을 낮춰 다시 찍는다
    for (const r of [...new Set([ratio, Math.min(ratio, 4), Math.min(ratio, 3), 2, 1])].filter((n) => n <= ratio)) {
      try {
        const shot = await toCanvas(node, opts(r))
        paintScreenFx(shot, node, r)
        const canvas = clipCorners(shot, radius * r)
        const blob = await toBlob(canvas)
        if (!blob || blob.size < 1000) throw new Error('빈 그림')
        await download(blob, `retro_${themeId}_${stamp()}.png`)
        return
      } catch (e) {
        lastErr = e
      }
    }
    throw lastErr
  } catch (e) {
    const why = e instanceof Error && e.message ? e.message : String(e ?? '')
    void say('저장하지 못했습니다', why ? `이유: ${why.slice(0, 120)}` : '잠시 후 다시 시도해 주세요.')
  } finally {
    delete root.dataset.exporting
  }
}

/**
 * 업로드한 이미지를 localStorage 에 들어갈 크기로 줄인다.
 * 원본을 그대로 넣으면 5MB 한도를 바로 넘긴다.
 */
export function readImageScaled(file: File, maxSide = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onerror = () => reject(new Error('read'))
    fr.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode'))
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        // 투명한 그림만 PNG 로 — 사진을 PNG 로 두면 수 MB 가 돼 브라우저 저장 한도를 넘고 새로고침하면 사라진다
        const png = file.type === 'image/png' || file.type === 'image/webp' ? c.toDataURL('image/png') : ''
        resolve(png && png.length < 1_500_000 ? png : c.toDataURL('image/jpeg', 0.9))
      }
      img.src = fr.result as string
    }
    fr.readAsDataURL(file)
  })
}
