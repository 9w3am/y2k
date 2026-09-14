import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useSite } from '../lib/store'
import { readShareCode } from '../lib/share'
import { pauseWrites } from '../lib/storage'

const KEY = 'ilog:share'

/**
 * 공유 주소(#/v/...)로 들어왔을 때.
 * 남의 내용을 얹고 구경 모드로 바꾼 뒤 대문으로 보낸다.
 * 새로고침해도 유지되도록 코드를 이 창에만 기억해 둔다.
 */
export function SharedLoader() {
  const { code = '' } = useParams()
  const loadShared = useSite((s) => s.loadShared)
  const [done, setDone] = useState<'loading' | 'ok' | 'fail'>('loading')

  useEffect(() => {
    let alive = true
    void readShareCode(code).then((data) => {
      if (!alive) return
      if (!data) return setDone('fail')
      try {
        sessionStorage.setItem(KEY, code)
      } catch {
        /* 못 기억해도 이번 방문은 된다 */
      }
      pauseWrites(true)
      loadShared(data as never)
      setDone('ok')
    })
    return () => {
      alive = false
    }
  }, [code, loadShared])

  if (done === 'loading') return <div className="share-wait">불러오는 중…</div>
  if (done === 'fail')
    return (
      <div className="share-wait">
        주소를 읽지 못했습니다.
        <br />
        링크가 잘렸는지 확인해 주세요.
      </div>
    )
  return <Navigate to="/home" replace />
}

/** 새로고침해도 구경 모드가 이어지게 한다 */
export function useRestoreShared() {
  const viewing = useSite((s) => s.viewing)
  const loadShared = useSite((s) => s.loadShared)

  useEffect(() => {
    if (viewing) return
    let code = ''
    try {
      code = sessionStorage.getItem(KEY) ?? ''
    } catch {
      return
    }
    if (!code) return
    void readShareCode(code).then((data) => {
      if (!data) return
      pauseWrites(true)
      loadShared(data as never)
    })
  }, [viewing, loadShared])
}

/** 구경 중이라는 표시 */
export function ViewingBar() {
  const viewing = useSite((s) => s.viewing)
  const nick = useSite((s) => s.me.nick)
  if (!viewing) return null
  return (
    <div className="viewing-bar">
      <b>구경 중</b>
      <span>{nick} 님의 기록장</span>
      <button
        className="btn"
        onClick={() => {
          try {
            sessionStorage.removeItem(KEY)
            sessionStorage.removeItem('ilog:visit')
          } catch {
            /* 무시 */
          }
          pauseWrites(false)
          location.hash = '#/home'
          location.reload()
        }}
      >
        내 기록장으로
      </button>
    </div>
  )
}
