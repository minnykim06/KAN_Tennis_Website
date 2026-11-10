-- KAN Tennis: close finished game days
-- Run after 0003_match_notes.sql. Safe to re-run.

-- When a moderator closes a game day, members can no longer enter or change
-- its scores. Moderators can still edit it, and can reopen it.
alter table public.game_days
  add column if not exists closed boolean not null default false;
