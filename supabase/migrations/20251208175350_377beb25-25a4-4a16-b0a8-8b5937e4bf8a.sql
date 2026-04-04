-- Create investor_monitor_access table for managing continuous monitoring access requests
CREATE TABLE public.investor_monitor_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_profile_id UUID NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
  share_settings_id UUID NOT NULL REFERENCES public.company_investor_share_settings(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'revoked')),
  request_message TEXT,
  founder_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(investor_profile_id, share_settings_id)
);

-- Enable RLS
ALTER TABLE public.investor_monitor_access ENABLE ROW LEVEL SECURITY;

-- Investors can view their own access records
CREATE POLICY "Investors can view their own access records"
ON public.investor_monitor_access
FOR SELECT
USING (
  investor_profile_id IN (
    SELECT id FROM public.investor_profiles WHERE user_id = auth.uid()
  )
);

-- Investors can insert (request) access
CREATE POLICY "Investors can request access"
ON public.investor_monitor_access
FOR INSERT
WITH CHECK (
  investor_profile_id IN (
    SELECT id FROM public.investor_profiles WHERE user_id = auth.uid()
  )
);

-- Company members can view access requests for their company
CREATE POLICY "Company members can view access requests"
ON public.investor_monitor_access
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  )
);

-- Company members can update (approve/deny) access requests
CREATE POLICY "Company members can manage access requests"
ON public.investor_monitor_access
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_investor_monitor_access_investor ON public.investor_monitor_access(investor_profile_id);
CREATE INDEX idx_investor_monitor_access_company ON public.investor_monitor_access(company_id);
CREATE INDEX idx_investor_monitor_access_status ON public.investor_monitor_access(status);
CREATE INDEX idx_investor_monitor_access_share_settings ON public.investor_monitor_access(share_settings_id);

-- Add updated_at trigger
CREATE TRIGGER update_investor_monitor_access_updated_at
BEFORE UPDATE ON public.investor_monitor_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();