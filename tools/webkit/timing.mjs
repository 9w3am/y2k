import { webkit, devices } from 'playwright'
const b = await webkit.launch()
const ctx = await b.newContext({ ...devices['iPhone 13'], acceptDownloads: true })
const p = await ctx.newPage()
p.on('response', (r) => r.status() >= 400 && console.log('응답', r.status(), r.url().slice(-60)))
await p.goto((process.argv[2] ?? 'http://localhost:5183/') + '#/pc-messenger')
await p.waitForTimeout(2500)
await p.evaluate(() => localStorage.setItem('retro:seen', '1'))
await p.reload()
await p.waitForTimeout(2000)
for (let i = 0; i < 3; i++) {
  const t = Date.now()
  await p.getByRole('button', { name: 'PNG 저장' }).click()
  await p.locator('.png-sheet img').waitFor({ timeout: 90000 })
  console.log('저장 걸린 시간', ((Date.now() - t) / 1000).toFixed(1), '초')
  await p.locator('.png-sheet [data-act="close"]').click()
}
await b.close()
