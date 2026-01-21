-- Update role check constraint to include 'moderator'
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_role_check;
ALTER TABLE public.group_members ADD CONSTRAINT group_members_role_check CHECK (role IN ('admin', 'moderator', 'member'));

-- Policy for INSERT on group_members
DROP POLICY IF EXISTS "Users can join public groups" ON public.group_members;

CREATE POLICY "Manage group members insert" ON public.group_members
    FOR INSERT WITH CHECK (
        -- 1. Self-join public group
        (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND is_private = false))
        OR
        -- 2. Creator joining (as admin)
        (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid()))
        OR
        -- 3. Admin/Moderator adding others
        EXISTS (
            SELECT 1 FROM public.group_members existing
            WHERE existing.group_id = group_id
            AND existing.user_id = auth.uid()
            AND existing.role IN ('admin', 'moderator')
        )
    );

-- Policy for DELETE on group_members
-- (Note: "Group members are viewable by everyone" is already there for SELECT)

CREATE POLICY "Manage group members delete" ON public.group_members
    FOR DELETE USING (
        -- 1. Leave group (remove self)
        auth.uid() = user_id
        OR
        -- 2. Admin/Moderator removing others
        EXISTS (
            SELECT 1 FROM public.group_members existing
            WHERE existing.group_id = group_members.group_id
            AND existing.user_id = auth.uid()
            AND existing.role IN ('admin', 'moderator')
        )
    );

-- Policy for DELETE on groups (only admin)
CREATE POLICY "Admins can delete groups" ON public.groups
    FOR DELETE USING (
        created_by = auth.uid() -- Simple check: Creator can delete
        OR
        EXISTS ( -- Or admin
            SELECT 1 FROM public.group_members
            WHERE group_id = id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );
