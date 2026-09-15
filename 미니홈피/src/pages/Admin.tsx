import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../lib/supabase'
import { useSite } from '../lib/store'
import {
  adminDeleteGuest,
  adminDeleteHome,
  adminListGuest,
  adminListHomes,
  adminSetHidden,
  saveSiteText,
  useIsAdmin,
  useSiteText,
  type AdminGuest,
  type AdminHome,
  type Result,
  type SiteText,
} from '../lib/admin'
import { ask, say } from '../ui/dialog'

type Tab = 'site' | 'members' | 'guest'

/* ══ 운영 페이지 — 운영자 계정으로 로그인했을 때만 ══════════ */
export function AdminPage() {
  const { ready } = useSession()
  const admin = useIsAdmin()
  const [tab, setTab] = useState<Tab>('site')

  if (!ready || admin === null)
    return (
      <div className="admin">
        <div className="panel admin-wait">확인하는 중…</div>
      </div>
    )

  if (!admin)
    return (
      <div className="admin">
        <div className="panel admin-wait">
          운영자만 들어올 수 있습니다.
          <div style={{ marginTop: 10 }}>
            <Link className="btn btn-main" to="/">
              아이로그 홈으로
            </Link>
          </div>
        </div>
      </div>
    )

  return (
    <div className="admin">
      <div className="panel admin-head">
        <h3>운영</h3>
        <nav className="admin-tabs">
          {(
            [
              ['site', '사이트 글'],
              ['members', '회원 기록장'],
              ['guest', '방명록'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} className={`btn ${tab === k ? 'btn-main' : ''}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'site' && <SiteTab />}
      {tab === 'members' && <MembersTab />}
      {tab === 'guest' && <GuestTab />}
    </div>
  )
}

const done = (r: Result, okMsg?: string) => {
  if (!r.ok) void say('처리하지 못했습니다', r.msg)
  else if (okMsg) void say(okMsg)
  return r.ok
}

/* ── 사이트 글 ─────────────────────────────────────────── */
function SiteTab() {
  const cur = useSiteText()
  const [d, setD] = useState<SiteText>(cur)
  const [busy, setBusy] = useState(false)
  useEffect(() => setD(cur), [cur])

  const setNotice = (i: number, patch: Partial<SiteText['notices'][number]>) =>
    setD((v) => ({ ...v, notices: v.notices.map((n, k) => (k === i ? { ...n, ...patch } : n)) }))
  const move = (i: number, by: number) =>
    setD((v) => {
      const list = [...v.notices]
      const j = i + by
      if (j < 0 || j >= list.length) return v
      ;[list[i], list[j]] = [list[j], list[i]]
      return { ...v, notices: list }
    })

  return (
    <div className="panel admin-body">
      <h3>대문 공지사항</h3>
      <div className="admin-notices">
        {d.notices.map((n, i) => (
          <div className="admin-notice" key={i}>
            <select
              className="inp"
              value={n.tag}
              onChange={(e) => setNotice(i, { tag: e.target.value as '공지' | '이벤트' })}
              aria-label="분류"
            >
              <option>공지</option>
              <option>이벤트</option>
            </select>
            <input
              className="inp"
              value={n.title}
              maxLength={60}
              placeholder="공지 제목"
              onChange={(e) => setNotice(i, { title: e.target.value })}
            />
            <label className="chk">
              <input type="checkbox" checked={n.isNew} onChange={(e) => setNotice(i, { isNew: e.target.checked })} />
              NEW
            </label>
            <button className="btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로">
              ↑
            </button>
            <button className="btn" onClick={() => move(i, 1)} disabled={i === d.notices.length - 1} aria-label="아래로">
              ↓
            </button>
            <button
              className="btn"
              aria-label="지우기"
              onClick={() => setD((v) => ({ ...v, notices: v.notices.filter((_, k) => k !== i) }))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="btn"
          onClick={() => setD((v) => ({ ...v, notices: [...v.notices, { title: '', tag: '공지', isNew: true }] }))}
        >
          ＋ 공지 더하기
        </button>
      </div>

      <h3>위에 흐르는 공지</h3>
      <input
        className="inp admin-wide"
        value={d.marquee}
        maxLength={200}
        placeholder="비워두면 흐르는 공지를 감춥니다"
        onChange={(e) => setD((v) => ({ ...v, marquee: e.target.value }))}
      />

      <h3>대문 이벤트 칸</h3>
      <input
        className="inp admin-wide"
        value={d.eventTitle}
        maxLength={30}
        placeholder="이벤트 제목 (비워두면 칸을 감춥니다)"
        onChange={(e) => setD((v) => ({ ...v, eventTitle: e.target.value }))}
      />
      <input
        className="inp admin-wide"
        value={d.eventBody}
        maxLength={60}
        placeholder="이벤트 내용"
        onChange={(e) => setD((v) => ({ ...v, eventBody: e.target.value }))}
      />

      <div className="admin-foot">
        <button className="btn" onClick={() => setD(cur)} disabled={busy}>
          되돌리기
        </button>
        <button
          className="btn btn-main"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            done(await saveSiteText(d), '저장했습니다')
            setBusy(false)
          }}
        >
          저장
        </button>
      </div>
    </div>
  )
}

/* ── 회원 기록장 ───────────────────────────────────────── */
function MembersTab() {
  const { session } = useSession()
  const [list, setList] = useState<AdminHome[] | null>(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    const r = await adminListHomes()
    if (Array.isArray(r)) {
      setList(r)
      setErr('')
    } else if (!r.ok) setErr(r.msg)
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const shown = (list ?? []).filter((h) => !q || h.handle.includes(q) || h.title.includes(q))

  return (
    <div className="panel admin-body">
      <h3>
        회원 기록장 <small>{list ? `${list.length}개` : ''}</small>
      </h3>
      <input className="inp admin-wide" placeholder="아이디·기록장 이름 찾기" value={q} onChange={(e) => setQ(e.target.value)} />
      {err ? (
        <p className="admin-empty">{err}</p>
      ) : !list ? (
        <p className="admin-empty">불러오는 중…</p>
      ) : shown.length === 0 ? (
        <p className="admin-empty">없습니다.</p>
      ) : (
        <div className="admin-table">
          {shown.map((h) => {
            const me = h.userId === session?.user.id
            return (
              <div className={`admin-row ${h.hidden ? 'is-hidden' : ''}`} key={h.userId}>
                <span className="admin-main">
                  <Link to={`/u/${h.handle}`}>
                    <b>{h.handle}</b>
                  </Link>
                  <small>{h.title}</small>
                </span>
                {h.hidden && <em className="admin-badge">숨김</em>}
                {me && <em className="admin-badge on">운영자</em>}
                <small className="admin-date">{h.updated}</small>
                <button
                  className="btn"
                  disabled={me}
                  onClick={async () => {
                    if (done(await adminSetHidden(h.userId, !h.hidden))) void load()
                  }}
                >
                  {h.hidden ? '다시 보이기' : '숨기기'}
                </button>
                <button
                  className="btn"
                  disabled={me}
                  onClick={async () => {
                    const yes = await ask(
                      `${h.handle} 기록장을 지울까요?`,
                      '글·사진 설정·방명록·단짝이 전부 사라지고 되돌릴 수 없습니다.',
                      '지우기',
                    )
                    if (!yes) return
                    if (done(await adminDeleteHome(h.userId), '지웠습니다')) void load()
                  }}
                >
                  지우기
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── 방명록 전체 ───────────────────────────────────────── */
function GuestTab() {
  const [list, setList] = useState<AdminGuest[] | null>(null)
  const [err, setErr] = useState('')
  const viewing = useSite((s) => s.viewing)

  const load = useCallback(async () => {
    const r = await adminListGuest()
    if (Array.isArray(r)) {
      setList(r)
      setErr('')
    } else if (!r.ok) setErr(r.msg)
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="panel admin-body">
      <h3>
        최근 방명록 <small>{list ? `${list.length}개` : ''}</small>
      </h3>
      {err ? (
        <p className="admin-empty">{err}</p>
      ) : !list ? (
        <p className="admin-empty">불러오는 중…</p>
      ) : list.length === 0 ? (
        <p className="admin-empty">아직 남겨진 방명록이 없습니다.</p>
      ) : (
        <div className="admin-table">
          {list.map((g) => (
            <div className="admin-row admin-guest" key={g.id}>
              <span className="admin-main">
                <span>
                  {g.secret && <em className="admin-badge">비밀</em>}
                  <b>{g.writer}</b> → {g.home ? <Link to={`/u/${g.home}`}>{g.home}</Link> : '(지워진 기록장)'}
                </span>
                <span className="admin-text">{g.body}</span>
              </span>
              <small className="admin-date">{g.date}</small>
              <button
                className="btn"
                disabled={viewing}
                onClick={async () => {
                  const yes = await ask('이 방명록을 지울까요?', g.body.slice(0, 40), '지우기')
                  if (!yes) return
                  if (done(await adminDeleteGuest(g.id))) void load()
                }}
              >
                지우기
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
