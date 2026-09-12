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
  server: { port, host: true },
})
