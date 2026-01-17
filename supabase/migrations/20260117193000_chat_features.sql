-- Add media columns to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text;

-- Add deleted column for soft deletes if not exists
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Add storage policy for chat media (using stories bucket for now or create new)
-- Let's check if 'chat-media' exists, if not create it
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-media
DROP POLICY IF EXISTS "Chat media viewable by everyone" ON storage.objects;
CREATE POLICY "Chat media viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

-- Update RLS for messages to allow update (for soft delete)
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);
