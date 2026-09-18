/*
   저장본을 어느 기기에서든 화면과 똑같게 만드는 도구들.

   · 글꼴  — 화면에 실제로 쓰인 글꼴 조각만 골라 그림 안에 넣는다.
             (넣지 않으면 아이폰은 제 글꼴로 바꿔 그려 글자 폭이 달라진다)
   · 화면 효과 — 색조·결·유리 반사·가장자리 그늘은 브라우저가 겹쳐 그리게 두면
             사파리가 네모난 찌꺼기를 남긴다. 저장할 때는 캔버스에 직접 칠한다.
             화면 쪽 CSS 도 겹침 계산 없이 그냥 얹으므로, 어느 기기든 같은 색이 나온다.
*/

/* ══ 글꼴 ══════════════════════════════════════════════════ */
const fontCache = new Map<string, string>()

async function toDataUrl(url: string): Promise<string> {
  const hit = fontCache.get(url)
  if (hit) return hit
  // 서버가 잠깐 응답을 안 줘도 저장이 멈추지 않게 — 8초 넘으면 그 조각은 건너뛴다
  const res = (await Promise.race([
    fetch(url),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
  ])) as Response
  if (!res.ok) throw new Error(String(res.status))
  const blob = await res.blob()
  const data = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
  fontCache.set(url, data)
  return data
}

const clean = (s: string) => s.replace(/["']/g, '').trim()

/** 화면에 쓰인 글자를 전부 받아 둔다 — 안 받은 조각이 있으면 그 글자만 다른 글꼴로 나온다 */
async function loadUsedFonts(node: HTMLElement) {
  const text = node.innerText + ' 0123456789'
  const families = new Set<string>()
  node.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const cs = getComputedStyle(el)
    const first = cs.fontFamily.split(',').map(clean)
    for (const f of first) families.add(`${cs.fontWeight}|${f}`)
  })
  await Promise.all(
    [...families].map((k) => {
      const [w, f] = k.split('|')
      return document.fonts.load(`${w} 16px "${f}"`, text).catch(() => null)
    }),
  )
}

/** 받아진 글꼴 조각만 @font-face 로 묶어 그림 안에 넣을 글을 만든다 */
export async function buildFontCss(node: HTMLElement): Promise<string> {
  await loadUsedFonts(node)
  const loaded = new Set<string>()
  document.fonts.forEach((f) => {
    if (f.status === 'loaded') loaded.add(`${clean(f.family)}|${f.weight}|${f.unicodeRange.replace(/\s/g, '').toLowerCase()}`)
  })
  const out: string[] = []
  for (const sheet of [...document.styleSheets]) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const r of [...rules]) {
      if (!(r instanceof CSSFontFaceRule)) continue
      const fam = clean(r.style.getPropertyValue('font-family'))
      const weight = r.style.getPropertyValue('font-weight') || '400'
      const range = (r.style.getPropertyValue('unicode-range') || 'U+0-10FFFF').replace(/\s/g, '').toLowerCase()
      if (!loaded.has(`${fam}|${weight}|${range}`) && !loaded.has(`${fam}|normal|${range}`)) continue
      const src = r.style.getPropertyValue('src')
      const m = src.match(/url\(\s*["']?([^"')]+\.woff2[^"')]*)["']?\s*\)/) ?? src.match(/url\(\s*["']?([^"')]+)["']?\s*\)/)
      if (!m) continue
      const url = new URL(m[1], sheet.href ?? location.href).href
      try {
        const data = await toDataUrl(url)
        out.push(
          `@font-face{font-family:'${fam}';font-weight:${weight};font-style:normal;src:url(${data}) format('woff2');unicode-range:${r.style.getPropertyValue('unicode-range') || 'U+0-10FFFF'}}`,
        )
      } catch {
        /* 한 조각 못 받아도 나머지는 넣는다 */
      }
    }
  }
  return out.join('\n')
}

/* ══ 화면 효과를 캔버스에 직접 ═════════════════════════════ */

