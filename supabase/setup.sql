-- ══════════════════════════════════════════════════════════
--  아이로그: 사람마다 기록장·사진 따로 저장
--  Supabase 대시보드 → SQL Editor → 붙여넣고 Run. 여러 번 돌려도 괜찮다.
--
--  homes  : 한 사람당 한 줄. data 에 기록장 전체(글·사진 주소·꾸밈·노래 설정)를 담는다.
--           누구나 읽을 수 있다(남의 기록장 구경). 쓰기·고치기·지우기는 본인만.
--  photos : 사진 보관함. 누구나 볼 수 있고, 올리기·지우기는 자기 폴더(아이디)에만.
-- ══════════════════════════════════════════════════════════

create table if not exists public.homes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_]{3,20}$'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.homes enable row level security;
drop policy if exists "homes_read" on public.homes;
drop policy if exists "homes_insert" on public.homes;
drop policy if exists "homes_update" on public.homes;
drop policy if exists "homes_delete" on public.homes;
create policy "homes_read" on public.homes for select using (true);
create policy "homes_insert" on public.homes for insert with check (auth.uid() = user_id);
create policy "homes_update" on public.homes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "homes_delete" on public.homes for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;
drop policy if exists "photos_read" on storage.objects;
drop policy if exists "photos_insert" on storage.objects;
drop policy if exists "photos_update" on storage.objects;
drop policy if exists "photos_delete" on storage.objects;
create policy "photos_read" on storage.objects for select using (bucket_id = 'photos');
create policy "photos_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos_update" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
