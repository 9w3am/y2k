/*
  도트 커서 만들기
  ────────────────────────────────────────────────────────────
  그 시절 화면답게 커서도 계단진 픽셀이어야 한다. SVG 커서는
  브라우저마다 크기를 제멋대로 잡으므로 PNG 로 직접 찍는다.
  글씨 하나 없이 점만 찍어서 만들기 때문에 바깥 라이브러리가 필요 없다.

    실행:  node tools/make-cursors.mjs
    결과:  미니홈피/public/cursor/{arrow,hand,text}.png  (각각 2배 크기도)
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

/* ── 색 ──────────────────────────────────────────────────── */
const C = {
  '.': null, // 비어 있음
  o: [255, 255, 255, 255], // 흰 테두리
  b: [31, 122, 186, 255], // 진한 하늘
  s: [126, 196, 238, 255], // 밝은 하늘
  h: [255, 157, 190, 255], // 분홍 하트
}

/** 점 그림을 그대로 배열로 적는다. 한 글자가 한 점. */
const ARROW = [
  'o..............',
  'oo.............',
  'obo............',
  'obbo...........',
  'obbbo..........',
  'obbbbo.........',
  'obbbbbo........',
  'obbbbbbo.......',
  'obbbbbbbo......',
  'obbbbbbbbo.....',
  'obbbbbsbbbo....',
  'obbbbbbbbbbo...',
  'obbbbbbbbbbbo..',
  'obbbbbbo.oooo..',
  'obbboobo.......',
  'obbo..obo......',
  'obo....obo.....',
  'oo.....obo.....',
  'o.......oo.....',
]

// 누를 수 있는 것 위 — 손가락 대신 도트 하트를 얹은 작은 손
const HAND = [
  '....oo.........',
  '...obbo........',
  '...obbo........',
  '...obbo..hh....',
  '...obbo.h..h...',
  '...obbo.h..h...',
  '...obbooo.hh...',
  '...obbobboh....',
  '.oo.obbobbobo..',
  'obbooobobbobbo.',
  'obbbbobobbobbo.',
  '.obbbbobbobbbo.',
  '..obbbbbbbbbbo.',
  '...obbbbbbbbbo.',
  '...obbbbbbbbo..',
  '....obbbbbbbo..',
  '....obbbbbbo...',
  '.....oooooo....',
]

// 글자를 고칠 수 있는 곳 — 그 시절 I 빔
const TEXT = [
  'ooo.ooo',
  'obo.obo',
  '.obbbo.',
  '..obo..',
  '..obo..',
  '..obo..',
  '..obo..',
  '..obo..',
  '..obo..',
  '..obo..',
  '..obo..',
  '..obo..',
  '..obo..',
  '.obbbo.',
  'obo.obo',
  'ooo.ooo',
]

function render(rows, scale) {
  const w = rows[0].length * scale
  const h = rows.length * scale
  return writePng(w, h, (x, y) => {
    const ch = rows[Math.floor(y / scale)][Math.floor(x / scale)]
    return C[ch] ?? [0, 0, 0, 0]
  })
}

const out = path.join(process.cwd(), '미니홈피', 'public', 'cursor')
fs.mkdirSync(out, { recursive: true })

for (const [name, rows] of [
  ['arrow', ARROW],
  ['hand', HAND],
  ['text', TEXT],
]) {
  // 1배는 보통 화면용, 2배는 고해상도 화면용
  fs.writeFileSync(path.join(out, `${name}.png`), render(rows, 2))
  fs.writeFileSync(path.join(out, `${name}@2x.png`), render(rows, 3))
  console.log(name, '만듦')
}
