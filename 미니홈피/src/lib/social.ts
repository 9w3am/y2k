import { useEffect, useState } from 'react'
import { currentUser, supabase } from './supabase'

/* ══════════════════════════════════════════════════════════
   사람과 사람 사이 — 진짜 단짝과 진짜 방명록
   · 단짝은 가입한 사람끼리 신청하고 수락해서 맺는다
   · 방명록은 기록장 안이 아니라 따로 저장한다.
     비밀글은 기록장 주인과 쓴 사람만 읽을 수 있게 서버 규칙이 막는다
     (supabase/setup-2-friends-guestbook.sql)
   ══════════════════════════════════════════════════════════ */

/* ── 지금 화면에 떠 있는 기록장이 누구 것인지 ───────────────
   로그인한 내 기록장이면 나, 남의 기록장을 구경 중이면 그 사람,
   가입 없이 쓰는 중이거나 공유 링크로 보는 중이면 없음(null). */
export type HomeOwner = { id: string; handle: string }

let owner: HomeOwner | null = null
const ownerListeners = new Set<(o: HomeOwner | null) => void>()

export function setHomeOwner(o: HomeOwner | null) {
  if (owner?.id === o?.id && owner?.handle === o?.handle) return
  owner = o
  ownerListeners.forEach((f) => f(o))
}
export const getHomeOwner = () => owner

export function useHomeOwner(): HomeOwner | null {
  const [o, setO] = useState(owner)
  useEffect(() => {
    ownerListeners.add(setO)
    setO(owner)
    return () => {
      ownerListeners.delete(setO)
    }
  }, [])
  return o
}

export type Result = { ok: true } | { ok: false; msg: string }
type PgErr = { code?: string; message?: string } | null

const noTable = (e: PgErr) =>
  !!e &&
  (e.code === '42P01' ||
    e.code === 'PGRST205' ||
    /does not exist|could not find the table/i.test(e.message ?? ''))
const fail = (e: PgErr, fallback: string): Result => ({
  ok: false,
  msg: noTable(e) ? '아직 준비 중입니다' : fallback,
})

