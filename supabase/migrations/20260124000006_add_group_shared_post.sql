-- Add shared_post_id to group_messages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_messages' AND column_name = 'shared_post_id') THEN
        ALTER TABLE public.group_messages ADD COLUMN shared_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;
    END IF;
END $$;
