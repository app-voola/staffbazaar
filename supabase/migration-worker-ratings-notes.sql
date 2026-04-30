-- Per-owner ratings + private notes about workers, surfaced on the
-- /candidate/[workerId] page. worker_id is text so it can point at
-- either a real worker_profiles UUID or a seed `workers` row id.

create table if not exists public.worker_ratings (
  owner_id   uuid not null references auth.users(id) on delete cascade,
  worker_id  text not null,
  stars      int  not null default 0 check (stars >= 0 and stars <= 5),
  updated_at timestamptz default now(),
  primary key (owner_id, worker_id)
);

alter table public.worker_ratings enable row level security;
drop policy if exists "owner own ratings" on public.worker_ratings;
create policy "owner own ratings" on public.worker_ratings
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create table if not exists public.worker_notes (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  worker_id  text not null,
  text       text not null,
  created_at timestamptz default now()
);
create index if not exists worker_notes_owner_worker_idx
  on public.worker_notes(owner_id, worker_id, created_at desc);

alter table public.worker_notes enable row level security;
drop policy if exists "owner own notes" on public.worker_notes;
create policy "owner own notes" on public.worker_notes
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Hook both tables into Supabase realtime so multiple tabs and the
-- candidate-page subscription stay in sync. REPLICA IDENTITY FULL
-- ensures UPDATE payloads carry every column (the existing pattern
-- used elsewhere in this repo).
do $$
declare
  t text;
begin
  foreach t in array array['worker_ratings','worker_notes'] loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) then
      execute format('alter table public.%I replica identity full', t);
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception
        when duplicate_object then null;
        when others then null;
      end;
    end if;
  end loop;
end$$;
