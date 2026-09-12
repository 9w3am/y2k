import { useEffect, useState } from 'react'

/* ══════════════════════════════════════════════════════════
   자체 대화상자
   브라우저 기본 confirm() 은 환경에 따라 창을 띄우지 않고
   그냥 false 를 돌려준다. 그러면 '지우기'가 조용히 씹힌다.
   그 시절 웹사이트가 쓰던 작은 창 모양으로 직접 그린다.
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
    if (!push) return resolve(true)
    push({ kind: 'say', title, body, ok: '확인', resolve })
  })

export const ask = (title: string, body?: string, ok = '확인') =>
  new Promise<boolean>((resolve) => {
    if (!push) return resolve(false)
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
      if (e.key === 'Escape') done(false)
      if (e.key === 'Enter') done(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function done(v: boolean) {
    req?.resolve(v)
    setReq(null)
  }

  if (!req) return null

  return (
    <div
      className="dlg-back"
      role="dialog"
      aria-modal="true"
      aria-label={req.title}
      onClick={(e) => e.target === e.currentTarget && done(false)}
    >
      <div className="dlg">
        <div className="dlg-tb">
          <span className="dlg-ico" aria-hidden="true">
            ♥
          </span>
          아이로그
        </div>
        <div className="dlg-body">
          <strong>{req.title}</strong>
          {req.body && <p>{req.body}</p>}
        </div>
        <div className="dlg-foot">
          {req.kind === 'ask' && (
            <button className="btn" onClick={() => done(false)}>
              취소
            </button>
          )}
          <button className="btn btn-main" autoFocus onClick={() => done(true)}>
            {req.ok}
          </button>
        </div>
      </div>
    </div>
  )
}
