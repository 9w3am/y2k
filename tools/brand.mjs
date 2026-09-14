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
   링크 미리보기 — 고른 파비콘(반짝 구슬 · 하트 i · 폴더폰) 그림체로 그린다.
   덧붙이는 설명 글자는 없다. 사이트 이름만.
*/
const SITE = {
  y2k: { title: 'Y2K', c1: '#9ad9f8', c2: '#3f9ede', ink: '#2a7cc7', edge: '#15599c', shade: '#1f6aa8' },
  ilog: { title: '아이로그', c1: '#8ad3f7', c2: '#3f9ede', ink: '#2d84d6', edge: '#2f8fd6', shade: '#2a78b8' },
  inbox: { title: '수신함', c1: '#7ccdf5', c2: '#2f8fd6', ink: '#1f6aa8', edge: '#1d5f96', shade: '#1f6aa8' },
}

const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => {
  const A = hex2(a)
  const B = hex2(b)
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, t)))).join(',')})`
}

const sparkles = (list) =>
  list.map(([x, y, s, o = 1, c = '#fff']) => `<g opacity="${o}">${sparkle(x, y, s, c)}</g>`).join('')

/** 파비콘(64칸) 그림을 (cx, cy) 가운데에 k 배로 */
const place = (svg, cx, cy, k, box = [32, 32]) =>
  `<g transform="translate(${cx - box[0] * k} ${cy - box[1] * k}) scale(${k})">${svg}</g>`

const fitT = (site, W, max) => Math.min(max, Math.floor(W / { y2k: 2.25, ilog: 3.9, inbox: 2.95 }[site]))
const fontOf = (site) => (site === 'y2k' ? `'Arial Black', ${SANS}` : SANS)

/** 사이트 이름 한 줄 */
const txt = (site, x, y, size, attrs = '') =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${fontOf(site)}" font-weight="${site === 'y2k' ? 900 : 800}" font-size="${size}" letter-spacing="${site === 'y2k' ? 0 : -size * 0.04}" ${attrs}>${SITE[site].title}</text>`

/** 파비콘 속 글씨처럼 — 흰 글자, 진한 테두리, 아래로 떨어지는 그림자 */
const title = (site, x, y, size, edge = SITE[site].edge, shade = SITE[site].shade) =>
  txt(site, x, y + size * 0.05, size, `fill="${shade}" stroke="${shade}" stroke-width="${size * 0.1}" stroke-linejoin="round"`) +
  txt(site, x, y, size, `fill="#fff" stroke="${edge}" stroke-width="${size * 0.06}" stroke-linejoin="round" paint-order="stroke"`)

/** 하트 i — 바탕 없이 글자만 */
const HEART_I = `<rect x="26" y="28" width="12" height="26" rx="3" fill="#fff"/><rect x="20" y="28" width="12" height="6" rx="3" fill="#fff"/><rect x="22" y="48" width="20" height="6" rx="3" fill="#fff"/><path d="M32 13c-3-4-10-2-10 3 0 4.2 5.6 7.4 10 10.4 4.4-3 10-6.2 10-10.4 0-5-7-7-10-3z" fill="#ff7eb6"/>`

/** 바탕 없는 그림 */
const glyph = (site) => (site === 'y2k' ? ICONS.Y2.svg : site === 'ilog' ? HEART_I : ICONS.S2.svg)

/** 앱 아이콘처럼 둥근 판 위에 올린 그림 (64칸) */
const tile = (site) => {
  if (site === 'ilog') return ICONS.I2.svg
  if (site === 'y2k')
    return `<rect width="64" height="64" rx="15" fill="#fff"/><g transform="translate(4.5 4.5) scale(.86)">${ICONS.Y2.svg}</g>`
  return `<defs><linearGradient id="tS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2f5ff"/><stop offset="1" stop-color="#a9dcf8"/></linearGradient></defs>
    <rect width="64" height="64" rx="15" fill="url(#tS)"/><g transform="translate(6.4 7) scale(.8)">${ICONS.S2.svg}</g>`
}

