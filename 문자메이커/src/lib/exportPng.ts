import { toPng } from 'html-to-image'
import { say } from '../ui/dialog'

const pad = (n: number) => String(n).padStart(2, '0')

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

/**
 * 캔버스를 PNG로 뽑는다.
 * 편집 흔적(점선, 커서, 플레이스홀더)은 data-exporting 플래그로 CSS에서 전부 꺼진다.
 */
/**
 * 둥근 모서리를 확실하게 잘라낸다.
 * 화면 캡처 단계의 클리핑만 믿으면 모서리에 반투명 찌꺼기가 남는다.
 */
async function clipCorners(dataUrl: string, radius: number): Promise<string> {
  if (radius <= 0) return dataUrl
  const img = new Image()
  img.src = dataUrl
  await img.decode()

  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext('2d')!
  const r = Math.min(radius, img.width / 2, img.height / 2)

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
  ctx.drawImage(img, 0, 0)
  return c.toDataURL('image/png')
}

export async function exportPng(
  node: HTMLElement,
  themeId: string,
  ratio = 2,
  /** 화면 모서리 둥글기(CSS 픽셀). 0 이면 각진 화면 */
  radius = 0,
): Promise<void> {
  const root = document.documentElement
  root.dataset.exporting = '1'

  // 캐럿이 남아 있으면 캡처에 잡힌다
  const active = document.activeElement as HTMLElement | null
  active?.blur?.()
  window.getSelection()?.removeAllRanges()

  try {
    if (document.fonts?.ready) await document.fonts.ready
    // 플래그 적용된 스타일이 실제로 그려질 때까지 두 프레임 대기
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const url = await toPng(node, {
      pixelRatio: ratio,
      cacheBust: true,
      width: node.offsetWidth,
      height: node.offsetHeight,
      style: { transform: 'none', transformOrigin: 'top left', margin: '0' },
    })

    const a = document.createElement('a')
    a.download = `retro_${themeId}_${stamp()}.png`
    a.href = await clipCorners(url, radius * ratio)
    a.click()
  } catch {
    void say('저장하지 못했습니다', '잠시 후 다시 시도해 주세요.')
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
        const hasAlpha = file.type === 'image/png' || file.type === 'image/webp'
        resolve(hasAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.88))
      }
      img.src = fr.result as string
    }
    fr.readAsDataURL(file)
  })
}
