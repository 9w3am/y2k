/*
   링크 미리보기(1200×630, 2배 해상도) — 실제 사이트 화면을 오려 붙여 만든다.
   node tools/og.mjs <찍은 화면 폴더> <내보낼 폴더> [G|H|I ...]
   찍은 화면은 tools/shots.mjs 로 먼저 만든다.
*/
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ICONS } from './brand.mjs'

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

const [shotsDir, outDir] = process.argv.slice(2, 4).map((p) => resolve(p))
const picks = process.argv.slice(4)
mkdirSync(outDir, { recursive: true })

const src = (n) => pathToFileURL(join(shotsDir, `${n}.png`)).href
const SIZE = {
  'ilog-home': [2560, 1720],
  'ilog-home-m': [1170, 2532],
  'ilog-diary-m': [1170, 2532],
  'ilog-guest-m': [1170, 2532],
  phone: [1776, 2370],
}

const HEART = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Cpath d='M12 9c-2-2.6-6-1-6 2 0 2.6 3.4 4.6 6 6.4 2.6-1.8 6-3.8 6-6.4 0-3-4-4.6-6-2z' fill='rgba(255,255,255,.75)'/%3E%3Cpath d='M32 26l1.3 2.9 3.2.4-2.3 2.1.6 3.1-2.8-1.6-2.8 1.6.6-3.1-2.3-2.1 3.2-.4z' fill='rgba(255,255,255,.6)'/%3E%3C/svg%3E")`

const CSS = `*{box-sizing:border-box}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;position:relative}
img{display:block}
.abs{position:absolute}
.heart{position:absolute;inset:0;background:#d6edfb ${HEART};background-size:58px 58px}
.stage{position:absolute;inset:0;background-color:#e9f4fb;background-image:radial-gradient(rgba(63,158,222,.22) 1.7px,transparent 1.7px);background-size:26px 26px}
.sh{box-shadow:0 24px 46px -16px rgba(24,70,114,.45),0 0 0 1px rgba(24,70,114,.07)}`

/** 원본 이미지의 (sx, sy)부터 폭 sw 만큼을 상자에 꽉 채워 보여준다 */
const crop = (name, [iw, ih], sx, sy, sw, { x, y, w, h, r = 0, cls = 'sh', style = '' }) => {
  const k = w / sw
  return `<div class="abs ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px;overflow:hidden;${style}">
    <img src="${src(name)}" style="position:absolute;left:${-sx * k}px;top:${-sy * k}px;width:${iw * k}px;height:${ih * k}px"></div>`
}

/** 수신함 화면 한 대 — 높이만 정하면 비율대로 */
const phone = (name, x, y, h, style = '') => {
  const w = Math.round((h * 1776) / 2370)
  return `<img class="abs sh" src="${src(`c-${name}`)}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${Math.round(w * 0.042)}px;${style}">`
}

/** Y2K 반짝 구슬 */
const orb = (x, y, s) =>
  `<div class="abs" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;border-radius:50%;background:#fff;padding:${s * 0.07}px;box-shadow:0 14px 30px -10px rgba(24,70,114,.5)">
    <svg viewBox="0 0 64 64" width="100%" height="100%">${ICONS.Y2.svg}</svg></div>`

