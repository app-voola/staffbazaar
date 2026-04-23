-- Add a location field to work_experience so workers can note the
-- city / area of each past restaurant. Owners see this in the
-- candidate profile experience timeline.

alter table public.work_experience
  add column if not exists location text;
