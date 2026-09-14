import { Link, NavLink, useLocation } from 'react-router-dom'
import { useSite } from '../lib/store'
import { exportScreen } from '../lib/exportPng'
import { AccountChip } from './Account'

const MENU = [
  { to: '/', label: '아이로그 홈', end: true },
  { to: '/home', label: '내 기록장' },
  { to: '/jjak', label: '단짝' },
  { to: '/shop', label: '상점' },
  { to: '/setting', label: '설정' },
]

export function Gnb() {
  const { me, ink, shell, setShell } = useSite()
  const loc = useLocation()

  return (
    <>
      <div className="gnb">
        <div className="gnb-in">
          <Link className="logo" to="/">
            <b>아이로그</b>
            <i>ilog</i>
          </Link>
          <nav className="gnb-menu">
            {MENU.map((m) => (
              <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => (isActive ? 'on' : '')}>
                {m.label}
              </NavLink>
            ))}
          </nav>
          <span className="gnb-sp" />
          <span className="gnb-user">
            <span>
              <b style={{ color: 'var(--ink)' }}>{me.nick}</b> 님
            </span>
            <AccountChip />
            <span className="candy" title="잉크 — 아이로그에서 쓰는 알맹이">
              잉크 <b>{ink}</b>방울
            </span>
            <button
              className="btn"
              style={{ padding: '2px 8px' }}
              onClick={() => void exportScreen('web')}
            >
              PNG 저장
            </button>
            <button
              className="btn"
              style={{ padding: '2px 8px' }}
              onClick={() => setShell(shell === 'web' ? 'app' : 'web')}
            >
              {shell === 'web' ? '프로그램으로 보기' : '웹으로 보기'}
            </button>
          </span>
        </div>
      </div>

      <div className="gnb-sub">
        <div className="gnb-sub-in">
          <Link to="/diary" className={loc.pathname === '/diary' ? 'on' : ''}>
            다이어리
          </Link>
          <Link to="/photo">사진첩</Link>
          <Link to="/guest">방명록</Link>
          <Link to="/board">게시판</Link>
          <Link to="/paper">페이퍼</Link>
          <span className="sp" />
          <span className="marquee" aria-hidden="true">
            <span>
              [공지] 아이로그 정기점검 안내 · 잉크 충전 이벤트 진행 중 · 스킨 6종 신규 입고
              · 단짝 신청은 하루 20명까지
            </span>
          </span>
        </div>
      </div>
    </>
  )
}

