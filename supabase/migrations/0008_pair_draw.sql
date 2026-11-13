-- KAN Tennis: 2026 Fall tournament — 고정 페어 draw (제비뽑기)
-- Run after 0007_tournament_end.sql. Safe to re-run.
--
-- On the day, each fixed pair draws a letter A–E within its team. The 15
-- 고정 페어 matches follow a set letter schedule (lib/tournament/fall-2026.ts,
-- PAIR_SCHEDULE): match 1 = 흑A vs 백A, …, match 15 = 흑E vs 백B.

-- The draw: {"black": {"A": "B3", …}, "white": {"A": "W1", …}} (letter → pair id).
alter table public.tournaments add column if not exists pair_letters jsonb;

-- Which of the 15 scheduled matches a 고정 페어 row is (1–15).
alter table public.tournament_matches add column if not exists slot smallint;
do $$ begin
  alter table public.tournament_matches
    add constraint tournament_matches_slot_range check (slot is null or (kind = 'pair' and slot between 1 and 15));
exception when duplicate_object then null; end $$;
create unique index if not exists tournament_matches_slot_key
  on public.tournament_matches (tournament_id, slot) where slot is not null;
