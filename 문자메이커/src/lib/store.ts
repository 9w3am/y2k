import { create } from 'zustand'

export type ThemeData = Record<string, string>

const LS = (id: string) => `retro:${id}`

function load(id: string): ThemeData {
  try {
    const raw = localStorage.getItem(LS(id))
    return raw ? (JSON.parse(raw) as ThemeData) : {}
  } catch {
    return {}
  }
}

function save(id: string, data: ThemeData) {
  try {
    localStorage.setItem(LS(id), JSON.stringify(data))
  } catch {
    /* 용량 초과 — 저장만 건너뛰고 편집은 계속된다 */
  }
}

interface Snapshot {
  id: string
  data: ThemeData
}

interface S {
  current: string
  data: Record<string, ThemeData>
  defaults: Record<string, ThemeData>
  past: Snapshot[]
  future: Snapshot[]
  /** 연타 입력을 한 단계로 묶기 위한 마지막 기록 정보 */
  lastMark: { key: string; at: number }

  mount: (id: string, defaults: ThemeData) => void
  get: (key: string) => string
  set: (key: string, value: string) => void
  reset: () => void
  undo: () => void
  redo: () => void
}

export const useStore = create<S>()((setState, getState) => ({
  current: '',
  data: {},
  defaults: {},
  past: [],
  future: [],
  lastMark: { key: '', at: 0 },

  mount: (id, defaults) => {
    const s = getState()
    if (s.current === id && s.data[id]) return
    setState({
      current: id,
      defaults: { ...s.defaults, [id]: defaults },
      data: { ...s.data, [id]: { ...defaults, ...load(id) } },
      past: [],
      future: [],
    })
  },

  get: (key) => {
    const s = getState()
    return s.data[s.current]?.[key] ?? s.defaults[s.current]?.[key] ?? ''
  },

  set: (key, value) => {
    const s = getState()
    const id = s.current
    const cur = s.data[id] ?? {}
    if (cur[key] === value) return

    const now = Date.now()
    const coalesce = s.lastMark.key === key && now - s.lastMark.at < 700
    const past = coalesce ? s.past : [...s.past, { id, data: cur }].slice(-30)

    const next = { ...cur, [key]: value }
    setState({
      data: { ...s.data, [id]: next },
      past,
      future: [],
      lastMark: { key, at: now },
    })
    save(id, next)
  },

  reset: () => {
    const s = getState()
    const id = s.current
    const base = { ...(s.defaults[id] ?? {}) }
    setState({
      data: { ...s.data, [id]: base },
      past: [...s.past, { id, data: s.data[id] ?? {} }].slice(-30),
      future: [],
      lastMark: { key: '', at: 0 },
    })
    save(id, base)
  },

  undo: () => {
    const s = getState()
    const prev = s.past[s.past.length - 1]
    if (!prev || prev.id !== s.current) return
    setState({
      data: { ...s.data, [prev.id]: prev.data },
      past: s.past.slice(0, -1),
      future: [...s.future, { id: s.current, data: s.data[s.current] ?? {} }].slice(-30),
      lastMark: { key: '', at: 0 },
    })
    save(prev.id, prev.data)
  },

  redo: () => {
    const s = getState()
    const nx = s.future[s.future.length - 1]
    if (!nx || nx.id !== s.current) return
    setState({
      data: { ...s.data, [nx.id]: nx.data },
      future: s.future.slice(0, -1),
      past: [...s.past, { id: s.current, data: s.data[s.current] ?? {} }].slice(-30),
      lastMark: { key: '', at: 0 },
    })
    save(nx.id, nx.data)
  },
}))

/** 편집 가능한 값 하나를 구독한다. */
export const useValue = (key: string): string =>
  useStore((s) => s.data[s.current]?.[key] ?? s.defaults[s.current]?.[key] ?? '')

export const useSetValue = () => useStore((s) => s.set)
