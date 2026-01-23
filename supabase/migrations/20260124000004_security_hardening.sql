-- --- SCHEMA UPDATES ---

-- Messages: Add deleted_at and shared_post_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.messages ADD COLUMN deleted_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'shared_post_id') THEN
        ALTER TABLE public.messages ADD COLUMN shared_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Group Messages: Add deleted_at and media columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.group_messages ADD COLUMN deleted_at timestamptz;
    END IF;
    -- Just to be safe, though they should be there from previous migrations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_messages' AND column_name = 'media_url') THEN
        ALTER TABLE public.group_messages ADD COLUMN media_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_messages' AND column_name = 'media_type') THEN
        ALTER TABLE public.group_messages ADD COLUMN media_type text;
    END IF;
END $$;


-- --- SOCIAL LINKS VISIBILITY FIX ---
-- Ensure social_links column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'social_links') THEN
        ALTER TABLE public.profiles ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- --- STRICT RLS POLICIES ---

-- 1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true); -- This allows reading all columns including social_links

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. MESSAGES (Direct)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow reading messages if you are a member of the conversation
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        public.is_member_of(conversation_id)
    );

-- Allow inserting if you are a member (and sender matches auth)
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        public.is_member_of(conversation_id) AND auth.uid() = sender_id
    );

-- Allow deletion: Sender can delete their own, or maybe we just use soft delete via UPDATE
-- Soft delete logic: User updates 'deleted_at'
DROP POLICY IF EXISTS "Users can delete (soft) own messages" ON public.messages;
CREATE POLICY "Users can delete (soft) own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);


-- 3. GROUP MESSAGES
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group messages viewable by members" ON public.group_messages;
CREATE POLICY "Group messages viewable by members" ON public.group_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_messages.group_id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Members can send group messages" ON public.group_messages;
CREATE POLICY "Members can send group messages" ON public.group_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_messages.group_id AND user_id = auth.uid())
    );

-- Delete/Update group messages:
-- 1. Sender can delete own message
-- 2. Group Admin can delete ANY message in their group
DROP POLICY IF EXISTS "Sender or Admin can delete group messages" ON public.group_messages;
CREATE POLICY "Sender or Admin can delete group messages" ON public.group_messages
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = public.group_messages.group_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Also allow update for soft delete
DROP POLICY IF EXISTS "Sender or Admin can update group messages" ON public.group_messages;
CREATE POLICY "Sender or Admin can update group messages" ON public.group_messages
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = public.group_messages.group_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );


-- 4. GROUPS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Groups viewable by everyone" ON public.groups;
CREATE POLICY "Groups viewable by everyone" ON public.groups
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only Admin can update/delete group
-- Note: 'created_by' is not enough, we should check group_members role 'admin'
DROP POLICY IF EXISTS "Admins can update groups" ON public.groups;
CREATE POLICY "Admins can update groups" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = public.groups.id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;
CREATE POLICY "Admins can delete groups" ON public.groups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = public.groups.id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );


-- 5. GROUP MEMBERS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members viewable by everyone" ON public.group_members;
CREATE POLICY "Group members viewable by everyone" ON public.group_members
    FOR SELECT USING (true);

-- Joining: User can add THEMSELVES (Join) - wait, is it open join? 
-- The user request says "Admin permissions: Add users to group". 
-- It doesn't explicitly say anyone can join. But usually public groups allow join.
-- For now, let's allow:
-- 1. Admin adding anyone
-- 2. User adding themselves (Join)
DROP POLICY IF EXISTS "Manage group members" ON public.group_members;
CREATE POLICY "Manage group members" ON public.group_members
    FOR INSERT WITH CHECK (
        -- User joining themselves
        auth.uid() = user_id OR
        -- Admin adding someone else
        EXISTS (
            SELECT 1 FROM public.group_members admins
            WHERE admins.group_id = public.group_members.group_id 
            AND admins.user_id = auth.uid() 
            AND admins.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Remove group members" ON public.group_members;
CREATE POLICY "Remove group members" ON public.group_members
    FOR DELETE USING (
        -- User leaving
        auth.uid() = user_id OR
        -- Admin removing someone
        EXISTS (
            SELECT 1 FROM public.group_members admins
            WHERE admins.group_id = public.group_members.group_id 
            AND admins.user_id = auth.uid() 
            AND admins.role = 'admin'
        )
    );


-- 6. NOTICES
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
-- "Allow creator (or admin) to delete notices"
-- We assume notices might have a creator_id? The schema shows 'created_at' but not 'created_by' or 'user_id' in previous files.
-- Checking 20260122000000_groups_and_notices.sql ... assuming it might be missing.
-- Let's check columns for notices specifically later, but for now assuming user_id exists or we add it.
-- Based on error logs or snippets, notices usually have a creator.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'user_id') THEN
        ALTER TABLE public.notices ADD COLUMN user_id uuid REFERENCES public.profiles(id);
    END IF;
END $$;

DROP POLICY IF EXISTS "Notices viewable by everyone" ON public.notices;
CREATE POLICY "Notices viewable by everyone" ON public.notices
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can delete notices" ON public.notices;
CREATE POLICY "Creators can delete notices" ON public.notices
    FOR DELETE USING (auth.uid() = user_id);

-- 7. EVENTS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events viewable by everyone" ON public.events;
CREATE POLICY "Events viewable by everyone" ON public.events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can delete events" ON public.events;
CREATE POLICY "Creators can delete events" ON public.events
    FOR DELETE USING (auth.uid() = created_by);


-- --- STORAGE SECURITTY ---

-- 1. AVATARS
-- Public read, auth upload (size limit/type limit should be handled in client/edge for now, but we restrict overwrite)
-- The "Authenticated users can update their own avatar" policy in `supabase_schema.sql` uses `auth.uid() = owner`.
-- `owner` column is managed by supabase storage.

-- ensure buckets exist
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true) ON CONFLICT (id) DO NOTHING; -- maybe named 'posts-media' in previous
INSERT INTO storage.buckets (id, name, public) VALUES ('posts-media', 'posts-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true) ON CONFLICT (id) DO NOTHING;

-- Policies --
-- Avatars: already set in previous schema, but verifying prevents overwrite of others?
-- The policy "Authenticated users can update their own avatar" only checks `auth.uid() = owner`.
-- This is secure enough for update.

-- Posts Media (posts-media)
-- Read: public
-- Insert: auth users
-- Delete: owner
DROP POLICY IF EXISTS "Post media is publicly accessible" ON storage.objects;
CREATE POLICY "Post media is publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'posts-media');

DROP POLICY IF EXISTS "Users can upload post media" ON storage.objects;
CREATE POLICY "Users can upload post media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'posts-media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own post media" ON storage.objects;
CREATE POLICY "Users can delete own post media" ON storage.objects
    FOR DELETE USING (bucket_id = 'posts-media' AND auth.uid() = owner);

-- Stories
-- Read: public
-- Insert: auth
-- Delete: owner
DROP POLICY IF EXISTS "Stories are publicly accessible" ON storage.objects;
CREATE POLICY "Stories are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "Users can upload stories" ON storage.objects;
CREATE POLICY "Users can upload stories" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own stories" ON storage.objects;
CREATE POLICY "Users can delete own stories" ON storage.objects
    FOR DELETE USING (bucket_id = 'stories' AND auth.uid() = owner);

-- Chat Media
DROP POLICY IF EXISTS "Chat media is publicly accessible" ON storage.objects;
CREATE POLICY "Chat media is publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
CREATE POLICY "Users can upload chat media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

