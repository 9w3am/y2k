-- ══════════════════════════════════════════════════════════
--  4단계: 운영 기능 더하기
--  Supabase → SQL Editor → 붙여넣고 Run. 여러 번 돌려도 괜찮다.
--  (3단계 setup-3-admin.sql 을 먼저 돌린 뒤)
--
--  · 대문 팝업 공지 (오늘 하루 보지 않기)
--  · 점검 모드 — 켜면 운영자 말고는 점검 안내만 보인다
--  · 운영자는 신청 중인 단짝까지 전부 본다
-- ══════════════════════════════════════════════════════════

alter table public.site add column if not exists popup_title text not null default '';
alter table public.site add column if not exists popup_body text not null default '';
alter table public.site add column if not exists maintenance boolean not null default false;
alter table public.site add column if not exists maintenance_msg text not null default '';

drop policy if exists "friends_read" on public.friends;
create policy "friends_read" on public.friends for select
  using (status = 'accepted' or auth.uid() in (requester_id, target_id) or public.is_admin());
