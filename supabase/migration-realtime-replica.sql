-- Supabase realtime filters match against the row payload. With the
-- default REPLICA IDENTITY on Postgres, UPDATE payloads only include
-- the primary key and changed columns — so filters like
-- `worker_id=eq.<uid>` on an UPDATE that only touches `stage` would miss
-- because worker_id isn't in the payload. Setting REPLICA IDENTITY FULL
-- ensures the full new row is emitted on every change.

do $$
declare
  t text;
begin
  foreach t in array array[
    'applicants','conversations','messages','saved_jobs',
    'notifications','worker_profiles','work_experience','jobs'
  ] loop
    if exists (
      select 1 from pg_tables where schemaname = 'public' and tablename = t
    ) then
      execute format('alter table public.%I replica identity full', t);

      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception
        when duplicate_object then null;
        when others then null;
      end;
    end if;
  end loop;
end$$;
