import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useSite } from '../lib/store'
import { pauseWrites } from '../lib/storage'
import { endRecovery, useRecovery, useSession } from '../lib/supabase'
import {
  HANDLE_RE,
  fetchHomeByHandle,
  sendReset,
  setNewPassword,
  signIn,
  signOut,
  signUp,
  useSyncStatus,
  type SyncStatus,
} from '../lib/cloud'

const VISIT = 'ilog:visit'

const STATUS_TEXT: Record<SyncStatus, string> = {
  off: '',
  loading: '불러오는 중',
  saving: '저장 중',
  saved: '저장됨',
  error: '저장 안 됨',
  nosetup: '서버 준비 전',
}

type Msg = { kind: 'err' | 'ok'; text: string } | null

/** 아이디로 남의 기록장에 놀러가기 */
function VisitRow() {
  const nav = useNavigate()
  const [value, setValue] = useState('')
  const go = () => {
    const h = value.trim().toLowerCase()
    if (HANDLE_RE.test(h)) nav(`/u/${h}`)
  }
  return (
    <div className="auth-visit">
      <input
        className="inp"
        placeholder="아이디로 놀러가기"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            go()
          }
        }}
        aria-label="놀러갈 아이디"
      />
      <button type="button" className="btn" onClick={go}>
        가기
      </button>
    </div>
  )
}

/* ── 대문 로그인 칸 ─────────────────────────────────────── */
export function AuthBox() {
  const { session, ready } = useSession()
  const recovery = useRecovery()
  const status = useSyncStatus()
  const nick = useSite((s) => s.me.nick)
  const nav = useNavigate()

  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [handle, setHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }
  const switchTo = (m: 'in' | 'up' | 'reset') => {
    setMode(m)
    setMsg(null)
  }

  if (!ready) return <div className="auth-wait">…</div>

  // 비밀번호 찾기 메일로 돌아온 참
  if (recovery && session)
    return (
      <form
        className="auth"
        onSubmit={(e) => {
          e.preventDefault()
          void run(async () => {
            if (pw !== pw2) return setMsg({ kind: 'err', text: '비밀번호가 서로 다릅니다' })
            const r = await setNewPassword(pw)
            if (!r.ok) return setMsg({ kind: 'err', text: r.msg })
            endRecovery()
            setPw('')
            setPw2('')
            setMsg({ kind: 'ok', text: '비밀번호를 바꿨습니다' })
          })
        }}
      >
        <b className="auth-title">새 비밀번호</b>
        <input
          className="inp"
          type="password"
          placeholder="새 비밀번호 (6자 이상)"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          aria-label="새 비밀번호"
        />
        <input
          className="inp"
          type="password"
          placeholder="한 번 더"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          autoComplete="new-password"
          required
          aria-label="새 비밀번호 한 번 더"
        />
        {msg && <p className={`auth-msg ${msg.kind}`}>{msg.text}</p>}
        <button className="btn btn-main auth-wide" type="submit" disabled={busy}>
          {busy ? '잠시만요…' : '바꾸기'}
        </button>
      </form>
    )

  if (session)
    return (
      <div className="auth">
        <div className="auth-me">
          <span>
            <b>{nick}</b> 님
          </span>
          <small>{session.user.email}</small>
        </div>
        {STATUS_TEXT[status] && <div className={`auth-sync s-${status}`}>{STATUS_TEXT[status]}</div>}
        <button className="btn btn-main auth-wide" onClick={() => nav('/home')}>
          내 기록장 들어가기
        </button>
        <button className="btn auth-wide" onClick={() => void signOut()}>
          로그아웃
        </button>
        <VisitRow />
      </div>
    )

  return (
    <div className="auth">
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode !== 'up'}
          className={mode !== 'up' ? 'on' : ''}
          onClick={() => switchTo('in')}
        >
          로그인
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'up'}
          className={mode === 'up' ? 'on' : ''}
          onClick={() => switchTo('up')}
        >
          회원가입
        </button>
      </div>

      <form
        className="auth"
        onSubmit={(e) => {
          e.preventDefault()
          if (mode === 'in')
            void run(async () => {
              const r = await signIn(email.trim(), pw)
              if (!r.ok) return setMsg({ kind: 'err', text: r.msg })
              nav('/home')
            })
          else if (mode === 'up')
            void run(async () => {
              if (pw !== pw2) return setMsg({ kind: 'err', text: '비밀번호가 서로 다릅니다' })
              const r = await signUp(email.trim(), pw, handle.trim())
              if (!r.ok) return setMsg({ kind: 'err', text: r.msg })
              if (!r.confirm) return nav('/home')
              setMode('in')
              setPw('')
              setPw2('')
              setMsg({
                kind: 'ok',
                text: `${email.trim()} 로 확인 메일을 보냈습니다. 메일의 링크를 누르면 가입이 끝납니다.`,
              })
            })
          else
            void run(async () => {
              const r = await sendReset(email.trim())
              setMsg(
                r.ok
                  ? { kind: 'ok', text: '비밀번호를 바꾸는 메일을 보냈습니다' }
                  : { kind: 'err', text: r.msg },
              )
            })
        }}
      >
        {mode === 'up' && (
          <input
            className="inp"
            placeholder="아이디 (영어 소문자·숫자·_)"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            maxLength={20}
            autoComplete="username"
            required
            aria-label="아이디"
          />
        )}
        <input
          className="inp"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          aria-label="이메일"
        />
        {mode !== 'reset' && (
          <input
            className="inp"
            type="password"
            placeholder={mode === 'up' ? '비밀번호 (6자 이상)' : '비밀번호'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
            required
            minLength={6}
            aria-label="비밀번호"
          />
        )}
        {mode === 'up' && (
          <input
            className="inp"
            type="password"
            placeholder="비밀번호 한 번 더"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            autoComplete="new-password"
            required
            aria-label="비밀번호 한 번 더"
          />
        )}
        {msg && <p className={`auth-msg ${msg.kind}`}>{msg.text}</p>}
        <button className="btn btn-main auth-wide" type="submit" disabled={busy}>
          {busy ? '잠시만요…' : mode === 'in' ? '들어가기' : mode === 'up' ? '가입하기' : '메일 보내기'}
        </button>
      </form>

      <div className="login-links">
        {mode === 'reset' ? (
          <button type="button" className="link-btn" onClick={() => switchTo('in')}>
            로그인으로
          </button>
        ) : (
          <button type="button" className="link-btn" onClick={() => switchTo('reset')}>
            비밀번호 찾기
          </button>
        )}
        <span>·</span>
        <button type="button" className="link-btn" onClick={() => nav('/home')}>
          가입 없이 써보기
        </button>
      </div>

      <VisitRow />
    </div>
  )
}

