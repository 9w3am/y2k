/*
   점검 시나리오. 각 시나리오는 (api, step) 을 받는다.
   step('이름', async () => 값) — 던지면 실패, 콘솔 오류가 있어도 실패로 표시된다.
   가입·로그인은 누르지 않는다 (빈칸 검사까지만).
*/
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'

const ILOG_PAGES = ['', 'home', 'profile', 'diary', 'photo', 'board', 'paper', 'guest', 'jjak', 'shop', 'setting']
const INBOX_THEMES = ['sms-write', 'sms-view', 'sms-compose', 'sms-attach', 'sms-inbox', 'pc-messenger']

/** 우리 사이트의 확인창이 떠 있으면 '예' 쪽을 누른다 */
async function confirmIlog(api) {
  if (await api.eval(`!!document.querySelector('.dlg-foot .btn-main')`)) await api.clickSel('.dlg-foot .btn-main', { wait: 700 })
}
async function confirmInbox(api) {
  if (await api.eval(`!!document.querySelector('.overlay .modal-f .btn-primary')`))
    await api.clickSel('.overlay .modal-f .btn-primary', { wait: 700 })
}
const inkNow = (api) => api.eval(`Number((document.body.innerText.match(/잉크 (\\d+) ?방울/) || [])[1])`)
// 바이트 숫자 칸(.ed-inline)은 숫자만 받으므로 빼고 첫 글자 칸
const ED = '.canvas .ed:not(.ed-inline)'
const firstEd = (api) => api.eval(`document.querySelectorAll('${ED}')[0]?.innerText ?? null`)

/** PNG 저장을 누르고, 내려받은 저장본을 화면과 비교 */
async function saveAndMatch(api, selector, label, wait = 20000) {
  const n = api.downloadCount()
  await api.click('PNG 저장', { exact: true, wait: 300 })
  const f = await api.waitDownload(n, wait)
  if (!f || !f.name.endsWith('.png')) throw new Error(`PNG 안 내려받아짐 (${f?.name})`)
  await api.sleep(400)
  const m = await api.screenMatch(f.file, selector, label)
  return { 파일: f.name, 용량: f.size, ...m }
}

