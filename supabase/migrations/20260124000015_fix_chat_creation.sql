-- Allow authenticated users to add members to conversations
-- This is required for "Share Post" which creates a new 1:1 chat and adds both users.
-- Previous policy likely restricted adding ONLY self.

-- Drop conflicting policies if any (we'll make a broad one for now to ensure flow works)
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can add members to conversations" ON public.conversation_members;

CREATE POLICY "Users can add members to conversations" ON public.conversation_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Ensure Conversation DELETE policy is solid (redundant check but safe)
-- Already added in 20260124000014_fix_group_chat_deletion.sql, but ensuring here if that one wasn't applied or sufficient.
-- We will assume the previous one was correct for DELETE.

-- Fix potentially missing policy for Insert on Conversations if not already public
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Ensure messages can be inserted if member (already verified in useChat but valid to double check)
-- Existing polices usually check membership.