/* ── 윗줄 계정 단추 ─────────────────────────────────────── */
export function AccountChip() {
  const { session } = useSession()
  const status = useSyncStatus()
  const nav = useNavigate()
  if (!session)
    return (
      <button className="btn acct" onClick={() => nav('/')}>
        로그인
      </button>
    )
  return (
    <button className={`btn acct s-${status}`} onClick={() => nav('/')} aria-label="계정">
      {STATUS_TEXT[status] || '로그인됨'}
    </button>
  )
}

/* ── #/u/아이디 — 남의 기록장 구경 ─────────────────────── */
export function VisitLoader() {
  const { handle = '' } = useParams()
  const loadShared = useSite((s) => s.loadShared)
  const [state, setState] = useState<'loading' | 'ok' | 'none' | 'nosetup'>('loading')

  useEffect(() => {
    let alive = true
    const h = handle.toLowerCase()
    void fetchHomeByHandle(h).then((r) => {
      if (!alive) return
      if (r === 'nosetup') return setState('nosetup')
      if (!r) return setState('none')
      try {
        sessionStorage.setItem(VISIT, h)
      } catch {
        /* 못 기억해도 이번 방문은 된다 */
      }
      pauseWrites(true)
      loadShared(r as never)
      setState('ok')
    })
    return () => {
      alive = false
    }
  }, [handle, loadShared])

  if (state === 'loading') return <div className="share-wait">불러오는 중…</div>
  if (state === 'none') return <div className="share-wait">{handle} 님의 기록장을 찾지 못했습니다.</div>
  if (state === 'nosetup') return <div className="share-wait">아직 준비 중입니다.</div>
  return <Navigate to="/home" replace />
}

/** 새로고침해도 구경이 이어지게 */
export function useRestoreVisit() {
  const viewing = useSite((s) => s.viewing)
  const loadShared = useSite((s) => s.loadShared)
  useEffect(() => {
    if (viewing) return
    let h = ''
    try {
      h = sessionStorage.getItem(VISIT) ?? ''
    } catch {
      return
    }
    if (!h) return
    void fetchHomeByHandle(h).then((r) => {
      if (!r || r === 'nosetup') return
      pauseWrites(true)
      loadShared(r as never)
    })
  }, [viewing, loadShared])
}
