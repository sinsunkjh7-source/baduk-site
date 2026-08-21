-- Supabase SQL Editor에서 이 스크립트를 그대로 실행하세요.
-- 지금 단계(로그인 없음, 본인만 사용)에서는 RLS를 열어둬서 anon key로 자유롭게
-- 읽기/쓰기가 되도록 합니다. 나중에 로그인을 붙일 때 이 정책을 관리자 전용으로 좁히면 됩니다.

create table if not exists problems (
  id text primary key,
  unit_id text not null,
  level_id text not null,
  sequence integer not null,
  title text not null,
  size integer not null,
  region jsonb,
  initial_stones jsonb not null,
  player_color text not null,
  correct_points jsonb not null
);

alter table problems enable row level security;

create policy "allow all (single-admin phase)"
  on problems
  for all
  using (true)
  with check (true);
