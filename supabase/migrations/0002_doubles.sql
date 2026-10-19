-- KAN Tennis: singles / doubles game days
-- Run after 0001_init.sql. Safe to re-run.

-- Each game day is either singles or doubles. Game days that already exist
-- were singles; new ones default to doubles (the club's usual format).
alter table public.game_days
  add column if not exists format text not null default 'singles';
alter table public.game_days
  alter column format set default 'doubles';
do $$ begin
  alter table public.game_days
    add constraint game_days_format_check check (format in ('singles', 'doubles'));
exception when duplicate_object then null; end $$;

-- Doubles partners. Team 1 = player1 + partner1, Team 2 = player2 + partner2.
-- result 'player1_win' / 'player2_win' means Team 1 / Team 2 won.
alter table public.matches
  add column if not exists partner1_id uuid references public.players (id) on delete restrict,
  add column if not exists partner2_id uuid references public.players (id) on delete restrict;

create index if not exists matches_partner1_idx on public.matches (partner1_id);
create index if not exists matches_partner2_idx on public.matches (partner2_id);

do $$ begin
  -- Either both partners are set (doubles) or neither is (singles),
  -- and the four players of a doubles match are all different.
  alter table public.matches add constraint matches_partners_check check (
    (partner1_id is null and partner2_id is null)
    or (
      partner1_id is not null and partner2_id is not null
      and partner1_id not in (player1_id, player2_id)
      and partner2_id not in (player1_id, player2_id, partner1_id)
    )
  );
exception when duplicate_object then null; end $$;
