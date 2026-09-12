import { useEffect, useState } from 'react'

/* ══════════════════════════════════════════════════════════
   자체 대화상자
   브라우저 기본 confirm() 은 환경에 따라 창을 띄우지 않고
   그냥 false 를 돌려준다. 그러면 '초기화'나 '지우기'가 조용히
   씹힌다. 그래서 직접 그린다.
   ══════════════════════════════════════════════════════════ */

interface Req {
  kind: 'say' | 'ask'
  title: string
  body?: string
  ok: string
  resolve: (v: boolean) => void
}

let push: ((r: Req | null) => void) | null = null

export const say = (title: string, body?: string) =>
  new Promise<boolean>((resolve) => {
    if (!push) {
      resolve(true)
      return
    }
    push({ kind: 'say', title, body, ok: '확인', resolve })
  })

export const ask = (title: string, body?: string, ok = '실행') =>
  new Promise<boolean>((resolve) => {
    if (!push) {
      resolve(false)
      return
    }
    push({ kind: 'ask', title, body, ok, resolve })
  })

export function DialogHost() {
  const [req, setReq] = useState<Req | null>(null)

  useEffect(() => {
    push = setReq
    return () => {
      push = null
    }
  }, [])

  useEffect(() => {
    if (!req) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!req) return null

  function close(v: boolean) {
    req?.resolve(v)
    setReq(null)
  }

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={req.title}
      onClick={(e) => e.target === e.currentTarget && close(false)}
    >
      <div className="modal" style={{ width: 'min(400px, 100%)' }}>
        <div className="modal-h">
          <h2 style={{ fontSize: 15 }}>{req.title}</h2>
          {req.body && <p style={{ marginTop: 6, lineHeight: 1.7 }}>{req.body}</p>}
        </div>
        <div className="modal-f">
          {req.kind === 'ask' && (
            <button className="btn" onClick={() => close(false)}>
              취소
            </button>
          )}
          <button className="btn btn-primary" autoFocus onClick={() => close(true)}>
            {req.ok}
          </button>
        </div>
      </div>
    </div>
  )
}
