import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useSite } from '../lib/store'
import { exportHompy } from '../lib/exportPng'

const TOOL = [
  { to: '/home', label: '내 기록장' },
  { to: '/diary', label: '다이어리' },
  { to: '/photo', label: '사진첩' },
  { to: '/guest', label: '방명록' },
  { to: '/jjak', label: '단짝' },
  { to: '/shop', label: '상점' },
  { to: '/setting', label: '설정' },
]

function Clock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 15000)
    return () => clearInterval(id)
  }, [])
  const p = (n: number) => String(n).padStart(2, '0')
  return <span>{`${p(t.getHours())}:${p(t.getMinutes())}`}</span>
}

/** 같은 사이트를 옛날 설치 프로그램 창 안에서 보여준다. */
export function AppShell({ children }: { children: ReactNode }) {
  const { me, ink, setShell } = useSite()
  const nav = useNavigate()
  const [min, setMin] = useState(false)
  const [menu, setMenu] = useState(false)

  return (
    <div className="desktop" onClick={() => menu && setMenu(false)}>
      <div className="desk-icons">
        <button className="desk-ico" onClick={() => setMin(false)}>
          <i>✎</i>
          <span>아이로그</span>
        </button>
        <button className="desk-ico" onClick={() => nav('/photo')}>
          <i>▣</i>
          <span>사진첩</span>
        </button>
        <button className="desk-ico" onClick={() => setShell('web')}>
          <i>@</i>
          <span>웹으로 보기</span>
        </button>
      </div>

      <div className={`win ${min ? 'min' : ''}`}>
        <div className="win-tb">
          <span aria-hidden="true">✎</span>
          <span>아이로그 — {me.homeTitle}</span>
          <span className="sp" />
          <button className="win-btn" onClick={() => setMin(true)} aria-label="최소화">
            －
          </button>
          <button className="win-btn" aria-label="최대화">
            □
          </button>
          <button
            className="win-btn close"
            onClick={() => setShell('web')}
            aria-label="닫기 — 웹으로 돌아가기"
          >
            ✕
          </button>
        </div>

        <div className="win-mb">
          <span>파일(F)</span>
          <span>편집(E)</span>
          <span>보기(V)</span>
          <span>단짝(B)</span>
          <span>도움말(H)</span>
        </div>

        <div className="win-tool">
          <button onClick={() => nav(-1)} title="뒤로">
            ←
          </button>
          <button onClick={() => nav(1)} title="앞으로">
            →
          </button>
          <span className="div" />
          {TOOL.map((t) => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'on' : '')}>
              {t.label}
            </NavLink>
          ))}
          <span className="div" />
          <button
            onClick={() => {
              const node = document.querySelector('.wrap')
              if (node instanceof HTMLElement) void exportHompy(node)
            }}
            title="보이는 그대로 큰 그림으로 저장합니다"
          >
            PNG 저장
          </button>
          <span className="sp" />
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>잉크 {ink}방울</span>
        </div>

        <div className="win-body">{children}</div>

        <div className="win-status">
          <i>준비</i>
          <span className="sp" />
          <span>{me.nick} 님으로 접속</span>
          <span>·</span>
          <span>내 컴퓨터에 저장됨</span>
        </div>
      </div>

      <div className="taskbar">
        <button
          className="start"
          onClick={(e) => {
            e.stopPropagation()
            setMenu((v) => !v)
          }}
        >
          <span aria-hidden="true">⊞</span> 시작
        </button>
        <button className={`task-btn ${min ? '' : 'on'}`} onClick={() => setMin((v) => !v)}>
          ✎ 아이로그
        </button>
        <div className="tray">
          <span aria-hidden="true">♪</span>
          <Clock />
        </div>
      </div>

      {menu && (
        <div className="startmenu" onClick={(e) => e.stopPropagation()}>
          <div className="startmenu-h">
            아이로그
            <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.9 }}>{me.nick} 님</div>
          </div>
          <Link to="/" onClick={() => setMenu(false)}>
            아이로그 홈
          </Link>
          {TOOL.map((t) => (
            <Link key={t.to} to={t.to} onClick={() => setMenu(false)}>
              {t.label}
            </Link>
          ))}
          <hr />
          <button
            onClick={() => {
              setMenu(false)
              setShell('web')
            }}
          >
            웹사이트로 보기
          </button>
        </div>
      )}
    </div>
  )
}
