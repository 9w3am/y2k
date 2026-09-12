import { fxDefaults } from '../../editable/ScreenFx'

export const defaults = {
  ...fxDefaults,
  fxTint: '#7fb4d8',
  fxTintAmt: '10',
  fxGlow: '4',
  fxBlur: '0',

  title: '메시지 작성',
  label: '메시지 내용',
  body: `잘 지내지?
다음에 얼굴 보자.`,
  attachLabel: '편지종류',
  attachValue: '',
  sk1: '메뉴',
  sk2: 'OK입력',
  sk3: '전송',

  tone: 'cyan', // cyan | dark | paper
  size: '34',
  lead: '135',
  scrollPos: '10',
}
