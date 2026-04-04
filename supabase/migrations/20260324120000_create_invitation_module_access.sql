-- Create invitation_module_access table to store module access selections during invitation
CREATE TABLE IF NOT EXISTS public.invitation_module_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id uuid NOT NULL REFERENCES public.user_invitations(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast lookup by invitation_id
CREATE INDEX IF NOT EXISTS idx_invitation_module_access_invitation_id
  ON public.invitation_module_access(invitation_id);

-- Enable RLS
ALTER TABLE public.invitation_module_access ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can manage invitation module access for their company
CREATE POLICY "Users can manage invitation module access"
  ON public.invitation_module_access
  FOR ALL
  USING (true)
  WITH CHECK (true);
