import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSite } from './lib/store'
import { fontStack, patternCss } from './lib/deco'
import { collectRefs, moveInlineImages, pruneImages, useImg } from './lib/imageStore'

/** 예전 저장본·공유 링크에 새 꾸밈 칸이 없을 때 쓰는 값 */
const CUSTOM_FALLBACK = {
  ink: '#3a444f',
  line: '#a5d2ec',
  paper: '#ffffff',
  tab: '#f0f9fe',
  round: 12,
  border: 'dotted',
}
import { Gnb } from './ui/Chrome'
import { BgmHost, Hompy } from './ui/Hompy'
import { AppShell } from './ui/AppShell'
import { DialogHost } from './ui/dialog'
import { SharedLoader, ViewingBar, useRestoreShared } from './ui/Shared'
import { Portal } from './pages/Portal'
import {
  Board,
  Diary,
  Guest,
  Home,
  JjakList,
  JjakView,
  Paper,
  Photo,
  Profile,
  Setting,
  Shop,
} from './pages/pages'

function Pages() {
  return (
    <Routes>
      <Route path="/" element={<Portal />} />
      <Route path="/v/:code" element={<SharedLoader />} />
      <Route element={<Hompy />}>
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/photo" element={<Photo />} />
        <Route path="/board" element={<Board />} />
        <Route path="/paper" element={<Paper />} />
        <Route path="/guest" element={<Guest />} />
        <Route path="/jjak" element={<JjakList />} />
        <Route path="/jjak/:id" element={<JjakView />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/setting" element={<Setting />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  const skin = useSite((s) => s.skin)
  const shell = useSite((s) => s.shell)
  const countVisit = useSite((s) => s.countVisit)
  useRestoreShared()

  useEffect(() => {
    document.documentElement.dataset.skin = skin
  }, [skin])

  /*
     직접 꾸민 값이 켜져 있으면 프리셋 위에 덮어쓴다.
     색 네 개만 바꾸면 테두리·칸 바탕·글자색이 예전 스킨 그대로 남아
     "꾸밈새대로 안 되는" 곳이 생긴다 — 스킨이 쓰는 변수를 전부 덮는다.
  */
  const custom = useSite((s) => s.custom)
  const bgImageUrl = useImg(custom.bgImage)
  useEffect(() => {
    const el = document.documentElement
    const on = custom.on
    el.dataset.custom = on ? '1' : ''
    const d = CUSTOM_FALLBACK
    const ink = custom.ink ?? d.ink
    const line = custom.line ?? d.line
    const paper = custom.paper ?? d.paper
    const round = custom.round ?? d.round
    const pat = patternCss(custom.pattern, paper)
    const hasImage = !!(custom.bgImage && bgImageUrl)
    const vars: [string, string][] = [
      ['--accent', custom.accent],
      ['--accent-2', custom.accent2],
      ['--paper', paper],
      ['--ink', ink],
      ['--ink-dim', `color-mix(in srgb, ${ink} 58%, ${paper})`],
      ['--line-2', line],
      ['--line', `color-mix(in srgb, ${line} 42%, ${paper})`],
      ['--tab', custom.tab ?? d.tab],
      ['--round', `${round}px`],
      ['--round-sm', `${Math.round(round * 0.66)}px`],
      ['--my-border', custom.border ?? d.border],
      ['--my-title-font', fontStack(custom.titleFont, 'pen')],
      ['--my-body-font', fontStack(custom.bodyFont, 'dotum')],
      ['--my-bg', custom.bgColor],
      ['--my-bg-image', hasImage ? `url(${bgImageUrl})` : pat.image],
      [
        '--my-bg-size',
        hasImage ? (custom.bgFit === 'cover' ? 'cover' : `${custom.bgSize}px`) : pat.size,
      ],
      ['--my-bg-repeat', hasImage && custom.bgFit === 'cover' ? 'no-repeat' : 'repeat'],
    ]
    for (const [k, v] of vars) on ? el.style.setProperty(k, v) : el.style.removeProperty(k)
  }, [custom, bgImageUrl])

  /*
     예전 저장본은 사진을 설정 안에 통째로(data:) 넣어 두었다.
     브라우저 저장 한도(5MB 남짓)를 금방 채우므로, 한 번 사진 보관소로 옮긴다.
     옮기는 사이에 고친 글이 덮이지 않게 사진 칸만 바꿔 끼운다.
  */
  const migrated = useRef(false)
  useEffect(() => {
    if (migrated.current) return
    migrated.current = true
    const s = useSite.getState()
    if (s.viewing) return
    const heavy = { me: s.me, photo: s.photo, bgImage: s.custom.bgImage }
    const move = JSON.stringify(heavy).includes('"data:image')
      ? moveInlineImages(heavy).then(({ value, moved }) => {
          if (!moved) return
          const now = useSite.getState()
          const srcById = new Map(value.photo.map((p) => [p.id, p.src]))
          useSite.setState({
            me: { ...now.me, photo: value.me.photo, room: value.me.room },
            photo: now.photo.map((p) => ({ ...p, src: srcById.get(p.id) ?? p.src })),
            custom: { ...now.custom, bgImage: value.bgImage },
          })
        })
      : Promise.resolve()
    // 옮기기가 끝난 뒤, 어디서도 안 쓰는 사진은 보관소에서 치운다
    void move.then(() => {
      if (useSite.getState().viewing) return
      void pruneImages(collectRefs(useSite.getState()))
    })
  }, [])

  // 한 번 들어온 것은 한 번만 센다 (개발 중 이중 실행 방지)
  const counted = useRef(false)
  useEffect(() => {
    if (counted.current) return
    counted.current = true
    countVisit()
  }, [countVisit])

  if (shell === 'app')
    return (
      <AppShell>
        <BgmHost />
        <DialogHost />
        <ViewingBar />
        <div className="wrap">
          <Pages />
        </div>
      </AppShell>
    )

  return (
    <>
      <BgmHost />
      <DialogHost />
      <Gnb />
      <ViewingBar />
      <div className="wrap">
        <Pages />
      </div>
    </>
  )
}
