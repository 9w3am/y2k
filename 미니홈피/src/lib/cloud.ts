import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { currentUser, onSession, siteBase, supabase } from './supabase'
import { useSite } from './store'
import { getImageBlob, isInline, isRef, uploadBlob } from './imageStore'
import { setHomeOwner } from './social'

/* ══════════════════════════════════════════════════════════
   계정과 기록장 저장
   · 가입·로그인·로그아웃·비밀번호 찾기
   · 로그인하면 내 기록장을 서버에서 불러오고, 고칠 때마다 알아서 저장한다
   · 처음 로그인이면 이 브라우저에서 쓰던 기록장·사진을 계정으로 올린다
   · 로그아웃하면 이 브라우저는 로그인 전 상태로 돌아간다
   · 남의 아이디로 그 사람 기록장을 구경한다
   ══════════════════════════════════════════════════════════ */

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/
export type SyncStatus = 'off' | 'loading' | 'saving' | 'saved' | 'error' | 'nosetup'

/* ── 저장 상태 — 윗줄·로그인 칸이 같이 본다 ─────────────── */
let status: SyncStatus = 'off'
const statusListeners = new Set<(s: SyncStatus) => void>()
const setStatus = (s: SyncStatus) => {
  status = s
  statusListeners.forEach((f) => f(s))
}
export function useSyncStatus(): SyncStatus {
  const [s, setS] = useState(status)
  useEffect(() => {
    statusListeners.add(setS)
    setS(status)
    return () => {
      statusListeners.delete(setS)
    }
  }, [])
  return s
}

type Result = { ok: true } | { ok: false; msg: string }

/** 서버가 돌려준 영어 오류를 알아듣게 */
function ko(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return '이메일이나 비밀번호가 맞지 않습니다'
  if (m.includes('email not confirmed')) return '확인 메일의 링크를 먼저 눌러 주세요'
  if (m.includes('already registered') || m.includes('already been registered'))
    return '이미 가입한 이메일입니다'
  if (m.includes('password should be at least') || m.includes('password is too short'))
    return '비밀번호는 6자 이상이어야 합니다'
  if (m.includes('same as the old') || m.includes('different from the old'))
    return '예전과 다른 비밀번호를 써 주세요'
  if (m.includes('invalid email') || m.includes('unable to validate email'))
    return '이메일 주소를 확인해 주세요'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes'))
    return '너무 자주 시도했습니다. 잠시 후 다시 해 주세요'
  if (m.includes('failed to fetch') || m.includes('network')) return '인터넷 연결을 확인해 주세요'
  return `처리하지 못했습니다 (${message})`
}

type PgErr = { code?: string; message?: string } | null
/** 서버에 표가 아직 없음 — setup.sql 을 안 돌린 상태 */
const noTable = (e: PgErr) =>
  !!e &&
  (e.code === '42P01' ||
    e.code === 'PGRST205' ||
    /does not exist|could not find the table/i.test(e.message ?? ''))

/* ── 가입·로그인 ─────────────────────────────────────────── */
export async function signUp(
  email: string,
  password: string,
  handle: string,
): Promise<{ ok: true; confirm: boolean } | { ok: false; msg: string }> {
  if (!HANDLE_RE.test(handle)) return { ok: false, msg: '아이디는 영어 소문자·숫자·_ 로 3~20자입니다' }
  if (password.length < 6) return { ok: false, msg: '비밀번호는 6자 이상이어야 합니다' }

  const { data: taken, error: takenErr } = await supabase
    .from('homes')
    .select('handle')
    .eq('handle', handle)
    .maybeSingle()
  if (!takenErr && taken) return { ok: false, msg: '이미 쓰는 아이디입니다' }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: siteBase(), data: { handle } },
  })
  if (error) return { ok: false, msg: ko(error.message) }
  // 이미 가입한 이메일이면 오류 대신 빈 계정 정보가 돌아온다
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
    return { ok: false, msg: '이미 가입한 이메일입니다' }
  return { ok: true, confirm: !data.session }
}

export async function signIn(email: string, password: string): Promise<Result> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? { ok: false, msg: ko(error.message) } : { ok: true }
}

export async function sendReset(email: string): Promise<Result> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: siteBase() })
  return error ? { ok: false, msg: ko(error.message) } : { ok: true }
}

