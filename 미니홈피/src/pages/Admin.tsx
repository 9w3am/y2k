import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../lib/supabase'
import {
  adminDeleteFriend,
  adminDeleteGuest,
  adminDeleteHome,
  adminDeletePhoto,
  adminGetHome,
  adminListFriends,
  adminListGuest,
  adminListHomes,
  adminListPhotos,
  adminPatchHome,
  adminRename,
  adminSetHidden,
  adminStats,
  saveSiteText,
  siteHasMore,
  useIsAdmin,
  useSiteText,
  type AdminFriend,
  type AdminGuest,
  type AdminHome,
  type AdminHomeDetail,
  type AdminPhoto,
  type AdminStats,
  type HomeData,
  type Result,
  type SiteText,
} from '../lib/admin'
import { ask, say } from '../ui/dialog'

type Tab = 'dash' | 'site' | 'members' | 'guest' | 'friends'
const TABS: [Tab, string][] = [
  ['dash', '한눈에'],
  ['site', '사이트 글'],
  ['members', '회원'],
  ['guest', '방명록'],
  ['friends', '단짝'],
]

/* ══ 운영 페이지 — 운영자 계정으로 로그인했을 때만 ══════════ */
export function AdminPage() {
  const { ready } = useSession()
  const admin = useIsAdmin()
  const [tab, setTab] = useState<Tab>('dash')

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
          {TABS.map(([k, label]) => (
            <button key={k} className={`btn ${tab === k ? 'btn-main' : ''}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'dash' && <DashTab go={setTab} />}
      {tab === 'site' && <SiteTab />}
      {tab === 'members' && <MembersTab />}
      {tab === 'guest' && <GuestTab />}
      {tab === 'friends' && <FriendsTab />}
    </div>
  )
}

const done = (r: Result, okMsg?: string) => {
  if (!r.ok) void say('처리하지 못했습니다', r.msg)
  else if (okMsg) void say(okMsg)
  return r.ok
}

/* ── 한눈에 ─────────────────────────────────────────────── */
function DashTab({ go }: { go: (t: Tab) => void }) {
  const [s, setS] = useState<AdminStats | null>(null)
  useEffect(() => {
    void adminStats().then(setS)
  }, [])
  const card = (label: string, value: number | undefined, sub: string, tab: Tab) => (
    <button className="admin-card" onClick={() => go(tab)}>
      <small>{label}</small>
      <b>{value ?? '…'}</b>
      <em>{sub}</em>
    </button>
  )
  return (
    <div className="panel admin-body">
      <div className="admin-cards">
        {card('회원 기록장', s?.homes, `숨김 ${s?.hidden ?? '…'}`, 'members')}
        {card('최근 7일 고친 기록장', s?.active7, '회원 탭에서 보기', 'members')}
        {card('방명록', s?.guest, `비밀글 ${s?.secret ?? '…'}`, 'guest')}
        {card('맺어진 단짝', s?.friends, `신청 중 ${s?.pending ?? '…'}`, 'friends')}
        {card('사진 올린 회원', s?.photoOwners, '회원 탭에서 파일 보기', 'members')}
      </div>
    </div>
  )
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
        placeholder="비워두면 감춥니다"
        onChange={(e) => setD((v) => ({ ...v, marquee: e.target.value }))}
      />

      <h3>대문 이벤트 칸</h3>
      <input
        className="inp admin-wide"
        value={d.eventTitle}
        maxLength={30}
        placeholder="이벤트 제목 (비워두면 감춥니다)"
        onChange={(e) => setD((v) => ({ ...v, eventTitle: e.target.value }))}
      />
      <input
        className="inp admin-wide"
        value={d.eventBody}
        maxLength={60}
        placeholder="이벤트 내용"
        onChange={(e) => setD((v) => ({ ...v, eventBody: e.target.value }))}
      />

      <h3>팝업 공지</h3>
      <input
        className="inp admin-wide"
        value={d.popupTitle}
        maxLength={40}
        placeholder="팝업 제목 (비워두면 안 뜹니다)"
        onChange={(e) => setD((v) => ({ ...v, popupTitle: e.target.value }))}
      />
      <textarea
        className="ta admin-wide"
        value={d.popupBody}
        maxLength={500}
        placeholder="팝업 내용"
        onChange={(e) => setD((v) => ({ ...v, popupBody: e.target.value }))}
      />

      <h3>점검 모드</h3>
      <label className="chk admin-maint">
        <input type="checkbox" checked={d.maintenance} onChange={(e) => setD((v) => ({ ...v, maintenance: e.target.checked }))} />
        점검 중 (운영자 말고는 점검 안내만 보입니다)
      </label>
      <input
        className="inp admin-wide"
        value={d.maintenanceMsg}
        maxLength={120}
        placeholder="점검 안내 글"
        onChange={(e) => setD((v) => ({ ...v, maintenanceMsg: e.target.value }))}
      />
      {!siteHasMore() && <p className="admin-note">팝업·점검은 SQL 4단계를 돌려야 저장됩니다.</p>}

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

/* ── 회원 ──────────────────────────────────────────────── */
function MembersTab() {
  const { session } = useSession()
  const [list, setList] = useState<AdminHome[] | null>(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState('')

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
              <div key={h.userId}>
                <div className={`admin-row ${h.hidden ? 'is-hidden' : ''} ${open === h.userId ? 'is-open' : ''}`}>
                  <span className="admin-main">
                    <Link to={`/u/${h.handle}`}>
                      <b>{h.handle}</b>
                    </Link>
                    <small>{h.title}</small>
                  </span>
                  {h.hidden && <em className="admin-badge">숨김</em>}
                  {me && <em className="admin-badge on">운영자</em>}
                  <small className="admin-date">{h.updated}</small>
                  <button className="btn btn-main" onClick={() => setOpen(open === h.userId ? '' : h.userId)}>
                    {open === h.userId ? '접기' : '관리'}
                  </button>
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
                {open === h.userId && <MemberDetail userId={h.userId} onChanged={load} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const POST_KINDS: [string, string][] = [
  ['diary', '다이어리'],
  ['board', '게시판'],
  ['paper', '페이퍼'],
]
type PostLite = { id: string; title?: string; date?: string }
type PicLite = { id: string; src?: string; cap?: string }

/** 한 회원 기록장을 들여다보고 고친다 */
function MemberDetail({ userId, onChanged }: { userId: string; onChanged: () => void }) {
  const [h, setH] = useState<AdminHomeDetail | null>(null)
  const [photos, setPhotos] = useState<AdminPhoto[] | null>(null)
  const [err, setErr] = useState('')
  const [handle, setHandle] = useState('')
  const [ink, setInk] = useState('')

  const load = useCallback(async () => {
    const r = await adminGetHome(userId)
    if ('userId' in r) {
      setH(r)
      setHandle(r.handle)
      setInk(String(Number(r.data.ink ?? 0)))
      setErr('')
    } else if (!r.ok) setErr(r.msg)
    const p = await adminListPhotos(userId)
    setPhotos(Array.isArray(p) ? p : [])
  }, [userId])
  useEffect(() => {
    void load()
  }, [load])

  const patch = async (fn: (d: HomeData) => HomeData, okMsg?: string) => {
    if (done(await adminPatchHome(userId, fn), okMsg)) void load()
  }
  const clearMe = (key: string, label: string) =>
    void ask(`${label}을(를) 비울까요?`, undefined, '비우기').then(
      (yes) => {
        if (yes) void patch((d) => ({ ...d, me: { ...(d.me ?? {}), [key]: '' } }))
      },
    )

  if (err) return <div className="admin-detail"><p className="admin-empty">{err}</p></div>
  if (!h) return <div className="admin-detail"><p className="admin-empty">불러오는 중…</p></div>

  const me = (h.data.me ?? {}) as Record<string, string>
  const pics = (Array.isArray(h.data.photo) ? h.data.photo : []) as PicLite[]

  return (
    <div className="admin-detail">
      <div className="admin-grid">
        <label>아이디</label>
        <div className="admin-inline">
          <input className="inp" value={handle} maxLength={20} onChange={(e) => setHandle(e.target.value.toLowerCase())} />
          <button
            className="btn"
            disabled={handle === h.handle}
            onClick={async () => {
              if (done(await adminRename(userId, handle), '아이디를 바꿨습니다')) {
                void load()
                onChanged()
              }
            }}
          >
            바꾸기
          </button>
        </div>

        <label>잉크</label>
        <div className="admin-inline">
          <input className="inp admin-num" inputMode="numeric" value={ink} onChange={(e) => setInk(e.target.value.replace(/[^\d]/g, ''))} />
          {[10, 50, -10].map((n) => (
            <button key={n} className="btn" onClick={() => setInk(String(Math.max(0, Number(ink || 0) + n)))}>
              {n > 0 ? `+${n}` : n}
            </button>
          ))}
          <button className="btn btn-main" onClick={() => void patch((d) => ({ ...d, ink: Number(ink || 0) }), '잉크를 바꿨습니다')}>
            저장
          </button>
        </div>

        <label>기록장 글자</label>
        <div className="admin-clears">
          {(
            [
              ['homeTitle', '기록장 이름'],
              ['motto', '오늘 기분'],
              ['intro', '자기소개'],
              ['name', '이름'],
            ] as const
          ).map(([k, label]) => (
            <span key={k} className="admin-clear">
              <small>{label}</small>
              <span className="admin-text">{me[k] || '—'}</span>
              <button className="btn" disabled={!me[k]} onClick={() => clearMe(k, label)}>
                비우기
              </button>
            </span>
          ))}
        </div>

        <label>사진</label>
        <div className="admin-inline">
          {(
            [
              ['photo', '프로필 사진'],
              ['room', '내방 사진'],
            ] as const
          ).map(([k, label]) => (
            <span key={k} className="admin-pic">
              {me[k] && /^https?:/.test(me[k]) ? <img src={me[k]} alt="" /> : <i>{me[k] ? '기기 안' : '없음'}</i>}
              <button className="btn" disabled={!me[k]} onClick={() => clearMe(k, label)}>
                {label} 빼기
              </button>
            </span>
          ))}
        </div>
      </div>

      {POST_KINDS.map(([k, label]) => {
        const posts = (Array.isArray(h.data[k]) ? h.data[k] : []) as PostLite[]
        return (
          <div key={k}>
            <h4>
              {label} <small>{posts.length}개</small>
            </h4>
            {posts.length === 0 ? (
              <p className="admin-empty small">없습니다.</p>
            ) : (
              posts.map((p) => (
                <div className="admin-row" key={p.id}>
                  <span className="admin-main">
                    <span className="admin-text">{p.title || '(제목 없음)'}</span>
                  </span>
                  <small className="admin-date">{p.date}</small>
                  <button
                    className="btn"
                    onClick={() =>
                      void ask('이 글을 지울까요?', p.title, '지우기').then(
                        (yes) => {
                          if (yes) void patch((d) => ({ ...d, [k]: (d[k] as PostLite[]).filter((x) => x.id !== p.id) }))
                        },
                      )
                    }
                  >
                    지우기
                  </button>
                </div>
              ))
            )}
          </div>
        )
      })}

      <h4>
        사진첩 <small>{pics.length}장</small>
      </h4>
      {pics.length === 0 ? (
        <p className="admin-empty small">없습니다.</p>
      ) : (
        <div className="admin-pics">
          {pics.map((p) => (
            <span className="admin-pic" key={p.id}>
              {p.src && /^https?:/.test(p.src) ? <img src={p.src} alt="" /> : <i>기기 안</i>}
              <button
                className="btn"
                onClick={() =>
                  void ask('사진첩에서 뺄까요?', p.cap, '빼기').then(
                    (yes) => {
                      if (yes) void patch((d) => ({ ...d, photo: (d.photo as PicLite[]).filter((x) => x.id !== p.id) }))
                    },
                  )
                }
              >
                빼기
              </button>
            </span>
          ))}
        </div>
      )}

      <h4>
        보관함 사진 파일 <small>{photos ? `${photos.length}개` : ''}</small>
      </h4>
      {!photos ? (
        <p className="admin-empty small">불러오는 중…</p>
      ) : photos.length === 0 ? (
        <p className="admin-empty small">없습니다.</p>
      ) : (
        <div className="admin-pics">
          {photos.map((f) => (
            <span className="admin-pic" key={f.path}>
              <a href={f.url} target="_blank" rel="noreferrer">
                <img src={f.url} alt="" />
              </a>
              <small>
                {f.date} · {Math.max(1, Math.round(f.size / 1024))}KB
              </small>
              <button
                className="btn"
                onClick={() =>
                  void ask('이 사진 파일을 지울까요?', '기록장에서 쓰던 자리에는 빈칸이 남습니다.', '지우기').then(
                    async (yes) => {
                      if (yes && done(await adminDeletePhoto(f.path))) void load()
                    },
                  )
                }
              >
                지우기
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── 방명록 전체 ───────────────────────────────────────── */
function GuestTab() {
  const [list, setList] = useState<AdminGuest[] | null>(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [secretOnly, setSecretOnly] = useState(false)

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

  const shown = (list ?? []).filter(
    (g) => (!secretOnly || g.secret) && (!q || g.body.includes(q) || g.home.includes(q) || g.writer.includes(q)),
  )

  return (
    <div className="panel admin-body">
      <h3>
        방명록 <small>{list ? `${shown.length} / ${list.length}개` : ''}</small>
      </h3>
      <div className="admin-inline admin-wide">
        <input className="inp" placeholder="글·아이디 찾기" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="chk">
          <input type="checkbox" checked={secretOnly} onChange={(e) => setSecretOnly(e.target.checked)} />
          비밀글만
        </label>
      </div>
      {err ? (
        <p className="admin-empty">{err}</p>
      ) : !list ? (
        <p className="admin-empty">불러오는 중…</p>
      ) : shown.length === 0 ? (
        <p className="admin-empty">없습니다.</p>
      ) : (
        <div className="admin-table">
          {shown.map((g) => (
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

/* ── 단짝 전체 ─────────────────────────────────────────── */
function FriendsTab() {
  const [list, setList] = useState<AdminFriend[] | null>(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    const r = await adminListFriends()
    if (Array.isArray(r)) {
      setList(r)
      setErr('')
    } else if (!r.ok) setErr(r.msg)
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const shown = (list ?? []).filter((f) => !q || f.a.includes(q) || f.b.includes(q))

  return (
    <div className="panel admin-body">
      <h3>
        단짝 <small>{list ? `${list.length}개` : ''}</small>
      </h3>
      <input className="inp admin-wide" placeholder="아이디 찾기" value={q} onChange={(e) => setQ(e.target.value)} />
      {err ? (
        <p className="admin-empty">{err}</p>
      ) : !list ? (
        <p className="admin-empty">불러오는 중…</p>
      ) : shown.length === 0 ? (
        <p className="admin-empty">없습니다.</p>
      ) : (
        <div className="admin-table">
          {shown.map((f) => (
            <div className="admin-row" key={f.id}>
              <span className="admin-main">
                <span>
                  <Link to={`/u/${f.a}`}>{f.a}</Link> ♥ <Link to={`/u/${f.b}`}>{f.b}</Link>
                </span>
              </span>
              <em className={`admin-badge ${f.status === 'accepted' ? 'on' : ''}`}>
                {f.status === 'accepted' ? '단짝' : '신청 중'}
              </em>
              <small className="admin-date">{f.date}</small>
              <button
                className="btn"
                onClick={async () => {
                  const yes = await ask('이 단짝을 끊을까요?', `${f.a} ♥ ${f.b}`, '끊기')
                  if (!yes) return
                  if (done(await adminDeleteFriend(f.id))) void load()
                }}
              >
                끊기
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
