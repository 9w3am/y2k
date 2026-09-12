import './screenfx.css'
import { useValue } from '../lib/store'
import { ColorField, Section, Seg, Slider, SwitchField } from '../ui/controls'

/** 어느 테마든 이 키들만 defaults 에 넣으면 효과가 붙는다 */
export const fxDefaults = {
  fxTint: '#ff4fa3',
  fxTintAmt: '13',
  fxGlow: '5',
  fxGrain: '1',
  fxGlare: '1',
  fxVig: '1',
  fxBlur: '3',
  /* 화면 모서리 — 둥근 게 기본 */
  screenShape: 'round',
  screenRound: '30',
}

/** 화면 위에 덮이는 LCD 효과 층 */
export function ScreenFx() {
  const tint = useValue('fxTint')
  const amt = Number(useValue('fxTintAmt'))
  const glow = Number(useValue('fxGlow'))

  return (
    <div className="screenfx">
      {useValue('fxGrain') === '1' && (
        <>
          <div className="fx-grain-v" />
          <div className="fx-grain-h" />
        </>
      )}
      {amt > 0 && <div className="fx-tint-mul" style={{ background: tint, opacity: amt / 100 }} />}
      {glow > 0 && (
        <div className="fx-tint-scr" style={{ background: tint, opacity: glow / 100 }} />
      )}
      {useValue('fxGlare') === '1' && <div className="fx-glare" />}
      {useValue('fxVig') === '1' && <div className="fx-vig" />}
    </div>
  )
}

/** 테마 루트에 붙일 클래스와 스타일 */
export function useFxRoot() {
  const blur = Number(useValue('fxBlur'))
  return {
    className: blur > 0 ? 'fx-soft' : '',
    style: blur > 0 ? ({ ['--fx-blur' as string]: `${blur / 10}px` } as React.CSSProperties) : undefined,
  }
}

const PRESETS = [
  { value: '#ff4fa3', label: '핑크' },
  { value: '#4fa8ff', label: '하늘' },
  { value: '#7fd94f', label: '연두' },
  { value: '#ffb04f', label: '호박' },
]

/** 각 테마의 패널에 그대로 꽂아 쓰는 공통 절 */
export function ScreenFxPanel({ n }: { n: string }) {
  const shape = useValue("screenShape")
  return (
    <Section
      n={n}
      title="화면 효과"
      note="그 시절 화면은 늘 '찍은 사진'으로 남았습니다. 색조와 서브픽셀 결, 유리 반사를 얹으면 훨씬 그럴듯해집니다."
    >
      <Seg k="fxTint" label="색조 고르기" options={PRESETS} />
      <ColorField k="fxTint" label="색조 직접 고르기" />
      <Slider k="fxTintAmt" label="색 입히기" min={0} max={60} suffix="%" />
      <Slider k="fxGlow" label="백라이트 번짐" min={0} max={40} suffix="%" />
      <Slider k="fxBlur" label="초점 흐림" min={0} max={12} suffix="" />
      <SwitchField k="fxGrain" label="서브픽셀 결" />
      <SwitchField k="fxGlare" label="유리 반사" />
      <SwitchField k="fxVig" label="가장자리 그늘" />
      <Seg
        k="screenShape"
        label="화면 모서리"
        options={[
          { value: 'round', label: '둥글게' },
          { value: 'square', label: '각지게' },
        ]}
      />
      {shape === 'round' && <Slider k="screenRound" label="모서리 크기" min={6} max={64} suffix="px" />}
    </Section>
  )
}
