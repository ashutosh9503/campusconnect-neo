-- Add deleted_at column for soft deletes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.group_messages ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

-- Enable users to update (delete) their own messages
-- We need to check if there is an existing update policy.
DROP POLICY IF EXISTS "Users can update own group messages" ON public.group_messages;

CREATE POLICY "Users can update own group messages" ON public.group_messages
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = public.group_messages.group_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );
