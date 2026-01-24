-- 1. GROUPS DELETION
-- Update the policy to allow system admin (ashutosh9503) to delete groups

DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;

CREATE POLICY "Admins can delete groups" ON public.groups
    FOR DELETE USING (
        -- 1. Creator
        created_by = auth.uid()
        OR
        -- 2. Group Admin
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
        OR
        -- 3. System Admin (ashutosh9503)
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.username = 'ashutosh9503'
        )
    );

-- 2. CONVERSATIONS DELETION
-- Enable RLS (if not enabled, though usually it is for sensitive tables)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Allow members to delete conversations
-- Note: This deletes the conversation for everyone. 
-- Ideally, a 'leave' or 'hide' feature is better, but 'delete' implies removal.
DROP POLICY IF EXISTS "Members can delete conversations" ON public.conversations;

CREATE POLICY "Members can delete conversations" ON public.conversations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_id = id
            AND user_id = auth.uid()
        )
    );
