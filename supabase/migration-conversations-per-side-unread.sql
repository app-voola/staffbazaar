-- Per-side unread counters so the sender doesn't see an unread bump
-- on their own message. The legacy `unread` column stays in place; we
-- mirror its current value into both new columns for backwards compat.

alter table public.conversations
  add column if not exists unread_for_owner  int default 0,
  add column if not exists unread_for_worker int default 0;

update public.conversations
  set unread_for_owner = coalesce(unread_for_owner, unread, 0),
      unread_for_worker = coalesce(unread_for_worker, unread, 0)
  where unread_for_owner is null or unread_for_worker is null;

-- Read receipts on individual messages so the sender can render a
-- double-tick once the recipient opens the thread.
alter table public.messages
  add column if not exists read_at timestamptz;
