-- ============================================================================
-- StaffBazaar — profiles table (per-owner)
-- One profile row per authenticated user. Separate from the restaurants table
-- so owner account settings live independent of business details.
-- Safe to re-run.
-- ============================================================================

create table if not exists public.profiles (
  owner_id          uuid primary key references auth.users(id) on delete cascade,
  full_name         text,
  email             text,
  phone             text,
  notify_applicants boolean default true,
  notify_whatsapp   boolean default true,
  language          text default 'English',
  updated_at        timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "owner profiles" on public.profiles;
create policy "owner profiles" on public.profiles
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Add to realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
