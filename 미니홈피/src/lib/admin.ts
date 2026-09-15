import { useEffect, useState } from 'react'
import { SUPABASE_URL, supabase, useSession } from './supabase'

/* ══════════════════════════════════════════════════════════
   운영자 — 사이트 글 · 회원 · 방명록 · 단짝 · 사진 관리
   권한은 서버가 정한다 (supabase/setup-3-admin.sql 의 is_admin).
   여기서 운영자가 아니라고 나와도, 서버가 막으므로 뚫리지 않는다.
   ══════════════════════════════════════════════════════════ */

export type Result = { ok: true } | { ok: false; msg: string }
type PgErr = { code?: string; message?: string } | null

/** 아직 SQL 을 안 돌렸는지 (표·칸·함수가 없음) */
const missing = (e: PgErr) =>
  !!e &&
  (['42P01', 'PGRST205', 'PGRST202', '42703', '42883', 'PGRST204'].includes(e.code ?? '') ||
    /does not exist|could not find/i.test(e.message ?? ''))
const fail = (e: PgErr, fallback: string): Result => ({
  ok: false,
  msg: missing(e) ? '운영자 설정 SQL 을 먼저 돌려 주세요' : fallback,
})

const ymd = (iso: string, time = true) => {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  const day = `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
  return time ? `${day} ${p(d.getHours())}:${p(d.getMinutes())}` : day
}

/* ── 운영자인지 ─────────────────────────────────────────── */
const adminCache = new Map<string, boolean>()

/** 로그인한 사람이 운영자인지. 확인 전에는 null */
export function useIsAdmin(): boolean | null {
  const { session, ready } = useSession()
  const uid = session?.user.id ?? ''
  const [v, setV] = useState<boolean | null>(() => (uid ? (adminCache.get(uid) ?? null) : null))
  useEffect(() => {
    if (!ready) return
    if (!uid) return setV(false)
    if (adminCache.has(uid)) return setV(adminCache.get(uid)!)
    let alive = true
    setV(null)
    void supabase.rpc('is_admin').then(({ data, error }) => {
      const yes = !error && data === true
      adminCache.set(uid, yes)
      if (alive) setV(yes)
    })
    return () => {
      alive = false
    }
  }, [uid, ready])
  return v
}

/* ── 사이트 글 ───────────────────────────────────────────── */
export type Notice = { title: string; tag: '공지' | '이벤트'; isNew: boolean }
export type SiteText = {
  notices: Notice[]
  marquee: string
  eventTitle: string
  eventBody: string
  popupTitle: string
  popupBody: string
  maintenance: boolean
  maintenanceMsg: string
}

/** 서버에 아직 없을 때 쓰는 글 */
export const SITE_DEFAULT: SiteText = {
  notices: [
    { title: '스킨 6종 신규 입고 안내', tag: '공지', isNew: true },
    { title: '잉크 충전 이벤트 — 글 한 개당 한 방울', tag: '이벤트', isNew: true },
    { title: '정기점검 안내 (매주 화요일 새벽 4시)', tag: '공지', isNew: false },
    { title: '단짝 신청 하루 20명 제한 안내', tag: '공지', isNew: false },
  ],
  marquee: '[공지] 아이로그 정기점검 안내 · 잉크 충전 이벤트 진행 중 · 스킨 6종 신규 입고 · 단짝 신청은 하루 20명까지',
  eventTitle: '잉크 두 배 이벤트',
  eventBody: '오늘 글 쓰면 한 방울 더!',
  popupTitle: '',
  popupBody: '',
  maintenance: false,
  maintenanceMsg: '',
}

let siteText: SiteText = SITE_DEFAULT
/** 4단계 SQL(팝업·점검 칸)이 서버에 있는지 */
let siteFull = true
let siteLoading: Promise<void> | null = null
const siteListeners = new Set<(t: SiteText) => void>()

function setSite(t: SiteText) {
  siteText = t
  siteListeners.forEach((f) => f(t))
}

const BASE_COLS = 'notices,marquee,event_title,event_body'
const MORE_COLS = 'popup_title,popup_body,maintenance,maintenance_msg'

function loadSiteText(): Promise<void> {
  if (siteLoading) return siteLoading
  siteLoading = (async () => {
    let res = await supabase.from('site').select(`${BASE_COLS},${MORE_COLS}`).eq('id', 1).maybeSingle()
    if (res.error && missing(res.error)) {
      siteFull = false
      res = (await supabase.from('site').select(BASE_COLS).eq('id', 1).maybeSingle()) as typeof res
    }
    const r = res.data as Record<string, unknown> | null
    if (res.error || !r) return
    setSite({
      notices: Array.isArray(r.notices) ? (r.notices as Notice[]) : SITE_DEFAULT.notices,
      marquee: String(r.marquee ?? ''),
      eventTitle: String(r.event_title ?? ''),
      eventBody: String(r.event_body ?? ''),
      popupTitle: String(r.popup_title ?? ''),
      popupBody: String(r.popup_body ?? ''),
      maintenance: r.maintenance === true,
      maintenanceMsg: String(r.maintenance_msg ?? ''),
    })
  })()
  return siteLoading
}

export function useSiteText(): SiteText {
  const [t, setT] = useState(siteText)
  useEffect(() => {
    siteListeners.add(setT)
    setT(siteText)
    void loadSiteText()
    return () => {
      siteListeners.delete(setT)
    }
  }, [])
  return t
}

/** 팝업·점검 칸을 쓸 수 있는지 (4단계 SQL) */
export const siteHasMore = () => siteFull

export async function saveSiteText(t: SiteText): Promise<Result> {
  const notices = t.notices.filter((n) => n.title.trim())
  const base = {
    id: 1,
    notices,
    marquee: t.marquee,
    event_title: t.eventTitle,
    event_body: t.eventBody,
    updated_at: new Date().toISOString(),
  }
  const more = {
    popup_title: t.popupTitle,
    popup_body: t.popupBody,
    maintenance: t.maintenance,
    maintenance_msg: t.maintenanceMsg,
  }
  let res = await supabase.from('site').upsert({ ...base, ...more }).select('id')
  let partial = false
  if (res.error && missing(res.error)) {
    partial = true
    res = await supabase.from('site').upsert(base).select('id')
  }
  if (res.error) return fail(res.error, '저장하지 못했습니다')
  if (!res.data?.length) return { ok: false, msg: '운영자만 고칠 수 있습니다' }
  setSite({ ...t, notices })
  if (partial) return { ok: false, msg: '공지는 저장했습니다. 팝업·점검은 SQL 4단계를 돌린 뒤에 저장됩니다' }
  return { ok: true }
}

/* ── 한눈에 ─────────────────────────────────────────────── */
export type AdminStats = {
  homes: number
  hidden: number
  active7: number
  guest: number
  secret: number
  friends: number
  pending: number
  photoOwners: number
}

export async function adminStats(): Promise<AdminStats> {
  const since = new Date(Date.now() - 7 * 864e5).toISOString()
  const n = async (p: PromiseLike<{ count: number | null }>) => (await p).count ?? 0
  const head = { count: 'exact' as const, head: true }
  const [homes, hidden, active7, guest, secret, friends, pending, photos] = await Promise.all([
    n(supabase.from('homes').select('user_id', head)),
    n(supabase.from('homes').select('user_id', head).eq('hidden', true)),
    n(supabase.from('homes').select('user_id', head).gte('updated_at', since)),
    n(supabase.from('guestbook').select('id', head)),
    n(supabase.from('guestbook').select('id', head).eq('secret', true)),
    n(supabase.from('friends').select('id', head).eq('status', 'accepted')),
    n(supabase.from('friends').select('id', head).eq('status', 'pending')),
    supabase.storage.from('photos').list('', { limit: 1000 }),
  ])
  return {
    homes,
    hidden,
    active7,
    guest,
    secret,
    friends,
    pending,
    photoOwners: (photos.data ?? []).filter((f) => !f.id).length,
  }
}

/* ── 회원 기록장 ─────────────────────────────────────────── */
export type AdminHome = { userId: string; handle: string; title: string; updated: string; hidden: boolean }

export async function adminListHomes(): Promise<AdminHome[] | Result> {
  const { data, error } = await supabase
    .from('homes')
    .select('user_id,handle,updated_at,hidden,title:data->me->>homeTitle')
    .order('updated_at', { ascending: false })
    .limit(500)
  if (error) return fail(error, '회원 목록을 불러오지 못했습니다')
  type Row = { user_id: string; handle: string; updated_at: string; hidden: boolean; title: string | null }
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    userId: r.user_id,
    handle: r.handle,
    title: r.title || `${r.handle}의 기록장`,
    updated: ymd(r.updated_at),
    hidden: !!r.hidden,
  }))
}

export async function adminSetHidden(userId: string, hidden: boolean): Promise<Result> {
  const { data, error } = await supabase.from('homes').update({ hidden }).eq('user_id', userId).select('user_id')
  if (error) return fail(error, '바꾸지 못했습니다')
  if (!data?.length) return { ok: false, msg: '운영자만 바꿀 수 있습니다' }
  return { ok: true }
}

/** 기록장을 통째로 지운다 — 그 사람의 방명록·단짝도 같이 사라진다. 계정 자체는 남는다. */
export async function adminDeleteHome(userId: string): Promise<Result> {
  const { data, error } = await supabase.from('homes').delete().eq('user_id', userId).select('user_id')
  if (error) return fail(error, '지우지 못했습니다')
  if (!data?.length) return { ok: false, msg: '운영자만 지울 수 있습니다' }
  return { ok: true }
}

export type HomeData = Record<string, unknown> & {
  me?: Record<string, unknown>
  ink?: number
}
export type AdminHomeDetail = { userId: string; handle: string; hidden: boolean; data: HomeData }

export async function adminGetHome(userId: string): Promise<AdminHomeDetail | Result> {
  const { data, error } = await supabase
    .from('homes')
    .select('user_id,handle,hidden,data')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return fail(error, '기록장을 불러오지 못했습니다')
  if (!data) return { ok: false, msg: '기록장이 없습니다' }
  return {
    userId: data.user_id as string,
    handle: data.handle as string,
    hidden: !!data.hidden,
    data: (data.data ?? {}) as HomeData,
  }
}

/**
 * 기록장 안 내용을 고친다. 고치기 직전 것을 다시 읽어서 바꾸므로 다른 칸은 그대로다.
 * (그 사람이 지금 접속 중이면 그쪽 화면이 저장할 때 덮일 수 있다)
 */
export async function adminPatchHome(userId: string, fn: (d: HomeData) => HomeData): Promise<Result> {
  const cur = await supabase.from('homes').select('data').eq('user_id', userId).maybeSingle()
  if (cur.error) return fail(cur.error, '불러오지 못했습니다')
  if (!cur.data) return { ok: false, msg: '기록장이 없습니다' }
  const next = fn(structuredClone((cur.data.data ?? {}) as HomeData))
  const { data, error } = await supabase
    .from('homes')
    .update({ data: next, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('user_id')
  if (error) return fail(error, '저장하지 못했습니다')
  if (!data?.length) return { ok: false, msg: '운영자만 고칠 수 있습니다' }
  return { ok: true }
}

export async function adminRename(userId: string, handle: string): Promise<Result> {
  const h = handle.trim().toLowerCase()
  if (!/^[a-z0-9_]{3,20}$/.test(h)) return { ok: false, msg: '아이디는 영문 소문자·숫자·_ 3~20자' }
  const { data, error } = await supabase.from('homes').update({ handle: h }).eq('user_id', userId).select('user_id')
  if (error) return error.code === '23505' ? { ok: false, msg: '이미 있는 아이디입니다' } : fail(error, '바꾸지 못했습니다')
  if (!data?.length) return { ok: false, msg: '운영자만 바꿀 수 있습니다' }
  return adminPatchHome(userId, (d) => ({ ...d, me: { ...(d.me ?? {}), nick: h } }))
}

/* ── 올린 사진 파일 ─────────────────────────────────────── */
export type AdminPhoto = { path: string; url: string; size: number; date: string }

export async function adminListPhotos(userId: string): Promise<AdminPhoto[] | Result> {
  const { data, error } = await supabase.storage
    .from('photos')
    .list(userId, { limit: 300, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) return { ok: false, msg: '사진 목록을 불러오지 못했습니다' }
  return (data ?? [])
    .filter((f) => f.id)
    .map((f) => {
      const path = `${userId}/${f.name}`
      return {
        path,
        url: `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`,
        size: Number((f.metadata as { size?: number } | null)?.size ?? 0),
        date: f.created_at ? ymd(f.created_at, false) : '',
      }
    })
}

export async function adminDeletePhoto(path: string): Promise<Result> {
  const { data, error } = await supabase.storage.from('photos').remove([path])
  if (error) return { ok: false, msg: '지우지 못했습니다' }
  if (!data?.length) return { ok: false, msg: '운영자만 지울 수 있습니다' }
  return { ok: true }
}

/* ── 방명록 전체 ─────────────────────────────────────────── */
export type AdminGuest = {
  id: string
  home: string
  writer: string
  body: string
  secret: boolean
  date: string
}

export async function adminListGuest(): Promise<AdminGuest[] | Result> {
  const { data, error } = await supabase
    .from('guestbook')
    .select('id,body,secret,created_at,home:homes!guestbook_home_id_fkey(handle),writer:homes!guestbook_writer_id_fkey(handle)')
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) return fail(error, '방명록을 불러오지 못했습니다')
  type Row = {
    id: string
    body: string
    secret: boolean
    created_at: string
    home: { handle: string } | null
    writer: { handle: string } | null
  }
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    home: r.home?.handle ?? '',
    writer: r.writer?.handle ?? '떠난 사람',
    body: r.body,
    secret: r.secret,
    date: ymd(r.created_at),
  }))
}

export async function adminDeleteGuest(id: string): Promise<Result> {
  const { data, error } = await supabase.from('guestbook').delete().eq('id', id).select('id')
  if (error) return fail(error, '지우지 못했습니다')
  if (!data?.length) return { ok: false, msg: '운영자만 지울 수 있습니다' }
  return { ok: true }
}

/* ── 단짝 전체 ─────────────────────────────────────────── */
export type AdminFriend = { id: string; a: string; b: string; status: 'pending' | 'accepted'; date: string }

export async function adminListFriends(): Promise<AdminFriend[] | Result> {
  const { data, error } = await supabase
    .from('friends')
    .select('id,status,created_at,requester:homes!friends_requester_id_fkey(handle),target:homes!friends_target_id_fkey(handle)')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return fail(error, '단짝 목록을 불러오지 못했습니다')
  type Row = {
    id: string
    status: 'pending' | 'accepted'
    created_at: string
    requester: { handle: string } | null
    target: { handle: string } | null
  }
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    a: r.requester?.handle ?? '',
    b: r.target?.handle ?? '',
    status: r.status,
    date: ymd(r.created_at, false),
  }))
}

export async function adminDeleteFriend(id: string): Promise<Result> {
  const { data, error } = await supabase.from('friends').delete().eq('id', id).select('id')
  if (error) return fail(error, '끊지 못했습니다')
  if (!data?.length) return { ok: false, msg: '운영자만 끊을 수 있습니다' }
  return { ok: true }
}
