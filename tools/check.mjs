/*
   배포 전 점검기 — 크롬 헤드리스를 직접 조종해 실제로 눌러 본다. 의존성 없음.
   node tools/check.mjs <내보낼 폴더> <시나리오 이름,...> [기준 주소]
   시나리오는 tools/check-scenarios.mjs 에 있다.

   페이지마다 모으는 것:
   · 자바스크립트 오류, console.error
   · 실패한 요청과 400 이상 응답
   · 파일 고르기 창 → 시험 사진을 자동으로 넣음
   · 내려받기 → 폴더에 저장하고 크기 기록
*/
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { SCENARIOS } from './check-scenarios.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

const out = resolve(process.argv[2] ?? 'check-out')
const names = (process.argv[3] ?? Object.keys(SCENARIOS).join(',')).split(',')
const BASE = process.argv[4] ?? 'https://9w3am.github.io/y2k/'
// 로컬로 돌리면 두 사이트가 각자 개발 서버에 떠 있다
const LOCAL = BASE.startsWith('http://localhost')
const ILOG = LOCAL ? 'http://localhost:5190/' : `${BASE}ilog/`
const INBOX = LOCAL ? 'http://localhost:5183/' : `${BASE}inbox/`
let uploadPath = null
let curDpr = 1
const downloads = join(out, 'downloads')
mkdirSync(downloads, { recursive: true })
const TEST_IMG = join(ROOT, 'landing', 'og.png')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const PORT = 9400 + Math.floor(Math.random() * 400)
const profile = mkdtempSync(join(tmpdir(), 'check-'))
const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run', '--autoplay-policy=no-user-gesture-required', 'about:blank'],
  { stdio: 'ignore' },
)
for (let i = 0; i < 80; i++) {
  try {
    await fetch(`http://127.0.0.1:${PORT}/json/version`)
    break
  } catch {
    await sleep(250)
  }
}

/* ── DevTools 연결 ─────────────────────────────────────── */
async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
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
  return { ws, send, on: (f) => listeners.add(f), off: (f) => listeners.delete(f) }
}

const version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
const browser = await connect(version.webSocketDebuggerUrl)
// 같은 분에 같은 이름으로 저장하면 덮어써진다 — 내려받을 때마다 고유 이름(guid)으로 받고 원래 이름은 따로 적어 둔다
await browser.send('Browser.setDownloadBehavior', { behavior: 'allowAndName', downloadPath: downloads, eventsEnabled: true })
const dlList = []
browser.on((m) => {
  if (m.method === 'Browser.downloadWillBegin') dlList.push({ guid: m.params.guid, name: m.params.suggestedFilename, done: false })
  if (m.method === 'Browser.downloadProgress' && m.params.state === 'completed') {
    const d = dlList.find((x) => x.guid === m.params.guid)
    if (d) d.done = true
  }
})

const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
const page = await connect(target.webSocketDebuggerUrl)
const { send } = page

await send('Page.enable')
await send('Runtime.enable')
await send('Log.enable')
await send('Network.enable')
await send('DOM.enable')
await send('Page.setInterceptFileChooserDialog', { enabled: true })

/* ── 모으기 ────────────────────────────────────────────── */
let problems = []
const IGNORE = [/favicon\.ico/, /youtube\.com|ytimg|googlevideo|doubleclick|google\.com\/js/, /net::ERR_ABORTED/]
const note = (kind, msg) => {
  if (IGNORE.some((r) => r.test(msg))) return
  problems.push(`${kind}: ${msg}`.slice(0, 400))
}
let fileChooserCount = 0
page.on(async (m) => {
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails
    note('오류', `${d.exception?.description ?? d.text} @${d.url ?? ''}:${d.lineNumber ?? ''}`)
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
    note('console.error', m.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') note('로그', `${m.params.entry.text} ${m.params.entry.url ?? ''}`)
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400)
    note(`응답 ${m.params.response.status}`, m.params.response.url)
  if (m.method === 'Network.loadingFailed' && !m.params.canceled) note('요청 실패', `${m.params.errorText} ${m.params.requestId}`)
  if (m.method === 'Page.fileChooserOpened') {
    fileChooserCount++
    try {
      await send('DOM.setFileInputFiles', { files: [uploadPath ?? TEST_IMG], backendNodeId: m.params.backendNodeId })
    } catch (e) {
      note('파일 넣기 실패', e.message)
    }
  }
  if (m.method === 'Page.javascriptDialogOpening') await send('Page.handleJavaScriptDialog', { accept: true })
})

const loaded = () =>
  new Promise((r) => {
    const f = (m) => {
      if (m.method === 'Page.loadEventFired') {
        page.off(f)
        r()
      }
    }
    page.on(f)
    setTimeout(r, 15000)
  })

/* ── 시나리오에 넘겨주는 손 ─────────────────────────────── */
const evalJs = async (expression) => {
  // userGesture — 파일 고르기 창·내려받기는 사람이 누른 것으로 쳐야 열린다
  const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text)
  return result.value
}

