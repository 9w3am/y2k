/*
   Y2K · 아이로그 · 수신함 — 파비콘과 링크 미리보기(1200×630) 그림.
   그림은 전부 SVG 로 그리고, 크롬 헤드리스로 PNG 를 뜬다.

   node tools/brand.mjs sheet <폴더>      후보 비교판 두 장을 만든다
   node tools/brand.mjs final <폴더> y2k=Y1 ilog=I2 inbox=S3 og=A
                                         고른 것으로 실제 파일을 만든다
*/
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'

const ROOT = resolve(import.meta.dirname, '..')
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

const PIX = `'Galmuri11', monospace`
const SANS = `'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif`

/* ── 파비콘 후보 (64×64) ─────────────────────────────────── */
const sq = (id, a, b, r = 14) => `
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
  </linearGradient></defs>
  <rect width="64" height="64" rx="${r}" fill="url(#${id})"/>`

const sparkle = (x, y, s, fill = '#fff') =>
  `<path d="M${x} ${y - s}Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y}Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s}Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y}Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s}Z" fill="${fill}"/>`

/** 픽셀 봉투 — 1칸 = u */
const pixEnvelope = (ox, oy, u, ink) => {
  let d = ''
  const w = 14
  const h = 10
  for (let x = 0; x < w; x++) d += `M${ox + x * u} ${oy}h${u}v${u}h-${u}zM${ox + x * u} ${oy + (h - 1) * u}h${u}v${u}h-${u}z`
  for (let y = 1; y < h - 1; y++) d += `M${ox} ${oy + y * u}h${u}v${u}h-${u}zM${ox + (w - 1) * u} ${oy + y * u}h${u}v${u}h-${u}z`
  for (let k = 1; k <= 5; k++) {
    d += `M${ox + k * u} ${oy + k * u}h${u}v${u}h-${u}z`
    d += `M${ox + (w - 1 - k) * u} ${oy + k * u}h${u}v${u}h-${u}z`
  }
  d += `M${ox + 6 * u} ${oy + 6 * u}h${2 * u}v${u}h-${2 * u}z`
  return `<path d="${d}" fill="${ink}"/>`
}

