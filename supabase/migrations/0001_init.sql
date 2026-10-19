-- KAN Tennis: initial schema
-- Run this once in the Supabase SQL editor (or with `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- players
-- ---------------------------------------------------------------------------
create table if not exists public.players (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(btrim(name)) between 1 and 40),
  pin_hash        text not null,
  role            text not null default 'member' check (role in ('member', 'moderator')),
  -- brute-force protection for 4-digit PINs
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now()
);

-- Names are unique, case-insensitively ("Daniel" = "daniel").
create unique index if not exists players_name_lower_key on public.players (lower(name));

-- ---------------------------------------------------------------------------
-- game_days  (date/start_time/end_time are Pacific wall-clock values)
-- ---------------------------------------------------------------------------
create table if not exists public.game_days (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  start_time  time not null default '19:00',
  end_time    time not null default '22:00',
  location    text not null default 'Muir Tennis Courts',
  notes       text,
  created_by  uuid references public.players (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint game_days_time_order check (end_time > start_time)
);

create index if not exists game_days_date_idx on public.game_days (date);

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id           uuid primary key default gen_random_uuid(),
  game_day_id  uuid not null references public.game_days (id) on delete cascade,
  player1_id   uuid not null references public.players (id) on delete restrict,
  player2_id   uuid not null references public.players (id) on delete restrict,
  court        text,
  result       text not null default 'pending'
               check (result in ('pending', 'player1_win', 'player2_win', 'draw')),
  score        text check (score is null or char_length(score) <= 60),
  created_at   timestamptz not null default now(),
  constraint matches_distinct_players check (player1_id <> player2_id)
);

create index if not exists matches_game_day_idx on public.matches (game_day_id);
create index if not exists matches_player1_idx on public.matches (player1_id);
create index if not exists matches_player2_idx on public.matches (player2_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- RLS is ON with NO policies: the public anon key can't read or write anything.
-- The Next.js server talks to the database with the service-role key, which
-- bypasses RLS, and enforces auth/roles itself.
-- ---------------------------------------------------------------------------
alter table public.players   enable row level security;
alter table public.game_days enable row level security;
alter table public.matches   enable row level security;
