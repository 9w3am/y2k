import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useSite } from '../lib/store'
import { exportScreen } from '../lib/exportPng'

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
  const [max, setMax] = useState(false)
  /** 지금 열려 있는 메뉴바 이름 — 없으면 빈 문자열 */
  const [mb, setMb] = useState('')

  /** 메뉴바 한 칸. 눌러서 열고, 한 번 열리면 지나가기만 해도 옮겨 열린다. */
  const MbItem = ({ name, children }: { name: string; children: ReactNode }) => (
    <span
      className={mb === name ? 'on' : ''}
      onClick={(e) => {
        e.stopPropagation()
        setMb((v) => (v === name ? '' : name))
      }}
      onMouseEnter={() => mb && setMb(name)}
    >
      {name}
      {mb === name && (
        <span className="mb-pop" onClick={(e) => e.stopPropagation()}>
          {children}
        </span>
      )}
    </span>
  )

  /** 메뉴 한 줄 */
  const MbRow = ({ label, onPick }: { label: string; onPick: () => void }) => (
    <button
      onClick={() => {
        setMb('')
        onPick()
      }}
    >
      {label}
    </button>
  )

  // 메뉴가 닫힌 뒤에 찍어야 펼친 메뉴가 그림에 남지 않는다
  const capture = () => {
    setMb('')
    requestAnimationFrame(() => void exportScreen('app'))
  }

  return (
    <div
      className="desktop"
      onClick={() => {
        if (menu) setMenu(false)
        if (mb) setMb('')
      }}
    >
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

      <div className={`win ${min ? 'min' : ''} ${max ? 'max' : ''}`}>
        <div className="win-tb">
          <span aria-hidden="true">✎</span>
          <span>아이로그</span>
          <span className="sp" />
          <button className="win-btn" onClick={() => setMin(true)} aria-label="최소화">
            －
          </button>
          <button
            className="win-btn"
            onClick={() => setMax((v) => !v)}
            aria-label={max ? '이전 크기로' : '최대화'}
          >
            {max ? '❐' : '□'}
          </button>
          <button className="win-btn close" onClick={() => setShell('web')} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="win-mb">
          <MbItem name="파일(F)">
            <MbRow label="내 기록장" onPick={() => nav('/home')} />
            <MbRow label="그림으로 저장" onPick={capture} />
            <MbRow label="웹으로 보기" onPick={() => setShell('web')} />
          </MbItem>
          <MbItem name="편집(E)">
            <MbRow label="프로필" onPick={() => nav('/profile')} />
            <MbRow label="설정" onPick={() => nav('/setting')} />
          </MbItem>
          <MbItem name="보기(V)">
            <MbRow label="다이어리" onPick={() => nav('/diary')} />
            <MbRow label="사진첩" onPick={() => nav('/photo')} />
            <MbRow label="방명록" onPick={() => nav('/guest')} />
            <MbRow label={max ? '이전 크기로' : '창 최대화'} onPick={() => setMax((v) => !v)} />
          </MbItem>
          <MbItem name="단짝(B)">
            <MbRow label="단짝 모두 보기" onPick={() => nav('/jjak')} />
          </MbItem>
          <MbItem name="도움말(H)">
            <MbRow label="아이로그 홈" onPick={() => nav('/')} />
          </MbItem>
        </div>

        <div className="win-tool">
          <button onClick={() => nav(-1)} aria-label="뒤로">
            ←
          </button>
          <button onClick={() => nav(1)} aria-label="앞으로">
            →
          </button>
          <span className="div" />
          {TOOL.map((t) => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'on' : '')}>
              {t.label}
            </NavLink>
          ))}
          <span className="div" />
          <button onClick={capture}>PNG 저장</button>
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
