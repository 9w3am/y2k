import { fxDefaults } from '../../editable/ScreenFx'
import { photoDefaults } from '../../editable/ScreenPhoto'

export const defaults = {
  ...fxDefaults,
  ...photoDefaults,
  fxTint: '#ffffff',
  fxTintAmt: '0',
  fxGlow: '0',
  fxBlur: '2',

  clock: '03:09AM',
  tab1: '편지지',
  tab2: '아바타',
  tab1On: '0',
  tab2On: '0',

  body: `요즘 어떻게 지내
별일 없으면 그걸로
됐다 싶다가도
가끔은 궁금해져`,
  byteText: '2 byte',
  attachLabel: '첨부',
  attachValue: '',

  sk1: '메뉴',
  sk2: '전송',
  sk3: '한글',

  size: '32',
  lead: '138',
  battery: '3',
}
