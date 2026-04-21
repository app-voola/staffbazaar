-- Allow participants to UPDATE / DELETE their messages so client-side
-- cleanup (duplicate welcome bubbles, etc.) actually executes instead
-- of being silently blocked by RLS.

drop policy if exists "msg_update_participant" on public.messages;
create policy "msg_update_participant" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.owner_id = auth.uid() or c.worker_id = auth.uid())
    )
  );

drop policy if exists "msg_delete_participant" on public.messages;
create policy "msg_delete_participant" on public.messages
  for delete using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.owner_id = auth.uid() or c.worker_id = auth.uid())
    )
  );
