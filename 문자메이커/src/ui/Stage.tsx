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
}: {
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
      const pad = 56
      const s = Math.min((el.clientWidth - pad) / w, (el.clientHeight - pad) / h)
      setFit(Math.max(0.12, Math.min(2.2, s)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w, h])

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
      {tools}
      {hint && <div className="stage-hint">{hint}</div>}
    </div>
  )
}
