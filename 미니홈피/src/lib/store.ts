import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { driverStorage } from './storage'
import { TRACKS } from './bgm'
import type { BorderKey, FontKey, PatternKey } from './deco'

/* ══════════════════════════════════════════════════════════
   아이로그 iLOG — 오늘의 나를 기록하는 곳
   화폐 잉크 · 관계 단짝 · 순회 로그타기 · 꾸미기 내방
   ══════════════════════════════════════════════════════════ */

export interface Comment {
  id: string
  nick: string
  body: string
  date: string
}

export interface Post {
  id: string
  title: string
  body: string
  date: string
  mood: string
  weather: string
  /** 카테고리 — 비어 있으면 '전체'에서만 보인다 */
  category?: string
  /** 글 안에 넣은 사진 ('idb:' 또는 data:) */
  images?: string[]
  likes?: number
  comments?: Comment[]
}

export interface GuestEntry {
  id: string
  nick: string
  body: string
  date: string
  secret: boolean
  reply?: string
}

export interface Pic {
  id: string
  src: string
  cap: string
  date: string
}

export interface Jjak {
  id: string
  nick: string
  title: string
  hue: string
  memo: string
  /** 단짝네 기록장 글 — 비어 있으면 견본 글을 보여준다 */
  posts?: { id: string; title: string; date: string }[]
  today?: number
  total?: number
}

export interface Skin {
  id: string
  name: string
  price: number
  desc: string
}

export const SKINS: Skin[] = [
  { id: 'sky', name: '맑은 하늘', price: 0, desc: '아이로그 기본 스킨' },
  { id: 'pink', name: '벚꽃 흩날리는', price: 0, desc: '봄에만 쓰기 아까운 분홍' },
  { id: 'lemon', name: '레몬사탕', price: 3, desc: '노랗고 시고 달다' },
  { id: 'grid', name: '체크노트', price: 3, desc: '모눈종이 위에 쓰는 하루' },
  { id: 'night', name: '밤하늘 별자리', price: 5, desc: '새벽 세시에 어울리는' },
  { id: 'mint', name: '민트초코', price: 8, desc: '민트 반 초코 반' },
]

export const MOODS = ['^ㅡ^', 'ㅠ_ㅠ', '-_-+', '*^^*', '>_<', '^0^', 'ㅇ_ㅇ', 'ㅡ,.ㅡ']
export const WEATHERS = ['맑음', '흐림', '비', '눈', '바람', '안개']

export const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}
export const uid = () => Math.random().toString(36).slice(2, 10)

/** 프로필에 직접 만들어 넣는 줄. 무엇을 적을지는 쓰는 사람이 정한다. */
export interface Field {
  id: string
  label: string
  value: string
}

/** 세로 탭 한 칸. 이름을 바꾸거나 끌 수 있다. */
export interface TabCfg {
  id: string
  label: string
  on: boolean
}

/** 스킨 프리셋 대신 직접 고른 꾸밈새 */
export interface Custom {
  on: boolean
  bgColor: string
  bgImage: string
  /** tile = 무늬처럼 반복 · cover = 꽉 채우기 */
  bgFit: 'tile' | 'cover'
  bgSize: number
  accent: string
  accent2: string
  paper: string
  /** 글자색 */
  ink: string
  /** 테두리·점선색 */
  line: string
  /** 프로필 칸·탭 바탕색 */
  tab: string
  border: BorderKey
  /** 모서리 둥글기(px) */
  round: number
  titleFont: FontKey
  bodyFont: FontKey
  /** 그림을 안 깔았을 때 바탕 무늬 */
  pattern: PatternKey
}

export type PostKind = 'diary' | 'board' | 'paper'

interface Me {
  nick: string
  name: string
  gender: string
  birth: string
  intro: string
  motto: string
  photo: string
  room: string
  homeTitle: string
}

interface State {
  me: Me
  fields: Field[]
  tabs: TabCfg[]
  diary: Post[]
  board: Post[]
  paper: Post[]
  guest: GuestEntry[]
  photo: Pic[]
  jjak: Jjak[]

  skin: string
  owned: string[]
  custom: Custom
  ink: number
  /** 출석 도장을 마지막으로 찍은 날 — 하루 한 번만 받게 */
  stampDate: string

  songId: string
  playing: boolean
  volume: number
  /** 무엇으로 소리를 낼지 — 내장곡 / 내 파일 / 유튜브 */
  bgmKind: 'builtin' | 'file' | 'youtube'
  fileName: string
  ytUrl: string
  ytTitle: string

  todayCount: number
  totalCount: number
  visitDate: string

  /** 'web' = 2000년대 웹사이트 · 'app' = 설치 프로그램 창 */
  shell: 'web' | 'app'
  /** 공유 주소로 들어와 구경만 하는 중인지 */
  viewing: boolean

