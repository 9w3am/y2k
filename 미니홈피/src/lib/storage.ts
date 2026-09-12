/* ══════════════════════════════════════════════════════════
   저장소 드라이버
   지금은 브라우저에만 저장한다. 나중에 여러 사람이 같이 쓰는
   서비스로 갈 때는 이 파일에서 RemoteDriver 하나만 만들어
   setDriver() 로 갈아끼우면 된다. 나머지 코드는 손대지 않는다.
   ══════════════════════════════════════════════════════════ */

export interface Driver {
  name: string
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => void | Promise<void>
  removeItem: (key: string) => void | Promise<void>
}

export const localDriver: Driver = {
  name: 'local',
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* 용량 초과 — 저장만 건너뛰고 쓰던 건 계속 쓸 수 있게 둔다 */
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      /* 무시 */
    }
  },
}

let current: Driver = localDriver

/**
 * 남의 기록장을 구경하는 동안에는 저장하지 않는다.
 * 막지 않으면 구경만 했는데 내 자료가 남의 것으로 덮어써진다.
 */
let paused = false
export const pauseWrites = (v: boolean) => {
  paused = v
}

export const setDriver = (d: Driver) => {
  current = d
}
export const getDriver = () => current

/** zustand persist 가 그대로 받아 쓰는 모양 */
export const driverStorage = {
  getItem: (key: string) => current.getItem(key),
  setItem: (key: string, value: string) => {
    if (paused) return
    current.setItem(key, value)
  },
  removeItem: (key: string) => current.removeItem(key),
}
