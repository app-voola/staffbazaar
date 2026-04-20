-- =========================================================================
-- Workers-end full migration
-- Tables: worker_profiles, saved_jobs, notifications
-- Extends: conversations (owner_id + worker_id)
-- RLS everywhere so each worker only sees their own data
-- =========================================================================

-- -------------------------------------------------------------------------
-- WORKER_PROFILES
-- -------------------------------------------------------------------------
create table if not exists public.worker_profiles (
  worker_id         uuid primary key references auth.users(id) on delete cascade,
  full_name         text,
  role              text,
  experience_years  int default 0,
  city              text,
  phone             text,
  email             text,
  bio               text,
  skills            text[] default '{}',
  salary_expected   int,
  looking_for_work  boolean default true,
  avatar_url        text,
  language          text default 'en',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.worker_profiles enable row level security;
drop policy if exists "wp_select_own" on public.worker_profiles;
drop policy if exists "wp_insert_own" on public.worker_profiles;
drop policy if exists "wp_update_own" on public.worker_profiles;
create policy "wp_select_own" on public.worker_profiles for select using (worker_id = auth.uid());
create policy "wp_insert_own" on public.worker_profiles for insert with check (worker_id = auth.uid());
create policy "wp_update_own" on public.worker_profiles for update using (worker_id = auth.uid());

-- -------------------------------------------------------------------------
-- SAVED_JOBS
-- -------------------------------------------------------------------------
create table if not exists public.saved_jobs (
  worker_id  uuid references auth.users(id) on delete cascade,
  job_id     text references public.jobs(id) on delete cascade,
  saved_at   timestamptz default now(),
  primary key (worker_id, job_id)
);

create index if not exists saved_jobs_worker_idx on public.saved_jobs(worker_id);

alter table public.saved_jobs enable row level security;
drop policy if exists "sj_select_own" on public.saved_jobs;
drop policy if exists "sj_insert_own" on public.saved_jobs;
drop policy if exists "sj_delete_own" on public.saved_jobs;
create policy "sj_select_own" on public.saved_jobs for select using (worker_id = auth.uid());
create policy "sj_insert_own" on public.saved_jobs for insert with check (worker_id = auth.uid());
create policy "sj_delete_own" on public.saved_jobs for delete using (worker_id = auth.uid());

-- -------------------------------------------------------------------------
-- NOTIFICATIONS
-- -------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null check (type in ('application','message','shortlist','hired','job_match','system')),
  title       text not null,
  body        text,
  link        text,
  read        boolean default false,
  created_at  timestamptz default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "notif_select_own" on public.notifications;
drop policy if exists "notif_update_own" on public.notifications;
drop policy if exists "notif_insert_own" on public.notifications;
drop policy if exists "notif_delete_own" on public.notifications;
create policy "notif_select_own" on public.notifications for select using (user_id = auth.uid());
create policy "notif_update_own" on public.notifications for update using (user_id = auth.uid());
create policy "notif_insert_own" on public.notifications for insert with check (user_id = auth.uid());
create policy "notif_delete_own" on public.notifications for delete using (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- CONVERSATIONS: add owner_id + worker_id so both sides can filter
-- -------------------------------------------------------------------------
alter table public.conversations add column if not exists owner_id  uuid references auth.users(id) on delete cascade;
alter table public.conversations add column if not exists worker_id uuid references auth.users(id) on delete cascade;

create index if not exists conversations_owner_idx  on public.conversations(owner_id);
create index if not exists conversations_worker_idx on public.conversations(worker_id);

alter table public.conversations enable row level security;

drop policy if exists "conv_select_participant"      on public.conversations;
drop policy if exists "conv_insert_participant"      on public.conversations;
drop policy if exists "conv_update_participant"      on public.conversations;
drop policy if exists "conv_delete_participant"      on public.conversations;

create policy "conv_select_participant" on public.conversations
  for select using (owner_id = auth.uid() or worker_id = auth.uid());
create policy "conv_insert_participant" on public.conversations
  for insert with check (owner_id = auth.uid() or worker_id = auth.uid());
create policy "conv_update_participant" on public.conversations
  for update using (owner_id = auth.uid() or worker_id = auth.uid());
create policy "conv_delete_participant" on public.conversations
  for delete using (owner_id = auth.uid() or worker_id = auth.uid());

-- Messages: allow participants of the parent conversation
alter table public.messages enable row level security;
drop policy if exists "msg_select_participant" on public.messages;
drop policy if exists "msg_insert_participant" on public.messages;
create policy "msg_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.owner_id = auth.uid() or c.worker_id = auth.uid())
    )
  );
create policy "msg_insert_participant" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.owner_id = auth.uid() or c.worker_id = auth.uid())
    )
  );

-- -------------------------------------------------------------------------
-- JOBS: allow workers to read active jobs (for Find Jobs page)
-- -------------------------------------------------------------------------
alter table public.jobs enable row level security;
drop policy if exists "jobs_public_read_active" on public.jobs;
drop policy if exists "jobs_owner_all"          on public.jobs;
create policy "jobs_public_read_active" on public.jobs
  for select using (status = 'active' or owner_id = auth.uid());
create policy "jobs_owner_all" on public.jobs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- -------------------------------------------------------------------------
-- RESTAURANTS: allow anyone to read restaurant info (needed for job cards)
-- -------------------------------------------------------------------------
alter table public.restaurants enable row level security;
drop policy if exists "restaurants_public_read" on public.restaurants;
drop policy if exists "restaurants_owner_write" on public.restaurants;
create policy "restaurants_public_read" on public.restaurants for select using (true);
create policy "restaurants_owner_write" on public.restaurants
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
