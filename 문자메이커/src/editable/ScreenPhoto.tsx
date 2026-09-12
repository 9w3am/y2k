import { useValue } from '../lib/store'
import { ImageField, Section, Slider } from '../ui/controls'

/**
 * 화면 뒤에 까는 사진.
 * 처음엔 문자 쓰기에만 있었는데, 사진을 깔고 싶은 건 어느 화면이나 같아서
 * 한 군데로 모아 모든 테마가 같이 쓴다.
 *
 * 화면 맨 앞(테마 칸 첫 줄)에 놓아야 글자가 사진 위로 올라온다.
 */
export function ScreenPhoto() {
  const bg = useValue('bg')
  const dim = Number(useValue('bgDim')) || 0
  if (!bg) return null

  return (
    <>
      <div className="scr-photo" style={{ backgroundImage: `url(${bg})` }} />
      {dim > 0 && <div className="scr-dim" style={{ opacity: dim / 100 }} />}
    </>
  )
}

/** 사진을 고르고 어둡기를 맞추는 조작부 */
export function ScreenPhotoPanel({ n }: { n: string }) {
  return (
    <Section n={n} title="배경 사진" note="사진을 깔면 그 위에 글자가 올라갑니다.">
      <ImageField k="bg" label="이미지 선택" />
      <Slider k="bgDim" label="배경 어둡기" min={0} max={80} suffix="%" />
    </Section>
  )
}

/** 테마 기본값에 섞어 넣는다 */
export const photoDefaults = { bg: '', bgDim: '0' }
