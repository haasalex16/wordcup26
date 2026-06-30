-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor).

create table if not exists matches (
  id            integer primary key,        -- match number 1-104
  stage         text not null,              -- group | r32 | r16 | qf | sf | third | final
  group_name    text,
  matchday      integer,
  kickoff_text  text,
  home_team     text,
  away_team     text,
  home_score    integer,
  away_score    integer,
  home_penalty_score integer,            -- knockout shootout only, else null
  away_penalty_score integer,
  finished      boolean not null default false,
  time_elapsed  text,
  updated_at    timestamptz not null default now()
);

-- Already-deployed tables: add the shootout columns if missing.
alter table matches add column if not exists home_penalty_score integer;
alter table matches add column if not exists away_penalty_score integer;

-- Public site: anyone can read, only the service role (your sync job) can write.
alter table matches enable row level security;

create policy "public read" on matches
  for select using (true);

-- No insert/update/delete policies: anon key is read-only,
-- and the service role key bypasses RLS.

-- Broadcast row changes to connected browsers (live updates).
alter publication supabase_realtime add table matches;