const FIND = `
  (label, exact, scope) => {
    const root = scope ? document.querySelector(scope) : document
    if (!root) return null
    const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const cands = [...root.querySelectorAll('button,a,[role=button],label,summary,select,input[type=checkbox],[role=tab],li,.tab,span,div')]
    const norm = (t) => (t || '').replace(/\\s+/g, ' ').trim()
    const hit = (e) => {
      const t = norm(e.innerText || e.getAttribute('aria-label') || e.title || e.value)
      const a = norm(e.getAttribute('aria-label') || e.title)
      return exact ? (t === label || a === label) : (t.includes(label) || a.includes(label))
    }
    // 가장 안쪽(작은) 것부터
    const list = cands.filter((e) => vis(e) && hit(e))
    const clickable = list.filter((e) => e.matches('button,a,[role=button],label,summary,[role=tab]'))
    const pool = clickable.length ? clickable : list
    pool.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length)
    return pool[0] || null
  }`

const api = {
  BASE,
  ILOG,
  INBOX,
  out,
  downloads,
  /** 다음 파일 고르기 창에 넣을 파일 (null 이면 시험 사진) */
  setUpload(p) {
    uploadPath = p
  },
  /** 내려받은 PNG 의 가로×세로 */
  pngSize(name) {
    try {
      const b = readFileSync(join(downloads, name))
      if (b.readUInt32BE(12) !== 0x49484452) return null
      return `${b.readUInt32BE(16)}×${b.readUInt32BE(20)}`
    } catch {
      return null
    }
  },
  sleep,
  eval: evalJs,
  /**
   * 저장본과 화면 비교.
   * 내려받은 PNG 와 같은 영역(selector)을 같은 크기로 화면에서 찍어,
   * 줄여서 한 칸씩 비교하고 나란히 붙인 그림을 남긴다 (왼쪽 저장본 · 오른쪽 화면).
   */
  async screenMatch(fileName, selector, label) {
    const png = readFileSync(join(downloads, fileName))
    const W = png.readUInt32BE(16)
    const rect = await evalJs(
      `(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } })()`,
    )
    const scale = W / (rect.w * curDpr)
    const { data } = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale },
    })
    writeFileSync(join(out, `${label}__화면.png`), Buffer.from(data, 'base64'))
    writeFileSync(join(out, `${label}__저장본.png`), png)
    const res = await evalJs(`(async () => {
      const load = (s) => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = s })
      const A = await load('data:image/png;base64,${png.toString('base64')}')
      const B = await load('data:image/png;base64,${data}')
      const w = 900, h = Math.round(A.height * w / A.width)
      const draw = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h); return c }
      const ca = draw(A), cb = draw(B)
      const da = ca.getContext('2d').getImageData(0, 0, w, h).data, db = cb.getContext('2d').getImageData(0, 0, w, h).data
      let sum = 0, big = 0
      for (let i = 0; i < da.length; i += 4) {
        const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3
        sum += d; if (d > 40) big++
      }
      const s = document.createElement('canvas'); s.width = w * 2 + 12; s.height = h
      const sx = s.getContext('2d'); sx.fillStyle = '#ff4d8d'; sx.fillRect(0, 0, s.width, h); sx.drawImage(ca, 0, 0); sx.drawImage(cb, w + 12, 0)
      return { 평균차이: +(sum / (w * h)).toFixed(2), 크게다른칸: +(big / (w * h) * 100).toFixed(2) + '%', 저장본: A.width + '×' + A.height, 화면: B.width + '×' + B.height, side: s.toDataURL('image/png') }
    })()`)
    writeFileSync(join(out, `${label}__비교.png`), Buffer.from(res.side.split(',')[1], 'base64'))
    delete res.side
    return res
  },
  async viewport(w, h, mobile = false, dpr = mobile ? 2 : 1) {
    curDpr = dpr
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile })
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile })
  },
  async go(url, wait = 1500) {
    const full = /^https?:|^file:/.test(url) ? url : BASE + url
    const p = loaded()
    await send('Page.navigate', { url: full })
    await p
    await sleep(wait)
  },
  async hash(h, wait = 900) {
    await evalJs(`location.hash = ${JSON.stringify(h)}; 1`)
    await sleep(wait)
  },
  async reload(wait = 1500) {
    const p = loaded()
    await send('Page.reload')
    await p
    await sleep(wait)
  },
  async shot(name, full = false) {
    const params = { format: 'png' }
    if (full) {
      const { cssContentSize } = await send('Page.getLayoutMetrics')
      params.clip = { x: 0, y: 0, width: cssContentSize.width, height: Math.min(cssContentSize.height, 6000), scale: 1 }
      params.captureBeyondViewport = true
    }
    const { data } = await send('Page.captureScreenshot', params)
    writeFileSync(join(out, `${name}.png`), Buffer.from(data, 'base64'))
  },
  text: () => evalJs('document.body.innerText'),
  async has(label) {
    return evalJs(`(document.body.innerText || '').includes(${JSON.stringify(label)})`)
  },
  async click(label, { exact = false, scope = null, wait = 500 } = {}) {
    const ok = await evalJs(`(() => { const e = (${FIND})(${JSON.stringify(label)}, ${exact}, ${JSON.stringify(scope)}); if (!e) return false; e.scrollIntoView({block:'center'}); e.click(); return true })()`)
    if (!ok) throw new Error(`"${label}" 을(를) 찾지 못함`)
    await sleep(wait)
  },
  async clickSel(sel, { wait = 500, index = 0 } = {}) {
    const ok = await evalJs(`(() => { const e = document.querySelectorAll(${JSON.stringify(sel)})[${index}]; if (!e) return false; e.scrollIntoView({block:'center'}); e.click(); return true })()`)
    if (!ok) throw new Error(`${sel} 없음`)
    await sleep(wait)
  },
  /** input·textarea 값 넣기 (React 가 알아채게) */
  async fill(sel, value, { index = 0 } = {}) {
    const ok = await evalJs(`(() => {
      const e = document.querySelectorAll(${JSON.stringify(sel)})[${index}]; if (!e) return false
      const proto = e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : e.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, ${JSON.stringify(value)})
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }))
      return true })()`)
    if (!ok) throw new Error(`${sel} 없음`)
    await sleep(200)
  },
  /** 글자 치기 (contenteditable 포함) — 먼저 눌러서 초점을 준다 */
  async type(sel, value, { index = 0, clear = true } = {}) {
    const ok = await evalJs(`(() => { const e = document.querySelectorAll(${JSON.stringify(sel)})[${index}]; if (!e) return false; e.scrollIntoView({block:'center'}); e.focus();
      if (${clear}) { const r = document.createRange(); r.selectNodeContents(e); const s = getSelection(); s.removeAllRanges(); s.addRange(r) } return true })()`)
    if (!ok) throw new Error(`${sel} 없음`)
    await send('Input.insertText', { text: value })
    await sleep(250)
    await evalJs('document.activeElement && document.activeElement.blur(); 1')
    await sleep(250)
  },
  async key(key, code = key) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code })
  },
  buttons: () =>
    evalJs(`[...document.querySelectorAll('button,a,[role=button]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }).map(e => (e.innerText || e.getAttribute('aria-label') || e.title || '').replace(/\\s+/g,' ').trim()).filter(Boolean).slice(0, 120)`),
  fileChoosers: () => fileChooserCount,
  /** 다 받아진 것만, 받은 순서대로. file 은 폴더 안 실제 파일 이름(guid) */
  downloaded() {
    return dlList
      .filter((d) => d.done && existsSync(join(downloads, d.guid)))
      .map((d) => ({ name: d.name, file: d.guid, size: statSync(join(downloads, d.guid)).size }))
  },
  downloadCount: () => dlList.length,
  /** n 번째 이후로 새로 받아진 것을 기다린다 */
  async waitDownload(n, timeout = 15000) {
    const t = Date.now()
    while (Date.now() - t < timeout) {
      const d = dlList[n]
      if (d?.done && existsSync(join(downloads, d.guid)))
        return { name: d.name, file: d.guid, size: statSync(join(downloads, d.guid)).size }
      await sleep(200)
    }
    return null
  },
  /** 바깥으로 넘치는 가로 스크롤이 있는지 */
  overflowX: () => evalJs('document.documentElement.scrollWidth - innerWidth'),
}

