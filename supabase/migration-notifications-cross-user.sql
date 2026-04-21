-- Allow any authenticated user to INSERT a notification for another user.
-- This is needed so an owner can create a notification for the worker
-- when moving an applicant stage, sending a message, or posting a job.
-- Reads/updates/deletes remain scoped to the recipient via existing policies.

drop policy if exists "notif_insert_own" on public.notifications;
create policy "notif_insert_any_authed" on public.notifications
  for insert
  with check (auth.uid() is not null);
