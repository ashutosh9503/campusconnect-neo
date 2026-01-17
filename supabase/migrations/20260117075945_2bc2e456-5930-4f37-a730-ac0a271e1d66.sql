-- Add missing columns to notifications table for the hook
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS actor_id UUID,
ADD COLUMN IF NOT EXISTS post_id UUID,
ADD COLUMN IF NOT EXISTS message_id UUID;

-- Rename is_read to read for hook compatibility
ALTER TABLE public.notifications RENAME COLUMN is_read TO read;