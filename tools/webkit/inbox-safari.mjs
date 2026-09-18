/*
   수신함 — 사파리(WebKit) 엔진으로 테마마다 PNG 저장 ↔ 화면 비교.
   아이폰이 쓰는 엔진이라, 아이폰에서만 생기는 저장 문제를 여기서 본다.
   node tools/webkit/inbox-safari.mjs <폴더> [기준주소] [테마,...]
   환경변수 PHOTO=1 이면 배경 사진을 깔고, DEVICE=iphone|galaxy
*/
import { webkit, chromium, devices } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const out = resolve(process.argv[2] ?? 'safari-out')
const BASE = process.argv[3] ?? 'http://localhost:5183/'
const THEMES = (process.argv[4] ?? 'sms-write,sms-view,sms-compose,sms-attach,sms-inbox,pc-messenger').split(',')
const PHOTO = process.env.PHOTO === '1'
const DEVICE = process.env.DEVICE ?? 'iphone'
mkdirSync(out, { recursive: true })

const engine = DEVICE === 'galaxy' ? chromium : webkit
const dev = DEVICE === 'galaxy' ? devices['Galaxy S9+'] : devices['iPhone 13']
const browser = await engine.launch(DEVICE === 'galaxy' ? { channel: 'chrome' } : {})
const ctx = await browser.newContext({ ...dev, acceptDownloads: true })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`오류: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))

// 폰 사진 같은 큰 JPEG
await page.goto(BASE + '#/sms-write')
await page.waitForTimeout(3000)
const photoPath = join(out, 'photo.jpg')
if (PHOTO) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 3000
    c.height = 2000
    const x = c.getContext('2d')
    const g = x.createLinearGradient(0, 0, 0, 2000)
    g.addColorStop(0, '#3b6fd6')
    g.addColorStop(0.55, '#f7a36b')
    g.addColorStop(1, '#2b1d3a')
    x.fillStyle = g
    x.fillRect(0, 0, 3000, 2000)
    x.fillStyle = '#ffe9a8'
    x.beginPath()
    x.arc(2200, 900, 180, 0, 7)
    x.fill()
    for (let i = 0; i < 40; i++) {
      x.fillStyle = `hsl(${200 + i * 3},30%,${10 + (i % 5) * 4}%)`
      x.fillRect(i * 75, 1300 - ((i * 37) % 400), 70, 800)
    }
    return c.toDataURL('image/jpeg', 0.9).split(',')[1]
  })
  writeFileSync(photoPath, Buffer.from(b64, 'base64'))
}

const report = []
for (const t of THEMES) {
  errors.length = 0
  await page.goto(BASE + '#/' + t)
  await page.waitForLoadState('load')
  await page.waitForTimeout(1500)
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('retro:seen', '1')
  })
  await page.reload()
  await page.waitForTimeout(2000)
  if (PHOTO) {
    const chooser = page.waitForEvent('filechooser')
    await page.locator('.drop').first().click()
    await (await chooser).setFiles(photoPath)
    await page.waitForTimeout(2500)
  }
  if (process.env.GOTHIC === '1') {
    const b = page.getByRole('button', { name: '고딕', exact: true })
    if (await b.count()) await b.first().click()
    await page.waitForTimeout(800)
  }
  // 첫 글자 칸을 고친다 (바이트 숫자 칸 말고)
  const ed = page.locator('.canvas .ed:not(.ed-inline)').first()
  await ed.click()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.keyboard.type(process.env.TEXT ?? '오늘 ♥ 점검 ^^ ★')
  // 폰 입력 모드면 '완료', 아니면 빈 곳을 눌러 초점을 뺀다
  if (await page.locator('.typing-done').count()) await page.locator('.typing-done').click()
  else await page.locator('.topbar').click({ position: { x: 5, y: 5 } })
  await page.waitForTimeout(600)

  // 화면 — 캔버스를 실제 크기로 찍는다 (확대 1배로 되돌려 둔다)
  const canvasBox = await page.locator('.canvas').boundingBox()
  const shotScreen = await page.locator('.canvas').screenshot()
  writeFileSync(join(out, `${DEVICE}-${t}__화면.png`), shotScreen)

  const dlP = page.waitForEvent('download', { timeout: 40000 }).catch(() => null)
  await page.getByRole('button', { name: 'PNG 저장' }).click()
  // 폰은 저장 창이 뜬다 — 창이 뜨거나 내려받기가 되거나 둘 중 먼저
  const dl = await Promise.race([dlP, page.locator('.png-sheet img').waitFor({ timeout: 40000 }).then(() => null, () => null)])
  let saved = null
  let sheet = false
  if (dl) {
    saved = join(out, `${DEVICE}-${t}__저장본.png`)
    await dl.saveAs(saved)
  } else {
    // 내려받기 대신 '길게 눌러 저장' 창이 떴는지
    sheet = await page.locator('.png-sheet img').count()
    if (sheet) {
      const src = await page.locator('.png-sheet img').getAttribute('src')
      const b = await page.evaluate(async (u) => {
        const r = await fetch(u)
        const a = new Uint8Array(await r.arrayBuffer())
        let s = ''
        for (const x of a) s += String.fromCharCode(x)
        return btoa(s)
      }, src)
      saved = join(out, `${DEVICE}-${t}__저장본.png`)
      writeFileSync(saved, Buffer.from(b, 'base64'))
      await page.locator('.png-sheet [data-act="close"]').click()
    }
  }
  const dialog = await page.locator('.overlay .modal').count()
  const dialogText = dialog ? await page.locator('.overlay .modal').innerText() : ''

  let cmp = null
  if (saved) {
    const a = readFileSync(saved).toString('base64')
    const b = shotScreen.toString('base64')
    cmp = await page.evaluate(
      async ([A64, B64]) => {
        const load = (s) =>
          new Promise((r, j) => {
            const i = new Image()
            i.onload = () => r(i)
            i.onerror = j
            i.src = 'data:image/png;base64,' + s
          })
        const A = await load(A64)
        const B = await load(B64)
        const w = 700
        const h = Math.round((A.height * w) / A.width)
        const draw = (img) => {
          const c = document.createElement('canvas')
          c.width = w
          c.height = h
          const x = c.getContext('2d')
          x.fillStyle = '#fff'
          x.fillRect(0, 0, w, h)
          x.drawImage(img, 0, 0, w, h)
          return c
        }
        const ca = draw(A)
        const cb = draw(B)
        const da = ca.getContext('2d').getImageData(0, 0, w, h).data
        const db = cb.getContext('2d').getImageData(0, 0, w, h).data
        let sum = 0
        let big = 0
        for (let i = 0; i < da.length; i += 4) {
          const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3
          sum += d
          if (d > 40) big++
        }
        const s = document.createElement('canvas')
        s.width = w * 2 + 12
        s.height = h
        const sx = s.getContext('2d')
        sx.fillStyle = '#ff4d8d'
        sx.fillRect(0, 0, s.width, h)
        sx.drawImage(ca, 0, 0)
        sx.drawImage(cb, w + 12, 0)
        return {
          평균차이: +(sum / (w * h)).toFixed(2),
          크게다른칸: +((big / (w * h)) * 100).toFixed(2) + '%',
          저장본: A.width + '×' + A.height,
          side: s.toDataURL('image/png').split(',')[1],
        }
      },
      [a, b],
    )
    writeFileSync(join(out, `${DEVICE}-${t}__비교.png`), Buffer.from(cmp.side, 'base64'))
    delete cmp.side
  }
  const row = { 테마: t, 내려받기: !!dl, 길게눌러창: !!sheet, 확인창: dialogText.replace(/\s+/g, ' ').slice(0, 80), ...cmp, 오류: [...errors] }
  report.push(row)
  console.log(JSON.stringify(row))
}
await browser.close()
writeFileSync(join(out, `${DEVICE}-report.json`), JSON.stringify(report, null, 2))
