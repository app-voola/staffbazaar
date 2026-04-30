-- Background-check status, persisted per worker. Default 'none' so the
-- verification panel keeps showing the existing "Not yet completed"
-- copy until an admin / process flips a worker to 'pending' or
-- 'verified'. Adding the column lets the candidate page render real
-- state instead of a hard-coded false.

alter table public.worker_profiles
  add column if not exists background_check_status text default 'none';

-- Constrain to the small known set so consumers can switch on the value
-- without worrying about typos.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'worker_profiles_background_check_status_chk'
  ) then
    alter table public.worker_profiles
      add constraint worker_profiles_background_check_status_chk
      check (background_check_status in ('none','pending','verified'));
  end if;
end$$;
