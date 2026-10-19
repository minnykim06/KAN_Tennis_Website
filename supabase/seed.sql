-- KAN Tennis: sample data
-- Run AFTER migrations/0001_init.sql and 0002_doubles.sql. Safe to re-run (fixed ids + ON CONFLICT).
--
-- Every sample player's password is 1234.
-- "Daniel Lee" is a moderator so you can try the moderator tools right away.

insert into public.players (id, name, pin_hash, role) values
  ('00000000-0000-0000-0000-000000000001', 'Daniel Lee',  '$2b$10$Wv2IEXtp5UUQXjImwUIb9O7MZ/D.s/NgHj4qWA371bsjCpatvmILy', 'moderator'),
  ('00000000-0000-0000-0000-000000000002', '김민준',       '$2b$10$Wv2IEXtp5UUQXjImwUIb9O7MZ/D.s/NgHj4qWA371bsjCpatvmILy', 'member'),
  ('00000000-0000-0000-0000-000000000003', '이서연',       '$2b$10$Wv2IEXtp5UUQXjImwUIb9O7MZ/D.s/NgHj4qWA371bsjCpatvmILy', 'member'),
  ('00000000-0000-0000-0000-000000000004', 'Grace Park',  '$2b$10$Wv2IEXtp5UUQXjImwUIb9O7MZ/D.s/NgHj4qWA371bsjCpatvmILy', 'member'),
  ('00000000-0000-0000-0000-000000000005', '박지호',       '$2b$10$Wv2IEXtp5UUQXjImwUIb9O7MZ/D.s/NgHj4qWA371bsjCpatvmILy', 'member'),
  ('00000000-0000-0000-0000-000000000006', 'Jason Choi',  '$2b$10$Wv2IEXtp5UUQXjImwUIb9O7MZ/D.s/NgHj4qWA371bsjCpatvmILy', 'member'),
  ('00000000-0000-0000-0000-000000000007', '최유나',       '$2b$10$Wv2IEXtp5UUQXjImwUIb9O7MZ/D.s/NgHj4qWA371bsjCpatvmILy', 'member'),
  ('00000000-0000-0000-0000-000000000008', 'Sophia Jung', '$2b$10$Wv2IEXtp5UUQXjImwUIb9O7MZ/D.s/NgHj4qWA371bsjCpatvmILy', 'member')
on conflict (id) do nothing;

-- Two game days relative to "today" in San Diego:
--   * last Thursday: singles, completed results
--   * the next Thursday: doubles, results pending
with today as (
  select (now() at time zone 'America/Los_Angeles')::date as d
), next_thu as (
  select d + ((4 - extract(isodow from d)::int + 7) % 7) as d from today
)
insert into public.game_days (id, date, start_time, end_time, location, notes, created_by, format)
select '10000000-0000-0000-0000-000000000001'::uuid, d - 7, '19:00'::time, '22:00'::time, 'Muir Tennis Courts',
       'Great turnout — thanks everyone!', '00000000-0000-0000-0000-000000000001'::uuid, 'singles' from next_thu
union all
select '10000000-0000-0000-0000-000000000002'::uuid, d,     '19:00'::time, '22:00'::time, 'Muir Tennis Courts',
       'Bring water. Balls provided.',     '00000000-0000-0000-0000-000000000001'::uuid, 'doubles' from next_thu
on conflict (id) do nothing;

-- Completed matches (last Thursday)
insert into public.matches (id, game_day_id, player1_id, player2_id, court, result, score) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '1', 'player1_win', '6-4, 6-3'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '2', 'draw',        '6-6'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', '3', 'player2_win', '4-6, 3-6'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', '1', 'player1_win', '6-2, 6-1'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', '2', 'player2_win', '6-7, 6-4, 8-10'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', '3', 'player1_win', '6-3, 6-4'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000007', '1', 'player1_win', '7-5, 6-4')
on conflict (id) do nothing;

-- Upcoming doubles matchups (next Thursday, pending)
--   Daniel Lee / 이서연  vs  Jason Choi / Sophia Jung
--   김민준 / Grace Park  vs  박지호 / 최유나
insert into public.matches (id, game_day_id, player1_id, partner1_id, player2_id, partner2_id, court) values
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000008', '1'),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000007', '2')
on conflict (id) do nothing;
