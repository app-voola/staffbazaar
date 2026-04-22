-- Add restaurant_name to conversations so the worker's UI always has
-- the correct display name regardless of whether the owner has set up
-- a restaurants row yet. conversations.name stays as the worker's name
-- (owner's view); restaurant_name is the worker's view.

alter table public.conversations
  add column if not exists restaurant_name text;

-- Backfill existing rows from the restaurants table where possible
update public.conversations c
set    restaurant_name = r.name
from   public.restaurants r
where  c.owner_id = r.owner_id
  and  c.restaurant_name is null;
