import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const env = (globalThis as { process?: { env?: Record<string, string> } }).process?.env
const port = Number(env?.PORT) || 5183

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')

export default defineConfig({
  // 지금 보고 있는 게 어느 판인지 화면에서 바로 알 수 있게 박아둔다
  define: { __BUILD__: JSON.stringify(stamp) },
  plugins: [react()],
  base: './',
  // 오래된 아이폰(iOS 13~)·갤럭시 기본 브라우저에서도 돌게 문법과 CSS 를 낮춰 만든다.
  // 기본값은 최신 브라우저 기준이라, 옛 사파리에서는 화면이 통째로 안 뜰 수 있다.
  build: {
    target: ['es2019', 'safari13', 'chrome80', 'firefox78', 'edge88'],
    cssTarget: ['safari13', 'chrome80', 'firefox78'],
  },
  server: { port, host: true },
})
