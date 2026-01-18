-- Add reactions column to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;

-- Drop existing foreign key constraint from messages to conversations
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

-- Re-add foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES public.conversations(id)
ON DELETE CASCADE;

-- Add checking for reactions structure if possible or just rely on application logic
-- Grant access to authenticated users to update reactions (already covered by update policy?)
-- We need to check if update policy allows updating 'reactions' for other people's messages?
-- Actually, usually users can only update THEIR own messages.
-- For reactions, we might need a separate table OR allow appending to the jsonb.
-- For simplicity in this "Instagram-style" request (often simpler MVP), we'll let any participant update the message to add their reaction.
-- BUT, security-wise, this allows users to modify message content technically if the policy is broad.
-- Let's check existing policy: "Users can update own messages".
-- We need a policy to allow updating 'reactions' specifically, or stick to the simple model where you can only update your own.
-- WAIT. If I want to react to YOUR message, I need UPDATE permission on YOUR message row.
-- Standard 'messages' RLS usually restricts UPDATE to sender_id = auth.uid().
-- So we probably need a separate table `message_reactions` for security, OR a very specific RLS policy using a function.
-- Let's stick to a separate table `message_reactions` to avoid opening up message editing to others.

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(message_id, user_id) -- One reaction per user per message? Or allow multiple? Insta allows one usually.
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for message_reactions
CREATE POLICY "Reactions viewable by everyone" ON public.message_reactions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own reactions" ON public.message_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON public.message_reactions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions" ON public.message_reactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Realtime subscription for reactions should now listen to 'message_reactions' table
