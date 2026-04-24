-- Age collected during the worker create-profile wizard.
-- Nullable so existing profiles don't break.

alter table public.worker_profiles
  add column if not exists age int;
