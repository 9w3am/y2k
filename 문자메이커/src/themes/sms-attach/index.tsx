import './theme.css'
import { ScreenFx, ScreenFxPanel, useFxRoot } from '../../editable/ScreenFx'
import { EditableText } from '../../editable/EditableText'
import { useStore, useValue } from '../../lib/store'
import { Section, Slider } from '../../ui/controls'

function CameraOff() {
  return (
    <svg width="22" height="18" viewBox="0 0 11 9" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M0 2h3l1-1h3l1 1h3v7H0z" fill="currentColor" />
      <circle cx="5.5" cy="5" r="2" fill="var(--status)" />
      <path d="M0 0h1v1H0zM1 1h1v1H1zM2 2h1v1H2zM3 3h1v1H3zM4 4h1v1H4zM5 5h1v1H5zM6 6h1v1H6zM7 7h1v1H7zM8 8h1v1H8z" fill="#e2413f" />
    </svg>
  )
}

function Bell() {
  return (
    <svg width="17" height="18" viewBox="0 0 8 9" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M3 0h2v1H3zM2 1h4v1H2zM1 2h6v4H1zM0 6h8v1H0zM3 7h2v1H3z" fill="currentColor" />
    </svg>
  )
}

function Clock() {
  return (
    <svg width="20" height="20" viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true">
      <circle cx="5" cy="5" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 2.4V5l2 1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function PageIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 8 9" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M0 0h6l2 2v7H0z" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M2 3h4v1H2zM2 5h4v1H2z" fill="currentColor" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 8 9" shapeRendering="crispEdges" aria-hidden="true">
      <circle cx="4" cy="2.6" r="2" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M0.6 8.6c0-2 1.5-3 3.4-3s3.4 1 3.4 3" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function ClipIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M6.5 3.5L3.2 6.8a1.6 1.6 0 0 1-2.3-2.3l3.6-3.6a2.4 2.4 0 0 1 3.4 3.4L4.2 8" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

export function Screen() {
  const fx = useFxRoot()
  const battery = Number(useValue('battery'))
  const set = useStore((s) => s.set)
  const t1 = useValue('tab1On') === '1'
  const t2 = useValue('tab2On') === '1'

  return (
    <div className={`t-attach ${fx.className}`} style={fx.style}>
      <div className="status">
        <span className="ant" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <CameraOff />
        <Bell />
        <span className="sp" />
        <span className="batt" aria-hidden="true">
          <span className="batt-shell">
            {[1, 2, 3].map((n) => (
              <i key={n} className={n <= battery ? 'on' : ''} />
            ))}
          </span>
          <span className="batt-nub" />
        </span>
        <EditableText k="clock" multiline={false} maxChars={10} />
      </div>

      <div className="tabs">
        <Clock />
        <span className="tab">
          <button
            className={`chk ${t1 ? 'on' : ''}`}
            aria-label="편지지 선택"
            onClick={() => set('tab1On', t1 ? '0' : '1')}
          >
            <span />
          </button>
          <PageIcon />
          <EditableText k="tab1" multiline={false} maxChars={8} />
        </span>
        <span className="tab">
          <button
            className={`chk ${t2 ? 'on' : ''}`}
            aria-label="아바타 선택"
            onClick={() => set('tab2On', t2 ? '0' : '1')}
          >
            <span />
          </button>
          <PersonIcon />
          <EditableText k="tab2" multiline={false} maxChars={8} />
        </span>
      </div>

      <div className="page">
        <EditableText
          k="body"
          className="body"
          placeholder="보낼 내용을 쓰세요"
          style={{
            fontSize: `${useValue('size')}px`,
            lineHeight: Number(useValue('lead')) / 100,
          }}
        />
        <EditableText k="byteText" className="byte" multiline={false} maxChars={12} />
      </div>

      <div className="attach">
        <ClipIcon />
        <EditableText k="attachLabel" multiline={false} maxChars={6} />
        <span className="attach-field">
          <EditableText k="attachValue" multiline={false} maxChars={22} placeholder=" " />
        </span>
      </div>

      <div className="keys">
        <EditableText k="sk1" className="sk" multiline={false} maxChars={5} />
        <EditableText k="sk2" className="sk" multiline={false} maxChars={5} />
        <EditableText k="sk3" className="sk" multiline={false} maxChars={5} />
      </div>

      <ScreenFx />
    </div>
  )
}

export function Panel() {
  return (
    <>
      <Section
        n="01"
        title="문구"
        note="시각·편지지·아바타·본문·바이트·첨부·아래 버튼까지 전부 눌러서 고칩니다. 네모칸을 누르면 체크가 켜집니다."
      >
        <Slider k="size" label="본문 크기" min={20} max={44} step={2} suffix="px" />
        <Slider k="lead" label="줄 간격" min={110} max={200} step={4} suffix="%" />
        <Slider k="battery" label="배터리" min={0} max={3} suffix="칸" />
      </Section>


      <ScreenFxPanel n="02" />
    </>
  )
}

export function Swatch() {
  return (
    <span
      style={{
        width: 58,
        height: 78,
        display: 'grid',
        gridTemplateRows: '9px 8px 1fr 12px',
        background: '#c9ccc6',
        border: '2px solid #17191a',
      }}
    >
      <span style={{ background: '#0c0d0e' }} />
      <span style={{ background: '#b7bab4', borderBottom: '2px solid #17191a' }} />
      <span style={{ margin: 3, border: '2px solid #17191a', background: '#c9ccc6' }} />
      <span style={{ display: 'flex', gap: 2, padding: '0 2px 2px' }}>
        {[0, 1, 2].map((i) => (
          <i key={i} style={{ flex: 1, border: '2px solid #17191a', background: 'linear-gradient(#e6e8e4,#9fa39d)' }} />
        ))}
      </span>
    </span>
  )
}