export const ICONS = {
  /* Y2K */
  Y1: {
    site: 'y2k',
    name: '도트 글씨',
    svg: `${sq('y1', '#7ccdf5', '#2f8fd6')}
      <text x="32" y="41" text-anchor="middle" font-family="${PIX}" font-size="23" fill="#1c5f96">Y2K</text>
      <text x="31" y="39" text-anchor="middle" font-family="${PIX}" font-size="23" fill="#fff">Y2K</text>
      ${sparkle(53, 12, 5)}${sparkle(11, 53, 3.4, 'rgba(255,255,255,.8)')}`,
  },
  Y2: {
    site: 'y2k',
    name: '반짝 구슬',
    svg: `<defs>
        <radialGradient id="y2" cx=".38" cy=".3" r=".8">
          <stop offset="0" stop-color="#d9f6ff"/><stop offset=".45" stop-color="#4bb8ef"/><stop offset="1" stop-color="#1765b0"/>
        </radialGradient></defs>
      <circle cx="32" cy="32" r="30" fill="url(#y2)"/>
      <ellipse cx="30" cy="16" rx="19" ry="9" fill="#fff" opacity=".55"/>
      <text x="32" y="41" text-anchor="middle" font-family="Arial Black, ${SANS}" font-weight="900" font-size="20" fill="#fff" stroke="#15599c" stroke-width="1.2" paint-order="stroke">Y2K</text>`,
  },
  Y3: {
    site: 'y2k',
    name: '옛날 모니터',
    svg: `<rect x="4" y="5" width="56" height="44" rx="9" fill="#eef3f6" stroke="#b7c6d0" stroke-width="2"/>
      <rect x="10" y="11" width="44" height="31" rx="4" fill="#173a63"/>
      <text x="32" y="32" text-anchor="middle" font-family="${PIX}" font-size="16" fill="#8ff0c0">Y2K</text>
      <rect x="10" y="11" width="44" height="3" fill="#fff" opacity=".12"/>
      <path d="M24 49h16l3 8H21z" fill="#cfdae1"/><rect x="16" y="56" width="32" height="5" rx="2.5" fill="#b7c6d0"/>`,
  },
  Y4: {
    site: 'y2k',
    name: '스티커',
    svg: `<rect x="3" y="3" width="58" height="58" rx="15" fill="#fff" stroke="#6cbbe9" stroke-width="3" stroke-dasharray="2 4" stroke-linecap="round"/>
      <text x="32" y="39" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="21" fill="#3f9ede" letter-spacing="-1">Y2K</text>
      <path d="M49 13c-1.3-1.7-4-.7-4 1.3 0 1.7 2.3 3 4 4.2 1.7-1.2 4-2.5 4-4.2 0-2-2.7-3-4-1.3z" fill="#ff86b8"/>`,
  },

  /* 아이로그 */
  I1: {
    site: 'ilog',
    name: '지금 것 (링 공책)',
    svg: `${sq('i1', '#4aa8dd', '#1d7fc0', 10)}
      <rect x="10" y="14" width="44" height="36" fill="#fff"/>
      <rect x="31" y="14" width="2.4" height="36" fill="#14598c"/>
      ${[23, 30, 37].map((y) => `<rect x="15" y="${y}" width="14" height="2.8" fill="#8fc4e4"/><rect x="35" y="${y}" width="14" height="2.8" fill="#8fc4e4"/>`).join('')}
      ${[20, 32, 44].map((y) => `<circle cx="32" cy="${y}" r="3" fill="none" stroke="#ffd66e" stroke-width="2.2"/>`).join('')}`,
  },
  I2: {
    site: 'ilog',
    name: '하트 i',
    svg: `${sq('i2', '#8ad3f7', '#3f9ede')}
      <rect x="26" y="28" width="12" height="26" rx="3" fill="#fff"/>
      <rect x="20" y="28" width="12" height="6" rx="3" fill="#fff"/>
      <rect x="22" y="48" width="20" height="6" rx="3" fill="#fff"/>
      <path d="M32 13c-3-4-10-2-10 3 0 4.2 5.6 7.4 10 10.4 4.4-3 10-6.2 10-10.4 0-5-7-7-10-3z" fill="#ff7eb6"/>`,
  },
  I3: {
    site: 'ilog',
    name: '자물쇠 다이어리',
    svg: `<rect x="9" y="4" width="46" height="56" rx="7" fill="#ffb6d3"/>
      <rect x="9" y="4" width="9" height="56" rx="4" fill="#f58db8"/>
      <rect x="44" y="26" width="15" height="13" rx="3" fill="#ffd66e" stroke="#e0a93a" stroke-width="1.6"/>
      <circle cx="51.5" cy="32.5" r="2" fill="#a86f12"/>
      <path d="M36 22c-2.4-3.2-8-1.6-8 2.4 0 3.3 4.5 5.9 8 8.3 3.5-2.4 8-5 8-8.3 0-4-5.6-5.6-8-2.4z" fill="#fff"/>
      ${sparkle(24, 47, 3.6)}`,
  },
  I4: {
    site: 'ilog',
    name: '아 글자',
    svg: `<defs><linearGradient id="i4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a6e8e0"/><stop offset="1" stop-color="#3f9ede"/></linearGradient></defs>
      <circle cx="32" cy="32" r="30" fill="url(#i4)"/>
      <text x="31" y="44" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="34" fill="#fff">아</text>
      ${sparkle(50, 14, 4.4)}`,
  },

  /* 수신함 */
  S1: {
    site: 'inbox',
    name: '지금 것 (회색 LCD)',
    svg: `${sq('s1', '#dfe8ec', '#b9c8d0', 10)}
      <clipPath id="s1c"><rect width="64" height="64" rx="10"/></clipPath>
      <g clip-path="url(#s1c)">${Array.from({ length: 11 }, (_, k) => `<rect y="${k * 6}" width="64" height="2" fill="#000" opacity=".05"/>`).join('')}</g>
      ${pixEnvelope(11, 19, 3, '#243238')}`,
  },
  S2: {
    site: 'inbox',
    name: '폴더폰',
    svg: `<rect x="15" y="2" width="34" height="60" rx="9" fill="#31557a"/>
      <rect x="15" y="2" width="34" height="60" rx="9" fill="none" stroke="#1d3a57" stroke-width="2"/>
      <rect x="19" y="8" width="26" height="30" rx="3" fill="#8fd3ff"/>
      ${pixEnvelope(22, 16, 1.43, '#1d3a57')}
      <rect x="21" y="44" width="22" height="3" rx="1.5" fill="#9ab5cc"/>
      <rect x="21" y="50" width="22" height="3" rx="1.5" fill="#9ab5cc"/>
      <rect x="44" y="0" width="3" height="8" rx="1.5" fill="#1d3a57"/>`,
  },
  S3: {
    site: 'inbox',
    name: '말풍선 + 1',
    svg: `${sq('s3', '#7ccdf5', '#2f8fd6')}
      <path d="M12 18h34a6 6 0 0 1 6 6v17a6 6 0 0 1-6 6H27l-9 8v-8h-6a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" fill="#fff"/>
      ${[24, 31].map((x) => `<circle cx="${x}" cy="32.5" r="2.6" fill="#3f9ede"/>`).join('')}<circle cx="38" cy="32.5" r="2.6" fill="#3f9ede"/>
      <circle cx="51" cy="14" r="10" fill="#ff4d6d" stroke="#fff" stroke-width="2.4"/>
      <text x="51" y="19" text-anchor="middle" font-family="Arial, ${SANS}" font-weight="700" font-size="14" fill="#fff">1</text>`,
  },
  S4: {
    site: 'inbox',
    name: '연두 LCD',
    svg: `${sq('s4', '#cdf09b', '#99cf5c', 10)}
      <clipPath id="s4c"><rect width="64" height="64" rx="10"/></clipPath>
      <g clip-path="url(#s4c)">${Array.from({ length: 11 }, (_, k) => `<rect y="${k * 6}" width="64" height="2" fill="#000" opacity=".05"/>`).join('')}</g>
      <rect x="8" y="8" width="3" height="4" fill="#2c3d1c"/><rect x="12" y="6" width="3" height="6" fill="#2c3d1c"/><rect x="16" y="4" width="3" height="8" fill="#2c3d1c"/>
      ${pixEnvelope(11, 23, 3, '#2c3d1c')}`,
  },
}

