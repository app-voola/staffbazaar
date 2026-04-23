-- Allow anyone authenticated to read worker_profiles, so the owner's
-- Browse Staff page can list real worker signups alongside the seeded
-- workers table. Writes remain locked to the profile's own worker_id.

drop policy if exists "wp_public_read" on public.worker_profiles;
create policy "wp_public_read" on public.worker_profiles
  for select
  using (true);
