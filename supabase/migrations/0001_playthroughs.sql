-- One anonymous row per finished playthrough, used to measure the PRD's
-- success metrics. Players can add rows but nobody can read them through
-- the public API: only you, from the Supabase dashboard.

create table public.playthroughs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  case_id text not null check (char_length(case_id) <= 64),
  outcome text not null check (outcome in ('solved', 'escaped')),
  duration_s integer not null check (duration_s between 0 and 86400),
  wrong_accusations smallint not null check (wrong_accusations between 0 and 10),
  released_count smallint not null check (released_count between 0 and 50),
  key_clues_pct smallint not null check (key_clues_pct between 0 and 100),
  used_confront boolean not null,
  rank text not null check (char_length(rank) <= 32),
  wants_more boolean,
  app_version text not null check (char_length(app_version) <= 16)
);

alter table public.playthroughs enable row level security;

create policy "Anyone can submit a playthrough"
  on public.playthroughs
  for insert
  to anon
  with check (true);

-- Columns the game may fill in; everything else is set by the database.
revoke all on public.playthroughs from anon, authenticated;
grant insert (case_id, outcome, duration_s, wrong_accusations, released_count,
              key_clues_pct, used_confront, rank, wants_more, app_version)
  on public.playthroughs to anon;
