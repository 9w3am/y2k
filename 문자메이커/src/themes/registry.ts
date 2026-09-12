import type { FC } from 'react'

export interface RetroTheme {
  /** URL 조각이자 localStorage 키 */
  id: string
  name: string
  /** 고정 픽셀 캔버스. 화면이 좁으면 통째로 축소될 뿐 재배치되지 않는다. */
  canvas: { w: number; h: number }
  Screen: FC
  Panel: FC
  /** 테마 고르기 그리드에 쓰는 작은 견본 */
  Swatch: FC
  defaults: Record<string, string>
}

import * as smsWrite from './sms-write'
import { defaults as smsWriteDefaults } from './sms-write/defaults'

import * as smsView from './sms-view'
import { defaults as smsViewDefaults } from './sms-view/defaults'

import * as smsInbox from './sms-inbox'
import { defaults as smsInboxDefaults } from './sms-inbox/defaults'

import * as smsCompose from './sms-compose'
import { defaults as smsComposeDefaults } from './sms-compose/defaults'

import * as smsAttach from './sms-attach'
import { defaults as smsAttachDefaults } from './sms-attach/defaults'

import * as pcMessenger from './pc-messenger'
import { defaults as pcMessengerDefaults } from './pc-messenger/defaults'


export const themes: RetroTheme[] = [
  {
    id: 'sms-write',
    name: '문자 쓰기',
    canvas: { w: 480, h: 640 },
    Screen: smsWrite.Screen,
    Panel: smsWrite.Panel,
    Swatch: smsWrite.Swatch,
    defaults: smsWriteDefaults,
  },
  {
    id: 'sms-view',
    name: '문자 보기',
    canvas: { w: 480, h: 640 },
    Screen: smsView.Screen,
    Panel: smsView.Panel,
    Swatch: smsView.Swatch,
    defaults: smsViewDefaults,
  },
  {
    id: 'sms-compose',
    name: '메시지 작성',
    canvas: { w: 480, h: 640 },
    Screen: smsCompose.Screen,
    Panel: smsCompose.Panel,
    Swatch: smsCompose.Swatch,
    defaults: smsComposeDefaults,
  },
  {
    id: 'sms-attach',
    name: '편지지 · 아바타',
    canvas: { w: 480, h: 640 },
    Screen: smsAttach.Screen,
    Panel: smsAttach.Panel,
    Swatch: smsAttach.Swatch,
    defaults: smsAttachDefaults,
  },
  {
    id: 'sms-inbox',
    name: '받은문자함',
    canvas: { w: 480, h: 600 },
    Screen: smsInbox.Screen,
    Panel: smsInbox.Panel,
    Swatch: smsInbox.Swatch,
    defaults: smsInboxDefaults,
  },
  {
    id: 'pc-messenger',
    name: 'PC 문자 발송기',
    canvas: { w: 400, h: 490 },
    Screen: pcMessenger.Screen,
    Panel: pcMessenger.Panel,
    Swatch: pcMessenger.Swatch,
    defaults: pcMessengerDefaults,
  },
]

export const byId = (id: string): RetroTheme => themes.find((t) => t.id === id) ?? themes[0]
