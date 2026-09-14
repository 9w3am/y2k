-- ══════════════════════════════════════════════════════════
--  2단계: 진짜 단짝 · 진짜 비밀 방명록
--  Supabase → SQL Editor → 붙여넣고 Run. 여러 번 돌려도 괜찮다.
--
--  friends   : 단짝 신청·수락. 맺어진 단짝은 누구나 볼 수 있고,
--              아직 수락 전인 신청은 두 사람만 본다.
--  guestbook : 방명록. 기록장 안(homes.data)에서 떼어낸다 — 거기 있으면 공개로 읽힌다.
--              비밀글은 기록장 주인과 쓴 사람만 읽을 수 있다(서버 규칙).
-- ══════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.homes(user_id) on delete cascade,
  target_id uuid not null references public.homes(user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester_id <> target_id)
);
create unique index if not exists friends_pair
  on public.friends (least(requester_id, target_id), greatest(requester_id, target_id));
alter table public.friends enable row level security;
drop policy if exists "friends_read" on public.friends;
drop policy if exists "friends_insert" on public.friends;
drop policy if exists "friends_accept" on public.friends;
drop policy if exists "friends_delete" on public.friends;
create policy "friends_read" on public.friends for select
  using (status = 'accepted' or auth.uid() in (requester_id, target_id));
create policy "friends_insert" on public.friends for insert to authenticated
  with check (auth.uid() = requester_id and status = 'pending');
create policy "friends_accept" on public.friends for update to authenticated
  using (auth.uid() = target_id) with check (auth.uid() = target_id and status = 'accepted');
create policy "friends_delete" on public.friends for delete to authenticated
  using (auth.uid() in (requester_id, target_id));

create table if not exists public.guestbook (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(user_id) on delete cascade,
  writer_id uuid references public.homes(user_id) on delete set null,
  body text not null check (char_length(body) between 1 and 1000),
  secret boolean not null default false,
  reply text check (reply is null or char_length(reply) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists guestbook_home on public.guestbook (home_id, created_at desc);
alter table public.guestbook enable row level security;
drop policy if exists "guestbook_read" on public.guestbook;
drop policy if exists "guestbook_insert" on public.guestbook;
drop policy if exists "guestbook_reply" on public.guestbook;
drop policy if exists "guestbook_delete" on public.guestbook;
create policy "guestbook_read" on public.guestbook for select
  using (not secret or auth.uid() = home_id or auth.uid() = writer_id);
create policy "guestbook_insert" on public.guestbook for insert to authenticated
  with check (auth.uid() = writer_id);
create policy "guestbook_reply" on public.guestbook for update to authenticated
  using (auth.uid() = home_id) with check (auth.uid() = home_id);
create policy "guestbook_delete" on public.guestbook for delete to authenticated
  using (auth.uid() in (home_id, writer_id));
