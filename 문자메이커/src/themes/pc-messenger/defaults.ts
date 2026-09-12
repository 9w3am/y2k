import { fxDefaults } from '../../editable/ScreenFx'

export const defaults = {
  ...fxDefaults,
  // CRT 모니터를 찍은 느낌 — 주사선을 살리고 색조는 옅게
  fxTint: '#9fd4ff',
  fxTintAmt: '8',
  fxGlow: '6',
  fxBlur: '4',

  winTitle: '문자',
  body: '',
  to: '',
  to2: '',
  to3: '',
  from: '0192442158',
  maxByte: '80',
  byteOverride: '',

  free: '70',
  cash: '0',
  cashMark: '폰캐시',
  prefix: `문자 요금제
신청 / 해제`,

  adLine: '무료문자 충전소',
  adSub: '신청하면 100건 무료',
  adBtn: '상담신청',
  adBlink: '1',

  btn1: '보내기',
  btn2: '다시작성',
  btn3: '취소',

  sentLabel: '보낸 메시지함',
  sentCount: '12',
  planLabel: '예약 메시지함',
  planCount: '2',
  statusText: '준비  ·  연결됨',

  emoSet: 'face',
  showEmo: '1',
  showChars: '1',
  showAd: '1',
  showStatus: '1',
  lcdSize: '11',

  tab: '3',
  skin: 'luna', // luna | silver | olive
}
