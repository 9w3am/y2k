/* ══════════════════════════════════════════════════════════
   화면은 늘 최신이어야 한다.
   예전 판에서는 HTML 까지 캐시를 먼저 내주는 바람에
   새로 올려도 옛날 화면이 계속 떴다.

   · 페이지(HTML) : 네트워크 먼저 — 항상 최신
   · /assets/ 파일: 이름에 해시가 붙어 바뀌면 이름도 바뀌므로 캐시 먼저
   · 그 밖        : 네트워크 먼저, 안 되면 캐시
   ══════════════════════════════════════════════════════════ */

const CACHE = 'ilog-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      // 예전 판이 남긴 캐시를 전부 버린다
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  const isPage = req.mode === 'navigate' || req.destination === 'document'
  const isHashedAsset = url.pathname.includes('/assets/')

  if (isHashedAsset) {
    // 이름이 곧 판본이라 한 번 받으면 그대로 써도 된다
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      }),
    )
    return
  }

  // 페이지와 나머지는 항상 새로 받아본다
  e.respondWith(
    (async () => {
      try {
        const res = await fetch(req)
        if (res.ok) {
          const cache = await caches.open(CACHE)
          cache.put(req, res.clone())
        }
        return res
      } catch {
        const hit = await caches.match(req)
        if (hit) return hit
        if (isPage) {
          const shell = await caches.match('./index.html')
          if (shell) return shell
        }
        throw new Error('offline')
      }
    })(),
  )
})
