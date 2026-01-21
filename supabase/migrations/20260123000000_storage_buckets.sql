
-- Chat Media Bucket
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('chat-media', 'chat-media', true) 
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Policies for chat-media bucket
DROP POLICY IF EXISTS "Chat media is publicly accessible" ON storage.objects;
CREATE POLICY "Chat media is publicly accessible" ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-media' );

DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat media" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'chat-media' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;
CREATE POLICY "Users can delete their own chat media" ON storage.objects FOR DELETE
USING ( bucket_id = 'chat-media' AND auth.uid() = owner );
