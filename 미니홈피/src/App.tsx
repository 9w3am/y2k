import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSite } from './lib/store'
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

  /* 직접 꾸민 값이 켜져 있으면 프리셋 위에 덮어쓴다 */
  const custom = useSite((s) => s.custom)
  useEffect(() => {
    const el = document.documentElement
    const on = custom.on
    el.dataset.custom = on ? '1' : ''
    const vars: [string, string][] = [
      ['--accent', custom.accent],
      ['--accent-2', custom.accent2],
      ['--paper', custom.paper],
      ['--my-bg', custom.bgColor],
      ['--my-bg-image', custom.bgImage ? `url(${custom.bgImage})` : 'none'],
      [
        '--my-bg-size',
        custom.bgImage ? (custom.bgFit === 'cover' ? 'cover' : `${custom.bgSize}px`) : 'auto',
      ],
      ['--my-bg-repeat', custom.bgFit === 'cover' ? 'no-repeat' : 'repeat'],
    ]
    for (const [k, v] of vars) on ? el.style.setProperty(k, v) : el.style.removeProperty(k)
  }, [custom])

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
