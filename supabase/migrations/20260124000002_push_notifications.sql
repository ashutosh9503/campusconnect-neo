-- Create device_tokens table
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token text NOT NULL,
    platform text DEFAULT 'web',
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, token)
);

-- RLS Policies
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tokens"
    ON public.device_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
    ON public.device_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
    ON public.device_tokens FOR DELETE
    USING (auth.uid() = user_id);

-- Create Function to send webhooks to Edge Function (for push notifications)
-- Note: This requires the pg_net extension usually, or we can use the http extension if available.
-- However, for Supabase, the best practice is usually to let the Edge Function listen to the database changes via Supabase Realtime 
-- OR trigger a webhook.
-- But Supabase Database Webhooks are a specific feature.
-- Here, we will define the triggers, but the actual HTTP call might need `pg_net` or `supabase_functions` extension.
-- Since I cannot guarantee extensions, I will rely on the "Database Webhooks" feature of Supabase Dashboard OR 
-- implement the trigger to insert into a queue table if direct HTTP isn't possible from SQL easily without setup.
-- BUT the user instructions said: "Each trigger calls HTTP function endpoint."
-- Assuming `pg_net` is available or we use `supabase_functions.http_request` if available.
-- A common pattern is `select net.http_post(...)`.

-- Let's create the triggers to call the Edge Function.
-- Replace PROJECT_REF with the actual project reference if known, otherwise we might need a placeholder.
-- or use a generic Trigger function that assumes an extension exists.

-- Actually, a safer layout for this requested architecture without assuming extensions is:
-- The USER will have to sets up the Database Webhook in the Dashboard.
-- OR I can create a table `push_queue` and have the Edge Function poll it or be triggered by it.
-- BUT the prompt specifically asked for: "Each trigger calls HTTP function endpoint."
-- I'll define the function assuming `net` extension is enabled (standard on Supabase).

CREATE EXTENSION IF NOT EXISTS "pg_net";

CREATE OR REPLACE FUNCTION public.handle_new_message_push()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the edge function
    -- For local dev, this might fail if not properly routed, but for prod it works.
    -- We'll just log it for now if we can't ensure the endpoint.
    -- Ideally, we use `net.http_post`.
    
    -- Payload
    PERFORM net.http_post(
        url := current_setting('app.settings.edge_function_url', true) || '/push-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
        body := json_build_object(
            'type', 'message',
            'record', row_to_json(NEW)
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_notice_push()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM net.http_post(
        url := current_setting('app.settings.edge_function_url', true) || '/push-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
        body := json_build_object(
            'type', 'notice',
            'record', row_to_json(NEW)
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_call_push()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM net.http_post(
        url := current_setting('app.settings.edge_function_url', true) || '/push-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
        body := json_build_object(
            'type', 'call',
            'record', row_to_json(NEW)
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS on_message_push ON public.messages;
CREATE TRIGGER on_message_push
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message_push();

DROP TRIGGER IF EXISTS on_notice_push ON public.notices;
CREATE TRIGGER on_notice_push
    AFTER INSERT ON public.notices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_notice_push();

DROP TRIGGER IF EXISTS on_call_push ON public.calls;
CREATE TRIGGER on_call_push
    AFTER INSERT ON public.calls
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_call_push();
