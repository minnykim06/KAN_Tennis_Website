-- KAN Tennis: 2026 Fall semester tournament (흑백전)
-- Run after 0004_close_game_days.sql. Safe to re-run.
--
-- The roster (teams, fixed pairs, participant ids like 'B1-1') lives in code:
-- lib/tournament/fall-2026.ts. These tables only hold what moderators edit
-- during the event. They don't touch players, game_days, matches or rankings.

-- Team display names: no longer used (names come from the translations). Kept because it may already exist.
create table if not exists public.tournament_teams (
  tournament_id text not null,
  team_id       text not null check (team_id in ('black', 'white')),
  name          text not null check (char_length(btrim(name)) between 1 and 30),
  updated_at    timestamptz not null default now(),
  primary key (tournament_id, team_id)
);

-- Matchups. kind: 'pair' (fixed pair vs fixed pair), 'extra' (additional
-- doubles), 'live_ball'. Side 1 = side1_a + side1_b, side 2 = side2_a + side2_b.
create table if not exists public.tournament_matches (
  id            uuid primary key default gen_random_uuid(),
  tournament_id text not null,
  kind          text not null check (kind in ('pair', 'extra', 'live_ball')),
  side1_a       text not null,
  side1_b       text not null,
  side2_a       text not null,
  side2_b       text not null,
  status        text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'final')),
  start_time    time,
  court         text check (court is null or char_length(court) <= 20),
  winner        text check (winner in ('side1', 'side2', 'draw')),
  score1        smallint check (score1 between 0 and 99),
  score2        smallint check (score2 between 0 and 99),
  created_at    timestamptz not null default now(),
  constraint tournament_matches_distinct check (
    side1_a <> side1_b and side2_a <> side2_b
    and side1_a not in (side2_a, side2_b) and side1_b not in (side2_a, side2_b)
  ),
  -- A result only on finished matches; games for both sides or neither.
  constraint tournament_matches_winner_final check (winner is null or status = 'final'),
  constraint tournament_matches_score_pair check ((score1 is null) = (score2 is null))
);

create index if not exists tournament_matches_tournament_idx on public.tournament_matches (tournament_id);

-- Raffle tickets: no longer used. Tickets are now computed per fixed pair from
-- match results (lib/tournament/raffle.ts). Kept because it may already exist.
create table if not exists public.tournament_raffle (
  tournament_id  text not null,
  participant_id text not null,
  tickets        integer not null check (tickets >= 0),
  updated_at     timestamptz not null default now(),
  primary key (tournament_id, participant_id)
);

-- Same model as the other tables: RLS on, no policies, server-only access.
alter table public.tournament_teams   enable row level security;
alter table public.tournament_matches enable row level security;
alter table public.tournament_raffle  enable row level security;
