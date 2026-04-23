-- Allow authenticated workers (and owners) to upload their own photos
-- into the restaurant-photos bucket under a path prefixed with their uid.
-- Read access stays public so covers/avatars can be shown everywhere.

-- Make sure the bucket is public for reads (idempotent)
update storage.buckets set public = true where id = 'restaurant-photos';

-- Insert policies — bucket-scoped so they don't clash with policies on
-- other buckets.

drop policy if exists "restaurant_photos_authed_insert" on storage.objects;
create policy "restaurant_photos_authed_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'restaurant-photos'
    and auth.uid() is not null
  );

drop policy if exists "restaurant_photos_authed_update" on storage.objects;
create policy "restaurant_photos_authed_update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'restaurant-photos'
    and auth.uid() is not null
  );

drop policy if exists "restaurant_photos_authed_delete" on storage.objects;
create policy "restaurant_photos_authed_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'restaurant-photos'
    and auth.uid() is not null
  );

drop policy if exists "restaurant_photos_public_read" on storage.objects;
create policy "restaurant_photos_public_read" on storage.objects
  for select
  using (bucket_id = 'restaurant-photos');
