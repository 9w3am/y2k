/* 두 사이트의 앱 아이콘을 만든다. 의존성 없이 PNG 를 직접 써낸다. */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const crcTable = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** pixel(x, y) → [r, g, b, a] */
function writePng(path, size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y, size)
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
      raw[o++] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  )
  console.log('wrote', path)
}

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]

/** 아이로그 — 파란 바탕에 펼친 기록장과 가운데 링 */
const ilog = (x, y, s) => {
  const u = s / 32
  const bgTop = hex('#4aa8dd')
  const bgBot = hex('#1d7fc0')
  const t = y / s
  let col = [
    Math.round(bgTop[0] + (bgBot[0] - bgTop[0]) * t),
    Math.round(bgTop[1] + (bgBot[1] - bgTop[1]) * t),
    Math.round(bgTop[2] + (bgBot[2] - bgTop[2]) * t),
  ]
  const px = x / u
  const py = y / u
  const deep = hex('#14598c')

  // 펼친 책 — 5..27 가로, 7..25 세로
  const inBook = px >= 5 && px <= 27 && py >= 7 && py <= 25
  if (inBook) col = [255, 255, 255]

  // 가운데 접힘
  if (inBook && px > 15.4 && px < 16.6) col = deep

  // 양쪽 페이지의 글줄 세 개
  const lines = [11.5, 15, 18.5]
  for (const ly of lines) {
    if (inBook && py > ly && py < ly + 1.4) {
      if (px > 7.5 && px < 14.5) col = hex('#8fc4e4')
      if (px > 17.5 && px < 24.5) col = hex('#8fc4e4')
    }
  }

  // 링 바인더 세 개
  for (const ry of [10, 16, 22]) {
    const dx = px - 16
    const dy = py - ry
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d < 1.9 && d > 0.8) col = hex('#ffd66e')
  }

  const r = 5 * u
  const cx = Math.min(x, s - 1 - x)
  const cy = Math.min(y, s - 1 - y)
  if (cx < r && cy < r && (r - cx) ** 2 + (r - cy) ** 2 > r * r) return [0, 0, 0, 0]
  return [...col, 255]
}

/** 수신함 — LCD 바탕에 도트 봉투 */
const inbox = (x, y, s) => {
  const u = s / 32
  const t = y / s
  const a = hex('#dfe8ec')
  const b = hex('#b9c8d0')
  let col = [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
  // 스캔라인
  if (Math.floor(y / u) % 3 === 0) col = col.map((v) => Math.round(v * 0.94))
  const px = Math.floor(x / u)
  const py = Math.floor(y / u)
  const ink = hex('#243238')
  // 봉투 바깥 테두리
  const inBox = px >= 6 && px <= 25 && py >= 9 && py <= 23
  const onEdge = inBox && (px === 6 || px === 25 || py === 9 || py === 23)
  if (onEdge) col = ink
  // 봉투 덮개 — 가운데로 모이는 두 대각선
  if (inBox && !onEdge) {
    const left = px - 6
    const right = 25 - px
    const depth = py - 9
    if (depth === Math.min(left, right) && depth <= 7) col = ink
  }
  const r = 5 * u
  const cx = Math.min(x, s - 1 - x)
  const cy = Math.min(y, s - 1 - y)
  if (cx < r && cy < r && (r - cx) ** 2 + (r - cy) ** 2 > r * r) return [0, 0, 0, 0]
  return [...col, 255]
}

for (const size of [192, 512]) {
  writePng(`미니홈피/public/icon-${size}.png`, size, ilog)
  writePng(`문자메이커/public/icon-${size}.png`, size, inbox)
}
