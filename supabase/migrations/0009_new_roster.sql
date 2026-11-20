-- KAN Tennis: 2026 Fall tournament — new partners (announced 11/20)
-- Run after 0008_pair_draw.sql. Safe to re-run.
--
-- The fixed pairs changed (lib/tournament/fall-2026.ts), so participant ids
-- like 'B3-1' now point at different players. Replace the five special-pair
-- matchups with the new ones. Refuses if any special match has started or the
-- 고정 페어 draw / any 고정 페어 match already exists (those used the old pairs).

do $$
begin
  if exists (
    select 1 from public.tournament_matches
    where tournament_id = 'fall-2026'
      and (kind = 'pair' or status <> 'scheduled' or winner is not null or score1 is not null)
  ) or exists (select 1 from public.tournaments where id = 'fall-2026' and pair_letters is not null) then
    raise exception 'fall-2026 already has a draw or started matches; not replacing special matchups';
  end if;

  -- Already applied: nothing to do.
  if exists (
    select 1 from public.tournament_matches
    where tournament_id = 'fall-2026' and kind = 'special'
      and side1_a = 'B1-1' and side1_b = 'B3-1' and side2_a = 'W1-1' and side2_b = 'W5-1'
  ) then
    return;
  end if;

  alter table public.tournament_matches disable trigger tournament_special_locked;
  delete from public.tournament_matches where tournament_id = 'fall-2026' and kind = 'special';
  insert into public.tournament_matches (tournament_id, kind, side1_a, side1_b, side2_a, side2_b) values
    ('fall-2026', 'special', 'B1-1', 'B3-1', 'W1-1', 'W5-1'), -- William Pechkis / 손준영 vs 김민성 / 김민서
    ('fall-2026', 'special', 'B2-1', 'B4-1', 'W2-1', 'W3-1'), -- Aidan Jang / 이지윤 vs 박승비 / Victor Kim
    ('fall-2026', 'special', 'B5-2', 'B3-2', 'W2-2', 'W1-2'), -- 장유진 / 이동진 vs 김주현 / 이단비
    ('fall-2026', 'special', 'B5-1', 'B2-2', 'W4-1', 'W3-2'), -- 정재용 / 이재선 vs 한지훈 / 김호준
    ('fall-2026', 'special', 'B4-2', 'B1-2', 'W4-2', 'W5-2'); -- 이민준 / 주현우 vs 홍우진 / 이하민
  alter table public.tournament_matches enable trigger tournament_special_locked;
end $$;