/* ── 링크 미리보기 (1200×630) ────────────────────────────── */
const SHOT_ILOG = `
  <rect x="4" y="4" width="192" height="76" rx="7" fill="#fff" stroke="#8ec9ea"/>
  <rect x="15" y="16" width="52" height="38" rx="3" fill="#eaf6fd" stroke="#bfe0f3"/>
  <circle cx="41" cy="31" r="8" fill="#cfe8f8"/><path d="M28 50c3-8 23-8 26 0z" fill="#cfe8f8"/>
  <rect x="15" y="58" width="38" height="3" rx="1.5" fill="#d8e6ef"/><rect x="15" y="64" width="52" height="3" rx="1.5" fill="#e6eff5"/>
  ${[26, 42, 58].map((y) => `<circle cx="76" cy="${y}" r="3" fill="none" stroke="#a9d3ec" stroke-width="1.6"/>`).join('')}
  <rect x="87" y="16" width="34" height="5" rx="2.5" fill="#7ec4ee"/>
  ${[[27, 74], [34, 66], [41, 71], [48, 45]].map(([y, w]) => `<rect x="87" y="${y}" width="${w}" height="3" rx="1.5" fill="#dde9f1"/>`).join('')}
  <rect x="168" y="16" width="17" height="12" rx="3" fill="#7ec4ee"/>
  <rect x="168" y="31" width="17" height="12" rx="3" fill="#e4f1f9" stroke="#c3e0f2"/>
  <rect x="168" y="46" width="17" height="12" rx="3" fill="#e4f1f9" stroke="#c3e0f2"/>`

const SHOT_INBOX = `
  <rect x="49" y="6" width="102" height="72" rx="9" fill="#2f5f86"/>
  <rect x="53" y="10" width="94" height="64" rx="6" fill="#5aa6dd"/>
  <rect x="59" y="15" width="10" height="3" rx="1.5" fill="#cfe9fb"/><rect x="131" y="15" width="10" height="3" rx="1.5" fill="#cfe9fb"/>
  ${[[26, 60], [34, 74], [42, 46]].map(([y, w]) => `<rect x="59" y="${y}" width="${w}" height="3.4" rx="1.7" fill="#e9f6ff"/>`).join('')}
  <rect x="59" y="50" width="66" height="3.4" rx="1.7" fill="#cbe6fa"/>
  <rect x="57" y="62" width="34" height="8" rx="2" fill="#2f5f86"/><rect x="109" y="62" width="34" height="8" rx="2" fill="#2f5f86"/>
  <g fill="#000" opacity=".07">${Array.from({ length: 11 }, (_, k) => `<rect x="53" y="${12 + k * 6}" width="94" height="1"/>`).join('')}</g>`

