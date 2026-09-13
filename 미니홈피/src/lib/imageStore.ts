import { useEffect, useState } from 'react'

/* ══════════════════════════════════════════════════════════
   사진 보관소
   localStorage 는 브라우저마다 5MB 남짓이라 사진 몇십 장이면 꽉 찬다.
   사진은 IndexedDB(보통 수백 MB~몇 GB)에 넣고, 설정에는 'idb:아이디' 만 남긴다.
   예전에 설정 안에 통째로 넣어둔 사진(data:)도 그대로 보인다.
   ══════════════════════════════════════════════════════════ */

const DB = 'ilog-images'
const STORE = 'images'
const PREFIX = 'idb:'

export const isRef = (s: string | undefined | null): s is string => !!s && s.startsWith(PREFIX)
export const isInline = (s: string | undefined | null): s is string => !!s && s.startsWith('data:')

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open()
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req ? (req.result as T) : undefined)
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob()
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(blob)
  })

/** 사진(data: 주소)을 보관소에 넣고 'idb:아이디' 를 돌려준다 */
export async function putImage(dataUrl: string): Promise<string> {
  const id = Math.random().toString(36).slice(2, 12) + Date.now().toString(36)
  const blob = await dataUrlToBlob(dataUrl)
  await run('readwrite', (s) => s.put(blob, id))
  return PREFIX + id
}

export async function getImageBlob(ref: string): Promise<Blob | null> {
  if (!isRef(ref)) return null
  try {
    return ((await run<Blob>('readonly', (s) => s.get(ref.slice(PREFIX.length)))) as Blob) ?? null
  } catch {
    return null
  }
}

/** 더 이상 쓰지 않는 사진을 보관소에서 지운다 */
export async function deleteImage(ref: string | undefined | null): Promise<void> {
  if (!isRef(ref)) return
  const url = urls.get(ref)
  if (url) URL.revokeObjectURL(url)
  urls.delete(ref)
  try {
    await run('readwrite', (s) => s.delete(ref.slice(PREFIX.length)))
  } catch {
    /* 없으면 그만 */
  }
}

/** 파일로 내보낼 때 — 보관소 사진을 다시 data: 로 풀어낸다 */
export async function refToDataUrl(ref: string): Promise<string> {
  if (!isRef(ref)) return ref
  const blob = await getImageBlob(ref)
  return blob ? blobToDataUrl(blob) : ''
}

/* ── 화면에 띄울 주소 ─────────────────────────────────────── */
const urls = new Map<string, string>()
const waiting = new Map<string, Promise<string>>()

/** 보관소 사진을 화면에 쓸 수 있는 주소(blob:)로 바꾼다. 한 번 만든 주소는 재사용한다. */
export function resolveImage(ref: string): Promise<string> {
  if (!isRef(ref)) return Promise.resolve(ref)
  const hit = urls.get(ref)
  if (hit) return Promise.resolve(hit)
  let p = waiting.get(ref)
  if (!p) {
    p = getImageBlob(ref).then((blob) => {
      waiting.delete(ref)
      if (!blob) return ''
      const url = URL.createObjectURL(blob)
      urls.set(ref, url)
      return url
    })
    waiting.set(ref, p)
  }
  return p
}

/** 컴포넌트에서 쓰는 모양 — 'idb:' 든 'data:' 든 화면에 띄울 주소를 돌려준다 */
export function useImg(value: string | undefined | null): string {
  const v = value ?? ''
  const [url, setUrl] = useState(() => (isRef(v) ? urls.get(v) ?? '' : v))
  useEffect(() => {
    let alive = true
    if (!isRef(v)) {
      setUrl(v)
      return
    }
    void resolveImage(v).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [v])
  return url
}

/* ── 아무도 안 쓰는 사진 치우기 ───────────────────────────── */
/** 상태 안에 들어 있는 'idb:' 를 전부 모은다 */
export function collectRefs(value: unknown, out = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (isRef(value)) out.add(value)
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectRefs(v, out))
  } else if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((v) => collectRefs(v, out))
  }
  return out
}

/**
 * 보관소에 남았지만 어디서도 가리키지 않는 사진을 지운다.
 * 사진을 바꾸다 창을 닫거나, 옮기기가 두 번 돌면 이런 찌꺼기가 생긴다.
 */
export async function pruneImages(inUse: Set<string>): Promise<number> {
  try {
    const keys = ((await run<IDBValidKey[]>('readonly', (s) => s.getAllKeys())) ?? []) as string[]
    const dead = keys.filter((k) => !inUse.has(PREFIX + k))
    if (dead.length) await run('readwrite', (s) => void dead.forEach((k) => s.delete(k)))
    return dead.length
  } catch {
    return 0
  }
}

/* ── 예전 저장본 옮기기 ───────────────────────────────────── */
/**
 * 상태 안의 data: 사진을 전부 보관소로 옮기고 'idb:' 로 바꾼 사본을 돌려준다.
 * 불러온 백업 파일에도 같은 것을 쓴다.
 */
export async function moveInlineImages<T>(value: T): Promise<{ value: T; moved: number }> {
  let moved = 0
  const walk = async (v: unknown): Promise<unknown> => {
    if (typeof v === 'string') {
      if (isInline(v) && v.startsWith('data:image')) {
        moved++
        return putImage(v)
      }
      return v
    }
    if (Array.isArray(v)) return Promise.all(v.map(walk))
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = await walk(val)
      return out
    }
    return v
  }
  return { value: (await walk(value)) as T, moved }
}

/** 내보낼 때 — 'idb:' 사진을 전부 data: 로 풀어낸 사본 */
export async function inlineImages<T>(value: T): Promise<T> {
  const walk = async (v: unknown): Promise<unknown> => {
    if (typeof v === 'string') return isRef(v) ? refToDataUrl(v) : v
    if (Array.isArray(v)) return Promise.all(v.map(walk))
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = await walk(val)
      return out
    }
    return v
  }
  return (await walk(value)) as T
}
