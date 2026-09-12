import { fxDefaults } from '../../editable/ScreenFx'

export const defaults = {
  ...fxDefaults,
  fxBlur: '0',
  // 파랑 백라이트에 맞춘 색조 — 분홍이 겹치면 보라로 보인다
  fxTint: '#4fa8ff',


  body: `오늘 하늘 좀 봐
색깔이 이상하게 예뻐`,
  time: '9/3 7:41 PM',
  sk1: '저장',
  sk2: '다시쓰기',
  byteOverride: '',
  maxByte: '90',

  font: 'pixel', // gothic | pixel
  align: 'left', // left | center
  size: '30',
  lead: '150',
  ink: '#2b2f33',

  lcd: 'blue', // white | blue | green
  scan: '0',
  bg: '',
  bgDim: '0',

  signal: '4',
  battery: '3',
  showMail: '1',
  showTime: '1',
}
