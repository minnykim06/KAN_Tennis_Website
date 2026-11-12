-- KAN Tennis: 2026 Fall tournament — end the tournament
-- Run after 0006_special_pairs.sql. Safe to re-run.
--
-- One row per tournament. ended = true once a moderator ends it: members can
-- no longer change results (moderators still can, and can reopen it).

create table if not exists public.tournaments (
  id         text primary key,
  ended      boolean not null default false,
  ended_at   timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.tournaments (id) values ('fall-2026') on conflict (id) do nothing;

-- Same model as the other tables: RLS on, no policies, server-only access.
alter table public.tournaments enable row level security;