/* 도트 그림 — 글자 한 칸이 색 하나. '.' 은 빈칸 */
const PIX_HEART_I = [
  '.PP.PP.',
  'PHPPPPP',
  'PPPPPPD',
  '.PPPPD.',
  '..PPD..',
  '...D...',
  '.......',
  '.......',
  '.......',
  'WWWWW..',
  '..WWS..',
  '..WWS..',
  '..WWS..',
  '..WWS..',
  '.WWWWS.',
]
const PIX_PHONE = [
  '............A.',
  '............A.',
  '.NNNNNNNNNNNN.',
  'NNNNNNNNNNNNNN',
  'NLHHLLLLLLLLLN',
  'NLKKKKKKKKKKLN',
  'NLKKLLLLLLKKLN',
  'NLKLKLLLLKLKLN',
  'NLKLLKLLKLLKLN',
  'NLKLLLKKLLLKLN',
  'NLKLLLLLLLLKLN',
  'NLKKKKKKKKKKLN',
  'NLLLLLLLLLLLLN',
  'NNNNNNNNNNNNNN',
  'NNGGNNGGNNGGNN',
  'NNNNNNNNNNNNNN',
  'NNGGNNGGNNGGNN',
  'NNNNNNNNNNNNNN',
  '.NNNNNNNNNNNN.',
]
const PIX_CLOUD = ['..WWW.....', '.WWWWW.WW.', 'WWWWWWWWWW', '.WWWWWWWW.']
const PIX_HEART = ['.PP.PP.', 'PPPPPPP', 'PPPPPPP', '.PPPPP.', '..PPP..', '...P...']

const sprite = (rows, pal, x, y, u) =>
  rows
    .map((r, j) =>
      [...r]
        .map((c, i) => (pal[c] ? `<rect x="${x + i * u}" y="${y + j * u}" width="${u + 0.6}" height="${u + 0.6}" fill="${pal[c]}"/>` : ''))
        .join(''),
    )
    .join('')

/**
 * 도트 테두리 — 빈칸 중 칠한 칸과 맞닿은 곳을 테두리 색으로.
 * 하트 옆이면 진분홍(Q), 그 밖이면 진파랑(O). 한 칸씩 바깥으로 넓어진다.
 */
const outline = (rows, heartish = 'PHD') => {
  const h = rows.length + 2
  const w = rows[0].length + 2
  const at = (x, y) => (y >= 1 && y <= rows.length && x >= 1 && x <= rows[0].length ? rows[y - 1][x - 1] : '.')
  const out = []
  for (let y = 0; y < h; y++) {
    let line = ''
    for (let x = 0; x < w; x++) {
      const c = at(x, y)
      if (c !== '.') {
        line += c
        continue
      }
      const near = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].filter((n) => n !== '.')
      line += near.length === 0 ? '.' : near.some((n) => heartish.includes(n)) ? 'Q' : 'O'
    }
    out.push(line)
  }
  return out
}

/** 도트 구슬 — 테두리, 위에서 아래로 짙어지는 파랑, 안쪽 반짝이 */
const pixOrb = (cx, cy, u) => {
  let out = ''
  const n = 14
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const dx = i + 0.5 - 7
      const dy = j + 0.5 - 7
      const d2 = dx * dx + dy * dy
      if (d2 > 49) continue
      let c = mix('#8fdcff', '#1f74c0', (j / (n - 1)) * 0.95 + dx * 0.02)
      if (d2 > 37) c = '#15599c'
      else if ((i + 0.5 - 5.6) ** 2 / 8 + (j + 0.5 - 3.6) ** 2 / 1.9 < 1) c = '#e6f8ff'
      out += `<rect x="${cx - 7 * u + i * u}" y="${cy - 7 * u + j * u}" width="${u + 0.6}" height="${u + 0.6}" fill="${c}"/>`
    }
  return out
}

/** 도트 반짝이 (+ 모양) */
const pixSpark = (x, y, u, c = '#fff') =>
  `<rect x="${x - u / 2}" y="${y - u * 1.5}" width="${u}" height="${u * 3}" fill="${c}"/><rect x="${x - u * 1.5}" y="${y - u / 2}" width="${u * 3}" height="${u}" fill="${c}"/>`

/** 도트 글씨 — 둘레를 진한 색으로 두르고 아래로 그림자 */
const pixTitle = (text, x, y, size, edge, shade) => {
  const o = Math.max(5, Math.round(size / 24))
  const t = (dx, dy, c) =>
    `<text x="${x + dx}" y="${y + dy}" text-anchor="middle" font-family="${PIX}" font-size="${size}" fill="${c}">${text}</text>`
  const ring = [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]]
  return (
    ring.map(([dx, dy]) => t(dx + o, dy + o * 2, shade)).join('') +
    ring.map(([dx, dy]) => t(dx, dy, edge)).join('') +
    t(0, 0, '#fff')
  )
}

