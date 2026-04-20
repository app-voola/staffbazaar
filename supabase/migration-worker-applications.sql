-- Worker applications migration
-- Adds worker_id to applicants table so workers can query their own applications
-- Also extends stage options to include 'viewed' and 'rejected' for richer lifecycle

alter table public.applicants
  add column if not exists worker_id uuid references auth.users(id) on delete cascade;

create index if not exists applicants_worker_id_idx on public.applicants(worker_id);

-- Extend stage check to include viewed + rejected states visible on worker side
alter table public.applicants drop constraint if exists applicants_stage_check;
alter table public.applicants
  add constraint applicants_stage_check
  check (stage in ('applied','viewed','shortlisted','called','hired','rejected'));

-- RLS: workers can see their own applications
alter table public.applicants enable row level security;

drop policy if exists "worker_select_own_applications" on public.applicants;
create policy "worker_select_own_applications"
  on public.applicants
  for select
  using (worker_id = auth.uid());

drop policy if exists "worker_insert_own_applications" on public.applicants;
create policy "worker_insert_own_applications"
  on public.applicants
  for insert
  with check (worker_id = auth.uid());

drop policy if exists "worker_delete_own_applications" on public.applicants;
create policy "worker_delete_own_applications"
  on public.applicants
  for delete
  using (worker_id = auth.uid());
