-- Fix security loophole allowing users to join private groups without invite
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Manage group members" ON public.group_members;

-- Create stricter policy
CREATE POLICY "Manage group members" ON public.group_members
    FOR INSERT WITH CHECK (
        -- Case 1: Admin adding someone else (Invite/Add)
        (
            EXISTS (
                SELECT 1 FROM public.group_members admins
                WHERE admins.group_id = public.group_members.group_id 
                AND admins.user_id = auth.uid() 
                AND admins.role = 'admin'
            )
        )
        OR
        -- Case 2: User joining themselves AND Group is public (NOT private)
        (
            auth.uid() = user_id AND
            EXISTS (
                SELECT 1 FROM public.groups
                WHERE id = public.group_members.group_id
                AND is_private = false
            )
        )
    );
