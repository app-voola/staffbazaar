-- Tracks whether the worker has finished the /create-profile wizard.
-- The (workers-end) layout guard uses this to decide whether to bounce
-- a worker back to the wizard. Once true, clearing fields on the
-- /worker-profile editor won't re-trigger the wizard redirect.

alter table public.worker_profiles
  add column if not exists onboarding_complete boolean default false;

-- Backfill: anyone who already has the four wizard fields populated is
-- considered onboarded so they don't get bounced into the wizard on
-- their next visit.
update public.worker_profiles
  set onboarding_complete = true
  where onboarding_complete is not true
    and full_name is not null and full_name <> ''
    and role is not null and role <> ''
    and cities is not null and array_length(cities, 1) > 0;