export async function setNewPassword(password: string): Promise<Result> {
  if (password.length < 6) return { ok: false, msg: '비밀번호는 6자 이상이어야 합니다' }
  const { error } = await supabase.auth.updateUser({ password })
  return error ? { ok: false, msg: ko(error.message) } : { ok: true }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

/* ── 기록장 저장 ─────────────────────────────────────────── */
const LOCAL = 'ilog:v1'
/** 이 브라우저의 기록장이 어느 계정 것인지 */
const OWNER = 'ilog:owner'
/** 서버에 아직 못 올린 고침이 있는 계정 */
const DIRTY = 'ilog:dirty'
/** 로그인 전에 이 브라우저에서 쓰던 기록장 — 로그아웃하면 되돌린다 */
const BEFORE = 'ilog:before-login'

const ls = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* 못 적어도 서버 저장은 된다 */
    }
  },
  del: (k: string) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* 무시 */
    }
  },
}

/**
 * 기록장 안에 넣으면 안 되는 것.
 * 기록장(homes.data)은 구경 온 사람 누구나 읽는다 —
 * 방명록(비밀글 포함)과 예전 가짜 단짝은 여기 들어가면 안 된다. 따로 저장한다.
 */
const LOCAL_ONLY = new Set(['viewing', 'guest', 'jjak'])

/** 서버에 올릴 몫 */
function snapshot(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(useSite.getState()))
    if (typeof v !== 'function' && !LOCAL_ONLY.has(k)) out[k] = v
  return out
}

/** 남의 기록장(아이디 주소·공유 링크)을 구경하는 중인지 */
function isVisiting(): boolean {
  if (useSite.getState().viewing) return true
  try {
    return !!sessionStorage.getItem('ilog:visit') || !!sessionStorage.getItem('ilog:share')
  } catch {
    return false
  }
}

/** 이 브라우저에만 있는 사진('idb:', data:)을 사진 보관함에 올리고 주소로 바꾼다 */
async function toRemote<T>(value: T, uid: string): Promise<T> {
  const walk = async (v: unknown): Promise<unknown> => {
    if (typeof v === 'string') {
      try {
        if (isRef(v)) {
          const blob = await getImageBlob(v)
          return blob ? await uploadBlob(uid, blob) : ''
        }
        if (isInline(v) && v.startsWith('data:image'))
          return await uploadBlob(uid, await (await fetch(v)).blob())
      } catch {
        return v
      }
      return v
    }
    if (Array.isArray(v)) return Promise.all(v.map(walk))
    if (v && typeof v === 'object') {
      const o: Record<string, unknown> = {}
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = await walk(x)
      return o
    }
    return v
  }
  return (await walk(value)) as T
}

const handleFor = (user: User) => {
  const h = String(user.user_metadata?.handle ?? '').toLowerCase()
  return HANDLE_RE.test(h) ? h : `user_${user.id.replace(/-/g, '').slice(0, 8)}`
}

let activeUid = ''
let unsub: (() => void) | null = null
let timer = 0
let saving = false

async function save(): Promise<void> {
  const u = currentUser()
  if (!u || u.id !== activeUid || useSite.getState().viewing) return
  if (saving) return schedule()
  saving = true
  const { error } = await supabase
    .from('homes')
    .update({ data: snapshot(), updated_at: new Date().toISOString() })
    .eq('user_id', u.id)
  saving = false
  if (error) return setStatus(noTable(error) ? 'nosetup' : 'error')
  ls.del(DIRTY)
  setStatus('saved')
}

function schedule() {
  window.clearTimeout(timer)
  ls.set(DIRTY, activeUid)
  setStatus('saving')
  // 글자를 치는 동안 매번 보내지 않게 조금 모았다가 한 번에
  timer = window.setTimeout(() => void save(), 1200)
}

