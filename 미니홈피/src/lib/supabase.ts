import { createClient, type Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

/* ══════════════════════════════════════════════════════════
   가입·로그인·저장소 연결
   anon 키는 원래 사이트에 그대로 들어가는 공개 키다.
   누가 무엇을 읽고 쓸 수 있는지는 DB 쪽 규칙(RLS, supabase/setup.sql)이 막는다.
   ══════════════════════════════════════════════════════════ */

export const SUPABASE_URL = 'https://zplvyqrtctjmqnzhfczj.supabase.co'
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwbHZ5cXJ0Y3RqbXFuemhmY3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjkwNzgsImV4cCI6MjEwNDkwNTA3OH0._mpBnVKZP7Fib3Vhh2y_oKUPUk9ZQCEJNcsL-iywlP4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // 해시 주소(#/home)를 쓰므로 확인 메일은 ?code= 로 돌아오게 한다
    flowType: 'pkce',
    storageKey: 'ilog:auth',
  },
})

/** 확인 메일·비밀번호 메일이 돌아올 주소 — 지금 사이트의 첫 화면 */
export const siteBase = () => `${location.origin}${location.pathname}`

/* ── 로그인 상태를 여러 곳에서 같이 본다 ─────────────────── */
let session: Session | null = null
let ready = false
const listeners = new Set<(s: Session | null) => void>()
const tell = () => listeners.forEach((f) => f(session))

void supabase.auth.getSession().then(({ data }) => {
  session = data.session
  ready = true
  tell()
  // 확인 메일로 돌아오면 주소에 ?code= 가 남는다 — 정리한다
  if (location.search.includes('code=')) history.replaceState(null, '', siteBase() + location.hash)
})
/* 비밀번호 찾기 메일로 돌아온 참이면 새 비밀번호를 받아야 한다 */
let recovery = false
const recoveryListeners = new Set<(v: boolean) => void>()
export const endRecovery = () => {
  recovery = false
  recoveryListeners.forEach((f) => f(false))
}
export function useRecovery(): boolean {
  const [v, setV] = useState(recovery)
  useEffect(() => {
    recoveryListeners.add(setV)
    setV(recovery)
    return () => {
      recoveryListeners.delete(setV)
    }
  }, [])
  return v
}

supabase.auth.onAuthStateChange((event, s) => {
  session = s
  ready = true
  if (event === 'PASSWORD_RECOVERY') {
    recovery = true
    recoveryListeners.forEach((f) => f(true))
  }
  tell()
})

export const currentSession = () => session
export const currentUser = () => session?.user ?? null

export function onSession(fn: (s: Session | null) => void): () => void {
  listeners.add(fn)
  if (ready) fn(session)
  return () => {
    listeners.delete(fn)
  }
}

export function useSession(): { session: Session | null; ready: boolean } {
  const [s, setS] = useState(session)
  const [r, setR] = useState(ready)
  useEffect(
    () =>
      onSession((next) => {
        setS(next)
        setR(true)
      }),
    [],
  )
  return { session: s, ready: r }
}
