-- ============================================================================
-- StaffBazaar — restaurants v2
-- Adds logo_image, cuisines, and hours columns. Safe to re-run.
-- ============================================================================

alter table public.restaurants add column if not exists logo_image text;
alter table public.restaurants add column if not exists cuisines  text[] default '{}';
alter table public.restaurants add column if not exists hours     jsonb  default '{}'::jsonb;
