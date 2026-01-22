-- Add social_links column to profiles table
alter table public.profiles
add column if not exists social_links jsonb default '{}'::jsonb;

-- Update RLS if needed (usually profiles are public read, owner update)
-- Existing policies should cover update if it's just a column addition, assuming "Users can update own profile" policy exists.
