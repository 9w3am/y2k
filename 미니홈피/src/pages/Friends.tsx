import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSite } from '../lib/store'
import { useSession } from '../lib/supabase'
import { HANDLE_RE } from '../lib/cloud'
import {
  acceptFriend,
  removeFriend,
  requestFriend,
  useFriends,
  useHomeOwner,
  type Friend,
  type Result,
} from '../lib/social'
import { ask, say } from '../ui/dialog'

/** 단짝 얼굴 — 서버에 올린 프로필 사진이 있으면 그걸, 없으면 아이디 첫 글자 */
function Face({ f }: { f: Friend }) {
  return (
    <i className="fr-face" style={f.photo ? { backgroundImage: `url(${f.photo})` } : undefined}>
      {f.photo ? '' : f.handle.slice(0, 1).toUpperCase()}
    </i>
  )
}

/** 남의 기록장을 구경할 때 — 그 사람과의 사이를 보여주거나 단짝 신청 */
export function FriendButton() {
  const owner = useHomeOwner()
  const { session } = useSession()
  const myId = session?.user.id ?? ''
  const { list, reload } = useFriends(myId || null)
  const [busy, setBusy] = useState(false)
  if (!owner || !myId || owner.id === myId) return null

  const rel = list.find((f) => f.userId === owner.id)
  if (rel?.status === 'accepted') return <span className="fr-tag">단짝</span>
  if (rel) return <span className="fr-tag">{rel.incoming ? '신청 받음' : '신청 중'}</span>
  return (
    <button
      className="btn btn-main"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        const r = await requestFriend(owner.handle)
        setBusy(false)
        if (!r.ok) void say('신청하지 못했습니다', r.msg)
        reload()
      }}
    >
      단짝 신청
    </button>
  )
}

/* ── 단짝 페이지 ─────────────────────────────────────────── */
export function FriendsPage() {
  const owner = useHomeOwner()
  const viewing = useSite((s) => s.viewing)
  const { session } = useSession()
  const myId = session?.user.id ?? ''
  const nav = useNavigate()
  const { list, loading, nosetup, reload } = useFriends(owner?.id ?? null)
  const [handle, setHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const isMine = !!owner && owner.id === myId && !viewing

  const act = async (fn: () => Promise<Result>, failTitle: string) => {
    setBusy(true)
    const r = await fn()
    setBusy(false)
    if (!r.ok) void say(failTitle, r.msg)
    reload()
    return r.ok
  }

  const head = (count?: number) => (
    <div className="sect">
      <h2>Jjak</h2>
      <em>my close friends</em>
      <span className="sp" />
      {count !== undefined && <small>{count}명</small>}
    </div>
  )

  if (!owner)
    return (
      <>
        {head()}
        <div className="empty">
          단짝은 가입한 사람끼리 맺습니다.
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-main" onClick={() => nav('/')}>
              로그인 · 가입
            </button>
          </div>
        </div>
      </>
    )

  if (nosetup)
    return (
      <>
        {head()}
        <div className="empty">단짝을 준비하는 중입니다.</div>
      </>
    )

  const accepted = list.filter((f) => f.status === 'accepted')
  const incoming = isMine ? list.filter((f) => f.status === 'pending' && f.incoming) : []
  const outgoing = isMine ? list.filter((f) => f.status === 'pending' && !f.incoming) : []

  return (
    <>
      {head(accepted.length)}

      {isMine ? (
        <form
          className="fr-add"
          onSubmit={(e) => {
            e.preventDefault()
            const h = handle.trim().toLowerCase()
            if (!HANDLE_RE.test(h)) return void say('아이디를 확인해 주세요')
            void act(() => requestFriend(h), '신청하지 못했습니다').then((ok) => ok && setHandle(''))
          }}
        >
          <input
            className="inp"
            placeholder="아이디로 단짝 신청"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            maxLength={20}
            aria-label="단짝 신청할 아이디"
          />
          <button className="btn btn-main" type="submit" disabled={busy}>
            신청
          </button>
        </form>
      ) : (
        <div className="fr-visit-act">
          <FriendButton />
        </div>
      )}

      {incoming.length > 0 && (
        <>
          <h3 className="fr-h">받은 신청</h3>
          <div className="fr-list">
            {incoming.map((f) => (
              <div className="jjak fr-req" key={f.id}>
                <Face f={f} />
                <span>
                  <Link to={`/u/${f.handle}`}>
                    <b>{f.handle}</b>
                  </Link>
                  <small>{f.title}</small>
                </span>
                <button
                  className="btn btn-main"
                  disabled={busy}
                  onClick={() => void act(() => acceptFriend(f), '수락하지 못했습니다')}
                >
                  수락
                </button>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => void act(() => removeFriend(f), '거절하지 못했습니다')}
                >
                  거절
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {outgoing.length > 0 && (
        <>
          <h3 className="fr-h">보낸 신청</h3>
          <div className="fr-list">
            {outgoing.map((f) => (
              <div className="jjak fr-req" key={f.id}>
                <Face f={f} />
                <span>
                  <Link to={`/u/${f.handle}`}>
                    <b>{f.handle}</b>
                  </Link>
                  <small>수락을 기다리는 중</small>
                </span>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => void act(() => removeFriend(f), '취소하지 못했습니다')}
                >
                  취소
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {(incoming.length > 0 || outgoing.length > 0) && <h3 className="fr-h">단짝</h3>}
      {loading ? (
        <div className="empty">불러오는 중…</div>
      ) : accepted.length === 0 ? (
        <div className="empty">
          {isMine ? '아직 단짝이 없습니다.' : `${owner.handle} 님은 아직 단짝이 없습니다.`}
        </div>
      ) : (
        <div className="jjak-grid">
          {accepted.map((f) => (
            <div className="jjak fr-card" key={f.id}>
              <Link className="fr-link" to={`/u/${f.handle}`}>
                <Face f={f} />
                <span>
                  <b>{f.handle}</b>
                  <small>{f.title}</small>
                </span>
              </Link>
              {isMine && (
                <button
                  className="btn-x"
                  aria-label={`${f.handle} 단짝 끊기`}
                  onClick={() =>
                    void ask('단짝을 끊을까요?', f.handle, '끊기').then(
                      (yes) => yes && act(() => removeFriend(f), '끊지 못했습니다'),
                    )
                  }
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