const ymd = (iso: string) => {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

type MeLite = { homeTitle?: string; photo?: string } | null
/** 서버 보관함에 있는 사진만 남에게 보여줄 수 있다 */
const photoOf = (m: MeLite) => (m?.photo && /^https?:/.test(m.photo) ? m.photo : '')

/* ── 한 사람 몫 데이터를 여러 화면이 같이 쓰는 칸 ─────────── */
type Slot<T> = {
  data: T
  loading: boolean
  nosetup: boolean
  at: number
  listeners: Set<() => void>
  pending?: Promise<void>
}
function makeSlots<T>(empty: () => T) {
  const map = new Map<string, Slot<T>>()
  return (id: string) => {
    let s = map.get(id)
    if (!s) {
      s = { data: empty(), loading: true, nosetup: false, at: 0, listeners: new Set() }
      map.set(id, s)
    }
    return s
  }
}

function useSlot<T>(
  id: string | null,
  getSlot: (id: string) => Slot<T>,
  fetch: (id: string) => Promise<void>,
  ttl: number,
  empty: T,
) {
  const [, force] = useState(0)
  useEffect(() => {
    if (!id) return
    const s = getSlot(id)
    const fn = () => force((n) => n + 1)
    s.listeners.add(fn)
    if (!s.pending && Date.now() - s.at > ttl) {
      s.pending = fetch(id).finally(() => {
        s.pending = undefined
      })
    }
    return () => {
      s.listeners.delete(fn)
    }
  }, [id, getSlot, fetch, ttl])
  if (!id) return { data: empty, loading: false, nosetup: false, reload: () => {} }
  const s = getSlot(id)
  return { data: s.data, loading: s.loading, nosetup: s.nosetup, reload: () => void fetch(id) }
}

/* ══ 단짝 ════════════════════════════════════════════════ */
export type Friend = {
  /** 신청 한 건의 아이디 */
  id: string
  userId: string
  handle: string
  title: string
  photo: string
  status: 'pending' | 'accepted'
  /** 내가(이 기록장 주인이) 받은 신청인지 */
  incoming: boolean
}

const friendSlot = makeSlots<Friend[]>(() => [])

async function fetchFriends(userId: string): Promise<void> {
  const s = friendSlot(userId)
  const { data, error } = await supabase
    .from('friends')
    .select(
      'id,status,requester_id,target_id,requester:homes!friends_requester_id_fkey(handle,me:data->me),target:homes!friends_target_id_fkey(handle,me:data->me)',
    )
    .or(`requester_id.eq.${userId},target_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  s.loading = false
  s.at = Date.now()
  if (error) {
    s.nosetup = noTable(error)
    s.data = []
  } else {
    type Row = {
      id: string
      status: 'pending' | 'accepted'
      requester_id: string
      target_id: string
      requester: { handle: string; me: MeLite } | null
      target: { handle: string; me: MeLite } | null
    }
    s.nosetup = false
    s.data = ((data ?? []) as unknown as Row[])
      .map((r) => {
        const incoming = r.target_id === userId
        const other = incoming ? r.requester : r.target
        return {
          id: r.id,
          userId: incoming ? r.requester_id : r.target_id,
          handle: other?.handle ?? '',
          title: other?.me?.homeTitle || `${other?.handle ?? ''}의 기록장`,
          photo: photoOf(other?.me ?? null),
          status: r.status,
          incoming,
        }
      })
      .filter((f) => f.handle)
  }
  s.listeners.forEach((f) => f())
}

const refreshFriends = (userId: string) => {
  const s = friendSlot(userId)
  s.at = 0
  void fetchFriends(userId)
}

/** 이 사람의 단짝과(본인이면) 오가는 신청 */
export function useFriends(userId: string | null) {
  const r = useSlot(userId, friendSlot, fetchFriends, 15000, [] as Friend[])
  return { list: r.data, loading: r.loading, nosetup: r.nosetup, reload: r.reload }
}

/** 이 사람의 맺어진 단짝 수 */
export function useFriendCount(userId: string | null) {
  return useFriends(userId).list.filter((f) => f.status === 'accepted').length
}

export async function findHome(handle: string): Promise<HomeOwner | null> {
  const { data } = await supabase
    .from('homes')
    .select('user_id,handle')
    .eq('handle', handle.toLowerCase())
    .maybeSingle()
  return data ? { id: data.user_id as string, handle: data.handle as string } : null
}

export async function requestFriend(handle: string): Promise<Result> {
  const me = currentUser()
  if (!me) return { ok: false, msg: '로그인해 주세요' }
  const target = await findHome(handle)
  if (!target) return { ok: false, msg: '그런 아이디가 없습니다' }
  if (target.id === me.id) return { ok: false, msg: '나와는 단짝을 맺을 수 없어요' }
  const { error } = await supabase.from('friends').insert({ requester_id: me.id, target_id: target.id })
  if (error)
    return error.code === '23505'
      ? { ok: false, msg: '이미 신청했거나 단짝입니다' }
      : fail(error, '신청하지 못했습니다')
  refreshFriends(me.id)
  refreshFriends(target.id)
  return { ok: true }
}

export async function acceptFriend(f: Friend): Promise<Result> {
  const me = currentUser()
  const { error } = await supabase.from('friends').update({ status: 'accepted' }).eq('id', f.id)
  if (error) return fail(error, '수락하지 못했습니다')
  if (me) refreshFriends(me.id)
  refreshFriends(f.userId)
  return { ok: true }
}

export async function removeFriend(f: Friend): Promise<Result> {
  const me = currentUser()
  const { error } = await supabase.from('friends').delete().eq('id', f.id)
  if (error) return fail(error, '처리하지 못했습니다')
  if (me) refreshFriends(me.id)
  refreshFriends(f.userId)
  return { ok: true }
}

/* ══ 방명록 ══════════════════════════════════════════════ */
export type GuestRow = {
  id: string
  writerId: string | null
  writerHandle: string
  body: string
  secret: boolean
  reply: string
  date: string
}

const guestSlot = makeSlots<GuestRow[]>(() => [])

async function fetchGuest(homeId: string): Promise<void> {
  const s = guestSlot(homeId)
  const { data, error } = await supabase
    .from('guestbook')
    .select('id,writer_id,body,secret,reply,created_at,writer:homes!guestbook_writer_id_fkey(handle)')
    .eq('home_id', homeId)
    .order('created_at', { ascending: false })
    .limit(200)
  s.loading = false
  s.at = Date.now()
  if (error) {
    s.nosetup = noTable(error)
    s.data = []
  } else {
    type Row = {
      id: string
      writer_id: string | null
      body: string
      secret: boolean
      reply: string | null
      created_at: string
      writer: { handle: string } | null
    }
    s.nosetup = false
    s.data = ((data ?? []) as unknown as Row[]).map((r) => ({
      id: r.id,
      writerId: r.writer_id,
      writerHandle: r.writer?.handle ?? '',
      body: r.body,
      secret: r.secret,
      reply: r.reply ?? '',
      date: ymd(r.created_at),
    }))
  }
  s.listeners.forEach((f) => f())
}

/**
 * 이 기록장의 방명록.
 * 비밀글은 서버가 주인·쓴 사람에게만 내려준다 — 다른 사람 화면에는 아예 오지 않는다.
 */
export function useGuestbook(homeId: string | null) {
  const r = useSlot(homeId, guestSlot, fetchGuest, 10000, [] as GuestRow[])
  return { rows: r.data, loading: r.loading, nosetup: r.nosetup, reload: r.reload }
}

export async function writeGuest(homeId: string, body: string, secret: boolean): Promise<Result> {
  const me = currentUser()
  if (!me) return { ok: false, msg: '로그인해 주세요' }
  const { error } = await supabase
    .from('guestbook')
    .insert({ home_id: homeId, writer_id: me.id, body, secret })
  if (error) return fail(error, '남기지 못했습니다')
  void fetchGuest(homeId)
  return { ok: true }
}

export async function replyGuest(homeId: string, id: string, reply: string): Promise<Result> {
  const { error } = await supabase.from('guestbook').update({ reply }).eq('id', id)
  if (error) return fail(error, '답글을 달지 못했습니다')
  void fetchGuest(homeId)
  return { ok: true }
}

export async function deleteGuest(homeId: string, id: string): Promise<Result> {
  const { error } = await supabase.from('guestbook').delete().eq('id', id)
  if (error) return fail(error, '지우지 못했습니다')
  void fetchGuest(homeId)
  return { ok: true }
}

/* ══ 요즘 쓰는 기록장 (대문) ════════════════════════════ */
export type HomeCard = { handle: string; title: string; photo: string; updated: string }

/** 불러오기 전에는 null — 빈 목록 문구가 먼저 번쩍 뜨지 않게 */
export function useRecentHomes(limit = 5): HomeCard[] | null {
  const [list, setList] = useState<HomeCard[] | null>(null)
  useEffect(() => {
    let alive = true
    void supabase
      .from('homes')
      .select('handle,updated_at,me:data->me')
      .order('updated_at', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (!alive) return
        if (error || !data) return setList([])
        type Row = { handle: string; updated_at: string; me: MeLite }
        setList(
          (data as unknown as Row[]).map((r) => ({
            handle: r.handle,
            title: r.me?.homeTitle || `${r.handle}의 기록장`,
            photo: photoOf(r.me),
            updated: ymd(r.updated_at).slice(5),
          })),
        )
      })
    return () => {
      alive = false
    }
  }, [limit])
  return list
}
