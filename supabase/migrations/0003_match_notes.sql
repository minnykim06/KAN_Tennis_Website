-- KAN Tennis: optional note on each matchup
-- Run after 0002_doubles.sql. Safe to re-run.

alter table public.matches
  add column if not exists note text;

do $$ begin
  alter table public.matches
    add constraint matches_note_length check (note is null or char_length(note) <= 200);
exception when duplicate_object then null; end $$;
