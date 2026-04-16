CREATE TABLE IF NOT EXISTS public.invitation_device_module_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id uuid NOT NULL REFERENCES public.user_invitations(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  module_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (invitation_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_invitation_device_module_access_invitation_id
  ON public.invitation_device_module_access(invitation_id);

ALTER TABLE public.invitation_device_module_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage invitation device module access"
  ON public.invitation_device_module_access
  FOR ALL
  USING (true)
  WITH CHECK (true);
