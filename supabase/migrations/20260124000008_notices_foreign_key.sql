-- Add foreign key to allow joining notices with profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'notices_created_by_profiles_fk' 
        AND table_name = 'notices'
    ) THEN
        ALTER TABLE public.notices
        ADD CONSTRAINT notices_created_by_profiles_fk
        FOREIGN KEY (created_by)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
    END IF;
END $$;