async function attach(user: User) {
  if (activeUid === user.id) return
  detach()
  activeUid = user.id
  // 남의 기록장을 구경하는 중이면 내 것을 불러와 덮어씌우지 않는다.
  // '내 기록장으로'를 누르면 새로 열리면서 다시 붙는다.
  if (isVisiting()) return setStatus('off')
  setStatus('loading')

  const { data: row, error } = await supabase
    .from('homes')
    .select('handle,data')
    .eq('user_id', user.id)
    .maybeSingle()
  if (activeUid !== user.id) return
  if (error) return setStatus(noTable(error) ? 'nosetup' : 'error')
  // 불러오는 사이 구경이 시작됐으면 손대지 않는다
  if (isVisiting()) return setStatus('off')

  const owner = ls.get(OWNER)
  if (row) {
    if (owner === user.id && ls.get(DIRTY) === user.id) {
      // 이 기기에서 고쳐놓고 못 올린 것이 있다 — 그걸 올린다
      await save()
    } else {
      if (owner !== user.id && !ls.get(BEFORE)) ls.set(BEFORE, ls.get(LOCAL) ?? '')
      const d = (row.data ?? {}) as Record<string, unknown>
      const me = { ...useSite.getState().me, ...((d.me as object) ?? {}), nick: row.handle }
      useSite.setState({ ...d, me, viewing: false } as never)
    }
  } else {
    // 처음 로그인 — 이 브라우저에서 쓰던 기록장을 계정의 첫 기록장으로
    let handle = handleFor(user)
    const remote = await toRemote(snapshot(), user.id)
    const withNick = () => ({ ...remote, me: { ...(remote.me as object), nick: handle } })
    let { error: insErr } = await supabase
      .from('homes')
      .insert({ user_id: user.id, handle, data: withNick() })
    if (insErr?.code === '23505') {
      // 가입과 첫 로그인 사이에 누가 같은 아이디를 먼저 가져갔다
      handle = `${handle.slice(0, 16)}_${Math.floor(Math.random() * 900 + 100)}`
      ;({ error: insErr } = await supabase
        .from('homes')
        .insert({ user_id: user.id, handle, data: withNick() }))
    }
    if (activeUid !== user.id) return
    if (insErr) return setStatus(noTable(insErr) ? 'nosetup' : 'error')
    useSite.setState({ ...withNick(), viewing: false } as never)
  }

  ls.set(OWNER, user.id)
  ls.del(DIRTY)
  // 지금 떠 있는 기록장은 내 것 — 방명록·단짝을 내 계정 기준으로
  setHomeOwner({ id: user.id, handle: useSite.getState().me.nick })
  setStatus('saved')
  unsub = useSite.subscribe((s) => {
    if (!s.viewing) schedule()
  })
}

function detach() {
  unsub?.()
  unsub = null
  window.clearTimeout(timer)
  activeUid = ''
  setHomeOwner(null)
}

/** 로그아웃 — 계정 기록장을 이 브라우저에서 치우고 로그인 전 것으로 돌린다 */
function restoreGuest() {
  const before = ls.get(BEFORE)
  if (before) ls.set(LOCAL, before)
  else ls.del(LOCAL)
  ls.del(BEFORE)
  ls.del(OWNER)
  ls.del(DIRTY)
  location.hash = '#/'
  location.reload()
}

let started = false
export function startCloudSync() {
  if (started) return
  started = true
  onSession((s) => {
    if (s?.user) {
      void attach(s.user)
      return
    }
    if (activeUid || ls.get(OWNER)) {
      detach()
      setStatus('off')
      restoreGuest()
      return
    }
    setStatus('off')
  })
}

/* ── 남의 기록장 구경 ────────────────────────────────────── */
export async function fetchHomeByHandle(
  handle: string,
): Promise<{ id: string; handle: string; data: Record<string, unknown> } | null | 'nosetup'> {
  const { data, error } = await supabase
    .from('homes')
    .select('user_id,handle,data')
    .eq('handle', handle)
    .maybeSingle()
  if (error) return noTable(error) ? 'nosetup' : null
  if (!data) return null
  const d = { ...(data.data as Record<string, unknown>) }
  // 보는 사람 기기 설정은 그 사람 것을 따르지 않는다
  delete d.shell
  delete d.volume
  // 예전 저장본에 남은 방명록·가짜 단짝은 쓰지 않는다 — 진짜는 따로 불러온다
  delete d.guest
  delete d.jjak
  d.me = { ...((d.me as object) ?? {}), nick: data.handle }
  return { id: data.user_id as string, handle: data.handle as string, data: d }
}