  setMe: (patch: Partial<Me>) => void
  addField: () => void
  setField: (id: string, patch: Partial<Field>) => void
  delField: (id: string) => void
  moveField: (id: string, dir: -1 | 1) => void
  setTab: (id: string, patch: Partial<TabCfg>) => void
  moveTab: (id: string, dir: -1 | 1) => void
  addPost: (kind: PostKind, p: Omit<Post, 'id' | 'date'>) => void
  editPost: (kind: PostKind, id: string, patch: Partial<Post>) => void
  delPost: (kind: PostKind, id: string) => void
  likePost: (kind: PostKind, id: string, delta: 1 | -1) => void
  addComment: (kind: PostKind, id: string, nick: string, body: string) => void
  delComment: (kind: PostKind, id: string, commentId: string) => void
  addGuest: (nick: string, body: string, secret: boolean) => void
  replyGuest: (id: string, reply: string) => void
  delGuest: (id: string) => void
  addPic: (src: string, cap: string) => void
  setPic: (id: string, patch: Partial<Pic>) => void
  delPic: (id: string) => void
  setSkin: (id: string) => void
  setCustom: (patch: Partial<Custom>) => void
  buySkin: (id: string) => 'ok' | 'poor' | 'owned'
  setSong: (id: string) => void
  setBgmKind: (k: 'builtin' | 'file' | 'youtube') => void
  setFileName: (n: string) => void
  setYt: (url: string, title: string) => void
  togglePlay: () => void
  setVolume: (v: number) => void
  addJjak: () => void
  setJjak: (id: string, patch: Partial<Jjak>) => void
  delJjak: (id: string) => void
  /** TODAY·TOTAL 을 손으로 고친다 */
  setCount: (patch: { todayCount?: number; totalCount?: number }) => void
  addInk: (n: number) => void
  /** 오늘 도장을 찍어 준다. 이미 찍었으면 'done' */
  stamp: () => 'ok' | 'done'
  setShell: (s: 'web' | 'app') => void
  loadShared: (data: Partial<State>) => void
  countVisit: () => void
  resetAll: () => void
}

const seedDiary: Post[] = [
  {
    id: 'd1',
    title: '첫 번째 글',
    body: '글쓰기를 누르면 새 글이 올라갑니다.',
    date: today(),
    mood: '^ㅡ^',
    weather: '맑음',
  },
  {
    id: 'd2',
    title: '두 번째 글',
    body: '기분과 날씨는 글 쓸 때 고를 수 있습니다.',
    date: today(),
    mood: '*^^*',
    weather: '흐림',
  },
]

const seedGuest: GuestEntry[] = [
  {
    id: 'g1',
    nick: '방문자 1',
    body: '방명록 견본입니다. 위 칸에 적고 남기기를 누르면 새 글이 붙습니다.',
    date: today(),
    secret: false,
    reply: '답글도 이렇게 달립니다.',
  },
  {
    id: 'g2',
    nick: '방문자 2',
    body: '비밀글로 남기면 내용이 가려집니다.',
    date: today(),
    secret: false,
  },
]

/** 새 단짝에게 돌아가며 주는 색 */
const JJAK_HUES = ['#ff9dbe', '#7ec4ee', '#9fe0cc', '#ffd97a', '#c9a8ff', '#ffb0a8']

const seedJjak: Jjak[] = [
  { id: 'j1', nick: '단짝 1', title: '단짝 1의 기록장', hue: '#ff9dbe', memo: '견본 단짝' },
  { id: 'j2', nick: '단짝 2', title: '단짝 2의 기록장', hue: '#7ec4ee', memo: '견본 단짝' },
  { id: 'j3', nick: '단짝 3', title: '단짝 3의 기록장', hue: '#9fe0cc', memo: '견본 단짝' },
  { id: 'j4', nick: '단짝 4', title: '단짝 4의 기록장', hue: '#ffd97a', memo: '견본 단짝' },
  { id: 'j5', nick: '단짝 5', title: '단짝 5의 기록장', hue: '#c9a8ff', memo: '견본 단짝' },
  { id: 'j6', nick: '단짝 6', title: '단짝 6의 기록장', hue: '#ffb0a8', memo: '견본 단짝' },
]

const seedFields: Field[] = [
  { id: 'f1', label: '나이', value: '' },
  { id: 'f2', label: '키', value: '' },
  { id: 'f3', label: '성격', value: '' },
  { id: 'f4', label: '좋아하는 것', value: '' },
  { id: 'f5', label: '한마디', value: '' },
]

