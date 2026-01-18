-- Ensure users can delete their own conversations (or conversations they are part of, depending on logic)
-- Usually deleting a conversation just removes the member from it, or if they are the creator/admin they can delete it?
-- For simple 1:1 chat, "deleting" often means hiding it or deleting the relationship. 
-- But existing code tries `delete().eq('id', id)`. This tries to wipe the row.
-- We need RLS for DELETE on conversations.

-- Drop policies if they exist to avoid conflicts
drop policy if exists "Users can delete conversations they participated in" on public.conversations;
drop policy if exists "Users can delete messages in their conversations" on public.messages;

-- Allow users to delete conversations they are part of
create policy "Users can delete conversations they participated in"
  on public.conversations
  for delete
  using (
    exists (
      select 1 from conversation_members
      where conversation_id = id
      and user_id = auth.uid()
    )
  );
  
-- Also ensure they can delete messages manually if the cascade is redundant
create policy "Users can delete messages in their conversations"
  on public.messages
  for delete
  using (
    auth.uid() in (
      select user_id from conversation_members where conversation_id = conversation_id
    )
  );
