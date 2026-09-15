import { useState, type ReactNode } from 'react'
import { useIsAdmin, useSiteText, type SiteText } from '../lib/admin'
import { useSession } from '../lib/supabase'
import { AuthBox } from './Account'

const today = () => new Date().toISOString().slice(0, 10)
const HIDE_KEY = 'ilog:popup-hide'

/**
 * 사이트 전체 문지기 — 운영자가 켠 점검 모드와 팝업 공지.
 * 점검 중에는 운영자 말고는 안내만 보인다 (운영자가 들어올 수 있게 로그인 칸은 남긴다).
 */
export function SiteGate({ children }: { children: ReactNode }) {
  const site = useSiteText()
  const admin = useIsAdmin()
  const { session, ready } = useSession()

  if (site.maintenance && admin !== true) {
    if (!ready || (session && admin === null)) return <div className="share-wait">불러오는 중…</div>
    return (
      <div className="maint">
        <div className="panel maint-box">
          <h3>점검 중</h3>
          <p>{site.maintenanceMsg || '지금은 점검 중입니다. 잠시 후 다시 들러 주세요.'}</p>
          <details className="maint-login">
            <summary>운영자 로그인</summary>
            <AuthBox />
          </details>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      <PopupNotice site={site} />
    </>
  )
}

/** 그 시절 대문 팝업 — '오늘 하루 보지 않기' */
function PopupNotice({ site }: { site: SiteText }) {
  const mark = `${today()}|${site.popupTitle}`
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDE_KEY) === mark
    } catch {
      return false
    }
  })
  const [closed, setClosed] = useState('')

  if (!site.popupTitle || hidden || closed === site.popupTitle) return null

  return (
    <div className="dlg-back" role="dialog" aria-modal="true" aria-label={site.popupTitle}>
      <div className="dlg">
        <div className="dlg-tb">
          <b>{site.popupTitle}</b>
        </div>
        <div className="dlg-body popup-body">{site.popupBody}</div>
        <div className="dlg-foot">
          <button
            className="btn"
            onClick={() => {
              try {
                localStorage.setItem(HIDE_KEY, mark)
              } catch {
                /* 못 기억해도 이번엔 닫힌다 */
              }
              setHidden(true)
            }}
          >
            오늘 하루 보지 않기
          </button>
          <button className="btn btn-main" autoFocus onClick={() => setClosed(site.popupTitle)}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
