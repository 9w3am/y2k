/*
   실제 사이트 화면을 고해상도로 찍는다 (크롬 헤드리스 + DevTools 프로토콜, 의존성 없음).
   node tools/shots.mjs <폴더>
   개발 서버(아이로그 5190, 수신함 5183)가 켜져 있어야 한다.
*/
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = resolve(import.meta.dirname, '..')
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))
const out = resolve(process.argv[2] ?? 'shots')
mkdirSync(out, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const PORT = 9333
const profile = mkdtempSync(join(tmpdir(), 'shots-'))
const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run', 'about:blank'],
  { stdio: 'ignore' },
)

for (let i = 0; i < 60; i++) {
  try {
    await fetch(`http://127.0.0.1:${PORT}/json/version`)
    break
  } catch {
    await sleep(250)
  }
}
const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))

let seq = 0
const pending = new Map()
const listeners = new Set()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id)
    pending.delete(m.id)
    m.error ? rej(new Error(m.error.message)) : res(m.result)
  } else listeners.forEach((f) => f(m))
}
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++seq
    pending.set(id, { res, rej })
    ws.send(JSON.stringify({ id, method, params }))
  })
const loaded = () =>
  new Promise((r) => {
    const f = (m) => {
      if (m.method === 'Page.loadEventFired') {
        listeners.delete(f)
        r()
      }
    }
    listeners.add(f)
  })
const go = async (url) => {
  const p = loaded()
  await send('Page.navigate', { url })
  await p
}
const run = (expression) => send('Runtime.evaluate', { expression, awaitPromise: true })

await send('Page.enable')
await send('Runtime.enable')

/**
 * clip  — 그 요소만 오려 찍는다. 배경은 투명하게 (css 로 바탕을 걷어낸다)
 * css   — 찍기 전에 끼워 넣는 스타일
 */
async function shot({ name, url, w, h, dpr = 2, mobile = false, setup, after, wait = 1800, clip, css }) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile })
  await go('about:blank')
  await go(url)
  if (setup) {
    await run(setup)
    await go('about:blank')
    await go(url)
  }
  await sleep(wait)
  if (css)
    await run(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(css)}; document.head.append(s); return 1 })()`)
  if (after) await run(after)
  await sleep(700)
  await run('document.fonts.ready.then(() => 1)')
  let area
  if (clip) {
    const { result } = await run(`JSON.stringify(document.querySelector(${JSON.stringify(clip)}).getBoundingClientRect())`)
    const r = JSON.parse(result.value)
    area = { clip: { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 }, captureBeyondViewport: true }
    await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
  }
  const { data } = await send('Page.captureScreenshot', { format: 'png', ...area })
  if (clip) await send('Emulation.setDefaultBackgroundColorOverride', {})
  writeFileSync(join(out, `${name}.png`), Buffer.from(data, 'base64'))
  console.log('shot', name)
}

const I = 'http://localhost:5190/'
const S = 'http://localhost:5183/'
const seen = `localStorage.setItem('retro:seen', '1')`

const list = [
  { name: 'ilog-home', url: `${I}#/home`, w: 1280, h: 860 },
  { name: 'ilog-portal', url: `${I}#/`, w: 1280, h: 860 },
  { name: 'ilog-diary', url: `${I}#/diary`, w: 1280, h: 860 },
  { name: 'ilog-home-m', url: `${I}#/home`, w: 390, h: 844, dpr: 3, mobile: true },
  { name: 'inbox-write', url: `${S}#/sms-write`, w: 1440, h: 900, setup: seen },
  { name: 'inbox-inbox', url: `${S}#/sms-inbox`, w: 1440, h: 900, setup: seen },
  { name: 'inbox-pc', url: `${S}#/pc-messenger`, w: 1440, h: 900, setup: seen },
  { name: 'inbox-view', url: `${S}#/sms-view`, w: 1440, h: 900, setup: seen },
  { name: 'inbox-write-m', url: `${S}#/sms-write`, w: 390, h: 844, dpr: 3, mobile: true, setup: seen },
  { name: 'landing', url: pathToFileURL(join(ROOT, 'landing/index.html')).href, w: 1200, h: 630 },
  // 배포된 사이트 확인용
  { name: 'live-landing', url: 'https://netizen324.github.io/y2k/', w: 1280, h: 800 },
  { name: 'live-landing-m', url: 'https://netizen324.github.io/y2k/', w: 390, h: 844, dpr: 2, mobile: true },
  { name: 'live-inbox-notice-m', url: 'https://netizen324.github.io/y2k/inbox/', w: 375, h: 667, dpr: 2, mobile: true },
  { name: 'live-inbox-m', url: 'https://netizen324.github.io/y2k/inbox/', w: 390, h: 844, dpr: 2, mobile: true, setup: seen },
  { name: 'ilog-diary-m', url: `${I}#/diary`, w: 390, h: 844, dpr: 3, mobile: true },
  { name: 'ilog-guest-m', url: `${I}#/guest`, w: 390, h: 844, dpr: 3, mobile: true },
  { name: 'ilog-portal-m', url: `${I}#/`, w: 390, h: 844, dpr: 3, mobile: true },
  ...['home', 'diary', 'guest', 'photo'].map((p) => ({
    name: `c-ilog-${p}`,
    url: `${I}#/${p}`,
    w: 1280,
    h: 1500,
    dpr: 2,
    clip: '.hompy',
    css: 'html,body{background:none!important}',
  })),
  ...['sms-write', 'sms-view', 'sms-compose', 'sms-attach', 'sms-inbox', 'pc-messenger'].map((t) => ({
    name: `c-${t}`,
    url: `${S}#/${t}`,
    w: 1440,
    h: 900,
    dpr: 3,
    setup: seen,
    clip: '.canvas',
    css: 'html,body,#root,.app,.stage{background:none!important}.canvas{box-shadow:none!important}.floaters,.stage-hint{display:none!important}',
  })),
]
const only = process.argv[3]?.split(',')
for (const s of list) if (!only || only.includes(s.name)) await shot(s)

ws.close()
chrome.kill()
process.exit(0)
