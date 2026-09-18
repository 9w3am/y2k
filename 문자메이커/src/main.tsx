import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './styles/fonts.css'
// 고딕은 기기 글꼴 대신 직접 들고 있는 나눔고딕 — 아이폰·갤럭시·PC 어디서든 같은 글자
import '@fontsource/nanum-gothic/400.css'
import '@fontsource/nanum-gothic/700.css'
import './styles/base.css'
import './editable/editable.css'
import './styles/tools.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/:themeId" element={<App />} />
        <Route path="*" element={<Navigate to="/sms-write" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)

/* 설치해서 프로그램처럼 쓸 수 있게 한다 */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // 새 판이 올라오면 한 번만 새로고침한다 —
  // 이게 없으면 예전 화면에 갇힌 채로 계속 남는다
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => reg.update())
      .catch(() => {})
  })
}