const seedTabs: TabCfg[] = [
  { id: 'home', label: '홈', on: true },
  { id: 'profile', label: '프로필', on: true },
  { id: 'diary', label: '다이어리', on: true },
  { id: 'photo', label: '사진첩', on: true },
  { id: 'board', label: '게시판', on: true },
  { id: 'paper', label: '페이퍼', on: true },
  { id: 'guest', label: '방명록', on: true },
]

const initial = {
  fields: seedFields,
  tabs: seedTabs,
  me: {
    nick: 'myid',
    name: '이름',
    gender: '♀',
    birth: '00.00.00',
    intro:
      '여기에 자기소개를 씁니다.\n화면의 글자는 눌러서 바로 고칠 수 있어요.\n사진칸을 누르면 사진이 들어갑니다.',
    motto: '오늘 기분 한 줄',
    photo: '',
    room: '',
    homeTitle: '내 기록장',
  },
  diary: seedDiary,
  board: [] as Post[],
  paper: [] as Post[],
  guest: seedGuest,
  photo: [] as Pic[],
  jjak: seedJjak,
  skin: 'sky',
  custom: {
    on: false,
    bgColor: '#bfe4fa',
    bgImage: '',
    bgFit: 'tile' as const,
    bgSize: 46,
    accent: '#3f9ede',
    accent2: '#7ec4ee',
    paper: '#ffffff',
    ink: '#3a444f',
    line: '#a5d2ec',
    tab: '#f0f9fe',
    border: 'dotted' as const,
    round: 12,
    titleFont: 'pen' as const,
    bodyFont: 'dotum' as const,
    pattern: 'heart' as const,
  },
  owned: ['sky', 'pink'],
  ink: 12,
  songId: TRACKS[0].id,
  bgmKind: 'builtin' as const,
  fileName: '',
  ytUrl: '',
  ytTitle: '',
  playing: true,
  volume: 60,
  todayCount: 0,
  totalCount: 20010605,
  visitDate: '',
  stampDate: '',
  shell: 'web' as const,
  viewing: false,
}

