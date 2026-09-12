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
 * 미니홈피를 보이는 그대로 PNG 로 뽑는다.
 * 스킨 바탕까지 같이 담아야 화면과 같아 보이므로,
 * 본문 아래에 body 의 배경을 그대로 깔아준다.
 */
export async function exportHompy(node: HTMLElement, ratio = 3): Promise<void> {
  const root = document.documentElement
  root.dataset.exporting = '1'

  const active = document.activeElement as HTMLElement | null
  active?.blur?.()
  window.getSelection()?.removeAllRanges()

  try {
    if (document.fonts?.ready) await document.fonts.ready
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const bodyCs = getComputedStyle(document.body)

    const url = await toPng(node, {
      pixelRatio: ratio,
      cacheBust: true,
      width: node.offsetWidth,
      height: node.offsetHeight,
      style: {
        // 화면에서 보이던 스킨 바탕을 그대로 깔아준다.
        // body 는 background-attachment: fixed 라서 그대로 베끼면
        // 복제본에서 무늬가 사라진다 — scroll 로 바꿔 붙인다.
        backgroundColor: bodyCs.backgroundColor,
        backgroundImage: bodyCs.backgroundImage,
        backgroundSize: bodyCs.backgroundSize,
        backgroundRepeat: bodyCs.backgroundRepeat,
        backgroundPosition: '0 0',
        backgroundAttachment: 'scroll',
        // 화면 높이에 맞춰 늘려둔 규칙은 저장할 때 방해가 된다
        minHeight: 'auto',
        margin: '0',
      },
    })

    const a = document.createElement('a')
    a.download = `ilog_${stamp()}.png`
    a.href = url
    a.click()
  } catch {
    void say('저장하지 못했습니다', '잠시 후 다시 시도해 주세요.')
  } finally {
    delete root.dataset.exporting
  }
}
