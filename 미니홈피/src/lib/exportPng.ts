import { toPng } from 'html-to-image'
import { say } from '../ui/dialog'

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

/**
 * 미니홈피를 보이는 그대로 PNG 로 뽑는다.
 * 스킨 바탕까지 같이 담아야 화면과 같아 보이므로,
 * 본문 아래에 body 의 배경을 그대로 깔아준다.
 */
/**
 * 뽑을 수 있는 가장 큰 배율.
 * 브라우저 캔버스는 넓이 한도가 있다(아이폰 사파리가 제일 빡빡해 약 1,670만 화소).
 * 한도 안에서 최대 6배까지 키워, 확대해서 봐도 글자가 뭉개지지 않게 한다.
 */
export function maxRatio(w: number, h: number, cap = 6): number {
  const LIMIT = 16_000_000
  return Math.max(1, Math.min(cap, Math.floor(Math.sqrt(LIMIT / (w * h)))))
}

/**
 * 지금 보는 모드 그대로 뽑는다.
 *  웹       — 위 메뉴줄까지 달린 페이지 전체
 *  프로그램 — 제목줄·메뉴·도구줄·상태줄이 달린 창 한 장. 창 안 내용은 끝까지 펼친다.
 */
export async function exportScreen(mode: 'web' | 'app'): Promise<void> {
  const node = document.querySelector(mode === 'app' ? '.win' : '#root')
  if (node instanceof HTMLElement) await exportHompy(node, undefined, mode)
}

export async function exportHompy(
  node: HTMLElement,
  ratio?: number,
  mode: 'web' | 'app' = 'web',
): Promise<void> {
  const root = document.documentElement
  // 'app' 이면 창을 끝까지 펼치는 규칙이 켜진다 (app.css)
  root.dataset.exporting = mode

  const active = document.activeElement as HTMLElement | null
  active?.blur?.()
  window.getSelection()?.removeAllRanges()

  try {
    if (document.fonts?.ready) await document.fonts.ready
    await nextPaint()

    // 펼쳐진 뒤의 크기로 재야 한다
    const w = node.offsetWidth
    const h = node.offsetHeight
    if (!w || !h) throw new Error('보이지 않는 창')
    const r = ratio ?? maxRatio(w, h)

    const bodyCs = getComputedStyle(document.body)
    // 창은 제 바탕이 있으니 그대로 두고, 웹 페이지만 스킨 바탕을 깔아준다
    const pageBg =
      mode === 'web'
        ? {
            // body 는 background-attachment: fixed 라서 그대로 베끼면
            // 복제본에서 무늬가 사라진다 — scroll 로 바꿔 붙인다.
            backgroundColor: bodyCs.backgroundColor,
            backgroundImage: bodyCs.backgroundImage,
            backgroundSize: bodyCs.backgroundSize,
            backgroundRepeat: bodyCs.backgroundRepeat,
            backgroundPosition: '0 0',
            backgroundAttachment: 'scroll',
          }
        : {}

    const url = await toPng(node, {
      pixelRatio: r,
      // 사진은 보관소에서 꺼낸 blob: 주소다. 캐시를 깨려고 ?숫자 를 붙이면
      // 그 주소를 못 찾아 저장본에서 사진이 빠진다.
      cacheBust: false,
      width: w,
      height: h,
      style: {
        ...pageBg,
        // 화면 높이에 맞춰 늘려둔 규칙은 저장할 때 방해가 된다
        minHeight: 'auto',
        margin: '0',
      },
    })

    const a = document.createElement('a')
    a.download = `ilog_${mode === 'app' ? 'program' : 'web'}_${stamp()}.png`
    a.href = url
    a.click()
  } catch {
    void say('저장하지 못했습니다', '잠시 후 다시 시도해 주세요.')
  } finally {
    delete root.dataset.exporting
  }
}
