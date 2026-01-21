-- Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    actor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('message', 'call', 'like', 'comment', 'follow', 'system')),
    title text,
    content text,
    reference_id uuid, -- Link to post_id, message_id etc
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Authors (or system) can insert notifications
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true); -- Usually restricted but needed for interaction

-- Fix Notices Table if needed (Ensure created_by exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notices'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.notices ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable Realtime for Notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;