/* ── 돌리기 ────────────────────────────────────────────── */
const report = []
for (const name of names) {
  const sc = SCENARIOS[name]
  if (!sc) {
    report.push({ name, ok: false, error: '시나리오 없음' })
    continue
  }
  const steps = []
  const step = async (label, fn) => {
    problems = []
    const t = Date.now()
    try {
      const value = await fn()
      steps.push({ label, ok: problems.length === 0, value, problems, ms: Date.now() - t })
    } catch (e) {
      steps.push({ label, ok: false, error: e.message, problems, ms: Date.now() - t })
      try {
        await api.shot(`${name}__실패__${label.replace(/[^\w가-힣]+/g, '_')}`)
      } catch {
        /* 무시 */
      }
    }
  }
  try {
    await sc(api, step)
  } catch (e) {
    steps.push({ label: '(시나리오 중단)', ok: false, error: e.message })
  }
  report.push({ name, steps })
  const bad = steps.filter((s) => !s.ok)
  console.log(`\n■ ${name} — ${steps.length}단계, 문제 ${bad.length}`)
  for (const s of steps) {
    const mark = s.ok ? '○' : '✕'
    const extra = s.error ? ` — ${s.error}` : ''
    const val = s.value !== undefined ? ` → ${JSON.stringify(s.value).slice(0, 300)}` : ''
    console.log(`  ${mark} ${s.label}${extra}${val}`)
    for (const p of s.problems ?? []) console.log(`      · ${p}`)
  }
}
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2))
page.ws.close()
browser.ws.close()
chrome.kill()
process.exit(0)