export const OG = {
  P1: {
    name: '파비콘 그대로',
    svg: (site) => {
      const gloss = `<ellipse cx="600" cy="-40" rx="760" ry="230" fill="#fff" opacity=".16"/>`
      if (site === 'y2k')
        return `
        <defs>
          <linearGradient id="py" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff4ff"/><stop offset="1" stop-color="#9fd6f7"/></linearGradient>
          <radialGradient id="pys" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1765b0" stop-opacity=".28"/><stop offset="1" stop-color="#1765b0" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#py)"/>${gloss}
        <ellipse cx="600" cy="585" rx="250" ry="34" fill="url(#pys)"/>
        ${place(ICONS.Y2.svg, 600, 305, 262 / 30)}
        ${sparkles([[222, 150, 30], [990, 118, 22, 0.9], [1050, 470, 34], [160, 470, 18, 0.85], [905, 560, 14, 0.8], [300, 70, 12, 0.7]])}`
      const s = SITE[site]
      return `
        <defs><linearGradient id="p1${site}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.c1}"/><stop offset="1" stop-color="${s.c2}"/></linearGradient></defs>
        <rect width="1200" height="630" fill="url(#p1${site})"/>${gloss}
        ${site === 'ilog' ? place(HEART_I, 300, 315, 9) : place(ICONS.S2.svg, 300, 315, 6.6, [32, 31])}
        ${title(site, 815, 372, site === 'ilog' ? 164 : 186)}
        ${sparkles([[160, 120, 24], [470, 96, 16, 0.85], [1120, 110, 20, 0.9], [1080, 540, 30], [520, 548, 14, 0.8]])}`
    },
  },

  P2: {
    name: '앱 아이콘',
    svg: (site) => {
      const s = SITE[site]
      const T = 262
      const size = fitT(site, 760, 118)
      return `
      <defs>
        <linearGradient id="p2bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7fcff"/><stop offset="1" stop-color="#cfe9fa"/></linearGradient>
        <radialGradient id="p2c" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <filter id="p2sh" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="20" stdDeviation="20" flood-color="#2f7fc4" flood-opacity=".3"/></filter>
      </defs>
      <rect width="1200" height="630" fill="url(#p2bg)"/>
      <circle cx="600" cy="195" r="360" fill="url(#p2c)"/>
      <g filter="url(#p2sh)">${place(tile(site), 600, 196, T / 64)}</g>
      ${txt(site, 600, 452 + size * 0.36, size, `fill="${s.ink}"`)}
      ${sparkles([[375, 120, 26, 1, '#8fcff3'], [835, 92, 18, 1, '#ffb3d6'], [860, 300, 14, 1, '#8fcff3'], [330, 330, 12, 1, '#ffb3d6'], [120, 560, 18, 0.8, '#b9e0f7'], [1090, 520, 24, 0.9, '#b9e0f7']])}`
    },
  },

  P3: {
    name: '무늬 카드',
    svg: (site) => {
      const s = SITE[site]
      const size = fitT(site, 440, 150)
      const mark =
        site === 'ilog'
          ? `<path transform="translate(35 35) scale(.9)" d="M0 -3c-3-4-10-2-10 3 0 4.2 5.6 7.4 10 10.4 4.4-3 10-6.2 10-10.4 0-5-7-7-10-3z" fill="#fff"/>`
          : site === 'inbox'
            ? pixEnvelope(21, 25, 2, '#fff')
            : `<circle cx="35" cy="35" r="9" fill="none" stroke="#fff" stroke-width="3"/>`
      return `
      <defs>
        <linearGradient id="p3bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.c1}"/><stop offset="1" stop-color="${s.c2}"/></linearGradient>
        <pattern id="p3p" width="70" height="70" patternUnits="userSpaceOnUse" patternTransform="rotate(-14)"><g opacity=".3">${mark}</g></pattern>
        <filter id="p3sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#134d80" flood-opacity=".3"/></filter>
      </defs>
      <rect width="1200" height="630" fill="url(#p3bg)"/><rect width="1200" height="630" fill="url(#p3p)"/>
      <g filter="url(#p3sh)"><rect x="140" y="85" width="920" height="460" rx="58" fill="#fff"/></g>
      <rect x="162" y="107" width="876" height="416" rx="42" fill="none" stroke="${s.c1}" stroke-width="5" stroke-dasharray="1 14" stroke-linecap="round"/>
      ${place(tile(site), 385, 315, 250 / 64)}
      ${txt(site, 770, 315 + size * 0.36, size, `fill="${s.ink}"`)}
      ${sparkles([[1000, 165, 20, 1, '#ffb3d6'], [585, 470, 13, 1, '#8fcff3'], [990, 470, 15, 1, '#8fcff3']])}`
    },
  },

  P4: {
    name: '말랑 젤리 버튼',
    svg: (site) => {
      const g = {
        y2k: ['#d2f4ff', '#79cff5', '#3aa6e8', '#1f78c8', '#155f9f'],
        ilog: ['#ffe3f0', '#ffa9cf', '#ff7eb6', '#e8569a', '#c43d7e'],
        inbox: ['#c4e2f8', '#6aa9dc', '#3d7fbe', '#24578a', '#1b4570'],
      }[site]
      const size = fitT(site, 610, 150)
      return `
      <defs>
        <pattern id="p4g" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#d6ebfa" stroke-width="2"/></pattern>
        <linearGradient id="p4gel${site}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset=".48" stop-color="${g[1]}"/><stop offset=".5" stop-color="${g[2]}"/><stop offset="1" stop-color="${g[3]}"/></linearGradient>
        <linearGradient id="p4hi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>
        <filter id="p4sh" x="-10%" y="-20%" width="120%" height="160%"><feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="${g[3]}" flood-opacity=".38"/></filter>
      </defs>
      <rect width="1200" height="630" fill="#f2f9ff"/><rect width="1200" height="630" fill="url(#p4g)"/>
      <g filter="url(#p4sh)"><rect x="95" y="175" width="1010" height="280" rx="140" fill="url(#p4gel${site})"/></g>
      <rect x="95" y="175" width="1010" height="280" rx="140" fill="none" stroke="${g[4]}" stroke-width="5"/>
      <rect x="160" y="188" width="880" height="118" rx="59" fill="url(#p4hi)"/>
      <circle cx="235" cy="315" r="112" fill="#fff" stroke="${g[4]}" stroke-width="5"/>
      ${place(tile(site), 235, 315, 160 / 64)}
      ${title(site, 700, 315 + size * 0.36, size, g[4], g[4])}
      ${sparkles([[150, 110, 26, 1, g[2]], [1060, 120, 20, 1, g[1]], [1090, 530, 28, 1, g[2]], [560, 540, 14, 1, g[1]], [760, 92, 12, 1, g[2]]])}`
    },
  },

  P5: {
    name: '도트',
    svg: (site) => {
      const s = SITE[site]
      const [a, b] = site === 'y2k' ? ['#e2f5ff', '#9fd6f7'] : [s.c1, s.c2]
      const bands = Array.from({ length: 9 }, (_, k) => `<rect y="${k * 70}" width="1200" height="71" fill="${mix(a, b, k / 8)}"/>`).join('')
      const cloud = (x, y, u, o = 0.95) => `<g opacity="${o}">${sprite(PIX_CLOUD, { W: '#fff' }, x, y, u)}</g>`
      const heart = (x, y, u, c = '#ff8fc4') => sprite(PIX_HEART, { P: c }, x, y, u)
      const spark = (list) => list.map(([x, y, u, c = '#fff']) => pixSpark(x, y, u, c)).join('')

      if (site === 'y2k')
        return `${bands}
        ${cloud(70, 60, 12)}${cloud(940, 500, 14)}${cloud(1010, 70, 8, 0.8)}
        ${heart(1045, 180, 9)}${heart(150, 440, 8)}
        ${spark([[250, 150, 14], [960, 330, 12], [300, 520, 10], [860, 120, 10, '#ffd36e']])}
        <g opacity=".22">${pixOrb(616, 322, 30).replaceAll(/fill="[^"]+"/g, 'fill="#15599c"')}</g>
        ${pixOrb(600, 300, 30)}
        ${pixTitle('Y2K', 600, 358, 176, '#15599c', '#0e3f6e')}`

      const art =
        site === 'ilog'
          ? (() => {
              const rows = outline(PIX_HEART_I)
              const pal = { P: '#ff7eb6', H: '#ffd6ea', D: '#e8569a', W: '#fff', S: '#cfe8f8', Q: '#b8336f', O: '#1f5f96' }
              const shade = Object.fromEntries(Object.keys(pal).map((k) => [k, '#1f5f96']))
              const u = 28
              const x = 300 - (rows[0].length * u) / 2
              const y = 315 - (rows.length * u) / 2
              return `<g opacity=".25">${sprite(rows, shade, x + u / 2, y + u, u)}</g>${sprite(rows, pal, x, y, u)}`
            })()
          : (() => {
              const pal = { N: '#31557a', L: '#8fd3ff', H: '#d4f0ff', K: '#1d3a57', R: '#ff7eb6', G: '#9ab5cc', A: '#1d3a57' }
              const shade = Object.fromEntries(Object.keys(pal).map((k) => [k, '#123a5e']))
              const u = 20
              const x = 300 - (PIX_PHONE[0].length * u) / 2
              const y = 315 - (PIX_PHONE.length * u) / 2
              return `<g opacity=".28">${sprite(PIX_PHONE, shade, x + u / 2, y + u, u)}</g>${sprite(PIX_PHONE, pal, x, y, u)}`
            })()
      const size = site === 'ilog' ? 140 : 180
      return `${bands}
        ${cloud(870, 44, 12)}${cloud(40, 530, 12, 0.9)}${cloud(1060, 470, 8, 0.8)}
        ${heart(990, 470, 7)}${heart(560, 110, 7)}
        ${spark([[110, 120, 14], [505, 520, 10], [1130, 170, 10], [640, 470, 12, '#ffd36e']])}
        ${art}
        ${pixTitle(s.title, 830, 315 + size * 0.36, size, s.edge, '#134d80')}`
    },
  },

  P6: {
    name: '반반',
    svg: (site) => {
      const s = SITE[site]
      const size = fitT(site, 560, 170)
      const [a, b] = site === 'y2k' ? ['#e2f5ff', '#a5d9f8'] : [s.c1, s.c2]
      const art =
        site === 'y2k'
          ? place(ICONS.Y2.svg, 245, 315, 5.4)
          : site === 'ilog'
            ? place(HEART_I, 245, 315, 8.2)
            : place(ICONS.S2.svg, 245, 315, 6.2, [32, 31])
      return `
      <defs>
        <linearGradient id="p6bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
        <pattern id="p6d" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="2.2" fill="#dcedf8"/></pattern>
      </defs>
      <rect width="1200" height="630" fill="#fff"/><rect width="1200" height="630" fill="url(#p6d)"/>
      <path d="M0 0H430Q560 315 430 630H0Z" fill="url(#p6bg)"/>
      <ellipse cx="200" cy="-20" rx="420" ry="170" fill="#fff" opacity=".18"/>
      ${art}
      ${txt(site, 840, 315 + size * 0.36, size, `fill="${s.ink}"`)}
      <path d="M${840 - 150} ${315 + size * 0.36 + 48}h300" stroke="${s.c1}" stroke-width="7" stroke-dasharray="1 16" stroke-linecap="round"/>
      ${sparkles([[1100, 120, 22, 1, '#ffb3d6'], [610, 110, 14, 1, '#8fcff3'], [1110, 520, 16, 1, '#8fcff3'], [95, 555, 18, 0.9]])}`
    },
  },
}

