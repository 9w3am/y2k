-- ══════════════════════════════════════════════════════════
--  3단계: 운영자
--  Supabase → SQL Editor → 붙여넣고 Run. 여러 번 돌려도 괜찮다.
--  (1·2단계 setup.sql, setup-2-friends-guestbook.sql 을 먼저 돌린 뒤)
--
--  admins : 운영자 명단. qwer1234 를 운영자로 넣는다.
--  site   : 대문 공지사항 · 위에 흐르는 공지 · 이벤트 칸. 누구나 읽고, 운영자만 고친다.
--  운영자는 서버 규칙으로 — 화면에서만 숨기면 누구나 뚫는다.
--    · 기록장 숨기기(hidden) · 지우기
--    · 방명록 전체 보기(비밀글 포함) · 지우기
--    · 단짝 끊기 · 사진 지우기
-- ══════════════════════════════════════════════════════════

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admins_self" on public.admins;
-- 자기가 운영자인지만 알 수 있다. 명단 전체는 안 보인다.
create policy "admins_self" on public.admins for select using (auth.uid() = user_id);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
grant execute on function public.is_admin() to anon, authenticated;

-- 운영자 지정: qwer1234
insert into public.admins (user_id)
select user_id from public.homes where handle = 'qwer1234'
on conflict (user_id) do nothing;

-- ── 기록장: 숨기기 ────────────────────────────────────────
alter table public.homes add column if not exists hidden boolean not null default false;
drop policy if exists "homes_read" on public.homes;
create policy "homes_read" on public.homes for select
  using (not hidden or auth.uid() = user_id or public.is_admin());
drop policy if exists "homes_admin_update" on public.homes;
create policy "homes_admin_update" on public.homes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "homes_admin_delete" on public.homes;
create policy "homes_admin_delete" on public.homes for delete to authenticated
  using (public.is_admin());

-- ── 방명록: 운영자는 전부 보고 지운다 ───────────────────────
drop policy if exists "guestbook_read" on public.guestbook;
create policy "guestbook_read" on public.guestbook for select
  using (not secret or auth.uid() = home_id or auth.uid() = writer_id or public.is_admin());
drop policy if exists "guestbook_delete" on public.guestbook;
create policy "guestbook_delete" on public.guestbook for delete to authenticated
  using (auth.uid() in (home_id, writer_id) or public.is_admin());

-- ── 단짝: 운영자도 끊을 수 있다 ─────────────────────────────
drop policy if exists "friends_delete" on public.friends;
create policy "friends_delete" on public.friends for delete to authenticated
  using (auth.uid() in (requester_id, target_id) or public.is_admin());

-- ── 사진: 운영자도 지울 수 있다 ─────────────────────────────
drop policy if exists "photos_admin_delete" on storage.objects;
create policy "photos_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_admin());

-- ── 사이트 글 ───────────────────────────────────────────────
create table if not exists public.site (
  id int primary key default 1 check (id = 1),
  notices jsonb not null default '[]'::jsonb,
  marquee text not null default '',
  event_title text not null default '',
  event_body text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.site enable row level security;
drop policy if exists "site_read" on public.site;
drop policy if exists "site_write" on public.site;
drop policy if exists "site_insert" on public.site;
create policy "site_read" on public.site for select using (true);
create policy "site_write" on public.site for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "site_insert" on public.site for insert to authenticated
  with check (public.is_admin());

insert into public.site (id, notices, marquee, event_title, event_body) values (
  1,
  '[{"title":"스킨 6종 신규 입고 안내","tag":"공지","isNew":true},
    {"title":"잉크 충전 이벤트 — 글 한 개당 한 방울","tag":"이벤트","isNew":true},
    {"title":"정기점검 안내 (매주 화요일 새벽 4시)","tag":"공지","isNew":false},
    {"title":"단짝 신청 하루 20명 제한 안내","tag":"공지","isNew":false}]'::jsonb,
  '[공지] 아이로그 정기점검 안내 · 잉크 충전 이벤트 진행 중 · 스킨 6종 신규 입고 · 단짝 신청은 하루 20명까지',
  '잉크 두 배 이벤트',
  '오늘 글 쓰면 한 방울 더!'
) on conflict (id) do nothing;
