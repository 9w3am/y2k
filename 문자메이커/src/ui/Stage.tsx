import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

/**
 * 고정 픽셀 캔버스를 통째로 축소해서 무대 가운데에 놓는다.
 * 내부 요소는 절대 재배치되지 않는다 — 옛날 화면은 리플로우되지 않았다.
 * 폰 몸체를 켜면 캔버스가 그만큼 커지고, 저장한 PNG 에도 몸체가 같이 담긴다.
 */
export function Stage({
  w,
  h,
  zoom,
  round,
  canvasRef,
  children,
  hint,
  tools,
  typing = false,
  onDone,
}: {
  /** 폰에서 글자를 고치는 중 — 폭에 맞춰 크게, 넘치면 칸 안에서 내린다 */
  typing?: boolean
  onDone?: () => void
  w: number
  h: number
  zoom: number
  /** 화면 모서리 둥글기 (0 이면 각진 화면) */
  round: number
  canvasRef: RefObject<HTMLDivElement | null>
  children: ReactNode
  hint?: string
  /** 무대 안 왼쪽 아래에 놓이는 되돌리기·확대 단추들 */
  tools?: ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)


  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      // 넓은 화면에서는 여백을 넉넉히, 폰에서는 아껴 쓴다.
      // 폰에서 56px 을 떼면 가뜩이나 좁은 화면이 더 작아진다.
      // 세로로는 아래 확대 단추가 앉을 자리를 따로 빼둔다.
      const narrow = el.clientWidth < 620
      const padX = narrow ? 18 : 56
      const padY = narrow ? 78 : 56
      // 입력 중에는 키보드 위 남은 칸에 화면 전체가 들어오게 — 확대 단추 자리를 뺄 필요도 없다
      const s = typing
        ? Math.min((el.clientWidth - 16) / w, (el.clientHeight - 48 - 14) / h) // 48 = 위 완료 띠
        : Math.min((el.clientWidth - padX) / w, (el.clientHeight - padY) / h)
      setFit(Math.max(0.12, Math.min(2.2, s)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w, h, typing])

  const scale = fit * zoom

  return (
    <div className="stage" ref={box}>
      <div className="stage-inner" style={{ width: w * scale, height: h * scale }}>
        <div className="canvas-wrap" style={{ width: w, height: h, transform: `scale(${scale})` }}>
          <div className="canvas" ref={canvasRef} style={{ width: w, height: h, borderRadius: round }}>
            {children}
          </div>
        </div>
      </div>
      {!typing && tools}
      {!typing && hint && <div className="stage-hint">{hint}</div>}
      {typing && (
        <div className="typing-bar">
        <button
          className="typing-done"
          // 누르는 순간 바로 끝낸다 — 사파리는 누른 뒤 click 이 안 오는 때가 있다
          onPointerDown={(e) => {
            e.preventDefault()
            onDone?.()
          }}
        >
          완료
        </button>
        </div>
      )}
    </div>
  )
}
