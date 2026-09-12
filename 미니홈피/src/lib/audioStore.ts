/* ══════════════════════════════════════════════════════════
   올린 음악 파일 보관소
   노래 파일은 몇 MB 씩 되어서 localStorage 에 들어가지 않는다.
   IndexedDB 에 통째로 넣어두고 열 때 꺼내 쓴다.
   ══════════════════════════════════════════════════════════ */

const DB = 'ilog-audio'
const STORE = 'files'
const KEY = 'bgm'

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

export async function saveAudio(blob: Blob): Promise<void> {
  const db = await open()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function loadAudio(): Promise<Blob | null> {
  try {
    const db = await open()
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(KEY)
      req.onsuccess = () => resolve((req.result as Blob) ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return blob
  } catch {
    return null
  }
}

export async function clearAudio(): Promise<void> {
  try {
    const db = await open()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
    db.close()
  } catch {
    /* 없으면 그만 */
  }
}

/** 유튜브 주소에서 영상 아이디만 뽑는다 */
export function youtubeId(url: string): string | null {
  const s = url.trim()
  if (!s) return null
  const m =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(
      s,
    ) ?? /^([A-Za-z0-9_-]{11})$/.exec(s)
  return m ? m[1] : null
}