const OG = {
  G: {
    name: '화면 크게',
    ilog: () => crop('ilog-home', SIZE['ilog-home'], 350, 0, 1860, { x: 0, y: 0, w: 1200, h: 630, cls: '' }),
    inbox: () => `<div class="stage"></div>
      ${phone('sms-inbox', 70, 95, 470)}
      ${phone('pc-messenger', 778, 95, 470)}
      ${phone('sms-write', 390, 35, 560, 'z-index:2')}`,
    y2k: () => `<div class="heart"></div>
      ${crop('ilog-home', SIZE['ilog-home'], 390, 150, 1780, { x: 50, y: 60, w: 700, h: 510, r: 24 })}
      ${phone('sms-inbox', 880, 55, 380)}
      ${phone('sms-write', 755, 150, 430, 'z-index:2')}
      <div class="abs" style="z-index:3">${orb(650, 450, 128)}</div>`,
  },
  H: {
    name: '폰 화면 모음',
    ilog: () => `<div class="heart"></div>
      ${['ilog-home-m', 'ilog-diary-m', 'ilog-guest-m']
        .map((n, k) =>
          crop(n, SIZE[n], 0, 0, 1170, {
            x: 75 + k * 360,
            y: k === 1 ? 30 : 50,
            w: 330,
            h: 560,
            r: 34,
            style: 'outline:6px solid #fff;outline-offset:0',
          }),
        )
        .join('')}`,
    inbox: () => `<div class="stage"></div>
      ${['sms-write', 'sms-compose', 'sms-inbox', 'sms-attach', 'pc-messenger']
        .map((t, k) => phone(t, 23 + k * 236, k % 2 ? 190 : 150, 290))
        .join('')}`,
    y2k: () => `<div class="heart"></div>
      ${crop('ilog-home-m', SIZE['ilog-home-m'], 0, 0, 1170, { x: 105, y: 35, w: 330, h: 560, r: 34, style: 'outline:6px solid #fff' })}
      ${phone('sms-inbox', 690, 75, 450)}
      ${phone('sms-compose', 860, 165, 400, 'z-index:2')}
      <div class="abs" style="z-index:3">${orb(488, 250, 130)}</div>`,
  },
  I: {
    name: '가까이서',
    ilog: () => crop('ilog-home', SIZE['ilog-home'], 900, 300, 1070, { x: 0, y: 0, w: 1200, h: 630, cls: '' }),
    inbox: () =>
      `<div class="abs" style="inset:0;background:#1d3d63"></div>` +
      crop('c-sms-inbox', SIZE.phone, 0, 0, 1776, { x: 0, y: 0, w: 1200, h: 630, cls: '' }),
    y2k: () =>
      crop('ilog-home', SIZE['ilog-home'], 900, 250, 1000, { x: 0, y: 0, w: 600, h: 630, cls: '' }) +
      `<div class="abs" style="left:600px;top:0;width:600px;height:630px;background:#1d3d63"></div>` +
      crop('c-sms-inbox', SIZE.phone, 0, 0, 1776, { x: 600, y: 0, w: 600, h: 630, cls: '' }) +
      `<div class="abs" style="z-index:3">${orb(535, 250, 130)}</div>`,
  },
}

function render(html, out, w, h, scale = 2) {
  const tmp = join(tmpdir(), `og-${Date.now()}-${Math.random().toString(36).slice(2)}.html`)
  writeFileSync(tmp, html)
  execFileSync(
    CHROME,
    ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--force-device-scale-factor=${scale}`, `--window-size=${w},${h}`, '--virtual-time-budget=2500', `--screenshot=${out}`, pathToFileURL(tmp).href],
    { stdio: 'ignore' },
  )
  console.log('wrote', out)
}

const SITES = ['y2k', 'ilog', 'inbox']
const ids = picks.length ? picks : Object.keys(OG)
for (const id of ids)
  for (const site of SITES)
    render(`<!doctype html><meta charset="utf-8"><style>${CSS}</style><body>${OG[id][site]()}</body>`, join(outDir, `${id}-${site}.png`), 1200, 630)

// 후보를 여러 개 만들었을 때만 비교판
if (ids.length > 1) {
  const rows = ids
    .map(
      (id) => `<h2>${id} · ${OG[id].name}</h2><div class="row">${SITES.map(
        (s) => `<img src="${pathToFileURL(join(outDir, `${id}-${s}.png`)).href}">`,
      ).join('')}</div>`,
    )
    .join('')
  render(
    `<!doctype html><meta charset="utf-8"><style>
      body{margin:0;padding:22px 26px;background:#f3f9fd;font-family:'Malgun Gothic',sans-serif}
      h2{margin:16px 0 9px;font-size:20px;color:#3f9ede}h2:first-child{margin-top:0}
      .row{display:flex;gap:14px}.row img{width:400px;height:210px;border-radius:12px;box-shadow:0 0 0 1px #d5e6f2}
    </style><body>${rows}</body>`,
    join(outDir, '후보-미리보기.png'),
    1290,
    40 + ids.length * 262,
    1,
  )
}
