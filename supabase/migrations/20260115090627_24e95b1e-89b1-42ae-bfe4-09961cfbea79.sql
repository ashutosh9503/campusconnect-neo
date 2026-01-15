-- Fix the conversations SELECT policy (wrong column reference)
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id 
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Fix the conversation_participants SELECT policy (tautology bug)
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
  );