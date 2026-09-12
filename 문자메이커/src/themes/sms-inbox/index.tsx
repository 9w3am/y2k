import './theme.css'
import { ScreenFx, ScreenFxPanel, useFxRoot } from '../../editable/ScreenFx'
import { ScreenPhoto, ScreenPhotoPanel } from '../../editable/ScreenPhoto'
import { EditableText } from '../../editable/EditableText'
import { useStore, useValue } from '../../lib/store'
import { Section, Seg, Slider } from '../../ui/controls'

/** 안읽음 = 닫힌 봉투, 읽음 = 열린 봉투. 눌러서 바꾼다. */
function Mail({ read }: { read: boolean }) {
  return read ? (
    <svg width="22" height="16" viewBox="0 0 11 8" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M0 2h11v6H0z" fill="currentColor" opacity=".45" />
      <path d="M1 3h9v4H1z" fill="var(--paper)" />
      <path d="M0 2h11v1H0zM1 1h9v1H1zM2 0h7v1H2z" fill="currentColor" opacity=".45" />
    </svg>
  ) : (
    <svg width="22" height="16" viewBox="0 0 11 8" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M0 0h11v8H0z" fill="currentColor" />
      <path d="M1 1h9v6H1z" fill="var(--paper)" />
      <path d="M1 1h9v1H1zM2 2h7v1H2zM3 3h5v1H3zM4 4h3v1H4z" fill="currentColor" />
    </svg>
  )
}

export function Screen() {
  const fx = useFxRoot()
  const set = useStore((s) => s.set)
  const sel = Number(useValue('sel'))
  const rows = Number(useValue('rows'))
  const size = useValue('size')
  const hue = useValue('hue')
  const data = useStore((s) => s.data[s.current])

  return (
    <div className={`t-inbox hue-${hue} ${fx.className}`} style={fx.style}>
      <ScreenPhoto />
      <div className="status">
        <span className="ant" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="status-spacer" />
        <EditableText k="mark" className="mark" multiline={false} maxChars={6} />
      </div>

      <div className="title">
        <EditableText k="title" multiline={false} maxChars={10} />
      </div>

      <div className="list">
        {Array.from({ length: rows }, (_, i) => i + 1).map((n) => {
          const read = (data?.[`r${n}read`] ?? '1') === '1'
          return (
            <div key={n} className={`row ${sel === n ? 'sel' : ''}`}>
              <button
                className="mailbtn no-export-hint"
                title="읽음 / 안읽음 바꾸기"
                aria-label={`${n}번째 줄 ${read ? '읽음' : '안읽음'}`}
                onClick={() => set(`r${n}read`, read ? '0' : '1')}
              >
                <Mail read={read} />
              </button>
              <EditableText
                k={`r${n}`}
                className="row-txt"
                multiline={false}
                placeholder="문자 제목"
                style={{ fontSize: `${size}px` }}
              />
            </div>
          )
        })}
      </div>

      <div className="keys">
        <EditableText k="sk1" multiline={false} maxChars={5} />
        <EditableText k="sk2" multiline={false} maxChars={5} />
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
        title="목록"
        note="각 줄의 글자를 눌러 고치고, 왼쪽 봉투를 누르면 읽음/안읽음이 바뀝니다."
      >
        <Slider k="rows" label="줄 수" min={1} max={8} suffix="줄" />
        <Slider k="sel" label="선택된 줄" min={0} max={8} suffix="번째" />
        <Slider k="size" label="글자 크기" min={14} max={30} step={2} suffix="px" />
      </Section>

      <Section
        n="02"
        title="통신사 표시"
        note="화면 오른쪽 위 글자를 눌러 원하는 대로 바꾸세요. 실제 통신사 로고는 들어 있지 않습니다."
      >
        <Seg
          k="hue"
          label="화면 색"
          options={[
            { value: 'blue', label: '파랑' },
            { value: 'green', label: '초록' },
            { value: 'gray', label: '회색' },
          ]}
        />
      </Section>
      <ScreenFxPanel n="03" />
      <ScreenPhotoPanel n="04" />
    </>
  )
}

export function Swatch() {
  return (
    <span
      style={{
        width: 62,
        height: 78,
        display: 'grid',
        gridTemplateRows: '8px 11px 1fr 10px',
        background: '#eef4f8',
        border: '1px solid rgba(0,0,0,.35)',
        fontFamily: 'Galmuri11, sans-serif',
      }}
    >
      <span style={{ background: '#0f2b44' }} />
      <span style={{ background: 'linear-gradient(#3aa0e8,#1565c0)' }} />
      <span style={{ display: 'grid', gridAutoRows: '1fr' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <i
            key={i}
            style={{
              display: 'block',
              borderBottom: '1px dotted rgba(20,35,46,.3)',
              background: i === 0 ? 'linear-gradient(#2f8de0,#1256a8)' : i % 2 ? '#e2ecf3' : 'transparent',
            }}
          />
        ))}
      </span>
      <span style={{ background: 'linear-gradient(#3aa0e8,#1565c0)' }} />
    </span>
  )
}
