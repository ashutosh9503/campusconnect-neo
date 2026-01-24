-- Ensure all necessary columns exist for events table
DO $$
BEGIN
    -- Add type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'type') THEN
        ALTER TABLE public.events ADD COLUMN type text DEFAULT 'general';
    END IF;

    -- Add location column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location') THEN
        ALTER TABLE public.events ADD COLUMN location text;
    END IF;

    -- Add description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'description') THEN
        ALTER TABLE public.events ADD COLUMN description text;
    END IF;
END $$;
