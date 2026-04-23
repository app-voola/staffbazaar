-- Allow authenticated users (owners) to read any worker's work_experience
-- so the candidate profile page can display the worker's real experience.
-- Writes remain locked to the experience row's own worker_id.

drop policy if exists "we_public_read" on public.work_experience;
create policy "we_public_read" on public.work_experience
  for select
  using (true);