export const SCENARIOS = {
  /**
   * 수신함 저장 전수 검사 — 테마마다 사진 깔고, 글자 바꾸고, 저장본을 화면과 나란히.
   * INBOX_VARIANT=photo(기본) | square(각진 화면) | nofx(효과 끔) | dim(사진+어둡게)
   */
  async inboxfull(api, step) {
    const S = api.INBOX
    // 폰으로 찍은 사진처럼 큰 JPEG 한 장을 만들어 올린다 (하늘·노을·건물·잔무늬)
    await api.viewport(800, 600)
    await api.go(`${S}#/sms-write`, 800)
    const b64 = await api.eval(`(() => {
      const c = document.createElement('canvas'); c.width = 3000; c.height = 2000; const x = c.getContext('2d')
      const g = x.createLinearGradient(0, 0, 0, 2000); g.addColorStop(0, '#3b6fd6'); g.addColorStop(0.55, '#f7a36b'); g.addColorStop(1, '#2b1d3a')
      x.fillStyle = g; x.fillRect(0, 0, 3000, 2000)
      x.fillStyle = '#ffe9a8'; x.beginPath(); x.arc(2200, 900, 180, 0, 7); x.fill()
      for (let i = 0; i < 40; i++) { x.fillStyle = 'hsl(' + (200 + i * 3) + ',30%,' + (10 + (i % 5) * 4) + '%)'; x.fillRect(i * 75, 1300 - (i * 37 % 400), 70, 800) }
      const d = x.getImageData(0, 0, 3000, 2000); for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - 0.5) * 18; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n } x.putImageData(d, 0, 0)
      return c.toDataURL('image/jpeg', 0.9).split(',')[1]
    })()`)
    const photo = join(api.out, 'test-photo.jpg')
    writeFileSync(photo, Buffer.from(b64, 'base64'))
    api.setUpload(photo)
    const variant = process.env.INBOX_VARIANT ?? 'photo'
    const themes = (process.env.THEMES ?? INBOX_THEMES.join(',')).split(',')
    for (const [tag, w, h, mobile] of [
      ['pc', 1440, 900, false],
      ['m', 390, 844, true],
    ]) {
      await api.viewport(w, h, mobile)
      for (const t of themes) {
        await step(`${tag} ${t} ${variant}`, async () => {
          await api.go(`${S}#/${t}`, 1200)
          await api.eval(`localStorage.clear(); localStorage.setItem('retro:seen','1'); 1`)
          await api.reload(2000)
          const extra = {}
          if (variant !== 'nofx' && variant !== 'square') {
            await api.clickSel('.drop', { wait: 3500 })
            extra.사진칸 = await api.eval(`getComputedStyle(document.querySelector('.drop-thumb')).backgroundImage.slice(0, 22)`)
          }
          if (variant === 'dim') {
            await api.eval(`(() => { const s = [...document.querySelectorAll('.field')].find((f) => f.innerText.includes('배경 어둡기'))?.querySelector('input[type=range]'); if (!s) return 0; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(s, '45'); s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); return 1 })()`)
          }
          if (variant === 'square') await api.click('각지게', { exact: true, wait: 600 })
          if (variant === 'nofx') {
            for (const label of ['서브픽셀 결', '유리 반사', '가장자리 그늘'])
              await api.eval(`(() => { const f = [...document.querySelectorAll('.field')].find((x) => x.innerText.includes(${JSON.stringify(label)})); f?.querySelector('.sw')?.click(); return 1 })()`)
          }
          await api.type('.canvas .ed:not(.ed-inline)', '오늘 ♥ 점검 ^^ ★', { index: 0 })
          await api.sleep(600)
          const m = await saveAndMatch(api, '.canvas', `full-${variant}-${tag}-${t}`, 20000)
          return { ...extra, ...m }
        })
      }
    }
  },

  /** 위 메뉴줄 — 계정 단추에 긴 아이디(20자)를 넣어도 한 줄에서 안 깨지는지 */
  async gnb(api, step) {
    for (const [tag, w, h, mobile] of [
      ['pc', 1280, 860, false],
      ['pc-900', 900, 700, false],
      ['m', 390, 844, true],
    ]) {
      await api.viewport(w, h, mobile)
      await step(`${tag} 긴 아이디`, async () => {
        await api.go(`${api.ILOG}#/`, 2500)
        const r = await api.eval(`(() => {
          const chip = document.querySelector('.gnb-user .btn.acct')
          if (chip) chip.textContent = 'abcdefghijklmnopqrst'
          const bar = document.querySelector('.gnb-in')
          const items = [...document.querySelectorAll('.gnb-menu a, .gnb-user > *')]
          const tall = items.filter((e) => e.getBoundingClientRect().height > 40).map((e) => e.textContent)
          const out = items.filter((e) => e.getBoundingClientRect().right > innerWidth + 1).map((e) => e.textContent)
          return { 줄높이: Math.round(bar.getBoundingClientRect().height), 두줄로깨짐: tall, 화면밖: out, 단추폭: Math.round(chip?.getBoundingClientRect().width ?? 0), 가로넘침: document.documentElement.scrollWidth - innerWidth }
        })()`)
        await api.shot(`gnb-${tag}`)
        if (r.두줄로깨짐.length || r.화면밖.length || r.가로넘침 > 0) throw new Error(JSON.stringify(r))
        return r
      })
    }
  },

  /** 운영 — 로그인 안 한 사람은 운영 페이지가 막히고 '운영' 메뉴도 없어야 한다. 대문 공지는 그대로 */
  async admin(api, step) {
    for (const [tag, w, h, mobile] of [
      ['pc', 1280, 860, false],
      ['m', 390, 844, true],
    ]) {
      await api.viewport(w, h, mobile)
      await step(`${tag} 로그인 없이 #/admin`, async () => {
        await api.go(`${api.ILOG}#/admin`, 3000)
        const blocked = await api.has('운영자만 들어올 수 있습니다')
        const menu = await api.eval(`!!document.querySelector('.gnb-admin')`)
        await api.shot(`admin-anon-${tag}`)
        if (!blocked || menu) throw new Error(`막힘 ${blocked}, 운영 메뉴 ${menu}`)
        return { 막힘: blocked }
      })
      await step(`${tag} 대문 공지·이벤트`, async () => {
        await api.go(`${api.ILOG}#/`, 3000)
        const notices = await api.eval(`[...document.querySelectorAll('.notice-list li')].map((l) => l.innerText.replace(/\\s+/g, ' ')).slice(0, 4)`)
        const evt = await api.eval(`document.querySelector('.evt')?.innerText?.replace(/\\s+/g, ' ') ?? null`)
        const marquee = await api.eval(`document.querySelector('.marquee')?.innerText ?? null`)
        if (!notices.length) throw new Error('공지 없음')
        return { 공지: notices, 이벤트: evt, 흐르는공지: marquee?.slice(0, 30) }
      })
    }
  },

  /** 음악 칸 이름표 — 눌러서 고치고, 새로고침해도 남는지, 비우면 기본 글자로 돌아오는지 */
  async bgmtag(api, step) {
    await api.viewport(1280, 860)
    await step('이름표 고치기 → 새로고침', async () => {
      await api.go(`${api.ILOG}#/home`, 2500)
      const before = await api.eval(`document.querySelector('.bgm .bgm-by')?.innerText`)
      const editable = await api.eval(`document.querySelector('.bgm .bgm-by')?.getAttribute('contenteditable')`)
      await api.type('.bgm .bgm-by', '내가 고른 노래')
      const after = await api.eval(`document.querySelector('.bgm .bgm-by')?.innerText`)
      await api.reload(2500)
      const kept = await api.eval(`document.querySelector('.bgm .bgm-by')?.innerText`)
      await api.shot('bgmtag-after')
      if (after !== '내가 고른 노래' || kept !== '내가 고른 노래') throw new Error(`고친 뒤 ${after}, 새로고침 뒤 ${kept}`)
      return { 처음: before, 고칠수있음: editable, 새로고침뒤: kept }
    })
    await step('지우면 기본 글자', async () => {
      await api.type('.bgm .bgm-by', '')
      await api.reload(2500)
      return await api.eval(`document.querySelector('.bgm .bgm-by')?.innerText`)
    })
  },

  /** 스킨 보기 — 기록장에 저장된 스킨을 바꿔 가며 대문·홈·상점을 찍는다 (SKINS 환경변수로 고름) */
  async skins(api, step) {
    const list = (process.env.SKINS ?? 'night,lemon').split(',')
    for (const [tag, w, h, mobile] of [
      ['pc', 1280, 860, false],
      ['m', 390, 844, true],
    ]) {
      await api.viewport(w, h, mobile)
      for (const sk of list) {
        await step(`${tag} ${sk}`, async () => {
          await api.go(`${api.ILOG}#/home`, 1500)
          await api.eval(`(() => { const k = 'ilog:v1'; const v = JSON.parse(localStorage.getItem(k) || '{"state":{},"version":0}'); v.state.skin = ${JSON.stringify(sk)}; v.state.owned = [...new Set([...(v.state.owned || []), ${JSON.stringify(sk)}])]; localStorage.setItem(k, JSON.stringify(v)); return 1 })()`)
          // 주소의 # 만 바뀌면 새로 불러오지 않아 메모리의 옛 스킨이 다시 저장된다 — 확실히 새로고침
          await api.reload(1500)
          for (const p of ['home', '', 'shop']) {
            await api.hash(`#/${p}`, 2200)
            await api.shot(`skin-${sk}-${p || 'portal'}-${tag}`)
          }
          return await api.eval('document.documentElement.dataset.skin')
        })
      }
    }
  },

  /** PC 한 화면 — 페이지 자체가 세로로 넘치는지 (넘치면 안 됨) */
  async fit(api, step) {
    for (const [w, h] of [
      [1280, 860],
      [1920, 969],
      [1366, 657],
    ]) {
      await api.viewport(w, h)
      for (const p of ILOG_PAGES) {
        await step(`${w}×${h} #/${p}`, async () => {
          await api.go(`${api.ILOG}#/${p}`, 2200)
          const over = await api.eval('document.documentElement.scrollHeight - innerHeight')
          if (w === 1366) await api.shot(`fit-${w}-${p || 'portal'}`)
          if (over > 1) throw new Error(`세로로 ${over}px 넘침`)
          return over
        })
      }
    }
  },

  /** 한 바퀴 — 페이지마다 화면·단추 목록·가로 넘침 */
  async tour(api, step) {
    for (const [tag, w, h, mobile] of [
      ['pc', 1280, 860, false],
      ['m', 390, 844, true],
    ]) {
      await api.viewport(w, h, mobile)
      if (!api.BASE.startsWith('http://localhost')) {
        await step(`${tag} 첫 화면`, async () => {
          await api.go(api.BASE)
          await api.shot(`landing-${tag}`, true)
          return { 넘침: await api.overflowX() }
        })
      }
      for (const p of ILOG_PAGES) {
        await step(`${tag} 아이로그 #/${p}`, async () => {
          await api.go(`${api.ILOG}#/${p}`, 2600)
          await api.shot(`ilog-${p || 'portal'}-${tag}`, true)
          return { 넘침: await api.overflowX() }
        })
      }
      for (const t of INBOX_THEMES) {
        await step(`${tag} 수신함 ${t}`, async () => {
          await api.go(`${api.INBOX}#/${t}`, 1500)
          await api.eval(`localStorage.setItem('retro:seen','1'); 1`)
          await api.reload(1800)
          await api.shot(`inbox-${t}-${tag}`)
          return { 넘침: await api.overflowX() }
        })
      }
    }
  },

  /** 아이로그 — 실제로 눌러 보기 */
  async ilog(api, step) {
    const I = api.ILOG
    for (const [tag, w, h, mobile] of [
      ['pc', 1280, 860, false],
      ['m', 390, 844, true],
    ]) {
      await api.viewport(w, h, mobile)

      await step(`${tag} 글쓰기 → 사진 넣고 올리기`, async () => {
        await api.go(`${I}#/diary`, 2000)
        await api.click('글쓰기', { exact: true })
        await api.fill('input[placeholder="제목"]', `점검 글 ${tag}`)
        await api.fill('input[placeholder="카테고리"]', '점검')
        await api.fill('textarea.writer-ta', '점검 본문입니다')
        const before = api.fileChoosers()
        await api.click('사진 넣기', { exact: true, wait: 2500 })
        if (api.fileChoosers() === before) throw new Error('파일 고르기 창이 안 열림')
        const imgs = await api.eval(`document.querySelectorAll('.writer-img').length`)
        if (imgs < 1) throw new Error('사진이 안 들어감')
        await api.shot(`ilog-writer-${tag}`)
        await api.click('올리기', { exact: true, wait: 1500 })
        if (!(await api.has(`점검 글 ${tag}`))) throw new Error('글이 목록에 없음')
        await api.shot(`ilog-diary-after-${tag}`)
        return { 사진: imgs, 잉크: await inkNow(api) }
      })

      await step(`${tag} 글 보기 → 공감·댓글`, async () => {
        await api.click(`점검 글 ${tag}`, { wait: 1500 })
        const img = await api.eval(`[...document.images].filter((i) => i.complete && i.naturalWidth > 0 && i.closest('article')).length`)
        await api.click('공감', { wait: 500 })
        const likes = await api.eval(`document.querySelector('.like b')?.textContent`)
        await api.fill('.cmt-form input[placeholder="이름"]', '점검')
        await api.fill('.cmt-form input[placeholder="댓글"]', '댓글 점검')
        await api.click('남기기', { exact: true, scope: '.cmt-form', wait: 700 })
        if (!(await api.has('댓글 점검'))) throw new Error('댓글 안 붙음')
        await api.shot(`ilog-post-view-${tag}`, true)
        if (img < 1) throw new Error('글 속 사진이 안 보임')
        return { 보이는사진: img, 공감: likes }
      })

      await step(`${tag} 글 고치기`, async () => {
        await api.click('고치기', { exact: true, scope: '.post-actions', wait: 1500 })
        await api.fill('input[placeholder="제목"]', `점검 글 고침 ${tag}`)
        await api.click('고치기', { exact: true, scope: '.writer-foot', wait: 1500 })
        if (!(await api.has(`점검 글 고침 ${tag}`))) throw new Error('고친 제목 없음')
      })

      await step(`${tag} 글 지우기`, async () => {
        await api.click(`점검 글 고침 ${tag}`, { wait: 1500 })
        await api.click('지우기', { exact: true, scope: '.post-actions', wait: 700 })
        await confirmIlog(api)
        await api.sleep(800)
        if (await api.has(`점검 글 고침 ${tag}`)) throw new Error('안 지워짐')
        return await api.eval('location.hash')
      })

      await step(`${tag} 게시판·페이퍼 글쓰기`, async () => {
        const got = {}
        for (const k of ['board', 'paper']) {
          await api.go(`${I}#/${k}`, 1500)
          await api.click('글쓰기', { exact: true })
          await api.fill('input[placeholder="제목"]', `${k} 점검 ${tag}`)
          await api.fill('textarea.writer-ta', '본문')
          await api.click('올리기', { exact: true, wait: 1200 })
          got[k] = await api.has(`${k} 점검 ${tag}`)
        }
        if (!got.board || !got.paper) throw new Error(JSON.stringify(got))
        return got
      })

      await step(`${tag} 사진첩 올리기·지우기`, async () => {
        await api.go(`${I}#/photo`, 1500)
        const n0 = await api.eval(`document.querySelectorAll('.pic').length`)
        await api.click('사진 올리기', { exact: true, wait: 2800 })
        const n1 = await api.eval(`document.querySelectorAll('.pic').length`)
        await api.shot(`ilog-photo-added-${tag}`, true)
        if (n1 !== n0 + 1) throw new Error(`사진 수 ${n0} → ${n1}`)
        await api.clickSel('[aria-label="사진 지우기"]', { wait: 700 })
        await confirmIlog(api)
        const n2 = await api.eval(`document.querySelectorAll('.pic').length`)
        if (n2 !== n0) throw new Error(`지운 뒤 ${n2}`)
        return { 전: n0, 올린뒤: n1, 지운뒤: n2 }
      })

      await step(`${tag} 프로필 사진·내방 사진`, async () => {
        await api.go(`${I}#/home`, 1800)
        await api.clickSel('.side-pic', { wait: 2800 })
        await api.clickSel('.room', { wait: 2800 })
        const bg = await api.eval(
          `[getComputedStyle(document.querySelector('.side-pic')).backgroundImage.slice(0, 16), getComputedStyle(document.querySelector('.room')).backgroundImage.slice(0, 16)]`,
        )
        await api.shot(`ilog-home-photos-${tag}`, true)
        if (bg.includes('none')) throw new Error(`사진 안 들어감 ${bg}`)
        await api.reload(2500)
        const kept = await api.eval(`getComputedStyle(document.querySelector('.side-pic')).backgroundImage.slice(0, 16)`)
        if (kept === 'none') throw new Error('새로고침하면 사라짐')
        return { bg, 새로고침뒤: kept }
      })

      await step(`${tag} 방명록 남기기(비밀글)·답글·지우기`, async () => {
        await api.go(`${I}#/guest`, 1800)
        await api.fill('input[placeholder="이름"]', `점검손님${tag}`)
        await api.fill('textarea', '방명록 점검')
        await api.clickSel('input[type=checkbox]')
        await api.click('남기기', { exact: true, wait: 900 })
        if (!(await api.has(`점검손님${tag}`))) throw new Error('안 남겨짐')
        await api.click('답글', { exact: true, wait: 500 })
        await api.shot(`ilog-guest-${tag}`, true)
        return (await api.text()).match(new RegExp(`점검손님${tag}[\\s\\S]{0,60}`))?.[0]
      })

      if (tag === 'm') {
        await step('m PNG 저장 ↔ 화면 비교 (홈, 사진 있음)', async () => {
          await api.go(`${I}#/home`, 2800)
          return saveAndMatch(api, '#root', 'ilog-m-home')
        })
      }

      if (tag === 'pc') {
        await step('상점 스킨 사고 바꾸기·출석', async () => {
          await api.go(`${I}#/shop`, 1800)
          const ink0 = await inkNow(api)
          await api.click('잉크 3방울', { wait: 800 })
          await confirmIlog(api)
          const ink1 = await inkNow(api)
          await api.click('이걸로 바꾸기', { wait: 800 })
          const skin = await api.eval(`document.documentElement.dataset.skin`)
          await api.click('출석 도장 찍기', { wait: 700 })
          await confirmIlog(api)
          const ink2 = await inkNow(api)
          await api.shot('ilog-shop-bought', true)
          return { 잉크: `${ink0} → 산 뒤 ${ink1} → 출석 ${ink2}`, 스킨: skin }
        })

        await step('꾸밈새 켜기·끄기', async () => {
          await api.go(`${I}#/setting`, 1800)
          await api.click('내 꾸밈새로 바꾸기', { wait: 900 })
          const on = await api.eval(`document.documentElement.dataset.custom`)
          await api.shot('ilog-setting-custom', true)
          await api.click('내 꾸밈새 쓰는 중', { wait: 700 })
          const off = await api.eval(`document.documentElement.dataset.custom`)
          return { 켬: on, 끔: off }
        })

        await step('공유 링크 만들고 열기', async () => {
          await api.go(`${I}#/setting`, 1800)
          await api.click('공유 링크 만들기', { exact: true, wait: 2000 })
          const link = await api.eval(`document.querySelector('[aria-label="공유 링크"]')?.value || ''`)
          await confirmIlog(api)
          if (!link) throw new Error('링크가 안 나옴')
          await api.go(link, 3000)
          const viewing = await api.has('구경 중')
          await api.shot('ilog-share-view')
          await api.click('내 기록장으로', { wait: 3000 })
          const back = await api.has('구경 중')
          if (!viewing || back) throw new Error(`구경 ${viewing}, 돌아온 뒤 ${back}`)
          return { 링크길이: link.length }
        })

        await step('백업 파일 내려받기', async () => {
          await api.go(`${I}#/setting`, 1800)
          const n = api.downloadCount()
          await api.click('백업 파일 내려받기', { wait: 300 })
          const f = await api.waitDownload(n)
          if (!f) throw new Error('파일 없음')
          return { 이름: f.name, 용량: f.size }
        })

        await step('PNG 저장 ↔ 화면 비교 (웹 · 홈, 사진 있음)', async () => {
          await api.go(`${I}#/home`, 2800)
          return saveAndMatch(api, '#root', 'ilog-pc-home')
        })

        await step('PNG 저장 ↔ 화면 비교 (웹 · 다이어리)', async () => {
          await api.go(`${I}#/diary`, 2500)
          return saveAndMatch(api, '#root', 'ilog-pc-diary')
        })

        await step('프로그램 모드 PNG ↔ 화면 비교 → 웹으로', async () => {
          await api.go(`${I}#/home`, 2500)
          await api.click('프로그램으로 보기', { exact: true, wait: 2000 })
          await api.shot('ilog-app-mode')
          const m = await saveAndMatch(api, '.win', 'ilog-pc-program')
          await api.click('시작', { wait: 700 })
          await api.click('웹사이트로 보기', { wait: 2000 })
          const web = await api.has('프로그램으로 보기')
          if (!web) throw new Error('웹으로 안 돌아옴')
          return m
        })

        await step('음악 — 내장곡 없음, 오류 문구 없음', async () => {
          await api.go(`${I}#/home`, 2500)
          const card = await api.eval(`document.querySelector('.bgm')?.innerText?.replace(/\\s+/g, ' ').slice(0, 60)`)
          const warn = await api.eval(`document.querySelector('.bgm-warn')?.innerText ?? null`)
          await api.go(`${I}#/setting`, 1800)
          const kinds = await api.eval(`[...document.querySelectorAll('.pickrow .btn')].map((b) => b.innerText).filter((t) => /내장곡|내 파일|유튜브/.test(t))`)
          if (warn || kinds.includes('내장곡')) throw new Error(`오류 ${warn}, 고르기 ${kinds}`)
          return { 음악칸: card, 고르기: kinds }
        })

        await step('아이디로 놀러가기 qwer1234', async () => {
          await api.go(`${I}#/u/qwer1234`, 4000)
          const ok = await api.has('qwer1234 님의 기록장')
          await api.shot('ilog-visit-home')
          await api.hash('#/guest', 2500)
          const guest = await api.has('로그인하면 방명록을 남길 수 있어요')
          await api.hash('#/jjak', 2000)
          const jjak = (await api.text()).match(/qwer1234 님은[^\n]*/)?.[0]
          await api.click('내 기록장으로', { wait: 3000 })
          const back = await api.has('구경 중')
          if (!ok || back) throw new Error(`구경 ${ok}, 복귀 뒤 ${back}`)
          return { 방명록안내: guest, 단짝: jjak }
        })

        await step('없는 아이디로 놀러가기', async () => {
          await api.go(`${I}#/u/zz_nobody_zz`, 3500)
          if (!(await api.has('찾지 못했습니다'))) throw new Error((await api.text()).slice(0, 100))
        })

        await step('로그인 빈칸·가입 칸 검사 (보내지 않음)', async () => {
          await api.go(`${I}#/`, 2500)
          await api.click('들어가기', { exact: true, wait: 900 })
          const loginMsg = (await api.text()).match(/[^\n]*(입력|적어|확인)[^\n]*/g)?.slice(0, 3)
          await api.click('회원가입', { exact: true, wait: 700 })
          await api.shot('ilog-signup-form')
          return { 로그인빈칸: loginMsg }
        })
      }
    }
  },

  /** 수신함 — 실제로 눌러 보기 */
  async inbox(api, step) {
    const S = api.INBOX
    for (const [tag, w, h, mobile] of [
      ['pc', 1440, 900, false],
      ['m', 390, 844, true],
    ]) {
      await api.viewport(w, h, mobile)
      await step(`${tag} 안내창 → 시작하기`, async () => {
        await api.go(`${S}#/sms-write`, 1500)
        await api.eval(`localStorage.clear(); 1`)
        await api.reload(1800)
        const shown = await api.eval(`!!document.querySelector('.modal')`)
        const scroll = await api.eval(`(() => { const m = document.querySelector('.modal'); return m ? m.scrollHeight - m.clientHeight : null })()`)
        await api.click('시작하기', { exact: true, wait: 700 })
        if (!shown) throw new Error('안내창이 안 뜸')
        return { 안내창속스크롤: scroll }
      })
      for (const t of INBOX_THEMES) {
        await step(`${tag} ${t} 글자 고치기·되돌리기·확대·PNG`, async () => {
          await api.go(`${S}#/${t}`, 1800)
          const eds = await api.eval(`document.querySelectorAll('.canvas .ed').length`)
          const before = await firstEd(api)
          await api.type(ED, '점검중', { index: 0 })
          const after = await firstEd(api)
          await api.clickSel('[aria-label="되돌리기"]', { wait: 500 })
          const undone = await firstEd(api)
          await api.clickSel('[aria-label="다시 실행"]', { wait: 500 })
          const redone = await firstEd(api)
          await api.clickSel('[aria-label="확대"]', { wait: 300 })
          const zoom = await api.eval(`document.querySelector('.fbtn-w')?.innerText`)
          await api.clickSel('.fbtn-w', { wait: 300 })
          if (tag === 'm') await api.shot(`inbox-edit-${t}-m`)
          const m = await saveAndMatch(api, '.canvas', `inbox-${tag}-${t}`, 9000)
          const bad = []
          if (after !== '점검중') bad.push(`글자 안 바뀜(${after})`)
          if (undone !== before) bad.push(`되돌리기 안 됨(${undone})`)
          if (redone !== '점검중') bad.push(`다시 실행 안 됨(${redone})`)
          if (zoom !== '110%') bad.push(`확대 ${zoom}`)
          if (bad.length) throw new Error(bad.join(', '))
          return { 글자칸: eds, ...m }
        })
      }
    }

    await api.viewport(1440, 900)
    await step('프리셋 저장 → 초기화 → 불러오기', async () => {
      await api.go(`${S}#/sms-write`, 1800)
      await api.type(ED, '프리셋점검', { index: 0 })
      const n = api.downloadCount()
      await api.click('프리셋 저장', { exact: true, wait: 300 })
      const f = await api.waitDownload(n)
      if (!f || !f.name.endsWith('.json')) throw new Error(`프리셋 파일 없음 (${f?.name})`)
      await api.click('이 테마 초기화', { exact: true, wait: 700 })
      await confirmInbox(api)
      const reset = await firstEd(api)
      api.setUpload(join(api.downloads, f.file))
      await api.click('불러오기', { exact: true, wait: 2000 })
      api.setUpload(null)
      const loaded = await firstEd(api)
      if (loaded !== '프리셋점검') throw new Error(`불러온 뒤 ${loaded}`)
      return { 파일: f.name, 초기화후: reset }
    })

    await step('배경 사진 넣기 → PNG ↔ 화면 비교', async () => {
      await api.clickSel('.drop', { wait: 3000 })
      const thumb = await api.eval(`getComputedStyle(document.querySelector('.drop-thumb')).backgroundImage.slice(0, 20)`)
      await api.shot('inbox-with-photo')
      if (thumb === 'none') throw new Error('사진 안 들어감')
      return saveAndMatch(api, '.canvas', 'inbox-pc-photo', 9000)
    })

    await step('테마 고르기 창으로 바꾸기', async () => {
      await api.clickSel('.theme-switch', { wait: 700 })
      await api.shot('inbox-theme-picker')
      await api.click('받은문자함', { scope: '.theme-grid', wait: 1500 })
      const hash = await api.eval('location.hash')
      if (hash !== '#/sms-inbox') throw new Error(hash)
      return hash
    })

    await step('새로고침해도 내용 남음', async () => {
      await api.go(`${S}#/sms-write`, 1800)
      await api.type(ED, '남는지', { index: 0 })
      await api.reload(2500)
      const v = await firstEd(api)
      if (v !== '남는지') throw new Error(v)
      return v
    })
  },
}
