-- ============================================================================
-- StaffBazaar — restaurant photos
-- Adds cover_image + photos[] columns to public.restaurants and creates a
-- Storage bucket each owner can upload to.
-- Safe to re-run.
-- ============================================================================

-- 1. Add columns
alter table public.restaurants add column if not exists cover_image text;
alter table public.restaurants add column if not exists photos text[] default '{}';

-- 2. Create the storage bucket (public so the URLs render in <img src>)
insert into storage.buckets (id, name, public)
values ('restaurant-photos', 'restaurant-photos', true)
on conflict (id) do nothing;

-- 3. RLS policies on storage.objects scoped to {owner_id}/* path
drop policy if exists "restaurant photos read"   on storage.objects;
drop policy if exists "restaurant photos upload" on storage.objects;
drop policy if exists "restaurant photos delete" on storage.objects;
drop policy if exists "restaurant photos update" on storage.objects;

create policy "restaurant photos read"
  on storage.objects for select
  using (bucket_id = 'restaurant-photos');

create policy "restaurant photos upload"
  on storage.objects for insert
  with check (
    bucket_id = 'restaurant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "restaurant photos update"
  on storage.objects for update
  using (
    bucket_id = 'restaurant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "restaurant photos delete"
  on storage.objects for delete
  using (
    bucket_id = 'restaurant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
