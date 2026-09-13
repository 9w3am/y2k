/* ══════════════════════════════════════════════════════════
   직접 꾸미기에서 고를 수 있는 것들
   ══════════════════════════════════════════════════════════ */

export type FontKey = 'pen' | 'dotum' | 'gulim' | 'batang' | 'verdana'
export type BorderKey = 'dotted' | 'dashed' | 'solid' | 'none'
export type PatternKey = 'heart' | 'star' | 'dot' | 'check' | 'none'

export const FONTS: { id: FontKey; name: string; stack: string }[] = [
  { id: 'pen', name: '손글씨', stack: "'Nanum Pen Script', Dotum, cursive" },
  { id: 'dotum', name: '돋움', stack: "Dotum, Gulim, 'Malgun Gothic', sans-serif" },
  { id: 'gulim', name: '굴림', stack: "Gulim, Dotum, 'Malgun Gothic', sans-serif" },
  { id: 'batang', name: '바탕', stack: "Batang, BatangChe, 'Nanum Myeongjo', serif" },
  { id: 'verdana', name: '영문 둥근', stack: 'Verdana, Tahoma, Dotum, sans-serif' },
]

export const BORDERS: { id: BorderKey; name: string }[] = [
  { id: 'dotted', name: '점선' },
  { id: 'dashed', name: '끊은 선' },
  { id: 'solid', name: '실선' },
  { id: 'none', name: '없음' },
]

export const PATTERNS: { id: PatternKey; name: string }[] = [
  { id: 'heart', name: '하트' },
  { id: 'star', name: '별' },
  { id: 'dot', name: '물방울' },
  { id: 'check', name: '체크' },
  { id: 'none', name: '없음' },
]

export const fontStack = (id: FontKey | undefined, fallback: FontKey) =>
  (FONTS.find((f) => f.id === id) ?? FONTS.find((f) => f.id === fallback)!).stack

const svg = (w: number, body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${w}'>${body}</svg>`,
  )}")`

/** 그림을 안 깔았을 때 바탕에 까는 무늬 — 색은 종이색을 옅게 */
export function patternCss(p: PatternKey | undefined, color: string): { image: string; size: string } {
  switch (p ?? 'heart') {
    case 'heart':
      return {
        image: svg(
          46,
          `<path d='M12 9c-2-2.6-6-1-6 2 0 2.6 3.4 4.6 6 6.4 2.6-1.8 6-3.8 6-6.4 0-3-4-4.6-6-2z' fill='${color}' fill-opacity='.72'/>` +
            `<path d='M33 27l1.4 3.1 3.4.4-2.5 2.3.7 3.3-3-1.7-3 1.7.7-3.3-2.5-2.3 3.4-.4z' fill='${color}' fill-opacity='.6'/>`,
        ),
        size: '46px',
      }
    case 'star':
      return {
        image: svg(
          40,
          `<path d='M20 8l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z' fill='${color}' fill-opacity='.7'/>`,
        ),
        size: '40px',
      }
    case 'dot':
      return {
        image: svg(24, `<circle cx='6' cy='6' r='2.6' fill='${color}' fill-opacity='.7'/><circle cx='18' cy='18' r='2.6' fill='${color}' fill-opacity='.7'/>`),
        size: '24px',
      }
    case 'check':
      return {
        image: svg(24, `<path d='M0 .5H24M.5 0V24' stroke='${color}' stroke-opacity='.5'/>`),
        size: '24px',
      }
    default:
      return { image: 'none', size: 'auto' }
  }
}

/** 색 칸에 넣을 수 있게 #abc 를 #aabbcc 로 늘인다. 못 읽으면 null */
export function toHex6(v: string): string | null {
  const s = v.trim()
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(s)) return ('#' + [...s.slice(1)].map((c) => c + c).join('')).toLowerCase()
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(s)
  if (m) return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
  return null
}
