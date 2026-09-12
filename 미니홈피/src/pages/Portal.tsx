import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSite } from '../lib/store'
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
      <ellipse cx="56" cy="101" rx="34" ry="6" fill="var(--accent)" opacity=".14" />
      <rect x="22" y="20" width="62" height="74" rx="8" fill="#fff" stroke="var(--accent)" strokeWidth="3" />
      <rect x="22" y="20" width="16" height="74" rx="8" fill="var(--accent-2)" />
      {[38, 52, 66, 80].map((y) => (
        <rect key={y} x="46" y={y} width="28" height="4" rx="2" fill="var(--line-2)" />
      ))}
      {[32, 50, 68].map((y) => (
        <circle key={y} cx="30" cy={y} r="4" fill="#fff" stroke="var(--accent)" strokeWidth="2" />
      ))}
      <g transform="rotate(24 86 34)">
        <rect x="82" y="14" width="9" height="42" rx="3" fill="var(--accent)" />
        <path d="M82 56h9l-4.5 10z" fill="#3a444f" />
      </g>
    </svg>
  )
}

export function Portal() {
  const { me, diary, jjak, ink, guest, photo } = useSite()
  const nav = useNavigate()
  const [id, setId] = useState(me.nick)

  const ranks = jjak.slice(0, 5)

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
                방명록 <b>{guest.length}</b>
              </span>
              <span>
                사진첩 <b>{photo.length}</b>
              </span>
              <span>
                단짝 <b>{jjak.length}</b>
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
          </div>

          <div className="panel">
            <h3>오늘 많이 찾은 기록장</h3>
            <ol className="rank">
              {ranks.map((j, n) => (
                <li key={j.id}>
                  <b className={n < 3 ? 'top' : ''}>{n + 1}</b>
                  <i style={{ background: j.hue }} />
                  <Link to={`/jjak/${j.id}`}>{j.title}</Link>
                  <span className="sp" />
                  <small>{(5 - n) * 137 + 42}</small>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="login-box panel">
        <h3>로그인</h3>
        <input
          className="inp"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="아이디"
          aria-label="아이디"
        />
        <input className="inp" type="password" placeholder="비밀번호" aria-label="비밀번호" />
        <label className="chk" style={{ margin: '2px 0 8px' }}>
          <input type="checkbox" /> 아이디 저장
        </label>
        <button className="btn btn-main" style={{ width: '100%' }} onClick={() => nav('/home')}>
          들어가기
        </button>
        <div className="login-links">
          <a href="#/">회원가입</a>
          <span>·</span>
          <a href="#/">아이디 찾기</a>
          <span>·</span>
          <a href="#/">비밀번호 찾기</a>
        </div>
        <p className="login-note">
          연습용 화면이라 비밀번호는 확인하지 않습니다. 어떤 값도 전송되지 않아요.
        </p>

        <div className="evt">
          <b>잉크 두 배 이벤트</b>
          <span>오늘 글 쓰면 한 방울 더!</span>
        </div>

        <h3 style={{ marginTop: 14 }}>단짝 바로가기</h3>
        <div className="jjak-mini">
          {jjak.slice(0, 4).map((j) => (
            <Link key={j.id} to={`/jjak/${j.id}`}>
              <i style={{ background: j.hue }} />
              <span>{j.nick}</span>
              <small>놀러가기 →</small>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
