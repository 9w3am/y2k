// 폰 저장 창 — 단추가 뜨는지, 내려받기를 누르면 실제로 파일이 받아지는지
import { webkit, chromium, devices } from 'playwright'
const out = process.argv[2]
const BASE = process.argv[3] ?? 'http://localhost:5183/'
for (const [name, engine, dev, opt] of [
  ['iphone', webkit, devices['iPhone 13'], {}],
  ['galaxy', chromium, devices['Galaxy S9+'], { channel: 'chrome' }],
]) {
  const b = await engine.launch(opt)
  const ctx = await b.newContext({ ...dev, acceptDownloads: true })
  const p = await ctx.newPage()
  await p.goto(BASE + '#/sms-write')
  await p.waitForTimeout(2500)
  await p.evaluate(() => localStorage.setItem('retro:seen', '1'))
  await p.reload()
  await p.waitForTimeout(2000)
  await p.getByRole('button', { name: 'PNG 저장' }).click()
  await p.locator('.png-sheet img').waitFor({ timeout: 40000 })
  await p.waitForTimeout(800)
  await p.screenshot({ path: `${out}/sheet-${name}.png` })
  const btns = await p.locator('.png-sheet-btns > *').allInnerTexts()
  const dlP = p.waitForEvent('download', { timeout: 15000 }).catch(() => null)
  await p.locator('[data-act="dl"]').click().catch(() => null)
  const dl = await dlP
  console.log(name, '단추:', btns.join(' / '), '| 내려받기 눌러서 파일:', dl ? dl.suggestedFilename() : '없음')
  await b.close()
}