const TITLES = { y2k: 'Y2K', ilog: '아이로그', inbox: '수신함' }

/** 사이트별 그림 — 가로 200×84 좌표계를 원하는 자리에 놓는다 */
const art = (site, x, y, w) => {
  const s = w / 200
  const g = (inner, dx = 0) => `<g transform="translate(${x + dx} ${y}) scale(${s})">${inner}</g>`
  if (site === 'ilog') return g(SHOT_ILOG)
  if (site === 'inbox') return g(SHOT_INBOX)
  // Y2K 는 두 사이트를 나란히 — 수신함 그림은 가운데 폰만 잘라 쓴다
  const s2 = (w * 0.66) / 200
  const cx = x + w / 2
  return `<g transform="translate(${cx - w * 0.7} ${y}) scale(${s2})">${SHOT_ILOG}</g>
    <g transform="translate(${cx + w * 0.06 - 49 * s2} ${y}) scale(${s2})">${SHOT_INBOX}</g>`
}

const heartPattern = (id, color = 'rgba(255,255,255,.75)') => `
  <pattern id="${id}" width="66" height="66" patternUnits="userSpaceOnUse">
    <path d="M18 13.5c-3-3.9-9-1.5-9 3 0 3.9 5.1 6.9 9 9.6 3.9-2.7 9-5.7 9-9.6 0-4.5-6-6.9-9-3z" fill="${color}"/>
    <path d="M48 39l2 4.4 4.8.6-3.5 3.2.9 4.6-4.2-2.4-4.2 2.4.9-4.6-3.5-3.2 4.8-.6z" fill="${color}" opacity=".8"/>
  </pattern>`

/*
   링크 미리보기 — 고른 파비콘을 그대로 크게 그린다.
   파비콘과 같은 색, 같은 모양, 같은 글씨 굵기. 덧붙이는 설명 글자는 없다.
*/
const sparkles = (list) => list.map(([x, y, s, o = 1]) => `<g opacity="${o}">${sparkle(x, y, s)}</g>`).join('')

/** 파비콘(64칸) 그림을 (cx, cy) 가운데에 k 배로 */
const place = (svg, cx, cy, k, box = [32, 32]) =>
  `<g transform="translate(${cx - box[0] * k} ${cy - box[1] * k}) scale(${k})">${svg}</g>`

/** 파비콘 속 글씨처럼 — 흰 글자, 진한 테두리, 아래로 떨어지는 그림자 */
const title = (text, x, y, size, edge, shade) => `
  <text x="${x}" y="${y + size * 0.05}" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="${size}" letter-spacing="${-size * 0.04}" fill="${shade}" stroke="${shade}" stroke-width="${size * 0.1}" stroke-linejoin="round">${text}</text>
  <text x="${x}" y="${y}" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="${size}" letter-spacing="${-size * 0.04}" fill="#fff" stroke="${edge}" stroke-width="${size * 0.06}" stroke-linejoin="round" paint-order="stroke">${text}</text>`

/** 파비콘처럼 위쪽에 얹는 반짝이 */
const gloss = `<ellipse cx="600" cy="-40" rx="760" ry="230" fill="#fff" opacity=".16"/>`

