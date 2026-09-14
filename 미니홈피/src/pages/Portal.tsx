import { Link } from 'react-router-dom'
import { AuthBox } from '../ui/Account'
import { useSite } from '../lib/store'
import { useFriends, useGuestbook, useHomeOwner, useRecentHomes } from '../lib/social'
import { InkJar } from '../ui/InkJar'

const NOTICES: [string, string, boolean][] = [
  ['스킨 6종 신규 입고 안내', '공지', true],
  ['잉크 충전 이벤트 — 글 한 개당 한 방울', '이벤트', true],
  ['정기점검 안내 (매주 화요일 새벽 4시)', '공지', false],
  ['단짝 신청 하루 20명 제한 안내', '공지', false],
]

/** 대문에 세워둘 간단한 마스코트 — 공책과 펜 */
function Mascot() {
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
      <ellipse cx="56" cy="101" rx="34" ry="6" style={{ fill: 'var(--accent)' }} opacity=".14" />
      <rect x="22" y="20" width="62" height="74" rx="8" fill="#fff" style={{ stroke: 'var(--accent)' }} strokeWidth="3" />
      <rect x="22" y="20" width="16" height="74" rx="8" style={{ fill: 'var(--accent-2)' }} />
      {[38, 52, 66, 80].map((y) => (
        <rect key={y} x="46" y={y} width="28" height="4" rx="2" style={{ fill: 'var(--line-2)' }} />
      ))}
      {[32, 50, 68].map((y) => (
        <circle key={y} cx="30" cy={y} r="4" fill="#fff" style={{ stroke: 'var(--accent)' }} strokeWidth="2" />
      ))}
      <g transform="rotate(24 86 34)">
        <rect x="82" y="14" width="9" height="42" rx="3" style={{ fill: 'var(--accent)' }} />
        <path d="M82 56h9l-4.5 10z" fill="#3a444f" />
      </g>
    </svg>
  )
}

export function Portal() {
  const { diary, ink, guest, photo } = useSite()
  const owner = useHomeOwner()
  const friends = useFriends(owner?.id ?? null).list.filter((f) => f.status === 'accepted')
  const cloudGuest = useGuestbook(owner?.id ?? null).rows
  // 실제로 가입한 사람들의 기록장 — 최근에 고친 순서
  const recent = useRecentHomes(5)

  return (
    <div className="portal">
      <div className="portal-main">
        <div className="hero">
          <Mascot />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="hero-t">오늘의 나를 기록하는 곳</div>
            <p>
              아이로그는 하루를 글과 사진으로 남겨두는 작은 기록장입니다.
              <br />
              다이어리를 쓰고, 내 방을 꾸미고, 단짝들과 로그타기로 오갑니다.
            </p>
            <div className="hero-btns">
              <Link className="btn btn-main" to="/home">
                내 기록장 들어가기
              </Link>
              <Link className="btn" to="/diary">
                오늘 다이어리 쓰기
              </Link>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>공지사항</h3>
          <ul className="notice-list">
            {NOTICES.map(([t, tag, isNew]) => (
              <li key={t}>
                <span className={`ntag ${tag === '이벤트' ? 'ev' : ''}`}>{tag}</span>
                <span>{t}</span>
                <span className="sp" />
                {isNew && <b className="newmark">NEW</b>}
              </li>
            ))}
          </ul>
        </div>

        <div className="portal-2col">
          <div className="panel">
            <h3>내 기록장</h3>
            <div className="stat-row">
              <span>
                다이어리 <b>{diary.length}</b>
              </span>
              <span>
                방명록 <b>{owner ? cloudGuest.length : guest.length}</b>
              </span>
              <span>
                사진첩 <b>{photo.length}</b>
              </span>
              <span>
                단짝 <b>{friends.length}</b>
              </span>
            </div>
            <div className="inkbox">
              <InkJar amount={ink} />
              <div>
                <b>
                  잉크 {ink}방울
                </b>
                <p>글이나 사진을 올리면 한 방울씩 모입니다.</p>
                <Link className="btn" to="/shop">
                  상점 구경
                </Link>
              </div>
            </div>
            {diary.length > 0 && (
              <ul className="my-latest">
                {diary.slice(0, 3).map((d) => (
                  <li key={d.id}>
                    <Link to={`/post/diary/${d.id}`}>{d.title}</Link>
                    <small>{d.date.slice(5)}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel">
            <h3>요즘 쓰는 기록장</h3>
            {recent === null ? null : recent.length === 0 ? (
              <p className="rank-empty">아직 가입한 기록장이 없습니다.</p>
            ) : (
              <ol className="rank">
                {recent.map((h, n) => (
                  <li key={h.handle}>
                    <b className={n < 3 ? 'top' : ''}>{n + 1}</b>
                    <i
                      style={
                        h.photo
                          ? { backgroundImage: `url(${h.photo})`, backgroundSize: 'cover' }
                          : { background: 'var(--accent-2)' }
                      }
                    />
                    <Link to={`/u/${h.handle}`}>
                      {h.title}
                      <em className="rank-id">{h.handle}</em>
                    </Link>
                    <span className="sp" />
                    <small>{h.updated}</small>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      <div className="login-box panel">
        <h3>로그인</h3>
        <AuthBox />

        <div className="evt">
          <b>잉크 두 배 이벤트</b>
          <span>오늘 글 쓰면 한 방울 더!</span>
        </div>

        <h3 style={{ marginTop: 14 }}>단짝 바로가기</h3>
        <div className="jjak-mini">
          {friends.length === 0 ? (
            <span className="jjak-mini-empty">아직 단짝이 없습니다</span>
          ) : (
            friends.slice(0, 4).map((f) => (
              <Link key={f.id} to={`/u/${f.handle}`}>
                <i
                  style={
                    f.photo
                      ? { backgroundImage: `url(${f.photo})`, backgroundSize: 'cover' }
                      : { background: 'var(--accent-2)' }
                  }
                />
                <span>{f.handle}</span>
                <small>놀러가기 →</small>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
