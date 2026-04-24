-- saved_staff.worker_id was declared as
--   worker_id text primary key references public.workers(id)
-- which blocks saving any *real* worker (auth.users UUID) because those
-- ids don't exist in the seed `workers` table. Drop the FK so saved_staff
-- can point to either a seed worker or a real worker_profiles id.

alter table public.saved_staff
  drop constraint if exists saved_staff_worker_id_fkey;
