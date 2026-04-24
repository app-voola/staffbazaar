-- Store owner's spoken languages as an array so multi-select works.
-- Existing singular `language` column is kept for rollback but ignored
-- by the app going forward.

alter table public.profiles
  add column if not exists languages text[] default array['English']::text[];

-- Backfill the array from the old singular column where present
update public.profiles
  set languages = array[language]
  where (languages is null or array_length(languages, 1) is null)
    and language is not null
    and language <> '';
