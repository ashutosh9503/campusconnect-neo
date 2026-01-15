-- Add missing index
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);