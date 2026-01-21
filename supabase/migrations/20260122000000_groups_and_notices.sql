-- Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    avatar_url text,
    is_private boolean DEFAULT false,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at timestamptz DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Group Messages Table
CREATE TABLE IF NOT EXISTS public.group_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text,
    media_url text,
    media_type text CHECK (media_type IN ('image', 'video')),
    created_at timestamptz DEFAULT now()
);

-- Notices Table
CREATE TABLE IF NOT EXISTS public.notices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    type text NOT NULL CHECK (type IN ('urgent', 'event', 'academic', 'general')),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Group Policies
DROP POLICY IF EXISTS "Groups are viewable by everyone" ON public.groups;
CREATE POLICY "Groups are viewable by everyone" ON public.groups
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;
CREATE POLICY "Group admins can update groups" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_id = id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Group Members Policies
DROP POLICY IF EXISTS "Group members are viewable by everyone" ON public.group_members;
CREATE POLICY "Group members are viewable by everyone" ON public.group_members
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join public groups" ON public.group_members;
CREATE POLICY "Users can join public groups" ON public.group_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND (
            EXISTS (
                SELECT 1 FROM public.groups
                WHERE id = group_id
                AND is_private = false
            )
        )
    );

-- Group Messages Policies
DROP POLICY IF EXISTS "Group members can view messages" ON public.group_messages;
CREATE POLICY "Group members can view messages" ON public.group_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_id = public.group_messages.group_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
CREATE POLICY "Group members can send messages" ON public.group_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_id = public.group_messages.group_id
            AND user_id = auth.uid()
        )
    );

-- Notices Policies
DROP POLICY IF EXISTS "Notices are viewable by everyone" ON public.notices;
CREATE POLICY "Notices are viewable by everyone" ON public.notices
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create notices" ON public.notices;
CREATE POLICY "Authenticated users can create notices" ON public.notices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Realtime
-- Realtime
DO $$
BEGIN
    -- Check if group_messages is already in the publication
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'group_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
    END IF;

    -- Check if notices is already in the publication
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'notices'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;
    END IF;
END $$;
