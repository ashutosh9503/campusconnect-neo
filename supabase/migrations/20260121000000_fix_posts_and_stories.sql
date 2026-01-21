-- Create post_media table
CREATE TABLE IF NOT EXISTS public.post_media (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    url text NOT NULL,
    type text NOT NULL CHECK (type IN ('image', 'video')),
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on post_media
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Post media viewable by everyone" ON public.post_media;
CREATE POLICY "Post media viewable by everyone" ON public.post_media
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert media for own posts" ON public.post_media;
CREATE POLICY "Users can insert media for own posts" ON public.post_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_media.post_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete media for own posts" ON public.post_media;
CREATE POLICY "Users can delete media for own posts" ON public.post_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_media.post_id
            AND user_id = auth.uid()
        )
    );

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    media_url text NOT NULL,
    media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stories viewable by everyone" ON public.stories;
CREATE POLICY "Stories viewable by everyone" ON public.stories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own stories" ON public.stories;
CREATE POLICY "Users can insert own stories" ON public.stories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
CREATE POLICY "Users can delete own stories" ON public.stories
    FOR DELETE USING (auth.uid() = user_id);

-- Create story_views table
CREATE TABLE IF NOT EXISTS public.story_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(story_id, user_id)
);

-- Enable RLS on story_views
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Story views viewable by story owner" ON public.story_views;
CREATE POLICY "Story views viewable by story owner" ON public.story_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE id = story_views.story_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own views" ON public.story_views;
CREATE POLICY "Users can insert own views" ON public.story_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add seen column to messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'seen') THEN
        ALTER TABLE public.messages ADD COLUMN seen boolean DEFAULT false;
    END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    source_id uuid, -- link to post, message, etc.
    seen boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Storage buckets setup
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('stories', 'stories', true) 
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('posts-media', 'posts-media', true) 
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Stories bucket policies
DROP POLICY IF EXISTS "Stories are publicly accessible" ON storage.objects;
CREATE POLICY "Stories are publicly accessible" ON storage.objects FOR SELECT
USING ( bucket_id = 'stories' );

DROP POLICY IF EXISTS "Users can upload their own stories" ON storage.objects;
CREATE POLICY "Users can upload their own stories" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can delete their own stories" ON storage.objects;
CREATE POLICY "Users can delete their own stories" ON storage.objects FOR DELETE
USING ( bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Posts media bucket policies
DROP POLICY IF EXISTS "Post media is publicly accessible" ON storage.objects;
CREATE POLICY "Post media is publicly accessible" ON storage.objects FOR SELECT
USING ( bucket_id = 'posts-media' );

DROP POLICY IF EXISTS "Users can upload post media" ON storage.objects;
CREATE POLICY "Users can upload post media" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'posts-media' AND auth.uid()::text = (storage.foldername(name))[1] );
