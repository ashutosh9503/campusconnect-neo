-- Drop Triggers
DROP TRIGGER IF EXISTS on_message_push ON public.messages;
DROP TRIGGER IF EXISTS on_notice_push ON public.notices;
DROP TRIGGER IF EXISTS on_call_push ON public.calls;

-- Drop Functions
DROP FUNCTION IF EXISTS public.handle_new_message_push;
DROP FUNCTION IF EXISTS public.handle_new_notice_push;
DROP FUNCTION IF EXISTS public.handle_new_call_push;

-- Drop Table
DROP TABLE IF EXISTS public.device_tokens CASCADE;