/** CSS linear-gradient(각도) 와 같은 선을 캔버스에 만든다 */
function cssAngleGradient(ctx: CanvasRenderingContext2D, deg: number, w: number, h: number) {
  const a = (deg * Math.PI) / 180
  const len = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))
  const cx = w / 2
  const cy = h / 2
  const dx = (Math.sin(a) * len) / 2
  const dy = (-Math.cos(a) * len) / 2
  return ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy)
}

/** 안쪽 그림자 한 겹 (box-shadow: inset 0 0 blur color) */
function insetShadow(ctx: CanvasRenderingContext2D, w: number, h: number, blur: number, color: string) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, w, h)
  ctx.clip()
  const pad = blur * 4 + 50
  ctx.beginPath()
  ctx.rect(-pad, -pad, w + pad * 2, h + pad * 2)
  ctx.rect(0, h, w, -h) // 반대로 돌려 구멍을 낸다
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.fillStyle = color
  ctx.fill('evenodd')
  ctx.restore()
}

/**
 * .screenfx 층을 캔버스에 칠한다.
 * @param canvas 효과를 빼고 찍은 그림
 * @param node   찍은 캔버스 요소 (효과 층 위치를 재는 데 쓴다)
 * @param r      배율
 */
export function paintScreenFx(canvas: HTMLCanvasElement, node: HTMLElement, r: number) {
  const fx = node.querySelector<HTMLElement>('.screenfx')
  if (!fx) return
  const ctx = canvas.getContext('2d')!
  const nb = node.getBoundingClientRect()
  const fb = fx.getBoundingClientRect()
  // 화면은 확대·축소돼 있을 수 있다 — 캔버스 픽셀 기준으로 바꾼다
  const k = node.offsetWidth / nb.width
  const x0 = (fb.left - nb.left) * k * r
  const y0 = (fb.top - nb.top) * k * r
  const w = fx.offsetWidth * r
  const h = fx.offsetHeight * r

  ctx.save()
  ctx.translate(x0, y0)
  ctx.beginPath()
  ctx.rect(0, 0, w, h)
  ctx.clip()

  const has = (c: string) => fx.querySelector<HTMLElement>(`.${c}`)

  // 서브픽셀 — 세로 RGB 줄
  if (has('fx-grain-v')) {
    ctx.globalCompositeOperation = 'source-over'
    const cols = ['rgba(255,0,0,0.055)', 'rgba(0,255,0,0.055)', 'rgba(0,60,255,0.055)']
    for (let x = 0; x < w / r; x += 3)
      cols.forEach((c, i) => {
        ctx.fillStyle = c
        ctx.fillRect((x + i) * r, 0, r, h)
      })
  }
  // 가로 주사선 — 아래에서부터 3px 마다 1px
  if (has('fx-grain-h')) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(0,0,0,0.115)'
    const H = h / r
    for (let y = H - 1; y > -1; y -= 3) ctx.fillRect(0, y * r, w, r)
  }
  // 색조
  for (const cls of ['fx-tint-mul', 'fx-tint-scr']) {
    const el = has(cls)
    if (!el) continue
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = Number(getComputedStyle(el).opacity) || 0
    ctx.fillStyle = getComputedStyle(el).backgroundColor
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
  }
  // 유리 반사
  if (has('fx-glare')) {
    ctx.globalCompositeOperation = 'source-over'
    const g = cssAngleGradient(ctx, 114, w, h)
    g.addColorStop(0, 'rgba(255,255,255,0.34)')
    g.addColorStop(0.17, 'rgba(255,255,255,0.08)')
    g.addColorStop(0.38, 'rgba(255,255,255,0)')
    g.addColorStop(0.62, 'rgba(255,255,255,0)')
    g.addColorStop(0.82, 'rgba(255,255,255,0.06)')
    g.addColorStop(1, 'rgba(255,255,255,0.2)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
  // 가장자리 그늘
  if (has('fx-vig')) {
    ctx.globalCompositeOperation = 'source-over'
    insetShadow(ctx, w, h, 28 * r, 'rgba(20,30,40,0.34)')
    insetShadow(ctx, w, h, 76 * r, 'rgba(20,30,40,0.18)')
  }
  ctx.restore()
}
