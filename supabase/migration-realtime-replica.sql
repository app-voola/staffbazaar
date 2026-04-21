-- Supabase realtime filters match against the row payload. With the
-- default REPLICA IDENTITY on Postgres, UPDATE payloads only include
-- the primary key and changed columns — so filters like
-- `worker_id=eq.<uid>` on an UPDATE that only touches `stage` would miss
-- because worker_id isn't in the payload. Setting REPLICA IDENTITY FULL
-- ensures the full new row is emitted on every change.

alter table public.applicants       replica identity full;
alter table public.conversations    replica identity full;
alter table public.messages         replica identity full;
alter table public.saved_jobs       replica identity full;
alter table public.notifications    replica identity full;
alter table public.worker_profiles  replica identity full;
alter table public.work_experience  replica identity full;
alter table public.jobs             replica identity full;

-- Make sure all these tables are published for realtime.
do $$
declare
  t text;
begin
  foreach t in array array[
    'applicants','conversations','messages','saved_jobs',
    'notifications','worker_profiles','work_experience','jobs'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      -- already in publication, ignore
    end;
  end loop;
end$$;
