-- Extend worker_profiles and add work_experience table

-- Add missing columns to worker_profiles
alter table public.worker_profiles add column if not exists cities text[] default '{}';
alter table public.worker_profiles add column if not exists aadhaar_status text default 'none' check (aadhaar_status in ('none','uploaded','verified'));
alter table public.worker_profiles add column if not exists aadhaar_image_url text;
alter table public.worker_profiles add column if not exists notify_job_matches boolean default true;
alter table public.worker_profiles add column if not exists notify_whatsapp boolean default true;
alter table public.worker_profiles add column if not exists notify_application_updates boolean default true;

-- Work experience entries
create table if not exists public.work_experience (
  id          uuid primary key default gen_random_uuid(),
  worker_id   uuid references auth.users(id) on delete cascade not null,
  job_title   text,
  restaurant  text,
  from_year   int,
  to_year     int,
  still_here  boolean default false,
  created_at  timestamptz default now()
);

create index if not exists work_experience_worker_idx on public.work_experience(worker_id, created_at desc);

alter table public.work_experience enable row level security;
drop policy if exists "we_select_own" on public.work_experience;
drop policy if exists "we_insert_own" on public.work_experience;
drop policy if exists "we_update_own" on public.work_experience;
drop policy if exists "we_delete_own" on public.work_experience;
create policy "we_select_own" on public.work_experience for select using (worker_id = auth.uid());
create policy "we_insert_own" on public.work_experience for insert with check (worker_id = auth.uid());
create policy "we_update_own" on public.work_experience for update using (worker_id = auth.uid());
create policy "we_delete_own" on public.work_experience for delete using (worker_id = auth.uid());
