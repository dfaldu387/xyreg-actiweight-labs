-- Password Change Log table for 21 CFR Part 11 compliance
-- Tracks when users change their passwords to enforce expiration policies

CREATE TABLE IF NOT EXISTS public.password_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by user (most recent change)
CREATE INDEX idx_password_change_log_user_id ON public.password_change_log(user_id, changed_at DESC);

-- Enable RLS
ALTER TABLE public.password_change_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own password change history
CREATE POLICY "Users can view own password changes"
  ON public.password_change_log
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own password change records
CREATE POLICY "Users can record own password changes"
  ON public.password_change_log
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Seed existing users with their created_at as initial password change entry
-- This prevents all existing users from being immediately expired
INSERT INTO public.password_change_log (user_id, changed_at, change_source)
SELECT id, created_at, 'initial_seed'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.password_change_log);

COMMENT ON TABLE public.password_change_log IS 'Tracks password changes for expiration policy enforcement (21 CFR Part 11)';
COMMENT ON COLUMN public.password_change_log.change_source IS 'Source of change: manual, forgot_password, expiry_forced, initial_seed';