export const OG = {
  P: {
    name: '파비콘 그대로',
    svg: (site) => {
      if (site === 'y2k')
        return `
        <defs>
          <linearGradient id="py" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff4ff"/><stop offset="1" stop-color="#9fd6f7"/></linearGradient>
          <radialGradient id="pyo" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#d9f6ff"/><stop offset=".45" stop-color="#4bb8ef"/><stop offset="1" stop-color="#1765b0"/></radialGradient>
          <radialGradient id="pys" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1765b0" stop-opacity=".28"/><stop offset="1" stop-color="#1765b0" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#py)"/>
        ${gloss}
        <ellipse cx="600" cy="585" rx="250" ry="34" fill="url(#pys)"/>
        <circle cx="600" cy="305" r="262" fill="url(#pyo)"/>
        <ellipse cx="578" cy="160" rx="166" ry="78" fill="#fff" opacity=".55"/>
        <text x="600" y="392" text-anchor="middle" font-family="Arial Black, ${SANS}" font-weight="900" font-size="176" fill="#fff" stroke="#15599c" stroke-width="10.5" paint-order="stroke" stroke-linejoin="round">Y2K</text>
        ${sparkles([[222, 150, 30], [990, 118, 22, 0.9], [1050, 470, 34], [160, 470, 18, 0.85], [905, 560, 14, 0.8], [300, 70, 12, 0.7]])}`

      if (site === 'ilog')
        return `
        <defs>
          <linearGradient id="pi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ad3f7"/><stop offset="1" stop-color="#3f9ede"/></linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#pi)"/>
        ${gloss}
        <g transform="translate(0 10)" opacity=".22">${place(
          `<rect x="26" y="28" width="12" height="26" rx="3" fill="#135c94"/><rect x="20" y="28" width="12" height="6" rx="3" fill="#135c94"/><rect x="22" y="48" width="20" height="6" rx="3" fill="#135c94"/>`,
          300,
          315,
          9,
          [32, 32],
        )}</g>
        ${place(
          `<rect x="26" y="28" width="12" height="26" rx="3" fill="#fff"/><rect x="20" y="28" width="12" height="6" rx="3" fill="#fff"/><rect x="22" y="48" width="20" height="6" rx="3" fill="#fff"/><path d="M32 13c-3-4-10-2-10 3 0 4.2 5.6 7.4 10 10.4 4.4-3 10-6.2 10-10.4 0-5-7-7-10-3z" fill="#ff7eb6"/>`,
          300,
          315,
          9,
          [32, 32],
        )}
        ${title('아이로그', 815, 372, 164, '#2f8fd6', '#2a78b8')}
        ${sparkles([[160, 120, 24], [470, 96, 16, 0.85], [1120, 110, 20, 0.9], [1080, 540, 30], [520, 548, 14, 0.8]])}`

      return `
        <defs>
          <linearGradient id="ps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ccdf5"/><stop offset="1" stop-color="#2f8fd6"/></linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#ps)"/>
        ${gloss}
        <g transform="translate(0 12)" opacity=".25">${place(`<rect x="15" y="2" width="34" height="60" rx="9" fill="#123a5e"/>`, 300, 315, 6.6, [32, 31])}</g>
        ${place(ICONS.S2.svg, 300, 315, 6.6, [32, 31])}
        ${title('수신함', 815, 372, 186, '#1d5f96', '#1f6aa8')}
        ${sparkles([[150, 130, 22], [470, 92, 16, 0.85], [1110, 120, 24, 0.9], [1070, 540, 30], [505, 552, 13, 0.8]])}`
    },
  },
}

/* ── HTML 로 감싸서 크롬으로 찍기 ────────────────────────── */
function fontCss(dir) {
  copyFileSync(join(ROOT, '문자메이커/src/fonts/Galmuri11.woff2'), join(dir, 'Galmuri11.woff2'))
  const pen = pathToFileURL(join(ROOT, '미니홈피/src/styles/fonts.css')).href
  return `@import url('${pen}');@font-face{font-family:'Galmuri11';src:url('Galmuri11.woff2') format('woff2')}`
}

