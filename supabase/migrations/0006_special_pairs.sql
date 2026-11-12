-- KAN Tennis: 2026 Fall tournament — 스페셜 페어
-- Run after 0005_tournament.sql. Safe to re-run.
--
-- Two match types now: 'pair' (고정 페어, 3 matches per pair) and 'special'
-- (스페셜 페어, 1 match each, set in advance). Participant ids match
-- lib/tournament/fall-2026.ts.

alter table public.tournament_matches drop constraint if exists tournament_matches_kind_check;
alter table public.tournament_matches
  add constraint tournament_matches_kind_check check (kind in ('pair', 'special'));

-- The five set special matchups (흑팀 pair = side 1, 백팀 pair = side 2).
insert into public.tournament_matches (tournament_id, kind, side1_a, side1_b, side2_a, side2_b)
select 'fall-2026', 'special', v.s1a, v.s1b, v.s2a, v.s2b
from (values
  ('B4-1', 'B5-1', 'W1-1', 'W3-1'), -- William Pechkis / Victor Kim vs 김민성 / 김민서
  ('B1-1', 'B2-1', 'W5-1', 'W4-1'), -- Aidan Jang / 이지윤 vs 박승비 / 손준영
  ('B5-2', 'B4-2', 'W2-1', 'W1-2'), -- 장유진 / 주현우 vs 김주현 / 이단비
  ('B3-1', 'B1-2', 'W2-2', 'W5-2'), -- 정재용 / 이재선 vs 도정현 / 홍우진
  ('B3-2', 'B2-2', 'W4-2', 'W3-2')  -- 한지훈 / 이민준 vs 이동진 / 김호준
) as v(s1a, s1b, s2a, s2b)
where not exists (
  select 1 from public.tournament_matches m
  where m.tournament_id = 'fall-2026' and m.kind = 'special'
    and m.side1_a = v.s1a and m.side1_b = v.s1b and m.side2_a = v.s2a and m.side2_b = v.s2b
);

-- Set in stone: special matchups can't be deleted, and their players and type
-- can't change. Results (status, winner, scores), time and court still can.
create or replace function public.tournament_special_locked() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.kind = 'special' then raise exception 'special-pair matchups are set and cannot be deleted'; end if;
    return old;
  end if;
  if (old.kind = 'special' or new.kind = 'special')
     and (new.kind, new.side1_a, new.side1_b, new.side2_a, new.side2_b)
         is distinct from (old.kind, old.side1_a, old.side1_b, old.side2_a, old.side2_b) then
    raise exception 'special-pair matchups are set and cannot be changed';
  end if;
  return new;
end $$;

drop trigger if exists tournament_special_locked on public.tournament_matches;
create trigger tournament_special_locked
  before update or delete on public.tournament_matches
  for each row execute function public.tournament_special_locked();
