import { useEffect, useState } from 'react'
import { supabase, useSession } from './supabase'

/* ══════════════════════════════════════════════════════════
   운영자 — 사이트 글 고치기 · 회원 기록장 · 방명록 관리
   권한은 서버가 정한다 (supabase/setup-3-admin.sql 의 is_admin).
   여기서 운영자가 아니라고 나와도, 서버가 막으므로 뚫리지 않는다.
   ══════════════════════════════════════════════════════════ */

export type Result = { ok: true } | { ok: false; msg: string }
type PgErr = { code?: string; message?: string } | null

/** 아직 3단계 SQL 을 안 돌렸는지 (표·칸·함수가 없음) */
const missing = (e: PgErr) =>
  !!e &&
  (['42P01', 'PGRST205', 'PGRST202', '42703', '42883'].includes(e.code ?? '') ||
    /does not exist|could not find/i.test(e.message ?? ''))
const fail = (e: PgErr, fallback: string): Result => ({
  ok: false,
  msg: missing(e) ? '운영자 설정(SQL 3단계)을 먼저 돌려 주세요' : fallback,
})

const ymd = (iso: string) => {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
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

/* ── 사이트 글 (대문 공지 · 흐르는 공지 · 이벤트) ─────────── */
export type Notice = { title: string; tag: '공지' | '이벤트'; isNew: boolean }
export type SiteText = { notices: Notice[]; marquee: string; eventTitle: string; eventBody: string }

/** 서버에 아직 없을 때 쓰는 글 — 예전에 코드에 박혀 있던 것 */
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
}

let siteText: SiteText = SITE_DEFAULT
let siteLoading: Promise<void> | null = null
const siteListeners = new Set<(t: SiteText) => void>()

function setSite(t: SiteText) {
  siteText = t
  siteListeners.forEach((f) => f(t))
}

function loadSiteText(): Promise<void> {
  if (siteLoading) return siteLoading
  siteLoading = (async () => {
    const { data, error } = await supabase
      .from('site')
      .select('notices,marquee,event_title,event_body')
      .eq('id', 1)
      .maybeSingle()
    if (error || !data) return
    setSite({
      notices: Array.isArray(data.notices) ? (data.notices as Notice[]) : SITE_DEFAULT.notices,
      marquee: (data.marquee as string) ?? '',
      eventTitle: (data.event_title as string) ?? '',
      eventBody: (data.event_body as string) ?? '',
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

export async function saveSiteText(t: SiteText): Promise<Result> {
  const row = {
    id: 1,
    notices: t.notices.filter((n) => n.title.trim()),
    marquee: t.marquee,
    event_title: t.eventTitle,
    event_body: t.eventBody,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('site').upsert(row).select('id')
  if (error) return fail(error, '저장하지 못했습니다')
  if (!data?.length) return { ok: false, msg: '운영자만 고칠 수 있습니다' }
  setSite({ ...t, notices: row.notices })
  return { ok: true }
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
    .limit(200)
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
