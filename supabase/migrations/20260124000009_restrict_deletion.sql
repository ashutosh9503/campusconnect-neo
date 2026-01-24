-- Revoke existing delete policies and create new strict ones

-- 1. NOTICES
DROP POLICY IF EXISTS "Admin and faculty can delete notices" ON public.notices;
DROP POLICY IF EXISTS "Creators can delete notices" ON public.notices; -- In case I added it previously

CREATE POLICY "Owners and SuperAdmin can delete notices" ON public.notices
    FOR DELETE USING (
        auth.uid() = created_by 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND username = 'ashutosh9503'
        )
    );

-- 2. POSTS
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

CREATE POLICY "Owners and SuperAdmin can delete posts" ON public.posts
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND username = 'ashutosh9503'
        )
    );

-- 3. EVENTS
DROP POLICY IF EXISTS "Creators can delete events" ON public.events;
-- Events table might not have had a specific delete policy or it was open/admin only.
-- Let's ensure strict policy.

CREATE POLICY "Owners and SuperAdmin can delete events" ON public.events
    FOR DELETE USING (
        auth.uid() = created_by 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND username = 'ashutosh9503'
        )
    );
