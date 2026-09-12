import './theme.css'
import { ScreenFx, ScreenFxPanel, useFxRoot } from '../../editable/ScreenFx'
import { EditableText } from '../../editable/EditableText'
import { useValue } from '../../lib/store'
import { Section, Seg, Slider } from '../../ui/controls'

/** 메모지 — 도트로 직접 찍는다 */
function NoteIcon() {
  return (
    <svg width="26" height="28" viewBox="0 0 13 14" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M1 0h11v14H1z" fill="#fff" stroke="#1b1b1b" strokeWidth="1" />
      <path d="M0 1h3v1H0zM0 4h3v1H0zM0 7h3v1H0zM0 10h3v1H0z" fill="#1b1b1b" />
      <path d="M4 3h7v1H4zM4 6h7v1H4zM4 9h5v1H4z" fill="#6f7a80" />
    </svg>
  )
}

/** 선물상자 — 편지종류 옆 */
function GiftIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 13 13" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M0 4h13v9H0z" fill="#e8a32a" stroke="#1b1b1b" strokeWidth="1" />
      <path d="M0 2h13v3H0z" fill="#f5cf72" stroke="#1b1b1b" strokeWidth="1" />
      <path d="M5 2h3v11H5z" fill="#cf4a3a" />
      <path d="M3 0h3v2H3zM7 0h3v2H7z" fill="#cf4a3a" />
    </svg>
  )
}

export function Screen() {
  const fx = useFxRoot()
  const tone = useValue('tone')

  return (
    <div className={`t-compose t-${tone} ${fx.className}`} style={fx.style}>
      <div className="title">
        <EditableText k="title" multiline={false} maxChars={12} />
      </div>

      <div className="label-row">
        <NoteIcon />
        <EditableText k="label" multiline={false} maxChars={12} />
      </div>

      <div className="box-wrap">
        <div className="box">
          <EditableText
            k="body"
            className="box-text"
            placeholder="보낼 내용을 쓰세요"
            style={{
              fontSize: `${useValue('size')}px`,
              lineHeight: Number(useValue('lead')) / 100,
            }}
          />
          <div className="scroll" aria-hidden="true">
            <i style={{ top: `${useValue('scrollPos')}%` }} />
          </div>
        </div>
      </div>

      <div className="attach">
        <GiftIcon />
        <EditableText k="attachLabel" multiline={false} maxChars={10} />
      </div>
      <div className="attach-field">
        <EditableText k="attachValue" multiline={false} maxChars={20} placeholder=" " />
      </div>

      <div className="keys">
        <EditableText k="sk1" className="sk" multiline={false} maxChars={6} />
        <EditableText k="sk2" className="sk" multiline={false} maxChars={6} />
        <EditableText k="sk3" className="sk" multiline={false} maxChars={6} />
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
        note="제목띠, 내용 딱지, 본문, 편지종류, 아래 세 버튼까지 전부 눌러서 고칩니다."
      >
        <Slider k="size" label="본문 크기" min={20} max={48} step={2} suffix="px" />
        <Slider k="lead" label="줄 간격" min={110} max={200} step={5} suffix="%" />
      </Section>

      <Section n="02" title="화면 색">
        <Seg
          k="tone"
          label="본문 판"
          options={[
            { value: 'cyan', label: '하늘' },
            { value: 'dark', label: '검정' },
            { value: 'paper', label: '흰색' },
          ]}
        />
        <Slider k="scrollPos" label="스크롤 위치" min={0} max={64} suffix="%" />
      </Section>

      <ScreenFxPanel n="03" />
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
        gridTemplateRows: '12px 8px 1fr 10px',
        background: '#f2f4f2',
        border: '2px solid #1b1b1b',
      }}
    >
      <span style={{ background: 'linear-gradient(#f7d07a,#cf8f14)', borderBottom: '2px solid #1b1b1b' }} />
      <span />
      <span style={{ display: 'flex', margin: '0 3px', border: '2px solid #1b1b1b', background: '#3fc0e8' }}>
        <i style={{ flex: 1 }} />
        <i style={{ width: 7, borderLeft: '2px solid #1b1b1b', background: '#cfe9f5' }} />
      </span>
      <span style={{ marginTop: 3, background: 'linear-gradient(#8fd9f2,#39a6d8)', borderTop: '2px solid #1b1b1b' }} />
    </span>
  )
}
