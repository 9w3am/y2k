/*
   폰 입력 모드 점검 — 글자를 누르고 키보드가 올라온 것처럼 화면을 줄여,
   고치는 줄이 크게 보이는지·가려지지 않는지·완료로 돌아오는지 본다.
   node tools/webkit/inbox-typing.mjs <폴더> [기준주소]
*/
import { webkit, chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const out = resolve(process.argv[2] ?? 'typing-out')
const BASE = process.argv[3] ?? 'http://localhost:5183/'
mkdirSync(out, { recursive: true })
const THEMES = ['sms-write', 'sms-view', 'sms-compose', 'sms-attach', 'sms-inbox', 'pc-messenger']

for (const [name, engine, dev, opt] of [
  ['iphone', webkit, devices['iPhone 13'], {}],
  ['galaxy', chromium, devices['Galaxy S9+'], { channel: 'chrome' }],
]) {
  const browser = await engine.launch(opt)
  const ctx = await browser.newContext({ ...dev })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(BASE + '#/sms-write')
  await page.waitForTimeout(2500)
  await page.evaluate(() => localStorage.setItem('retro:seen', '1'))
  await page.reload()
  await page.waitForTimeout(1500)
  const full = dev.viewport
  for (const t of THEMES) {
    await page.setViewportSize(full)
    await page.goto(BASE + '#/' + t)
    await page.waitForTimeout(1800)
    // 마지막 글자 칸(아래쪽이라 키보드에 잘 가려지는 칸)을 누른다
    const eds = page.locator('.canvas .ed:not(.ed-inline)')
    const n = await eds.count()
    const target = eds.nth(Math.max(0, n - 1))
    const before = await page.evaluate(() => {
      const r = document.querySelector('.canvas').getBoundingClientRect()
      return Math.round(r.width)
    })
    await target.tap()
    // 키보드가 올라온 것처럼 — 보이는 칸이 절반 남짓
    await page.setViewportSize({ width: full.width, height: Math.round(full.height * 0.48) })
    await page.waitForTimeout(900)
    await page.keyboard.type('입력')
    await page.waitForTimeout(300)
    const st = await page.evaluate(() => {
      const a = document.activeElement
      const r = a.getBoundingClientRect()
      const c = document.querySelector('.canvas').getBoundingClientRect()
      const done = document.querySelector('.typing-done')
      return {
        입력모드: document.documentElement.classList.contains('typing'),
        화면폭: Math.round(c.width),
        화면전체보임: c.top >= 48 && c.bottom <= innerHeight + 1 && c.left >= 0 && c.right <= innerWidth + 1,
        가로넘침: document.documentElement.scrollWidth - innerWidth,
        커서보임: (() => { const sel = getSelection(); const c = sel.rangeCount ? sel.getRangeAt(0).getClientRects()[0] : null; return !!c && c.top >= 48 && c.bottom <= innerHeight && c.left >= 0 && c.right <= innerWidth })(),
        글자높이: Math.round(r.height),
        완료단추: !!done,
      }
    })
    await page.screenshot({ path: join(out, `${name}-${t}.png`) })
    await page.locator('.typing-done').tap().catch(() => null)
    await page.setViewportSize(full)
    await page.waitForTimeout(500)
    const after = await page.evaluate(() => document.documentElement.classList.contains('typing'))
    console.log(JSON.stringify({ 기기: name, 테마: t, 누르기전화면폭: before, ...st, 완료후입력모드: after, 오류: errors.splice(0) }))
  }
  await browser.close()
}
