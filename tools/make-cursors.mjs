/*
  도트 커서 만들기
  ────────────────────────────────────────────────────────────
  그 시절 화면답게 커서도 계단진 픽셀이어야 한다. SVG 커서는
  브라우저마다 크기를 제멋대로 잡으므로 PNG 로 직접 찍는다.
  점만 찍어서 만들기 때문에 바깥 라이브러리가 필요 없다.

    후보 전부 그려서 미리보기까지:  node tools/make-cursors.mjs --all
    고른 것 하나만 본 자리에 넣기:  node tools/make-cursors.mjs <이름>

  고른 커서는 미니홈피/src/cursor 와 문자메이커/src/cursor 로 들어간다.
*/
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

/* ── PNG 쓰기 ────────────────────────────────────────────── */
let TBL = null
function crc32(buf) {
  if (!TBL) {
    TBL = []
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      TBL[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (const b of buf) c = TBL[(c ^ b) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function writePng(w, h, at) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  let o = 0
  for (let y = 0; y < h; y++) {
    raw[o++] = 0 // 필터 없음
    for (let x = 0; x < w; x++) {
      const p = at(x, y)
      raw[o++] = p[0]
      raw[o++] = p[1]
      raw[o++] = p[2]
      raw[o++] = p[3]
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(td))
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // 8비트
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ── 물감 ────────────────────────────────────────────────── */
const IN = {
  '.': null, //           비어 있음
  o: '#ffffff', //        흰
  k: '#123f63', //        진한 남색 테두리
  n: '#0d2b44', //        더 진한 남색
  b: '#4aa8e0', //        하늘
  s: '#a8dcf7', //        옅은 하늘
  d: '#1f7aba', //        짙은 하늘
  h: '#ff8fb4', //        분홍
  H: '#e85f8c', //        진한 분홍
  y: '#ffd76a', //        노랑
  w: '#f2f7fb', //        아주 옅은 회백
  g: '#9bb3c4', //        회색 그늘
  r: '#c9523f', //        연필 빨강
  t: '#8a5a33', //        나무색
}
const hex = (c) => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
  255,
]
const PAL = Object.fromEntries(
  Object.entries(IN).map(([k, v]) => [k, v ? hex(v) : [0, 0, 0, 0]]),
)

/* ══════════════════════════════════════════════════════════
   후보들
   각 후보는 화살표 / 손 / 글자 세 가지와 손잡이 자리(hot)를 갖는다.
   hot 은 1배 그림 안에서의 좌표 — 실제 CSS 에는 배율을 곱해 넣는다.
   ══════════════════════════════════════════════════════════ */

/*
   화살표 뼈대는 하나만 쓰고 색만 바꾼다.
   그 시절 커서의 실제 도트 배치 — 머리에서 왼발과 꼬리 둘로 갈라진다.
   f 는 속, k 는 테두리. 아래에서 후보마다 다른 물감으로 바꿔 칠한다.
*/
const ARROW = [
  'k.........',
  'kk........',
  'kfk.......',
  'kffk......',
  'kfffk.....',
  'kffffk....',
  'kfffffk...',
  'kffffffk..',
  'kfffffffk.',
  'kffffffffk',
  'kfffffkkkk',
  'kffkffk...',
  'kfk.kffk..',
  'kk..kffk..',
  'k....kffk.',
  '.....kffk.',
  '......kk..',
]

/** 뼈대를 물감으로 칠한다. 속은 위에서 아래로 색이 바뀔 수 있다. */
const paint = (rows, border, fill) =>
  rows.map((row, y) =>
    [...row]
      .map((ch) =>
        ch === 'k' ? border : ch === 'f' ? (Array.isArray(fill) ? fill[y < 7 ? 0 : 1] : fill) : ch,
      )
      .join(''),
  )

/** 그림 위에 작은 표식을 겹쳐 얹는다 */
const mark = (rows, glyph, at = 10) => {
  const w = Math.max(...rows.map((r) => r.length), at + Math.max(...glyph.map((g) => g.length)))
  return rows.map((row, y) => {
    const line = [...row.padEnd(w, '.')]
    const g = glyph[y]
    if (g) [...g].forEach((ch, i) => ch !== '.' && (line[at + i] = ch))
    return line.join('')
  })
}

/* 그 시절 창에서 보던 그 모양. 남색 테두리에 흰 속 — 어디서나 제일 잘 보인다. */
const A_CLASSIC = paint(ARROW, 'n', 'o')

/* 하늘색 테두리에 흰 속 — 또렷하면서도 하늘색이 주인공이다 */
const A_SKYLINE = paint(ARROW, 'd', 'o')

/* 흰 테두리에 하늘색 속 — 제일 하늘색답고 말랑해 보인다 */
const A_SKYFILL = paint(ARROW, 'o', ['s', 'b'])

/* 꼬리 끝에 작은 하트를 달았다 */
const A_HEART = [...paint(ARROW, 'd', 'o'), '..hh.hh...', '.hHHhHHh..', '..hHHHh...', '...hHh....']

/* 화살표 옆에서 별이 반짝인다 */
const A_STAR = mark(paint(ARROW, 'd', 'o'), ['..y..', 'y.y.y', '.yyy.', 'yyyyy', '.yyy.'], 9)

/* 다이어리에 어울리는 연필 */
const A_PENCIL = [
  '.......ttt',
  '......tyyt',
  '.....tyyyt',
  '....tyyyyt',
  '...tyyyyt.',
  '..tyyyyt..',
  '.tyyyyt...',
  'tyyyyt....',
  'tyyyt.....',
  'ttyyt.....',
  'rrtyt.....',
  'rrrtt.....',
  'nrrr......',
  'nnr.......',
  'n.........',
]

/*
   누를 수 있는 곳 — 검지를 든 손.
   가운데·약지·새끼는 주먹 쪽으로 말려 있어 짧은 토막으로만 보인다.
   손톱 끝(5,0)이 실제로 가리키는 자리라 거기를 손잡이로 쓴다.
*/
const HAND = [
  '.....kk.........',
  '....kffk........',
  '....kffk........',
  '....kffk........',
  '....kffk........',
  '....kffkkk......',
  '....kffkffkk....',
  '....kffkffkffk..',
  '.kk.kffffffffk..',
  'kffkkffffffffk..',
  'kfffkfffffffk...',
  '.kffffffffffk...',
  '..kfffffffffk...',
  '...kfffffffk....',
  '....kkkkkkk.....',
]

/* 글자를 고치는 곳 — 얇은 I 빔 */
const BEAM = [
  'kkkkk',
  'kfkfk',
  '.kfk.',
  '.kfk.',
  '.kfk.',
  '.kfk.',
  '.kfk.',
  '.kfk.',
  '.kfk.',
  '.kfk.',
  '.kfk.',
  '.kfk.',
  '.kfk.',
  '.kfk.',
  'kfkfk',
  'kkkkk',
]

const H_PLAIN = paint(HAND, 'k', 'o')
const H_SKY = paint(HAND, 'k', ['s', 'b'])
const H_WHITE = paint(HAND, 'o', ['s', 'b'])

const H_HEART = mark(H_SKY, ['.hh.hh.', 'hHHhHHh', '.hHHHh.', '..hHh..'], 9)
const H_STAR = mark(H_SKY, ['..y..', 'y.y.y', '.yyy.', 'yyyyy', '.yyy.'], 10)

const T_BEAM = paint(BEAM, 'k', 'o')
const T_SKY = paint(BEAM, 'k', ['s', 'b'])
const T_WHITE = paint(BEAM, 'o', ['s', 'b'])

const CANDIDATES = {
  또렷: {
    설명: '그 시절 창에서 쓰던 그대로. 남색 테두리에 흰 속 — 어느 배경에서도 제일 잘 보인다.',
    arrow: A_CLASSIC,
    hand: H_PLAIN,
    text: T_BEAM,
    hot: { arrow: [0, 0], hand: [5, 0], text: [2, 8] },
  },
  하늘테두리: {
    설명: '같은 모양에 테두리만 하늘색. 또렷하면서 하늘색이 주인공이 된다.',
    arrow: A_SKYLINE,
    hand: H_SKY,
    text: T_SKY,
    hot: { arrow: [0, 0], hand: [5, 0], text: [2, 8] },
  },
  하늘속: {
    설명: '흰 테두리에 하늘색을 채웠다. 제일 하늘색답고 말랑해 보인다.',
    arrow: A_SKYFILL,
    hand: H_WHITE,
    text: T_WHITE,
    hot: { arrow: [0, 0], hand: [5, 0], text: [2, 8] },
  },
  하트꼬리: {
    설명: '화살표 꼬리가 하트로 끝난다. 누를 수 있는 곳에서는 손 옆에도 하트가 뜬다.',
    arrow: A_HEART,
    hand: H_HEART,
    text: T_SKY,
    hot: { arrow: [0, 0], hand: [5, 0], text: [2, 8] },
  },
  별반짝: {
    설명: '화살표 옆에서 별이 반짝인다. 밤하늘 스킨과 잘 맞는다.',
    arrow: A_STAR,
    hand: H_STAR,
    text: T_SKY,
    hot: { arrow: [0, 0], hand: [5, 0], text: [2, 8] },
  },
  연필: {
    설명: '다이어리에 어울리는 연필. 화면 어디든 바로 쓸 것 같은 느낌.',
    arrow: A_PENCIL,
    hand: H_SKY,
    text: T_SKY,
    hot: { arrow: [0, 14], hand: [5, 0], text: [2, 8] },
  },
}

/* ── 그리기 ──────────────────────────────────────────────── */
function render(rows, scale) {
  const w = Math.max(...rows.map((r) => r.length))
  const h = rows.length
  return writePng(w * scale, h * scale, (x, y) => {
    const row = rows[Math.floor(y / scale)] ?? ''
    const ch = row[Math.floor(x / scale)] ?? '.'
    return PAL[ch] ?? [0, 0, 0, 0]
  })
}

const root = process.cwd()
const arg = process.argv[2]

if (arg === '--all') {
  // 후보 전부를 미리보기 폴더에 크게 뽑는다
  const out = path.join(root, 'tools', 'cursor-preview')
  fs.rmSync(out, { recursive: true, force: true })
  fs.mkdirSync(out, { recursive: true })
  const meta = []
  for (const [name, c] of Object.entries(CANDIDATES)) {
    for (const kind of ['arrow', 'hand', 'text']) {
      fs.writeFileSync(path.join(out, `${name}-${kind}.png`), render(c[kind], 2))
      fs.writeFileSync(path.join(out, `${name}-${kind}-big.png`), render(c[kind], 10))
    }
    meta.push({ name, 설명: c.설명, hot: c.hot })
  }
  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 2))
  console.log('후보', meta.length, '개를', out, '에 뽑았습니다')
} else {
  const name = arg ?? '또렷'
  const c = CANDIDATES[name]
  if (!c) {
    console.error('그런 후보는 없습니다:', name)
    console.error('있는 것:', Object.keys(CANDIDATES).join(', '))
    process.exit(1)
  }
  for (const app of ['미니홈피', '문자메이커']) {
    const out = path.join(root, app, 'src', 'cursor')
    fs.mkdirSync(out, { recursive: true })
    for (const kind of ['arrow', 'hand', 'text']) {
      // 1배는 보통 화면, 2배는 고해상도 화면
      fs.writeFileSync(path.join(out, `${kind}.png`), render(c[kind], 2))
      fs.writeFileSync(path.join(out, `${kind}@2x.png`), render(c[kind], 3))
    }
    fs.writeFileSync(
      path.join(out, 'hotspot.json'),
      JSON.stringify({ 고른것: name, ...c.hot }, null, 2),
    )
  }
  const h = c.hot
  console.log(`'${name}' 을 두 사이트에 넣었습니다.`)
  console.log('CSS 손잡이 자리 (2배 기준):')
  for (const kind of ['arrow', 'hand', 'text'])
    console.log(`  ${kind}: ${h[kind][0] * 2} ${h[kind][1] * 2}`)
}
