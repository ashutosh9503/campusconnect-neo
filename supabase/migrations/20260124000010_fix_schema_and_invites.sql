-- 1. Fix Events Schema: Add event_time
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_time') THEN
        ALTER TABLE public.events ADD COLUMN event_time text;
    END IF;
END $$;

-- 2. Group Invites: Add status column to group_members
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'status') THEN
        ALTER TABLE public.group_members ADD COLUMN status text DEFAULT 'joined' CHECK (status IN ('joined', 'pending', 'invited'));
    END IF;
END $$;

-- 3. Policy: Update group_members view policy to allow users to see their own pending invites
-- Existing policy "Group members are viewable by everyone" covers SELECT, but we might want to be specific about actions.
-- Let's ensure users can UPDATE their own membership status (to accept invite).

DROP POLICY IF EXISTS "Users can update own membership status" ON public.group_members;
CREATE POLICY "Users can update own membership status" ON public.group_members
    FOR UPDATE USING (auth.uid() = user_id);

-- Ensure users can see groups they are invited to (already covered by "Group members are viewable by everyone" usually, 
-- but we need to ensure they can see the GROUP details too).

-- "Groups are viewable by everyone" is likely active, which is fine for public groups. 
-- For private groups, we need to ensure invited members can see them.
-- Check existing policy "Groups are viewable by everyone" (if it exists and users true, we are good).
-- If not, we need a policy for invited members.

DROP POLICY IF EXISTS "Invited members can view private groups" ON public.groups;
CREATE POLICY "Invited members can view private groups" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_id = id
            AND user_id = auth.uid()
        )
    );