function shoot(html, out, w, h, transparent = false) {
  // 그림 틀은 임시 폴더에 — 사이트 폴더에 남으면 같이 배포된다
  const tmp = join(tmpdir(), `brand-${basename(out, '.png')}.html`)
  writeFileSync(tmp, html)
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${w},${h}`,
    ...(transparent ? ['--default-background-color=00000000'] : []),
    '--virtual-time-budget=1500',
    `--screenshot=${out}`,
    pathToFileURL(tmp).href,
  ], { stdio: 'ignore' })
  console.log('wrote', out)
}

const page = (css, body, bg = 'transparent') =>
  `<!doctype html><meta charset="utf-8"><style>${css}html,body{margin:0;background:${bg}}svg{display:block}</style>${body}`

function sheets(dir) {
  mkdirSync(dir, { recursive: true })
  const css = fontCss(dir)
  const rowLabel = { y2k: 'Y2K 첫 화면', ilog: '아이로그', inbox: '수신함' }
  // 파비콘 비교판 — 큰 그림 + 실제 탭 크기(32·16)
  const rows = ['y2k', 'ilog', 'inbox']
    .map((site) => {
      const cells = Object.entries(ICONS)
        .filter(([, v]) => v.site === site)
        .map(
          ([id, v]) => `<div class="cell">
            <svg width="120" height="120" viewBox="0 0 64 64">${v.svg}</svg>
            <div class="tab"><svg width="16" height="16" viewBox="0 0 64 64">${v.svg}</svg><span>${TITLES[site]}</span></div>
            <div class="small"><svg width="32" height="32" viewBox="0 0 64 64">${v.svg}</svg><svg width="16" height="16" viewBox="0 0 64 64">${v.svg}</svg></div>
            <b>${id}</b><em>${v.name}</em></div>`,
        )
        .join('')
      return `<h2>${rowLabel[site]}</h2><div class="row">${cells}</div>`
    })
    .join('')
  shoot(
    page(
      css +
        `body{font-family:${SANS};padding:26px 30px;color:#2e3a44}
        h2{margin:18px 0 10px;font-size:20px;color:#3f9ede}h2:first-child{margin-top:0}
        .row{display:flex;gap:18px}
        .cell{width:210px;background:#fff;border:1px solid #d5e6f2;border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px}
        .tab{display:flex;align-items:center;gap:7px;width:100%;box-sizing:border-box;padding:7px 10px;background:#eef2f6;border-radius:9px 9px 0 0;font-size:12px}
        .small{display:flex;align-items:center;gap:12px}
        b{font:700 20px Verdana,sans-serif;color:#2e3a44}em{font-style:normal;font-size:13px;color:#7b8b98;margin-top:-8px}`,
      `<body>${rows}</body>`,
      '#f3f9fd',
    ),
    join(dir, '후보-파비콘.png'),
    960,
    1070,
  )
  // 미리보기 비교판 — 한 칸 400×210
  const og = Object.entries(OG)
    .map(
      ([id, v]) => `<h2>${id} · ${v.name}</h2><div class="row">${['y2k', 'ilog', 'inbox']
        .map((site) => `<svg width="400" height="210" viewBox="0 0 1200 630">${v.svg(site)}</svg>`)
        .join('')}</div>`,
    )
    .join('')
  shoot(
    page(
      css +
        `body{font-family:${SANS};padding:22px 26px}h2{margin:16px 0 9px;font-size:20px;color:#3f9ede}h2:first-child{margin-top:0}
        .row{display:flex;gap:14px}svg{border-radius:12px;box-shadow:0 0 0 1px #d5e6f2}`,
      `<body>${og}</body>`,
      '#f3f9fd',
    ),
    join(dir, '후보-미리보기.png'),
    1290,
    880,
  )
}

function final(dir, pick) {
  mkdirSync(dir, { recursive: true })
  const css = fontCss(dir)
  const targets = { y2k: 'landing', ilog: '미니홈피/public', inbox: '문자메이커/public' }
  for (const site of ['y2k', 'ilog', 'inbox']) {
    const icon = ICONS[pick[site]]
    const outDir = join(ROOT, targets[site])
    for (const size of [32, 180, 192, 512]) {
      const name = size === 180 ? 'apple-touch-icon.png' : size === 32 ? 'favicon-32.png' : `icon-${size}.png`
      shoot(
        page(css, `<svg width="${size}" height="${size}" viewBox="0 0 64 64">${icon.svg}</svg>`),
        join(outDir, name),
        size,
        size,
        true,
      )
    }
    writeFileSync(
      join(outDir, 'favicon.svg'),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${icon.svg.replaceAll(PIX, 'monospace')}</svg>`,
    )
    if (!pick.og) continue
    shoot(
      page(css, `<svg width="1200" height="630" viewBox="0 0 1200 630">${OG[pick.og].svg(site)}</svg>`, '#fff'),
      join(outDir, 'og.png'),
      1200,
      630,
    )
  }
}

const [mode, dir, ...rest] = process.argv.slice(2)
if (mode === 'sheet') sheets(resolve(dir))
if (mode === 'final')
  final(resolve(dir), Object.fromEntries(rest.map((kv) => kv.split('='))))
