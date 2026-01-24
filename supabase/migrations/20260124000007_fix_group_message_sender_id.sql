DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_messages' AND column_name = 'sender_id') THEN
        ALTER TABLE public.group_messages RENAME COLUMN sender_id TO user_id;
    END IF;
END $$;
