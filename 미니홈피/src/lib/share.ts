/* ══════════════════════════════════════════════════════════
   공유
   내 미니홈피를 통째로 주소에 담아 남에게 보낸다.
   사진은 주소에 담기엔 너무 커서 빼고 보낸다 —
   전부 그대로 주고받으려면 파일(.json)로 옮기면 된다.
   ══════════════════════════════════════════════════════════ */

/** 주소에 실으면 안 되는 무거운 것들 */
const HEAVY = ['photo', 'room', 'bgImage', 'src']

type Json = Record<string, unknown>

/** 사진 같은 큰 값을 걷어내고, 무엇을 뺐는지 알려준다 */
function strip(state: Json): { light: Json; dropped: string[] } {
  const dropped = new Set<string>()

  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      const out: Json = {}
      for (const [k, val] of Object.entries(v as Json)) {
        // 'idb:' 는 내 브라우저 보관소 안의 사진이라 받는 사람에게는 쓸모가 없다
        if (
          HEAVY.includes(k) &&
          typeof val === 'string' &&
          (val.startsWith('data:') || val.startsWith('idb:'))
        ) {
          dropped.add(k)
          out[k] = ''
        } else {
          out[k] = walk(val)
        }
      }
      return out
    }
    return v
  }

  return { light: walk(state) as Json, dropped: [...dropped] }
}

const toBase64Url = (bytes: Uint8Array) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function gzip(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}

/** 지금 상태로 공유 주소를 만든다 */
export async function makeShareLink(state: Json): Promise<{ url: string; dropped: string[]; kb: number }> {
  const { light, dropped } = strip(state)
  const code = toBase64Url(await gzip(JSON.stringify(light)))
  const base = location.href.split('#')[0]
  return { url: `${base}#/v/${code}`, dropped, kb: Math.round(code.length / 1024) }
}

/** 공유 주소에서 상태를 꺼낸다 */
export async function readShareCode(code: string): Promise<Json | null> {
  try {
    return JSON.parse(await gunzip(fromBase64Url(code))) as Json
  } catch {
    return null
  }
}
