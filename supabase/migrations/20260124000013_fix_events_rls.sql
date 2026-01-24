-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete any event" ON public.events;

-- Policy: Events are viewable by everyone
CREATE POLICY "Events are viewable by everyone"
ON public.events FOR SELECT
USING (true);

-- Policy: Users can create events
CREATE POLICY "Users can create events"
ON public.events FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own events
CREATE POLICY "Users can update their own events"
ON public.events FOR UPDATE
USING (auth.uid() = created_by);

-- Policy: Users can delete their own events
-- AND Admins (ashutosh9503) can delete any event
-- valid admin check requires joining profiles, but for performance/simplicity in this specific request context
-- we'll rely on a subquery or just the creator rule + a specific rule for the hardcoded admin if we knew the ID.
-- Since we don't know the UUID of 'ashutosh9503' reliably here without querying, 
-- we will use a subquery to check if the current user has that username.

CREATE POLICY "Users can delete their own events"
ON public.events FOR DELETE
USING (
  auth.uid() = created_by 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.username = 'ashutosh9503'
  )
);