/* ── HTML 로 감싸서 크롬으로 찍기 ────────────────────────── */
function fontCss(dir) {
  copyFileSync(join(ROOT, '문자메이커/src/fonts/Galmuri11.woff2'), join(dir, 'Galmuri11.woff2'))
  const pen = pathToFileURL(join(ROOT, '미니홈피/src/styles/fonts.css')).href
  // 그림 틀은 임시 폴더에서 열리므로 글꼴은 절대 주소로
  const gal = pathToFileURL(join(dir, 'Galmuri11.woff2')).href
  return `@import url('${pen}');@font-face{font-family:'Galmuri11';src:url('${gal}') format('woff2')}`
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
    '--virtual-time-budget=4000',
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

/** 미리보기 후보만 비교판으로 */
function ogSheet(dir) {
  mkdirSync(dir, { recursive: true })
  const css = fontCss(dir)
  let n = 0
  // 한 문서에 여러 그림이 들어가므로 그라데이션 이름이 겹치지 않게 뒤에 번호를 붙인다
  const own = (svg) => {
    n++
    return svg.replace(/id="([^"]+)"/g, `id="$1_${n}"`).replace(/url\(#([^)]+)\)/g, `url(#$1_${n})`)
  }
  const rows = Object.entries(OG)
    .map(([id, v]) => `<h2>${id} · ${v.name}</h2><div class="row">${["y2k", "ilog", "inbox"].map((s) => `<svg width="400" height="210" viewBox="0 0 1200 630">${own(v.svg(s))}</svg>`).join("")}</div>`)
    .join("")
  shoot(
    page(css + `body{font-family:${SANS};padding:22px 26px}h2{margin:16px 0 9px;font-size:20px;color:#3f9ede}h2:first-child{margin-top:0}.row{display:flex;gap:14px}svg{border-radius:12px;box-shadow:0 0 0 1px #d5e6f2}`, `<body>${rows}</body>`, "#f3f9fd"),
    join(dir, "후보-미리보기.png"),
    1290,
    40 + Object.keys(OG).length * 262,
  )
}

const [mode, dir, ...rest] = process.argv.slice(2)
if (mode === 'sheet') sheets(resolve(dir))
if (mode === 'ogsheet') ogSheet(resolve(dir))
if (mode === 'final')
  final(resolve(dir), Object.fromEntries(rest.map((kv) => kv.split('='))))
