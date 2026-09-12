import './theme.css'
import { ScreenFx, ScreenFxPanel, useFxRoot } from '../../editable/ScreenFx'
import { EditableText, ByteCounter } from '../../editable/EditableText'
import { useValue } from '../../lib/store'
import { ColorField, ImageField, Section, Seg, Slider, SwitchField } from '../../ui/controls'

function Envelope() {
  return (
    <svg width="22" height="16" viewBox="0 0 11 8" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M0 0h11v8H0z" fill="currentColor" />
      <path d="M1 1h9v6H1z" fill="var(--lcd-1)" />
      <path d="M1 1h9v1H1zM2 2h7v1H2zM3 3h5v1H3zM4 4h3v1H4z" fill="currentColor" />
    </svg>
  )
}

export function Screen() {
  const fx = useFxRoot()
  const font = useValue('font')
  const lcd = useValue('lcd')
  const align = useValue('align')
  const signal = Number(useValue('signal'))
  const battery = Number(useValue('battery'))
  const bg = useValue('bg')
  const bgDim = Number(useValue('bgDim'))

  return (
    <div className={`t-smswrite lcd-${lcd} f-${font} ${fx.className}`} style={fx.style}>
      {bg && (
        <>
          <div className="lcd-photo" style={{ backgroundImage: `url(${bg})` }} />
          <div className="lcd-dim" style={{ opacity: bgDim / 100 }} />
        </>
      )}
      {useValue('scan') === '1' && <div className="lcd-grain" />}
      <div className="lcd-vig" />

      <div className="bar">
        <span className="ant" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <i key={n} className={n <= signal ? 'on' : ''} />
          ))}
        </span>
        <span className="bar-spacer" />
        <ByteCounter sourceKey="body" overrideKey="byteOverride" max={Number(useValue('maxByte'))} />
        <span className="byte-unit">byte</span>
        {useValue('showMail') === '1' && <Envelope />}
        <span className="bar-spacer" />
        <span className="batt" aria-hidden="true">
          <span className="batt-shell">
            {[1, 2, 3].map((n) => (
              <i key={n} className={n <= battery ? 'on' : ''} />
            ))}
          </span>
          <span className="batt-nub" />
        </span>
      </div>

      <div className="sheet">
        <EditableText
          k="body"
          className="body"
          maxBytes={Number(useValue('maxByte'))}
          placeholder="여기에 문자를 쓰세요"
          style={{
            textAlign: align as 'left' | 'center',
            fontSize: `${useValue('size')}px`,
            lineHeight: Number(useValue('lead')) / 100,
            color: useValue('ink'),
          }}
        />
        {useValue('showTime') === '1' && (
          <EditableText k="time" className="stamp" multiline={false} placeholder="8/2 8:02 AM" />
        )}
      </div>

      <div className="keys">
        <EditableText k="sk1" className="sk" multiline={false} maxChars={6} />
        <EditableText k="sk2" className="sk" multiline={false} maxChars={6} />
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
        note="화면 속 글자를 바로 눌러 고치세요. 본문·시각·아래 버튼 글씨 전부 됩니다. 바이트 숫자도 눌러서 원하는 값으로 고정할 수 있어요."
      >
        <Seg
          k="align"
          label="본문 정렬"
          options={[
            { value: 'left', label: '왼쪽' },
            { value: 'center', label: '가운데' },
          ]}
        />
        <Slider k="size" label="글자 크기" min={18} max={44} suffix="px" />
        <Slider k="lead" label="줄 간격" min={110} max={220} step={5} suffix="%" />
        <ColorField k="ink" label="글자색" />
      </Section>

      <Section n="02" title="화면 스타일">
        <Seg
          k="font"
          label="글꼴"
          options={[
            { value: 'gothic', label: '고딕' },
            { value: 'pixel', label: '픽셀' },
          ]}
        />
        <Seg
          k="lcd"
          label="백라이트"
          options={[
            { value: 'white', label: '흰색' },
            { value: 'blue', label: '파랑' },
            { value: 'green', label: '녹색' },
          ]}
        />
        <SwitchField k="scan" label="LCD 결 살리기" />
      </Section>

      <Section n="03" title="상태바">
        <Slider k="maxByte" label="최대 바이트" min={40} max={140} step={10} />
        <Slider k="signal" label="안테나" min={0} max={4} suffix="칸" />
        <Slider k="battery" label="배터리" min={0} max={3} suffix="칸" />
        <SwitchField k="showMail" label="봉투 아이콘" />
        <SwitchField k="showTime" label="보낸 시각" />
      </Section>

      <Section n="04" title="배경 사진" note="사진을 깔면 그 위에 글자가 올라갑니다.">
        <ImageField k="bg" label="이미지 선택" />
        <Slider k="bgDim" label="배경 어둡기" min={0} max={80} suffix="%" />
      </Section>
      <ScreenFxPanel n="05" />
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
        gridTemplateRows: '11px 1fr 14px',
        background: 'linear-gradient(160deg,#f4f6f8,#e2e8ec 58%,#cfd8de)',
        border: '1px solid rgba(0,0,0,.35)',
      }}
    >
      <span style={{ borderBottom: '1px solid rgba(0,0,0,.12)' }} />
      <span style={{ display: 'grid', alignContent: 'center', gap: 4, padding: '0 8px' }}>
        <i style={{ height: 3, background: '#2b2f33', opacity: 0.8 }} />
        <i style={{ height: 3, background: '#2b2f33', opacity: 0.8 }} />
        <i style={{ height: 3, width: '62%', background: '#2b2f33', opacity: 0.8 }} />
      </span>
      <span style={{ display: 'flex', gap: 3, padding: '0 3px 3px' }}>
        <i style={{ flex: 1, background: 'linear-gradient(#f0f3f5,#c9ced2)', border: '1px solid rgba(0,0,0,.3)' }} />
        <i style={{ flex: 1, background: 'linear-gradient(#f0f3f5,#c9ced2)', border: '1px solid rgba(0,0,0,.3)' }} />
      </span>
    </span>
  )
}
