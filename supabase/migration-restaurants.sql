-- ============================================================================
-- StaffBazaar — restaurants table (per-owner)
-- One restaurant profile per authenticated user.
-- Safe to re-run.
-- ============================================================================

create table if not exists public.restaurants (
  owner_id    uuid primary key references auth.users(id) on delete cascade,
  name        text,
  type        text,
  description text,
  address     text,
  city        text,
  pin         text,
  phone       text,
  email       text,
  website     text,
  updated_at  timestamptz default now()
);

alter table public.restaurants enable row level security;

drop policy if exists "owner restaurants" on public.restaurants;
create policy "owner restaurants" on public.restaurants
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Add to realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'restaurants'
  ) then
    alter publication supabase_realtime add table public.restaurants;
  end if;
end $$;
