import './theme.css'
import { ScreenFx, ScreenFxPanel, useFxRoot } from '../../editable/ScreenFx'
import { ScreenPhoto, ScreenPhotoPanel } from '../../editable/ScreenPhoto'
import { EditableText } from '../../editable/EditableText'
import { useValue } from '../../lib/store'
import { Section, Seg, Slider, SwitchField } from '../../ui/controls'

/* 무음(종 그은) 아이콘 — 도트로 직접 찍는다 */
function BellOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M3 0h2v1H3zM2 1h4v1H2zM1 2h6v3H1zM0 5h8v1H0zM3 6h2v1H3z" fill="currentColor" />
      <path d="M0 0h1v1H0zM1 1h1v1H1zM2 2h1v1H2zM3 3h1v1H3zM4 4h1v1H4zM5 5h1v1H5zM6 6h1v1H6z" fill="#e2413f" />
    </svg>
  )
}

function Lock() {
  return (
    <svg width="13" height="16" viewBox="0 0 6 8" shapeRendering="crispEdges" aria-hidden="true">
      {/* 열쇠구멍은 칠하지 않고 구멍으로 — PNG 저장본에서도 똑같이 */}
      <path d="M1 0h4v1H1zM1 1h1v2H1zM4 1h1v2H4zM0 3h6v5H0zM2 5v2h2V5z" fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}

export function Screen() {
  const fx = useFxRoot()
  const hue = useValue('hue')
  const font = useValue('font')
  const signal = Number(useValue('signal'))
  const battery = Number(useValue('battery'))

  return (
    <div className={`t-smsview hue-${hue} f-${font} ${fx.className}`} style={fx.style}>
      <ScreenPhoto />
      <div className="status">
        <span className="ant" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <i key={n} className={n <= signal ? 'on' : ''} />
          ))}
        </span>
        {useValue('showBell') === '1' && <BellOff />}
        <span className="status-spacer" />
        {useValue('showLock') === '1' && <Lock />}
        <span className="batt-shell" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <i key={n} className={n <= battery ? 'on' : ''} />
          ))}
        </span>
      </div>

      <div className="title">
        <EditableText k="sender" multiline={false} maxChars={14} placeholder="보낸 사람" />
      </div>

      <div className="page">
        <div className="box" style={{ padding: `${useValue('boxPad')}px` }}>
          <EditableText
            k="body"
            className="body"
            placeholder="받은 문자 내용"
            style={{
              fontSize: `${useValue('size')}px`,
              lineHeight: Number(useValue('lead')) / 100,
              textAlign: useValue('align') as 'left' | 'center',
            }}
          />
        </div>
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
        note="위쪽 이름, 가운데 본문, 아래 세 개의 버튼 글씨를 전부 눌러서 고칠 수 있습니다."
      >
        <Slider k="size" label="본문 크기" min={20} max={46} suffix="px" />
        <Slider k="lead" label="줄 간격" min={110} max={220} step={2} suffix="%" />
        <Seg
          k="align"
          label="본문 정렬"
          options={[
            { value: 'left', label: '왼쪽' },
            { value: 'center', label: '가운데' },
          ]}
        />
        <Slider k="boxPad" label="상자 여백" min={8} max={44} suffix="px" />
      </Section>

      <Section n="02" title="화면 스타일">
        <Seg
          k="hue"
          label="백라이트 색"
          options={[
            { value: 'blue', label: '파랑' },
            { value: 'green', label: '초록' },
            { value: 'violet', label: '보라' },
            { value: 'amber', label: '주황' },
          ]}
        />
        <Seg
          k="font"
          label="글꼴"
          options={[
            { value: 'gothic', label: '고딕' },
            { value: 'pixel', label: '픽셀' },
          ]}
        />
      </Section>

      <Section n="03" title="상태바">
        <Slider k="signal" label="안테나" min={0} max={4} suffix="칸" />
        <Slider k="battery" label="배터리" min={0} max={3} suffix="칸" />
        <SwitchField k="showBell" label="무음 아이콘" />
        <SwitchField k="showLock" label="잠금 아이콘" />
      </Section>
      <ScreenFxPanel n="04" />
      <ScreenPhotoPanel n="05" />
    </>
  )
}

export function Swatch() {
  return (
    <span
      style={{
        width: 60,
        height: 80,
        display: 'grid',
        gridTemplateRows: '8px 12px 1fr 11px',
        background: '#cfeafb',
        border: '1px solid rgba(0,0,0,.35)',
      }}
    >
      <span style={{ background: '#12446b' }} />
      <span style={{ background: 'linear-gradient(#52b6ea,#1d6fae)' }} />
      <span style={{ margin: 4, background: '#eaf6fe', border: '1px solid rgba(0,0,0,.3)', display: 'grid', alignContent: 'center', gap: 3, padding: '0 4px' }}>
        <i style={{ height: 2.5, background: '#102c45' }} />
        <i style={{ height: 2.5, background: '#102c45' }} />
        <i style={{ height: 2.5, width: '55%', background: '#102c45' }} />
      </span>
      <span style={{ background: 'linear-gradient(#52b6ea,#1d6fae)' }} />
    </span>
  )
}