export const useSite = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      setMe: (patch) => set((s) => ({ me: { ...s.me, ...patch } })),

      /* ── 프로필 줄은 쓰는 사람이 직접 만든다 ─────────────── */
      addField: () =>
        set((s) => ({ fields: [...s.fields, { id: uid(), label: '새 항목', value: '' }] })),

      setField: (id, patch) =>
        set((s) => ({ fields: s.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),

      delField: (id) => set((s) => ({ fields: s.fields.filter((f) => f.id !== id) })),

      moveField: (id, dir) =>
        set((s) => {
          const i = s.fields.findIndex((f) => f.id === id)
          const j = i + dir
          if (i < 0 || j < 0 || j >= s.fields.length) return {}
          const next = [...s.fields]
          ;[next[i], next[j]] = [next[j], next[i]]
          return { fields: next }
        }),

      /* ── 탭도 이름을 바꾸고 끌 수 있다 ───────────────────── */
      setTab: (id, patch) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      moveTab: (id, dir) =>
        set((s) => {
          const i = s.tabs.findIndex((t) => t.id === id)
          const j = i + dir
          if (i < 0 || j < 0 || j >= s.tabs.length) return {}
          const next = [...s.tabs]
          ;[next[i], next[j]] = [next[j], next[i]]
          return { tabs: next }
        }),

      addPost: (kind, p) =>
        set((s) => ({ [kind]: [{ ...p, id: uid(), date: today() }, ...s[kind]] }) as Partial<State>),

      /** 이미 올린 글을 고친다 — 날짜는 그대로 둔다 */
      editPost: (kind, id, patch) =>
        set(
          (s) =>
            ({ [kind]: s[kind].map((x) => (x.id === id ? { ...x, ...patch } : x)) }) as Partial<State>,
        ),

      delPost: (kind, id) =>
        set((s) => ({ [kind]: s[kind].filter((x) => x.id !== id) }) as Partial<State>),

      addGuest: (nick, body, secret) =>
        set((s) => ({ guest: [{ id: uid(), nick, body, secret, date: today() }, ...s.guest] })),

      replyGuest: (id, reply) =>
        set((s) => ({ guest: s.guest.map((g) => (g.id === id ? { ...g, reply } : g)) })),

      delGuest: (id) => set((s) => ({ guest: s.guest.filter((g) => g.id !== id) })),

      addPic: (src, cap) =>
        set((s) => ({ photo: [{ id: uid(), src, cap, date: today() }, ...s.photo] })),

      setPic: (id, patch) =>
        set((s) => ({ photo: s.photo.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      delPic: (id) => set((s) => ({ photo: s.photo.filter((p) => p.id !== id) })),

      setSkin: (id) => {
        // 프리셋을 고르면 직접 꾸민 것은 잠시 물러난다
        if (get().owned.includes(id)) set((s) => ({ skin: id, custom: { ...s.custom, on: false } }))
      },

      setCustom: (patch) => set((s) => ({ custom: { ...s.custom, ...patch } })),

      buySkin: (id) => {
        const s = get()
        if (s.owned.includes(id)) return 'owned'
        const skin = SKINS.find((x) => x.id === id)
        if (!skin || s.ink < skin.price) return 'poor'
        set({ ink: s.ink - skin.price, owned: [...s.owned, id], skin: id })
        return 'ok'
      },

      setSong: (id) => set({ songId: id, playing: true }),
      setBgmKind: (bgmKind) => set({ bgmKind }),
      setFileName: (fileName) => set({ fileName }),
      setYt: (ytUrl, ytTitle) => set({ ytUrl, ytTitle }),
      togglePlay: () => set((s) => ({ playing: !s.playing })),
      setVolume: (volume) => set({ volume }),
      likePost: (kind, id, delta) =>
        set(
          (s) =>
            ({
              [kind]: s[kind].map((p) =>
                p.id === id ? { ...p, likes: Math.max(0, (p.likes ?? 0) + delta) } : p,
              ),
            }) as Partial<State>,
        ),
      addComment: (kind, id, nick, body) =>
        set(
          (s) =>
            ({
              [kind]: s[kind].map((p) =>
                p.id === id
                  ? { ...p, comments: [...(p.comments ?? []), { id: uid(), nick, body, date: today() }] }
                  : p,
              ),
            }) as Partial<State>,
        ),
      delComment: (kind, id, commentId) =>
        set(
          (s) =>
            ({
              [kind]: s[kind].map((p) =>
                p.id === id
                  ? { ...p, comments: (p.comments ?? []).filter((c) => c.id !== commentId) }
                  : p,
              ),
            }) as Partial<State>,
        ),

      addJjak: () =>
        set((s) => ({
          jjak: [
            ...s.jjak,
            {
              id: uid(),
              nick: `단짝 ${s.jjak.length + 1}`,
              title: `단짝 ${s.jjak.length + 1}의 기록장`,
              hue: JJAK_HUES[s.jjak.length % JJAK_HUES.length],
              memo: '',
            },
          ],
        })),
      setJjak: (id, patch) =>
        set((s) => ({ jjak: s.jjak.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
      delJjak: (id) => set((s) => ({ jjak: s.jjak.filter((j) => j.id !== id) })),

      setCount: (patch) =>
        set((s) => ({
          todayCount: Math.max(0, Math.round(patch.todayCount ?? s.todayCount)),
          totalCount: Math.max(0, Math.round(patch.totalCount ?? s.totalCount)),
        })),

      addInk: (n) => set((s) => ({ ink: Math.max(0, s.ink + n) })),

      stamp: () => {
        const d = today()
        if (get().stampDate === d) return 'done'
        set((s) => ({ stampDate: d, ink: s.ink + 1 }))
        return 'ok'
      },
      setShell: (shell) => set({ shell }),

      /** 공유 주소로 들어왔을 때 — 남의 내용을 얹고 구경 모드로 */
      loadShared: (data) => set({ ...data, viewing: true }),

      /* 날짜가 바뀌면 TODAY 는 1부터 다시 센다 */
      countVisit: () => {
        const s = get()
        const d = today()
        set(
          s.visitDate === d
            ? { todayCount: s.todayCount + 1, totalCount: s.totalCount + 1 }
            : { visitDate: d, todayCount: 1, totalCount: s.totalCount + 1 },
        )
      },

      resetAll: () => set({ ...initial, visitDate: '' }),
    }),
    {
      name: 'ilog:v1',
      storage: createJSONStorage(() => driverStorage),
      // 구경 모드는 저장하지 않는다 — 저장되면 다음 방문에 갇힌다
      partialize: ({ viewing: _viewing, ...rest }) => rest as State,
      // 저장본에 새로 생긴 꾸밈 칸이 없으면 기본값으로 채운다.
      // 기본 합치기는 얕아서 custom 이 통째로 덮이며 새 칸이 사라진다.
      merge: (saved, current) => {
        const s = (saved ?? {}) as Partial<State>
        return { ...current, ...s, custom: { ...current.custom, ...(s.custom ?? {}) } }
      },
    },
  ),
)

/*
   단짝의 방문 숫자 — 한 번도 안 고친 단짝은 이름에서 뽑은 견본 숫자를 쓴다.
   대문 순위표와 단짝네 기록장이 같은 숫자를 보이도록 한 군데에 둔다.
*/
const jjakSeed = (id: string) => [...id].reduce((n, c) => n + c.charCodeAt(0), 0)
export const jjakToday = (j: Jjak) => j.today ?? (jjakSeed(j.id) % 90) + 3
export const jjakTotal = (j: Jjak) => j.total ?? jjakSeed(j.id) * 137
