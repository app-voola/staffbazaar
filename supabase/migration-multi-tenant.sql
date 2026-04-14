-- ============================================================================
-- StaffBazaar — multi-tenant migration
-- Each logged-in user sees only their own jobs / applicants / saved staff /
-- conversations / messages / quota. The workers pool stays shared.
--
-- SAFE to re-run. Assigns all existing rows to neeradiashley@gmail.com so
-- they stay visible when you log in.
-- ============================================================================

-- 1. Add owner_id columns (nullable for now so backfill can succeed)
alter table public.jobs
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.saved_staff
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.conversations
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.app_settings
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

-- 2. Backfill every existing row to neeradiashley@gmail.com
do $$
declare
  u uuid;
begin
  select id into u
  from auth.users
  where email = 'neeradiashley@gmail.com'
  limit 1;

  if u is null then
    raise notice 'neeradiashley@gmail.com not found in auth.users. Log in once via the app with that email, then re-run this migration.';
    return;
  end if;

  update public.jobs          set owner_id = u where owner_id is null;
  update public.saved_staff   set owner_id = u where owner_id is null;
  update public.conversations set owner_id = u where owner_id is null;

  -- If the old singleton app_settings row exists (id=1, owner_id=null),
  -- stamp it with the owner. Otherwise insert a fresh 0/3 row.
  update public.app_settings set owner_id = u where owner_id is null;
  if not found then
    insert into public.app_settings (owner_id, posts_used, posts_limit)
    values (u, 0, 3);
  end if;
end $$;

-- 3. Any remaining rows without an owner_id get removed (defensive)
delete from public.app_settings where owner_id is null;
delete from public.jobs          where owner_id is null;
delete from public.saved_staff   where owner_id is null;
delete from public.conversations where owner_id is null;

-- 4. Rebuild primary keys around owner_id
alter table public.app_settings drop constraint if exists app_settings_pkey cascade;
alter table public.app_settings drop constraint if exists app_settings_id_check;
alter table public.app_settings drop column if exists id;
alter table public.app_settings alter column owner_id set not null;
alter table public.app_settings add primary key (owner_id);

alter table public.saved_staff drop constraint if exists saved_staff_pkey;
alter table public.saved_staff alter column owner_id set not null;
alter table public.saved_staff add primary key (owner_id, worker_id);

alter table public.jobs          alter column owner_id set not null;
alter table public.conversations alter column owner_id set not null;

-- 5. Replace the old "anon all" policies with per-owner policies
drop policy if exists "anon all jobs"          on public.jobs;
drop policy if exists "anon all workers"       on public.workers;
drop policy if exists "anon all applicants"    on public.applicants;
drop policy if exists "anon all saved_staff"   on public.saved_staff;
drop policy if exists "anon all conversations" on public.conversations;
drop policy if exists "anon all messages"      on public.messages;
drop policy if exists "anon all app_settings"  on public.app_settings;

drop policy if exists "owner jobs"          on public.jobs;
drop policy if exists "owner saved_staff"   on public.saved_staff;
drop policy if exists "owner conversations" on public.conversations;
drop policy if exists "owner app_settings"  on public.app_settings;
drop policy if exists "owner applicants"    on public.applicants;
drop policy if exists "owner messages"      on public.messages;
drop policy if exists "authed read workers" on public.workers;

create policy "owner jobs" on public.jobs
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner saved_staff" on public.saved_staff
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner conversations" on public.conversations
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner app_settings" on public.app_settings
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- applicants: inherit ownership via parent job
create policy "owner applicants" on public.applicants
  for all
  using (
    exists (
      select 1 from public.jobs j
      where j.id = applicants.job_id and j.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.jobs j
      where j.id = applicants.job_id and j.owner_id = auth.uid()
    )
  );

-- messages: inherit ownership via parent conversation
create policy "owner messages" on public.messages
  for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.owner_id = auth.uid()
    )
  );

-- workers: shared pool, readable by any authenticated user
create policy "authed read workers" on public.workers
  for select
  using (auth.role() = 'authenticated');

-- ============================================================================
-- DONE.
-- ============================================================================
