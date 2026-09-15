import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './styles/fonts.css'
import './styles/site.css'
import './styles/cute.css'
import './styles/app.css'
import './styles/responsive.css'
import './styles/player.css'
import './styles/blog.css'
import './styles/account.css'
import './styles/social.css'
import './styles/admin.css'
import './styles/gnb.css'
import { App } from './App'
import { Boundary } from './ui/Boundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boundary>
      <HashRouter>
        <App />
      </HashRouter>
    </Boundary>
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
